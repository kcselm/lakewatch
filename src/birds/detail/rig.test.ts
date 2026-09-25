import * as THREE from 'three'
import { BONE_NAMES, BONE_PARENT, createBones, type Joints } from './rig'

describe('createBones', () => {
  const joints = Object.fromEntries(BONE_NAMES.map((n, i) => [n, new THREE.Vector3(i * 0.01, i * 0.02, 0)])) as Joints
  const { bones, list } = createBones(joints)
  it('makes one named bone per name, in order', () => {
    expect(list.map(b => b.name)).toEqual([...BONE_NAMES])
  })
  it('parents every bone and puts it at its joint in rest pose', () => {
    const root = new THREE.Group()
    root.add(bones.root)
    root.updateMatrixWorld(true)
    for (const n of BONE_NAMES) {
      const parent = BONE_PARENT[n]
      expect(bones[n].parent).toBe(parent ? bones[parent] : root)
      expect(bones[n].getWorldPosition(new THREE.Vector3()).distanceTo(joints[n])).toBeLessThan(1e-9)
    }
  })
  it('hangs the legs from root, so the body can lean without swinging them', () => {
    expect(BONE_PARENT.legs).toBe('root')
    expect(BONE_PARENT.body).toBe('root')
  })
})
