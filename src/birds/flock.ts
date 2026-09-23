import * as THREE from 'three'
import { buildBird } from './procedural'
import type { PoseState } from './model'
import type { SpeciesSpec } from './spec'

export interface FlockModel {
  object: THREE.Group
  count: number
  /** bounding radius of one member, for apparent-size math */
  radius: number
  /** pose the template as member i and copy its part matrices into the instances */
  setMember(i: number, x: number, y: number, z: number, heading: number, pose: PoseState): void
  /** flag the instance buffers for upload; call once per frame after the last setMember */
  commit(): void
  dispose(): void
}

/**
 * One InstancedMesh per body part, posed through the procedural template so
 * every member gets exactly the pose() a single bird would, with its own
 * wingbeat phase. Legs are left out: these birds are in the air.
 */
export function buildFlockModel(spec: SpeciesSpec, count: number, variant?: string): FlockModel {
  const template = buildBird(spec, variant)
  template.parts.legs.visible = false
  const object = new THREE.Group()
  object.name = `flock:${spec.code}`
  const pairs: { mesh: THREE.Mesh; inst: THREE.InstancedMesh }[] = []
  const underLegs = (o: THREE.Object3D): boolean => {
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === template.parts.legs) return true
    return false
  }
  template.group.traverse(o => {
    if (!(o instanceof THREE.Mesh) || underLegs(o)) return
    const inst = new THREE.InstancedMesh(o.geometry, o.material, count)
    inst.name = o.name
    inst.castShadow = true
    inst.frustumCulled = false     // members span the sky; the geometry's own bounds would cull them wrongly
    object.add(inst)
    pairs.push({ mesh: o, inst })
  })

  return {
    object, count, radius: template.radius,
    setMember(i, x, y, z, heading, pose) {
      template.pose(pose)
      template.group.position.set(x, y, z)
      template.group.rotation.y = heading
      template.group.updateMatrixWorld(true)     // no parent, so matrixWorld is the flock-local transform we want
      for (const { mesh, inst } of pairs) inst.setMatrixAt(i, mesh.matrixWorld)
    },
    commit() {
      for (const { inst } of pairs) inst.instanceMatrix.needsUpdate = true
    },
    dispose() {
      template.dispose()
      for (const { inst } of pairs) inst.dispose()
    },
  }
}
