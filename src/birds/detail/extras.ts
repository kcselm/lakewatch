import * as THREE from 'three'
import type { Profile } from './profile'
import type { DetailSpec } from './spec'
import { sweep, type Mesher } from './mesher'

/** a curl's loop turns this far round, radians: up and back from the back, over the top, and down in front */
const CURL_SWEEP = (5 / 3) * Math.PI
/** the length of a curl's feather along its loop, as a multiple of its height (a circle of that diameter, CURL_SWEEP round) */
export const CURL_LENGTH = CURL_SWEEP / 2
/** the curled feathers' thickness (a tube's radius), and how far apart the two loops sit, metres */
export const CURL_RADIUS = 0.0012
const CURL_GAP = 0.0016

/** a plume strand's radius where it leaves the head, and at its tip, and the two strands' distance apart, metres */
export const PLUME_RADIUS = 0.0015
const PLUME_TIP_RADIUS = 0.0003
const PLUME_GAP = 0.002
/** how much further than its droop a plume sags by its tip, degrees */
const PLUME_SAG = 20

/** a crest strand's radius where it leaves the head, and at its tip, metres: five side by side make a lobe's tuft */
export const CREST_RADIUS = 0.004
const CREST_TIP_RADIUS = 0.001
/**
 * A lobe's strands, set by eye for a ragged tuft (belted-kingfisher.md, section 5.2: "a ragged double tuft", "never
 * quite smooth"): each one's share of the lobe's length, its turn up from the lobe's lie in degrees, and where it
 * leaves the head across the lobe's width (−1 its left edge, 1 its right).
 */
const CREST_STRANDS = [
  { length: 0.8, turn: 6, across: -1 },
  { length: 0.95, turn: -3, across: -0.5 },
  { length: 1, turn: 0, across: 0 },
  { length: 0.9, turn: 4, across: 0.5 },
  { length: 0.75, turn: -5, across: 1 },
] as const
/** a lobe's width across the head, as a fraction of the head's width at its station; and how far its strands splay out sideways, degrees */
const CREST_WIDTH = 0.5
const CREST_SPLAY = 8
/** how far up a crest strand's tip flips over its length, degrees: the feathers' ragged ends lift off the nape (by eye) */
const CREST_FLIP = 12

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

/** A crest: where each of its two lobes leaves the head (its bone's joint), profile frame, as well. */
export interface CrestResult extends PartResult { lobes: [THREE.Vector3, THREE.Vector3] }

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

/**
 * A shaggy crest in two lobes (a Belted Kingfisher's: a tuft at the crown and one at the occiput, with a notch between;
 * belted-kingfisher.md, section 5.2). Each lobe is a tuft of tapering strands that leave the top of the head at the
 * lobe's station, side by side across its width, and trail back its length at its lie, a little ragged, flipping up
 * at their tips. Closed tubes, the first lobe's on the crest bone and the second's on crestBack: both hang from the
 * head, and crestRaise turns each up about its own base, so the two lobes rise without either leaving the head.
 */
export function buildCrest(m: Mesher, part: Extract<PartSpec, { kind: 'crest' }>, profile: Profile): CrestResult {
  const indexFirst = m.indexCount
  const z = new THREE.Vector3(0, 0, 1), back = new THREE.Vector3(-1, 0, 0)
  const STEPS = 6
  const bases: THREE.Vector3[] = []
  let top = new THREE.Vector3(0, -Infinity, 0)
  part.lobes.forEach((lobe, k) => {
    const s = profile.sampleAt(profile.uOf(lobe.at) + (lobe.dx ?? 0) / profile.length)
    const up = new THREE.Vector3(s.axis.x, s.axis.y, 0)
    // just inside the top of the head, on the midline: the lobe's base, where it turns
    const base = new THREE.Vector3(s.point.x, s.point.y, 0).addScaledVector(up, s.up - CREST_RADIUS)
    bases.push(base)
    for (const strand of CREST_STRANDS) {
      // across the head the top falls away: an elliptical section's height that far out, so each strand starts inside
      const across = strand.across * CREST_WIDTH * s.halfWidth
      const p = base.clone().addScaledVector(up, -s.up * (1 - Math.sqrt(1 - (across / s.halfWidth) ** 2))).setZ(across)
      const step = (lobe.length * strand.length) / STEPS
      const points: THREE.Vector3[] = [p.clone()], radius: number[] = [CREST_RADIUS]
      for (let i = 1; i <= STEPS; i++) {
        // a negative turn about +z lifts a line pointing back: by the lie, the strand's own turn, and the flip so far
        const a = THREE.MathUtils.degToRad(lobe.lie + strand.turn + (CREST_FLIP * (i - 0.5)) / STEPS)
        const dir = back.clone().applyAxisAngle(z, -a)
        dir.z = strand.across * Math.sin(THREE.MathUtils.degToRad(CREST_SPLAY))
        p.addScaledVector(dir.normalize(), step)
        points.push(p.clone())
        radius.push(CREST_RADIUS + (CREST_TIP_RADIUS - CREST_RADIUS) * (i / STEPS))
        if (p.y > top.y) top = p.clone().setZ(0)
      }
      sweep(m, points, radius, 'crest', [[k === 0 ? 'crest' : 'crestBack', 1]])
    }
  })
  return { kind: part.kind, base: bases[0]!, top, lobes: [bases[0]!, bases[1]!], indexFirst, indexCount: m.indexCount - indexFirst }
}
