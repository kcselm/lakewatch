import * as THREE from 'three'
import type { Profile } from './profile'
import type { DetailSpec } from './spec'
import { tube, lens, sweep, type Mesher } from './mesher'
import { solveLeg } from './gait'

/** the hip joint sits this fraction of the belly depth below the spine */
const HIP_DEPTH = 0.35
/** hips sit this fraction of the body half-width out from the midline */
const HIP_SPREAD = 0.4
/** standing, the hip is this fraction of the leg's full reach above the foot */
const STAND = 0.92
/**
 * perched, the hip is this fraction of the leg's full reach above the foot: a crouch, the belly a few mm over the toes.
 * By eye: "in the perched bird only the toes show, curled round the perch, and sometimes a few mm of tarsus"
 * (docs/research/2026-09-30-belted-kingfisher.md, section 5.3)
 */
const PERCH_STAND = 0.75
/** tarsus diameter as a fraction of tarsus length */
const TARSUS_THICKNESS = 0.045
/** default step length as a fraction of leg length (tibia + tarsus) */
export const DEFAULT_STEP = 0.45
/**
 * A swimmer's legs at rest, folded back under the body: the tibia straight down from the hip (so the bare tibia below
 * the belly is exactly measurements.tibia), the tarsus and the toes trailing back and a little down. Radians from +x.
 */
export const SWIM_TIBIA = -Math.PI / 2
export const SWIM_TARSUS = -2.75

export interface LegLayout {
  /** right hip joint, profile frame; the left mirrors z */
  hip: THREE.Vector3
  /** belly surface height under the hip, profile frame */
  bellyY: number
  /** full tibia, hip to intertarsal joint (the hidden part plus measurements.tibia) */
  tibia: number
  tarsus: number
  toe: number
  /** hip height above the foot joint when standing */
  standHeight: number
  /** foot joint height above the ground (the toes' radius) */
  footY: number
  tarsusRadius: number
  /** standing positions (a swimmer's: folded back), right leg, profile frame */
  knee: THREE.Vector3
  foot: THREE.Vector3
  /** a swimmer's legs, folded back under the body with the toes trailing; a standing bird's stand on the ground */
  swimming: boolean
  /** a perched bird's branch radius, metres: its feet sit on the branch's top and its toes curl round it; else null */
  perch: number | null
}

export function legLayout(detail: DetailSpec, profile: Profile, posture: 'standing' | 'swimming' | 'perched' = 'standing'): LegLayout {
  const swimming = posture === 'swimming'
  const perch = posture === 'perched' ? detail.perch?.radius ?? null : null
  if (posture === 'perched' && perch === null) throw new Error('a perched bird needs detail.perch, the branch its toes curl round')
  const s = profile.sampleAt(profile.uOf(detail.rig.hip))
  const hip = new THREE.Vector3(s.point.x, s.point.y - s.down * HIP_DEPTH, s.halfWidth * HIP_SPREAD)
  const bellyY = s.point.y - s.down
  const m = detail.measurements
  const tibia = (hip.y - bellyY) + m.tibia
  const standHeight = STAND * (tibia + m.tarsus)
  const tarsusRadius = (m.tarsus * TARSUS_THICKNESS) / 2
  const footY = tarsusRadius * 0.7
  if (swimming) {
    const knee = hip.clone().add(new THREE.Vector3(Math.cos(SWIM_TIBIA), Math.sin(SWIM_TIBIA), 0).multiplyScalar(tibia))
    const foot = knee.clone().add(new THREE.Vector3(Math.cos(SWIM_TARSUS), Math.sin(SWIM_TARSUS), 0).multiplyScalar(m.tarsus))
    return { hip, bellyY, tibia, tarsus: m.tarsus, toe: m.toe, standHeight: hip.y - foot.y, footY, tarsusRadius, knee, foot, swimming, perch }
  }
  // perched, the bird crouches over its feet, but never so low that the intertarsal joint drops below them (into the
  // branch): at sqrt(tibia² - tarsus²) the tarsus lies level
  const height = perch === null ? standHeight : Math.max(PERCH_STAND * (tibia + m.tarsus), Math.sqrt(Math.max(0, tibia ** 2 - m.tarsus ** 2)))
  const target = { x: hip.x, y: hip.y - height }
  const { joint, foot } = solveLeg({ x: hip.x, y: hip.y }, target, tibia, m.tarsus)
  return {
    hip, bellyY, tibia, tarsus: m.tarsus, toe: m.toe, standHeight: height, footY, tarsusRadius,
    knee: new THREE.Vector3(joint.x, joint.y, hip.z),
    foot: new THREE.Vector3(foot.x, foot.y, hip.z),
    swimming, perch,
  }
}

