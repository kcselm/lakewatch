import * as THREE from 'three'
import { defaultPose, type BirdModel, type BirdParts, type PoseState } from '../model'
import type { SpeciesSpec } from '../spec'
import { createProfile, type Profile } from './profile'
import { Mesher } from './mesher'
import { buildLoft, RADIAL, type LoftResult } from './loft'
import { buildBill, buildEyes, buildPouch, buildShield, type BillResult } from './bill'
import { buildFoldedWings, buildSpreadWings, buildFlightWings, shoulderAt, wingFrame, wingTurn } from './wing'
import { buildTail } from './tail'
import { buildLegs, legLayout, DEFAULT_STEP, SWIM_TIBIA, SWIM_TARSUS, type LegLayout } from './legs'
import { createBones, chainBones, FAN_BONES, NECK_BONES, type Joints, type NeckBone } from './rig'
import { legOffsets, solveLeg, smooth, STANCE } from './gait'
import { neckSwing, firstRoot, headPitchToGround } from './reach'
import type { DetailSpec } from './spec'

type NeckShapes = NonNullable<DetailSpec['neckShapes']>
import { buildCurl, buildPlume, buildCrest, type PartSpec, type PartResult, type CrestResult } from './extras'
import { fishProp, FISH_GRIP, FISH_HOLD } from './fish'
import { materialFor } from '../paint/painter'

/** Key points of the built bird in group space at rest pose, for measurement and the viewer. */
export interface Anatomy {
  billBase: THREE.Vector3
  billTip: THREE.Vector3
  /** unit direction of the bill at its base, and its up normal */
  billDir: THREE.Vector3
  billUp: THREE.Vector3
  /** the bill's cross-section where it leaves the forehead */
  billBaseRing: THREE.Vector3[]
  tailRoot: THREE.Vector3
  tailTip: THREE.Vector3
  wrist: THREE.Vector3
  wingTip: THREE.Vector3
  hip: THREE.Vector3
  knee: THREE.Vector3
  foot: THREE.Vector3
  bellyY: number
  /** the lowest point of the body (the loft) and of the folded wing, at rest */
  bodyLowY: number
  wingLowY: number
  /** the highest point of the back, behind the neck base, at rest */
  backTopY: number
  /** the frontmost point of the body (the loft from the tail to the neck base) lower than the neck base: the breast, at rest */
  breastFront: THREE.Vector3
  /** where the plane y = 0 (a swimmer's waterline) cuts the body in the side view: its rear and front x; 0, 0 if it misses */
  waterline: { back: number; front: number }
  /** skin vertices from the occiput forward (the head) */
  head: THREE.Vector3[]
  /** how many rings the skin is lofted from: its first rings × RADIAL vertices are the loft's, ring by ring */
  rings: number
  /** every labelled station's spine point, and the spine itself (101 points, tail to bill base), for the viewer */
  stations: { label: string; position: THREE.Vector3 }[]
  spine: THREE.Vector3[]
  /** index ranges of the closed sub-meshes (loft, bill, and a shield if the bird has one), for volume checks */
  closed: { name: string; indexFirst: number; indexCount: number }[]
  /** a frontal shield's midline: where it leaves the top of the bill's base, and its top; null without one */
  shield: { base: THREE.Vector3; top: THREE.Vector3 } | null
  /** a pouch under the bill: its vertices in the mesh's geometry; null without one */
  pouch: { first: number; count: number } | null
  /** a flight wing: both wings' vertices in the mesh's geometry, and the right wing's wrist and tip at rest; null without one */
  flightWing: { first: number; count: number; wrist: THREE.Vector3; tip: THREE.Vector3 } | null
  /** the version-only parts: where each leaves the body and its highest point, at rest, and whether this bird shows it */
  parts: { kind: string; base: THREE.Vector3; top: THREE.Vector3; shown: boolean }[]
}

export interface DetailedBirdModel extends BirdModel {
  mesh: THREE.SkinnedMesh
  anatomy: Anatomy
  profile: Profile
  layout: LegLayout
  spec: SpeciesSpec
  /** what it shares with every bird of its species; a twin is built from it */
  built: Built
  /** the fish it holds in its bill when PoseState.fish says so, hung from the bill bone; null for a bird that holds none */
  fish: THREE.Mesh | null
}

/** bone scale that hides a part: a skinned mesh cannot hide a piece of itself */
const HIDDEN = 1e-4
/** the wingSpread at and below which the folded wing shows in place of the spread one */
export const SWAP = 0.05
/**
 * A perched bird's legs folded up in flight (PoseState.legsUp 1): where each foot goes, from its hip, as fractions of
 * the leg's reach back along the body and of the hip's height over the belly up from the belly; and how far the toes
 * turn back from their grip, radians (clockwise in the side view, the bird facing +x). By eye, so that the feet lie
 * against the belly feathers with the toes trailing back, as a small bird's do once it is away.
 */
const TUCK_BACK = 0.55
const TUCK_UP = 0.35
const TUCK_TOES = -2.4
const Z_AXIS = new THREE.Vector3(0, 0, 1)
/**
 * A wing that folds keeps its shape until it is this far closed (0 open .. 1 closed), and its feathers then gather
 * onto the folded wing's place. By eye, on the test flier drawn through its fold: gathering from half-way, the arm's
 * trailing edge, turned up by the twist, stood in a tent over the back for the middle of the fold
 */
export const GATHER_FROM = 0.2
/** how far a swimmer's leg swings each way in a paddle stroke, radians: the tibia about the hip, the tarsus about the joint */
const PADDLE_SWING = 0.5
/**
 * An amphibious bird's legs, hidden afloat, grow to their full size over this much of afloat's way from 1 toward 0, so
 * nothing jumps as they appear: still folded, under the water, as the bird starts to wade
 */
const LEGS_OUT = 0.25

/**
 * What every bird of a species shares, whatever its version: its mesh, where its joints sit, and its anatomy at rest.
 * A version-only part is built on every bird, and each bird's own bones show or hide it.
 */
