import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { SPEC as DOWITCHER } from './lobdow'
import { SPEC as PECTORAL } from './pecsan'
import { SPEC as LEAST } from './leasan'
import { buildDetailedBird } from '../detail/build'
import { measure, billTipNow, type Measures } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { paintAtlas, regionStats } from '../paint/painter'
import { REGIONS, pixelST, ATLAS_SIZE } from '../paint/atlas'
import type { Part } from '../detail/spec'
import { STYLES, PECK_BOTTOM } from '../../behavior/probe'
import { defaultPose } from '../model'

// Bounds from docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md, section 10 (Ridgway 1919, USGS,
// AVONET, photo-measured). Millimetres; the head is total head (bill tip to the back of the head along the bill axis)
// minus the exposed culmen, as USGS measures it.

const dowitcher = parseSpeciesSpec(DOWITCHER), pectoral = parseSpeciesSpec(PECTORAL), least = parseSpeciesSpec(LEAST)
const mm = (m: Measures): Record<keyof Measures, number> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v * 1000])) as Record<keyof Measures, number>
const D = mm(measure(buildDetailedBird(dowitcher)))
const P = mm(measure(buildDetailedBird(pectoral)))
const L = mm(measure(buildDetailedBird(least)))

const within = (v: number, lo: number, hi: number) => {
  expect(v).toBeGreaterThanOrEqual(lo)
  expect(v).toBeLessThanOrEqual(hi)
}

describe('Long-billed Dowitcher and Pectoral Sandpiper: structure', () => {
  it('culmen', () => { within(D.culmen, 52, 79); within(P.culmen, 24, 31) })
  it('total length, bill tip to tail tip at rest (traced, shorter than a stretched specimen)', () => {
    within(D.length, 200, 300); within(P.length, 155, 235)
  })
  it('tarsus', () => { within(D.tarsus, 33.5, 42); within(P.tarsus, 24, 30) })
  it('wing chord', () => { within(D.wingChord, 136, 159); within(P.wingChord, 119, 152) })
  it('tail', () => { within(D.tail, 50, 62); within(P.tail, 50, 68) })
  it('bill against head: about twice in the dowitcher, about equal in the Pectoral', () => {
    within(D.culmen / D.head, 1.7, 2.4)
    within(P.culmen / P.head, 0.9, 1.2)
    expect(D.culmen / D.head - P.culmen / P.head).toBeGreaterThanOrEqual(0.6)
  })
  it("both bills droop a little at the tip; the dowitcher's is straight for most of its length", () => {
    within(D.billTipRise, -2, -0.2)
    within(P.billTipRise, -1.2, -0.2)
  })
  it("the dowitcher's tail reaches a little past its wingtips; the Pectoral's wingtips are about even with its tail", () => {
    within(-D.projection, 0, 12)
    within(-P.projection, -4, 4)
  })
  it('the Pectoral is half as long again as the Least: bigger, with the same pattern', () => {
    within(P.length / L.length, 1.4, 1.6)
  })
  it('the dowitcher stands with its joint, belly, and folded wing at the heights the photos give', () => {
    within(D.joint, 33, 43)
    within(D.belly, 42, 56)
    within(D.wingLow, 55, 80)
    expect(D.wingLow).toBeGreaterThanOrEqual(D.belly + 8)
  })
  it('the water it feeds in reaches its joint at the shallow end and wets its belly, not its wing, at the deep end', () => {
    const [shallow, deep] = STYLES.dowitcher.water.map(v => v * 1000) as [number, number]
    expect(Math.abs(shallow - D.joint)).toBeLessThanOrEqual(10)
    expect(deep).toBeGreaterThanOrEqual(D.belly)
    expect(deep).toBeLessThanOrEqual(D.wingLow - 5)
  })
  it("the dowitcher's bill goes 22-45 mm into the mud at the bottom of a stitch (sections 9 and 11: a third to all of it)", () => {
    const m = buildDetailedBird(dowitcher)
    const bottom = PECK_BOTTOM.dowitcher
    const p = defaultPose(); p.lean.x = bottom.lean; p.neckExtend = bottom.neckExtend; p.reach = bottom.reach
    m.pose(p)
    within(-billTipNow(m).y * 1000, 22, 45)
  })
})

/** The atlas, and ways to read it: a span of skin between station labels, or every pixel of a part as [lum, r, g, b]. */
function painted(spec: SpeciesSpec) {
  const d = spec.detail!
  const profile = createProfile(d.profile)
  const px = paintAtlas({ code: spec.code, detail: d, layers: d.plumage, profile })
  const pixels = (part: Part, s: [number, number], t: [number, number]) => {
    const r = REGIONS[part], out: [number, number, number, number][] = []
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        const [ps, pt] = pixelST(part, x, y)
        if (ps < s[0] || ps > s[1] || pt < t[0] || pt > t[1]) continue
        const k = (y * ATLAS_SIZE + x) * 4
        const [R, G, B] = [px[k]! / 255, px[k + 1]! / 255, px[k + 2]! / 255]
        out.push([0.2126 * R + 0.7152 * G + 0.0722 * B, R, G, B])
      }
    }
    return out
  }
  return { px, profile, pixels, u: (label: string) => profile.uOf(label) }
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const std = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map(x => (x - m) ** 2))) }

