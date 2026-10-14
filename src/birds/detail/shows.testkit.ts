import * as THREE from 'three'
import type { DetailedBirdModel } from './build'
import { ATLAS_SIZE } from '../paint/atlas'

/**
 * What a posed bird shows from a side: rays cast every `spacing` metres (1 mm) straight at it across its whole extent,
 * each stopped by the nearest of the skinned mesh's triangles as the last pose() left them (morph targets and bones
 * both), the paint read where it lands. For the song spread's measures: how much red and buff shows side-on and
 * front-on, how much the silhouette grows.
 */
export type View = 'side' | 'front'

export interface Hit { rgb: [number, number, number]; u: number; v: number }

export interface Shown {
  /** one hit per ray that met the bird, keyed by the ray's place across the view (its column and row) */
  hits: Map<number, Hit>
  /** the area each ray stands for, m² */
  cell: number
  /** the silhouette's extent across the view (the bird's length side-on, its width front-on) and up it, metres */
  width: number
  height: number
  /** where the rays start, across and up (the bird's group space), their spacing, and how many columns there are */
  a0: number
  b0: number
  spacing: number
  cols: number
}

/**
 * Casts the rays: side-on from the bird's right (+z), across x and y; front-on from ahead (+x), across z and y. The
 * mesh's geometry is read as posed, each vertex where `getVertexPosition` puts it (the bird's group space).
 */
export function shows(model: DetailedBirdModel, pixels: Uint8ClampedArray, view: View, spacing = 0.001): Shown {
  model.group.updateMatrixWorld(true)
  const mesh = model.mesh
  const g = mesh.geometry
  const uv = g.getAttribute('uv') as THREE.BufferAttribute
  const index = g.getIndex()!
  const n = uv.count
  const P = new Float64Array(n * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    mesh.getVertexPosition(i, v)
    P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z
  }
  // across (a), up (b), toward the viewer (d)
  const ax = view === 'side' ? 0 : 2, dx = view === 'side' ? 2 : 0
  let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity
  for (let i = 0; i < n; i++) {
    a0 = Math.min(a0, P[i * 3 + ax]!); a1 = Math.max(a1, P[i * 3 + ax]!)
    b0 = Math.min(b0, P[i * 3 + 1]!); b1 = Math.max(b1, P[i * 3 + 1]!)
  }
  const cols = Math.ceil((a1 - a0) / spacing) + 1
  const depth = new Map<number, number>()
  const hits = new Map<number, Hit>()
  for (let t = 0; t < index.count; t += 3) {
    const i0 = index.getX(t), i1 = index.getX(t + 1), i2 = index.getX(t + 2)
    const A = [P[i0 * 3 + ax]!, P[i0 * 3 + 1]!, P[i0 * 3 + dx]!], B = [P[i1 * 3 + ax]!, P[i1 * 3 + 1]!, P[i1 * 3 + dx]!], C = [P[i2 * 3 + ax]!, P[i2 * 3 + 1]!, P[i2 * 3 + dx]!]
    const area = (B[0]! - A[0]!) * (C[1]! - A[1]!) - (C[0]! - A[0]!) * (B[1]! - A[1]!)
    if (Math.abs(area) < 1e-16) continue
    const lo = Math.ceil((Math.min(A[0]!, B[0]!, C[0]!) - a0) / spacing), hi = Math.floor((Math.max(A[0]!, B[0]!, C[0]!) - a0) / spacing)
    const lb = Math.ceil((Math.min(A[1]!, B[1]!, C[1]!) - b0) / spacing), hb = Math.floor((Math.max(A[1]!, B[1]!, C[1]!) - b0) / spacing)
    for (let i = lo; i <= hi; i++) {
      const x = a0 + i * spacing
      for (let j = lb; j <= hb; j++) {
        const y = b0 + j * spacing
        const w1 = ((x - A[0]!) * (C[1]! - A[1]!) - (C[0]! - A[0]!) * (y - A[1]!)) / area
        const w2 = ((B[0]! - A[0]!) * (y - A[1]!) - (x - A[0]!) * (B[1]! - A[1]!)) / area
        const w0 = 1 - w1 - w2
        if (w0 < 0 || w1 < 0 || w2 < 0) continue
        const d = w0 * A[2]! + w1 * B[2]! + w2 * C[2]!
        const key = j * cols + i
        if ((depth.get(key) ?? -Infinity) >= d) continue
        depth.set(key, d)
        const u = w0 * uv.getX(i0) + w1 * uv.getX(i1) + w2 * uv.getX(i2)
        const vv = w0 * uv.getY(i0) + w1 * uv.getY(i1) + w2 * uv.getY(i2)
        const px = Math.min(ATLAS_SIZE - 1, Math.max(0, Math.floor(u * ATLAS_SIZE)))
        const py = Math.min(ATLAS_SIZE - 1, Math.max(0, Math.floor(vv * ATLAS_SIZE)))
        const k = (py * ATLAS_SIZE + px) * 4
        hits.set(key, { rgb: [pixels[k]!, pixels[k + 1]!, pixels[k + 2]!], u, v: vv })
      }
    }
  }
  return { hits, cell: spacing * spacing, width: a1 - a0, height: b1 - b0, a0, b0, spacing, cols }
}

/** Hue (degrees), saturation and value (0 to 1) of an 8-bit colour. */
export function hsv([r, g, b]: [number, number, number]): { h: number; s: number; v: number } {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min
  let h = 0
  if (d > 0) h = max === R ? 60 * (((G - B) / d) % 6) : max === G ? 60 * ((B - R) / d + 2) : 60 * ((R - G) / d + 4)
  return { h: (h + 360) % 360, s: max === 0 ? 0 : d / max, v: max }
}

/**
 * the shoulder's red (scarlet to vermilion, or a first-year's orange), as painted: saturated and bright, so neither the
 * fresh feathers' rusty edges nor a female's rusty-brown shoulder counts
 */
export const isRed = (rgb: [number, number, number]) => { const c = hsv(rgb); return c.s > 0.72 && c.v > 0.5 && (c.h < 30 || c.h > 345) }
/** the buff bar (deep buff to ochraceous), brighter than any buff edge */
export const isBuff = (rgb: [number, number, number]) => { const c = hsv(rgb); return c.s > 0.3 && c.s <= 0.72 && c.v > 0.68 && c.h >= 22 && c.h <= 50 }

/** The area of a shown view whose paint passes `test`, m² */
export function areaOf(s: Shown, test: (rgb: [number, number, number]) => boolean): number {
  let n = 0
  for (const h of s.hits.values()) if (test(h.rgb)) n++
  return n * s.cell
}

/** The silhouette's area, m² */
export const silhouette = (s: Shown) => s.hits.size * s.cell

/** The silhouette's width across the view between heights y0 and y1 (the bird's group space), metres */
export function widthBetween(s: Shown, y0: number, y1: number): number {
  let lo = Infinity, hi = -Infinity
  for (const k of s.hits.keys()) {
    const i = k % s.cols, y = s.b0 + Math.floor(k / s.cols) * s.spacing
    if (y < y0 || y > y1) continue
    lo = Math.min(lo, i); hi = Math.max(hi, i)
  }
  return hi >= lo ? (hi - lo + 1) * s.spacing : 0
}

/** The area of a view's paint passing `test` on the bird's right (+z) side, front-on, m² */
export function rightAreaOf(s: Shown, test: (rgb: [number, number, number]) => boolean): number {
  let n = 0
  for (const [k, h] of s.hits) if (s.a0 + (k % s.cols) * s.spacing > 0 && test(h.rgb)) n++
  return n * s.cell
}
