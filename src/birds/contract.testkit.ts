import * as THREE from 'three'
import { defaultPose, type BirdModel, type BirdParts } from './model'

/**
 * Bounding box of one part's geometry in world space. For a skinned model, the skinned vertices bound to the
 * part's bone or any bone under it; otherwise every mesh under the part.
 */
export function partBox(model: BirdModel, key: keyof BirdParts): THREE.Box3 {
  model.group.updateMatrixWorld(true)
  const part = model.parts[key]
  const box = new THREE.Box3()
  let skinned: THREE.SkinnedMesh | undefined
  model.group.traverse(o => { if (o instanceof THREE.SkinnedMesh) skinned = o })
  if (!skinned) return box.setFromObject(part, true)
  const under = new Set<THREE.Object3D>()
  part.traverse(o => under.add(o))
  const bones = skinned.skeleton.bones
  const index = skinned.geometry.getAttribute('skinIndex') as THREE.BufferAttribute
  const weight = skinned.geometry.getAttribute('skinWeight') as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < index.count; i++) {
    // the vertex's heaviest bone decides which part it belongs to
    let best = 0, bw = -1
    for (let k = 0; k < 4; k++) { const w = weight.getComponent(i, k); if (w > bw) { bw = w; best = index.getComponent(i, k) } }
    if (!under.has(bones[best]!)) continue
    skinned.getVertexPosition(i, v)
    box.expandByPoint(v.applyMatrix4(skinned.matrixWorld))
  }
  return box
}

/** What every BirdModel must do, whichever builder made it. `build` returns a standing bird. */
export function birdModelContract(name: string, build: () => BirdModel): void {
  describe(`${name}: BirdModel contract`, () => {
    it('names every part and keeps it under the group', () => {
      const m = build()
      for (const key of ['body', 'neck', 'head', 'bill', 'wingL', 'wingR', 'tail', 'legs'] as const) {
        expect(m.parts[key].name).toBe(key)
        let found = false
        m.group.traverse(o => { if (o === m.parts[key]) found = true })
        expect(found).toBe(true)
      }
    })
    it("stands a standing bird's feet on the origin", () => {
      const m = build()
      expect(Math.abs(partBox(m, 'legs').min.y)).toBeLessThan(0.02)
    })
    it('gives a centre above the feet and a radius on the scale of the bird', () => {
      const m = build()
      expect(m.center.y).toBeGreaterThan(0.02)
      expect(m.radius).toBeGreaterThan(0.05)
      expect(m.radius).toBeLessThan(2)
    })
    it('pose moves the wings and the head', () => {
      const m = build()
      const a = m.parts.wingL.rotation.x
      const h = m.parts.head.position.x
      m.pose({ ...defaultPose(), wingPhase: 0.25, wingSpread: 1, headBob: 0.2 })
      expect(m.parts.wingL.rotation.x).not.toBe(a)
      expect(m.parts.head.position.x).not.toBe(h)
    })
    it('lowers the head when the neck tucks, and never scales it', () => {
      const m = build()
      const headAt = (neckExtend: number) => {
        m.pose({ ...defaultPose(), neckExtend })
        m.group.updateMatrixWorld(true)
        const s = m.parts.head.getWorldScale(new THREE.Vector3())
        for (const c of [s.x, s.y, s.z]) expect(Math.abs(c - 1)).toBeLessThan(0.01)
        return m.parts.head.getWorldPosition(new THREE.Vector3()).y
      }
      expect(headAt(0)).toBeLessThan(headAt(1))
    })
  })
}
