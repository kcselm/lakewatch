import * as THREE from 'three'
import type { DetailedBirdModel } from './build'

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
}

export function measure(model: DetailedBirdModel): Measures {
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
  }
}

/** Where the bill tip is now, in group space (the feet stand on y = 0), after the model's last pose(). */
export function billTipNow(model: DetailedBirdModel): THREE.Vector3 {
  model.group.updateMatrixWorld(true)
  const toGroup = model.group.matrixWorld.clone().invert()
  // the bill bone sits at the bill base and carries no rotation at rest
  return model.anatomy.billTip.clone().sub(model.anatomy.billBase).applyMatrix4(model.parts.bill.matrixWorld).applyMatrix4(toGroup)
}

/** Where the bill points now, radians from level in the side view (negative is down), after the model's last pose(). */
export function billAngleNow(model: DetailedBirdModel): number {
  const tip = billTipNow(model)
  const base = model.parts.bill.getWorldPosition(new THREE.Vector3()).applyMatrix4(model.group.matrixWorld.clone().invert())
  return Math.atan2(tip.y - base.y, tip.x - base.x)
}
