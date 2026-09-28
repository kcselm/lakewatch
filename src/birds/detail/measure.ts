import * as THREE from 'three'
import type { DetailedBirdModel } from './build'
import { RINGS, RADIAL } from './loft'

/** Field measurements of a built bird at rest pose, metres, taken the way the published tables take them. */
export interface Measures {
  /** bill tip to tail tip, straight line */
  length: number
  /** exposed culmen: where the bill leaves the forehead to the tip */
  culmen: number
  /** total head minus culmen; total head is bill tip to the rearmost point of the head along the bill axis */
  head: number
  /** bill depth where it leaves the forehead */
  billDepth: number
  /** how far the tip sits above the line of the bill's base (positive = upturned) */
  billTipRise: number
  tarsus: number
  /** bare tibia: from where it leaves the belly to the intertarsal joint */
  tibia: number
  /** wrist to wingtip */
  wingChord: number
  /** tail root to the middle of the tip */
  tail: number
  /** how far the folded wingtip reaches past the tail tip, along the tail */
  projection: number
  /** standing, how high above the ground: the intertarsal joint, the lowest point of the body, and of the folded wing */
  joint: number
  belly: number
  wingLow: number
  /**
   * Floating, how high above the water (y = 0): the highest point of the back behind the neck base; the crown (the
   * highest point of the head); the tail tip (for a bird with no tail, the rearmost point of the body); the folded
   * wingtip; and the front of the breast (the frontmost point of the body, from the tail to the neck base, that lies
   * below the neck base). A standing bird reports them too, above the ground, where they mean little.
   */
  backAbove: number
  crownAbove: number
  tailTipAbove: number
  wingTipAbove: number
  breastFrontAbove: number
  /** floating, how deep the lowest point of the body sits under the water (positive) */
  draft: number
  /** floating, the body's length along the water (y = 0) in the side view; 0 when the water misses it */
  waterlineLength: number
  /**
   * Where the built bill is widest, as a fraction of its length from the base (the middle of a stretch where it
   * stays widest), and that width over the width at the base.
   */
  billWidestAt: number
  billWidestRatio: number
}

const measured = new WeakMap<DetailedBirdModel, Measures>()

/** The measures of a built bird at rest (taken once per model: the viewer asks every frame). */
export function measure(model: DetailedBirdModel): Measures {
  let r = measured.get(model)
  if (!r) { r = measureOnce(model); measured.set(model, r) }
  return r
}

function measureOnce(model: DetailedBirdModel): Measures {
  const a = model.anatomy
  const culmen = a.billTip.distanceTo(a.billBase)
  let totalHead = 0
  for (const v of a.head) totalHead = Math.max(totalHead, a.billTip.clone().sub(v).dot(a.billDir))
  let lo = Infinity, hi = -Infinity
  for (const v of a.billBaseRing) {
    const h = v.clone().sub(a.billBase).dot(a.billUp)
    lo = Math.min(lo, h); hi = Math.max(hi, h)
  }
  const drop = a.hip.y - a.knee.y
  const bare = drop > 0 ? Math.min(1, Math.max(0, (a.bellyY - a.knee.y) / drop)) : 0
  const tailAxis = a.tailTip.clone().sub(a.tailRoot).normalize()
  // the bill's width every 1% of its length; the widest point is the middle of the widest stretch
  const widths = Array.from({ length: 101 }, (_, k) => billWidthAt(model, k / 100))
  const widest = Math.max(...widths)
  const at = widths.flatMap((w, k) => (w >= widest - 1e-7 ? [k / 100] : []))
  return {
    length: a.billTip.distanceTo(a.tailTip),
    culmen,
    head: totalHead - culmen,
    billDepth: hi - lo,
    billTipRise: a.billTip.clone().sub(a.billBase).dot(a.billUp),
    tarsus: a.knee.distanceTo(a.foot),
    tibia: a.hip.distanceTo(a.knee) * bare,
    wingChord: a.wrist.distanceTo(a.wingTip),
    tail: a.tailRoot.distanceTo(a.tailTip),
    projection: a.wingTip.clone().sub(a.tailTip).dot(tailAxis),
    joint: a.knee.y,
    belly: a.bodyLowY,
    wingLow: a.wingLowY,
    backAbove: a.backTopY,
    crownAbove: Math.max(...a.head.map(v => v.y)),
    tailTipAbove: a.tailTip.y,
    wingTipAbove: a.wingTip.y,
    breastFrontAbove: a.breastFront.y,
    draft: -a.bodyLowY,
    waterlineLength: a.waterline.front - a.waterline.back,
    billWidestAt: (at[0]! + at[at.length - 1]!) / 2,
    billWidestRatio: widest / widths[0]!,
  }
}

