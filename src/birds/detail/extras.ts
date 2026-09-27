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
export function buildCurl(m: Mesher, part: PartSpec, profile: Profile): PartResult {
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
