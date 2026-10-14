import * as THREE from 'three'
import { makeRng } from '../catalog/rng'
import type { Rng } from '../catalog/types'
import { valueNoise1 } from './noise'
import { WIND_SPEED, gustFront, type Wind } from './wind'
import type { Heightfield } from './heightfield'

/**
 * The reed bed's stems: cattail flowering stalks and tules, each a damped oscillator at its top that the CPU steps
 * every frame, and the shape the whole stem takes from that top's displacement, shared by the vertex shader that draws
 * it and the birds that hold it. From docs/research/2026-10-13-blackbird-display-and-reeds.md, sections 5 (the plants,
 * 5.2-5.4; the stem model, 5.6; spacing, 5.7), 6.4-6.5 (leaving and landing), 8.5, 9 and 10, and the design spec
 * docs/superpowers/specs/2026-10-13-red-winged-blackbird-design.md ("The reed bed"). Each number says where it comes
 * from: sourced, computed, an estimate, or chosen by eye.
 */

export type StemKind = 'cattail' | 'tule'

export interface Stem {
  readonly index: number
  readonly kind: StemKind
  /** world x and z of its base, and the bed's height there (world y of the base) */
  readonly x: number
  readonly z: number
  readonly base: number
  /** the stalk's or culm's length from its base to its top (a cattail's: to the spike's top; the bare axis rises above), metres */
  readonly height: number
  /** a cattail's spike, heights above the base; its radius; the bare axis's top and radius. Undefined for a tule */
  readonly spike?: { readonly bottom: number; readonly top: number; readonly radius: number; readonly axisTop: number; readonly axisRadius: number }
  /** the top's offset from upright at rest, unloaded in still air: a small lean in a random direction, world x and z, metres */
  readonly lean: { readonly x: number; readonly z: number }
  /** the stalk's or culm's own radius at height h above its base, metres (not the spike's) */
  radiusAt(h: number): number
}

export interface StemField {
  readonly stems: readonly Stem[]
  /** the stems whose bases lie within r metres of (x, z), nearest first */
  near(x: number, z: number, r: number): Stem[]
  /** where the stem's axis is now, `h` metres up it from its base (measured along the stem), world space */
  pointAt(stem: Stem, h: number, out?: THREE.Vector3): THREE.Vector3
  /**
   * where the stem's axis would be `h` metres up it with its swing settled: bent by the wind's steady drag and the
   * birds' weight, without the wind's turbulence (what a bird riding it holds its head over)
   */
  restAt(stem: Stem, h: number, out?: THREE.Vector3): THREE.Vector3
  /** the unit direction of the stem's axis now at h, pointing up the stem */
  axisAt(stem: Stem, h: number, out?: THREE.Vector3): THREE.Vector3
  /** the top's displacement from upright now, world x and z, metres (its rest lean included) */
  displacement(stem: Stem): { x: number; z: number }
  /**
   * A bird of `mass` kg takes hold of the stem `h` metres up, arriving with horizontal velocity (vx, vz) m/s (0, 0 for a
   * bird already on it, say climbing from a neighbour): its weight bends the stem by its lean and slows its sway, and
   * its momentum swings it. Returns a hold, to move or let go.
   */
  hold(stem: Stem, mass: number, h: number, vx?: number, vz?: number): number
  /** the hold moves to `h` metres up the same stem (climbing) */
  move(hold: number, h: number): void
  /** the bird lets go, leaving with horizontal velocity (vx, vz): the stem springs back past upright */
  release(hold: number, vx?: number, vz?: number): void
  /** steps every stem's sway by dt seconds under the wind and the birds on it */
  update(dt: number, wind: Wind): void
}

/** gravity, m/s², and the air's density, kg/m³ (the research's standard physics, section 5.6) */
const G = 9.81
const RHO_AIR = 1.225
const DEG = Math.PI / 180

/**
 * A stem's shape: the displacement h metres up a stem of length H is its top's displacement times φ(h / H), with
 * φ(s) = c[0] s² + c[1] s³ + c[2] s⁴ + c[3] s⁵, so φ(0) = 0, φ'(0) = 0 (clamped at the bed) and φ(1) = 1. Above its
 * top (a cattail's bare axis) a stem carries straight on along its top's tangent. Ψ(s) = ∫₀ˢ φ'² is how far bending
 * draws a point down the stem, its arc length kept to first order: |u|² Ψ(h / H) / 2H for a top displacement u.
 */
export class StemShape {
  /** φ'(s) = s (d[0] + d[1] s + d[2] s² + d[3] s³) */
  private readonly d: readonly number[]
  /** Ψ(s) = s³ (p[0] + p[1] s + … + p[6] s⁶) */
  private readonly p: readonly number[]
  /** φ'(1): the top's tangent, which the axis above it keeps */
  readonly slope: number
  /** Ψ(1) */
  readonly psiTop: number

  constructor(readonly c: readonly [number, number, number, number]) {
    this.d = c.map((v, i) => (i + 2) * v)
    const e = new Array<number>(7).fill(0)
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) e[i + j] = e[i + j]! + this.d[i]! * this.d[j]!
    this.p = e.map((v, j) => v / (j + 3))
    this.slope = this.d.reduce((a, v) => a + v, 0)
    this.psiTop = this.p.reduce((a, v) => a + v, 0)
  }

  phi(s: number): number {
    if (s >= 1) return 1 + this.slope * (s - 1)
    if (s <= 0) return 0
    const c = this.c
    return s * s * (c[0] + s * (c[1] + s * (c[2] + s * c[3])))
  }

  dphi(s: number): number {
    if (s >= 1) return this.slope
    if (s <= 0) return 0
    const d = this.d
    return s * (d[0]! + s * (d[1]! + s * (d[2]! + s * d[3]!)))
  }

  /** φ'', for the bending energy; none above the top */
  ddphi(s: number): number {
    if (s > 1) return 0
    const c = this.c, t = Math.max(0, s)
    return 2 * c[0] + 6 * c[1] * t + 12 * c[2] * t * t + 20 * c[3] * t * t * t
  }

  psi(s: number): number {
    if (s >= 1) return this.psiTop + this.slope * this.slope * (s - 1)
    if (s <= 0) return 0
    const p = this.p
    return s * s * s * (p[0]! + s * (p[1]! + s * (p[2]! + s * (p[3]! + s * (p[4]! + s * (p[5]! + s * p[6]!))))))
  }

  /** the same three functions in GLSL, from the same coefficients */
  glsl(): string {
    const f = glslFloat, c = this.c, d = this.d, p = this.p
    return /* glsl */ `
float stemPhi(float s) {
  if (s >= 1.0) return 1.0 + ${f(this.slope)} * (s - 1.0);
  s = max(s, 0.0);
  return s * s * (${f(c[0])} + s * (${f(c[1])} + s * (${f(c[2])} + s * ${f(c[3])})));
}
float stemDPhi(float s) {
  if (s >= 1.0) return ${f(this.slope)};
  s = max(s, 0.0);
  return s * (${f(d[0]!)} + s * (${f(d[1]!)} + s * (${f(d[2]!)} + s * ${f(d[3]!)})));
}
float stemPsi(float s) {
  if (s >= 1.0) return ${f(this.psiTop)} + ${f(this.slope * this.slope)} * (s - 1.0);
  s = max(s, 0.0);
  return s * s * s * (${f(p[0]!)} + s * (${f(p[1]!)} + s * (${f(p[2]!)} + s * (${f(p[3]!)} + s * (${f(p[4]!)} + s * (${f(p[5]!)} + s * ${f(p[6]!)}))))));
}`
  }
}

