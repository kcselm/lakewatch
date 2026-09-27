import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { buildDetailedBird, type DetailedBirdModel } from '../detail/build'
import { measure, type Measures } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { layersFor, type DetailSpec, type Part } from '../detail/spec'
import { paintAtlas, regionStats } from '../paint/painter'
import { REGIONS, pixelST, ATLAS_SIZE } from '../paint/atlas'

/**
 * Helpers the swimmers' species tests share: a built bird with its measures in millimetres, and a painted atlas with
 * ways to read it. Bounds live in each species' test file, from its research document's section 10.
 */

/** A bird's measures in millimetres, except the bill's widest point and width ratio, which stay fractions. */
export type MM = Record<keyof Measures, number>
const FRACTIONS: readonly string[] = ['billWidestAt', 'billWidestRatio']

export const within = (v: number, lo: number, hi: number, what = '') => {
  expect(v, what).toBeGreaterThanOrEqual(lo)
  expect(v, what).toBeLessThanOrEqual(hi)
}

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** The species parsed, and its detail block; a species without one (still a block bird) fails naming itself. */
function detailed(spec: SpeciesSpec): { parsed: SpeciesSpec; detail: DetailSpec } {
  const parsed = parseSpeciesSpec(spec)
  if (!parsed.detail) throw new Error(`${parsed.code}: no detail block`)
  return { parsed, detail: parsed.detail }
}

/** A species built at rest in one plumage version, with its measures in millimetres. */
export function built(spec: SpeciesSpec, variant?: string): { model: DetailedBirdModel; M: MM } {
  const model = buildDetailedBird(detailed(spec).parsed, variant)
  const M = Object.fromEntries(Object.entries(measure(model)).map(([k, v]) => [k, FRACTIONS.includes(k) ? v : v * 1000])) as MM
  return { model, M }
}

/** Fraction of the body's depth (top of the back to the keel) that rides under the water. */
export const draftShare = (M: MM) => M.draft / (M.backAbove + M.draft)

/** Hue in degrees (0..360), saturation and luminance (0..1) of an [r, g, b] colour, each 0..1. */
export function hsl([r, g, b]: [number, number, number]): { hue: number; sat: number; lum: number } {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let hue = 0
  if (d > 0) {
    if (max === r) hue = 60 * (((g - b) / d) % 6)
    else if (max === g) hue = 60 * ((b - r) / d + 2)
    else hue = 60 * ((r - g) / d + 4)
  }
  return { hue: (hue + 360) % 360, sat, lum: 0.2126 * r + 0.7152 * g + 0.0722 * b }
}

/**
 * One plumage version's atlas, and ways to read it: `stats` is `regionStats` (mean luminance, spread, roughness, mean
 * rgb) over a part's (s, t) window; `u(label)` is a station's position along the skin's s; `share(part, s, t, test)`
 * is the fraction of that window's pixels passing `test`.
 *
 * Every reading fails, naming the part and the window, when the window holds no pixels (a reversed label pair, a t
 * outside 0..1) or when no layer of this version paints the part: over an empty window a mean is 0 and a share 0, and
 * over an unpainted part the painter's base grey, so "dark" and "absent" would pass without looking at anything.
 */
export function atlas(spec: SpeciesSpec, variant?: string) {
  const { parsed, detail } = detailed(spec)
  const profile = createProfile(detail.profile)
  const layers = layersFor(detail, variant)
  const px = paintAtlas({ code: parsed.code, detail, layers, profile })
  const name = variant ? `${parsed.code} (${variant})` : parsed.code
  // the painter always paints the eye (iris, pupil, catchlight); every other part only through this version's layers
  const painted = new Set<Part>(['eye', ...layers.map(l => ('where' in l ? l.where.part : 'skin'))])
  const u = (label: string) => profile.uOf(label)
  /** The window's pixels, as offsets into `px`: those `regionStats` reads, the same test (so a NaN bound holds none). */
  const pixelsIn = (part: Part, s: [number, number], t: [number, number]): number[] => {
    const where = `the ${part} window s [${s.map(v => v.toFixed(3)).join(', ')}], t [${t.map(v => v.toFixed(3)).join(', ')}]`
    if (!painted.has(part)) throw new Error(`${name}: no layer paints the ${part}, so ${where} reads only the base grey`)
    const r = REGIONS[part], ks: number[] = []
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        const [ps, pt] = pixelST(part, x, y)
        if (ps >= s[0] && ps <= s[1] && pt >= t[0] && pt <= t[1]) ks.push((y * ATLAS_SIZE + x) * 4)
      }
    }
    if (!ks.length) throw new Error(`${name}: ${where} holds no pixels (reversed, or outside 0..1)`)
    return ks
  }
  const stats = (part: Part, s: [number, number], t: [number, number]) => {
    pixelsIn(part, s, t)
    return regionStats(px, part, s, t)
  }
  const colour = (part: Part, s: [number, number], t: [number, number]) => hsl(stats(part, s, t).rgb)
  const share = (part: Part, s: [number, number], t: [number, number], test: (c: ReturnType<typeof hsl>) => boolean) => {
    const ks = pixelsIn(part, s, t)
    return ks.filter(k => test(hsl([px[k]! / 255, px[k + 1]! / 255, px[k + 2]! / 255]))).length / ks.length
  }
  return { px, u, stats, colour, share }
}

/** A hue within [lo, hi] degrees, wrapping through 0 when lo > hi (e.g. 330..20 for reds). */
export const hueIn = (hue: number, lo: number, hi: number) => (lo <= hi ? hue >= lo && hue <= hi : hue >= lo || hue <= hi)
