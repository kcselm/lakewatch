import { RippleBuffer } from './ripples'

describe('RippleBuffer', () => {
  it('spawns and ages rings, dropping them after 2.5 s', () => {
    const r = new RippleBuffer(4)
    r.spawn(1, 2)
    r.update(1)
    expect(r.rings).toHaveLength(1)
    expect(r.rings[0]!.age).toBeCloseTo(1)
    r.update(2)
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
    // a duck's wake, spawned first, has most of its 2.5 s ahead of it; a bill's small ring, 0.85 s into its 1 s, is
    // almost gone
    const r = new RippleBuffer(4)
    r.spawn(0, 0); r.update(0.05)
    r.spawn(9, 9, 0.4); r.update(0.85)
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
  it('keeps a small ring, a bill going into the water, for its share of a full ring life', () => {
    const r = new RippleBuffer(4)
    r.spawn(0, 0, 0.4)
    r.spawn(1, 1)
    r.update(0.9)
    expect(r.rings.map(x => x.size)).toEqual([0.4, 1])
    r.update(0.2)                                    // 1.1 s: past the small ring's 0.4 x 2.5 s
    expect(r.rings.map(x => x.size)).toEqual([1])
    const out = new Float32Array(16)
    r.spawn(2, 2, 0.4)
    r.pack(out)
    expect(out[7]).toBeCloseTo(0.4, 6)
  })
})
