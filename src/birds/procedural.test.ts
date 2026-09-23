import * as THREE from 'three'
import { buildBird } from './procedural'
import { defaultPose } from './model'
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
})
