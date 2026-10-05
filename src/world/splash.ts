import * as THREE from 'three'
import type { Rng } from '../catalog/types'
import type { WorldModule } from './scene'
import type { ScenePalette } from './palette'
import { NO_REFLECT } from './mirror'

/**
 * Spray where a bird goes into the water (research 2026-09-30-kingfisher-flight-and-plunge.md sections 6.3-6.5): a
 * crown of droplets thrown up and out from the cavity's mouth, falling back under gravity and the air's drag, and a
 * white burst of foam at the water. Size 1 is a Belted Kingfisher's plunge, the one splash the research sizes; a spray
 * of `size` throws `size` times the droplets, and its crown rises about `size` times as high (the launch speed goes as
 * its square root) over a burst `size` times the area.
 *
 * The heights, spread, and droplets' life are the research's two valley photos, by eye, matched by ballistic droplets
 * with drag (Computed). The droplet count, sizes, the mouth, the launch angles, and the foam are estimates. The
 * research's Worthington jet (a thin column at 0.12 s, marked optional and an estimate) is left out.
 */
export const SPRAY = {
  /** droplets in a size-1 spray: 60-120 (estimate, a render count) */
  drops: 120,
  /** the radius of the cavity's mouth, where the droplets leave from, m: 0.04-0.08 (estimate) */
  mouth: [0.04, 0.08],
  /** launch speed, m/s: 2-4, about half the entry speed (Computed against the photos' heights) */
  speed: [2, 4],
  /**
   * launch angle above the horizontal, degrees: 60-85 in the research (estimate). Below 65 a 4 m/s droplet lands 0.9-1.1
   * m out, past the photos' sheets (0.4-0.9 m across), so the crown starts at 65
   */
  elevation: [65, 85],
  /** droplet diameter, m: 1-3 mm (estimate) */
  diameter: [0.001, 0.003],
  /** a sphere's drag coefficient at the droplets' Reynolds numbers, a few hundred */
  drag: 0.5,
  /** the white burst: 0.15-0.3 m across, at its brightest at 0.1 s, gone over 0.8-1.2 s (estimates) */
  foam: { radius: [0.075, 0.15], peak: 0.1, life: 1 },
} as const

/** A spray's droplets are down within 0.8 s and its foam gone in 1 s, so a few at once is plenty (research section 11.7). */
export const MAX_SPRAYS = 4

/**
 * Every droplet is drawn at least this many pixels across: through binoculars at 30 m a real one is smaller than a pixel
 * (research section 6.4). The spec asks for at least 1; at 1 the 120 drawn droplets read in the game as a few faint
 * sparkles on the water, where a real crown, of far more droplets, reads as a white burst, so 2 (by eye).
 */
export const MIN_DROP_PX = 2

const G = 9.81
const AIR = 1.225
const WATER = 998
/** the integration step; a frame's dt is cut into steps no longer than this */
const STEP = 1 / 120
const DEG = Math.PI / 180

export interface Droplet {
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
  /** diameter, m */
  readonly d: number
  /** the highest it has been, m */
  peak: number
}

export interface Spray {
  readonly x: number
  readonly z: number
  readonly size: number
  age: number
  readonly foamRadius: number
  /** the droplets still in the air; one leaves the list when it comes back down to the water */
  drops: Droplet[]
}

/**
 * How long a spray lasts: its foam's life, or longer for a big spray whose droplets are still up (a droplet thrown at
 * the fastest and steepest, without drag, comes down after 2 v sin(elevation) / g).
 */
export function sprayLife(s: Pick<Spray, 'size'>): number {
  const vy = SPRAY.speed[1] * Math.sqrt(s.size) * Math.sin(SPRAY.elevation[1] * DEG)
  return Math.max(SPRAY.foam.life, 2 * vy / G)
}

const smooth = (t: number) => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c) }

/** the white burst's strength, 0..1, `age` seconds after the bird went in */
export function foamAt(age: number): number {
  const { peak, life } = SPRAY.foam
  if (age <= 0 || age >= life) return 0
  return age < peak ? smooth(age / peak) : 1 - smooth((age - peak) / (life - peak))
}

/** pixels across per radian of view, near the middle of a view `heightPx` tall under a vertical field of `fovDeg` */
export function pixelsPerRadian(fovDeg: number, heightPx: number): number {
  return heightPx / (2 * Math.tan(fovDeg * DEG / 2))
}

/** how many pixels across a droplet of `diameter` is drawn at `distance` (the shader's own sum) */
export function dropletPixels(diameter: number, distance: number, pxPerRad: number): number {
  return Math.max(MIN_DROP_PX, diameter * pxPerRad / distance)
}

export class SplashBuffer {
  private list: Spray[] = []
  constructor(private readonly rng: Rng, readonly max: number = MAX_SPRAYS) {}