/**
 * The built bill's cross-section at rest, at fraction `s` of its length from the base (0) to the tip (1): the points
 * where the plane square to the bill's base direction, that far along, cuts the bill's triangles.
 */
function billSection(model: DetailedBirdModel, s: number): THREE.Vector3[] {
  const a = model.anatomy
  const g = model.mesh.geometry
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const index = g.getIndex()!
  const bill = a.closed.find(c => c.name === 'bill')!
  const along = s * a.billTip.clone().sub(a.billBase).dot(a.billDir) + a.billBase.dot(a.billDir)
  const p = new THREE.Vector3(), q = new THREE.Vector3()
  const out: THREE.Vector3[] = []
  for (let i = bill.indexFirst; i < bill.indexFirst + bill.indexCount; i += 3) {
    for (let k = 0; k < 3; k++) {
      p.fromBufferAttribute(pos, index.getX(i + k))
      q.fromBufferAttribute(pos, index.getX(i + ((k + 1) % 3)))
      const dp = p.dot(a.billDir) - along, dq = q.dot(a.billDir) - along
      if (dp < 0 === dq < 0) continue
      out.push(p.clone().lerp(q, dp / (dp - dq)))
    }
  }
  return out
}

/** The built bill's width (across, z) at rest, at fraction `s` of its length from the base (0) to the tip (1), metres. */
export function billWidthAt(model: DetailedBirdModel, s: number): number {
  const pts = billSection(model, s)
  return pts.length ? Math.max(...pts.map(v => v.z)) - Math.min(...pts.map(v => v.z)) : 0
}

/** The built bill's depth (top to bottom, square to the bill) at rest, at fraction `s` of its length from the base, metres. */
export function billDepthAt(model: DetailedBirdModel, s: number): number {
  const a = model.anatomy
  const h = billSection(model, s).map(v => v.clone().sub(a.billBase).dot(a.billUp))
  return h.length ? Math.max(...h) - Math.min(...h) : 0
}

/** Where the bill tip is now, in group space (the feet stand on y = 0), after the model's last pose(). */
export function billTipNow(model: DetailedBirdModel): THREE.Vector3 {
  model.group.updateMatrixWorld(true)
  const toGroup = model.group.matrixWorld.clone().invert()
  // the bill bone sits at the bill base and carries no rotation at rest
  return model.anatomy.billTip.clone().sub(model.anatomy.billBase).applyMatrix4(model.parts.bill.matrixWorld).applyMatrix4(toGroup)
}

/**
 * Where the tail tip is now, in group space (on the water, or the ground), after the model's last pose(): the stern of
 * a tipped-up duck. For a bird with no tail, the rearmost point of its body.
 */
export function tailTipNow(model: DetailedBirdModel): THREE.Vector3 {
  model.group.updateMatrixWorld(true)
  const toGroup = model.group.matrixWorld.clone().invert()
  // the tail bone sits at the tail root and carries no rotation at rest
  return model.anatomy.tailTip.clone().sub(model.anatomy.tailRoot).applyMatrix4(model.parts.tail.matrixWorld).applyMatrix4(toGroup)
}

/**
 * How high the top of the head is now, in group space (above the ground, or the water), after the model's last pose():
 * the highest point of the skin from the occiput forward. The loft's rings are the geometry's first vertices.
 */
export function crownNow(model: DetailedBirdModel): number {
  model.group.updateMatrixWorld(true)
  const first = Math.ceil(model.profile.uOf('occiput') * (RINGS - 1))
  const v = new THREE.Vector3()
  let top = -Infinity
  for (let i = first * RADIAL; i < RINGS * RADIAL; i++) top = Math.max(top, model.mesh.getVertexPosition(i, v).y)
  return top
}

/** Where the bill points now, radians from level in the side view (negative is down), after the model's last pose(). */
export function billAngleNow(model: DetailedBirdModel): number {
  const tip = billTipNow(model)
  const base = model.parts.bill.getWorldPosition(new THREE.Vector3()).applyMatrix4(model.group.matrixWorld.clone().invert())
  return Math.atan2(tip.y - base.y, tip.x - base.x)
}