describe('Long-billed Dowitcher and Pectoral Sandpiper: plumage', () => {
  const d = painted(dowitcher), p = painted(pectoral)

  it("dowitcher: the tertials' centres are plain, with no bars (a juvenile Short-billed's are tiger-striped)", () => {
    const lum = d.pixels('wingFold', [0.6, 0.95], [0.2, 0.8]).map(q => q[0]).sort((a, b) => a - b)
    expect(std(lum.slice(0, Math.floor((lum.length * 2) / 3)))).toBeLessThan(0.03)
  })
  it('dowitcher: the tail is barred along its whole length, the dark bars wider than the white', () => {
    const runs: { dark: boolean; n: number }[] = []
    for (let i = 0; i < 120; i++) {
      const m = regionStats(d.px, 'tail', [i / 120, (i + 1) / 120], [0.45, 0.55]).mean
      const dark = m < 0.35 ? true : m > 0.6 ? false : runs.at(-1)?.dark
      if (dark === undefined) continue
      if (runs.at(-1)?.dark === dark) runs.at(-1)!.n++
      else runs.push({ dark, n: 1 })
    }
    const dark = runs.filter(r => r.dark).map(r => r.n), light = runs.filter(r => !r.dark).map(r => r.n)
    expect(dark.length).toBeGreaterThanOrEqual(8)
    expect(mean(dark)).toBeGreaterThan(1.4 * mean(light))
  })
  it("dowitcher: the eyebrow is pale against the dark cap", () => {
    const brow = d.pixels('skin', [d.u('eye'), d.u('billBase')], [0.3, 0.37]).map(q => q[0]).sort((a, b) => b - a)
    const cap = d.pixels('skin', [d.u('nape'), d.u('lores')], [0, 0.15]).map(q => q[0])
    expect(mean(brow.slice(0, Math.floor(brow.length / 3)))).toBeGreaterThan(mean(cap) + 0.4)
  })
  it('both: yellow legs, the dowitcher\'s greener than the Pectoral\'s', () => {
    const [dr, dg, db] = regionStats(d.px, 'legs', [0, 1], [0, 1]).rgb
    const [pr, pg, pb] = regionStats(p.px, 'legs', [0, 1], [0, 1]).rgb
    expect(Math.min(dr, dg)).toBeGreaterThan(db + 0.25)
    expect(Math.min(pr, pg)).toBeGreaterThan(pb + 0.25)
    within(dr / dg, 0.9, 1.15); within(pr / pg, 0.9, 1.15)
    expect(dg / dr).toBeGreaterThan(pg / pr)
  })
  it('Pectoral: the streaked bib is darker than the white belly', () => {
    const bib = regionStats(p.px, 'skin', [p.u('breast'), p.u('neckMid')], [0.6, 0.95])
    const belly = regionStats(p.px, 'skin', [p.u('rump'), p.u('hip')], [0.75, 1])
    expect(bib.mean).toBeLessThan(belly.mean - 0.15)
    expect(bib.roughS).toBeGreaterThan(belly.roughS + 0.05)
  })
  it("Pectoral: the bib stops in a sharp line: the underside goes from white to streaked within 4 mm", () => {
    // 0.5 mm slices of the front midline, from behind the flank station forward to the breast
    const len = p.profile.length * 1000, u0 = p.u('hip'), u1 = p.u('breast'), slice = 0.5 / len
    let lastWhite = -Infinity, firstBib = Infinity
    for (let u = u0; u < u1; u += slice) {
      const lum = p.pixels('skin', [u, u + slice], [0.88, 1]).map(q => q[0])
      if (!lum.length) continue
      const m = mean(lum), at = (u - u0) * len
      if (m > 0.9 && firstBib === Infinity) lastWhite = at
      if (m < 0.75 && firstBib === Infinity) firstBib = at
    }
    expect(firstBib).toBeLessThan(Infinity)
    expect(firstBib - lastWhite).toBeLessThanOrEqual(4)
  })
  it("Pectoral: the scapulars' fringes are warmer than their blackish centres", () => {
    const back = p.pixels('skin', [p.u('hip'), p.u('neckBase')], [0.05, 0.34]).sort((a, b) => a[0] - b[0])
    const third = Math.floor(back.length / 3)
    const warmth = (xs: typeof back) => mean(xs.map(q => q[1] - q[3]))
    expect(warmth(back.slice(-third))).toBeGreaterThan(warmth(back.slice(0, third)) + 0.15)
  })
})
