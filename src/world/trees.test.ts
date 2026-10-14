import * as THREE from 'three'
import { createSnag, createDeadBranch } from './trees'
import type { Heightfield } from './heightfield'
import type { PerchEntry } from '../location/schema'

/**
 * Where the perch point lies against the mesh named `perch` in the object: how far it is from the branch's axis, the
 * branch's radius there, and how far round from the top of the branch it sits (radians; 0 is the very top).
 */
function onBranch(object: THREE.Object3D, point: THREE.Vector3) {
  object.updateMatrixWorld(true)
  const mesh = object.getObjectByName('perch') as THREE.Mesh<THREE.CylinderGeometry>
  const { radiusTop, radiusBottom, height } = mesh.geometry.parameters
  const centre = mesh.getWorldPosition(new THREE.Vector3())
  const axis = new THREE.Vector3(0, 1, 0).transformDirection(mesh.matrixWorld)
  const along = point.clone().sub(centre).dot(axis)
  const off = point.clone().sub(centre).addScaledVector(axis, -along)
  const top = new THREE.Vector3(0, 1, 0).addScaledVector(axis, -axis.y).normalize()
  return {
    distance: off.length(),
    radius: radiusBottom + (radiusTop - radiusBottom) * (along / height + 0.5),
    fromTop: off.angleTo(top),
    along, height, axis,
  }
}

describe('createSnag', () => {
  it('sets its perch on the top of its branch, and gives the branch its radius there', () => {
    const snag = createSnag([22, 0, -48])
    const b = onBranch(snag.object, snag.perchPoint)
    expect(b.distance).toBeCloseTo(b.radius, 4)
    expect(b.fromTop).toBeLessThan(1e-6)
    expect(snag.perchRadius).toBeCloseTo(b.radius, 6)
    expect(Math.abs(b.along)).toBeLessThan(b.height / 2)
    // where the bird has always sat, along the branch, now on it rather than 16 cm above it
    expect(snag.perchPoint.x).toBeCloseTo(23.7, 2)
    expect(snag.perchPoint.z).toBeCloseTo(-48, 6)
  })
})

describe('createDeadBranch', () => {
  // a bank rising toward -x: water deeper than 0.3 m beyond x = 0, dry ground beyond x = -4
  const bank: Heightfield = { sample: x => Math.min(1, -0.5 - x * 0.2) }
  const perch: PerchEntry = { name: 'near', on: 'branch', position: [2, 5], height: 2.6, radius: 0.018, facing: 33 }

  it('puts its perch twig across the facing, level, with its top on the perch point at the perch radius', () => {
    const d = createDeadBranch(perch, bank)
    expect(d.perchPoint.toArray()).toEqual([2, 2.6, 5])
    const b = onBranch(d.object, d.perchPoint)
    expect(b.distance).toBeCloseTo(perch.radius, 6)
    expect(b.radius).toBeCloseTo(perch.radius, 6)
    expect(b.fromTop).toBeLessThan(1e-6)
    expect(Math.abs(b.axis.y)).toBeLessThan(1e-9)
    const facing = new THREE.Vector3(Math.sin(33 * Math.PI / 180), 0, -Math.cos(33 * Math.PI / 180))
    expect(Math.abs(b.axis.dot(facing))).toBeLessThan(1e-9)
  })
  it('roots on the nearest dry ground behind the perch, not out in the water ahead', () => {
    const d = createDeadBranch(perch, bank)
    expect(bank.sample(d.root.x, d.root.z)).toBeGreaterThan(0)
    expect(d.root.x).toBeLessThan(-2.4)
    const ahead = new THREE.Vector3(Math.sin(33 * Math.PI / 180), 0, -Math.cos(33 * Math.PI / 180))
    expect(d.root.clone().sub(d.perchPoint).setY(0).dot(ahead)).toBeLessThan(0)
    expect(d.perchPoint.distanceTo(d.root)).toBeLessThan(8)
  })
  it('keeps everything but the perch twig behind and below the bird, out of its plunge', () => {
    const d = createDeadBranch(perch, bank)
    d.object.updateMatrixWorld(true)
    const ahead = new THREE.Vector3(Math.sin(33 * Math.PI / 180), 0, -Math.cos(33 * Math.PI / 180))
    const box = new THREE.Box3()
    d.object.traverse(o => {
      if (!(o instanceof THREE.Mesh) || o.name === 'perch') return
      const pos = o.geometry.getAttribute('position')
      const v = new THREE.Vector3()
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld)
        box.expandByPoint(v)
        // nothing reaches more than 0.3 m out past the perch toward the water
        expect(v.clone().sub(d.perchPoint).setY(0).dot(ahead)).toBeLessThan(0.3)
      }
    })
    expect(box.isEmpty()).toBe(false)
  })
  it('is low-poly, and the same every time', () => {
    const tris = (o: THREE.Object3D) => {
      let n = 0
      o.traverse(m => { if (m instanceof THREE.Mesh) n += (m.geometry.index?.count ?? m.geometry.getAttribute('position').count) / 3 })
      return n
    }
    const a = createDeadBranch(perch, bank), b = createDeadBranch(perch, bank)
    expect(tris(a.object)).toBeLessThan(200)
    const verts = (o: THREE.Object3D) => {
      o.updateMatrixWorld(true)
      const out: number[] = []
      o.traverse(m => { if (m instanceof THREE.Mesh) out.push(...m.matrixWorld.elements) })
      return out
    }
    expect(verts(a.object)).toEqual(verts(b.object))
  })
  it('refuses a perch with no bank near it', () => {
    expect(() => createDeadBranch(perch, { sample: () => -2 })).toThrow(/bank/)
  })
})
