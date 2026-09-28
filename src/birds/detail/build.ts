import * as THREE from 'three'
import { defaultPose, type BirdModel, type BirdParts, type PoseState } from '../model'
import type { SpeciesSpec } from '../spec'
import { createProfile, type Profile } from './profile'
import { Mesher } from './mesher'
import { buildLoft, RADIAL, type LoftResult } from './loft'
import { buildBill, buildEyes, buildShield, type BillResult } from './bill'
import { buildFoldedWings, buildSpreadWings, shoulderAt } from './wing'
import { buildTail } from './tail'
import { buildLegs, legLayout, DEFAULT_STEP, type LegLayout } from './legs'
import { createBones, chainBones, type Joints, type NeckBone } from './rig'
import { legOffsets, solveLeg, smooth, STANCE } from './gait'
import { neckSwing, firstRoot, headPitchToGround } from './reach'
import type { DetailSpec } from './spec'

type NeckShapes = NonNullable<DetailSpec['neckShapes']>
import { buildCurl } from './extras'
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
  /** every labelled station's spine point, and the spine itself (101 points, tail to bill base), for the viewer */
  stations: { label: string; position: THREE.Vector3 }[]
  spine: THREE.Vector3[]
  /** index ranges of the closed sub-meshes (loft, bill, and a shield if the bird has one), for volume checks */
  closed: { name: string; indexFirst: number; indexCount: number }[]
  /** a frontal shield's midline: where it leaves the top of the bill's base, and its top; null without one */
  shield: { base: THREE.Vector3; top: THREE.Vector3 } | null
  /** the version-only parts: where each leaves the body and its highest point, at rest, and whether this bird shows it */
  parts: { kind: string; base: THREE.Vector3; top: THREE.Vector3; shown: boolean }[]
}

export interface DetailedBirdModel extends BirdModel {
  mesh: THREE.SkinnedMesh
  anatomy: Anatomy
  profile: Profile
  layout: LegLayout
}

/** bone scale that hides a part: a skinned mesh cannot hide a piece of itself */
const HIDDEN = 1e-4
/** how far a swimmer's leg swings each way in a paddle stroke, radians: the tibia about the hip, the tarsus about the joint */
const PADDLE_SWING = 0.5