/** a number as a GLSL float literal */
export function glslFloat(v: number): string {
  if (Number.isInteger(v)) return v.toFixed(1)
  return v.toPrecision(9)
}

/**
 * The flowering cattail stalk (Typha latifolia). Sizes from FNA through research 5.2 and 8.5, the stiffness and
 * masses from the research's stem model (5.6).
 */
export const CATTAIL = {
  /** the spike's top above the base, metres: 1.85-2.0 (research 8.5, within FNA's 1.5-3 m shoots; the range an estimate) */
  height: [1.85, 2.0],
  /**
   * the stalk's diameter, metres: 16 mm at the base (15-20 with its sheaths), 10 mm at 1.0 m (the scape inside its
   * sheaths), and 5-7 mm under the spike ("stems 3-7 mm thick near inflorescence", FNA): research 5.6 and 8.5
   */
  diameter: { base: 0.016, mid: 0.010, midAt: 1.0, top: [0.005, 0.007] },
  /**
   * the female spike, the brown head: 15 cm long (5-25) and 28 mm thick (24-36 in fruit), each drawn from a triangle
   * on that range peaked at the typical value (the triangle an estimate); 12 g (computed in research 5.6, a cylinder
   * at 130 kg/m³)
   */
  spike: { length: [0.05, 0.15, 0.25], diameter: [0.024, 0.028, 0.036], mass: 0.012 },
  /** the bare axis above the spike, where the male spike withered: 5-15 cm long, 2-3 mm thick (research 8.5, FNA) */
  axis: { length: [0.05, 0.15], diameter: [0.002, 0.003] },
  /**
   * late September (research 5.2, by eye on dated valley photos): about one spike in seven bursting into cotton (the
   * spec; the research adopts 15%), and one in twenty intact but mottled with pale patches. A bursting head's cotton
   * puffs out 12-67% past the spike, unevenly (by eye)
   */
  burst: 1 / 7,
  patches: 0.05,
  /**
   * Bending stiffness, N m², at the stalk's top, where a bird stands (research 5.6: adopted 0.12, 0.06-0.25, inferred
   * from blackbirds standing on cattail tops; no stalk has been measured). The one number to tune by eye. The research's
   * beam is 1.85 m, clamped at the bed and loaded at its 5 mm top; here its top is the spike's, the axis through the
   * spike bending as the stalk does and the spike adding only its mass, so its numbers hold for a bird on the spike.
   * A taller stalk is a stouter one: EI grows as the height cubed from `stiffnessHeight`, so every stalk's top is
   * about as stiff as the research's (an estimate: no source relates a stalk's height to its stiffness).
   */
  stiffness: 0.12,
  stiffnessHeight: 1.85,
  /** the stalk's density, kg/m³ (research 5.6, an estimate) */
  density: 600,
  /** drag coefficients: the stalk 1.2, the spike 1.0 (research 5.6, standard values for cylinders) */
  drag: { stalk: 1.2, spike: 1.0 },
  /**
   * the shape: the static deflection of research 5.6's tapered stalk (16 mm, 10 mm at 1.0 m, 5 mm at its top) under a
   * load at its top, computed for a 1.925 m stalk and fitted by φ to within 0.0025 of the top's displacement. Most of
   * its bending is high up: halfway up it has moved 0.16 of its top's displacement, a uniform rod 0.31
   */
  shape: new StemShape([0.56584, -0.46434, 1.50085, -0.60235]),
  /**
   * flowering stalks per square metre of cattail: research 8.5 and 5.2 (15% of 15-35 leafy shoots, the share an
   * estimate) give 2-6; 5, a couple of hundred in the bed (set against the frame rate)
   */
  perM2: 5,
} as const

/** Hardstem bulrush, the tule (Schoenoplectus acutus var. occidentalis): research 5.3, 5.6 and 8.5. */
export const TULE = {
  /** the culm's length to its tip, metres: 1.8-2.5 (research 8.5, within FNA's 1-4 m) */
  height: [1.8, 2.5],
  /** 15 mm across at the base tapering to 5 mm at the top (research 5.3, adopted; FNA gives no taper) */
  diameter: { base: 0.015, top: 0.005 },
  /** the erect bract that carries the culm on past the spikelets and pushes them aside: 1-9 cm (FNA, research 5.3) */
  bract: [0.01, 0.09],
  /** the rusty spikelet cluster, 4-6 cm (research 8.5); drawn as a scale on a 5 cm cluster */
  cluster: [0.8, 1.2],
  /**
   * Young's modulus, Pa: 2 GPa, the research's "very firm" var. acutus (5.6); the softstem relatives measured at
   * 0.12-0.44 GPa would fold under a blackbird anywhere above 0.6 m. The culm weighs 250 kg/m³ and its head 4 g
   * (research 5.6, estimates)
   */
  modulus: 2e9,
  density: 250,
  head: 0.004,
  drag: 1.2,
  /**
   * the shape: a uniform rod's static deflection under a load at its top, φ = s²(3 - s)/2. The culm's own taper (15 to
   * 5 mm) would put its bending high, where no bird holds it; this one moves a 2.2 m culm 0.1-0.36 of its top between
   * 0.6 and 1.2 m up, so a male held at 0.9-1.2 m dips 1-2 cm and his landing moves it 1-3 cm (research 8.5: 1-4 and
   * 1-5 cm; at 0.6 m a firm culm barely moves). Unloaded, a culm sways at 1.1-2.0 Hz, the tallest slowest (research:
   * 1.2-1.3 Hz at 2.2 m). A choice, checked in stems.test.ts
   */
  shape: new StemShape([1.5, -0.5, 0, 0]),
  /** culms per square metre where tule grows: 40-80 in a stand (research 8.5, Bray 1984), thinned to 25 for the frame rate */
  perM2: 25,
  /** a tule folds under a blackbird above about 0.6-1 m (research 5.6), so a bird holds one only between these heights */
  hold: [0.6, 1.2],
} as const

/** the heights, metres above its base, between which a blackbird may hold a tule */
export const TULE_HOLD: readonly [number, number] = TULE.hold