  get sprays(): readonly Spray[] { return this.list }

  /** Start a spray at (x, z) on the water; when full, make room by dropping the one nearest the end of its own life. */
  spawn(x: number, z: number, size = 1): void {
    if (this.list.length >= this.max) {
      const used = (s: Spray) => s.age / sprayLife(s)
      let worn = 0
      this.list.forEach((s, i) => { if (used(s) > used(this.list[worn]!)) worn = i })
      this.list.splice(worn, 1)
    }
    const between = ([lo, hi]: readonly [number, number]) => lo + this.rng() * (hi - lo)
    const scale = Math.sqrt(size)
    const drops: Droplet[] = []
    for (let i = Math.max(1, Math.round(SPRAY.drops * size)); i > 0; i--) {
      const around = this.rng() * Math.PI * 2
      const r = between(SPRAY.mouth) * scale
      // Most of the water leaves slower than the sheet's thin tip (research section 6.4), so the speeds crowd the low
      // end; the tip, the fastest, goes up the steepest, so the crown stands up rather than spreading wide (estimate).
      const fast = this.rng() ** 2
      const v = (SPRAY.speed[0] + (SPRAY.speed[1] - SPRAY.speed[0]) * fast) * scale
      const up = (SPRAY.elevation[0] + (SPRAY.elevation[1] - SPRAY.elevation[0]) * (fast + this.rng()) / 2) * DEG
      const cx = Math.cos(around), cz = Math.sin(around)
      drops.push({
        x: x + cx * r, y: 0, z: z + cz * r,
        vx: cx * v * Math.cos(up), vy: v * Math.sin(up), vz: cz * v * Math.cos(up),
        d: between(SPRAY.diameter), peak: 0,
      })
    }
    this.list.push({ x, z, size, age: 0, foamRadius: between(SPRAY.foam.radius) * scale, drops })
  }

  update(dt: number): void {
    const steps = Math.max(1, Math.ceil(dt / STEP))
    const h = dt / steps
    for (const s of this.list) {
      s.age += dt
      for (const p of s.drops) {
        // quadratic drag: a = -k |v| v, with k = 3 rho_air C_D / (4 rho_water d) for a sphere of water
        const k = 3 * AIR * SPRAY.drag / (4 * WATER * p.d)
        for (let i = 0; i < steps; i++) {
          const speed = Math.hypot(p.vx, p.vy, p.vz)
          p.vx -= k * speed * p.vx * h
          p.vy -= (G + k * speed * p.vy) * h
          p.vz -= k * speed * p.vz * h
          p.x += p.vx * h; p.y += p.vy * h; p.z += p.vz * h
        }
        p.peak = Math.max(p.peak, p.y)
      }
      s.drops = s.drops.filter(p => p.y > 0)
    }
    this.list = this.list.filter(s => s.age < sprayLife(s))
  }

  /**
   * The droplets in the air, packed for drawing: each one's position, diameter, and how much of it shows (1 while it
   * rises, fading as it falls, to 0.3 at the water). Returns how many were packed, no more than the arrays hold.
   */
  packDrops(position: Float32Array, diameter: Float32Array, alpha: Float32Array): number {
    const cap = Math.min(diameter.length, alpha.length, Math.floor(position.length / 3))
    let n = 0
    for (const s of this.list) {
      for (const p of s.drops) {
        if (n >= cap) return n
        position[n * 3] = p.x; position[n * 3 + 1] = p.y; position[n * 3 + 2] = p.z
        diameter[n] = p.d
        alpha[n] = p.vy > 0 ? 1 : 0.3 + 0.7 * Math.min(1, p.y / Math.max(p.peak, 1e-6))
        n++
      }
    }
    return n
  }
}

const dropVert = /* glsl */ `
attribute float aDiameter;
attribute float aAlpha;
uniform float uPxPerRad;
varying float vAlpha;
#include <fog_pars_vertex>
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = max(${MIN_DROP_PX.toFixed(1)}, aDiameter * uPxPerRad / -mvPosition.z);
  vAlpha = aAlpha;
  #include <fog_vertex>
}`

