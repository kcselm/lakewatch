import { solveLeg, footOffset, legOffsets, STANCE } from './gait'
import { legLayout } from './legs'
import { createProfile } from './profile'
import { TEST_DETAIL } from './fixture'

const hip = { x: 0, y: 0 }
const a = 0.06, b = 0.06

describe('solveLeg', () => {
  it('reaches a target in range', () => {
    for (const target of [{ x: 0, y: -0.1 }, { x: 0.03, y: -0.09 }, { x: -0.04, y: -0.08 }]) {
      const { joint, foot } = solveLeg(hip, target, a, b)
      expect(foot.x).toBeCloseTo(target.x, 9)
      expect(foot.y).toBeCloseTo(target.y, 9)
      expect(Math.hypot(joint.x - hip.x, joint.y - hip.y)).toBeCloseTo(a, 9)
      expect(Math.hypot(foot.x - joint.x, foot.y - joint.y)).toBeCloseTo(b, 9)
    }
  })
  it('always bends the joint backward of the hip-foot line', () => {
    for (let x = -0.04; x <= 0.04; x += 0.01) {
      const target = { x, y: -0.1 }
      const { joint } = solveLeg(hip, target, a, b)
      // x of the hip-foot line at the joint's height
      const lineX = hip.x + ((target.x - hip.x) * (joint.y - hip.y)) / (target.y - hip.y)
      expect(joint.x).toBeLessThan(lineX)
    }
  })
  it('pulls an out-of-reach target in along the same line', () => {
    const { foot } = solveLeg(hip, { x: 0, y: -1 }, a, b)
    expect(foot.x).toBeCloseTo(0, 9)
    expect(foot.y).toBeCloseTo(-(a + b), 3)
  })
})

describe('footOffset', () => {
  it('slides back exactly as fast as the bird walks during stance', () => {
    const stride = 0.1
    for (let p = 0; p < STANCE - 0.05; p += 0.05) {
      const d0 = p * stride, d1 = (p + 0.05) * stride
      const x0 = footOffset(p, stride, 0.01).x, x1 = footOffset(p + 0.05, stride, 0.01).x
      expect(x1 - x0).toBeCloseTo(-(d1 - d0), 9)           // world x = distance + offset stays fixed
      expect(footOffset(p, stride, 0.01).y).toBe(0)
    }
  })
  it('lifts during swing and lands where stance begins', () => {
    expect(footOffset(STANCE + (1 - STANCE) / 2, 0.1, 0.01).y).toBeCloseTo(0.01, 9)
    expect(footOffset(0.9999999, 0.1, 0.01).x).toBeCloseTo(footOffset(0, 0.1, 0.01).x, 5)
  })
})

describe('legOffsets', () => {
  it('stands still at gait 0 however far the bird has walked', () => {
    const { left, right } = legOffsets(1.234, 0, 0.05, 0.01)
    for (const v of [left.x, left.y, right.x, right.y]) expect(v).toBeCloseTo(0, 12)
  })
  it('clamps gait into 0..1, whatever a behaviour hands it', () => {
    expect(legOffsets(0.03, 4, 0.05, 0.01)).toEqual(legOffsets(0.03, 1, 0.05, 0.01))
    expect(legOffsets(0.03, -2, 0.05, 0.01)).toEqual(legOffsets(0.03, 0, 0.05, 0.01))
  })
  it('keeps the feet half a stride out of phase', () => {
    const { left, right } = legOffsets(0, 1, 0.05, 0.01)
    expect(left.x).toBeCloseTo(0.1 * STANCE * 0.5, 9)        // left starts its stance
    expect(right.y).toBeGreaterThanOrEqual(0)
    expect(right.x).not.toBeCloseTo(left.x, 5)
  })
})

describe('legLayout', () => {
  const layout = legLayout(TEST_DETAIL, createProfile(TEST_DETAIL.profile))
  it('stands the hip at 92% of the leg reach, knee behind', () => {
    expect(layout.standHeight).toBeCloseTo(0.92 * (layout.tibia + layout.tarsus), 9)
    expect(layout.knee.x).toBeLessThan(layout.hip.x)
    expect(layout.hip.y - layout.foot.y).toBeCloseTo(layout.standHeight, 6)
  })
  it('hides part of the tibia in the body and shows measurements.tibia below the belly', () => {
    expect(layout.tibia - (layout.hip.y - layout.bellyY)).toBeCloseTo(TEST_DETAIL.measurements.tibia, 9)
  })
})
