import * as THREE from 'three'
import { makeRng } from '../catalog/rng'
import type { Rng } from '../catalog/types'
import type { Heightfield } from './heightfield'
import type { Wind } from './wind'
import type { WorldModule } from './scene'
import { createReedLeaves, type Leaf } from './vegetation'
import { BED, PART, cattailShare, createStemField, inBand, layoutStems, stemDims, stemGLSL, type Stem, type StemField, type StemKind } from './stems'

/**
 * The reed bed: cattail leaves, and the stems a blackbird holds, cattail flowering stalks and tules, swayed by the
 * stem field (stems.ts) and drawn bent by the same function. From docs/research/2026-10-13-blackbird-display-and-reeds.md
 * section 5 and the spec's "The reed bed".
 */

/** The leaves (research 5.2 and 5.4). */
export const LEAVES = {
  /** widest blades 10-23 mm when fresh (FNA, research 5.2), the base of each blade */
  width: [0.010, 0.023],
  /**
   * a shoot's inner leaves reach about the spikes' height, 1.8-2.0 m ("distal blades about equaling inflorescence",
   * FNA); its outer ones are shorter, 0.7-0.95 of that, and lean out more (by eye). A flowering shoot's leaves reach
   * 0.82-0.97 of its spike's top, so a bird on the spike stands clear of its own shoot (by eye)
   */
  height: [1.8, 2.0],
  outer: [0.7, 0.95],
  flowering: [0.82, 0.97],
  /** leaves drawn on each shoot: of 7.5-9.1 green on a shoot in the season (Dickerman 1982, research 5.2), thinned */
  perShoot: [4, 7],
  /**
   * leafy shoots a square metre where cattail grows: 10-44 (research 5.2), 30; fewer as tule takes over. With the
   * flowering shoots, about 8000 leaves, three times the old 6 cm blades' count, so the narrower blades still read as
   * a dense bed from the bank (set against the frame rate)
   */
  shootsPerM2: 30,
  /** each blade's twist over its length, radians, either way ("blade twisted into loose helix", FNA; the amount by eye) */
  twist: [0.4, 1.6],
  /** the blade's lean out from its shoot: the inner leaves 0-0.08 rad, the outer to 0.3 (by eye) */
  tilt: { inner: [0, 0.08], outer: [0.1, 0.3] },
  /**
   * late September (research 5.4, photo-measured): yellow-green #9aad5b to yellow-tan #adae67, and a quarter still
   * green, #4a6c35 (the share by eye on the research's photos)
   */
  colors: { yellow: '#9aad5b', tan: '#adae67', green: '#4a6c35' },
  green: 0.25,
} as const

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const range = (rng: Rng, r: readonly [number, number]) => lerp(r[0], r[1], rng())

function leafColor(rng: Rng): THREE.Color {
  const C = LEAVES.colors
  if (rng() < LEAVES.green) return new THREE.Color(C.green).lerp(new THREE.Color(C.yellow), rng() * 0.3)
  return new THREE.Color(C.yellow).lerp(new THREE.Color(C.tan), rng())
}

/** how far a shoot's leaves' bases spread round its centre, metres: their sheaths' width (by eye) */
const SHOOT_SPREAD = 0.03

/**
 * one shoot's fan of leaves at (x, z): `n` blades in two ranks, the inner two the tallest, `top` metres, each on the
 * ground under its own base
 */
function shoot(rng: Rng, ground: (x: number, z: number) => number, x: number, z: number, n: number, top: number, out: Leaf[]): void {
  const fan = rng() * Math.PI
  for (let k = 0; k < n; k++) {
    const inner = k < 2
    // two ranks: alternate sides of the fan, the blades facing across it
    const side = k % 2 === 0 ? 0 : Math.PI
    const lx = x + (rng() - 0.5) * SHOOT_SPREAD, lz = z + (rng() - 0.5) * SHOOT_SPREAD
    out.push({
      x: lx,
      y: ground(lx, lz),
      z: lz,
      yaw: fan + side + (rng() - 0.5) * 0.5,
      width: range(rng, LEAVES.width),
      length: top * (inner ? lerp(0.95, 1, rng()) : range(rng, LEAVES.outer)),
      twist: range(rng, LEAVES.twist) * (rng() < 0.5 ? -1 : 1),
      tilt: range(rng, inner ? LEAVES.tilt.inner : LEAVES.tilt.outer),
      phase: rng() * Math.PI * 2,
      color: leafColor(rng),
    })
  }
}

