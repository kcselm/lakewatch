import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { SPECIES } from './index'
import { SPEC as KILLDEER } from './killde'
import { SPEC as LEAST } from './leasan'
import { buildDetailedBird } from '../detail/build'
import { measure, billTipNow, type Measures } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { paintAtlas, regionStats } from '../paint/painter'
import { REGIONS, pixelST, ATLAS_SIZE } from '../paint/atlas'
import { PECK_BOTTOM } from '../../behavior/probe'
import { defaultPose } from '../model'

// Bounds from docs/research/2026-09-25-killdeer-least-sandpiper.md, section 9 (Ridgway 1919, USGS 2023, AVONET,
// All About Birds, photo-measured). Millimetres; the head is total head (bill tip to the back of the head along the
// bill axis) minus the exposed culmen, as USGS measures it.

const killdeer = parseSpeciesSpec(KILLDEER), least = parseSpeciesSpec(LEAST)
const mm = (m: Measures): Record<keyof Measures, number> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v * 1000])) as Record<keyof Measures, number>
const K = mm(measure(buildDetailedBird(killdeer)))
const L = mm(measure(buildDetailedBird(least)))

const within = (v: number, lo: number, hi: number) => {
  expect(v).toBeGreaterThanOrEqual(lo)
  expect(v).toBeLessThanOrEqual(hi)
}

describe('Killdeer and Least Sandpiper: structure', () => {
  it('culmen', () => { within(K.culmen, 19, 23); within(L.culmen, 16, 21) })
  it('total length, bill tip to tail tip at rest (the hunched Least traces short of its stretched-specimen length)', () => {
    within(K.length, 200, 280); within(L.length, 115, 150)
  })
  it('tarsus', () => { within(K.tarsus, 32, 37); within(L.tarsus, 16, 21) })
  it('wing chord', () => { within(K.wingChord, 147, 170); within(L.wingChord, 82, 96) })
  it('tail', () => { within(K.tail, 82, 103); within(L.tail, 34, 42) })
  it('bill against head: much shorter in the plover, about equal in the sandpiper', () => {
    within(K.culmen / K.head, 0.55, 0.8)
    within(L.culmen / L.head, 0.8, 1.1)
    expect(L.culmen / L.head - K.culmen / K.head).toBeGreaterThanOrEqual(0.15)
  })
  it('bill against tarsus: the clearest plover-and-sandpiper difference in the measurements', () => {
    within(K.culmen / K.tarsus, 0.5, 0.68)
    within(L.culmen / L.tarsus, 0.85, 1.12)
  })
  it("Killdeer's bill is straight; the Least's droops at the tip", () => {
    expect(Math.abs(K.billTipRise)).toBeLessThan(1)
    within(L.billTipRise, -1, -0.2)
  })
  it("Killdeer's long tail reaches well past the wingtips; the Least's wingtips are about even with its tail", () => {
    within(-K.projection, 8, 30)
    within(-L.projection, -4, 4)
  })
  it('Killdeer is about 1.9x the Least in the wing, but only a little longer in the bill', () => {
    within(K.wingChord / L.wingChord, 1.75, 1.95)
    within(K.culmen / L.culmen, 1.0, 1.3)
  })
})

/** The atlas, and two ways to read it: a span of skin between station labels, or a rectangle of a part. */
function painted(spec: SpeciesSpec) {
  const d = spec.detail!
  const profile = createProfile(d.profile)
  const px = paintAtlas({ code: spec.code, detail: d, layers: d.plumage, profile })
  return {
    px, profile,
    skin: (from: string, to: string, t: [number, number]) => regionStats(px, 'skin', [profile.uOf(from), profile.uOf(to)], t),
  }
}

/** Every skin pixel between two station labels and inside a band of t, as [luminance, red minus blue]. */
function skinPixels(px: Uint8ClampedArray, u: [number, number], t: [number, number]): [number, number][] {
  const r = REGIONS.skin, out: [number, number][] = []
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      const [s, tt] = pixelST('skin', x, y)
      if (s < u[0] || s > u[1] || tt < t[0] || tt > t[1]) continue
      const k = (y * ATLAS_SIZE + x) * 4
      const [R, G, B] = [px[k]! / 255, px[k + 1]! / 255, px[k + 2]! / 255]
      out.push([0.2126 * R + 0.7152 * G + 0.0722 * B, R - B])
    }
  }
  return out
}

describe('Killdeer and Least Sandpiper: plumage', () => {
  const k = painted(killdeer), l = painted(least)

  it('Killdeer: down the front of the breast, white, black, white, black, white (two bands)', () => {
    // slices from the belly up to the chin along the front midline; dark below 0.25, light above 0.7
    const u0 = k.profile.uOf('flank'), u1 = k.profile.uOf('lores'), n = 60
    const runs: string[] = []
    for (let i = 0; i < n; i++) {
      const lum = regionStats(k.px, 'skin', [u0 + ((u1 - u0) * i) / n, u0 + ((u1 - u0) * (i + 1)) / n], [0.9, 1]).mean
      const c = lum < 0.25 ? 'black' : lum > 0.7 ? 'white' : null
      if (c && runs.at(-1) !== c) runs.push(c)
    }
    expect(runs).toEqual(['white', 'black', 'white', 'black', 'white'])
  })
  it("Killdeer: the eyelid ring is orange-red", () => {
    const [r, g, b] = regionStats(k.px, 'eye', [0.9, 0.94], [0.48, 0.52]).rgb
    expect(r).toBeGreaterThan(0.7)
    expect(r).toBeGreaterThan(2 * g)
    expect(b).toBeLessThan(0.3)
  })
  it("Least: the back feathers' pale edges are rusty, warmer than their blackish centres", () => {
    const back = skinPixels(l.px, [l.profile.uOf('hip'), l.profile.uOf('neckBase')], [0.05, 0.4]).sort((a, b) => a[0] - b[0])
    const third = Math.floor(back.length / 3)
    const warmth = (xs: [number, number][]) => xs.reduce((s, p) => s + p[1], 0) / xs.length
    const darkest = warmth(back.slice(0, third)), lightest = warmth(back.slice(-third))
    expect(lightest).toBeGreaterThan(darkest + 0.15)
    expect(lightest).toBeGreaterThan(0.25)
  })
  it('Least: the buffy breast band is darker than the white belly', () => {
    expect(l.skin('breast', 'neckBase', [0.75, 1]).mean).toBeLessThan(l.skin('rump', 'flank', [0.75, 1]).mean - 0.1)
  })
  it('Least: the legs are yellow-green', () => {
    const [r, g, b] = regionStats(l.px, 'legs', [0, 1], [0, 1]).rgb
    expect(Math.min(r, g)).toBeGreaterThan(b + 0.15)
    within(r / g, 0.85, 1.15)
  })
})

describe('the peck reaches the ground', () => {
  // the Killdeer dabs at the surface; the Least may probe a little into it, never stop above it
  const bounds = { plover: [-5, 5], sandpiper: [-8, 2] } as const
  for (const spec of Object.values(SPECIES)) {
    if (!spec.detail || !spec.foraging) continue
    const style = spec.foraging
    it(`${spec.code} (${style}): at the bottom of its peck, the bill tip is on the ground`, () => {
      const m = buildDetailedBird(spec)
      const bottom = PECK_BOTTOM[style]
      const p = defaultPose(); p.lean.x = bottom.lean; p.neckExtend = bottom.neckExtend; p.reach = bottom.reach
      m.pose(p)
      within(billTipNow(m).y * 1000, bounds[style][0], bounds[style][1])
    })
  }
})