export function buildDetailedBird(spec: SpeciesSpec, variant?: string): DetailedBirdModel {
  const detail = spec.detail
  if (!detail) throw new Error(`${spec.code}: no detail block`)
  const swimming = spec.posture === 'swimming'
  if (!swimming && spec.posture !== 'standing') throw new Error(`${spec.code}: the detailed builder builds standing and swimming birds only (posture ${spec.posture})`)
  if (swimming && !detail.float) throw new Error(`${spec.code}: a swimming bird needs detail.float, its waterline`)
  if (variant && !(variant in spec.variants)) throw new Error(`${spec.code}: unknown variant ${variant}`)
  const profile = createProfile(detail.profile)
  const layout = legLayout(detail, profile, swimming)

  const m = new Mesher()
  const tailless = detail.tail.shape === 'none'
  const loft: LoftResult = buildLoft(m, profile, detail.rig, tailless)
  const bill: BillResult = buildBill(m, detail, profile)
  const shield = buildShield(m, detail, profile)
  buildEyes(m, detail, profile)
  const fold = buildFoldedWings(m, detail)
  const shoulder = shoulderAt(detail, profile)
  buildSpreadWings(m, detail, shoulder)
  const tail = buildTail(m, detail, profile)
  const feet = buildLegs(m, layout, { kind: detail.feet, lobeWidth: detail.lobeWidth })
  // built on every bird of the species; shown only on the versions that have them
  const extras = (detail.parts ?? []).map(p => ({ ...buildCurl(m, p, profile), shown: !!variant && p.versions.includes(variant) }))

  // profile frame -> group space. Standing: hips over the origin, feet on y = 0. Swimming: the traced waterline on
  // y = 0, and the middle of the body at the water (midway between where the water meets it at the stern and at the
  // breast, in the side view) over the origin, where it pivots
  let offset: THREE.Vector3
  if (swimming) {
    const wl = detail.float!.waterline
    const span = m.spanAtHeight(wl, loft.indexFirst, loft.indexCount)
    if (!span) throw new Error(`${spec.code}: the waterline (y = ${wl} m) misses the body`)
    offset = new THREE.Vector3(-(span[0] + span[1]) / 2, -wl, 0)
  } else offset = new THREE.Vector3(-layout.hip.x, layout.standHeight + layout.footY - layout.hip.y, 0)
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
  // a quarter of the way up from the belly to the hips: inside the body and under the water.
  const pivot = swimming ? new THREE.Vector3() : hipMid
  const legsAt = swimming ? at(new THREE.Vector3(layout.hip.x, layout.bellyY + 0.25 * (layout.hip.y - layout.bellyY), 0)) : hipMid
  const joints: Joints = {
    root: pivot.clone(), body: pivot.clone(), legs: legsAt.clone(),
    neck: spineAt(detail.rig.neckBase), neckMid: spineAt(detail.rig.neckMid), head: spineAt(detail.rig.head),
    bill: at(bill.base), tail: at(tail.root),
    wingFoldR: at(fold.wrist), wingFoldL: mirror(at(fold.wrist)),
    wingR: at(shoulder), wingL: mirror(at(shoulder)),
    tibiaR: hipR, tarsusR: kneeR, toesR: footR,
    tibiaL: mirror(hipR), tarsusL: mirror(kneeR), toesL: mirror(footR),
    curl: extras[0] ? at(extras[0].base) : pivot.clone(),
    ...neckJoints,
  }
  const { bones, list } = createBones(joints)

  const geometry = m.geometry()
  const mesh = new THREE.SkinnedMesh(geometry, materialFor(spec, variant))
  mesh.name = 'skin'
  mesh.castShadow = true
  const group = new THREE.Group()
  group.name = `bird:${spec.code}${variant ? ':' + variant : ''}`
  group.add(bones.root, mesh)
  group.updateMatrixWorld(true)
  mesh.bind(new THREE.Skeleton(list))
  // a version-only part stays hidden on the versions without it (set after binding, so the bind pose is the whole bird)
  bones.curl.scale.setScalar(extras[0]?.shown ? 1 : HIDDEN)

  const parts: BirdParts = {
    body: bones.body, neck: bones.neck, head: bones.head, bill: bones.bill,
    wingL: bones.wingL, wingR: bones.wingR, tail: bones.tail, legs: bones.legs,
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
    head: headVerts,
    stations: detail.profile.flatMap(s => (s.label ? [{ label: s.label, position: spineAt(s.label) }] : [])),
    spine: Array.from({ length: 101 }, (_, k) => at(profile.sampleAt(k / 100).point)),
    closed: [
      { name: 'loft', indexFirst: loft.indexFirst, indexCount: loft.indexCount },
      { name: 'bill', indexFirst: bill.indexFirst, indexCount: bill.indexCount },
      ...(shield ? [{ name: 'shield', indexFirst: shield.indexFirst, indexCount: shield.indexCount }] : []),
      ...feet,
      ...extras.map(e => ({ name: e.kind, indexFirst: e.indexFirst, indexCount: e.indexCount })),
    ],
    shield: shield && { base: at(shield.base), top: at(shield.top) },
    parts: extras.map(e => ({ kind: e.kind, base: at(e.base), top: at(e.top), shown: e.shown })),
  }

  // rest angles of each leg, for turning IK solutions into bone rotations
  const hip2 = { x: hipR.x, y: hipR.y }
  const alpha0 = Math.atan2(kneeR.y - hipR.y, kneeR.x - hipR.x)
  const beta0 = Math.atan2(footR.y - kneeR.y, footR.x - kneeR.x)
  const stepLength = (detail.stepLength ?? DEFAULT_STEP) * (layout.tibia + layout.tarsus)
  const lift = layout.tarsus * 0.25
  // Every walk starts from the stride phase that has the stance foot straight under the hip and the other foot
  // mid-swing above it: re-anchored while the bird stands, so easing into a stride never slides a planted foot.
  const neutral = (STANCE / 2) * 2 * stepLength
  let anchor = 0
  const headRest = bones.head.position.clone()
  const neckMidRest = bones.neckMid.position.clone()
  const bodyLength = profile.length
  // for the reach: the bill tip from the head joint (the head bone carries no rotation at rest), and that line's
  // angle off the bill's own
  const headToTip = at(bill.tip).sub(joints.head)
  const tipReach = Math.hypot(headToTip.x, headToTip.y)
  const tipOffAxis = Math.atan2(headToTip.y, headToTip.x) - Math.atan2(bill.dir.y, bill.dir.x)
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
    const { joint, foot } = solveLeg(hip2, { x: footR.x + dx, y: footR.y + dy }, layout.tibia, layout.tarsus)
    const alpha = Math.atan2(joint.y - hip2.y, joint.x - hip2.x)
    const beta = Math.atan2(foot.y - joint.y, foot.x - joint.x)
    tibia.rotation.z = alpha - alpha0
    tarsus.rotation.z = (beta - beta0) - (alpha - alpha0)
    toes.rotation.z = -(beta - beta0)
  }

  const legsRest = bones.legs.position.clone()

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
   * A chained neck, bent into its shapes: neckExtend blends each joint's bend from the hunch (0) through the trace (0.5)
   * to erect (1), and a reach blends it on toward the strike, then swings the whole neck about its base just far
   * enough for the bill to reach its mark and tips the head onto it, as reachDown does for a neck of two joints. The
   * joints only turn, so the neck keeps its length.
   */
  function poseChain(st: PoseState, names: readonly (NeckBone | 'head')[], shapes: NeckShapes) {
    const e = THREE.MathUtils.clamp(st.neckExtend, 0, 1)
    const reach = THREE.MathUtils.clamp(st.reach, 0, 1)
    const w = smooth(reach)
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

  function pose(st: PoseState) {
    // lean.x pitches the nose down, lean.z rolls; the body pivots over the hips (a swimmer's on the water, mid-body)
    bones.body.rotation.set(st.lean.z, 0, -st.lean.x)
    if (chainNames) poseChain(st, chainNames, detail!.neckShapes!)
    else poseNeck(st)
    // positive raises the bill: the head turns last, after the neck's shape and any reach
    bones.head.rotation.z += st.headPitch
    // positive lifts the tail (the tail points back, so that is a clockwise turn in the side view)
    bones.tail.rotation.z = -st.tailTilt
    // wings: folded shell at rest, the spread planform once the wings open
    const spread = THREE.MathUtils.clamp(st.wingSpread, 0, 1)
    const open = spread > 0.05
    for (const b of [bones.wingFoldL, bones.wingFoldR]) b.scale.setScalar(open ? HIDDEN : 1)
    for (const b of [bones.wingL, bones.wingR]) b.scale.setScalar(open ? 1 : HIDDEN)
    const flap = Math.sin(st.wingPhase * Math.PI * 2) * 0.9 * spread
    bones.wingL.rotation.x = flap
    bones.wingR.rotation.x = -flap
    // legs
    if (swimming) { paddleLegs(st); return }
    if (THREE.MathUtils.clamp(st.gait, 0, 1) < 0.02) anchor = neutral - st.strideDistance
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

  return {
    group, parts, pose, center, mesh, anatomy, profile, layout,
    radius: Math.max(size.x, size.y) * 0.5,
    dispose() { geometry.dispose() },
  }
}
