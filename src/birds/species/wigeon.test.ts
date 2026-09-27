import { SPEC as WIGEON } from './amewig'
import { billWidthAt, billDepthAt } from '../detail/measure'
import { built, atlas, within, draftShare, hueIn } from './swimmer.testkit'

// Bounds from docs/research/2026-09-25-american-wigeon.md, section 10 (Baird, Brewer & Ridgway; Grinnell et al.;
// Phillips; AVONET; photo-measured), in mm.

const W = built(WIGEON, 'female')
const widest = Math.max(...Array.from({ length: 101 }, (_, i) => billWidthAt(W.model, i / 100)))

describe('American Wigeon: structure', () => {
  it('builds all three versions, the same bird', () => {
    for (const v of ['eclipse', 'male']) expect(built(WIGEON, v).M.length).toBeCloseTo(W.M.length, 6)
  })
  it('a short bill: culmen, width and depth at the base', () => {
    within(W.M.culmen, 31, 40)
    within(billWidthAt(W.model, 0) * 1000, 14.5, 17.5)
    within(billDepthAt(W.model, 0) * 1000, 10.5, 14.5)
    within((billWidthAt(W.model, 0) * 1000) / W.M.culmen, 0.38, 0.52)
  })
  it('parallel-sided with a round tip, widest outside the last 30% (unlike the Shoveler)', () => {
    expect(billWidthAt(W.model, 0.7) / widest).toBeGreaterThanOrEqual(0.9)
    expect(billWidthAt(W.model, 0.4) / widest).toBeGreaterThanOrEqual(0.97)
    within(billWidthAt(W.model, 0.95) / widest, 0.35, 0.65)
    expect(W.M.billWidestAt).toBeLessThanOrEqual(0.7)
  })
  it('tarsus, wing chord, tail, length at rest, and the tail well past the wingtips', () => {
    within(W.M.tarsus, 34, 42)
    within(W.M.wingChord, 228, 273)
    within(W.M.tail, 78, 112)
    within(W.M.length, 300, 360)
    within(-W.M.projection, 10, 45)
  })
  it('floats at its measured heights, the breast front at the waterline', () => {
    within(W.M.backAbove, 45, 70)
    within(W.M.tailTipAbove, 35, 65)
    within(W.M.breastFrontAbove, 0, 10)
    within(draftShare(W.M), 0.4, 0.5)
  })
})

describe('American Wigeon: plumage', () => {
  const f = atlas(WIGEON, 'female'), e = atlas(WIGEON, 'eclipse'), m = atlas(WIGEON, 'male')
  const flank = (a: typeof f) => a.colour('skin', [a.u('hip'), a.u('breast')], [0.45, 0.75])

  it('every version: a pale blue-grey bill with a black tip', () => {
    for (const a of [f, e, m]) {
      const base = a.colour('bill', [0.1, 0.6], [0.3, 0.7])
      expect(base.lum).toBeGreaterThan(0.4)
      expect(hueIn(base.hue, 190, 235)).toBe(true)
      expect(a.stats('bill', [0.8, 1], [0, 1]).mean).toBeLessThan(0.2)
    }
  })
  it('male: a crown lighter than the cheek, a green patch behind the eye, pinkish flanks', () => {
    expect(m.stats('skin', [m.u('occiput'), m.u('lores')], [0, 0.15]).mean)
      .toBeGreaterThan(m.stats('skin', [m.u('occiput'), m.u('eye')], [0.45, 0.65]).mean + 0.15)
    expect(m.share('skin', [m.u('occiput'), m.u('eye')], [0.2, 0.45], c => hueIn(c.hue, 90, 170) && c.sat > 0.25)).toBeGreaterThan(0.2)
    expect(hueIn(flank(m).hue, 330, 30)).toBe(true)
  })
  it('female: a greyer head than her orange-rufous flanks', () => {
    const head = f.colour('skin', [f.u('nape'), f.u('lores')], [0.2, 0.7])
    expect(head.sat).toBeLessThan(flank(f).sat - 0.1)
    expect(hueIn(flank(f).hue, 15, 40)).toBe(true)
  })
  it("eclipse: redder, more saturated flanks than the female's, and a white bar on the folded wing's upper edge", () => {
    expect(flank(e).sat).toBeGreaterThan(flank(f).sat)
    expect(e.share('wingFold', [0, 0.6], [0, 0.35], c => c.lum > 0.85)).toBeGreaterThan(0.1)
    expect(f.share('wingFold', [0, 0.6], [0, 0.35], c => c.lum > 0.85)).toBeLessThan(0.05)
  })
})
