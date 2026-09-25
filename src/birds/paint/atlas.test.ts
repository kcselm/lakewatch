import { ATLAS_SIZE, REGIONS, atlasUV, pixelST } from './atlas'
import type { Part } from '../detail/spec'

describe('atlas', () => {
  it('maps part (s, t) inside the part region, padding kept clear', () => {
    for (const [part, r] of Object.entries(REGIONS) as [Part, (typeof REGIONS)[Part]][]) {
      const [u0, v0] = atlasUV(part, 0, 0)
      const [u1, v1] = atlasUV(part, 1, 1)
      expect(u0 * ATLAS_SIZE).toBeGreaterThan(r.x)
      expect(u1 * ATLAS_SIZE).toBeLessThan(r.x + r.w)
      expect(v0 * ATLAS_SIZE).toBeGreaterThan(r.y)
      expect(v1 * ATLAS_SIZE).toBeLessThan(r.y + r.h)
    }
  })
  it('round-trips a pixel centre to (s, t) and back', () => {
    const [s, t] = pixelST('bill', REGIONS.bill.x + 40, REGIONS.bill.y + 10)
    const [u, v] = atlasUV('bill', s, t)
    expect(u * ATLAS_SIZE).toBeCloseTo(REGIONS.bill.x + 40.5, 6)
    expect(v * ATLAS_SIZE).toBeCloseTo(REGIONS.bill.y + 10.5, 6)
  })
  it('keeps regions inside the texture and apart', () => {
    const rs = Object.values(REGIONS)
    for (const a of rs) {
      expect(a.x + a.w).toBeLessThanOrEqual(ATLAS_SIZE)
      expect(a.y + a.h).toBeLessThanOrEqual(ATLAS_SIZE)
      for (const b of rs) {
        if (a === b) continue
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
        expect(overlap).toBe(false)
      }
    }
  })
})