/** How the stems sway: research 5.6 and 6.4-6.5, section 10's "Stem sway" and "Landing dip". */
export const SWAY = {
  /** the damping ratio: 0.12 (crops 0.08-0.22, cross-species; research 5.6) */
  damping: 0.12,
  /**
   * A bird's weight bends a stem on along its rest lean: the research's model (5.6) loads it sideways by its weight
   * times the sine of the stem's lean and by a couple, its weight times its centre of mass's offset from the axis, 25
   * mm. Its 8° lean gives 5.6 and 10 cm under a female and a male at a stalk's top in this model; 7° gives the
   * research's 5 and 9 cm (tuned), and 1-2 cm at 1.4 m.
   */
  dipLean: 7 * DEG,
  dipOffset: 0.025,
  /**
   * A landing bird settles its weight over two sway periods of the loaded stem (3.5 s for a male on a stalk's top), so
   * the stem eases into its dip and its first swing is its momentum's: 5-10 cm for a male landing at 0.25-0.5 m/s,
   * within 1 cm of its dip after 4-6 s (research 6.5: 5-11 cm, 4-5 s). A weight set down at once would overshoot to
   * twice the dip; over one period, the sag and the swing's return add up to a second, larger dip (by eye, and
   * checked in stems.test.ts)
   */
  settlePeriods: 2,
  /**
   * The wind over the bed: the water's speed (WIND_SPEED times the wind's strength, a quarter below it between gusts,
   * a quarter above in one: water.ts), its gust carried in the gust front's bands as the leaves' is: twice the gust at a
   * band's crest, none in its trough. It falls from its full value at the top to 60% at 0.9 m, in the leaves (research
   * 5.6), and to nothing at the bed below that (an estimate). The drag on a stalk then leans its top about 2 cm in the
   * scene's 2.8 m/s and 5 cm at 4.5 m/s (computed in research 5.6: 1.8 and 4.7 cm).
   */
  wind: { calm: 0.75, gust: 1, profileAt: 0.9, profileShare: 0.6 },
  /**
   * gusts within the gust: the drag's fluctuation along the wind and across it, a share of its mean, and the rates of
   * its two octaves of noise, a second; enough to set each stem swaying a little at its own frequency (by eye)
   */
  turbulence: { along: 0.4, across: 0.25, rates: [0.7, 2.3], weights: [0.65, 0.35] },
  /** each stem's rest lean, the angle from its base to its top: 0.5-3° in a random direction (by eye) */
  restLean: [0.5 * DEG, 3 * DEG],
  /**
   * A bird taking off pushes the stem back, its legs parting it from the stem at no more than a landing's speed, 0.5
   * m/s (research 6.5: 0.25-0.5 m/s at touchdown; an estimate): a stem that gives way takes little of its momentum,
   * and a stalk's top recoils at most about 0.4 m/s, a 4 cm swing on its own
   */
  pushOff: 0.5,
  /** the most a stem's top leans, a share of its height, and the least of its stiffness that birds' weight leaves */
  maxLean: 0.35,
  minStiffness: 0.15,
} as const

/** The bed: where the reeds grow (main.tsx's band, today's leaves'), and where tule takes over from cattail. */
export const BED = {
  /** [minX, maxX, minZ, maxZ]: the `reeds` zone (data/locations/lake.json) */
  bounds: [-16, -3, -14, -2] as const,
  /** the ground's height (the smooth heightfield's) where the reeds grow, metres: today's band */
  band: [-0.5, 0.7] as const,
  /**
   * Bulrushes take the deeper water, cattail the shallower (research 5.1: "Bulrushes dominate deeper water emergent
   * zones"). The spec puts the tules at z -11..-14, but the ground there is 0.7-1.5 m under the water, below the band;
   * on this lake the bed's water side is its deepest strip, z about -7..-10. By the rendered ground's height, the
   * water's depth as the player sees it: tule none above `tule[0]` metres, all below `tule[1]`; cattail thinning from
   * `cattail[0]` to a quarter at `cattail[1]` (estimates)
   */
  tule: [-0.15, -0.35] as const,
  cattail: [-0.2, -0.45] as const,
  /**
   * the singer's stalk, within `within` metres of the old reed-perch point (-8, -5): the lowest ground there, and the
   * tallest stalk (singing males take prominent perches: research, Townsend in Bent 1958). No other stem stands as
   * near the point, so the stalk nearest it is his. The ground there is the lake basin's rim, 0.7-0.9 m above the
   * water, so his spike's top stands at about 2.7 m, not the old point's 1.9
   */
  singer: { x: -8, z: -5, within: 0.28, height: 2.0 },
  /** the least spacing between stems' bases, metres: a cattail's 16 mm, a tule's 15, and room round them (by eye) */
  spacing: { cattail: 0.08, tule: 0.035, mixed: 0.05 },
} as const

// ----------------------------------------------------------------------------------------------------------------
// One stem's static data: its sizes, what the vertex shader draws from, and its physics

/** what the shader and the CPU both know of a stem: its sizes, in metres above its base */
export interface StemDims {
  readonly kind: StemKind
  /** the top: a cattail's spike's top, a tule's bract's tip */
  readonly H: number
  /** a cattail's spike's bottom; a tule's spikelet cluster, where its bract begins */
  readonly hs: number
  /** a cattail's bare axis's top; a tule's H */
  readonly axisTop: number
  /** turns the head (a tule's cluster) and the spike's ragged cotton about the stem, radians */
  readonly yaw: number
  /** the radius at the base, under the spike (at the cluster), the spike's (a tule's cluster's scale), the axis's */
  readonly r0: number
  readonly r1: number
  readonly rHead: number
  readonly rAxis: number
  /** the stalk's tone (0 green to 1 yellowing), the head's (0 intact, 0.5 pale patches, 1 bursting), a random value */
  readonly tone: readonly [number, number, number]
}

/** the stalk's or culm's own radius at h, as the shader draws it (stemGLSL's stemRadius) */
export function stemRadius(d: StemDims, h: number): number {
  if (d.kind === 'cattail') {
    if (h > d.H) return d.rAxis
    const midR = CATTAIL.diameter.mid / 2, midAt = CATTAIL.diameter.midAt
    if (h <= midAt) return d.r0 + (midR - d.r0) * Math.max(0, h) / midAt
    return midR + (d.r1 - midR) * Math.min(1, (h - midAt) / (d.hs - midAt))
  }
  if (h <= d.hs) return d.r0 + (d.r1 - d.r0) * Math.max(0, h) / d.hs
  return d.r1 * Math.max(0.15, 1 - (h - d.hs) / (d.H - d.hs))
}

