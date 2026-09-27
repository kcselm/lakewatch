import * as THREE from 'three'
import { SPEC as COOT } from './amecoo'
import { billWidthAt, billDepthAt } from '../detail/measure'
import { RINGS, RADIAL } from '../detail/loft'
import type { DetailedBirdModel } from '../detail/build'
import { built, atlas, within, draftShare, hueIn } from './swimmer.testkit'

// Bounds from docs/research/2026-09-25-american-coot.md, section 10 (Ridgway & Friedmann 1941, Eddleman & Knopf 1985,
// Gullion 1951, photo-measured), in mm, at rest with the waterline at y = 0. The shield's geometry is shared by both
// versions; the juvenile's smaller, paler shield is paint.

const A = built(COOT, 'adult')

/**
 * The chin in the level side view (z dropped), on a 0.1 mm grid around the bill base's bottom, mm2:
 *   lip   - loft in front of the bill base's bottom and below the bill's underside (the chin jutting under the bill)
 *   bump  - going down from the bill base for 30 mm, how far the chin's front comes forward again past the furthest-back
 *           point above it (a notch between chin and bill, open water showing in it)
 *   holes - background enclosed by the loft and bill (the side view seeing through a twisted head)
 */
function chinSide(m: DetailedBirdModel) {
  const a = m.anatomy, g = m.mesh.geometry
  const pos = g.getAttribute('position') as THREE.BufferAttribute, idx = g.getIndex()!
  const bb = a.billBase.clone().addScaledVector(a.billUp, -billDepthAt(m, 0) / 2)
  const C = 1e-4, N = 500, X0 = bb.x - 0.025, Y0 = bb.y - 0.035
  const mask = (name: string) => {
    const r = a.closed.find(c => c.name === name)!, M = new Uint8Array(N * N)
    for (let i = r.indexFirst; i < r.indexFirst + r.indexCount; i += 3) {
      const p = [0, 1, 2].map(k => { const j = idx.getX(i + k); return [(pos.getX(j) - X0) / C, (pos.getY(j) - Y0) / C] as [number, number] })
      const [u, v, w] = p as [[number, number], [number, number], [number, number]]
      const x0 = Math.max(0, Math.floor(Math.min(u[0], v[0], w[0]))), x1 = Math.min(N - 1, Math.ceil(Math.max(u[0], v[0], w[0])))
      const y0 = Math.max(0, Math.floor(Math.min(u[1], v[1], w[1]))), y1 = Math.min(N - 1, Math.ceil(Math.max(u[1], v[1], w[1])))
      const d = (v[0] - u[0]) * (w[1] - u[1]) - (v[1] - u[1]) * (w[0] - u[0])
      if (x0 > x1 || y0 > y1 || Math.abs(d) < 1e-12) continue
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5
        const b0 = ((v[0] - px) * (w[1] - py) - (v[1] - py) * (w[0] - px)) / d, b1 = ((w[0] - px) * (u[1] - py) - (w[1] - py) * (u[0] - px)) / d
        if (b0 >= 0 && b1 >= 0 && b0 + b1 <= 1) M[y * N + x] = 1
      }
    }
    return M
  }
  const loft = mask('loft'), bill = mask('bill')
  const bx = Math.round((bb.x - X0) / C), by = Math.round((bb.y - Y0) / C)
  let lip = 0, bump = 0, holes = 0, low = bx
  for (let x = bx + 1; x < N; x++) {
    let under = N
    for (let y = 0; y < N; y++) if (bill[y * N + x]) { under = y; break }
    for (let y = by - 300; y < under; y++) if (loft[y * N + x]) lip++
  }
  for (let y = by; y > by - 300; y--) {
    let f = -1
    for (let x = bx + 80; x >= 0; x--) if (loft[y * N + x]) { f = x; break }
    if (f < 0) continue
    if (f > low) bump += f - low
    low = Math.min(low, f)
  }
  const seen = new Uint8Array(N * N), stack: number[] = []
  const push = (k: number) => { if (!seen[k] && !loft[k] && !bill[k]) { seen[k] = 1; stack.push(k) } }
  for (let k = 0; k < N; k++) { push(k); push((N - 1) * N + k); push(k * N); push(k * N + N - 1) }
  while (stack.length) {
    const k = stack.pop()!, x = k % N
    if (x > 0) push(k - 1)
    if (x < N - 1) push(k + 1)
    if (k >= N) push(k - N)
    if (k < N * (N - 1)) push(k + N)
  }
  for (let k = 0; k < N * N; k++) if (!seen[k] && !loft[k] && !bill[k]) holes++
  const mm2 = (n: number) => n * 1e-2
  return { lip: mm2(lip), bump: mm2(bump), holes: mm2(holes) }
}

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
  it('the chin meets the bill and recedes from it: no lip under the bill, no notch, nothing seen through the head', () => {
    const c = chinSide(A.model)
    expect(c.lip, 'loft jutting in front of the bill base, mm2').toBeLessThan(0.5)
    // the chin's straight facets step a few tenths of a millimetre on this grid (0.47 here); the lip traced to R1 read 22
    expect(c.bump, 'chin coming forward again below the bill, mm2').toBeLessThan(1)
    expect(c.holes, 'background seen through the head, mm2').toBeLessThan(0.1)
  })
  it("the head's surface never doubles back on itself between rings (a fold shows as a crease under the eye)", () => {
    const p = A.model.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const at = (i: number, j: number) => new THREE.Vector3().fromBufferAttribute(p, i * RADIAL + j)
    let worst = 0
    for (let i = Math.ceil(0.85 * (RINGS - 1)); i + 1 < RINGS; i++) for (let j = 0; j < RADIAL; j++) {
      const v1 = at(i, j).sub(at(i - 1, j)), v2 = at(i + 1, j).sub(at(i, j))
      worst = Math.max(worst, THREE.MathUtils.radToDeg(v1.angleTo(v2)))
    }
    expect(worst, 'sharpest bend between rings, degrees').toBeLessThan(90)
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
