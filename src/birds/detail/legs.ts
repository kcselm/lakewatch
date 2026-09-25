import * as THREE from 'three'
import type { Profile } from './profile'
import type { DetailSpec } from './spec'
import { tube, type Mesher } from './mesher'
import { solveLeg } from './gait'

/** the hip joint sits this fraction of the belly depth below the spine */
const HIP_DEPTH = 0.35
/** hips sit this fraction of the body half-width out from the midline */
const HIP_SPREAD = 0.4
/** standing, the hip is this fraction of the leg's full reach above the foot */
const STAND = 0.92
/** tarsus diameter as a fraction of tarsus length */
const TARSUS_THICKNESS = 0.045
/** default step length as a fraction of leg length (tibia + tarsus) */
export const DEFAULT_STEP = 0.45

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
  /** standing positions, right leg, profile frame */
  knee: THREE.Vector3
  foot: THREE.Vector3
}

export function legLayout(detail: DetailSpec, profile: Profile): LegLayout {
  const s = profile.sampleAt(profile.uOf(detail.rig.hip))
  const hip = new THREE.Vector3(s.point.x, s.point.y - s.down * HIP_DEPTH, s.halfWidth * HIP_SPREAD)
  const bellyY = s.point.y - s.down
  const m = detail.measurements
  const tibia = (hip.y - bellyY) + m.tibia
  const standHeight = STAND * (tibia + m.tarsus)
  const tarsusRadius = (m.tarsus * TARSUS_THICKNESS) / 2
  const footY = tarsusRadius * 0.7
  const target = { x: hip.x, y: hip.y - standHeight }
  const { joint, foot } = solveLeg({ x: hip.x, y: hip.y }, target, tibia, m.tarsus)
  return {
    hip, bellyY, tibia, tarsus: m.tarsus, toe: m.toe, standHeight, footY, tarsusRadius,
    knee: new THREE.Vector3(joint.x, joint.y, hip.z),
    foot: new THREE.Vector3(foot.x, foot.y, hip.z),
  }
}

/** Toe directions in the ground plane for the right foot (+z outward); the left mirrors z. */
const TOES: { angle: number; length: number }[] = [
  { angle: -0.45, length: 0.8 },   // inner
  { angle: 0, length: 1 },         // middle
  { angle: 0.45, length: 0.8 },    // outer
]

/** Both legs in rest pose: tibia, a knob at the intertarsal joint, tarsus, three front toes and a hind toe. */
export function buildLegs(m: Mesher, layout: LegLayout): void {
  const r = layout.tarsusRadius
  for (const side of [1, -1] as const) {
    const B = side > 0
      ? { tibia: 'tibiaR', tarsus: 'tarsusR', toes: 'toesR' } as const
      : { tibia: 'tibiaL', tarsus: 'tarsusL', toes: 'toesL' } as const
    const mirror = (v: THREE.Vector3) => new THREE.Vector3(v.x, v.y, v.z * side)
    const hip = mirror(layout.hip), knee = mirror(layout.knee), foot = mirror(layout.foot)
    tube(m, hip, knee, r * 1.5, r * 1.1, 'legs', 0.5, 0.5, [[B.tibia, 1]])
    tube(m, knee.clone().add(new THREE.Vector3(0.6 * r, 0, 0)), knee.clone().add(new THREE.Vector3(-0.6 * r, 0, 0)), r * 1.25, r * 1.25, 'legs', 0.5, 0.5, [[B.tarsus, 1]])
    tube(m, knee, foot, r, r * 0.9, 'legs', 0.5, 0.5, [[B.tarsus, 1]])
    for (const toe of TOES) {
      const a = toe.angle * side
      const tip = foot.clone().add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(layout.toe * toe.length))
      tube(m, foot, tip, r * 0.7, r * 0.45, 'legs', 0.5, 0.5, [[B.toes, 1]], 5)
    }
    const hind = foot.clone().add(new THREE.Vector3(-layout.toe * 0.25, layout.footY, 0))
    tube(m, foot, hind, r * 0.6, r * 0.4, 'legs', 0.5, 0.5, [[B.toes, 1]], 5)
  }
}
