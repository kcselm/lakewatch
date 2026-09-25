import * as THREE from 'three'
import { defaultPose, type BirdModel, type BirdParts, type PoseState } from '../model'
import type { SpeciesSpec } from '../spec'
import { createProfile, type Profile } from './profile'
import { Mesher } from './mesher'
import { buildLoft, RADIAL, type LoftResult } from './loft'
import { buildBill, buildEyes, type BillResult } from './bill'
import { buildFoldedWings, buildSpreadWings, shoulderAt } from './wing'
import { buildTail } from './tail'
import { buildLegs, legLayout, DEFAULT_STEP, type LegLayout } from './legs'
import { createBones, type Joints } from './rig'
import { legOffsets, solveLeg, smooth, STANCE } from './gait'
import { neckSwing, headPitchToGround } from './reach'
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
  /** skin vertices from the occiput forward (the head) */
  head: THREE.Vector3[]
  /** every labelled station's spine point, and the spine itself (101 points, tail to bill base), for the viewer */
  stations: { label: string; position: THREE.Vector3 }[]
  spine: THREE.Vector3[]
  /** index ranges of the closed sub-meshes (loft, bill), for volume checks */
  closed: { name: string; indexFirst: number; indexCount: number }[]
}

export interface DetailedBirdModel extends BirdModel {
  mesh: THREE.SkinnedMesh
  anatomy: Anatomy
  profile: Profile
  layout: LegLayout
}

/** bone scale that hides a part: a skinned mesh cannot hide a piece of itself */
const HIDDEN = 1e-4

