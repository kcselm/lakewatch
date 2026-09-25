import { parseSpeciesSpec } from '../spec'
import { SPEC as GREATER } from './greyel'
import { SPEC as LESSER } from './lesyel'
import { buildDetailedBird } from '../detail/build'
import { measure, type Measures } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { paintAtlas, regionStats } from '../paint/painter'
import type { Part } from '../detail/spec'

// Bounds from docs/research/2026-09-24-yellowlegs.md, section 10 (Ridgway 1919, USGS 2023, AVONET, All About Birds).
// Millimetres; the head is total head (bill tip to the back of the head) minus the exposed culmen, as USGS measures it.

const greater = parseSpeciesSpec(GREATER), lesser = parseSpeciesSpec(LESSER)
const mm = (m: Measures): Record<keyof Measures, number> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v * 1000])) as Record<keyof Measures, number>
const G = mm(measure(buildDetailedBird(greater)))
const L = mm(measure(buildDetailedBird(lesser)))

const within = (v: number, lo: number, hi: number) => {
  expect(v).toBeGreaterThanOrEqual(lo)
  expect(v).toBeLessThanOrEqual(hi)
}

describe('Greater and Lesser Yellowlegs: structure', () => {
  it('culmen', () => { within(G.culmen, 52, 61); within(L.culmen, 30, 41) })
  it('culmen against head: about 1.5x in Greater, a little over 1x in Lesser', () => {
    within(G.culmen / G.head, 1.35, 1.7)
    within(L.culmen / L.head, 1.0, 1.35)
    expect(G.culmen / G.head - L.culmen / L.head).toBeGreaterThanOrEqual(0.2)
  })
  it('culmen against tarsus: "nearly as long" in Greater, "decidedly shorter" in Lesser', () => {
    within(G.culmen / G.tarsus, 0.82, 1.02)
    within(L.culmen / L.tarsus, 0.62, 0.8)
  })
  it('bill depth at the base', () => { within(G.billDepth, 5.5, 7.0); within(L.billDepth, 3.6, 4.6) })
  it("Greater's bill turns up, at most one base depth; Lesser's is straight", () => {
    expect(G.billTipRise).toBeGreaterThan(0)
    expect(G.billTipRise).toBeLessThanOrEqual(G.billDepth)
    expect(Math.abs(L.billTipRise)).toBeLessThan(1)
  })
  it('tarsus', () => { within(G.tarsus, 55, 68); within(L.tarsus, 45.5, 59) })
  it('bare tibia (a sanity bound only)', () => { within(G.tibia, 30, 40); within(L.tibia, 25, 33) })
  it('wing chord', () => { within(G.wingChord, 180, 205); within(L.wingChord, 147, 170) })
  it('tail', () => { within(G.tail, 71, 83); within(L.tail, 55, 67) })
  it('total length', () => { within(G.length, 290, 330); within(L.length, 230, 270) })
  it('wingtips reach just past the tail, a little further in Lesser', () => {
    within(G.projection, 0, 20)
    within(L.projection, 0, 20)
    expect(L.projection / L.wingChord).toBeGreaterThanOrEqual(G.projection / G.wingChord)
  })
  it('Greater is about 1.2x Lesser, but its bill about 1.55x', () => {
    within(G.wingChord / L.wingChord, 1.17, 1.28)
    within(G.culmen / L.culmen, 1.45, 1.65)
  })
})

describe('Greater and Lesser Yellowlegs: plumage', () => {
  const paint = (spec: typeof greater) => {
    const d = spec.detail!
    const profile = createProfile(d.profile)
    const px = paintAtlas({ code: spec.code, detail: d, layers: d.plumage, profile })
    const skin = (from: string, to: string, t: [number, number]) => regionStats(px, 'skin', [profile.uOf(from), profile.uOf(to)], t)
    const part = (p: Part, s: [number, number], t: [number, number]) => regionStats(px, p, s, t)
    return { skin, part }
  }
  const g = paint(greater), l = paint(lesser)

  it("Greater's bill is paler at the base than the tip; Lesser's is dark throughout", () => {
    expect(g.part('bill', [0, 0.15], [0, 1]).mean).toBeGreaterThan(g.part('bill', [0.85, 1], [0, 1]).mean + 0.05)
    expect(Math.abs(l.part('bill', [0, 0.15], [0, 1]).mean - l.part('bill', [0.85, 1], [0, 1]).mean)).toBeLessThan(0.02)
  })
  it('Greater has barred flanks, Lesser plain ones', () => {
    // bars run across the body, so they show as change along the spine (s)
    const gf = g.skin('tailBase', 'flank', [0.55, 0.7]).roughS
    const lf = l.skin('tailBase', 'flank', [0.55, 0.7]).roughS
    expect(gf).toBeGreaterThan(3 * lf)
    expect(lf).toBeLessThan(0.01)
  })
  it("Greater's neck streaks are bolder than Lesser's", () => {
    // streaks run along the neck, so they show as change around it (t)
    expect(g.skin('neckBase', 'nape', [0.35, 0.75]).roughT).toBeGreaterThan(1.5 * l.skin('neckBase', 'nape', [0.35, 0.75]).roughT)
  })
})