/** a stem's own physics: its modal mass and stiffness, and the drag area its top feels */
interface Physics {
  /** the stem's mass as its top feels it, kg (∫ ρA φ², with its head) */
  mass: number
  /** its top's stiffness, N/m: the bending energy's (Rayleigh, ∫ EI φ''²) less its own weight's softening (∫ ρA g Ψ / H) */
  stiffness: number
  /** ∫ C_D d φ (wind profile)², m²: the wind's push on the top is ½ ρ U² times this */
  drag: number
}

const QUAD = 64

/** the wind's share of its speed at h on a stem whose top is at H (SWAY.wind) */
function windProfile(h: number, H: number): number {
  const { profileAt: at, profileShare: share } = SWAY.wind
  if (h >= at) return share + (1 - share) * Math.min(1, (h - at) / Math.max(1e-6, H - at))
  return share * Math.max(0, h) / at
}

/** research 5.6's cattail stalk, its diameter at z on a stalk whose top is at H: 16 mm, 10 at 1.0 m, 5 at the top */
function cattailBeamDiameter(z: number, H: number): number {
  const { base, mid, midAt } = CATTAIL.diameter
  if (z <= midAt) return base + (mid - base) * z / midAt
  return mid + (0.005 - mid) * Math.min(1, (z - midAt) / (H - midAt))
}

function physicsOf(d: StemDims): Physics {
  const H = d.H
  let K = 0, M = 0, soft = 0, drag = 0
  const dz = H / QUAD
  if (d.kind === 'cattail') {
    const shape = CATTAIL.shape
    const EItop = CATTAIL.stiffness * (H / CATTAIL.stiffnessHeight) ** 3
    for (let i = 0; i < QUAD; i++) {
      const z = (i + 0.5) * dz, s = z / H
      const dia = cattailBeamDiameter(z, H)
      K += EItop * (dia / 0.005) ** 4 * (shape.ddphi(s) / (H * H)) ** 2 * dz
      // the stalk's own mass up to the spike; the spike's, with the stalk inside it, is its 12 g
      if (z < d.hs) {
        const m = CATTAIL.density * Math.PI * dia * dia / 4 * dz
        M += m * shape.phi(s) ** 2
        soft += m * G * shape.psi(s) / H
        drag += CATTAIL.drag.stalk * stemRadius(d, z) * 2 * shape.phi(s) * windProfile(z, H) ** 2 * dz
      } else {
        drag += CATTAIL.drag.spike * d.rHead * 2 * shape.phi(s) * windProfile(z, H) ** 2 * dz
      }
    }
    const sMid = (d.hs + H) / 2 / H
    M += CATTAIL.spike.mass * shape.phi(sMid) ** 2
    soft += CATTAIL.spike.mass * G * shape.psi(sMid) / H
  } else {
    const shape = TULE.shape
    for (let i = 0; i < QUAD; i++) {
      const z = (i + 0.5) * dz, s = z / H
      const dia = TULE.diameter.base + (TULE.diameter.top - TULE.diameter.base) * s
      K += TULE.modulus * Math.PI * dia ** 4 / 64 * (shape.ddphi(s) / (H * H)) ** 2 * dz
      const m = TULE.density * Math.PI * dia * dia / 4 * dz
      M += m * shape.phi(s) ** 2
      soft += m * G * shape.psi(s) / H
      drag += TULE.drag * stemRadius(d, z) * 2 * shape.phi(s) * windProfile(z, H) ** 2 * dz
    }
    M += TULE.head * shape.phi(d.hs / H) ** 2
    soft += TULE.head * G * shape.psi(d.hs / H) / H
  }
  return { mass: M, stiffness: K - soft, drag }
}

/** the stem's shape function */
export function shapeOf(kind: StemKind): StemShape {
  return kind === 'cattail' ? CATTAIL.shape : TULE.shape
}

// ----------------------------------------------------------------------------------------------------------------
// The bend, on the CPU and in the vertex shader

/**
 * Where a point h metres up a stem of length H lies, relative to its base, for a top displacement (ux, uz): across by
 * u φ(h / H), down by |u|² Ψ(h / H) / 2H.
 */
export function bentPoint(shape: StemShape, H: number, ux: number, uz: number, h: number, out: THREE.Vector3): THREE.Vector3 {
  const s = Math.max(0, h) / H
  const p = shape.phi(s)
  return out.set(ux * p, Math.max(0, h) - (ux * ux + uz * uz) / (2 * H) * shape.psi(s), uz * p)
}

/** the unit tangent of a bent stem at h, pointing up it */
export function bentAxis(shape: StemShape, H: number, ux: number, uz: number, h: number, out: THREE.Vector3): THREE.Vector3 {
  const d = shape.dphi(Math.max(0, h) / H) / H
  return out.set(ux * d, 1 - 0.5 * (ux * ux + uz * uz) * d * d, uz * d).normalize()
}

/** turns v about the vertical by `yaw` (as THREE.Matrix4.makeRotationY), in place */
function yawed(v: THREE.Vector3, yaw: number): THREE.Vector3 {
  const c = Math.cos(yaw), s = Math.sin(yaw)
  return v.set(c * v.x + s * v.z, v.y, -s * v.x + c * v.z)
}

/** turns v by the rotation that takes the vertical to the unit vector t, in place (stemUpTo in the shader) */
function upTo(t: THREE.Vector3, v: THREE.Vector3): THREE.Vector3 {
  // R = I + [w]x + [w]x² / (1 + t.y), with w = y × t = (t.z, 0, -t.x)
  const wx = t.z, wz = -t.x
  // w × v
  const ax = -wz * v.y, ay = wz * v.x - wx * v.z, az = wx * v.y
  // w × (w × v)
  const bx = -wz * ay, by = wz * ax - wx * az, bz = wx * ay
  const k = 1 / (1 + t.y)
  return v.set(v.x + ax + bx * k, v.y + ay + by * k, v.z + az + bz * k)
}

/** the parts of a stem's geometry, its `aPart` attribute */
export const PART = { stalk: 0, spike: 1, axis: 2, cluster: 3 } as const

const _P = new THREE.Vector3(), _T = new THREE.Vector3(), _O = new THREE.Vector3()

/** a hash of a vertex, 0..1, as the shader's stemHash (to float precision, for the cotton's raggedness only) */
function stemHash(x: number, y: number, z: number): number {
  const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
  return v - Math.floor(v)
}

/**
 * The vertex shader's bend, in TypeScript: the world position of a vertex of a stem's geometry (its `position` and
 * `aPart`), for a top displacement (ux, uz) in world x and z, the stem standing at (x, base, z). Mirrors stemGLSL's
 * stemBend line for line.
 */
