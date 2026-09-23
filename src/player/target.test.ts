import * as THREE from 'three'
import { apparentSizePx, pickTarget, MIN_TARGET_PX, RETICLE_RADIUS_PX } from './target'

function cam(fov: number) {
  const c = new THREE.PerspectiveCamera(fov, 16 / 9, 0.1, 1000)
  c.position.set(0, 0, 0)
  c.lookAt(0, 0, -1)
  c.updateMatrixWorld(true)
  c.updateProjectionMatrix()
  return c
}
const vp = { width: 1600, height: 900 }

describe('apparentSizePx', () => {
  it('grows with magnification: 8x binoculars make a bird 8x taller on screen', () => {
    const eye = apparentSizePx(0.2, 40, 60, 900)
    const bino = apparentSizePx(0.2, 40, 7.5, 900)
    // tan(30°)/tan(3.75°) is about 8.8; the nominal 8x is the angular ratio
    expect(bino / eye).toBeGreaterThan(8)
    expect(bino / eye).toBeLessThan(9.5)
  })
})

describe('pickTarget', () => {
  it('returns null when nothing is near the reticle', () => {
    expect(pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(30, 0, -20), radius: 0.3 }], cam(60), vp)).toBeNull()
  })
  it('ignores birds behind the camera', () => {
    expect(pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(0, 0, 5), radius: 0.3 }], cam(60), vp)).toBeNull()
  })
  it('picks the largest bird inside the reticle and flags tooSmall below the threshold', () => {
    const far = { id: 1, species: 'far', position: new THREE.Vector3(0, 0, -200), radius: 0.2 }
    const near = { id: 2, species: 'near', position: new THREE.Vector3(0.2, 0, -8), radius: 0.2 }
    const r = pickTarget([far, near], cam(60), vp)!
    expect(r.id).toBe(2)
    expect(r.tooSmall).toBe(false)
    const only = pickTarget([far], cam(60), vp)!
    expect(only.id).toBe(1)
    expect(only.tooSmall).toBe(true)
    expect(pickTarget([far], cam(2), vp)!.tooSmall).toBe(false)
  })
  it('a bird exactly at the size threshold is not too small', () => {
    // solve distance so apparent size equals MIN_TARGET_PX exactly at 60° / 900 px
    const radius = 0.2
    const fovRad = (60 * Math.PI) / 180
    const d = (2 * radius * 900) / (MIN_TARGET_PX * 2 * Math.tan(fovRad / 2))
    const r = pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(0, 0, -d), radius }], cam(60), vp)!
    expect(r.apparentPx).toBeCloseTo(MIN_TARGET_PX, 6)
    expect(r.tooSmall).toBe(false)
  })
  it('a bird exactly on the reticle edge is inside', () => {
    // place a bird whose projected x offset equals RETICLE_RADIUS_PX at 60° / 1600x900
    const c = cam(60)
    const z = -50
    const fovRad = (60 * Math.PI) / 180
    const halfH = Math.tan(fovRad / 2) * -z
    const x = (RETICLE_RADIUS_PX / (900 / 2)) * halfH
    const r = pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(x, 0, z), radius: 1 }], c, vp)
    expect(r?.id).toBe(1)
  })
  it('a standing bird centred by its body is targetable under a 2° fov at 65 m', () => {
    const r = pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(0, 0, -65), radius: 0.6 }], cam(2), vp)
    expect(r?.id).toBe(1)
    expect(r?.tooSmall).toBe(false)
  })
  it('a bird whose projected disc overlaps the reticle is inside', () => {
    // choose a near, large candidate offset 70px past the 60px reticle radius; its own
    // projected radius (>20px) should be enough for pickTarget to still count it as a hit
    const c = cam(60)
    const z = -8
    const fovRad = (60 * Math.PI) / 180
    const halfH = Math.tan(fovRad / 2) * -z
    const x = (70 / (900 / 2)) * halfH
    const r = pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(x, 0, z), radius: 0.6 }], c, vp)
    expect(r?.id).toBe(1)
  })
})
