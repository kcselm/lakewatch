import * as THREE from 'three'
import { buildLoft, loftWeights, ringT, worstFold, RINGS, RADIAL } from './loft'
import { createProfile } from './profile'
import { Mesher, signedVolume } from './mesher'
import { TEST_DETAIL } from './fixture'

const profile = createProfile(TEST_DETAIL.profile)

function built() {
  const m = new Mesher()
  const r = buildLoft(m, profile, TEST_DETAIL.rig)
  return { m, r, g: m.geometry() }
}

describe('ringT', () => {
  it('is 0 on the back, 1 on the belly, and the same on both sides', () => {
    expect(ringT(0)).toBe(0)
    expect(ringT(Math.PI)).toBe(1)
    expect(ringT(Math.PI / 2)).toBeCloseTo(ringT((3 * Math.PI) / 2), 9)
  })
})

describe('loftWeights', () => {
  it('always sums to 1 and hands off body -> neck -> neckMid -> head', () => {
    for (let k = 0; k <= 100; k++) {
      const w = loftWeights(k / 100, profile, TEST_DETAIL.rig)
      expect(w.reduce((a, [, x]) => a + x, 0)).toBeCloseTo(1, 9)
    }
    expect(loftWeights(0, profile, TEST_DETAIL.rig)).toEqual([['body', 1]])
    expect(loftWeights(1, profile, TEST_DETAIL.rig)).toEqual([['head', 1]])
    const mid = loftWeights((profile.uOf('neckBase') + profile.uOf('neckMid')) / 2, profile, TEST_DETAIL.rig)
    expect(mid.map(([b]) => b)).toEqual(['neck', 'neckMid'])
  })
})

describe('buildLoft', () => {
  it('makes RINGS x RADIAL vertices plus two cap points', () => {
    const { r } = built()
    expect(r.count).toBe(RINGS * RADIAL + 2)
    expect(r.ringU).toHaveLength(RINGS)
  })
  it('is a closed surface facing outward', () => {
    const { r, g } = built()
    expect(signedVolume(g, r.indexFirst, r.indexCount)).toBeGreaterThan(0)
  })
  it('spans the traced profile', () => {
    const { g } = built()
    g.computeBoundingBox()
    const b = g.boundingBox!
    const xs = TEST_DETAIL.profile.map(s => s.x)
    expect(b.min.x).toBeLessThan(Math.min(...xs))
    expect(b.max.x).toBeGreaterThan(Math.max(...xs))
    const hip = TEST_DETAIL.profile.find(s => s.label === 'hip')!
    expect(b.max.z).toBeCloseTo(Math.max(...TEST_DETAIL.profile.map(s => s.halfWidth)), 2)
    expect(b.min.y).toBeLessThan(hip.y - hip.down + 0.001)
  })
  it('puts t = 0 on the back midline (z = 0, above the spine)', () => {
    const { m, r } = built()
    const uv = m.geometry().getAttribute('uv') as THREE.BufferAttribute
    const i = r.first + Math.floor(RINGS / 3) * RADIAL      // a body ring, radial index 0
    const p = m.position(i)
    expect(p.z).toBeCloseTo(0, 9)
    const s = profile.sampleAt(Math.floor(RINGS / 3) / (RINGS - 1))
    expect(p.y).toBeGreaterThan(s.point.y)
    // skin v runs over the skin region's rows; the back midline is its first usable row
    const v0 = uv.getY(i), vBelly = uv.getY(i + RADIAL / 2)
    expect(v0).toBeLessThan(vBelly)
  })
  it('never folds a ring back over its neighbour (the neck turn is gentle enough)', () => {
    expect(worstFold(profile, TEST_DETAIL.rig)).toBe(0)
  })
  it('keeps a deep throat under a sharp turn clear of creases when its sections tilt', () => {
    // a head resting on the breast: the throat bulges forward under the turn from the neck to the head, and sections
    // square to the spine fold over each other there
    const throat: Record<string, number> = { nape: 0.03, occiput: 0.028, crown: 0.02 }
    const deep = TEST_DETAIL.profile.map(s => (s.label! in throat ? { ...s, down: throat[s.label!]! } : s))
    expect(worstFold(createProfile(deep), TEST_DETAIL.rig)).toBeGreaterThan(0.001)
    const tilt: Record<string, number> = { crown: 15, eye: 10 }
    const tilted = deep.map(s => (s.label! in tilt ? { ...s, tilt: tilt[s.label!]! } : s))
    expect(worstFold(createProfile(tilted), TEST_DETAIL.rig)).toBe(0)
  })
  it('catches a crease that only appears once sections tilt', () => {
    // TEST_DETAIL's spine never creases untilted (see above); twisting the crown one way and the eye the other
    // turns their rings past square to the spine until they cross each other
    const twisted = TEST_DETAIL.profile.map(s => {
      if (s.label === 'crown') return { ...s, tilt: 30 }
      if (s.label === 'eye') return { ...s, tilt: -30 }
      return s
    })
    expect(worstFold(createProfile(twisted), TEST_DETAIL.rig)).toBeGreaterThan(0.003)
    // the deep-throat fixture above only clears its crease tilted the right way (crown and eye forward, toward the
    // bill); tilted the other way its sections still fold, now against their own tilted planes rather than the
    // spine's
    const throat: Record<string, number> = { nape: 0.03, occiput: 0.028, crown: 0.02 }
    const deep = TEST_DETAIL.profile.map(s => (s.label! in throat ? { ...s, down: throat[s.label!]! } : s))
    const wrongWay: Record<string, number> = { crown: -15, eye: -10 }
    const wrong = deep.map(s => (s.label! in wrongWay ? { ...s, tilt: wrongWay[s.label!]! } : s))
    expect(worstFold(createProfile(wrong), TEST_DETAIL.rig)).toBeGreaterThan(0.003)
  })
  it('catches a spine that turns too tightly for its girth', () => {
    const tight = TEST_DETAIL.profile.map(s => (s.label === 'crown' ? { ...s, x: s.x - 0.012, y: s.y + 0.006 } : s))
    expect(worstFold(createProfile(tight), TEST_DETAIL.rig)).toBeGreaterThan(0.0005)
  })
})
