import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { buildDetailedBird, type DetailedBirdModel } from '../detail/build'
import { measure, type Measures } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { layersFor, type Part } from '../detail/spec'
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

/** A species built at rest in one plumage version, with its measures in millimetres. */
export function built(spec: SpeciesSpec, variant?: string): { model: DetailedBirdModel; M: MM } {
  const model = buildDetailedBird(parseSpeciesSpec(spec), variant)
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
 */
export function atlas(spec: SpeciesSpec, variant?: string) {
  const s0 = parseSpeciesSpec(spec)
  const d = s0.detail!
  const profile = createProfile(d.profile)
  const px = paintAtlas({ code: s0.code, detail: d, layers: layersFor(d, variant), profile })
  const u = (label: string) => profile.uOf(label)
  const stats = (part: Part, s: [number, number], t: [number, number]) => regionStats(px, part, s, t)
  const colour = (part: Part, s: [number, number], t: [number, number]) => hsl(stats(part, s, t).rgb)
  const share = (part: Part, s: [number, number], t: [number, number], test: (c: ReturnType<typeof hsl>) => boolean) => {
    const r = REGIONS[part]
    let n = 0, yes = 0
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        const [ps, pt] = pixelST(part, x, y)
        if (ps < s[0] || ps > s[1] || pt < t[0] || pt > t[1]) continue
        const k = (y * ATLAS_SIZE + x) * 4
        n++
        if (test(hsl([px[k]! / 255, px[k + 1]! / 255, px[k + 2]! / 255]))) yes++
      }
    }
    return n ? yes / n : 0
  }
  return { px, u, stats, colour, share }
}

/** A hue within [lo, hi] degrees, wrapping through 0 when lo > hi (e.g. 330..20 for reds). */
export const hueIn = (hue: number, lo: number, hi: number) => (lo <= hi ? hue >= lo && hue <= hi : hue >= lo || hue <= hi)
