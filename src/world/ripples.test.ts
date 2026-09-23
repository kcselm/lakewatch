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
  it('packs into a float array with age and padding', () => {
    const r = new RippleBuffer(2)
    r.spawn(3, 4)
    const out = new Float32Array(8)
    r.pack(out)
    expect(Array.from(out.slice(0, 4))).toEqual([3, 4, 0, 0])
    expect(out[6]).toBe(99)   // empty slot age sentinel: never rendered
  })
})
