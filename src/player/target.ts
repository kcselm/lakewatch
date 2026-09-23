import * as THREE from 'three'

export const MIN_TARGET_PX = 28
export const RETICLE_RADIUS_PX = 60

export interface Candidate { id: number; species: string; position: THREE.Vector3; radius: number }
export interface TargetResult { id: number; species: string; apparentPx: number; tooSmall: boolean }

/** Height in pixels of a sphere of `radiusM` at `distanceM` under a vertical fov. */
export function apparentSizePx(radiusM: number, distanceM: number, fovDeg: number, viewportHeightPx: number): number {
  const fovRad = (fovDeg * Math.PI) / 180
  const worldHeightAtD = 2 * Math.tan(fovRad / 2) * distanceM
  return (2 * radiusM / worldHeightAtD) * viewportHeightPx
}

const v = new THREE.Vector3()
const camPos = new THREE.Vector3()
const forward = new THREE.Vector3()
const toBird = new THREE.Vector3()

export function pickTarget(
  cands: readonly Candidate[],
  camera: THREE.PerspectiveCamera,
  viewport: { width: number; height: number },
): TargetResult | null {
  let best: TargetResult | null = null
  camPos.setFromMatrixPosition(camera.matrixWorld)
  forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
  for (const c of cands) {
    toBird.subVectors(c.position, camPos)
    if (toBird.dot(forward) <= 0) continue                     // behind the camera
    v.copy(c.position).project(camera)
    if (v.z > 1 || v.z < -1) continue                          // outside near/far
    const px = (v.x * viewport.width) / 2
    const py = (v.y * viewport.height) / 2
    const dist = c.position.distanceTo(camPos)
    const apparentPx = apparentSizePx(c.radius, dist, camera.fov, viewport.height)
    const projectedRadiusPx = apparentPx / 2
    // a hit is either the reticle centre over the bird, or the bird's own projected disc
    // reaching into the reticle (so a large, off-centre body still registers)
    if (Math.hypot(px, py) > RETICLE_RADIUS_PX + projectedRadiusPx + 1e-6) continue
    if (!best || apparentPx > best.apparentPx) {
      best = { id: c.id, species: c.species, apparentPx, tooSmall: apparentPx < MIN_TARGET_PX - 1e-9 }
    }
  }
  return best
}
