import * as THREE from 'three'
import { buildBird } from './procedural'
import { buildDetailedBird, type DetailedBirdModel } from './detail/build'
import type { PoseState } from './model'
import type { SpeciesSpec } from './spec'
import type { TargetModel } from './registry'

export interface FlockModel {
  object: THREE.Group
  count: number
  /** bounding radius of one member, for apparent-size math */
  radius: number
  /** each member's plumage version */
  variants: readonly (string | undefined)[]
  /** member i's own model, to aim the optics at; null where the members are instances with no model each (a proxy stands in) */
  target(i: number): TargetModel | null
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
    variants: Array.from({ length: count }, () => variant),
    target: () => null,
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

/**
 * A flock of a detailed species: one skinned bird a member, each in its own version, all sharing the first one's mesh
 * (and, version by version, its painted atlas), so the flock costs one mesh. Each is posed as a bird on the water is.
 */
export function buildDetailedFlock(spec: SpeciesSpec, variants: readonly (string | undefined)[]): FlockModel {
  const object = new THREE.Group()
  object.name = `flock:${spec.code}`
  const members: DetailedBirdModel[] = []
  // one sky-lit material a version, shared by the members that wear it
  const lit = new Map<THREE.Material, THREE.MeshStandardMaterial>()
  for (const variant of variants) {
    const bird = buildDetailedBird(spec, variant, members[0])
    const painted = bird.mesh.material as THREE.MeshStandardMaterial
    if (!lit.has(painted)) lit.set(painted, skyLit(painted))
    bird.mesh.material = lit.get(painted)!
    // a flying bird's wings reach far past the bounds of the bird at rest, which would cull it while they still show
    bird.mesh.frustumCulled = false
    object.add(bird.group)
    members.push(bird)
  }
  return {
    object, count: members.length, radius: members[0]!.radius, variants,
    target: i => members[i]!,
    setMember(i, x, y, z, heading, pose) {
      const bird = members[i]!
      bird.group.position.set(x, y, z)
      bird.group.rotation.y = heading
      bird.pose(pose)
    },
    commit() {},
    dispose() {
      for (const bird of members) bird.dispose()
      for (const m of lit.values()) m.dispose()
    },
  }
}

/**
 * How much of its own colour a bird overhead shows whatever the light: seen from below it is all underside, which the
 * sun never reaches and the ground's light barely does, and a white bird would cross the sky as a black one. Real
 * feathers pass and scatter the sky's light.
 */
export const SKY_LIGHT = 0.3

/** A bird's painted material, for a bird in the sky: the same paint, glowing a little with its own colour. */
function skyLit(painted: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  const m = painted.clone()
  m.emissive = new THREE.Color('#ffffff')
  m.emissiveMap = painted.map
  m.emissiveIntensity = SKY_LIGHT
  return m
}

/** A flock of `variants.length` birds: skinned birds for a detailed species, instances of one block bird for any other. */
export function buildFlock(spec: SpeciesSpec, variants: readonly (string | undefined)[]): FlockModel {
  return spec.detail ? buildDetailedFlock(spec, variants) : buildFlockModel(spec, variants.length, variants[0])
}