export interface Built {
  profile: Profile; layout: LegLayout; geometry: THREE.BufferGeometry; joints: Joints; anatomy: Anatomy
  /** a fanning tail: the axis its columns turn about, group space (the tail's up), and each one's turn at the full fan, radians */
  fan: { axis: THREE.Vector3; turns: number[] } | null
  /** an amphibious bird's root offset standing: hips over the origin, feet on y = 0 */
  ashore: THREE.Vector3
}

/** a version-only part, or the crest, on the mesher */
function buildPart(m: Mesher, p: PartSpec, profile: Profile): PartResult | CrestResult {
  switch (p.kind) {
    case 'curl': return buildCurl(m, p, profile)
    case 'plume': return buildPlume(m, p, profile)
    case 'crest': return buildCrest(m, p, profile)
  }
}

function construct(spec: SpeciesSpec): Built {
  const detail = spec.detail
  if (!detail) throw new Error(`${spec.code}: no detail block`)
  const swimming = spec.posture === 'swimming', perched = spec.posture === 'perched'
  if (swimming && !detail.float) throw new Error(`${spec.code}: a swimming bird needs detail.float, its waterline`)
  if (perched && !detail.perch) throw new Error(`${spec.code}: a perched bird needs detail.perch, the branch its toes curl round`)
  // a swimmer that also stands: built floating, its legs built standing; `afloat` takes it from the one to the other
  const amphibious = swimming && !!detail.amphibious
  const profile = createProfile(detail.profile)
  const layout = legLayout(detail, profile, amphibious ? 'standing' : spec.posture)

  const m = new Mesher()
  const tailless = detail.tail.shape === 'none'
  const loft: LoftResult = buildLoft(m, profile, detail.rig, tailless, detail.rings)
  const bill: BillResult = buildBill(m, detail, profile)
  const shield = buildShield(m, detail, profile)
  const pouch = buildPouch(m, detail, profile)
  buildEyes(m, detail, profile)
  const fold = buildFoldedWings(m, detail)
  const shoulder = shoulderAt(detail, profile)
  const flightWing = detail.flight ? buildFlightWings(m, detail, shoulder) : null
  if (!flightWing) buildSpreadWings(m, detail, shoulder)
  const tail = buildTail(m, detail, profile)
  const feet = buildLegs(m, layout, { kind: detail.feet, lobeWidth: detail.lobeWidth })
  // built on every bird of the species; each bird shows only the ones its version has
  const extras = (detail.parts ?? []).map(p => buildPart(m, p, profile))
  const extra = (kind: string) => extras.find(e => e.kind === kind)
  const crest = extra('crest') as CrestResult | undefined

  // profile frame -> group space. Standing: hips over the origin, feet on y = 0. Perched: the same, the feet on the
  // branch's top (their perch point), which is under the hips. Swimming: the traced waterline on y = 0, and the middle
  // of the body at the water (midway between where the water meets it at the stern and at the breast, in the side
  // view) over the origin, where it pivots
  let offset: THREE.Vector3
  if (swimming) {
    const wl = detail.float!.waterline
    const span = m.spanAtHeight(wl, loft.indexFirst, loft.indexCount)
    if (!span) throw new Error(`${spec.code}: the waterline (y = ${wl} m) misses the body`)
    offset = new THREE.Vector3(-(span[0] + span[1]) / 2, -wl, 0)
  } else offset = new THREE.Vector3(-layout.hip.x, layout.standHeight + layout.footY - layout.hip.y, 0)
  // An amphibious bird is built floating. Standing, its root moves by `ashore`, which puts its hips over the origin and
  // its feet on y = 0, exactly where a standing build of the same bird puts them.
  const ashore = new THREE.Vector3(-layout.hip.x, layout.standHeight + layout.footY - layout.hip.y, 0).sub(offset)
  m.translate(offset)
  const at = (v: THREE.Vector3 | THREE.Vector2) => new THREE.Vector3(v.x, v.y, 'z' in v ? v.z : 0).add(offset)
  const spineAt = (label: string) => at(profile.sampleAt(profile.uOf(label)).point)
  const mirror = (v: THREE.Vector3) => new THREE.Vector3(v.x, v.y, -v.z)
  // A chained neck's joints sit at its labels, and the joints it doesn't use at its last joint before the head, with no
  // length. An unchained neck's spare joints sit at neckMid, so the head hangs from them exactly as it did from neckMid.
  const chain = detail.rig.neck
  const chainNames = chain ? chainBones(chain.length) : null
  const spare = spineAt(chain ? chain[chain.length - 2]! : detail.rig.neckMid)
  const neckJoints = { neck3: spare.clone(), neck4: spare.clone(), neck5: spare.clone(), neck6: spare.clone() }
  chain?.forEach((label, i) => {
    const b = chainNames![i]!
    if (b in neckJoints) neckJoints[b as keyof typeof neckJoints] = spineAt(label)
  })

  // no tail: its tip is the rearmost point of the body, which the tail bone moves
  let tailTip = at(tail.tip)
  if (tailless) {
    for (let i = loft.first; i < loft.first + loft.count; i++) if (m.position(i).x < tailTip.x) tailTip = m.position(i)
  }
  const hipMid = at(layout.hip).setZ(0)
  const hipR = at(layout.hip), kneeR = at(layout.knee), footR = at(layout.foot)
  // A swimmer's body pivots at the origin, on the water under the middle of the body. Its legs gather, when hidden,
  // a quarter of the way up from the belly to the hips: inside the body and under the water. A percher's body pivots
  // between its feet, and its legs hang from there, so it leans over its branch and never off it.
  const footMid = at(layout.foot).setZ(0)
  const pivot = swimming ? new THREE.Vector3() : perched ? footMid : hipMid
  // the neck's base joint: on the spine, or rig.neckBaseDepth of the way down its section toward the throat side
  const neckBase = profile.sampleAt(profile.uOf(detail.rig.neckBase))
  const neckJoint = at(neckBase.point.clone().addScaledVector(neckBase.axis, -(detail.rig.neckBaseDepth ?? 0) * neckBase.down))
  const legsAt = swimming ? at(new THREE.Vector3(layout.hip.x, layout.bellyY + 0.25 * (layout.hip.y - layout.bellyY), 0)) : perched ? footMid : hipMid
  const joints: Joints = {
    root: pivot.clone(), body: pivot.clone(), legs: legsAt.clone(),
    neck: neckJoint, neckMid: spineAt(detail.rig.neckMid), head: spineAt(detail.rig.head),
    bill: at(bill.base), tail: at(tail.root),
    wingFoldR: at(fold.wrist), wingFoldL: mirror(at(fold.wrist)),
    wingR: at(shoulder), wingL: mirror(at(shoulder)),
    // without a flight wing the hands sit on the shoulders, with no length and no skin
    handR: at(flightWing?.wrist ?? shoulder), handL: mirror(at(flightWing?.wrist ?? shoulder)),
    tibiaR: hipR, tarsusR: kneeR, toesR: footR,
    tibiaL: mirror(hipR), tarsusL: mirror(kneeR), toesL: mirror(footR),
    curl: extra('curl') ? at(extra('curl')!.base) : pivot.clone(),
    plume: extra('plume') ? at(extra('plume')!.base) : spineAt(detail.rig.head),
    // without a crest its bones sit on the head joint, with no skin; each lobe's turns about its own base
    crest: crest ? at(crest.lobes[0]) : spineAt(detail.rig.head),
    crestBack: crest ? at(crest.lobes[1]) : spineAt(detail.rig.head),
    // a fanning tail's columns turn about their roots; any other tail's fan bones sit on the tail's root, with no skin
    ...fanJoints(tail.fan?.roots.map(at) ?? null, at(tail.root)),
    ...neckJoints,
  }
  const headStart = profile.uOf('occiput')
  const neckStart = profile.uOf(detail.rig.neckBase), neckY = spineAt(detail.rig.neckBase).y
  const headVerts: THREE.Vector3[] = []
  let bodyLowY = Infinity, backTopY = -Infinity
  const breastFront = new THREE.Vector3(-Infinity, 0, 0)
  loft.ringU.forEach((u, i) => {
    for (let j = 0; j < RADIAL; j++) {
      const p = m.position(loft.first + i * RADIAL + j)
      bodyLowY = Math.min(bodyLowY, p.y)
      if (u <= neckStart) backTopY = Math.max(backTopY, p.y)
      if (u <= neckStart && p.y < neckY && p.x > breastFront.x) breastFront.copy(p)
    }
    if (u < headStart) return
    for (let j = 0; j < RADIAL; j++) headVerts.push(m.position(loft.first + i * RADIAL + j))
  })
  const water = m.spanAtHeight(0, loft.indexFirst, loft.indexCount) ?? [0, 0]
  const anatomy: Anatomy = {
    billBase: at(bill.base), billTip: at(bill.tip), billDir: bill.dir.clone(), billUp: bill.up.clone(),
    billBaseRing: bill.baseRing.map(v => v.clone().add(offset)),
    tailRoot: at(tail.root), tailTip,
    wrist: at(fold.wrist), wingTip: at(fold.tip),
    hip: hipR, knee: kneeR, foot: footR, bellyY: layout.bellyY + offset.y,
    bodyLowY, wingLowY: fold.low + offset.y, backTopY, breastFront, waterline: { back: water[0], front: water[1] },
    head: headVerts, rings: loft.ringU.length,
    stations: detail.profile.flatMap(s => (s.label ? [{ label: s.label, position: spineAt(s.label) }] : [])),
    spine: Array.from({ length: 101 }, (_, k) => at(profile.sampleAt(k / 100).point)),
    closed: [
      { name: 'loft', indexFirst: loft.indexFirst, indexCount: loft.indexCount },
      { name: 'bill', indexFirst: bill.indexFirst, indexCount: bill.indexCount },
      ...(shield ? [{ name: 'shield', indexFirst: shield.indexFirst, indexCount: shield.indexCount }] : []),
      ...(pouch ? [{ name: 'pouch', indexFirst: pouch.indexFirst, indexCount: pouch.indexCount }] : []),
      ...feet,
      ...extras.map(e => ({ name: e.kind, indexFirst: e.indexFirst, indexCount: e.indexCount })),
    ],
    shield: shield && { base: at(shield.base), top: at(shield.top) },
    pouch: pouch && { first: pouch.first, count: pouch.count },
    flightWing: flightWing && { first: flightWing.first, count: flightWing.count, wrist: at(flightWing.wrist), tip: at(flightWing.tip) },
    parts: extras.map(e => ({ kind: e.kind, base: at(e.base), top: at(e.top), shown: false })),
  }
  const fan = tail.fan && { axis: tail.fan.axis.clone(), turns: tail.fan.turns }
  return { profile, layout, geometry: m.geometry(), joints, anatomy, fan, ashore }
}

