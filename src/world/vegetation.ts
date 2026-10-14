import * as THREE from 'three'
import type { ScatterPoint } from './scatter'
import { GUST_FRONT_GLSL, gustFront, type Wind } from './wind'
import type { WorldModule } from './scene'

const swayChunk = /* glsl */ `
  uniform vec2 uWindDir; uniform float uWindStrength; uniform float uWindGust; uniform float uTime;
  attribute float aPhase;
  attribute float aTint;
  varying float vTint;
${GUST_FRONT_GLSL}
`

const swayVertex = /* glsl */ `
  vTint = aTint;
  vec4 worldPos = instanceMatrix * vec4(transformed, 1.0);
  float t = clamp(position.y / 1.0, 0.0, 1.0);           // 0 at root, 1 at tip (blade height is 1 before instance scale)
  float bend = t * t;
  // Gust front travels downwind across the bed
  float front = gustFront(worldPos.xz, aPhase);
  float wind = uWindStrength * (0.5 + 0.5 * uWindGust * front);
  float flutter = sin(uTime * 3.0 + aPhase) * 0.05 * (0.3 + wind);
  vec2 lean = uWindDir * (wind * 0.9 * bend) + vec2(flutter * bend);
  transformed.xz += lean;
  transformed.y -= length(lean) * 0.35 * bend;
`

function bladeGeometry(height: number, width: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(width, height, 1, 4)
  g.translate(0, height / 2, 0)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / height
    pos.setX(i, pos.getX(i) * (1 - t * 0.85))   // taper to the tip
  }
  g.computeVertexNormals()
  return g
}

function makeMaterial(wind: Wind, base: THREE.Color, alt: THREE.Color): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.9, side: THREE.DoubleSide })
  mat.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, wind.uniforms, { uAlt: { value: alt } })
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + swayChunk)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + swayVertex)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uAlt; varying float vTint;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( mix(diffuse, uAlt, vTint), opacity );')
  }
  return mat
}

function instanced(points: ScatterPoint[], geo: THREE.BufferGeometry, mat: THREE.Material, heightScale: number): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geo, mat, points.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const s = new THREE.Vector3()
  const p = new THREE.Vector3()
  const phase = new Float32Array(points.length)
  const tint = new Float32Array(points.length)
  points.forEach((pt, i) => {
    p.set(pt.x, pt.y, pt.z)
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), pt.phase)
    s.set(pt.scale, pt.scale * heightScale, pt.scale)
    m.compose(p, q, s)
    mesh.setMatrixAt(i, m)
    phase[i] = pt.phase
    tint[i] = pt.tint
  })
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1))
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return mesh
}

/**
 * The reed bed's cattail leaves: narrow blades twisted into a loose helix, fanned from their shoots. They keep the
 * old reeds' sway (lean downwind in the gust front, flutter), now in world metres downwind rather than each blade's
 * own frame. Laid out by reedbed.ts.
 */
export const LEAF = {
  /**
   * the old reeds' sway: the tip leans `lean` times the wind's strength downwind (0.16-0.32 m in the scene's 0.35),
   * in proportion to the height up the blade squared, and flutters `flutter` × (0.3 + wind) at `flutterRate` rad/s;
   * the tip drops `drop` times its lean for each metre of blade, as the old blades' did
   */
  lean: 0.9,
  flutter: 0.05,
  flutterRate: 3.0,
  drop: 0.35,
  /** the blade narrows to 0.15 of its base's width at the tip, as the old blades did, over `segments` rows */
  taper: 0.85,
  segments: 6,
  /** the bed's lower blades in each other's shade: the colour at the bed, a share of the full, full by this share of the blade (by eye) */
  shade: { base: 0.45, by: 0.6 },
} as const

/** a leaf: its base, its turn about the vertical, its width at the base and length (m), its twist and outward tilt (radians) */
export interface Leaf {
  x: number
  y: number
  z: number
  yaw: number
  width: number
  length: number
  twist: number
  tilt: number
  /** staggers its gust front and flutter */
  phase: number
  color: THREE.Color
}

/** the blade's width at `t` of the way up it */
export function leafWidthAt(leaf: Pick<Leaf, 'width'>, t: number): number {
  return leaf.width * (1 - LEAF.taper * t * t)
}

const leafChunk = /* glsl */ `
  uniform vec2 uWindDir; uniform float uWindStrength; uniform float uWindGust; uniform float uTime;
  attribute vec4 aBlade;
  attribute float aPhase;
  vec3 leafPos;
  vec3 leafNrm;
${GUST_FRONT_GLSL}
  void leafBend() {
    float t = position.y;
    float w = aBlade.x * (1.0 - ${LEAF.taper.toFixed(2)} * t * t);
    float tw = aBlade.z * t;
    float ct = cos(tw), st = sin(tw);
    float cb = cos(aBlade.w), sb = sin(aBlade.w);
    // the blade's width, twisted about its length and tilted out of the upright about z with it
    vec3 across = vec3(ct * cb, ct * sb, -st);
    leafNrm = vec3(st * cb, st * sb, ct);
    vec3 p = vec3(-sb, cb, 0.0) * (t * aBlade.y) + across * (position.x * w);
    float bend = t * t;
    float front = gustFront(instanceMatrix[3].xz, aPhase);
    float wind = uWindStrength * (0.5 + 0.5 * uWindGust * front);
    float flutter = sin(uTime * ${LEAF.flutterRate.toFixed(2)} + aPhase) * ${LEAF.flutter.toFixed(3)} * (0.3 + wind);
    vec2 lean = uWindDir * (wind * ${LEAF.lean.toFixed(2)} * bend);
    // downwind in the world, into the leaf's own frame (its instance matrix a turn about the vertical)
    vec3 leanL = vec3(lean.x, 0.0, lean.y) * mat3(instanceMatrix);
    p.xz += leanL.xz + vec2(flutter * bend);
    p.y -= length(lean) * ${LEAF.drop.toFixed(2)} * aBlade.y * bend;
    leafPos = p;
  }
`