export function buildDetailedBird(spec: SpeciesSpec, variant?: string): DetailedBirdModel {
  const detail = spec.detail
  if (!detail) throw new Error(`${spec.code}: no detail block`)
  if (spec.posture !== 'standing') throw new Error(`${spec.code}: the detailed builder supports standing birds only (posture ${spec.posture})`)
  if (variant && !(variant in spec.variants)) throw new Error(`${spec.code}: unknown variant ${variant}`)
  const profile = createProfile(detail.profile)
  const layout = legLayout(detail, profile)

  const m = new Mesher()
  const loft: LoftResult = buildLoft(m, profile, detail.rig)
  const bill: BillResult = buildBill(m, detail, profile)
  buildEyes(m, detail, profile)
  const fold = buildFoldedWings(m, detail, profile)
  const shoulder = shoulderAt(detail, profile)
  buildSpreadWings(m, detail, shoulder)
  const tail = buildTail(m, detail, profile)
  buildLegs(m, layout)

  // profile frame -> group space: hips over the origin, feet on y = 0
  const offset = new THREE.Vector3(-layout.hip.x, layout.standHeight + layout.footY - layout.hip.y, 0)
  m.translate(offset)
  const at = (v: THREE.Vector3 | THREE.Vector2) => new THREE.Vector3(v.x, v.y, 'z' in v ? v.z : 0).add(offset)
  const spineAt = (label: string) => at(profile.sampleAt(profile.uOf(label)).point)
  const mirror = (v: THREE.Vector3) => new THREE.Vector3(v.x, v.y, -v.z)

  const hipMid = at(layout.hip).setZ(0)
  const hipR = at(layout.hip), kneeR = at(layout.knee), footR = at(layout.foot)
  const joints: Joints = {
    root: hipMid.clone(), body: hipMid.clone(), legs: hipMid.clone(),
    neck: spineAt(detail.rig.neckBase), neckMid: spineAt(detail.rig.neckMid), head: spineAt(detail.rig.head),
    bill: at(bill.base), tail: at(tail.root),
    wingFoldR: at(fold.wrist), wingFoldL: mirror(at(fold.wrist)),
    wingR: at(shoulder), wingL: mirror(at(shoulder)),
    tibiaR: hipR, tarsusR: kneeR, toesR: footR,
    tibiaL: mirror(hipR), tarsusL: mirror(kneeR), toesL: mirror(footR),
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

  const parts: BirdParts = {
    body: bones.body, neck: bones.neck, head: bones.head, bill: bones.bill,
    wingL: bones.wingL, wingR: bones.wingR, tail: bones.tail, legs: bones.legs,
  }

  const headStart = profile.uOf('occiput')
  const headVerts: THREE.Vector3[] = []
  loft.ringU.forEach((u, i) => {
    if (u < headStart) return
    for (let j = 0; j < RADIAL; j++) headVerts.push(m.position(loft.first + i * RADIAL + j))
  })
  const anatomy: Anatomy = {
    billBase: at(bill.base), billTip: at(bill.tip), billDir: bill.dir.clone(), billUp: bill.up.clone(),
    billBaseRing: bill.baseRing.map(v => v.clone().add(offset)),
    tailRoot: at(tail.root), tailTip: at(tail.tip),
    wrist: at(fold.wrist), wingTip: at(fold.tip),
    hip: hipR, knee: kneeR, foot: footR, bellyY: layout.bellyY + offset.y,
    head: headVerts,
    stations: detail.profile.flatMap(s => (s.label ? [{ label: s.label, position: spineAt(s.label) }] : [])),
    spine: Array.from({ length: 101 }, (_, k) => at(profile.sampleAt(k / 100).point)),
    closed: [
      { name: 'loft', indexFirst: loft.indexFirst, indexCount: loft.indexCount },
      { name: 'bill', indexFirst: bill.indexFirst, indexCount: bill.indexCount },
    ],
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
  // where the head-to-tip line points when the bill itself points straight down
  const floor = -Math.PI / 2 + tipOffAxis
  const toGroup = new THREE.Matrix4()
  const pN = new THREE.Vector3(), pM = new THREE.Vector3(), pH = new THREE.Vector3(), pT = new THREE.Vector3()
  const inGroup = (b: THREE.Bone, out: THREE.Vector3) => b.getWorldPosition(out).applyMatrix4(toGroup)

  /**
   * A peck or strike reaching down (`w` 0..1), moving no more of the bird than it needs: the head tips the bill down,
   * and only if a bill pointing straight down still can't reach the ground (y = 0 in group space) does the neck swing
   * forward and down, just far enough for it to (or as far as MAX_NECK_SWING allows). Then the head tips the bill onto
   * the ground: back up if a deep lean would push it under, and never past straight down, where it stops short if
   * the ground is out of reach.
   */
  function reachDown(w: number) {
    group.updateMatrixWorld(true)
    toGroup.copy(group.matrixWorld).invert()
    inGroup(bones.neck, pN); inGroup(bones.neckMid, pM); inGroup(bones.head, pH)
    const swing = neckSwing({
      base: pN,
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
    bones.head.rotation.z -= Math.min(w * headPitchToGround(pH, pT, floor), tipLine - floor)
  }

  function setLeg(tibia: THREE.Bone, tarsus: THREE.Bone, toes: THREE.Bone, dx: number, dy: number) {
    const { joint, foot } = solveLeg(hip2, { x: footR.x + dx, y: footR.y + dy }, layout.tibia, layout.tarsus)
    const alpha = Math.atan2(joint.y - hip2.y, joint.x - hip2.x)
    const beta = Math.atan2(foot.y - joint.y, foot.x - joint.x)
    tibia.rotation.z = alpha - alpha0
    tarsus.rotation.z = (beta - beta0) - (alpha - alpha0)
    toes.rotation.z = -(beta - beta0)
  }

  function pose(st: PoseState) {
    // lean.x pitches the nose down, lean.z rolls; the body pivots over the hips
    bones.body.rotation.set(st.lean.z, 0, -st.lean.x)
    // neck: 0.5 is the traced rest posture. Tucking draws the head down into the shoulders; extending
    // lengthens the neck a little and tips it forward, so a strike reaches out and down.
    const ext = THREE.MathUtils.clamp(st.neckExtend, 0, 1)
    const k = ext < 0.5 ? 0.6 + 0.8 * ext : 1 + 0.3 * (ext - 0.5)
    const tip = -0.5 * (ext - 0.5)
    bones.neck.rotation.z = tip
    bones.head.rotation.z = -tip                       // keeps the bill level relative to the body
    bones.neckMid.position.copy(neckMidRest).multiplyScalar(k)
    bones.head.position.copy(headRest).multiplyScalar(k)
    bones.head.position.x += st.headBob * bodyLength
    bones.neckMid.rotation.z = 0
    const reach = THREE.MathUtils.clamp(st.reach, 0, 1)
    if (reach > 0) reachDown(smooth(reach))
    bones.tail.rotation.z = st.tailTilt
    // wings: folded shell at rest, the spread planform once the wings open
    const spread = THREE.MathUtils.clamp(st.wingSpread, 0, 1)
    const open = spread > 0.05
    for (const b of [bones.wingFoldL, bones.wingFoldR]) b.scale.setScalar(open ? HIDDEN : 1)
    for (const b of [bones.wingL, bones.wingR]) b.scale.setScalar(open ? 1 : HIDDEN)
    const flap = Math.sin(st.wingPhase * Math.PI * 2) * 0.9 * spread
    bones.wingL.rotation.x = flap
    bones.wingR.rotation.x = -flap
    // legs
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
