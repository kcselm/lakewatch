import { RippleBuffer, ringSpeed, ringLife, ringCrests, ringReach, RING } from './ripples'

describe('the ring\'s shape', () => {
  // the research's thresholds (2026-09-30-lake-water.md section 9)
  it('spreads at 0.2-0.3 m/s at size 0.5, never faster than 0.45 or slower than c_g,min, 0.178 m/s', () => {
    expect(ringSpeed(0.5)).toBeGreaterThanOrEqual(0.2)
    expect(ringSpeed(0.5)).toBeLessThanOrEqual(0.3)
    for (let s = 0; s <= 1; s += 0.05) {
      expect(ringSpeed(s)).toBeGreaterThanOrEqual(RING.innerSpeed)
      expect(ringSpeed(s)).toBeLessThanOrEqual(0.45)
    }
  })
  it('lasts at most 6 s, and a dive\'s runs 2-3 m before it fades', () => {
    expect(ringLife(1)).toBeLessThanOrEqual(6)
    expect(ringReach(1)).toBeGreaterThanOrEqual(2)
    expect(ringReach(1)).toBeLessThanOrEqual(3)
  })
  it('carries more crests the bigger it is: two for a bill, six for a dive', () => {
    expect(ringCrests(0)).toBe(2)
    expect(ringCrests(0.5)).toBe(4)
    expect(ringCrests(1)).toBe(6)
  })
})

describe('RippleBuffer', () => {
  it('spawns and ages rings, dropping a full-size ring after 6 s', () => {
    const r = new RippleBuffer(4)
    r.spawn(1, 2)
    r.update(5)
    expect(r.rings).toHaveLength(1)
    expect(r.rings[0]!.age).toBeCloseTo(5)
    r.update(1.01)
    expect(r.rings).toHaveLength(0)
  })
  it('evicts the oldest ring when full', () => {
    const r = new RippleBuffer(2)
    r.spawn(0, 0); r.update(0.1)
    r.spawn(1, 1); r.update(0.1)
    r.spawn(2, 2)
    expect(r.rings.map(x => x.x)).toEqual([1, 2])
  })
  it('when full, evicts the ring nearest the end of its own life, not the oldest', () => {
    // a dive's ring, spawned first, has most of its 6 s ahead of it; a bill's small ring, 2.4 s into its 2.4 s, is
    // almost gone
    const r = new RippleBuffer(4)
    r.spawn(0, 0); r.update(0.05)
    r.spawn(9, 9, 0.1); r.update(2.3)
    r.spawn(1, 1); r.spawn(2, 2)
    r.spawn(3, 3)
    expect(r.rings.map(x => x.x)).toEqual([0, 1, 2, 3])
  })
  it('packs into a float array with age and size', () => {
    const r = new RippleBuffer(2)
    r.spawn(3, 4)
    const out = new Float32Array(8)
    r.pack(out)
    expect(Array.from(out.slice(0, 4))).toEqual([3, 4, 0, 1])
    expect(out[6]).toBe(99)   // empty slot age sentinel: never rendered
  })
  it('keeps a small ring, a bill going into the water, for its own shorter life', () => {
    const r = new RippleBuffer(4)
    r.spawn(0, 0, 0.4)
    r.spawn(1, 1)
    r.update(3.5)
    expect(r.rings.map(x => x.size)).toEqual([0.4, 1])
    r.update(0.2)                                    // 3.7 s: past the small ring's 2 + 4 x 0.4 s
    expect(r.rings.map(x => x.size)).toEqual([1])
    const out = new Float32Array(16)
    r.spawn(2, 2, 0.4)
    r.pack(out)
    expect(out[7]).toBeCloseTo(0.4, 6)
  })
})
