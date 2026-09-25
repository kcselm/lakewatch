import type { Layer, Where, SkinPoint } from '../detail/spec'

export type RGB = [number, number, number]

export function hexRGB(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** How a part's (s, t) maps to millimetres on the bird. */
export interface Frame {
  /** mm along s (s = 0..1) */
  lengthMm: number
  /** mm across t (t = 0..1) at s */
  widthMm(s: number): number
  /** skin only: s of a station label */
  uOf(label: string): number
}

/** One pixel: part-local s, t; the same point in mm (X along, Y across); the pixel's footprint in mm. */
export interface Px { s: number; t: number; X: number; Y: number; pixelMm: number }

export interface Out { alpha: number; color: RGB }

export const DEFAULT_SOFT = 1
export const DEFAULT_BLUR = 0.3

export function smoothstep(e0: number, e1: number, x: number): number {
  if (e0 === e1) return x < e0 ? 0 : 1
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
  return t * t * (3 - 2 * t)
}

/** 1 inside [lo, hi], fading over +-soft; an edge on the part's own boundary (0 or 1) never fades. */
export function band(x: number, lo: number, hi: number, soft: number): number {
  const a = lo <= 0 ? 1 : smoothstep(lo - soft, lo + soft, x)
  const b = hi >= 1 ? 1 : 1 - smoothstep(hi - soft, hi + soft, x)
  return a * b
}

/** Integer hash to [0, 1), stable for (ix, iy, seed). */
export function hash(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(seed | 0, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1103515245)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** The s range a skin `where` covers, lo <= hi. */
export function skinSpan(where: Extract<Where, { part: 'skin' }>, f: Frame): [number, number] {
  const a = f.uOf(where.from), b = f.uOf(where.to)
  return [Math.min(a, b), Math.max(a, b)]
}

/** A skin point in mm. */
export function pointMm(pt: SkinPoint, f: Frame): [number, number] {
  const u = f.uOf(pt.at)
  return [u * f.lengthMm + (pt.dx ?? 0), pt.t * f.widthMm(u)]
}

/** Coverage of a disc edge at distance d from its centre, radius r, softened by blur. */
const edge = (d: number, r: number, blur: number) => 1 - smoothstep(r - blur / 2, r + blur / 2, d)

export function spots(p: Px, size: number, spacing: number, jitter: number, blur: number, seed: number): number {
  const ci = Math.floor(p.X / spacing), cj = Math.floor(p.Y / spacing)
  let best = 0
  for (let i = ci - 1; i <= ci + 1; i++) {
    for (let j = cj - 1; j <= cj + 1; j++) {
      const cx = (i + 0.5 + (hash(i, j, seed) - 0.5) * jitter) * spacing
      const cy = (j + 0.5 + (hash(i, j, seed + 1) - 0.5) * jitter) * spacing
      const r = (size / 2) * (0.8 + 0.4 * hash(i, j, seed + 2))
      best = Math.max(best, edge(Math.hypot(p.X - cx, p.Y - cy), r, blur))
    }
  }
  return best
}

export function streaks(p: Px, length: number, width: number, spacing: number, jitter: number, blur: number, seed: number): number {
  const sx = length * 1.3, sy = spacing
  const ci = Math.floor(p.X / sx), cj = Math.floor(p.Y / sy)
  const e = blur / (width / 2)
  let best = 0
  for (let i = ci - 1; i <= ci + 1; i++) {
    for (let j = cj - 1; j <= cj + 1; j++) {
      const cx = (i + 0.5 + (hash(i, j, seed) - 0.5) * jitter) * sx
      const cy = (j + 0.5 + (hash(i, j, seed + 1) - 0.5) * jitter * 0.5) * sy
      const q = Math.hypot((p.X - cx) / (length / 2), (p.Y - cy) / (width / 2))
      best = Math.max(best, 1 - smoothstep(1 - e, 1 + e, q))
    }
  }
  return best
}

export function bars(p: Px, width: number, spacing: number, angleDeg: number, blur: number, seed: number): number {
  const a = (angleDeg * Math.PI) / 180
  let w = p.X * Math.cos(a) + p.Y * Math.sin(a)
  // a gentle wobble so bars are not ruled lines
  const k = Math.floor(p.Y / (spacing * 2))
  const f = p.Y / (spacing * 2) - k
  w += (hash(k, 0, seed) * (1 - f) + hash(k + 1, 0, seed) * f - 0.5) * spacing * 0.35
  const d = Math.abs(w - (Math.round(w / spacing - 0.5) + 0.5) * spacing)
  return edge(d, width / 2, blur)
}

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay
  const l2 = vx * vx + vy * vy || 1e-12
  const h = Math.min(Math.max(((px - ax) * vx + (py - ay) * vy) / l2, 0), 1)
  return Math.hypot(px - ax - vx * h, py - ay - vy * h)
}

/** Overlapping feathers, tips pointing back (-X); the front-most feather covering a pixel shows. */
export function feathers(
  p: Px, L: number, W: number, edgeWidth: number, notch: { size: number; count: number } | undefined, blur: number, seed: number,
): { inside: boolean; fringe: number; notch: number } {
  const dx = L * 0.55, dy = W * 0.9
  const cj = Math.floor(p.Y / dy)
  let bestCx = -Infinity, q = 0, bx = 0, by = 0
  for (let j = cj - 1; j <= cj + 1; j++) {
    const off = (j & 1) * 0.5
    const ci = Math.floor(p.X / dx - off)
    for (let i = ci - 1; i <= ci + 2; i++) {
      const cx = (i + off + (hash(i, j, seed) - 0.5) * 0.15) * dx
      const cy = (j + 0.5) * dy
      const qq = ((p.X - cx) / (L / 2)) ** 2 + ((p.Y - cy) / (W / 2)) ** 2
      if (qq < 1 && cx > bestCx) { bestCx = cx; q = qq; bx = cx; by = cy }
    }
  }
  if (bestCx === -Infinity) return { inside: false, fringe: 0, notch: 0 }
  const inset = ((1 - Math.sqrt(q)) * Math.min(L, W)) / 2          // mm in from the feather's edge
  if (p.X >= bx) return { inside: true, fringe: 0, notch: 0 }      // only the rear edge shows
  const fringe = 1 - smoothstep(edgeWidth - blur / 2, edgeWidth + blur / 2, inset)
  let n = 0
  if (notch) {
    for (let k = 0; k < notch.count; k++) {
      const phi = Math.PI / 2 + (Math.PI * (k + 0.5)) / notch.count      // around the rear half
      const nx = bx + Math.cos(phi) * (L / 2 - notch.size * 0.6)
      const ny = by + Math.sin(phi) * (W / 2 - notch.size * 0.6)
      n = Math.max(n, edge(Math.hypot(p.X - nx, p.Y - ny), notch.size / 2, blur))
    }
  }
  return { inside: true, fringe, notch: n }
}

const mix = (out: RGB, a: RGB, b: RGB, w: number) => {
  out[0] = a[0] + (b[0] - a[0]) * w
  out[1] = a[1] + (b[1] - a[1]) * w
  out[2] = a[2] + (b[2] - a[2]) * w
}

/**
 * A layer compiled once per paint: colours parsed, labels resolved, and its region split into a per-column
 * mask and a per-pixel mask so the painter can skip whole columns and rows.
 */
export interface CompiledLayer {
  /** mask for a column at s; 0 skips the column */
  sMask(s: number): number
  /** mask for a pixel at t, given its column's width in mm */
  tMask(t: number, widthMm: number): number
  /** the t range worth visiting in a column of the given width */
  tRange(widthMm: number): [number, number]
  /** colour and coverage before masks and opacity; never allocates */
  shade(p: Px, out: Out): void
  opacity: number
}

export function compileLayer(layer: Layer, f: Frame, seed: number): CompiledLayer {
  const soft = layer.soft ?? DEFAULT_SOFT
  const blurOf = (p: Px) => Math.max('blur' in layer ? layer.blur ?? DEFAULT_BLUR : DEFAULT_BLUR, p.pixelMm)
  const where = 'where' in layer ? layer.where : null
  const sSoft = soft / f.lengthMm
  const [s0, s1] = !where ? [0, 1] : where.part === 'skin' ? skinSpan(where, f) : (where.s ?? [0, 1])
  const [t0, t1] = !where ? [0, 1] : where.part === 'skin' ? (where.band ?? [0, 1]) : (where.t ?? [0, 1])
  let tRange = (w: number): [number, number] => [Math.max(0, t0 - soft / w), Math.min(1, t1 + soft / w)]
  const base = {
    sMask: (s: number) => band(s, s0, s1, sSoft),
    tMask: (t: number, w: number) => band(t, t0, t1, soft / w),
    opacity: layer.opacity ?? 1,
  }
  const solid = (hex: string, cov: (p: Px) => number) => {
    const c = hexRGB(hex)
    return (p: Px, out: Out) => { out.color[0] = c[0]; out.color[1] = c[1]; out.color[2] = c[2]; out.alpha = cov(p) }
  }
  let shade: (p: Px, out: Out) => void
  switch (layer.kind) {
    case 'base': {
      const top = hexRGB(layer.top), side = hexRGB(layer.side), bottom = hexRGB(layer.bottom)
      const tmp: RGB = [0, 0, 0]
      shade = (p, out) => {
        mix(tmp, top, side, smoothstep(0.1, 0.45, p.t))
        mix(out.color, tmp, bottom, smoothstep(0.55, 0.85, p.t))
        out.alpha = 1
      }
      break
    }
    case 'fill':
      shade = solid(layer.color, () => 1)
      break
    case 'gradient': {
      const a = hexRGB(layer.colorA), b = hexRGB(layer.colorB)
      const span = layer.to - layer.from || 1e-9
      shade = (p, out) => {
        const x = layer.axis === 's' ? p.s : p.t
        mix(out.color, a, b, Math.min(Math.max((x - layer.from) / span, 0), 1))
        out.alpha = 1
      }
      break
    }
    case 'spots':
      shade = solid(layer.color, p => spots(p, layer.size, layer.spacing, layer.jitter ?? 0.6, blurOf(p), seed))
      break
    case 'streaks':
      shade = solid(layer.color, p => streaks(p, layer.length, layer.width, layer.spacing, layer.jitter ?? 0.6, blurOf(p), seed))
      break
    case 'bars':
      shade = solid(layer.color, p => bars(p, layer.width, layer.spacing, layer.angle, blurOf(p), seed))
      break
    case 'stripe': {
      const [ax, ay] = pointMm(layer.from, f), [bx, by] = pointMm(layer.to, f)
      const reach = layer.width + (layer.blur ?? DEFAULT_BLUR) + 1
      tRange = w => [Math.max(0, (Math.min(ay, by) - reach) / w), Math.min(1, (Math.max(ay, by) + reach) / w)]
      shade = solid(layer.color, p => edge(segmentDistance(p.X, p.Y, ax, ay, bx, by), layer.width / 2, blurOf(p)))
      break
    }
    case 'ring': {
      const [cx, cy] = pointMm(layer.at, f)
      const reach = layer.radius + layer.width + 1
      tRange = w => [Math.max(0, (cy - reach) / w), Math.min(1, (cy + reach) / w)]
      shade = solid(layer.color, p => edge(Math.abs(Math.hypot(p.X - cx, p.Y - cy) - layer.radius), layer.width / 2, blurOf(p)))
      break
    }
    case 'feathers': {
      const center = layer.center ? hexRGB(layer.center) : null
      const edgeC = hexRGB(layer.edge)
      const notchC = layer.notch ? hexRGB(layer.notch.color) : null
      shade = (p, out) => {
        out.alpha = 0
        const r = feathers(p, layer.length, layer.width, layer.edgeWidth, layer.notch, blurOf(p), seed)
        if (!r.inside) return
        // composite center, fringe, and notch locally (premultiplied "over")
        let c0 = 0, c1 = 0, c2 = 0, a = 0
        const over = (col: RGB, al: number) => {
          c0 = col[0] * al + c0 * (1 - al); c1 = col[1] * al + c1 * (1 - al); c2 = col[2] * al + c2 * (1 - al)
          a = al + a * (1 - al)
        }
        if (center) over(center, 1)
        if (r.fringe > 0) over(edgeC, r.fringe)
        if (notchC && r.notch > 0) over(notchC, r.notch)
        if (a === 0) return
        out.color[0] = c0 / a; out.color[1] = c1 / a; out.color[2] = c2 / a
        out.alpha = a
      }
      break
    }
  }
  return { ...base, tRange, shade }
}
