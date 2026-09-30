import { Wind, gustAt, gustFront, GUST_FRONT, WIND_SPEED } from './wind'

describe('gustAt', () => {
  it('is deterministic for a seed', () => {
    expect(gustAt(12.5, 0.5, 42)).toBe(gustAt(12.5, 0.5, 42))
  })
  it('stays within 0..1', () => {
    for (let t = 0; t < 100; t += 0.37) {
      const g = gustAt(t, 1, 3)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(1)
    }
  })
  it('is flat when gustiness is zero', () => {
    expect(gustAt(0, 0, 1)).toBe(gustAt(50, 0, 1))
  })
})

describe('Wind', () => {
  it('converts a compass direction into a unit vector on the ground plane', () => {
    // direction 0 = wind blowing toward -z (from the north, toward the far shore); 90 = toward +x
    const w = new Wind({ direction: 90, strength: 0.5, gustiness: 0, seed: 1 })
    expect(w.state.dir.x).toBeCloseTo(1)
    expect(w.state.dir.y).toBeCloseTo(0)
  })
  it('advances time and refreshes uniforms on update', () => {
    const w = new Wind({ direction: 0, strength: 0.5, gustiness: 0.5, seed: 1 })
    w.update(0.5)
    expect(w.state.time).toBeCloseTo(0.5)
    expect(w.uniforms.uTime.value).toBeCloseTo(0.5)
    expect(w.uniforms.uWindGust.value).toBe(w.state.gust)
  })
})

describe('gustFront', () => {
  it('runs downwind at the speed of the lake breeze itself, about 2.8 m/s at a strength of 0.35', () => {
    const speed = GUST_FRONT.omega / GUST_FRONT.k
    expect(speed).toBeGreaterThan(WIND_SPEED * 0.35 * 0.9)
    expect(speed).toBeLessThan(WIND_SPEED * 0.35 * 1.1)
    // a crest at 0 now is a crest `speed` metres downwind a second later
    const t = 3.2, crest = (Math.PI / 2 + t * GUST_FRONT.omega) / GUST_FRONT.k
    expect(gustFront(crest, t)).toBeCloseTo(1, 6)
    expect(gustFront(crest + speed, t + 1)).toBeCloseTo(1, 6)
  })
})
