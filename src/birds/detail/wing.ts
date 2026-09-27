import * as THREE from 'three'
import type { Profile, ProfileSample } from './profile'
import type { DetailSpec } from './spec'
import { Mesher } from './mesher'
import { buildLoft, type LoftRig } from './loft'

/**
 * The folded wing's grid: columns along the chord (every other one where the builder had them before Task 19b, so the
 * wing follows the body's length closely enough that the skin needn't push it far off between them), rows down it
 */
const FOLD_S = 27
const FOLD_T = 5
const SPREAD_S = 10
const SPREAD_T = 4
/**
 * The least the body's skin ever comes to the folded wing, along the wing's normal, metres. At the telescope's 35 m, a
 * 24-bit depth buffer tells depths apart to about 0.07 mm with the optics' near plane (1 m, player/optics.ts), and to
 * about 0.7 mm with the eye's (0.1 m); with the eye's, at 1 mm the skin still flickered through a Mallard's wing there,
 * at 1.5 mm it no longer did (Task 19b). The optics' raised near plane now leaves room to spare; GAP stays for the eye.
 */
export const GAP = 0.0015
/** half the spacing between the two folded wings where they cross over the rump and tail, metres */
const MIN_Z = 0.003
/**
 * How far past a folded-wing triangle's plane the skin is looked for, metres: placed GAP off the skin at its corners,
 * no triangle lies deeper in it
 */
const LOOK = 0.005
/** how much further than LOOK, in the side view, the skin near a folded-wing triangle is gathered: room for it to move */
const PAD = 0.003
/** the furthest a folded-wing point moves in one round of clearing the skin, metres */
const STEP = 0.001
/** a folded-wing column no taller than this, metres, moves out as one piece (its points lie too close to move apart) */
const THIN = 0.004
/** the spread wing reaches this multiple of the wing chord out from the shoulder */
export const SPAN = 1.78
/** chord of the spread wing at its root, as a multiple of the wing chord */
export const ROOT_CHORD = 0.42

/** Folded-wing height (fraction of chord) at s, interpolated linearly through the outline. */
export function outlineAt(outline: readonly (readonly [number, number])[], s: number): number {
  if (s <= outline[0]![0]) return outline[0]![1]
  for (let i = 1; i < outline.length; i++) {
    const [s1, h1] = outline[i]!, [s0, h0] = outline[i - 1]!
    if (s <= s1) return h0 + ((h1 - h0) * (s - s0)) / (s1 - s0 || 1)
  }
  return outline[outline.length - 1]![1]
}

const tables = new WeakMap<Profile, ProfileSample[]>()

/** Spine samples over the body and lower neck (the wing never reaches the head), nearest in x to `x`. */
function nearestBodySample(profile: Profile, x: number): ProfileSample {
  let table = tables.get(profile)
  if (!table) {
    table = Array.from({ length: 121 }, (_, k) => profile.sampleAt((k / 120) * 0.6))
    tables.set(profile, table)
  }
  let best = table[0]!, bestD = Infinity
  for (const s of table) {
    const d = Math.abs(s.point.x - x)
    if (d < bestD) { bestD = d; best = s }
  }
  return best
}

/**
 * The right side of the body's skin exactly as the loft meshes it (its rings, their tilt, and the flat facets between
 * them), profile frame, with the left side mirrored onto it: `v` holds its vertices as x, y, z; `tri` its triangles,
 * three vertex numbers each; `edge` their edges, two vertex numbers each, once each.
 */
interface Skin {
  v: number[]; tri: number[]; edge: number[]
  /** each vertex's, edge's and triangle's box in the side view: lowest x, highest x, lowest y, highest y */
  box: Record<keyof Near, Float64Array>
  /** room for each vertex's place relative to a wing triangle (see skinPast) */
  h: Float64Array; u: Float64Array; w: Float64Array
}