/** Toe directions in the ground plane for the right foot (+z outward); the left mirrors z. */
const TOES: { angle: number; length: number; lobes: number }[] = [
  // lobes, one per segment: the Coot's middle toe has three; inner two and outer four
  // (docs/research/2026-09-25-american-coot.md, sections 5.5 and 9; the inner and outer counts are its estimate)
  { angle: -0.45, length: 0.8, lobes: 2 },   // inner
  { angle: 0, length: 1, lobes: 3 },         // middle
  { angle: 0.45, length: 0.8, lobes: 4 },    // outer
]
/** a web's or lobe's thickness at its middle, metres */
const MEMBRANE = 0.0006
/** how far a web's free edge dips back toward the foot between two toe tips, as a fraction of the toes' length */
const WEB_DIP = 0.15

export interface FeetOptions {
  /** 'webbed' or 'lobed'; without it, plain toes */
  kind?: 'webbed' | 'lobed'
  /** lobed: the middle toe's width across its lobes, metres */
  lobeWidth?: number
}

/**
 * Both legs in rest pose: tibia, a knob at the intertarsal joint, tarsus, three front toes and a hind toe, and a web
 * or lobes on the front toes. Returns the index range of each foot (its toes and their web or lobes, every piece
 * closed) when it has a web or lobes.
 */