export interface LeafLayoutOptions {
  heightfield: Heightfield
  ground: (x: number, z: number) => number
  seed?: number
}

/** the bed's leaves: a shoot at each flowering stalk, and leafy shoots over the band where cattail grows */
export function layoutLeaves(stems: readonly Stem[], o: LeafLayoutOptions): Leaf[] {
  const rng = makeRng(o.seed ?? 13)
  const out: Leaf[] = []
  const count = () => LEAVES.perShoot[0] + Math.floor(rng() * (LEAVES.perShoot[1] - LEAVES.perShoot[0] + 1))
  for (const s of stems) {
    if (s.kind !== 'cattail') continue
    shoot(rng, o.ground, s.x, s.z, count(), s.height * range(rng, LEAVES.flowering), out)
  }
  const [x0, x1, z0, z1] = BED.bounds
  const n = Math.round(LEAVES.shootsPerM2 * (x1 - x0) * (z1 - z0))
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, rng()), z = lerp(z0, z1, rng())
    const keep = rng(), k = count(), top = range(rng, LEAVES.height)
    if (!inBand(o.heightfield, x, z) || keep >= cattailShare(o.ground(x, z))) continue
    shoot(rng, o.ground, x, z, k, top, out)
  }
  return out
}

// ----------------------------------------------------------------------------------------------------------------
// The stems' geometry: unit shapes the vertex shader sizes and bends (stemGLSL)

interface Builder { pos: number[]; nrm: number[]; part: number[]; idx: number[] }

/**
 * rings round the stem's axis at heights `sigma` (0..1 along the part) of radius `factor` (of the part's radius),
 * `sides` round, closed at the bottom and top by a point where `capBottom` / `capTop`
 */
function rings(b: Builder, part: number, sides: number, sigma: readonly number[], factor: readonly number[], slope: readonly number[], capBottom: boolean, capTop: boolean): void {
  const first = b.pos.length / 3
  for (let r = 0; r < sigma.length; r++) {
    for (let k = 0; k < sides; k++) {
      const a = k / sides * Math.PI * 2, c = Math.cos(a), s = Math.sin(a)
      b.pos.push(c * factor[r]!, sigma[r]!, s * factor[r]!)
      // the surface's slope along the axis tilts its normal up or down
      const ny = -slope[r]!, len = Math.hypot(1, ny)
      b.nrm.push(c / len, ny / len, s / len)
      b.part.push(part)
    }
  }
  for (let r = 0; r + 1 < sigma.length; r++) {
    for (let k = 0; k < sides; k++) {
      const a0 = first + r * sides + k, a1 = first + r * sides + (k + 1) % sides
      const b0 = a0 + sides, b1 = a1 + sides
      b.idx.push(a0, b0, a1, a1, b0, b1)
    }
  }
  if (capBottom) {
    const c = b.pos.length / 3
    b.pos.push(0, sigma[0]!, 0); b.nrm.push(0, -1, 0); b.part.push(part)
    for (let k = 0; k < sides; k++) b.idx.push(first + k, first + (k + 1) % sides, c)
  }
  if (capTop) {
    const c = b.pos.length / 3, top = first + (sigma.length - 1) * sides
    b.pos.push(0, sigma[sigma.length - 1]!, 0); b.nrm.push(0, 1, 0); b.part.push(part)
    for (let k = 0; k < sides; k++) b.idx.push(top + k, c, top + (k + 1) % sides)
  }
}

function finish(b: Builder): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nrm, 3))
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(b.part, 1))
  g.setIndex(b.idx)
  return g
}

/** rings up a stalk, closer near the top where it bends most */
const STALK_RINGS = [0, 0.2, 0.4, 0.55, 0.68, 0.78, 0.86, 0.92, 0.97, 1]

/**
 * A cattail flowering stalk: the stalk to the spike (6 sides), the spike (8 sides, rounded at its ends, a sixth of
 * its radius in from the ends, by eye), and the bare axis above it (4 sides, narrowing to its tip)
 */