function rightSkin(profile: Profile, rig: LoftRig): Skin {
  const m = new Mesher()
  const loft = buildLoft(m, profile, rig)
  const g = m.geometry()
  const index = g.getIndex()!.array
  g.dispose()
  const v: number[] = [], tri: number[] = [], edge: number[] = []
  const at = new Map<string, number>(), seen = new Set<number>()
  const p = new THREE.Vector3()
  // the skin's number for the loft vertex at (x, y, +-z), a vertex and its mirror image on the left being one
  const place = (x: number, y: number, z: number) => `${Math.round(x * 1e9)} ${Math.round(y * 1e9)} ${Math.round(Math.abs(z) * 1e9)}`
  const own = (i: number): number => {
    m.position(i, p)
    const key = place(p.x, p.y, p.z)
    let k = at.get(key)
    if (k === undefined) at.set(key, (k = v.push(p.x, p.y, Math.abs(p.z)) / 3 - 1))
    return k
  }
  const add = (a: number, b: number, c: number) => {
    tri.push(a, b, c)
    for (const [e0, e1] of [[a, b], [b, c], [c, a]] as const) {
      const key = Math.min(e0, e1) * 65536 + Math.max(e0, e1)
      if (!seen.has(key)) { seen.add(key); edge.push(e0, e1) }
    }
  }
  // the right side's triangles, then the left side's mirrored onto it (turned over, so they still face out): the left
  // side's quads are split along their other diagonal, and the wings, one the other's mirror image, clear both
  for (const side of [1, -1]) {
    for (let f = loft.indexFirst; f < loft.indexFirst + loft.indexCount; f += 3) {
      const ks = [index[f]!, index[f + 1]!, index[f + 2]!]
      if (!ks.every(i => m.position(i, p).z * side >= -1e-9)) continue
      const [a, b, c] = ks.map(own) as [number, number, number]
      if (side > 0) add(a, b, c)
      else add(a, c, b)
    }
  }
  const boxes = (ks: readonly number[], per: number) => {
    const out = new Float64Array((ks.length / per) * 4)
    for (let i = 0; i < ks.length / per; i++) {
      const xs = ks.slice(i * per, i * per + per).map(k => v[k * 3]!), ys = ks.slice(i * per, i * per + per).map(k => v[k * 3 + 1]!)
      out.set([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)], i * 4)
    }
    return out
  }
  const n = v.length / 3
  const box = { v: boxes(Array.from({ length: n }, (_, k) => k), 1), edge: boxes(edge, 2), tri: boxes(tri, 3) }
  return { v, tri, edge, box, h: new Float64Array(n), u: new Float64Array(n), w: new Float64Array(n) }
}

/**
 * The skin's outermost triangle over side-view point (x, y), where the skin lies over itself, and its height (z)
 * there; triangle -1 and height -Infinity off the body.
 */
function outermost(skin: Skin, x: number, y: number): { tri: number; z: number } {
  const { v, tri } = skin
  let z = -Infinity, best = -1
  for (let f = 0; f < tri.length; f += 3) {
    const a = tri[f]! * 3, b = tri[f + 1]! * 3, c = tri[f + 2]! * 3
    const area = (v[b]! - v[a]!) * (v[c + 1]! - v[a + 1]!) - (v[b + 1]! - v[a + 1]!) * (v[c]! - v[a]!)
    if (Math.abs(area) < 1e-14) continue
    const wb = ((x - v[a]!) * (v[c + 1]! - v[a + 1]!) - (y - v[a + 1]!) * (v[c]! - v[a]!)) / area
    const wc = ((v[b]! - v[a]!) * (y - v[a + 1]!) - (v[b + 1]! - v[a + 1]!) * (x - v[a]!)) / area
    if (wb < -1e-9 || wc < -1e-9 || wb + wc > 1 + 1e-9) continue
    const h = (1 - wb - wc) * v[a + 2]! + wb * v[b + 2]! + wc * v[c + 2]!
    if (h > z) { z = h; best = f / 3 }
  }
  return { tri: best, z }
}

/** Skin triangle f's outward normal, turned square to the side view's x (so it never points along the body). */
function outwardInSection(skin: Skin, f: number): THREE.Vector3 {
  const { v, tri } = skin
  const a = new THREE.Vector3().fromArray(v, tri[f * 3]! * 3)
  const b = new THREE.Vector3().fromArray(v, tri[f * 3 + 1]! * 3).sub(a)
  const c = new THREE.Vector3().fromArray(v, tri[f * 3 + 2]! * 3).sub(a)
  const n = b.cross(c).setX(0)
  return n.lengthSq() > 1e-20 ? n.normalize() : n.set(0, 0, 1)
}

