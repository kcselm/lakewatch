import * as THREE from 'three'
import type { Heightfield } from './heightfield'
import { terrainColor } from './heightfield'
import type { WorldModule } from './scene'

const SIZE = 400
const SEGMENTS = 200
const STEP = SIZE / SEGMENTS
/** the mesh is shifted back so the player stands near its front edge, with the lake ahead */
const Z_SHIFT = -SIZE / 2 + 60

export function createTerrain(hf: Heightfield): WorldModule & { object: THREE.Mesh } {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, Z_SHIFT)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const step = STEP
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

/**
 * The height of the rendered terrain at (x, z): the mesh's own flat triangles, not the smooth field they sample every
 * STEP metres. Anything that stands on the ground uses this, so it meets the surface the player sees; the two differ
 * by up to 11 cm where the lake's rim runs through the mudflat.
 */
export function terrainSurface(hf: Heightfield): Heightfield {
  const x0 = -SIZE / 2, z0 = -SIZE / 2 + Z_SHIFT
  const h = (ix: number, iz: number) => hf.sample(x0 + ix * STEP, z0 + iz * STEP)
  return {
    sample(x, z) {
      const gx = (x - x0) / STEP, gz = (z - z0) / STEP
      const ix = Math.min(Math.max(Math.floor(gx), 0), SEGMENTS - 1), iz = Math.min(Math.max(Math.floor(gz), 0), SEGMENTS - 1)
      const u = gx - ix, v = gz - iz
      // PlaneGeometry splits each cell along its (ix, iz+1)-(ix+1, iz) diagonal
      const a = h(ix, iz), b = h(ix, iz + 1), c = h(ix + 1, iz + 1), d = h(ix + 1, iz)
      return u + v <= 1 ? a + u * (d - a) + v * (b - a) : c + (1 - u) * (b - c) + (1 - v) * (d - c)
    },
  }
}