export function cattailGeometry(): THREE.BufferGeometry {
  const b: Builder = { pos: [], nrm: [], part: [], idx: [] }
  const ones = STALK_RINGS.map(() => 1), flat = STALK_RINGS.map(() => 0)
  rings(b, PART.stalk, 6, STALK_RINGS, ones, flat, false, false)
  // rings every eighth of the spike, so a bursting head's cotton puffs out unevenly along it
  const spike = [0, 0.03, 0.09, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.91, 0.97, 1]
  const round = spike.map(s => (s < 0.05 || s > 0.95 ? (s === 0 || s === 1 ? 0.5 : 0.88) : 1))
  const slope = spike.map(s => (s === 0 ? 0.8 : s < 0.05 ? 0.5 : s === 1 ? -0.8 : s > 0.95 ? -0.5 : 0))
  rings(b, PART.spike, 8, spike, round, slope, true, true)
  rings(b, PART.axis, 4, [0, 1], [1, 0.6], [0, 0], false, true)
  return finish(b)
}

/**
 * A tule: its culm to the bract's tip (5 sides), and the spikelet cluster pushed out to one side below the bract:
 * five spikelets 12-20 mm long and 4 mm thick (FNA: 6-24 × 4 mm) on rays fanning up and out, the cluster about 5 cm
 * across (research 8.5: 4-6 cm), drawn at scale 1 and sized by each tule's `rHead`
 */
export function tuleGeometry(): THREE.BufferGeometry {
  const b: Builder = { pos: [], nrm: [], part: [], idx: [] }
  const sigma = [0, 0.15, 0.3, 0.45, 0.6, 0.72, 0.82, 0.9, 0.95, 0.975, 1]
  rings(b, PART.stalk, 5, sigma, sigma.map(() => 1), sigma.map(() => 0), false, true)
  // the spikelets: [angle out from the culm, turn about it, ray length, spikelet length], radians and metres (by eye)
  const spikelets: [number, number, number, number][] = [
    [0.75, 0, 0.012, 0.02], [0.55, 0.5, 0.006, 0.016], [0.95, -0.45, 0.016, 0.017], [0.6, -0.9, 0.01, 0.013], [1.05, 0.8, 0.02, 0.012],
  ]
  for (const [out, turn, ray, len] of spikelets) {
    const dir = new THREE.Vector3(Math.sin(out) * Math.cos(turn), Math.cos(out), Math.sin(out) * Math.sin(turn))
    const side = new THREE.Vector3(0, 1, 0).cross(dir).normalize()
    const up = new THREE.Vector3().crossVectors(dir, side)
    const base = dir.clone().multiplyScalar(ray), tip = dir.clone().multiplyScalar(ray + len)
    const mid = dir.clone().multiplyScalar(ray + len * 0.4)
    const first = b.pos.length / 3
    b.pos.push(base.x, base.y, base.z); b.nrm.push(-dir.x, -dir.y, -dir.z); b.part.push(PART.cluster)
    for (let k = 0; k < 4; k++) {
      const a = k / 4 * Math.PI * 2
      const n = side.clone().multiplyScalar(Math.cos(a)).addScaledVector(up, Math.sin(a))
      const p = mid.clone().addScaledVector(n, 0.002)
      b.pos.push(p.x, p.y, p.z); b.nrm.push(n.x, n.y, n.z); b.part.push(PART.cluster)
    }
    b.pos.push(tip.x, tip.y, tip.z); b.nrm.push(dir.x, dir.y, dir.z); b.part.push(PART.cluster)
    for (let k = 0; k < 4; k++) {
      const m0 = first + 1 + k, m1 = first + 1 + (k + 1) % 4
      b.idx.push(first, m1, m0, m0, m1, first + 5)
    }
  }
  return finish(b)
}