/** The height (z) of the body's skin, as the loft meshes it, over side-view point (x, y), profile frame; -Infinity off the body. */
export function skinHeight(profile: Profile, rig: LoftRig): (x: number, y: number) => number {
  const skin = rightSkin(profile, rig)
  return (x, y) => outermost(skin, x, y).z
}

/** The skin's vertices, edges and triangles (their numbers) that come within `pad` of a side-view box. */
interface Near { v: number[]; edge: number[]; tri: number[] }

function skinNear(skin: Skin, x0: number, x1: number, y0: number, y1: number, pad: number): Near {
  const lox = x0 - pad, hix = x1 + pad, loy = y0 - pad, hiy = y1 + pad
  const out: Near = { v: [], edge: [], tri: [] }
  for (const kind of ['v', 'edge', 'tri'] as const) {
    const b = skin.box[kind]
    for (let i = 0; i < b.length; i += 4) if (b[i + 1]! >= lox && b[i]! <= hix && b[i + 3]! >= loy && b[i + 2]! <= hiy) out[kind].push(i / 4)
  }
  return out
}

/** Where the line through p along unit d crosses skin triangle f, as a multiple of d (either sign); NaN if it misses. */
function crossing(skin: Skin, f: number, p: THREE.Vector3, d: THREE.Vector3): number {
  const { v, tri } = skin
  const a = tri[f * 3]! * 3, b = tri[f * 3 + 1]! * 3, c = tri[f * 3 + 2]! * 3
  const e1x = v[b]! - v[a]!, e1y = v[b + 1]! - v[a + 1]!, e1z = v[b + 2]! - v[a + 2]!
  const e2x = v[c]! - v[a]!, e2y = v[c + 1]! - v[a + 1]!, e2z = v[c + 2]! - v[a + 2]!
  const px = d.y * e2z - d.z * e2y, py = d.z * e2x - d.x * e2z, pz = d.x * e2y - d.y * e2x
  const det = e1x * px + e1y * py + e1z * pz
  if (Math.abs(det) < 1e-18) return NaN
  const tx = p.x - v[a]!, ty = p.y - v[a + 1]!, tz = p.z - v[a + 2]!
  const u = (tx * px + ty * py + tz * pz) / det
  if (u < 0 || u > 1) return NaN
  const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x
  const w = (d.x * qx + d.y * qy + d.z * qz) / det
  if (w < 0 || u + w > 1) return NaN
  return (e2x * qx + e2y * qy + e2z * qz) / det
}

/** The skin at its furthest out over a wing triangle: how far past the triangle's plane, and where (barycentric weights). */
interface Past { h: number; w: [number, number, number] }

/**
 * How far the skin `near` a wing triangle (a, b, c) stands out past the triangle's plane, along its unit normal n, at
 * most, over the triangle seen along n (negative where the skin lies behind it), and where; null if none of it lies
 * between GAP behind the plane and LOOK in front. The skin is flat between its vertices, so its furthest point out over
 * the triangle is right under a corner, one of its own vertices inside, or where one of its edges crosses a side.
 */
