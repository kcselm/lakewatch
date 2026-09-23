import * as THREE from 'three'
import { buildFlockModel } from './flock'
import { getSpec } from './species'
import { defaultPose } from './model'

const instanced = (f: ReturnType<typeof buildFlockModel>) =>
  f.object.children.filter((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh)

describe('buildFlockModel', () => {
  it('makes one instanced mesh per visible part with the flock count, and no legs', () => {
    const f = buildFlockModel(getSpec('cangoo'), 3)
    const inst = instanced(f)
    expect(inst.length).toBeGreaterThanOrEqual(8)
    expect(inst.every(m => m.count === 3)).toBe(true)
    expect(inst.map(m => m.name)).not.toContain('leg')
    expect(inst.map(m => m.name)).not.toContain('foot')
    expect(f.count).toBe(3)
    expect(f.radius).toBeGreaterThan(0.3)
  })

  it('places a member where it is told', () => {
    const f = buildFlockModel(getSpec('cangoo'), 2)
    f.setMember(1, 10, 20, 30, 0, defaultPose())
    f.commit()
    const body = instanced(f).find(m => m.name === 'body')!
    const m = new THREE.Matrix4()
    body.getMatrixAt(1, m)
    const p = new THREE.Vector3().setFromMatrixPosition(m)
    expect(p.x).toBeCloseTo(10, 5)
    expect(p.z).toBeCloseTo(30, 5)
    expect(Math.abs(p.y - 20)).toBeLessThan(1)
  })

  it('gives members different wing angles for different phases', () => {
    const f = buildFlockModel(getSpec('cangoo'), 2)
    const pose = defaultPose()
    pose.wingSpread = 1
    pose.wingPhase = 0.25
    f.setMember(0, 0, 0, 0, 0, pose)
    pose.wingPhase = 0.75
    f.setMember(1, 0, 0, 0, 0, pose)
    const wing = instanced(f).find(m => m.name === 'wingL')!
    const a = new THREE.Matrix4(), b = new THREE.Matrix4()
    wing.getMatrixAt(0, a)
    wing.getMatrixAt(1, b)
    expect(a.equals(b)).toBe(false)
  })
})
