import * as THREE from 'three'
import type { Heightfield } from './heightfield'
import type { Wind } from './wind'
import type { WorldModule } from './scene'
import type { ScenePalette } from './palette'
import type { Vec3, PerchEntry } from '../location/schema'
import { makeRng } from '../catalog/rng'

const TRUNK = new THREE.MeshStandardMaterial({ color: '#4b3a2a', roughness: 1 })
const CANOPY = ['#4f6a2b', '#5f7a30', '#6d7f2f', '#8a7a2e'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true }))

/** A low-poly deciduous tree: a tapered trunk and 5 to 8 icosahedron canopy blobs. */
export function createTree(x: number, z: number, hf: Heightfield, seed: number, wind: Wind): WorldModule & { object: THREE.Group } {
  const rng = makeRng(seed)
  const group = new THREE.Group()
  const h = 6 + rng() * 5
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.4, h * 0.55, 7), TRUNK)
  trunk.position.y = h * 0.275
  trunk.castShadow = true
  group.add(trunk)
  const canopy = new THREE.Group()
  const blobs = 5 + Math.floor(rng() * 4)
  for (let i = 0; i < blobs; i++) {
    const r = 1.4 + rng() * 1.6
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), CANOPY[Math.floor(rng() * CANOPY.length)]!)
    b.position.set((rng() - 0.5) * 3.2, h * 0.5 + rng() * h * 0.45, (rng() - 0.5) * 3.2)
    b.castShadow = true
    canopy.add(b)
  }
  group.add(canopy)
  group.position.set(x, hf.sample(x, z) - 0.2, z)
  group.rotation.y = rng() * Math.PI * 2
  const phase = rng() * 10
  return {
    object: group,
    update(_dt, w) {
      const sway = w.effective() * 0.025
      canopy.rotation.x = Math.sin(w.state.time * 0.9 + phase) * sway * w.state.dir.y
      canopy.rotation.z = -Math.sin(w.state.time * 0.9 + phase) * sway * w.state.dir.x
    },
  }
}

/** The grey of wood dead and out in the weather: the snag's, and the dead branches'. */
const WEATHERED = '#8c8478'

/**
 * Where a bird's feet grip a branch: on its top, `along` metres along its axis from its middle, at the branch's radius
 * there. The branch is a mesh of a tapered CylinderGeometry; its top is the side facing most nearly up.
 */
function branchTop(branch: THREE.Mesh<THREE.CylinderGeometry>, along: number): { point: THREE.Vector3; radius: number } {
  const { radiusTop, radiusBottom, height } = branch.geometry.parameters
  branch.updateWorldMatrix(true, false)
  const axis = new THREE.Vector3(0, 1, 0).transformDirection(branch.matrixWorld)
  const up = new THREE.Vector3(0, 1, 0).addScaledVector(axis, -axis.y).normalize()
  const radius = radiusBottom + (radiusTop - radiusBottom) * (along / height + 0.5)
  const point = branch.getWorldPosition(new THREE.Vector3()).addScaledVector(axis, along).addScaledVector(up, radius)
  return { point, radius }
}

/**
 * A dead standing tree in the water. `perchPoint` is where a perching bird's feet grip it, on top of its branch, and
 * `perchRadius` the branch's radius there.
 */
export function createSnag(position: Vec3): { object: THREE.Group; perchPoint: THREE.Vector3; perchRadius: number } {
  const group = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: WEATHERED, roughness: 1, flatShading: true })
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 5.5, 6), mat)
  trunk.position.y = 2.75
  trunk.rotation.z = 0.08
  trunk.castShadow = true
  group.add(trunk)
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 2.2, 5), mat)
  branch.name = 'perch'
  branch.position.set(0.9, 3.6, 0)
  branch.rotation.z = -1.1
  branch.castShadow = true
  group.add(branch)
  const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 1.3, 5), mat)
  stub.position.set(-0.5, 4.4, 0.2)
  stub.rotation.z = 0.9
  group.add(stub)
  group.position.set(position[0], position[1], position[2])
  // 0.93 m out from the branch's middle, 1.7 m out from the trunk as the perch always was; it used to float 16 cm
  // above the branch, where a block bird's feet didn't show
  const { point, radius } = branchTop(branch, 0.93)
  return { object: group, perchPoint: point, perchRadius: radius }
}

const DEAD_WOOD = new THREE.MeshStandardMaterial({ color: WEATHERED, roughness: 1, flatShading: true })