function skinPast(skin: Skin, near: Near, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, n: THREE.Vector3): Past | null {
  const { v, edge } = skin
  // the triangle in its own plane: a at (0, 0), b at (bu, 0), c at (cu, cv), with cv > 0
  const bu = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
  const e1x = (b.x - a.x) / bu, e1y = (b.y - a.y) / bu, e1z = (b.z - a.z) / bu
  const e2x = n.y * e1z - n.z * e1y, e2y = n.z * e1x - n.x * e1z, e2z = n.x * e1y - n.y * e1x
  const cu = (c.x - a.x) * e1x + (c.y - a.y) * e1y + (c.z - a.z) * e1z
  const cv = (c.x - a.x) * e2x + (c.y - a.y) * e2y + (c.z - a.z) * e2z
  // the furthest out so far: its height over the plane, and where it lies in the plane
  let bh = -Infinity, bu0 = 0, bw0 = 0
  // skin vertex k, from a: its height over the plane (h), and where it lies in the plane (u, w)
  const { h, u, w } = skin
  const place = (k: number) => {
    const x = v[k * 3]! - a.x, y = v[k * 3 + 1]! - a.y, z = v[k * 3 + 2]! - a.z
    h[k] = x * n.x + y * n.y + z * n.z; u[k] = x * e1x + y * e1y + z * e1z; w[k] = x * e2x + y * e2y + z * e2z
  }
  for (const k of near.v) {
    place(k)
    if (h[k]! < -GAP || h[k]! > LOOK || h[k]! <= bh) continue
    const wc = w[k]! / cv, wb = (u[k]! - cu * wc) / bu
    if (wb >= 0 && wc >= 0 && wb + wc <= 1) { bh = h[k]!; bu0 = u[k]!; bw0 = w[k]! }
  }
  const sides = [0, 0, bu, 0, bu, 0, cu, cv, cu, cv, 0, 0]
  for (const e of near.edge) {
    const k0 = edge[e * 2]!, k1 = edge[e * 2 + 1]!
    place(k0); place(k1)
    const h0 = h[k0]!, h1 = h[k1]!
    if ((h0 < -GAP && h1 < -GAP) || (h0 > LOOK && h1 > LOOK) || Math.max(h0, h1) <= bh) continue
    const u0 = u[k0]!, w0 = w[k0]!, du = u[k1]! - u0, dw = w[k1]! - w0
    for (let i = 0; i < 12; i += 4) {
      // the edge at (u0, w0) + s (du, dw) meets the side from p to q at p + t (q - p)
      const pu = sides[i]!, pw = sides[i + 1]!, su = sides[i + 2]! - pu, sw = sides[i + 3]! - pw
      const den = du * sw - dw * su
      if (Math.abs(den) < 1e-18) continue
      const s = ((pu - u0) * sw - (pw - w0) * su) / den
      const t = ((pu - u0) * dw - (pw - w0) * du) / den
      const hs = h0 + s * (h1 - h0)
      if (s < 0 || s > 1 || t < 0 || t > 1 || hs < -GAP || hs > LOOK || hs <= bh) continue
      bh = hs; bu0 = pu + t * su; bw0 = pw + t * sw
    }
  }
  const corners = [[a, 0, 0], [b, bu, 0], [c, cu, cv]] as const
  for (const [corner, cu0, cw0] of corners) {
    for (const f of near.tri) {
      const hc = crossing(skin, f, corner, n)
      if (hc >= -GAP && hc <= LOOK && hc > bh) { bh = hc; bu0 = cu0; bw0 = cw0 }
    }
  }
  if (bh === -Infinity) return null
  const wc = bw0 / cv, wb = (bu0 - cu * wc) / bu
  return { h: bh, w: [1 - wb - wc, wb, wc] }
}

export interface FoldResult {
  /** right wing, profile frame */
  wrist: THREE.Vector3
  tip: THREE.Vector3
  /** the folded wing's lowest point, profile frame y */
  low: number
}

/**
 * The right folded wing's points: a shell hugging the flank, hanging from the chord line (wrist to tip). The chord is
 * measurements.wingChord long and droops `droop` degrees below straight back; `outline` sets its height.
 *
 * The shell follows the loft as it is meshed. Each point starts at its place (s, t) in the side view, GAP out (in z)
 * from the skin there; off the body, where the two wings cross over the rump and tail, MIN_Z out from the midline.
 * Then any of the shell's flat triangles that the skin still comes nearer than GAP to, along the triangle's normal
 * (bulging out between its corners, or where the triangle tilts over the curve of the back), has its corners moved out
 * a little at a time until none does: over the body along the skin's normal (never along the body), off it straight
 * out. A column with no height, or under THIN, moves as one, so it can't fold over itself.
 */
