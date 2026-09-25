import { createProfile, sectionOffset } from './profile'
import { TEST_DETAIL } from './fixture'

const profile = createProfile(TEST_DETAIL.profile)

describe('createProfile', () => {
  it('passes through every station', () => {
    for (const st of TEST_DETAIL.profile) {
      const s = profile.sampleAt(profile.uOf(st.label!))
      expect(s.point.x).toBeCloseTo(st.x, 3)
      expect(s.point.y).toBeCloseTo(st.y, 3)
      expect(s.up).toBeCloseTo(st.up, 3)
      expect(s.down).toBeCloseTo(st.down, 3)
      expect(s.halfWidth).toBeCloseTo(st.halfWidth, 3)
    }
  })
  it('orders labels by arclength, first at 0 and last at 1', () => {
    const us = TEST_DETAIL.profile.map(s => profile.uOf(s.label!))
    expect(us[0]).toBe(0)
    expect(us[us.length - 1]).toBeCloseTo(1, 6)
    for (let i = 1; i < us.length; i++) expect(us[i]!).toBeGreaterThan(us[i - 1]!)
  })
  it('measures the spine: longer than the straight line from tail to bill base', () => {
    const a = TEST_DETAIL.profile[0]!, b = TEST_DETAIL.profile[TEST_DETAIL.profile.length - 1]!
    expect(profile.length).toBeGreaterThan(Math.hypot(b.x - a.x, b.y - a.y))
    expect(profile.length).toBeLessThan(0.35)
  })
  it('turns the normal from up on the body to back on the rising neck', () => {
    const body = profile.sampleAt(profile.uOf('hip'))
    expect(body.normal.y).toBeGreaterThan(0.9)
    const neck = profile.sampleAt(profile.uOf('neckMid'))
    expect(neck.normal.x).toBeLessThan(-0.8)
  })
  it('keeps sizes positive between stations', () => {
    for (let k = 0; k <= 200; k++) {
      const s = profile.sampleAt(k / 200)
      expect(Math.min(s.up, s.down, s.halfWidth)).toBeGreaterThan(0)
    }
  })
  it('throws on an unknown label', () => {
    expect(() => profile.uOf('knee')).toThrow(/knee/)
  })
  it('gives a half perimeter between half the ellipse bounds', () => {
    const s = profile.sampleAt(profile.uOf('hip'))
    const hp = profile.halfPerimeter(profile.uOf('hip'))
    expect(hp).toBeGreaterThan(s.up + s.down)
    expect(hp).toBeLessThan(s.up + s.down + 2 * s.halfWidth)
  })
})

describe('sectionOffset', () => {
  it('puts theta 0 on the back, pi/2 on the right side, pi on the belly', () => {
    expect(sectionOffset(0, 2, 3, 1)).toEqual({ n: 2, z: 0 })
    const side = sectionOffset(Math.PI / 2, 2, 3, 1)
    expect(side.n).toBeCloseTo(0, 6)
    expect(side.z).toBeCloseTo(1, 6)
    const belly = sectionOffset(Math.PI, 2, 3, 1)
    expect(belly.n).toBeCloseTo(-3, 6)
  })
})