export function buildLegs(m: Mesher, layout: LegLayout, feet: FeetOptions = {}): { name: string; indexFirst: number; indexCount: number }[] {
  const r = layout.tarsusRadius
  const out: { name: string; indexFirst: number; indexCount: number }[] = []
  for (const side of [1, -1] as const) {
    const B = side > 0
      ? { tibia: 'tibiaR', tarsus: 'tarsusR', toes: 'toesR' } as const
      : { tibia: 'tibiaL', tarsus: 'tarsusL', toes: 'toesL' } as const
    const mirror = (v: THREE.Vector3) => new THREE.Vector3(v.x, v.y, v.z * side)
    const hip = mirror(layout.hip), knee = mirror(layout.knee), foot = mirror(layout.foot)
    tube(m, hip, knee, r * 1.5, r * 1.1, 'legs', 0.5, 0.5, [[B.tibia, 1]])
    tube(m, knee.clone().add(new THREE.Vector3(0.6 * r, 0, 0)), knee.clone().add(new THREE.Vector3(-0.6 * r, 0, 0)), r * 1.25, r * 1.25, 'legs', 0.5, 0.5, [[B.tarsus, 1]])
    tube(m, knee, foot, r, r * 0.9, 'legs', 0.5, 0.5, [[B.tarsus, 1]])
    if (layout.perch !== null) {
      perchedToes(m, layout, layout.perch, foot, side, B.toes)
      continue
    }
    // standing, the toes spread forward along the ground; a swimmer's trail back in line with the tarsus
    const along = layout.swimming ? new THREE.Vector3(Math.cos(SWIM_TARSUS), Math.sin(SWIM_TARSUS), 0) : new THREE.Vector3(1, 0, 0)
    const footFirst = m.indexCount
    const tips: THREE.Vector3[] = []
    for (const toe of TOES) {
      const a = toe.angle * side
      const tip = foot.clone().add(along.clone().multiplyScalar(Math.cos(a)).add(new THREE.Vector3(0, 0, Math.sin(a))).multiplyScalar(layout.toe * toe.length))
      tube(m, foot, tip, r * 0.7, r * 0.45, 'legs', 0.5, 0.5, [[B.toes, 1]], 5)
      tips.push(tip)
    }
    const hind = layout.swimming
      ? foot.clone().addScaledVector(along, -layout.toe * 0.25).add(new THREE.Vector3(0, layout.footY, 0))
      : foot.clone().add(new THREE.Vector3(-layout.toe * 0.25, layout.footY, 0))
    tube(m, foot, hind, r * 0.6, r * 0.4, 'legs', 0.5, 0.5, [[B.toes, 1]], 5)
    if (!feet.kind) continue
    // the plane the front toes spread in, and its normal
    const n = along.clone().cross(new THREE.Vector3(0, 0, 1)).normalize()
    if (feet.kind === 'webbed') {
      // a membrane between each pair of neighbouring toes, its free edge dipping back between their tips
      for (let k = 0; k < 2; k++) {
        const A = tips[k]!, C = tips[k + 1]!
        const at = (t: number, u: number) => {
          const reach = t * (1 - WEB_DIP * Math.sin(Math.PI * u))
          return foot.clone().lerp(A, reach).lerp(foot.clone().lerp(C, reach), u)
        }
        lens(m, 5, 5, at, (t, u) => (MEMBRANE / 2) * Math.sin(Math.PI * u) * Math.sin(Math.PI * t) ** 0.5, n, 'legs', [[B.toes, 1]])
      }
    } else {
      // a rounded flap either side of each toe segment, narrowing to nothing at the joints between them
      const half = (feet.lobeWidth ?? 0.2 * layout.toe) / 2
      TOES.forEach((toe, k) => {
        const tip = tips[k]!, dir = tip.clone().sub(foot).normalize()
        const across = n.clone().cross(dir).normalize()
        for (let g = 0; g < toe.lobes; g++) {
          const at = (a: number, b: number) => foot.clone().lerp(tip, (g + a) / toe.lobes)
            .addScaledVector(across, (2 * b - 1) * half * Math.sin(Math.PI * a) ** 0.6)
          lens(m, 5, 5, at, (a, b) => (MEMBRANE / 2) * Math.sqrt(Math.max(0, 1 - (2 * b - 1) ** 2)) * Math.sin(Math.PI * a) ** 0.6, n, 'legs', [[B.toes, 1]])
        }
      })
    }
    out.push({ name: side > 0 ? 'footR' : 'footL', indexFirst: footFirst, indexCount: m.indexCount - footFirst })
  }
  return out
}

/** how many segments a curled toe is swept in */
const CURL_SEGMENTS = 6

/**
 * A percher's toes, curled round its branch: the branch runs across the bird (along z), its top under the foot, the
 * foot joint the toes' own radius above it. The front toes wrap forward and down over the branch, each spreading
 * sideways by its angle as on the ground, and the hind toe wraps back and down; each keeps its length along the curve.
 */
function perchedToes(m: Mesher, layout: LegLayout, radius: number, foot: THREE.Vector3, side: 1 | -1, bone: 'toesR' | 'toesL') {
  const r = layout.tarsusRadius
  // the toes' centrelines lie on a circle about the branch's axis, through the foot joint
  const centre = new THREE.Vector3(foot.x, foot.y - layout.footY - radius, 0)
  const around = radius + layout.footY
  const curl = (length: number, angle: number, dir: 1 | -1) => Array.from({ length: CURL_SEGMENTS + 1 }, (_, k) => {
    const t = k / CURL_SEGMENTS
    const theta = (t * length * Math.cos(angle)) / around
    return new THREE.Vector3(centre.x + dir * around * Math.sin(theta), centre.y + around * Math.cos(theta), foot.z + t * length * Math.sin(angle))
  })
  const taper = (from: number, to: number) => Array.from({ length: CURL_SEGMENTS + 1 }, (_, k) => r * (from + ((to - from) * k) / CURL_SEGMENTS))
  for (const toe of TOES) sweep(m, curl(layout.toe * toe.length, toe.angle * side, 1), taper(0.7, 0.45), 'legs', [[bone, 1]], 5)
  sweep(m, curl(layout.toe * 0.25, 0, -1), taper(0.6, 0.4), 'legs', [[bone, 1]], 5)
}