function placeFold(detail: DetailSpec, profile: Profile): THREE.Vector3[] {
  const chord = detail.measurements.wingChord
  const droop = THREE.MathUtils.degToRad(detail.wing.droop)
  const dir = new THREE.Vector2(-Math.cos(droop), -Math.sin(droop))
  const down = new THREE.Vector2(-dir.y, dir.x)
  const [wx, wy] = detail.wing.wrist
  const skin = rightSkin(profile, detail.rig)
  // grid point (i, j), at s = i / (FOLD_S - 1) and t = j / (FOLD_T - 1), is number k(i, j): `at` is where it is, `out`
  // the way it moves out, and each column's height sets how it moves
  const k = (i: number, j: number) => i * FOLD_T + j
  const height = (i: number) => outlineAt(detail.wing.outline, i / (FOLD_S - 1)) * chord
  const at: THREE.Vector3[] = [], out: THREE.Vector3[] = []
  for (let i = 0; i < FOLD_S; i++) {
    const h = height(i)
    for (let j = 0; j < FOLD_T; j++) {
      const s = i / (FOLD_S - 1), t = j / (FOLD_T - 1)
      const x = wx + dir.x * s * chord + down.x * t * h, y = wy + dir.y * s * chord + down.y * t * h
      const under = outermost(skin, x, y)
      at.push(new THREE.Vector3(x, y, Math.max(under.z + GAP, MIN_Z)))
      out.push(h > 0 && under.tri >= 0 && under.z + GAP > MIN_Z ? outwardInSection(skin, under.tri) : new THREE.Vector3(0, 0, 1))
    }
    if (h > 0 && h <= THIN) {
      // a narrow strip moves one way, the mean of its points'
      const mean = new THREE.Vector3()
      for (let j = 0; j < FOLD_T; j++) mean.add(out[k(i, j)]!)
      for (let j = 0; j < FOLD_T; j++) out[k(i, j)]!.copy(mean).normalize()
    }
  }
  // a column with no height is the chord line alone, with no surface: it stands at least as far out as the nearest
  // column with height begins (at its top), so the wing's first triangles, fanning back from it, lie along the flank
  for (let i = 0; i < FOLD_S; i++) {
    if (height(i) > 0) continue
    let near = -1
    for (let d = 1; d < FOLD_S && near < 0; d++) near = [i + d, i - d].find(c => c >= 0 && c < FOLD_S && height(c) > 0) ?? -1
    if (near >= 0) for (let j = 0; j < FOLD_T; j++) at[k(i, j)]!.z = Math.max(at[k(i, j)]!.z, at[k(near, 0)]!.z)
  }
  // the triangles m.quad makes of each quad (see buildFoldedWings), and the skin each could come near
  const tris: { c: [number, number, number]; near: Near }[] = []
  for (let i = 0; i < FOLD_S - 1; i++) {
    for (let j = 0; j < FOLD_T - 1; j++) {
      for (const c of [[k(i, j), k(i + 1, j), k(i + 1, j + 1)], [k(i, j), k(i + 1, j + 1), k(i, j + 1)]] as [number, number, number][]) {
        const xs = c.map(q => at[q]!.x), ys = c.map(q => at[q]!.y)
        tris.push({ c, near: skinNear(skin, Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), LOOK + PAD) })
      }
    }
  }
  const normal = new THREE.Vector3(), ad = new THREE.Vector3()
  // only a triangle with a corner that moved can have come nearer the skin since it was last looked at
  let moved = at.map(() => true)
  for (let pass = 0; pass < 200; pass++) {
    const move = at.map(() => 0)
    let short = 0
    for (const { c, near } of tris) {
      if (!moved[c[0]] && !moved[c[1]] && !moved[c[2]]) continue
      const a = at[c[0]]!, b = at[c[1]]!, d = at[c[2]]!
      normal.subVectors(b, a).cross(ad.subVectors(d, a))
      // a triangle with no area (a wing with no height) has no surface to clear
      if (normal.length() < 1e-10) continue
      normal.normalize()
      const past = skinPast(skin, near, a, b, d, normal)
      if (!past || past.h + GAP <= 0) continue
      const need = past.h + GAP
      // the least moves of the corners that lift the plane by `need` over the skin's furthest point: the corners
      // nearest it, and moving most nearly along the triangle's normal, move most
      const g = c.map((q, x) => past.w[x]! * Math.max(out[q]!.dot(normal), 0))
      const sum = g[0]! ** 2 + g[1]! ** 2 + g[2]! ** 2
      c.forEach((q, x) => {
        const step = sum > 1e-6 ? (need * g[x]!) / sum : need / Math.max(out[q]!.dot(normal), 0.3)
        move[q] = Math.max(move[q]!, Math.min(step, STEP))
      })
      short = Math.max(short, need)
    }
    if (short < 1e-6) break
    for (let i = 0; i < FOLD_S; i++) {
      if (height(i) > THIN) continue
      const most = Math.max(...Array.from({ length: FOLD_T }, (_, j) => move[k(i, j)]!))
      for (let j = 0; j < FOLD_T; j++) move[k(i, j)] = most
    }
    at.forEach((p, q) => p.addScaledVector(out[q]!, move[q]!))
    moved = move.map(x => x > 0)
  }
  return at
}