/**
 * The leaf shader's sway, in TypeScript: the world offset of the point `t` of the way up a leaf of `length` metres
 * standing at (x, z), turned `yaw` about the vertical, from where it would stand in still air.
 */
export function leafSway(t: number, length: number, x: number, z: number, yaw: number, phase: number,
  wind: { dir: { x: number; y: number }; strength: number; gust: number; time: number }): { x: number; y: number; z: number } {
  const bend = t * t
  const front = gustFront(x * wind.dir.x + z * wind.dir.y, wind.time, phase)
  const w = wind.strength * (0.5 + 0.5 * wind.gust * front)
  const flutter = Math.sin(wind.time * LEAF.flutterRate + phase) * LEAF.flutter * (0.3 + w)
  const lx = wind.dir.x * w * LEAF.lean * bend, lz = wind.dir.y * w * LEAF.lean * bend
  // the flutter is in the leaf's frame: turned by its yaw into the world (THREE.Matrix4.makeRotationY)
  const f = flutter * bend, c = Math.cos(yaw), s = Math.sin(yaw)
  return { x: lx + c * f + s * f, y: -Math.hypot(lx, lz) * LEAF.drop * length * bend, z: lz - s * f + c * f }
}

function leafGeometry(): THREE.BufferGeometry {
  const n = LEAF.segments
  const pos: number[] = [], nrm: number[] = [], idx: number[] = []
  for (let i = 0; i <= n; i++) {
    pos.push(-0.5, i / n, 0, 0.5, i / n, 0)
    nrm.push(0, 0, 1, 0, 0, 1)
    if (i < n) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 2, 2 * i + 1, 2 * i + 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
  g.setIndex(idx)
  return g
}

/** the leaves, one instanced draw, shaped and swayed in the vertex shader; their shadows sway with them */
export function createReedLeaves(leaves: readonly Leaf[], wind: Wind): WorldModule & { object: THREE.InstancedMesh } {
  const geo = leafGeometry()
  const blade = new Float32Array(leaves.length * 4)
  const phase = new Float32Array(leaves.length)
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide })
  mat.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, wind.uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + leafChunk + '\nvarying float vLeafT;')
      .replace('#include <beginnormal_vertex>', 'leafBend();\nvec3 objectNormal = leafNrm;\nvLeafT = position.y;')
      .replace('#include <begin_vertex>', 'vec3 transformed = leafPos;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vLeafT;')
      .replace('#include <color_fragment>', `#include <color_fragment>\n  diffuseColor.rgb *= mix(${LEAF.shade.base.toFixed(2)}, 1.0, smoothstep(0.0, ${LEAF.shade.by.toFixed(2)}, vLeafT));`)
  }
  mat.customProgramCacheKey = () => 'reed-leaves'
  const depth = new THREE.MeshDepthMaterial()
  depth.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, wind.uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + leafChunk)
      .replace('#include <begin_vertex>', 'leafBend();\nvec3 transformed = leafPos;')
  }
  depth.customProgramCacheKey = () => 'reed-leaves-depth'
  const mesh = new THREE.InstancedMesh(geo, mat, leaves.length)
  const m = new THREE.Matrix4()
  leaves.forEach((l, i) => {
    m.makeRotationY(l.yaw).setPosition(l.x, l.y, l.z)
    mesh.setMatrixAt(i, m)
    mesh.setColorAt(i, l.color)
    blade.set([l.width, l.length, l.twist, l.tilt], i * 4)
    phase[i] = l.phase
  })
  geo.setAttribute('aBlade', new THREE.InstancedBufferAttribute(blade, 4))
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))
  mesh.customDepthMaterial = depth
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return { object: mesh, update() {} }
}

/**
 * Grass: blades `height` metres tall at their mean scale (the near bank's, half a metre) and `width` wide at the root;
 * a grazed lawn's are a few centimetres.
 */
export function createGrass(points: ScatterPoint[], wind: Wind, { height = 0.5, width = 0.05 }: { height?: number; width?: number } = {}): WorldModule & { object: THREE.InstancedMesh } {
  const mat = makeMaterial(wind, new THREE.Color('#5f7a2e'), new THREE.Color('#9a9448'))
  const object = instanced(points, bladeGeometry(1, width), mat, height)
  return { object, update() {} }
}
