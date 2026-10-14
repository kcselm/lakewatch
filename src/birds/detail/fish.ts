import * as THREE from 'three'

/**
 * A fish's depth, back to belly at its deepest, as a fraction of its length: the research's prop is 80 mm long and
 * about 15 mm deep (docs/research/2026-09-30-belted-kingfisher.md, sections 7.1 and 9; an Estimate there).
 */
export const FISH_DEPTH = 15 / 80
/** its width across, as a fraction of its depth: a small sunfish, perch, or minnow is flattened side to side (by eye) */
const FISH_WIDTH = 0.45
/**
 * Where the bill grips it: this fraction of its length ahead of its middle, toward its head. A kingfisher takes a
 * fish "with a lightning-like thrust aimed a little ahead of the middle of the body" (Salyer & Lagler 1946, in the
 * research, section 7.1); how far ahead is set by eye.
 */
export const FISH_GRIP = 0.1
/** and where on the bill: this fraction of the culmen back from the tip, between the mandibles (by eye) */
export const FISH_HOLD = 0.1

/** the body's half-depth along it, from the snout (0) to where the tail fin starts (1), as a fraction of the deepest (by eye) */
const BODY: readonly (readonly [number, number])[] = [
  [0, 0.06], [0.05, 0.45], [0.15, 0.8], [0.35, 1], [0.6, 0.8], [0.85, 0.38], [1, 0.26],
]
/** the body runs from the snout at x = 0.5 back to the tail fin's root here; the fin, forked, on to x = −0.5 */
const FIN_ROOT = -0.37
/** the fin's fork: its tips' half-spread, as a fraction of the deepest half-depth, and how far forward the notch comes */
const FIN_SPREAD = 0.95
const FIN_NOTCH = -0.44
/** the fin's thickness, a fraction of the length */
const FIN_THICK = 0.004
const RADIAL = 10

/** Olive above, silvery on the sides, white below, the fins olive-grey: a fish of a valley lake (the research's "silvery olive"). */
const BACK = new THREE.Color('#4f5a37'), SIDE = new THREE.Color('#b4bba9'), BELLY = new THREE.Color('#e4e2d6')
const FIN = new THREE.Color('#7d8268')

let shared: { geometry: THREE.BufferGeometry; material: THREE.Material } | null = null

/**
 * One fish shape for every bird that holds one, built the first time one is asked for: a unit length along +x, its
 * head at x = 0.5, its back up (+y), centred on its middle. Its colours are painted on its vertices, so it needs no
 * atlas of its own.
 */
function fishShape(): { geometry: THREE.BufferGeometry; material: THREE.Material } {
  if (shared) return shared
  const pos: number[] = [], col: number[] = [], index: number[] = []
  const vertex = (x: number, y: number, z: number, c: THREE.Color) => {
    pos.push(x, y, z); col.push(c.r, c.g, c.b)
    return pos.length / 3 - 1
  }
  const deepest = FISH_DEPTH / 2
  // the body: elliptical sections from the snout back to the tail fin's root, capped at both ends
  const rings: number[][] = []
  for (const [u, h] of BODY) {
    const x = 0.5 - u * (0.5 - FIN_ROOT)
    const ring: number[] = []
    for (let j = 0; j < RADIAL; j++) {
      const th = (j / RADIAL) * Math.PI * 2       // 0 on its back, going round to its right side (+z)
      const c = Math.cos(th)
      const shade = c > 0 ? SIDE.clone().lerp(BACK, c) : SIDE.clone().lerp(BELLY, -c)
      ring.push(vertex(x, c * h * deepest, Math.sin(th) * h * deepest * FISH_WIDTH, shade))
    }
    rings.push(ring)
  }
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const j1 = (j + 1) % RADIAL
      const a = rings[i]![j]!, b = rings[i]![j1]!, c = rings[i + 1]![j1]!, d = rings[i + 1]![j]!
      // wound to face out: round the body toward +z, then back along it
      index.push(a, c, b, a, d, c)
    }
  }
  const snout = vertex(0.5, 0, 0, SIDE), root = vertex(FIN_ROOT, 0, 0, SIDE)
  for (let j = 0; j < RADIAL; j++) {
    const j1 = (j + 1) % RADIAL
    index.push(snout, rings[0]![j]!, rings[0]![j1]!)
    index.push(root, rings.at(-1)![j1]!, rings.at(-1)![j]!)
  }
  // the tail fin: a thin forked plate, a face to each side, from the root's top and bottom out to the fork's tips
  const rootH = BODY.at(-1)![1] * deepest, tipH = FIN_SPREAD * deepest
  for (const side of [1, -1]) {
    const z = (side * FIN_THICK) / 2
    const top = vertex(FIN_ROOT, rootH, z, FIN), bottom = vertex(FIN_ROOT, -rootH, z, FIN)
    const upper = vertex(-0.5, tipH, z, FIN), notch = vertex(FIN_NOTCH, 0, z, FIN), lower = vertex(-0.5, -tipH, z, FIN)
    // each face wound to show on its own side
    const tri = (a: number, b: number, c: number) => (side > 0 ? index.push(a, b, c) : index.push(a, c, b))
    tri(top, upper, notch); tri(top, notch, bottom); tri(bottom, notch, lower)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  shared = { geometry, material: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.15 }) }
  return shared
}

/**
 * A fish `length` metres long, hidden until a bird holds it. Every fish shares one geometry and one material, so a
 * bird's dispose must leave them alone.
 */
export function fishProp(length: number): THREE.Mesh {
  const { geometry, material } = fishShape()
  const fish = new THREE.Mesh(geometry, material)
  fish.name = 'fish'
  fish.scale.setScalar(length)
  fish.castShadow = true
  fish.visible = false
  return fish
}