/**
 * The right folded wing's points, (i, j) at i * FOLD_T + j, for a detail block (and its own profile): every bird of a
 * species shares them, and they take a while to place
 */
const placed = new WeakMap<DetailSpec, readonly THREE.Vector3[]>()

/**
 * Folded wings: a shell hugging each flank, hanging from the chord line (wrist to tip), placed by placeFold. `profile`
 * is the detail's own, createProfile(detail.profile).
 */
export function buildFoldedWings(m: Mesher, detail: DetailSpec, profile: Profile): FoldResult {
  let at = placed.get(detail)
  if (!at) placed.set(detail, (at = placeFold(detail, profile)))
  const k = (i: number, j: number) => i * FOLD_T + j
  let low = Infinity
  for (const side of [1, -1] as const) {
    const bone = side > 0 ? 'wingFoldR' : 'wingFoldL'
    const grid: number[][] = []
    for (let i = 0; i < FOLD_S; i++) {
      const row: number[] = []
      for (let j = 0; j < FOLD_T; j++) {
        const p = at[k(i, j)]!
        low = Math.min(low, p.y)
        row.push(m.vertex(new THREE.Vector3(p.x, p.y, side * p.z), 'wingFold', i / (FOLD_S - 1), j / (FOLD_T - 1), [[bone, 1]]))
      }
      grid.push(row)
    }
    // s runs back, t runs down: (i,j) (i+1,j) (i+1,j+1) (i,j+1) faces +z; mirror for the left wing
    for (let i = 0; i < FOLD_S - 1; i++) {
      for (let j = 0; j < FOLD_T - 1; j++) {
        const a = grid[i]![j]!, b = grid[i + 1]![j]!, c = grid[i + 1]![j + 1]!, d = grid[i]![j + 1]!
        if (side > 0) m.quad(a, b, c, d)
        else m.quad(a, d, c, b)
      }
    }
  }
  return { wrist: at[k(0, 0)]!.clone(), tip: at[k(FOLD_S - 1, 0)]!.clone(), low }
}

/** Right shoulder joint for the spread wing (profile frame): above the flank, just behind the wrist. */
export function shoulderAt(detail: DetailSpec, profile: Profile): THREE.Vector3 {
  const best = nearestBodySample(profile, detail.wing.wrist[0])
  return new THREE.Vector3(best.point.x, best.point.y + best.up * 0.5, best.halfWidth * 0.8)
}

/**
 * Spread wings, basic this round: a swept, pointed planform in the shoulder's horizontal plane reaching
 * SPAN x chord out along +-z, upper face on 'wingSpread' and under face on 'wingUnder'.
 */
export function buildSpreadWings(m: Mesher, detail: DetailSpec, shoulder: THREE.Vector3): void {
  const c = detail.measurements.wingChord
  const span = SPAN * c, root = ROOT_CHORD * c
  for (const side of [1, -1] as const) {
    const bone = side > 0 ? 'wingR' : 'wingL'
    for (const face of ['wingSpread', 'wingUnder'] as const) {
      const dy = face === 'wingSpread' ? 0.0003 : -0.0003
      const grid: number[][] = []
      for (let i = 0; i < SPREAD_S; i++) {
        const s = i / (SPREAD_S - 1)
        const chord = root * (1 - 0.85 * s ** 1.3)
        const le = 0.25 * root - 0.35 * root * s ** 1.5
        const row: number[] = []
        for (let j = 0; j < SPREAD_T; j++) {
          const t = j / (SPREAD_T - 1)
          const p = new THREE.Vector3(shoulder.x + le - chord * t, shoulder.y + dy, side * (shoulder.z + s * span))
          row.push(m.vertex(p, face, s, t, [[bone, 1]]))
        }
        grid.push(row)
      }
      // s runs out along +-z, t runs back: pick the winding that faces up for the upper face, down for the under
      const up = face === 'wingSpread'
      for (let i = 0; i < SPREAD_S - 1; i++) {
        for (let j = 0; j < SPREAD_T - 1; j++) {
          const a = grid[i]![j]!, b = grid[i]![j + 1]!, cc = grid[i + 1]![j + 1]!, d = grid[i + 1]![j]!
          if ((side > 0) === up) m.quad(a, b, cc, d)
          else m.quad(a, d, cc, b)
        }
      }
    }
  }
}
