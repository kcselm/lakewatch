import * as THREE from 'three'
import { createStumps, STUMPS } from './trees'

describe('the stumps', () => {
  const ground = (x: number, z: number) => -2.5 - 0.01 * x - 0.01 * z
  const { object, perches } = createStumps([-14, 0, -30], ground)
  it('gives one perch per stump, on its top, above the water', () => {
    expect(perches).toHaveLength(STUMPS.length)
    perches.forEach((p, i) => {
      expect(p.x).toBeCloseTo(-14 + STUMPS[i]!.dx, 9)
      expect(p.z).toBeCloseTo(-30 + STUMPS[i]!.dz, 9)
      expect(p.y).toBe(STUMPS[i]!.top)
      expect(p.y).toBeGreaterThan(0.4)
    })
  })
  it('stands each one on the bed, its top where its perch is', () => {
    object.updateMatrixWorld(true)
    const trunks = object.children.slice()
    perches.forEach(p => {
      const trunk = trunks.find(t => Math.hypot(t.position.x - p.x, t.position.z - p.z) < 1e-9)!
      const box = new THREE.Box3().setFromObject(trunk)
      expect(box.max.y).toBeCloseTo(p.y, 6)
      expect(box.min.y).toBeCloseTo(ground(p.x, p.z), 6)
    })
  })
  it('keeps two cormorants a body width apart or more, as they perch on a shared snag', () => {
    for (let i = 0; i < perches.length; i++) for (let j = i + 1; j < perches.length; j++) {
      expect(Math.hypot(perches[i]!.x - perches[j]!.x, perches[i]!.z - perches[j]!.z)).toBeGreaterThan(1)
    }
  })
})
