import * as THREE from 'three'
import { sectionOffset, type Profile } from './profile'
import { Mesher, type Weights } from './mesher'

export const RINGS = 64
export const RADIAL = 24

export interface LoftRig { neckBase: string; neckMid: string; head: string; tailBase?: string }

export interface LoftResult {
  /** first vertex and vertex count of the loft */
  first: number
  count: number
  /** first index and index count of the loft's triangles (a closed surface) */
  indexFirst: number
  indexCount: number
  /** arclength fraction of each ring */
  ringU: number[]
}

/** Texture t for a ring angle: 0 on the back midline, 1 on the belly midline, the same on both sides. */
export function ringT(theta: number): number {
  return theta <= Math.PI ? theta / Math.PI : (2 * Math.PI - theta) / Math.PI
}

/**
 * Skin weights along the spine: body until just before the neck base, then a linear hand-off
 * body -> neck -> neckMid -> head between the labelled stations. Always sums to 1. With `rearToTail` (a bird with no
 * tail), the rear of the body hands off from the tail bone at the rear end to the body at the tail base, so cocking
 * the tail cocks the stern.
 */
export function loftWeights(u: number, profile: Profile, rig: LoftRig, rearToTail = false): Weights {
  if (rearToTail && rig.tailBase) {
    const kT = profile.uOf(rig.tailBase)
    if (u <= 0) return [['tail', 1]]
    if (u < kT) return [['tail', 1 - u / kT], ['body', u / kT]]
  }
  const kNB = profile.uOf(rig.neckBase), kNM = profile.uOf(rig.neckMid), kH = profile.uOf(rig.head)
  const kB = Math.max(0, kNB - 0.08)
  const blend = (a: 'body' | 'neck' | 'neckMid', b: 'neck' | 'neckMid' | 'head', lo: number, hi: number): Weights => {
    const w = (u - lo) / (hi - lo)
    return [[a, 1 - w], [b, w]]
  }
  if (u <= kB) return [['body', 1]]
  if (u < kNB) return blend('body', 'neck', kB, kNB)
  if (u < kNM) return blend('neck', 'neckMid', kNB, kNM)
  if (u < kH) return blend('neckMid', 'head', kNM, kH)
  return [['head', 1]]
}

/** The body-neck-head surface: RINGS cross-sections swept along the spine, closed at both ends. */
export function buildLoft(m: Mesher, profile: Profile, rig: LoftRig, rearToTail = false): LoftResult {
  const first = m.count
  const indexFirst = m.indexCount
  const ringU: number[] = []
  const ring: number[][] = []
  const p = new THREE.Vector3()
  for (let i = 0; i < RINGS; i++) {
    const u = i / (RINGS - 1)
    ringU.push(u)
    const s = profile.sampleAt(u)
    const weights = loftWeights(u, profile, rig, rearToTail)
    const row: number[] = []
    for (let j = 0; j < RADIAL; j++) {
      const theta = (j / RADIAL) * Math.PI * 2
      const o = sectionOffset(theta, s.up, s.down, s.halfWidth)
      p.set(s.point.x + s.normal.x * o.n, s.point.y + s.normal.y * o.n, o.z)
      row.push(m.vertex(p, 'skin', u, ringT(theta), weights))
    }
    ring.push(row)
  }
  // sides: theta runs counter-clockwise around the tangent, so (i,j) (i,j+1) (i+1,j+1) (i+1,j) faces outward
  for (let i = 0; i < RINGS - 1; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const j1 = (j + 1) % RADIAL
      m.quad(ring[i]![j]!, ring[i]![j1]!, ring[i + 1]![j1]!, ring[i + 1]![j]!)
    }
  }
  // caps: a point a little beyond each end ring
  const s0 = profile.sampleAt(0), s1 = profile.sampleAt(1)
  const rear = m.vertex(new THREE.Vector3(
    s0.point.x - s0.tangent.x * Math.min(s0.up, s0.down) * 0.6,
    s0.point.y - s0.tangent.y * Math.min(s0.up, s0.down) * 0.6, 0), 'skin', 0, 0.5, loftWeights(0, profile, rig, rearToTail))
  const front = m.vertex(new THREE.Vector3(
    s1.point.x + s1.tangent.x * Math.min(s1.up, s1.down) * 0.3,
    s1.point.y + s1.tangent.y * Math.min(s1.up, s1.down) * 0.3, 0), 'skin', 1, 0.5, loftWeights(1, profile, rig))
  for (let j = 0; j < RADIAL; j++) {
    const j1 = (j + 1) % RADIAL
    m.tri(rear, ring[0]![j1]!, ring[0]![j]!)
    m.tri(front, ring[RINGS - 1]![j]!, ring[RINGS - 1]![j1]!)
  }
  return { first, count: m.count - first, indexFirst, indexCount: m.indexCount - indexFirst, ringU }
}

/**
 * The furthest any ring of the loft folds back over the ring before it, metres (0 when none do). A spine that
 * turns tighter than the section is deep on its inside creases the surface; species tests hold this at 0.
 */
export function worstFold(profile: Profile, rig: LoftRig): number {
  const m = new Mesher()
  const r = buildLoft(m, profile, rig)
  const t = new THREE.Vector3()
  let worst = 0
  for (let i = 0; i < RINGS - 1; i++) {
    const s = profile.sampleAt(r.ringU[i]!)
    t.set(s.tangent.x, s.tangent.y, 0)
    for (let j = 0; j < RADIAL; j++) {
      const step = m.position(r.first + (i + 1) * RADIAL + j).sub(m.position(r.first + i * RADIAL + j)).dot(t)
      worst = Math.max(worst, -step)
    }
  }
  return worst
}
