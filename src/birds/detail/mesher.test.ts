import * as THREE from 'three'
import { Mesher, signedVolume, tube } from './mesher'
import { BONE_INDEX } from './rig'

describe('Mesher', () => {
  it('stores position, atlas uv, and up to four bone weights per vertex', () => {
    const m = new Mesher()
    const i = m.vertex(new THREE.Vector3(1, 2, 3), 'bill', 0.5, 0.5, [['head', 0.25], ['bill', 0.75]])
    const g = m.geometry()
    expect(i).toBe(0)
    expect(m.position(0).toArray()).toEqual([1, 2, 3])
    const si = g.getAttribute('skinIndex') as THREE.BufferAttribute
    const sw = g.getAttribute('skinWeight') as THREE.BufferAttribute
    expect([si.getX(0), si.getY(0), si.getZ(0)]).toEqual([BONE_INDEX.head, BONE_INDEX.bill, 0])
    expect([sw.getX(0), sw.getY(0), sw.getZ(0)]).toEqual([0.25, 0.75, 0])
    expect(m.parts).toEqual(['bill'])
  })
  it('refuses a vertex with no weights or more than four', () => {
    const m = new Mesher()
    expect(() => m.vertex(new THREE.Vector3(), 'skin', 0, 0, [])).toThrow()
    expect(() => m.vertex(new THREE.Vector3(), 'skin', 0, 0, [['body', 0.2], ['neck', 0.2], ['head', 0.2], ['bill', 0.2], ['tail', 0.2]])).toThrow()
  })
  it('translates every vertex', () => {
    const m = new Mesher()
    m.vertex(new THREE.Vector3(1, 1, 1), 'skin', 0, 0, [['body', 1]])
    m.translate(new THREE.Vector3(1, -1, 0.5))
    expect(m.position(0).toArray()).toEqual([2, 0, 1.5])
  })
})

describe('tube', () => {
  it('is closed and faces outward in any direction', () => {
    for (const dir of [new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0.2, 0), new THREE.Vector3(0, 0, 1)]) {
      const m = new Mesher()
      const r = tube(m, new THREE.Vector3(), dir, 0.01, 0.005, 'legs', 0.5, 0.5, [['legs', 1]])
      expect(signedVolume(m.geometry(), r.indexFirst, r.indexCount)).toBeGreaterThan(0)
    }
  })
})

describe('signedVolume', () => {
  it('measures a closed mesh, negative when turned inside out', () => {
    const box = new THREE.BoxGeometry(1, 2, 3)
    expect(signedVolume(box)).toBeCloseTo(6, 9)
    const idx = box.getIndex()!
    for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i + 1); idx.setX(i + 1, idx.getX(i + 2)); idx.setX(i + 2, a) }
    expect(signedVolume(box)).toBeCloseTo(-6, 9)
  })
})