/** A tapered limb from `a` to `b`, `ra` thick at a and `rb` at b, low-poly. Its axis runs from a to b. */
function limb(a: THREE.Vector3, b: THREE.Vector3, ra: number, rb: number, sides = 5): THREE.Mesh<THREE.CylinderGeometry> {
  const dir = b.clone().sub(a)
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rb, ra, dir.length(), sides), DEAD_WOOD)
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  mesh.castShadow = true
  return mesh
}

/** How the dead branches lie: how far from the perch to look for the bank, and ground high enough to root in. */
const BANK = { reach: 10, dry: 0.15, sink: 0.2 } as const

/**
 * A dead branch leaning out from the bank over the water, a kingfisher's perch: a limb rooted on the nearest dry ground
 * behind the perch, crooked once, rising to a level twig that runs across the way the perch faces with its top at the
 * perch point. Low-poly and weathered, as the snag is. `root` is where the limb leaves the ground.
 */
export function createDeadBranch(perch: PerchEntry, ground: Heightfield): { object: THREE.Group; perchPoint: THREE.Vector3; root: THREE.Vector3 } {
  const [px, pz] = perch.position
  const f = (perch.facing * Math.PI) / 180
  const ahead = new THREE.Vector3(Math.sin(f), 0, -Math.cos(f))
  const across = new THREE.Vector3(Math.cos(f), 0, Math.sin(f))
  const perchPoint = new THREE.Vector3(px, perch.height, pz)

  // the nearest dry ground behind the bird: out in rings, round the half behind it from straight back outward
  let root: THREE.Vector3 | undefined
  search: for (let d = 0.5; d <= BANK.reach; d += 0.25) {
    for (let a = 0; a <= 80; a += 5) {
      for (const s of a === 0 ? [1] : [1, -1]) {
        const b = f + Math.PI + (s * a * Math.PI) / 180
        const x = px + Math.sin(b) * d, z = pz - Math.cos(b) * d
        const y = ground.sample(x, z)
        if (y >= BANK.dry) { root = new THREE.Vector3(x, y - BANK.sink, z); break search }
      }
    }
  }
  if (!root) throw new Error(`perch ${perch.name}: no bank within ${BANK.reach} m behind it for its dead branch to root in`)

  const group = new THREE.Group()
  // the twig, level, its axis a radius under the perch point; it tapers through the perch, where it is the perch's radius
  const side = Math.sign(root.clone().sub(perchPoint).dot(across)) || 1
  const axisAt = perchPoint.clone().setY(perch.height - perch.radius)
  const inner = axisAt.clone().addScaledVector(across, -0.3 * side)
  const tip = axisAt.clone().addScaledVector(across, 0.3 * side)
  const twig = limb(inner, tip, perch.radius * 1.4, perch.radius * 0.6)
  twig.name = 'perch'
  group.add(twig)
  // the limb from the bank to the twig, crooked a third of the way up, where a broken stub stands off it
  const knee = root.clone().lerp(inner, 0.35).addScaledVector(across, -0.15 * side)
  knee.y += 0.25
  group.add(limb(root, knee, 0.14, 0.085, 6), limb(knee, inner, 0.085, perch.radius * 1.4))
  const stub = knee.clone().add(new THREE.Vector3(0, 0.55, 0)).addScaledVector(across, -0.25 * side).addScaledVector(ahead, -0.15)
  group.add(limb(knee, stub, 0.045, 0.02, 4))
  return { object: group, perchPoint, root }
}

/** Layered silhouettes on the far shore that fade into the fog. */
export function createTreeLine(hf: Heightfield, palette: ScenePalette): WorldModule & { object: THREE.Group } {
  const group = new THREE.Group()
  const rng = makeRng(31)
  const layers = [
    { z: -74, color: '#3f5a3a', count: 60 },
    { z: -86, color: '#4c6552', count: 50 },
    { z: -100, color: mixHex('#4c6552', palette.fog, 0.5), count: 40 },
  ]
  for (const layer of layers) {
    const mat = new THREE.MeshStandardMaterial({ color: layer.color, roughness: 1, flatShading: true })
    for (let i = 0; i < layer.count; i++) {
      const x = -140 + rng() * 280
      const h = 7 + rng() * 9
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2 + rng() * 2.5, h, 6), mat)
      cone.position.set(x, hf.sample(x, layer.z) + h / 2 - 0.5, layer.z + (rng() - 0.5) * 4)
      group.add(cone)
    }
  }
  return { object: group, update() {} }
}

function mixHex(a: string, b: string, t: number): string {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()
}
