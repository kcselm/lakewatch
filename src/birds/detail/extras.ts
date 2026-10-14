import * as THREE from 'three'
import type { Profile } from './profile'
import type { DetailSpec } from './spec'
import { sweep, type Mesher } from './mesher'

/** a curl's loop turns this far round, radians: up and back from the back, over the top, and down in front */
const CURL_SWEEP = (5 / 3) * Math.PI
/** the length of a curl's feather along its loop, as a multiple of its height (a circle of that diameter, CURL_SWEEP round) */
export const CURL_LENGTH = CURL_SWEEP / 2
/**
 * the curled feathers' half-width in the side view (a ribbon's), and how far apart the two loops sit across the back,
 * metres: each covert is a broad glossy feather 3-4 mm across, so the pair reads as two black loops from 15 m, not wires
 */
export const CURL_RADIUS = 0.0018
const CURL_GAP = 0.0022
/** a curled feather's half-thickness across the back, metres: a flat vane, seen broad from the side and thin from behind */
const CURL_THICKNESS = 0.0009
/**
 * How far ahead of the first loop the second rises, as a multiple of the curl's height: on the traced drake the two
 * stand 9-11 mm apart along the back, one in front of the other, not side by side (docs/research/2026-09-25-mallard.md,
 * section 8.1, photo 1); a little closer here, where the loft's stern rises more steeply than his black rump under them
 */
const CURL_STAGGER = 0.35
/** how far in a loop's end curls, as a share of its radius, from past the top of the loop to its end */
const CURL_IN = 0.4

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
 * The Mallard drake's curl: his two central tail coverts, curled into loops that rise from the back midline, turn back
 * and over, come down in front, and curl in (docs/research/2026-09-25-mallard.md, sections 4.1, 5, and 9: two black
 * loops about 20 mm high on the rump). Both are `height` high: the first rises from the back at its station, the
 * second CURL_STAGGER of that ahead, its foot sunk into the back so its top is just under the first's, as the traced
 * drake's tops are level. Two closed ribbons, on the curl bone.
 */
export function buildCurl(m: Mesher, part: Extract<PartSpec, { kind: 'curl' }>, profile: Profile): PartResult {
  const indexFirst = m.indexCount
  const u = profile.uOf(part.at) + (part.dx ?? 0) / profile.length
  // where a loop leaves the back at u: a little inside it, so the loop grows out of the feathers; and the section's own
  // up and forward there, so a tilted station's back still carries it
  const foot = (at: number) => {
    const s = profile.sampleAt(at)
    const up = new THREE.Vector3(s.axis.x, s.axis.y, 0), fwd = new THREE.Vector3(s.axis.y, -s.axis.x, 0)
    return { up, fwd, base: new THREE.Vector3(s.point.x, s.point.y, 0).addScaledVector(up, s.up - CURL_RADIUS) }
  }
  const first = foot(u), second = foot(u + (CURL_STAGGER * part.height) / profile.length)
  // the back rises steeply at the stern, so the second loop's foot is sunk into it until its top is just under the first's
  const sink = second.base.y + part.height * second.up.y - (first.base.y + part.height * first.up.y) + CURL_RADIUS / 2
  if (sink > 0) second.base.addScaledVector(second.up, -sink / second.up.y)
  const loops = [{ ...first, z: -CURL_GAP }, { ...second, z: CURL_GAP }]
  let top = first.base.clone()
  const height = part.height
  for (const { up, fwd, base, z } of loops) {
    const points: THREE.Vector3[] = [], radius: number[] = [], across: number[] = []
    const STEPS = 24
    for (let k = 0; k <= STEPS; k++) {
      const phi = -Math.PI / 2 - (CURL_SWEEP * k) / STEPS
      // round to past the top (phi = -3 pi / 2), then curling in toward the loop's middle
      const past = Math.max(0, (k / STEPS - 0.6) / 0.4)
      const r = (height / 2) * (1 - CURL_IN * past * past)
      const p = base.clone().addScaledVector(up, height / 2).addScaledVector(fwd, Math.cos(phi) * r).addScaledVector(up, Math.sin(phi) * r)
      p.z = z
      points.push(p)
      radius.push(CURL_RADIUS * (1 - 0.4 * (k / STEPS)))
      across.push(CURL_THICKNESS * (1 - 0.4 * (k / STEPS)))
      if (p.clone().sub(first.base).dot(first.up) > top.clone().sub(first.base).dot(first.up)) top = p.clone().setZ(0)
    }
    sweep(m, points, radius, 'curl', [['curl', 1]], 8, across)
  }
  return { kind: part.kind, base: first.base, top, indexFirst, indexCount: m.indexCount - indexFirst }
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
