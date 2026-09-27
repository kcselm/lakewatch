import { SPEC as GADWALL } from './gadwal'
import { SPEC as MALLARD } from './mallar3'
import { billWidthAt } from '../detail/measure'
import { built, atlas, within, draftShare, hueIn } from './swimmer.testkit'

// Bounds from docs/research/2026-09-25-gadwall.md, section 10 (Phillips, Ridgway, AVONET, photo-measured), in mm. The
// Mallard comparisons use the built Mallard (Task 14), both at rest.

const G = built(GADWALL, 'female'), Gm = built(GADWALL, 'male')
const M = built(MALLARD, 'female')
const widest = (b: typeof G) => Math.max(...Array.from({ length: 101 }, (_, i) => billWidthAt(b.model, i / 100)))

describe('Gadwall: structure', () => {
  it('builds both versions, the same bird', () => {
    expect(Gm.M.length).toBeCloseTo(G.M.length, 6)
  })
  it('culmen, bill depth and width at the base', () => {
    within(G.M.culmen, 37, 45)
    within(billWidthAt(G.model, 0) * 1000, 13.5, 19)
    within((billWidthAt(G.model, 0) * 1000) / G.M.culmen, 0.35, 0.46)
  })
  it('a parallel-sided bill with a round tip: even at 30%, 50% and 90% of the culmen from the tip, narrower at 7%', () => {
    const w = [0.7, 0.5, 0.1].map(s => billWidthAt(G.model, s))
    const lo = Math.min(...w), hi = Math.max(...w)
    expect(hi / lo).toBeLessThanOrEqual(1.08)
    within(billWidthAt(G.model, 0.93) / widest(G), 0.55, 0.75)
  })
  it('tarsus, wing chord, tail, and length at rest', () => {
    within(G.M.tarsus, 33, 44)
    within(G.M.wingChord, 234, 280)
    within(G.M.tail, 70, 95)
    within(G.M.length, 290, 370)
  })
  it('floats at its measured heights, with about 0.38-0.55 of its depth under the water', () => {
    within(G.M.backAbove, 45, 78)
    within(G.M.crownAbove, 85, 130)
    within(G.M.tailTipAbove, 5, 60)
    within(G.M.breastFrontAbove, 0, 22)
    within(draftShare(G.M), 0.38, 0.55)
  })
  it('against the Mallard: smaller, with a shorter, narrower bill', () => {
    within(G.M.culmen / M.M.culmen, 0.68, 0.82)
    within(billWidthAt(G.model, 0) / billWidthAt(M.model, 0), 0.70, 0.88)
    within(G.M.length / M.M.length, 0.85, 0.95)
    within((G.M.culmen / G.M.length) / (M.M.culmen / M.M.length), 0.75, 0.92)
  })
})

describe('Gadwall: plumage', () => {
  const f = atlas(GADWALL, 'female'), m = atlas(GADWALL, 'male')

  it("female bill: dark along the culmen from base to tip, with no orange break, over orange lower sides", () => {
    const panel = f.colour('bill', [0.05, 0.8], [0.6, 0.9])
    expect(hueIn(panel.hue, 12, 40)).toBe(true)
    expect(panel.sat).toBeGreaterThan(0.4)
    for (let s = 0.05; s < 0.95; s += 0.05) {
      expect(f.stats('bill', [s, s + 0.05], [0, 0.12]).mean, `culmen at ${s.toFixed(2)}`).toBeLessThanOrEqual(0.5 * panel.lum)
    }
  })
  it('the white speculum patch shows on the folded wing, in both versions', () => {
    for (const a of [f, m]) expect(a.share('wingFold', [0, 1], [0, 1], c => c.lum > 0.85)).toBeGreaterThan(0.02)
  })
  it('male: a grey, low-saturation body and a black stern', () => {
    expect(m.colour('skin', [m.u('hip'), m.u('breast')], [0.45, 0.75]).sat).toBeLessThan(0.15)
    expect(m.stats('skin', [m.u('rear'), m.u('tailBase')], [0, 1]).mean).toBeLessThan(0.15)
  })
  it('female: browner flanks than the male\'s', () => {
    expect(f.colour('skin', [f.u('hip'), f.u('breast')], [0.45, 0.75]).sat)
      .toBeGreaterThan(m.colour('skin', [m.u('hip'), m.u('breast')], [0.45, 0.75]).sat + 0.05)
  })
})
