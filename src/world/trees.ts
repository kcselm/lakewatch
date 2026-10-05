import * as THREE from 'three'
import type { Heightfield } from './heightfield'
import type { Wind } from './wind'
import type { WorldModule } from './scene'
import type { ScenePalette } from './palette'
import type { Vec3 } from '../location/schema'
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

/** A dead standing tree in the water. `perchPoint` is where a perching bird sits. */
export function createSnag(position: Vec3): { object: THREE.Group; perchPoint: THREE.Vector3 } {
  const group = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: '#8c8478', roughness: 1, flatShading: true })
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 5.5, 6), mat)
  trunk.position.y = 2.75
  trunk.rotation.z = 0.08
  trunk.castShadow = true
  group.add(trunk)
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 2.2, 5), mat)
  branch.position.set(0.9, 3.6, 0)
  branch.rotation.z = -1.1
  branch.castShadow = true
  group.add(branch)
  const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 1.3, 5), mat)
  stub.position.set(-0.5, 4.4, 0.2)
  stub.rotation.z = 0.9
  group.add(stub)
  group.position.set(position[0], position[1], position[2])
  const perchPoint = new THREE.Vector3(position[0] + 1.7, position[1] + 4.25, position[2])
  return { object: group, perchPoint }
}

/**
 * Drowned stumps standing in the water, where cormorants perch: each a weathered trunk from the bed (`ground`) up out of
 * the water, flat-topped where it broke, around `center`. `perches` are their tops' middles, one per stump, in STUMPS'
 * order.
 */
export const STUMPS: { dx: number; dz: number; top: number; radius: number }[] = [
  // offsets from the zone's point, metres; the top's height above the water; the trunk's radius at the top
  { dx: 0, dz: 0, top: 0.9, radius: 0.16 },
  { dx: 1.7, dz: 0.8, top: 1.4, radius: 0.2 },
  { dx: -1.4, dz: 1.3, top: 0.55, radius: 0.13 },
  { dx: 0.8, dz: -1.6, top: 1.15, radius: 0.17 },
]

/** The stumps' perches round `center`, in STUMPS' order, without building them (for the spawner's tests). */
export function stumpPerches(center: Vec3): Vec3[] {
  return STUMPS.map(s => [center[0] + s.dx, s.top, center[2] + s.dz] as Vec3)
}

export function createStumps(center: Vec3, ground: (x: number, z: number) => number): { object: THREE.Group; perches: THREE.Vector3[] } {
  const group = new THREE.Group()
  // weathered wood, darker than the snag where the water has kept it wet
  const mat = new THREE.MeshStandardMaterial({ color: '#5f5a52', roughness: 1, flatShading: true })
  const rng = makeRng(53)
  const perches: THREE.Vector3[] = []
  STUMPS.forEach((s, i) => {
    const x = center[0] + s.dx, z = center[2] + s.dz
    const bed = Math.min(ground(x, z), -0.2)
    const height = s.top - bed
    // wider toward the bed, its sides uneven: each ring of the trunk pushed in or out a little, the top's flat
    const geometry = new THREE.CylinderGeometry(s.radius, s.radius * 1.5, height, 9, 6)
    const pos = geometry.getAttribute('position') as THREE.BufferAttribute
    const bumps = Array.from({ length: 9 * 7 }, () => 0.8 + 0.35 * rng())
    for (let k = 0; k < pos.count; k++) {
      const vx = pos.getX(k), vz = pos.getZ(k), r = Math.hypot(vx, vz)
      if (r < 1e-6) continue
      const a = Math.round(((Math.atan2(vz, vx) + Math.PI) / (2 * Math.PI)) * 9) % 9
      const ring = Math.round(((pos.getY(k) + height / 2) / height) * 6)
      const f = bumps[ring * 9 + a]!
      pos.setX(k, vx * f); pos.setZ(k, vz * f)
    }
    geometry.computeVertexNormals()
    const trunk = new THREE.Mesh(geometry, mat)
    trunk.position.set(x, bed + height / 2, z)
    trunk.rotation.y = i * 1.3
    trunk.castShadow = true
    group.add(trunk)
    // a broken-off side branch on the taller two, standing a little out of the trunk below the top
    if (s.top > 1) {
      const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, 0.3, 5), mat)
      stub.position.set(x + Math.cos(i * 1.3) * s.radius, s.top - 0.4, z - Math.sin(i * 1.3) * s.radius)
      stub.rotation.set(0, i * 1.3, -1.0)
      group.add(stub)
    }
    perches.push(new THREE.Vector3(x, s.top, z))
  })
  return { object: group, perches }
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