export function bendVertex(d: StemDims, x: number, base: number, z: number, part: number, px: number, py: number, pz: number,
  ux: number, uz: number, out: THREE.Vector3): THREE.Vector3 {
  let h: number
  if (part === PART.cluster) {
    h = d.hs
    _O.set(px * d.rHead, py * d.rHead, pz * d.rHead)
  } else {
    let r: number
    if (d.kind === 'tule') {
      h = py * d.H
      r = stemRadius(d, h)
    } else if (part === PART.stalk) {
      h = py * d.hs
      r = stemRadius(d, h)
    } else if (part === PART.spike) {
      h = d.hs + (d.H - d.hs) * py
      const burst = d.tone[1] > 0.75 ? 1 : 0
      const n = stemHash(px, py, pz + d.tone[2])
      r = d.rHead * (1 + burst * (0.12 + 0.55 * n * n))
    } else {
      h = d.H + (d.axisTop - d.H) * py
      r = d.rAxis
    }
    _O.set(px * r, 0, pz * r)
  }
  yawed(_O, d.yaw)
  const shape = shapeOf(d.kind)
  bentPoint(shape, d.H, ux, uz, h, _P)
  bentAxis(shape, d.H, ux, uz, h, _T)
  upTo(_T, _O)
  return out.set(x + _P.x + _O.x, base + _P.y + _O.y, z + _P.z + _O.z)
}

/** a colour as a GLSL vec3, in the renderer's linear working space */
function glslColor(hex: string): string {
  const c = new THREE.Color(hex)
  return `vec3(${glslFloat(c.r)}, ${glslFloat(c.g)}, ${glslFloat(c.b)})`
}

/**
 * Colours. Cattail (research 5.4, photo-measured in late September): the stalk between the green leaves' #4a6c35 and
 * the yellowing #9aad5b; the intact head #8b7a68 (dark #624e3e, pale patches #c2bdae); a bursting head #d2bea5 (light
 * #f0dcc8); the bare axis the head's dark brown (by eye). Tule (research 5.3, estimates): the culm grey-green #6f8150
 * with straw-brown tips, the spikelets rusty brown (both hexes by eye). The stem darkens toward the bed, shaded by the
 * leaves (by eye).
 */
export const STEM_COLORS = {
  cattail: { green: '#4a6c35', yellow: '#9aad5b', head: '#8b7a68', headDark: '#624e3e', patch: '#c2bdae', cotton: '#d2bea5', cottonLight: '#f0dcc8', axis: '#624e3e' },
  tule: { culm: '#6f8150', straw: '#b5a274', spikelets: '#8a5530' },
  /** the colour at the bed, a share of the full, and the height it is full by, metres (by eye) */
  shade: { base: 0.5, by: 1.2 },
  /** the share of a bursting head where its brown shows through the cotton (by eye) */
  burstCore: 0.18,
} as const

/**
 * The bend in GLSL for one kind of stem, from the same constants: its attributes, shape, radius, and `stemBend()`,
 * which sets stemP (the axis point), stemT (its tangent) and stemOff (the vertex's offset from the axis, unbent) and,
 * where STEM_COLOR is defined, the varying vStemColor. The instance matrix is a translation to the stem's base.
 */
export function stemGLSL(kind: StemKind): string {
  const f = glslFloat
  const shape = shapeOf(kind)
  const C = STEM_COLORS
  const radius = kind === 'cattail'
    ? `
float stemRadius(float h) {
  if (h <= ${f(CATTAIL.diameter.midAt)}) return mix(aRadii.x, ${f(CATTAIL.diameter.mid / 2)}, max(h, 0.0) / ${f(CATTAIL.diameter.midAt)});
  return mix(${f(CATTAIL.diameter.mid / 2)}, aRadii.y, min(1.0, (h - ${f(CATTAIL.diameter.midAt)}) / (aStem.y - ${f(CATTAIL.diameter.midAt)})));
}`
    : `
float stemRadius(float h) {
  if (h <= aStem.y) return mix(aRadii.x, aRadii.y, max(h, 0.0) / aStem.y);
  return aRadii.y * max(0.15, 1.0 - (h - aStem.y) / (aStem.x - aStem.y));
}`
  const parts = kind === 'cattail'
    ? `
  float r;
  if (aPart < 0.5) {
    h = position.y * aStem.y;
    r = stemRadius(h);
  } else if (aPart < 1.5) {
    h = mix(aStem.y, aStem.x, position.y);
    float burst = aTone.y > 0.75 ? 1.0 : 0.0;
    float n = stemHash(vec3(position.x, position.y, position.z + aTone.z));
    r = aRadii.z * (1.0 + burst * (0.12 + 0.55 * n * n));
  } else {
    h = mix(aStem.x, aStem.z, position.y);
    r = aRadii.w;
  }
  stemOff = vec3(position.x * r, 0.0, position.z * r);`
    : `
  if (aPart > 2.5) {
    h = aStem.y;
    stemOff = position * aRadii.z;
  } else {
    h = position.y * aStem.x;
    float r = stemRadius(h);
    stemOff = vec3(position.x * r, 0.0, position.z * r);
  }`
  const colour = kind === 'cattail'
    ? `
  float shade = mix(${f(C.shade.base)}, 1.0, smoothstep(0.0, ${f(C.shade.by)}, h));
  float n = stemHash(vec3(position.x, position.y, position.z + aTone.z));
  if (aPart < 0.5) {
    vStemColor = mix(${glslColor(C.cattail.green)}, ${glslColor(C.cattail.yellow)}, aTone.x) * shade;
  } else if (aPart < 1.5) {
    vec3 head = mix(${glslColor(C.cattail.head)}, ${glslColor(C.cattail.headDark)}, 0.6 * n);
    if (aTone.y > 0.25 && aTone.y < 0.75 && n > 0.55) head = ${glslColor(C.cattail.patch)};
    // bursting: the cotton puffed out most where it is palest, the brown head showing where it has fallen
    if (aTone.y > 0.75) head = n < ${f(C.burstCore)} ? head : mix(${glslColor(C.cattail.cotton)}, ${glslColor(C.cattail.cottonLight)}, n);
    vStemColor = head;
  } else {
    vStemColor = ${glslColor(C.cattail.axis)};
  }`
    : `
  float shade = mix(${f(C.shade.base)}, 1.0, smoothstep(0.0, ${f(C.shade.by)}, h));
  float n = stemHash(vec3(position.x, position.y, position.z + aTone.z));
  if (aPart > 2.5) vStemColor = ${glslColor(C.tule.spikelets)} * (0.85 + 0.3 * n);
  else vStemColor = mix(${glslColor(C.tule.culm)}, ${glslColor(C.tule.straw)}, smoothstep(0.82, 1.0, h / aStem.x)) * shade;`
  return /* glsl */ `
attribute vec2 aTop;
attribute vec4 aStem;
attribute vec4 aRadii;
attribute vec3 aTone;
attribute float aPart;
#ifdef STEM_COLOR
varying vec3 vStemColor;
#endif
vec3 stemP;
vec3 stemT;
vec3 stemOff;
${shape.glsl()}
${radius}
float stemHash(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}
vec3 stemYaw(vec3 v) {
  float c = cos(aStem.w), s = sin(aStem.w);
  return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}
vec3 stemUpTo(vec3 t, vec3 v) {
  vec3 w = vec3(t.z, 0.0, -t.x);
  vec3 a = cross(w, v);
  return v + a + cross(w, a) / (1.0 + t.y);
}
void stemBend() {
  float H = aStem.x;
  float h;
  ${parts}
  stemOff = stemYaw(stemOff);
  float s = max(h, 0.0) / H;
  float uu = dot(aTop, aTop);
  float p = stemPhi(s);
  stemP = vec3(aTop.x * p, max(h, 0.0) - uu / (2.0 * H) * stemPsi(s), aTop.y * p);
  float d = stemDPhi(s) / H;
  stemT = normalize(vec3(aTop.x * d, 1.0 - 0.5 * uu * d * d, aTop.y * d));
#ifdef STEM_COLOR
  ${colour}
#endif
}`
}