/** the fan bones' joints: each at its column's root, or all on the tail's root */
function fanJoints(roots: THREE.Vector3[] | null, root: THREE.Vector3): Record<Exclude<(typeof FAN_BONES)[number], 'tail'>, THREE.Vector3> {
  const out = {} as Record<Exclude<(typeof FAN_BONES)[number], 'tail'>, THREE.Vector3>
  FAN_BONES.forEach((name, j) => { if (name !== 'tail') out[name] = roots ? roots[j]!.clone() : root.clone() })
  return out
}

/**
 * A detailed bird of a species, in one of its versions. With a `twin` (another bird of the same species, of any
 * version), it shares the twin's mesh and builds only its own bones: a flock's birds cost one mesh between them.
 */
export function buildDetailedBird(spec: SpeciesSpec, variant?: string, twin?: DetailedBirdModel): DetailedBirdModel {
  const detail = spec.detail
  if (!detail) throw new Error(`${spec.code}: no detail block`)
  if (variant && !(variant in spec.variants)) throw new Error(`${spec.code}: unknown variant ${variant}`)
  if (twin && twin.spec !== spec) throw new Error(`${spec.code}: a twin must be a bird of the same species`)
  const built = twin ? twin.built : construct(spec)
  const { profile, layout, geometry, joints, ashore } = built
  const swimming = spec.posture === 'swimming', perched = spec.posture === 'perched'
  const amphibious = swimming && !!detail.amphibious
  // a part that names its versions shows on those only; a crest that names none is on every bird of its species
  const shown = (kind: string) => {
    const part = detail.parts?.find(p => p.kind === kind)
    if (!part) return false
    return part.versions ? !!variant && part.versions.includes(variant) : true
  }
  const anatomy: Anatomy = { ...built.anatomy, parts: built.anatomy.parts.map(e => ({ ...e, shown: shown(e.kind) })) }
  const { pouch, flightWing } = anatomy
  const chainNames = detail.rig.neck ? chainBones(detail.rig.neck.length) : null
  const hipR = anatomy.hip, kneeR = anatomy.knee, footR = anatomy.foot
  const hipMid = hipR.clone().setZ(0)
  const spineAt = (label: string) => anatomy.stations.find(s => s.label === label)!.position.clone()
  const chain = detail.rig.neck
  const { bones, list } = createBones(joints)

  const mesh = new THREE.SkinnedMesh(geometry, materialFor(spec, variant))
  mesh.name = 'skin'
  // the morph targets this bird's geometry carries, by name
  const pouchMorph = mesh.morphTargetDictionary?.pouch, foldMorph = mesh.morphTargetDictionary?.fold
  mesh.castShadow = true
  const group = new THREE.Group()
  group.name = `bird:${spec.code}${variant ? ':' + variant : ''}`
  group.add(bones.root, mesh)
  group.updateMatrixWorld(true)
  mesh.bind(new THREE.Skeleton(list))
  // a version-only part stays hidden on the versions without it (set after binding, so the bind pose is the whole bird)
  bones.curl.scale.setScalar(shown('curl') ? 1 : HIDDEN)
  bones.plume.scale.setScalar(shown('plume') ? 1 : HIDDEN)
  for (const b of [bones.crest, bones.crestBack]) b.scale.setScalar(shown('crest') ? 1 : HIDDEN)
  const crestRaise = THREE.MathUtils.degToRad(detail.parts?.find(p => p.kind === 'crest')?.raise ?? 0)
  const fanBones = FAN_BONES.filter(n => n !== 'tail').map(n => bones[n])
  const fanTurns = built.fan?.turns.filter((_, j) => FAN_BONES[j] !== 'tail') ?? null

  const parts: BirdParts = {
    body: bones.body, neck: bones.neck, head: bones.head, bill: bones.bill,
    wingL: bones.wingL, wingR: bones.wingR, tail: bones.tail, legs: bones.legs,
  }


  // rest angles of each leg, for turning IK solutions into bone rotations
  const hip2 = { x: hipR.x, y: hipR.y }
  const alpha0 = Math.atan2(kneeR.y - hipR.y, kneeR.x - hipR.x)
  const beta0 = Math.atan2(footR.y - kneeR.y, footR.x - kneeR.x)
  const stepLength = (detail.stepLength ?? DEFAULT_STEP) * (layout.tibia + layout.tarsus)
  const lift = layout.tarsus * 0.25
  /** how far a walk rolls the body toward the planted foot, radians */
  const waddle = THREE.MathUtils.degToRad(detail.waddle ?? 0)
  // Every walk starts from the stride phase that has the stance foot straight under the hip and the other foot
  // mid-swing above it: re-anchored while the bird stands, so easing into a stride never slides a planted foot.
  const neutral = (STANCE / 2) * 2 * stepLength
  let anchor = 0
  const headRest = bones.head.position.clone()
  const neckMidRest = bones.neckMid.position.clone()
  // a chained neck's joints past its base: where each sits from the joint before as traced, and its stretch, the spine
  // between their stations (the base joint may sit off the spine, rig.neckBaseDepth, but the neck lengthens along it)
  const stretch = detail.neckStretch ?? 1, reachStretch = detail.reachStretch ?? 1
  const chainRest = (chainNames ?? []).slice(1).map((n, i) => [
    n, bones[n].position.clone(), i === 0 ? spineAt(chain![1]!).sub(spineAt(chain![0]!)) : bones[n].position.clone(),
  ] as const)
  const bodyLength = profile.length
  // for the reach: the bill tip from the head joint (the head bone carries no rotation at rest), and that line's
  // angle off the bill's own
  const headToTip = anatomy.billTip.clone().sub(joints.head)
  const tipReach = Math.hypot(headToTip.x, headToTip.y)
  const tipOffAxis = Math.atan2(headToTip.y, headToTip.x) - Math.atan2(anatomy.billDir.y, anatomy.billDir.x)
  // a reach aims the bill tip below the ground by the species' probeDepth and the pose's reachDepth; the solvers aim at
  // y = 0, so they work in a frame raised by it
  const probeDepth = detail.probeDepth ?? 0
  const toGroup = new THREE.Matrix4()
  const pN = new THREE.Vector3(), pM = new THREE.Vector3(), pH = new THREE.Vector3(), pT = new THREE.Vector3()
  const inGroup = (b: THREE.Bone, out: THREE.Vector3) => b.getWorldPosition(out).applyMatrix4(toGroup)

  /**
   * A peck or strike reaching down (`w` 0..1), moving no more of the bird than it needs: the head tips the bill down,
   * and only if a bill pointing as steeply as it may (`reachAngle` below level; straight down for every peck) still
   * can't reach its mark (`depth` below the ground or water, y = 0 in group space) does the neck swing forward and down,
   * just far enough for it to (or as far as MAX_NECK_SWING allows). Then the head tips the bill onto the mark: back up
   * if a deep lean would push it further, and never steeper than `reachAngle`, where it stops short if the mark is out
   * of reach.
   */
  function reachDown(w: number, depth: number, reachAngle: number) {
    // where the head-to-tip line points when the bill itself points reachAngle below level
    const floor = -reachAngle + tipOffAxis
    group.updateMatrixWorld(true)
    toGroup.copy(group.matrixWorld).invert()
    inGroup(bones.neck, pN); inGroup(bones.neckMid, pM); inGroup(bones.head, pH)
    const swing = neckSwing({
      base: { x: pN.x, y: pN.y + depth },
      l1: Math.hypot(pM.x - pN.x, pM.y - pN.y), a1: Math.atan2(pM.y - pN.y, pM.x - pN.x),
      l2: Math.hypot(pH.x - pM.x, pH.y - pM.y), a2: Math.atan2(pH.y - pM.y, pH.x - pM.x),
      reach: tipReach, tipAngle: floor,
    })
    bones.neck.rotation.z -= (w * swing) / 2
    bones.neckMid.rotation.z = -(w * swing) / 2
    group.updateMatrixWorld(true)
    inGroup(bones.head, pH)
    pT.copy(headToTip).applyMatrix4(bones.head.matrixWorld).applyMatrix4(toGroup)
    // the bill never past straight down, even part-way through a reach, when the swing alone can tip it over
    const tipLine = Math.atan2(pT.y - pH.y, pT.x - pH.x)
    const pitch = headPitchToGround({ x: pH.x, y: pH.y + depth }, { x: pT.x, y: pT.y + depth }, floor)
    bones.head.rotation.z -= Math.min(w * pitch, tipLine - floor)
  }

  function setLeg(tibia: THREE.Bone, tarsus: THREE.Bone, toes: THREE.Bone, dx: number, dy: number) {
    ;[tibia.rotation.z, tarsus.rotation.z, toes.rotation.z] = legTurns(dx, dy)
  }

  const legsRest = bones.legs.position.clone()

  /** The leg bones' turns that put a foot at (dx, dy) from where it stands: tibia, tarsus, and toes, which stay level. */
  function legTurns(dx: number, dy: number): [number, number, number] {
    const { joint, foot } = solveLeg(hip2, { x: footR.x + dx, y: footR.y + dy }, layout.tibia, layout.tarsus)
    const alpha = Math.atan2(joint.y - hip2.y, joint.x - hip2.x)
    const beta = Math.atan2(foot.y - joint.y, foot.x - joint.x)
    return [alpha - alpha0, (beta - beta0) - (alpha - alpha0), -(beta - beta0)]
  }

  // An amphibious bird's legs folded as a swimmer's are built: the tibia straight down, the tarsus and the toes trailing
  // back in line with it (the toes turned from lying along the ground)
  const FOLD: [number, number, number] = [SWIM_TIBIA - alpha0, (SWIM_TARSUS - beta0) - (SWIM_TIBIA - alpha0), beta0]
  const pivotAshore = hipMid.clone()
  const turned = new THREE.Vector3(), follow = new THREE.Quaternion()

  /**
   * An amphibious bird's root and body, before the neck reaches: at afloat 1 as built, floating; toward 0 the root rises
   * by `ashore` to its standing height, and the body's turns pivot over the hips rather than on the water.
   */
  function standUp(a: number) {
    const s = 1 - a
    bones.root.position.copy(ashore).multiplyScalar(s)
    // the body turns about a point blended from its float pivot (the root) to over its hips: it sits where it turns that
    // point to, less the turn
    turned.copy(pivotAshore).multiplyScalar(s)
    bones.body.position.copy(turned).sub(turned.clone().applyQuaternion(bones.body.quaternion))
  }

  /**
   * An amphibious bird's legs: standing and walking by IK, as a standing bird's, at afloat 0; folded as a swimmer's
   * at 1, going wherever the body goes, and paddling; each bone's turn blended between the two.
   */
  function amphibiousLegs(st: PoseState, a: number) {
    const paddle = THREE.MathUtils.clamp(st.paddle, 0, 1)
    // hidden afloat, they unfold to their full size by LEGS_OUT of the way ashore, under the water
    bones.legs.scale.setScalar(paddle > 0 ? 1 : Math.max(HIDDEN, Math.min(1, (1 - a) / LEGS_OUT)))
    follow.identity().slerp(bones.body.quaternion, a)
    bones.legs.quaternion.copy(follow)
    turned.copy(legsRest).applyQuaternion(bones.body.quaternion).add(bones.body.position)
    bones.legs.position.copy(legsRest).lerp(turned, a)
    const { left, right } = legOffsets(st.strideDistance + anchor, st.gait, stepLength, lift)
    const stroke = paddle * PADDLE_SWING * Math.sin(st.paddlePhase * Math.PI * 2)
    for (const [leg, at, sign] of [[[bones.tibiaR, bones.tarsusR, bones.toesR], right, 1], [[bones.tibiaL, bones.tarsusL, bones.toesL], left, -1]] as const) {
      const stand = legTurns(at.x, at.y)
      const fold = [FOLD[0] + sign * stroke, FOLD[1] + sign * stroke, FOLD[2]]
      leg.forEach((b, k) => { b.rotation.z = stand[k]! * (1 - a) + fold[k]! * a })
    }
  }

  /**
   * How far a walk rolls the body toward the planted foot, radians (positive rolls it toward +z, the right foot): at a
   * full walk the species' waddle when a foot is mid-stance, once a step; nothing standing still, or afloat.
   */
  function waddleRoll(st: PoseState, a: number): number {
    const g = THREE.MathUtils.clamp(st.gait, 0, 1) * (1 - a)
    const phase = (((st.strideDistance + anchor) / (2 * stepLength)) % 1 + 1) % 1
    // the left foot (legOffsets' first) is mid-stance at STANCE / 2 of the stride, the right half a stride later
    return -waddle * g * Math.cos(2 * Math.PI * (phase - STANCE / 2))
  }

  /** A swimmer's legs: hidden at paddle 0; shown, folded back and going wherever the body goes, paddling alternately. */
  function paddleLegs(st: PoseState) {
    const paddle = THREE.MathUtils.clamp(st.paddle, 0, 1)
    bones.legs.scale.setScalar(paddle > 0 ? 1 : HIDDEN)
    // the legs hang from root, so a standing bird's feet stay planted while it leans; a swimmer's follow its body
    bones.legs.quaternion.copy(bones.body.quaternion)
    bones.legs.position.copy(legsRest).sub(bones.body.position).applyQuaternion(bones.body.quaternion).add(bones.body.position)
    const stroke = paddle * PADDLE_SWING * Math.sin(st.paddlePhase * Math.PI * 2)
    bones.tibiaR.rotation.z = stroke; bones.tarsusR.rotation.z = stroke
    bones.tibiaL.rotation.z = -stroke; bones.tarsusL.rotation.z = -stroke
  }

  /**
   * A percher's legs: they turn with the body about the pivot between the feet, so the hips stay on them however the
   * bird leans, and the toes turn back, so they keep their grip on the branch. The pivot lies on the line between the
   * feet, so a pitch (lean.x) leaves them exactly where they were; a roll (lean.z) tips each a little with the body.
   *
   * In flight (legsUp) each foot is drawn up and back under the belly, the leg folding as it goes, and its toes let go
   * of the branch and turn back with the body: at 1 the feet lie against the belly feathers, as TUCK_* has them.
   */
  function perchLegs(st: PoseState) {
    bones.legs.quaternion.copy(bones.body.quaternion)
    const up = THREE.MathUtils.clamp(st.legsUp, 0, 1)
    for (const toes of [bones.toesR, bones.toesL]) toes.quaternion.copy(bones.body.quaternion).invert()
    if (up === 0) {
      for (const b of [bones.tibiaR, bones.tarsusR, bones.tibiaL, bones.tarsusL]) b.rotation.set(0, 0, 0)
      return
    }
    const dx = up * (tuckFoot.x - footR.x), dy = up * (tuckFoot.y - footR.y)
    setLeg(bones.tibiaR, bones.tarsusR, bones.toesR, dx, dy)
    setLeg(bones.tibiaL, bones.tarsusL, bones.toesL, dx, dy)
    // setLeg keeps the toes as they stood; from the grip they turn toward the body's frame, and on back to trail
    for (const toes of [bones.toesR, bones.toesL]) {
      const kept = toeTurn.copy(toes.quaternion).multiply(toeBack.setFromAxisAngle(Z_AXIS, TUCK_TOES * up))
      toes.quaternion.copy(bones.body.quaternion).invert().slerp(kept, up)
    }
  }
  /** where a tucked foot goes, group space: back along the body and up under the belly from the hip */
  const tuckFoot = new THREE.Vector3(
    hipR.x - TUCK_BACK * (layout.tibia + layout.tarsus),
    anatomy.bellyY + TUCK_UP * (hipR.y - anatomy.bellyY), 0)
  const toeTurn = new THREE.Quaternion(), toeBack = new THREE.Quaternion()

  /**
   * A chained neck, bent into its shapes: neckExtend blends each joint's bend from the hunch (0) through the trace (0.5)
   * to erect (1), and a reach blends it on toward the strike, then swings the whole neck about its base just far
   * enough for the bill to reach its mark and tips the head onto it, as reachDown does for a neck of two joints. The
   * joints only turn, so the neck keeps its length, unless the species stretches it going erect (`neckStretch`) or
   * reaching (`reachStretch`).
   */
  function poseChain(st: PoseState, names: readonly (NeckBone | 'head')[], shapes: NeckShapes) {
    const e = THREE.MathUtils.clamp(st.neckExtend, 0, 1)
    const reach = THREE.MathUtils.clamp(st.reach, 0, 1)
    const w = smooth(reach)
    if (stretch !== 1 || reachStretch !== 1) {
      const k = Math.max(1 + (stretch - 1) * Math.max(0, (e - 0.5) / 0.5), 1 + (reachStretch - 1) * w)
      for (const [name, rest, along] of chainRest) bones[name].position.copy(rest).addScaledVector(along, k - 1)
    }
    names.forEach((name, i) => {
      const bend = e < 0.5 ? shapes.hunch[i]! * (1 - e / 0.5) : shapes.erect[i]! * ((e - 0.5) / 0.5)
      bones[name].rotation.z = THREE.MathUtils.degToRad(bend + (shapes.strike[i]! - bend) * w)
    })
    if (reach > 0) reachChain(w, probeDepth + st.reachDepth, THREE.MathUtils.clamp(st.reachAngle, 0, Math.PI / 2))
  }

  /** reachDown for a chained neck: the swing turns the base joint alone, so everything past it turns about the base. */
  function reachChain(w: number, depth: number, reachAngle: number) {
    const floor = -reachAngle + tipOffAxis
    group.updateMatrixWorld(true)
    toGroup.copy(group.matrixWorld).invert()
    inGroup(bones.neck, pN); inGroup(bones.head, pH)
    const vx = pH.x - pN.x, vy = pH.y - pN.y
    // the tip's lowest reach for a swing s: the head joint turned s about the base, the bill tipped as far as it may
    const swing = firstRoot(s => pN.y + depth - vx * Math.sin(s) + vy * Math.cos(s) + tipReach * Math.sin(floor))
    bones.neck.rotation.z -= w * swing
    group.updateMatrixWorld(true)
    inGroup(bones.head, pH)
    pT.copy(headToTip).applyMatrix4(bones.head.matrixWorld).applyMatrix4(toGroup)
    const tipLine = Math.atan2(pT.y - pH.y, pT.x - pH.x)
    const pitch = headPitchToGround({ x: pH.x, y: pH.y + depth }, { x: pT.x, y: pT.y + depth }, floor)
    bones.head.rotation.z -= Math.min(w * pitch, tipLine - floor)
  }

  /** A neck of two joints: 0.5 is the traced rest posture; it tucks and stretches, and reaches with reachDown. */
  function poseNeck(st: PoseState) {
    // Tucking draws the head down into the shoulders; extending lengthens the neck a little and tips it forward, so a
    // strike reaches out and down.
    const ext = THREE.MathUtils.clamp(st.neckExtend, 0, 1)
    const k = ext < 0.5 ? 0.6 + 0.8 * ext : 1 + 0.3 * (ext - 0.5)
    const tip = -0.5 * (ext - 0.5)
    bones.neck.rotation.z = tip
    bones.head.rotation.z = -tip                       // keeps the bill level relative to the body
    bones.neckMid.position.copy(neckMidRest).multiplyScalar(k)
    bones.head.position.copy(headRest).multiplyScalar(k)
    bones.head.position.x += st.headBob * bodyLength
    // the head pump's rise and fall: the head goes up half as far as it goes forward, and down as it draws back (a
    // coot's bill rises 2-3 cm as it thrusts about 5 cm forward)
    bones.head.position.y += 0.5 * st.headBob * bodyLength
    bones.neckMid.rotation.z = 0
    const reach = THREE.MathUtils.clamp(st.reach, 0, 1)
    if (reach > 0) reachDown(smooth(reach), probeDepth + st.reachDepth, THREE.MathUtils.clamp(st.reachAngle, 0, Math.PI / 2))
  }

  /**
   * A flight wing through its stroke: the inner wing swings about the shoulder either side of its lift, and the hand
   * about the wrist, behind it by its lag. wingStroke blends the beat toward a hover, whose inner wing also sweeps
   * forward as it comes down and back as it goes up. A glide holds the wing still at the glide's angles, swept as the
   * glide has it. Positive angles are up, and forward.
   *
   * Without a fold, the whole stroke grows with wingSpread from nothing. With one, the stroke eases off as the wing
   * closes, while the bones sweep and twist to their closed turns and the feathers gather onto the folded wing (the
   * 'fold' morph target), all of it complete at the swap, where the folded wing takes over from one that already lies
   * on it.
   */
  function flyWings(st: PoseState, spread: number) {
    const F = detail!.flight!
    const glide = THREE.MathUtils.clamp(st.glide, 0, 1)
    const phase = st.wingPhase * Math.PI * 2
    let beatS = F.beat.lift + F.beat.shoulder * Math.sin(phase)
    let beatH = F.beat.hand * Math.sin(phase - F.beat.lag * Math.PI * 2)
    let sweepS = 0, sweepH = 0, twistS = 0, twistH = 0
    const stroke = F.hover ? THREE.MathUtils.clamp(st.wingStroke, 0, 1) : 0
    if (stroke > 0) {
      const H = F.hover!
      beatS += (H.lift + H.shoulder * Math.sin(phase) - beatS) * stroke
      beatH += (H.hand * Math.sin(phase - H.lag * Math.PI * 2) - beatH) * stroke
      // furthest forward at the bottom of the stroke and back at the top
      sweepS = -H.sweep * Math.sin(phase) * stroke
    }
    if (F.glide.sweep) {
      sweepS += (F.glide.sweep.shoulder - sweepS) * glide
      sweepH += (F.glide.sweep.hand - sweepH) * glide
    }
    let open = spread
    if (F.fold) {
      const c = closed(spread)
      open = 1 - c
      sweepS = sweepS * open + F.fold.sweep.shoulder * c
      sweepH = sweepH * open + F.fold.sweep.hand * c
      twistS = F.fold.twist.shoulder * c
      twistH = F.fold.twist.hand * c
      mesh.morphTargetInfluences![foldMorph!] = gather(c)
    } else {
      sweepS *= spread
      sweepH *= spread
    }
    const rad = THREE.MathUtils.degToRad
    const shoulder = rad(beatS + (F.glide.shoulder - beatS) * glide) * open
    const hand = rad(beatH + (F.glide.hand - beatH) * glide) * open
    wingTurn(wingAxes!, rad(sweepS), shoulder, rad(twistS), 1, bones.wingR.quaternion)
    wingTurn(wingAxes!, rad(sweepS), shoulder, rad(twistS), -1, bones.wingL.quaternion)
    wingTurn(wingAxes!, rad(sweepH), hand, rad(twistH), 1, bones.handR.quaternion)
    wingTurn(wingAxes!, rad(sweepH), hand, rad(twistH), -1, bones.handL.quaternion)
  }
  /** the frame a flight wing turns in: the body's, at the shoulder */
  const wingAxes = detail.flight ? wingFrame(detail.flight) : null
  /** how far a wing that folds has closed, 0 open .. 1 closed, as wingSpread falls from 1 to the swap */
  const closed = (spread: number) => THREE.MathUtils.clamp((1 - spread) / (1 - SWAP), 0, 1)
  /**
   * how far its feathers have gathered onto the folded wing, as it closes: none until it is GATHER_FROM closed, so the
   * wing keeps its shape as it starts to sweep back, then all of it by the time it is closed
   */
  const gather = (c: number) => THREE.MathUtils.smoothstep(c, GATHER_FROM, 1)

  /**
   * The head turned `yaw` about the neck's axis: the line from the last neck joint before the head to the head joint,
   * as the neck is posed before the turn. Positive turns the bill to the bird's left.
   *
   * A real neck twists along its length, and a skin turned in one step where it meets the head creases there (a big
   * head on a short neck worst: the kingfisher's). So the neck's joints, from the base up, take the turn between them
   * in equal shares, each about the line from itself to the head joint, which leaves the head joint where it was; then
   * the head turns only what is left for it to end up turned exactly `yaw` about the neck's axis. The skin twists
   * along the whole neck, from where it leaves the body to the head.
   */
  function turnHead(yaw: number) {
    group.updateMatrixWorld(true)
    bones.head.getWorldPosition(pH)
    bones[yawNeck.at(-1)!].getWorldPosition(pN)
    axisTo(pH, pN, bones.head)
    const target = bones.head.getWorldQuaternion(headTurn).premultiply(yawTurn.setFromAxisAngle(neckAxis, yaw))
    for (const name of yawNeck) {
      group.updateMatrixWorld(true)
      bones[name].getWorldPosition(pN)
      if (pN.distanceToSquared(pH) < 1e-12) continue
      axisTo(pH, pN, bones[name])
      const local = neckAxis.applyQuaternion(bones[name].parent!.getWorldQuaternion(yawTurn).invert())
      bones[name].quaternion.premultiply(yawTurn.setFromAxisAngle(local, yaw / yawNeck.length))
    }
    group.updateMatrixWorld(true)
    bones.head.quaternion.copy(bones.head.parent!.getWorldQuaternion(yawTurn).invert().multiply(target))
  }
  /** neckAxis: the world direction from `from` to `to`; up the bone's parent if they coincide */
  function axisTo(to: THREE.Vector3, from: THREE.Vector3, b: THREE.Bone) {
    neckAxis.subVectors(to, from)
    if (neckAxis.lengthSq() < 1e-12) neckAxis.set(0, 1, 0).applyQuaternion(b.parent!.getWorldQuaternion(yawTurn))
    neckAxis.normalize()
  }
  /** the neck joints that share a headYaw, base to head: a chained neck's, or neck and neckMid */
  const yawNeck: readonly NeckBone[] = chainNames ? chainNames.slice(0, -1) as NeckBone[] : ['neck', 'neckMid']
  const neckAxis = new THREE.Vector3(), yawTurn = new THREE.Quaternion(), headTurn = new THREE.Quaternion()

  // The fish hangs from the bill bone, which carries no rotation at rest, so at rest its frame is the group's. It is
  // gripped FISH_HOLD of the culmen back from the tip, on the bill's axis: crosswise, its head to the bird's right and
  // its back up the bill's top, and turned about that top to lie head first along the bill, for the swallow.
  const fish = detail.fish ? fishProp(detail.fish.length) : null
  const fishAt = anatomy.billTip.clone().addScaledVector(anatomy.billDir, -FISH_HOLD * detail.measurements.culmen).sub(joints.bill)
  const billSide = anatomy.billDir.clone().cross(anatomy.billUp).normalize()
  const billTop = billSide.clone().cross(anatomy.billDir).normalize()
  const crosswise = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(billSide, billTop, billSide.clone().cross(billTop)))
  const fishGrip = new THREE.Vector3()

  /** The fish shown while it is held, crosswise (fishTurn 0) to lengthwise head first (1), its grip kept on the bill. */
  function holdFish(st: PoseState) {
    if (!fish) return
    fish.visible = st.fish >= 0.5
    if (!fish.visible) return
    // a quarter turn about the bill's top swings its head from the bird's right back toward the throat
    fish.quaternion.setFromAxisAngle(billTop, -(Math.PI / 2) * THREE.MathUtils.clamp(st.fishTurn, 0, 1)).multiply(crosswise)
    fish.position.copy(fishAt).sub(fishGrip.set(FISH_GRIP * detail!.fish!.length, 0, 0).applyQuaternion(fish.quaternion))
  }

  function pose(st: PoseState) {
    // an amphibious bird: 1 afloat, 0 on its feet (every other bird is as it was built)
    const a = amphibious ? THREE.MathUtils.clamp(st.afloat, 0, 1) : 1
    // the stride starts over from the neutral phase whenever the bird stands still
    if (THREE.MathUtils.clamp(st.gait, 0, 1) < 0.02) anchor = neutral - st.strideDistance
    // lean.x pitches the nose down, lean.z rolls, and a walk with a waddle rolls the body toward the planted foot; the
    // body pivots over the hips (a swimmer's on the water, mid-body; a percher's between its feet)
    bones.body.rotation.set(waddle > 0 && (!swimming || amphibious) ? st.lean.z + waddleRoll(st, swimming ? a : 0) : st.lean.z, 0, -st.lean.x)
    if (amphibious) standUp(a)
    // the neck sets only its joints' and the head's turns in the side view: clear any headYaw the last pose left
    for (const b of [...NECK_BONES, 'head'] as const) { bones[b].rotation.x = 0; bones[b].rotation.y = 0 }
    if (chainNames) poseChain(st, chainNames, detail!.neckShapes!)
    else poseNeck(st)
    // positive raises the bill: the head turns last, after the neck's shape and any reach
    bones.head.rotation.z += st.headPitch
    if (st.headYaw) turnHead(st.headYaw)
    // a pouch fills toward its full outline: the geometry's 'pouch' morph target
    if (pouch) mesh.morphTargetInfluences![pouchMorph!] = THREE.MathUtils.clamp(st.pouch, 0, 1)
    // positive lifts the tail (the tail points back, so that is a clockwise turn in the side view)
    bones.tail.rotation.z = -st.tailTilt
    // a fanning tail's columns each turn about the tail's up to their share of the fan
    if (fanTurns) {
      const w = THREE.MathUtils.clamp(st.tailSpread, 0, 1)
      fanBones.forEach((b, i) => b.quaternion.setFromAxisAngle(built.fan!.axis, fanTurns[i]! * w))
    }
    // a crest's lobes rise about their bases: a negative turn about +z lifts a line pointing back
    bones.crest.rotation.z = bones.crestBack.rotation.z = -crestRaise * THREE.MathUtils.clamp(st.crestRaise, 0, 1)
    holdFish(st)
    // wings: folded shell at rest, the spread planform once the wings open
    const spread = THREE.MathUtils.clamp(st.wingSpread, 0, 1)
    const open = spread > SWAP
    for (const b of [bones.wingFoldL, bones.wingFoldR]) b.scale.setScalar(open ? HIDDEN : 1)
    for (const b of [bones.wingL, bones.wingR]) b.scale.setScalar(open ? 1 : HIDDEN)
    if (flightWing) flyWings(st, spread)
    else {
      const flap = Math.sin(st.wingPhase * Math.PI * 2) * 0.9 * spread
      bones.wingL.rotation.x = flap
      bones.wingR.rotation.x = -flap
    }
    // legs
    if (amphibious) { amphibiousLegs(st, a); return }
    if (swimming) { paddleLegs(st); return }
    // a percher stays on its branch: it doesn't walk
    if (perched) { perchLegs(st); return }
    const { left, right } = legOffsets(st.strideDistance + anchor, st.gait, stepLength, lift)
    setLeg(bones.tibiaR, bones.tarsusR, bones.toesR, right.x, right.y)
    setLeg(bones.tibiaL, bones.tarsusL, bones.toesL, left.x, left.y)
  }
  pose(defaultPose())
  group.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(group, true)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  mesh.computeBoundingSphere()
  mesh.boundingSphere!.radius *= 1.3            // poses reach a little past the rest bounds
  // the fish goes on once the bounds are taken: they are the bird's own, and the fish is mostly hidden
  if (fish) bones.bill.add(fish)

  return {
    group, parts, pose, center, mesh, anatomy, profile, layout, spec, built, fish,
    radius: Math.max(size.x, size.y) * 0.5,
    // a twin's mesh is its twin's to dispose of
    dispose() { if (!twin) geometry.dispose() },
  }
}
