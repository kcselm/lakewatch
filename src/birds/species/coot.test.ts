import { SPEC as COOT } from './amecoo'
import { billWidthAt, billDepthAt } from '../detail/measure'
import { built, atlas, within, draftShare, hueIn } from './swimmer.testkit'

// Bounds from docs/research/2026-09-25-american-coot.md, section 10 (Ridgway & Friedmann 1941, Eddleman & Knopf 1985,
// Gullion 1951, photo-measured), in mm, at rest with the waterline at y = 0. The shield's geometry is shared by both
// versions; the juvenile's smaller, paler shield is paint.

const A = built(COOT, 'adult')

describe('American Coot: structure', () => {
  it('builds both versions, the same bird', () => {
    expect(built(COOT, 'juvenile').M.length).toBeCloseTo(A.M.length, 6)
  })
  it('a narrow, pointed bill, taller than wide, drooping slightly at the tip', () => {
    within(A.M.culmen, 29, 35)
    within(billDepthAt(A.model, 0) * 1000, 13.5, 17.5)
    within(billWidthAt(A.model, 0) * 1000, 9, 13)
    within(billWidthAt(A.model, 0.5) / billDepthAt(A.model, 0.5), 0.45, 0.75)
    within(A.M.billTipRise, -2.5, 0)
    // the research's 1.01 is a skull length; this is the feathered head along the bill axis, 0.76 on the traced photo
    within(A.M.culmen / A.M.head, 0.7, 0.9)
  })
  it('a small autumn shield up the forehead', () => {
    const sh = A.model.anatomy.shield!
    expect(sh).not.toBeNull()
    within(sh.top.distanceTo(sh.base) * 1000, 3, 12)
  })
  it('length at rest, tarsus, middle toe, wing, and tail', () => {
    within(A.M.length, 285, 340)
    within(A.M.tarsus, 47, 64)
    within(A.M.wingChord, 156, 210)
    within(A.M.tail, 42, 65)
    within(A.M.tail / A.M.wingChord, 0.24, 0.33)
  })
  it('floats higher than the ducks, at its measured heights', () => {
    within(A.M.backAbove, 28, 48)
    within(A.M.tailTipAbove, 0, 25)
    within(A.M.crownAbove, 95, 140)
    within(A.M.draft, 35, 50)
    within(draftShare(A.M), 0.45, 0.6)
  })
})

describe('American Coot: plumage', () => {
  const a = atlas(COOT, 'adult'), j = atlas(COOT, 'juvenile')
  const head = (x: typeof a) => x.stats('skin', [x.u('neckMid'), x.u('lores')], [0, 0.6]).mean
  const body = (x: typeof a) => x.stats('skin', [x.u('hip'), x.u('breast')], [0.1, 0.6]).mean

  it("the adult's head is clearly darker than its body; the juvenile's is nearly the body's, with a paler throat", () => {
    expect(head(a)).toBeLessThan(body(a) - 0.05)
    expect(Math.abs(head(j) - body(j))).toBeLessThan(0.08)
    expect(j.stats('skin', [j.u('neckMid'), j.u('eye')], [0.7, 1]).mean).toBeGreaterThan(head(j) + 0.1)
  })
  it("the adult's bill is near white with a dark band near the tip; the juvenile's is grey, with a weak band or none", () => {
    expect(a.stats('bill', [0.05, 0.6], [0, 1]).mean).toBeGreaterThan(0.75)
    expect(a.stats('bill', [0.7, 0.93], [0, 1]).mean).toBeLessThan(a.stats('bill', [0.05, 0.6], [0, 1]).mean - 0.25)
    expect(j.stats('bill', [0.05, 0.6], [0, 1]).mean).toBeLessThan(a.stats('bill', [0.05, 0.6], [0, 1]).mean - 0.15)
  })
  it('the adult carries a dark red-brown callus on its shield; the juvenile does not', () => {
    const callus = a.colour('shield', [0.6, 1], [0, 1])
    expect(hueIn(callus.hue, 340, 30)).toBe(true)
    expect(callus.lum).toBeLessThan(0.35)
    expect(j.share('shield', [0, 1], [0, 1], c => hueIn(c.hue, 340, 30) && c.sat > 0.35 && c.lum < 0.35)).toBeLessThan(0.05)
  })
  it("the adult's iris is red; the juvenile's brown", () => {
    const ai = a.colour('eye', [0, 1], [0, 1]), ji = j.colour('eye', [0, 1], [0, 1])
    expect(hueIn(ai.hue, 345, 15) && ai.sat > 0.5).toBe(true)
    expect(hueIn(ji.hue, 15, 40)).toBe(true)
  })
  it('both show white undertail wedges, bright against the tail and flanks', () => {
    for (const x of [a, j]) expect(x.share('skin', [x.u('rear'), x.u('tailBase')], [0.7, 1], c => c.lum > 0.85)).toBeGreaterThan(0.3)
  })
})
