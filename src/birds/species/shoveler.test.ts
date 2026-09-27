import { SPEC as SHOVELER } from './norsho'
import { billWidthAt, billDepthAt } from '../detail/measure'
import { built, atlas, within, draftShare, hueIn } from './swimmer.testkit'

// Bounds from docs/research/2026-09-25-northern-shoveler.md, section 10 (Phillips, Johnsgard, Baird et al., AVONET,
// four bill outlines, photo-measured), in mm. Both versions are late-September birds: the drake in eclipse.

const S = built(SHOVELER, 'eclipse')
const widths = Array.from({ length: 101 }, (_, i) => billWidthAt(S.model, i / 100))
const widest = Math.max(...widths)

describe('Northern Shoveler: structure', () => {
  it('builds both versions, the same bird', () => {
    expect(built(SHOVELER, 'female').M.length).toBeCloseTo(S.M.length, 6)
  })
  it('a long bill, distinctly longer than the head', () => {
    within(S.M.culmen, 58, 74)
    within(S.M.culmen / S.M.head, 1.2, 1.6)
  })
  it('the spoon: 1.5-2.1 times as wide at its widest, 65-80% of the way out, as at the base', () => {
    within(billWidthAt(S.model, 0) * 1000, 14, 19)
    within(widest * 1000, 27, 32)
    within(S.M.billWidestRatio, 1.5, 2.1)
    within(S.M.billWidestAt, 0.65, 0.8)
    within(billWidthAt(S.model, 0.5) / widest, 0.78, 0.95)
    within(billWidthAt(S.model, 0.93) / widest, 0.55, 0.85)
  })
  it('widens steadily from the base to its widest point, with no waist', () => {
    const top = widths.indexOf(widest)
    let low = widths[0]!
    for (let i = 1; i <= top; i++) {
      expect(widths[i]!, `at ${i}%`).toBeGreaterThanOrEqual(low - 0.05 * widths[0]!)
      low = Math.max(low, widths[i]!)
    }
  })
  it('deep at the base and thin at the tip, much wider than deep at its widest', () => {
    within(billDepthAt(S.model, 0) * 1000, 17, 23)
    within(billDepthAt(S.model, 0.9) * 1000, 5, 9)
    expect(widest / billDepthAt(S.model, S.M.billWidestAt)).toBeGreaterThanOrEqual(1.8)
    within(S.M.billTipRise, -1.5, 1.5)
  })
  it('tarsus, wing chord, tail, length at rest, and the tail past the wingtips', () => {
    within(S.M.tarsus, 32, 40)
    within(S.M.wingChord, 215, 250)
    within(S.M.tail, 64, 95)
    within(S.M.length, 280, 360)
    within(-S.M.projection, 15, 45)
  })
  it('floats at its measured heights', () => {
    within(S.M.backAbove, 35, 60)
    within(S.M.crownAbove, 75, 100)
    within(S.M.tailTipAbove, 15, 50)
    within(draftShare(S.M), 0.38, 0.55)
  })
})

describe('Northern Shoveler: plumage (late September: no green head, no white breast)', () => {
  const e = atlas(SHOVELER, 'eclipse'), f = atlas(SHOVELER, 'female')
  const flank = (a: typeof e) => a.colour('skin', [a.u('hip'), a.u('breast')], [0.45, 0.75])

  it("the eclipse drake's iris is yellow; the female's is dark", () => {
    const iris = e.colour('eye', [0, 1], [0, 1])
    expect(hueIn(iris.hue, 38, 58)).toBe(true)
    expect(iris.sat).toBeGreaterThan(0.5)
    expect(f.stats('eye', [0, 1], [0, 1]).mean).toBeLessThan(0.2)
  })
  it("the drake's bill is darker; the female's has orange lower sides", () => {
    expect(e.stats('bill', [0, 1], [0, 1]).mean).toBeLessThan(f.stats('bill', [0, 1], [0, 1]).mean)
    const side = f.colour('bill', [0.1, 0.9], [0.6, 0.95])
    expect(hueIn(side.hue, 18, 38)).toBe(true)
    expect(side.sat).toBeGreaterThan(0.4)
  })
  it("the drake's flanks are redder than the female's buff, with a brighter patch on the rear flank", () => {
    expect(flank(e).hue).toBeLessThan(flank(f).hue)
    expect(e.stats('skin', [e.u('tailBase'), e.u('hip')], [0.4, 0.6]).mean)
      .toBeGreaterThan(e.stats('skin', [e.u('hip'), e.u('breast')], [0.4, 0.6]).mean + 0.1)
  })
  it('neither version has a green head or a white breast', () => {
    for (const a of [e, f]) {
      expect(a.share('skin', [a.u('occiput'), a.u('lores')], [0, 0.7], c => hueIn(c.hue, 90, 170) && c.sat > 0.3)).toBeLessThan(0.05)
      expect(a.stats('skin', [a.u('breast'), a.u('neckBase')], [0.5, 1]).mean).toBeLessThan(0.8)
    }
  })
})