// ----------------------------------------------------------------------------------------------------------------
// The layout

class StemImpl implements Stem {
  readonly spike?: Stem['spike']
  readonly lean: { readonly x: number; readonly z: number }
  constructor(
    readonly index: number,
    readonly kind: StemKind,
    readonly x: number,
    readonly z: number,
    readonly base: number,
    readonly dims: StemDims,
    lean: { x: number; z: number },
    /** staggers its gust front, as a leaf's phase does */
    readonly phase: number,
  ) {
    this.lean = lean
    if (kind === 'cattail') {
      this.spike = { bottom: dims.hs, top: dims.H, radius: dims.rHead, axisTop: dims.axisTop, axisRadius: dims.rAxis }
    }
  }
  get height(): number { return this.dims.H }
  radiusAt(h: number): number { return stemRadius(this.dims, h) }
}

export interface StemLayoutOptions {
  /** the smooth ground: where it lies within the band, the reeds grow */
  heightfield: Heightfield
  /** the rendered ground the stems stand on (terrainSurface's sample) */
  ground: (x: number, z: number) => number
  seed?: number
}

/** a draw from the triangle on [lo, hi] peaked at `mode` */
function triangle(rng: Rng, lo: number, mode: number, hi: number): number {
  const u = rng(), c = (mode - lo) / (hi - lo)
  return u < c ? lo + Math.sqrt(u * (hi - lo) * (mode - lo)) : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mode))
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

/** the share of the ground at height y where cattail grows (BED.cattail), and where tule does (BED.tule) */
export function cattailShare(y: number): number {
  return lerp(1, 0.25, clamp01((BED.cattail[0] - y) / (BED.cattail[0] - BED.cattail[1])))
}
export function tuleShare(y: number): number {
  return clamp01((BED.tule[0] - y) / (BED.tule[0] - BED.tule[1]))
}

export function inBand(hf: Heightfield, x: number, z: number): boolean {
  const y = hf.sample(x, z)
  return y >= BED.band[0] && y <= BED.band[1]
}

function cattailDims(rng: Rng, H: number, spikeLength?: number, spikeDiameter?: number, tone?: number): StemDims {
  const len = spikeLength ?? triangle(rng, CATTAIL.spike.length[0], CATTAIL.spike.length[1], CATTAIL.spike.length[2])
  const dia = spikeDiameter ?? triangle(rng, CATTAIL.spike.diameter[0], CATTAIL.spike.diameter[1], CATTAIL.spike.diameter[2])
  const roll = rng()
  const head = tone ?? (roll < CATTAIL.burst ? 1 : roll < CATTAIL.burst + CATTAIL.patches ? 0.5 : 0)
  return {
    kind: 'cattail',
    H,
    hs: H - len,
    axisTop: H + lerp(CATTAIL.axis.length[0], CATTAIL.axis.length[1], rng()),
    yaw: rng() * Math.PI * 2,
    r0: CATTAIL.diameter.base / 2,
    r1: lerp(CATTAIL.diameter.top[0], CATTAIL.diameter.top[1], rng()) / 2,
    rHead: dia / 2,
    rAxis: lerp(CATTAIL.axis.diameter[0], CATTAIL.axis.diameter[1], rng()) / 2,
    tone: [rng(), head, rng() * 10],
  }
}

function tuleDims(rng: Rng): StemDims {
  const H = lerp(TULE.height[0], TULE.height[1], rng())
  return {
    kind: 'tule',
    H,
    hs: H - lerp(TULE.bract[0], TULE.bract[1], rng()),
    axisTop: H,
    yaw: rng() * Math.PI * 2,
    r0: TULE.diameter.base / 2,
    r1: TULE.diameter.top / 2,
    rHead: lerp(TULE.cluster[0], TULE.cluster[1], rng()),
    rAxis: 0,
    tone: [rng(), 0, rng() * 10],
  }
}

/**
 * The bed's stems, laid out once from a seed: the singer's stalk, then cattail flowering stalks over the band, then
 * tules on its water side, none nearer another than BED.spacing. Cattails come first in the list, then tules.
 */
export function layoutStems(o: StemLayoutOptions): Stem[] {
  const rng = makeRng(o.seed ?? 11)
  const [x0, x1, z0, z1] = BED.bounds
  const area = (x1 - x0) * (z1 - z0)
  type Placed = { x: number; z: number; kind: StemKind }
  const grid = new Map<string, Placed[]>()
  const cell = 0.25
  const key = (x: number, z: number) => `${Math.floor(x / cell)},${Math.floor(z / cell)}`
  // no stem nearer the singer's point than his stalk, and a spacing more
  let clearing = 0
  const clear = (x: number, z: number, kind: StemKind) => {
    if (Math.hypot(x - BED.singer.x, z - BED.singer.z) < clearing) return false
    const cx = Math.floor(x / cell), cz = Math.floor(z / cell)
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      for (const p of grid.get(`${cx + i},${cz + j}`) ?? []) {
        const min = p.kind !== kind ? BED.spacing.mixed : BED.spacing[kind]
        if (Math.hypot(p.x - x, p.z - z) < min) return false
      }
    }
    return true
  }
  const out: StemImpl[] = []
  const place = (kind: StemKind, x: number, z: number, dims: StemDims) => {
    const k = key(x, z)
    const list = grid.get(k) ?? []
    list.push({ x, z, kind })
    grid.set(k, list)
    const angle = lerp(SWAY.restLean[0], SWAY.restLean[1], rng()), dir = rng() * Math.PI * 2
    const lean = Math.tan(angle) * dims.H
    out.push(new StemImpl(out.length, kind, x, z, o.ground(x, z), dims, { x: lean * Math.cos(dir), z: lean * Math.sin(dir) }, rng() * Math.PI * 2))
  }

  // the singer's: the lowest ground within reach of the old point, so his spike stands nearest its 1.9 m
  const S = BED.singer
  let best: { x: number; z: number; y: number } | null = null
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
    const x = S.x + i * S.within / 6, z = S.z + j * S.within / 6
    if (Math.hypot(x - S.x, z - S.z) > S.within || !inBand(o.heightfield, x, z)) continue
    const y = o.ground(x, z)
    if (!best || y < best.y) best = { x, z, y }
  }
  if (best) {
    place('cattail', best.x, best.z, cattailDims(rng, S.height, CATTAIL.spike.length[1], CATTAIL.spike.diameter[1], 0))
    clearing = Math.hypot(best.x - S.x, best.z - S.z) + BED.spacing.mixed
  }

  const cattails = Math.round(CATTAIL.perM2 * area)
  for (let i = 0; i < cattails; i++) {
    const x = lerp(x0, x1, rng()), z = lerp(z0, z1, rng())
    const H = lerp(CATTAIL.height[0], CATTAIL.height[1], rng())
    const keep = rng()
    if (!inBand(o.heightfield, x, z) || keep >= cattailShare(o.ground(x, z)) || !clear(x, z, 'cattail')) continue
    place('cattail', x, z, cattailDims(rng, H))
  }
  const tules = Math.round(TULE.perM2 * area)
  for (let i = 0; i < tules; i++) {
    const x = lerp(x0, x1, rng()), z = lerp(z0, z1, rng())
    const keep = rng()
    if (!inBand(o.heightfield, x, z) || keep >= tuleShare(o.ground(x, z)) || !clear(x, z, 'tule')) continue
    place('tule', x, z, tuleDims(rng))
  }
  return out
}