/** a stem material: a MeshStandardMaterial bent by stemGLSL, its colours from it, and its depth twin for the shadows */
function stemMaterials(kind: StemKind): { mat: THREE.MeshStandardMaterial; depth: THREE.MeshDepthMaterial } {
  const glsl = stemGLSL(kind)
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 })
  mat.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n#define STEM_COLOR\n' + glsl)
      .replace('#include <beginnormal_vertex>', 'stemBend();\nvec3 objectNormal = stemUpTo(stemT, stemYaw(normal));')
      .replace('#include <begin_vertex>', 'vec3 transformed = stemP + stemUpTo(stemT, stemOff);')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vStemColor;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( vStemColor, opacity );')
  }
  mat.customProgramCacheKey = () => `reed-stems-${kind}`
  const depth = new THREE.MeshDepthMaterial()
  depth.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + glsl)
      .replace('#include <begin_vertex>', 'stemBend();\nvec3 transformed = stemP + stemUpTo(stemT, stemOff);')
  }
  depth.customProgramCacheKey = () => `reed-stems-${kind}-depth`
  return { mat, depth }
}

/** one kind's stems, one instanced draw; `tops` is the field's top displacements for them, rewritten every frame */
function stemMesh(kind: StemKind, stems: readonly Stem[], tops: Float32Array): THREE.InstancedMesh {
  const geo = kind === 'cattail' ? cattailGeometry() : tuleGeometry()
  const n = stems.length
  const aStem = new Float32Array(n * 4), aRadii = new Float32Array(n * 4), aTone = new Float32Array(n * 3)
  const { mat, depth } = stemMaterials(kind)
  const mesh = new THREE.InstancedMesh(geo, mat, n)
  const m = new THREE.Matrix4()
  stems.forEach((s, i) => {
    const d = stemDims(s)
    mesh.setMatrixAt(i, m.makeTranslation(s.x, s.base, s.z))
    aStem.set([d.H, d.hs, d.axisTop, d.yaw], i * 4)
    aRadii.set([d.r0, d.r1, d.rHead, d.rAxis], i * 4)
    aTone.set(d.tone, i * 3)
  })
  const top = new THREE.InstancedBufferAttribute(tops, 2)
  top.setUsage(THREE.DynamicDrawUsage)
  geo.setAttribute('aTop', top)
  geo.setAttribute('aStem', new THREE.InstancedBufferAttribute(aStem, 4))
  geo.setAttribute('aRadii', new THREE.InstancedBufferAttribute(aRadii, 4))
  geo.setAttribute('aTone', new THREE.InstancedBufferAttribute(aTone, 3))
  mesh.customDepthMaterial = depth
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return mesh
}

export interface ReedBedOptions {
  /** the smooth ground: where it lies within BED.band, the reeds grow */
  heightfield: Heightfield
  /** the rendered ground the reeds stand on (terrainSurface's sample) */
  ground: (x: number, z: number) => number
  wind: Wind
  seed?: number
}

export type ReedBed = WorldModule & {
  object: THREE.Group
  /** the stems a bird holds, swayed every frame by `update` */
  stems: StemField
  leaves: THREE.InstancedMesh
  cattails: THREE.InstancedMesh
  tules: THREE.InstancedMesh
}

/**
 * The reed bed: its leaves, and its cattail stalks and tules, each kind one instanced draw bent in the vertex shader
 * by its top's displacement, which the stem field steps and writes every frame. All of it is in the water's mirror, as
 * the old reeds were, so a bird reflected there keeps its stem.
 */
export function createReedBed(o: ReedBedOptions): ReedBed {
  const seed = o.seed ?? 11
  const stems = layoutStems({ heightfield: o.heightfield, ground: o.ground, seed })
  const field = createStemField(stems)
  const nCattail = stems.filter(s => s.kind === 'cattail').length
  const cattails = stemMesh('cattail', stems.slice(0, nCattail), field.tops.subarray(0, nCattail * 2))
  const tules = stemMesh('tule', stems.slice(nCattail), field.tops.subarray(nCattail * 2))
  const leaves = createReedLeaves(layoutLeaves(stems, { heightfield: o.heightfield, ground: o.ground, seed: seed + 2 }), o.wind)
  const object = new THREE.Group()
  object.name = 'reed-bed'
  object.add(leaves.object, cattails, tules)
  const topsOf = (mesh: THREE.InstancedMesh) => mesh.geometry.getAttribute('aTop') as THREE.InstancedBufferAttribute
  return {
    object,
    stems: field,
    leaves: leaves.object,
    cattails,
    tules,
    update(dt, wind) {
      field.update(dt, wind)
      topsOf(cattails).needsUpdate = true
      topsOf(tules).needsUpdate = true
    },
  }
}
