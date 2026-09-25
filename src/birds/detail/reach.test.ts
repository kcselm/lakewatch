import { neckSwing, headPitchToGround, MAX_NECK_SWING, type Neck } from './reach'

/** the bill tip's height for a neck swung by `s`, the way neckSwing models it */
const tipY = (n: Neck, s: number) => n.base.y + n.l1 * Math.sin(n.a1 - s / 2) + n.l2 * Math.sin(n.a2 - s) + n.reach * Math.sin(n.tipAngle)

// an upright neck: two 0.03 m segments from a base `baseY` up, and 0.04 m of head and bill pointing 63 degrees down
const neck = (baseY: number, a1 = 1.3, a2 = 1.4): Neck => ({ base: { x: 0, y: baseY }, l1: 0.03, a1, l2: 0.03, a2, reach: 0.04, tipAngle: -1.1 })

describe('neckSwing', () => {
  it('swings the neck just far enough for the bill tip to meet the ground', () => {
    const n = neck(0.03)
    const s = neckSwing(n)
    expect(s).toBeGreaterThan(0)
    expect(s).toBeLessThan(MAX_NECK_SWING)
    expect(tipY(n, s)).toBeCloseTo(0, 6)
  })
  it('does not swing when the tip already reaches', () => {
    expect(neckSwing(neck(0.03, -0.5, -0.5))).toBe(0)       // already reaching down
  })
  it('swings all the way when even that leaves the tip short', () => {
    expect(neckSwing(neck(0.1))).toBe(MAX_NECK_SWING)
  })
  it('takes the first swing that gets there, not a later one', () => {
    const n = neck(0.03)
    const s = neckSwing(n)
    for (let k = 0; k < 20; k++) expect(tipY(n, (s * k) / 20)).toBeGreaterThan(0)
  })
})

describe('headPitchToGround', () => {
  it('pitches the bill down onto the ground when it can reach', () => {
    const head = { x: 0, y: 0.03 }, tip = { x: 0.04, y: 0.03 }
    const p = headPitchToGround(head, tip)
    const a = Math.atan2(0, 0.04) - p
    expect(head.y + 0.04 * Math.sin(a)).toBeCloseTo(0, 9)
  })
  it('points the bill straight down when the ground is out of reach', () => {
    expect(headPitchToGround({ x: 0, y: 0.1 }, { x: 0.04, y: 0.1 })).toBeCloseTo(Math.PI / 2, 9)
  })
  it('never turns the tip line below its floor, so the bill stops at straight down however far the ground is', () => {
    // unfloored, a head this high would pitch the tip line a full pi/2 down; the floor holds it at -1.2
    expect(headPitchToGround({ x: 0, y: 0.1 }, { x: 0.04, y: 0.1 }, -1.2)).toBeCloseTo(1.2, 9)
    // a floor below the aim changes nothing
    expect(headPitchToGround({ x: 0, y: 0.03 }, { x: 0.04, y: 0.03 }, -1.5)).toBeCloseTo(headPitchToGround({ x: 0, y: 0.03 }, { x: 0.04, y: 0.03 }), 12)
  })
  it('lifts the bill back onto the ground when a deep lean would push it under', () => {
    const head = { x: 0, y: 0.01 }, tip = { x: 0.02, y: -0.01 }
    const p = headPitchToGround(head, tip)
    expect(p).toBeLessThan(0)
    const a = Math.atan2(-0.02, 0.02) - p
    expect(head.y + Math.hypot(0.02, 0.02) * Math.sin(a)).toBeCloseTo(0, 9)
  })
})
