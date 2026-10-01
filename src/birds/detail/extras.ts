import * as THREE from 'three'
import type { Profile } from './profile'
import type { DetailSpec } from './spec'
import { sweep, type Mesher } from './mesher'

/** a curl's loop turns this far round, radians: up and back from the back, over the top, and down in front */
const CURL_SWEEP = (5 / 3) * Math.PI
/** the length of a curl's feather along its loop, as a multiple of its height (a circle of that diameter, CURL_SWEEP round) */
export const CURL_LENGTH = CURL_SWEEP / 2
/**
 * the curled feathers' thickness (a tube's radius), and how far apart the two loops sit, metres: each covert is a
 * broad glossy feather 3-4 mm across, so the pair reads as two black loops from 15 m, not wires
 */
export const CURL_RADIUS = 0.0018
const CURL_GAP = 0.0022

/** a plume strand's radius where it leaves the head, and at its tip, and the two strands' distance apart, metres */
export const PLUME_RADIUS = 0.0015
const PLUME_TIP_RADIUS = 0.0003
const PLUME_GAP = 0.002
/** how much further than its droop a plume sags by its tip, degrees */
const PLUME_SAG = 20

export type PartSpec = NonNullable<DetailSpec['parts']>[number]

export interface PartResult {
  kind: PartSpec['kind']
  /** where it leaves the body, profile frame: its bone's joint */
  base: THREE.Vector3
  /** its highest point, profile frame */
  top: THREE.Vector3
  indexFirst: number
  indexCount: number
}

/**
 * The Mallard drake's curl: his two central tail coverts, curled into loops `height` high that rise from the back
 * midline, turn back and over, and come down in front (docs/research/2026-09-25-mallard.md, sections 4.1, 5, and 9:
 * two black loops about 20 mm high on the rump). Two closed tubes side by side, on the curl bone.
 */
export function buildCurl(m: Mesher, part: Extract<PartSpec, { kind: 'curl' }>, profile: Profile): PartResult {
  const indexFirst = m.indexCount
  const s = profile.sampleAt(profile.uOf(part.at) + (part.dx ?? 0) / profile.length)
  // the section's own up and forward, so a tilted station's back still carries it
  const up = new THREE.Vector3(s.axis.x, s.axis.y, 0), fwd = new THREE.Vector3(s.axis.y, -s.axis.x, 0)
  // a little inside the back, so the loops grow out of the feathers
  const base = new THREE.Vector3(s.point.x, s.point.y, 0).addScaledVector(up, s.up - CURL_RADIUS)
  const r = part.height / 2
  let top = base.clone()
  for (const side of [1, -1]) {
    const points: THREE.Vector3[] = [], radius: number[] = []
    for (let k = 0; k <= 24; k++) {
      const phi = -Math.PI / 2 - (CURL_SWEEP * k) / 24
      const p = base.clone().addScaledVector(up, r).addScaledVector(fwd, Math.cos(phi) * r).addScaledVector(up, Math.sin(phi) * r)
      p.z = side * CURL_GAP
      points.push(p)
      radius.push(CURL_RADIUS * (1 - 0.4 * (k / 24)))
      if (p.clone().sub(base).dot(up) > top.clone().sub(base).dot(up)) top = p.clone().setZ(0)
    }
    sweep(m, points, radius, 'curl', [['curl', 1]])
  }
  return { kind: part.kind, base, top, indexFirst, indexCount: m.indexCount - indexFirst }
}

/**
 * An adult heron's occipital plumes: two thin strands side by side, from just inside the top of the head at the
 * station `at`, trailing straight back `length`, `droop` degrees below the horizontal in the traced side view, and
 * sagging PLUME_SAG further by their tips. Closed tubes on the plume bone, which hangs from the head, so posed they
 * turn with it.
 */
export function buildPlume(m: Mesher, part: Extract<PartSpec, { kind: 'plume' }>, profile: Profile): PartResult {
  const indexFirst = m.indexCount
  const s = profile.sampleAt(profile.uOf(part.at) + (part.dx ?? 0) / profile.length)
  const up = new THREE.Vector3(s.axis.x, s.axis.y, 0), back = new THREE.Vector3(-1, 0, 0)
  const base = new THREE.Vector3(s.point.x, s.point.y, 0).addScaledVector(up, s.up - PLUME_RADIUS)
  const z = new THREE.Vector3(0, 0, 1)
  let top = base.clone()
  const STEPS = 16
  for (const side of [1, -1]) {
    const points: THREE.Vector3[] = [], radius: number[] = []
    const p = base.clone()
    for (let k = 0; k <= STEPS; k++) {
      if (k > 0) {
        // a positive turn about +z swings a line pointing back down: by the droop, and the sag so far
        const a = THREE.MathUtils.degToRad(part.droop + (PLUME_SAG * (k - 0.5)) / STEPS)
        p.addScaledVector(back.clone().applyAxisAngle(z, a), part.length / STEPS)
      }
      points.push(p.clone().setZ((side * PLUME_GAP) / 2))
      radius.push(PLUME_RADIUS + (PLUME_TIP_RADIUS - PLUME_RADIUS) * (k / STEPS))
      if (p.y > top.y) top = p.clone().setZ(0)
    }
    sweep(m, points, radius, 'plume', [['plume', 1]])
  }
  return { kind: part.kind, base, top, indexFirst, indexCount: m.indexCount - indexFirst }
}