// a droplet catches the sky and the sun: drawn as a round point, soft at its edge when it is bigger than a few pixels
const dropFrag = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
#include <fog_pars_fragment>
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = vAlpha * (1.0 - smoothstep(0.7, 1.0, r));
  if (a <= 0.0) discard;
  gl_FragColor = vec4(uColor, a);
  #include <fog_fragment>
}`

const foamVert = /* glsl */ `
attribute float aFoam;
attribute float aSeed;
varying vec2 vUv;
varying float vFoam;
varying float vSeed;
#include <fog_pars_vertex>
void main() {
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv * 2.0 - 1.0;
  vFoam = aFoam;
  vSeed = aSeed;
  #include <fog_vertex>
}`

// a lumpy white disc, brightest at its middle, its rim broken by a few lobes so it doesn't read as a drawn circle
const foamFrag = /* glsl */ `
uniform vec3 uColor;
varying vec2 vUv;
varying float vFoam;
varying float vSeed;
#include <fog_pars_fragment>
void main() {
  float r = length(vUv);
  float a = atan(vUv.y, vUv.x);
  float rim = 0.8 + 0.12 * sin(a * 5.0 + vSeed) + 0.08 * sin(a * 9.0 - vSeed * 2.3);
  float k = vFoam * (1.0 - smoothstep(rim * 0.45, rim, r));
  if (k <= 0.0) discard;
  gl_FragColor = vec4(uColor, k * 0.9);
  #include <fog_fragment>
}`

/**
 * The sprays drawn: the droplets as points, each at least `MIN_DROP_PX` across, and the white burst as a disc on the
 * water. Neither is in the mirror (the water reflects no birds or spray yet), and both draw after the water, which is
 * transparent. Colours are written out unconverted, as the water's and the sky's are; set by eye.
 */
export function createSplash(buffer: SplashBuffer, palette: ScenePalette): WorldModule & { object: THREE.Group } {
  const object = new THREE.Group()
  const cap = buffer.max * SPRAY.drops * 2
  const position = new Float32Array(cap * 3), diameter = new Float32Array(cap), alpha = new Float32Array(cap)
  const geometry = new THREE.BufferGeometry()
  const attr = (a: Float32Array, n: number) => new THREE.BufferAttribute(a, n).setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('position', attr(position, 3))
  geometry.setAttribute('aDiameter', attr(diameter, 1))
  geometry.setAttribute('aAlpha', attr(alpha, 1))
  geometry.setDrawRange(0, 0)
  const sky = new THREE.Color(palette.skyHorizon).lerp(new THREE.Color(palette.skyTop), 0.3)
  const dropMat = new THREE.ShaderMaterial({
    uniforms: {
      uPxPerRad: { value: 1000 },
      // a droplet shows the sky and a glint of the sun, and a crown of them reads white: on the bright, grey water seen
      // through the telescope, the sky's own colour hardly stood out (by eye)
      uColor: { value: sky.clone().lerp(new THREE.Color('#ffffff'), 0.5).lerp(new THREE.Color(palette.sun), 0.2).multiplyScalar(1.1) },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    },
    vertexShader: dropVert, fragmentShader: dropFrag, fog: true, transparent: true, depthWrite: false,
  })
  const points = new THREE.Points(geometry, dropMat)
  points.frustumCulled = false                 // the droplets move every frame; the bounds would never be current
  const size = new THREE.Vector2()
  points.onBeforeRender = (renderer, _scene, camera) => {
    renderer.getDrawingBufferSize(size)
    dropMat.uniforms.uPxPerRad!.value = pixelsPerRadian((camera as THREE.PerspectiveCamera).fov, size.y)
  }

  const foamGeometry = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2)
  const foamAlpha = new THREE.InstancedBufferAttribute(new Float32Array(buffer.max), 1).setUsage(THREE.DynamicDrawUsage)
  const foamSeed = new THREE.InstancedBufferAttribute(new Float32Array(buffer.max), 1).setUsage(THREE.DynamicDrawUsage)
  foamGeometry.setAttribute('aFoam', foamAlpha)
  foamGeometry.setAttribute('aSeed', foamSeed)
  const foamMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#ffffff').lerp(new THREE.Color(palette.sun), 0.15) },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    },
    vertexShader: foamVert, fragmentShader: foamFrag, fog: true, transparent: true, depthWrite: false,
  })
  const foam = new THREE.InstancedMesh(foamGeometry, foamMat, buffer.max)
  foam.count = 0
  foam.frustumCulled = false
  const m = new THREE.Matrix4()

  for (const part of [points, foam]) {
    part.layers.set(NO_REFLECT)
    part.renderOrder = 1
    object.add(part)
  }

  return {
    object,
    update(dt) {
      buffer.update(dt)
      const n = buffer.packDrops(position, diameter, alpha)
      geometry.setDrawRange(0, n)
      for (const name of ['position', 'aDiameter', 'aAlpha']) geometry.getAttribute(name).needsUpdate = true
      buffer.sprays.forEach((s, i) => {
        // a hair above the water, which is flat at y = 0
        m.makeScale(s.foamRadius, 1, s.foamRadius).setPosition(s.x, 0.003, s.z)
        foam.setMatrixAt(i, m)
        foamAlpha.setX(i, foamAt(s.age))
        foamSeed.setX(i, (s.x * 12.9898 + s.z * 78.233) % 6.2832)
      })
      foam.count = buffer.sprays.length
      foam.instanceMatrix.needsUpdate = true
      foamAlpha.needsUpdate = true
      foamSeed.needsUpdate = true
    },
  }
}