// ----------------------------------------------------------------------------------------------------------------
// The field

interface Hold {
  readonly id: number
  readonly stem: StemState
  readonly mass: number
  h: number
  /** seconds since it took hold, and how long its weight takes to settle */
  age: number
  settle: number
}

interface StemState {
  readonly stem: StemImpl
  readonly shape: StemShape
  readonly physics: Physics
  /** the unit direction a bird's weight bends it: its rest lean's */
  readonly dipX: number
  readonly dipZ: number
  /** the top's displacement from its rest and its velocity, world x and z */
  qx: number
  qz: number
  vx: number
  vz: number
  /** where its top would settle under the wind's steady drag and the birds' weight, from its rest, world x and z */
  restX: number
  restZ: number
  holds: Hold[]
  /** with the birds on it: its mass and stiffness at the top */
  mass: number
  stiffness: number
}

/** how a bird at h on a stem weighs on its top: its mass, its weight's softening, and the dip's force there */
function loadOf(st: StemState, mass: number, h: number): { mass: number; soft: number; dip: number; phi: number } {
  const H = st.stem.dims.H
  const a = Math.min(Math.max(0, h), st.stem.dims.axisTop)
  const s = a / H
  const phi = st.shape.phi(s)
  return {
    mass: mass * phi * phi,
    soft: mass * G * st.shape.psi(s) / H,
    dip: mass * G * (Math.sin(SWAY.dipLean) * phi + SWAY.dipOffset * st.shape.dphi(s) / H),
    phi,
  }
}

