import * as THREE from 'three'
import { buildFlockModel, buildDetailedFlock, buildFlock, SKY_LIGHT } from './flock'
import { materialFor } from './paint/painter'
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

describe('buildDetailedFlock', () => {
  const skinned = (f: ReturnType<typeof buildDetailedFlock>) => f.object.children.map(g => g.children.find((c): c is THREE.SkinnedMesh => c instanceof THREE.SkinnedMesh)!)

  it('makes a skinned bird a member, all on one mesh, each with bones of its own and its version\'s paint', () => {
    const f = buildDetailedFlock(getSpec('mallar3'), ['male', 'female', 'female'])
    const meshes = skinned(f)
    expect(f.count).toBe(3)
    expect(meshes).toHaveLength(3)
    expect(new Set(meshes.map(m => m.geometry)).size).toBe(1)
    expect(new Set(meshes.map(m => m.skeleton)).size).toBe(3)
    expect(meshes[1]!.material).toBe(meshes[2]!.material)
    expect(meshes[0]!.material).not.toBe(meshes[1]!.material)
    expect(f.variants).toEqual(['male', 'female', 'female'])
    expect(meshes.every(m => m.frustumCulled === false)).toBe(true)
    // lit a little from within, so a white bird overhead is not a black one; the same paint as a bird on the water wears
    const sky = meshes[0]!.material as THREE.MeshStandardMaterial, water = materialFor(getSpec('mallar3'), 'male')
    expect(sky).not.toBe(water)
    expect(sky.map).toBe(water.map)
    expect(sky.emissiveMap).toBe(water.map)
    expect(sky.emissiveIntensity).toBe(SKY_LIGHT)
    expect(water.emissiveIntensity * water.emissive.r).toBe(0)
    expect(f.radius).toBeGreaterThan(0.1)
  })

  it('puts each member where it is told, in its own pose, and is aimed at the member itself', () => {
    const f = buildDetailedFlock(getSpec('mallar3'), ['male', 'female'])
    const pose = defaultPose()
    pose.wingSpread = 1
    pose.wingPhase = 0.25
    f.setMember(0, 1, 2, 3, 0.5, pose)
    pose.wingPhase = 0.75
    f.setMember(1, 10, 20, 30, 0, pose)
    f.commit()
    const [a, b] = f.object.children as [THREE.Group, THREE.Group]
    expect(a.position.toArray()).toEqual([1, 2, 3])
    expect(a.rotation.y).toBe(0.5)
    expect(b.position.toArray()).toEqual([10, 20, 30])
    expect(f.target(1)!.group).toBe(b)
    const wing = (m: THREE.SkinnedMesh) => m.skeleton.bones.find(x => x.name === 'wingR')!.rotation.x
    const [ma, mb] = skinned(f) as [THREE.SkinnedMesh, THREE.SkinnedMesh]
    expect(wing(ma)).toBeCloseTo(-wing(mb), 9)
    expect(wing(ma)).not.toBe(0)
  })

  it('disposes of the one mesh once', () => {
    const f = buildDetailedFlock(getSpec('mallar3'), ['male', 'female'])
    const g = skinned(f)[0]!.geometry
    let disposed = 0
    g.addEventListener('dispose', () => { disposed++ })
    f.dispose()
    expect(disposed).toBe(1)
  })
})

describe('buildFlock', () => {
  it('flies a detailed species as skinned birds and a block species as instances', () => {
    expect(buildFlock(getSpec('mallar3'), ['male', 'male']).target(0)).not.toBeNull()
    const geese = buildFlock(getSpec('cangoo'), [undefined, undefined, undefined])
    expect(geese.target(0)).toBeNull()
    expect(geese.count).toBe(3)
    expect(instanced(geese).length).toBeGreaterThanOrEqual(8)
  })
})
