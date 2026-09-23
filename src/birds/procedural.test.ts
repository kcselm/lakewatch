import * as THREE from 'three'
import { buildBird } from './procedural'
import { defaultPose } from './model'
import { parseSpeciesSpec } from './spec'
import { getSpec } from './species'

describe('buildBird', () => {
  const coot = getSpec('y00475')
  it('creates every named part under the group', () => {
    const m = buildBird(coot)
    for (const key of ['body', 'neck', 'head', 'bill', 'wingL', 'wingR', 'tail', 'legs'] as const) {
      expect(m.parts[key].name).toBe(key)
      let found = false
      m.group.traverse(o => { if (o === m.parts[key]) found = true })
      expect(found).toBe(true)
    }
  })
  it('scales to the spec length', () => {
    const m = buildBird(coot)
    m.group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(m.group)
    const len = box.max.x - box.min.x
    expect(len).toBeGreaterThan(coot.length * 0.8)
    expect(len).toBeLessThan(coot.length * 1.3)
    expect(m.radius).toBeGreaterThan(0.1)
  })
  it('sits a swimming bird with its body partly below the origin', () => {
    const m = buildBird(coot)
    m.group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(m.parts.body)
    expect(box.min.y).toBeLessThan(0)
    expect(box.max.y).toBeGreaterThan(0)
  })
  it('pose moves the wings and head', () => {
    const m = buildBird(coot)
    const a = m.parts.wingL.rotation.x
    const h = m.parts.head.position.x
    m.pose({ ...defaultPose(), wingPhase: 0.25, wingSpread: 1, headBob: 0.2 })
    expect(m.parts.wingL.rotation.x).not.toBe(a)
    expect(m.parts.head.position.x).not.toBe(h)
  })
  it("standing bird's feet touch the origin", () => {
    const standing = parseSpeciesSpec({ ...coot, posture: 'standing', legs: { length: 0.4, thickness: 0.05 } })
    const m = buildBird(standing)
    m.group.updateMatrixWorld(true)
    const legsBox = new THREE.Box3().setFromObject(m.parts.legs)
    expect(Math.abs(legsBox.min.y)).toBeLessThan(0.02)
    // The body mesh's own geometry (not its subtree, which includes the legs down at y=0)
    // should sit with its underside at y = legLen, clear of the ground.
    const s = standing.length / (standing.body.length + standing.neck.length * 0.6 + standing.bill.length + standing.tail.length)
    const legLen = standing.legs.length * s
    const bodyGeo = (m.parts.body as THREE.Mesh).geometry
    bodyGeo.computeBoundingBox()
    const bodyOwnBox = bodyGeo.boundingBox!.clone().applyMatrix4(m.parts.body.matrixWorld)
    expect(bodyOwnBox.min.y).toBeCloseTo(legLen, 2)
  })
  it('head is not scaled by neck tuck', () => {
    const m = buildBird(coot)
    m.pose({ ...defaultPose(), neckExtend: 0 })
    m.group.updateMatrixWorld(true)
    const scale = m.parts.head.getWorldScale(new THREE.Vector3())
    expect(Math.abs(scale.x - 1)).toBeLessThan(0.01)
    expect(Math.abs(scale.y - 1)).toBeLessThan(0.01)
    expect(Math.abs(scale.z - 1)).toBeLessThan(0.01)
    const yTucked = m.parts.head.getWorldPosition(new THREE.Vector3()).y
    m.pose({ ...defaultPose(), neckExtend: 1 })
    m.group.updateMatrixWorld(true)
    const yExtended = m.parts.head.getWorldPosition(new THREE.Vector3()).y
    expect(yTucked).toBeLessThan(yExtended)
  })
})