function smoothstep(t: number): number {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/**
 * The stems' sway. Each stem's top is a damped oscillator in x and z, its displacement from its rest lean q:
 * M q'' + 2ζ√(KM) q' + K q = F, with M and K its own (physicsOf) plus each bird's mass m φ(a)² and weight's softening
 * m g Ψ(a) / H at its grip a, and F the wind's drag, its turbulence, and the birds' dips, stepped exactly over each
 * frame with the force held. `tops` holds every stem's top displacement, rest lean included, for the shader.
 */
export function createStemField(stems: readonly Stem[]): StemField & { readonly tops: Float32Array } {
  const states: StemState[] = stems.map(s => {
    const stem = s as StemImpl
    const physics = physicsOf(stem.dims)
    const len = Math.hypot(stem.lean.x, stem.lean.z)
    return {
      stem,
      shape: shapeOf(stem.kind),
      physics,
      dipX: len > 1e-9 ? stem.lean.x / len : Math.cos(stem.dims.yaw),
      dipZ: len > 1e-9 ? stem.lean.z / len : Math.sin(stem.dims.yaw),
      qx: 0, qz: 0, vx: 0, vz: 0, restX: 0, restZ: 0,
      holds: [],
      mass: physics.mass,
      stiffness: physics.stiffness,
    }
  })
  const tops = new Float32Array(states.length * 2)
  const holds = new Map<number, Hold>()
  let nextHold = 1
  let started = false

  // a grid of the bases, for `near`
  const cell = 1
  const grid = new Map<string, StemImpl[]>()
  for (const st of states) {
    const k = `${Math.floor(st.stem.x / cell)},${Math.floor(st.stem.z / cell)}`
    const list = grid.get(k) ?? []
    list.push(st.stem)
    grid.set(k, list)
  }

  const writeTop = (st: StemState) => {
    const i = st.stem.index * 2
    tops[i] = st.stem.lean.x + st.qx
    tops[i + 1] = st.stem.lean.z + st.qz
  }
  for (const st of states) writeTop(st)

  const reload = (st: StemState) => {
    let M = st.physics.mass, soft = 0
    for (const hd of st.holds) {
      const l = loadOf(st, hd.mass, hd.h)
      M += l.mass
      soft += l.soft
    }
    st.mass = M
    st.stiffness = Math.max(st.physics.stiffness * SWAY.minStiffness, st.physics.stiffness - soft)
  }

  const stateOf = (stem: Stem): StemState => {
    const st = states[stem.index]
    if (!st || st.stem !== stem) throw new Error(`stem ${stem.index} is not in this field`)
    return st
  }

  const field = {
    stems,
    tops,

    near(x: number, z: number, r: number): Stem[] {
      const found: { stem: Stem; d: number }[] = []
      const cx0 = Math.floor((x - r) / cell), cx1 = Math.floor((x + r) / cell)
      const cz0 = Math.floor((z - r) / cell), cz1 = Math.floor((z + r) / cell)
      for (let i = cx0; i <= cx1; i++) for (let j = cz0; j <= cz1; j++) {
        for (const s of grid.get(`${i},${j}`) ?? []) {
          const d = Math.hypot(s.x - x, s.z - z)
          if (d <= r) found.push({ stem: s, d })
        }
      }
      return found.sort((a, b) => a.d - b.d).map(f => f.stem)
    },

    pointAt(stem: Stem, h: number, out = new THREE.Vector3()): THREE.Vector3 {
      const st = stateOf(stem)
      const s = st.stem
      bentPoint(st.shape, s.dims.H, s.lean.x + st.qx, s.lean.z + st.qz, h, out)
      return out.set(out.x + s.x, out.y + s.base, out.z + s.z)
    },

    restAt(stem: Stem, h: number, out = new THREE.Vector3()): THREE.Vector3 {
      const st = stateOf(stem)
      const s = st.stem
      bentPoint(st.shape, s.dims.H, s.lean.x + st.restX, s.lean.z + st.restZ, h, out)
      return out.set(out.x + s.x, out.y + s.base, out.z + s.z)
    },

    axisAt(stem: Stem, h: number, out = new THREE.Vector3()): THREE.Vector3 {
      const st = stateOf(stem)
      return bentAxis(st.shape, st.stem.dims.H, st.stem.lean.x + st.qx, st.stem.lean.z + st.qz, h, out)
    },

    displacement(stem: Stem): { x: number; z: number } {
      const st = stateOf(stem)
      return { x: st.stem.lean.x + st.qx, z: st.stem.lean.z + st.qz }
    },

    hold(stem: Stem, mass: number, h: number, vx = 0, vz = 0): number {
      const st = stateOf(stem)
      const l = loadOf(st, mass, h)
      // the bird's momentum at its grip, shared with the stem: (M q' + m φ v) / (M + m φ²)
      const M0 = st.mass
      const hd: Hold = { id: nextHold++, stem: st, mass, h, age: 0, settle: 0 }
      st.holds.push(hd)
      holds.set(hd.id, hd)
      reload(st)
      st.vx = (M0 * st.vx + mass * l.phi * vx) / st.mass
      st.vz = (M0 * st.vz + mass * l.phi * vz) / st.mass
      hd.settle = SWAY.settlePeriods * 2 * Math.PI * Math.sqrt(st.mass / st.stiffness)
      return hd.id
    },

    move(id: number, h: number): void {
      const hd = holds.get(id)
      if (!hd) return
      hd.h = h
      reload(hd.stem)
    },

    release(id: number, vx = 0, vz = 0): void {
      const hd = holds.get(id)
      if (!hd) return
      const st = hd.stem
      const l = loadOf(st, hd.mass, hd.h)
      // the bird's legs push it off the stem, which moves at its grip at φ q', toward the way it leaves, the two parting
      // at no more than SWAY.pushOff: an impulse J on the bird with J (1/m + φ²/M) that parting speed, -φ J on the stem
      let rx = vx - l.phi * st.vx, rz = vz - l.phi * st.vz
      const rel = Math.hypot(rx, rz)
      if (rel > SWAY.pushOff) { rx *= SWAY.pushOff / rel; rz *= SWAY.pushOff / rel }
      st.holds = st.holds.filter(x => x !== hd)
      holds.delete(id)
      reload(st)
      const k = l.phi / (st.mass / hd.mass + l.phi * l.phi)
      st.vx -= k * rx
      st.vz -= k * rz
    },

    update(dt: number, wind: Wind): void {
      const w = wind.state
      const dirX = w.dir.x, dirZ = w.dir.y
      const T = SWAY.turbulence
      const zeta = SWAY.damping
      for (const st of states) {
        const s = st.stem
        // the wind's drag on the top, along the wind, with its turbulence
        const front = gustFront(s.x * dirX + s.z * dirZ, w.time, s.phase)
        const U = WIND_SPEED * w.strength * (SWAY.wind.calm + SWAY.wind.gust * w.gust * front)
        const drag = 0.5 * RHO_AIR * st.physics.drag * U * U
        const seed = 1000 + s.index * 4
        const n1 = T.weights[0] * (2 * valueNoise1(w.time * T.rates[0], seed) - 1) + T.weights[1] * (2 * valueNoise1(w.time * T.rates[1], seed + 1) - 1)
        const n2 = T.weights[0] * (2 * valueNoise1(w.time * T.rates[0], seed + 2) - 1) + T.weights[1] * (2 * valueNoise1(w.time * T.rates[1], seed + 3) - 1)
        const along = drag * (1 + T.along * n1), across = drag * T.across * n2
        let fx = dirX * along - dirZ * across
        let fz = dirZ * along + dirX * across
        // the same without the turbulence, for where it would settle
        let rx = dirX * drag, rz = dirZ * drag
        // the birds' weight, each settling in over its first sway
        for (const hd of st.holds) {
          const dip = loadOf(st, hd.mass, hd.h).dip * smoothstep(hd.age / hd.settle)
          fx += st.dipX * dip
          fz += st.dipZ * dip
          rx += st.dipX * dip
          rz += st.dipZ * dip
          hd.age += dt
        }
        const K = st.stiffness, M = st.mass
        const ex = fx / K, ez = fz / K
        st.restX = rx / K
        st.restZ = rz / K
        if (!started) { st.qx = ex; st.qz = ez }
        // the exact step of a damped oscillator about its equilibrium e: y = q - e
        const omega = Math.sqrt(K / M)
        const a = zeta * omega, b = omega * Math.sqrt(1 - zeta * zeta)
        const decay = Math.exp(-a * dt), cs = Math.cos(b * dt), sn = Math.sin(b * dt)
        const yx = st.qx - ex, yz = st.qz - ez
        const nyx = decay * (yx * cs + (st.vx + a * yx) / b * sn)
        const nyz = decay * (yz * cs + (st.vz + a * yz) / b * sn)
        st.vx = decay * (st.vx * cs - (a * st.vx + omega * omega * yx) / b * sn)
        st.vz = decay * (st.vz * cs - (a * st.vz + omega * omega * yz) / b * sn)
        st.qx = ex + nyx
        st.qz = ez + nyz
        // a stem bends only so far: past that it holds, its outward motion stopped
        const ux = s.lean.x + st.qx, uz = s.lean.z + st.qz
        const u = Math.hypot(ux, uz), max = SWAY.maxLean * s.dims.H
        if (u > max) {
          const k = max / u
          st.qx = ux * k - s.lean.x
          st.qz = uz * k - s.lean.z
          const out = (st.vx * ux + st.vz * uz) / u
          if (out > 0) { st.vx -= out * ux / u; st.vz -= out * uz / u }
        }
        writeTop(st)
      }
      started = true
    },
  }
  return field
}

/** a stem's modal mass and stiffness and its natural frequency, Hz, with a bird of `mass` at h (for the tests and tuning) */
export function stemFrequency(stem: Stem, mass = 0, h = stem.height): number {
  const st = stem as StemImpl
  const p = physicsOf(st.dims)
  const shape = shapeOf(st.kind)
  const s = Math.max(0, h) / st.dims.H
  const M = p.mass + mass * shape.phi(s) ** 2
  const K = p.stiffness - mass * G * shape.psi(s) / st.dims.H
  return Math.sqrt(Math.max(0, K) / M) / (2 * Math.PI)
}

/** a stem's shader data, for the meshes that draw it */
export function stemDims(stem: Stem): StemDims {
  return (stem as StemImpl).dims
}
