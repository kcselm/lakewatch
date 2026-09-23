import * as THREE from 'three'
import type { Heightfield } from './heightfield'
import { terrainColor } from './heightfield'
import type { WorldModule } from './scene'

const SIZE = 400
const SEGMENTS = 200

export function createTerrain(hf: Heightfield): WorldModule & { object: THREE.Mesh } {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, -SIZE / 2 + 60)          // player near the front edge, lake ahead
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const step = SIZE / SEGMENTS
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    const y = hf.sample(x, z)
    pos.setY(i, y)
    const dx = (hf.sample(x + step, z) - hf.sample(x - step, z)) / (2 * step)
    const dz = (hf.sample(x, z + step) - hf.sample(x, z - step)) / (2 * step)
    const slope = Math.hypot(dx, dz)
    const [r, g, b] = terrainColor(y, slope)
    colors.set([r, g, b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  return { object: mesh, update() {} }
}
