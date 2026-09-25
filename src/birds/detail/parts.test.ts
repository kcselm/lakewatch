import * as THREE from 'three'
import { createProfile } from './profile'
import { Mesher, signedVolume } from './mesher'
import { buildBill, billCenter, buildEyes, eyePlacement } from './bill'
import { buildFoldedWings, buildSpreadWings, shoulderAt, bodySurfaceZ, outlineAt } from './wing'
import { buildTail, tipShape } from './tail'
import { TEST_DETAIL } from './fixture'
import type { Part } from './spec'

const profile = createProfile(TEST_DETAIL.profile)

/** Average vertex normal of every vertex painted on `part`. */
function meanNormal(m: Mesher, g: THREE.BufferGeometry, part: Part, filter: (p: THREE.Vector3) => boolean = () => true): THREE.Vector3 {
  const n = g.getAttribute('normal') as THREE.BufferAttribute
  const sum = new THREE.Vector3()
  m.parts.forEach((p, i) => { if (p === part && filter(m.position(i))) sum.add(new THREE.Vector3().fromBufferAttribute(n, i)) })
  return sum.normalize()
}

describe('bill', () => {
  it('is culmen long from the forehead to the tip', () => {
    const m = new Mesher()
    const b = buildBill(m, TEST_DETAIL, profile)
    expect(b.tip.distanceTo(b.base)).toBeCloseTo(TEST_DETAIL.measurements.culmen, 3)
  })
  it('is closed and faces outward', () => {
    const m = new Mesher()
    const b = buildBill(m, TEST_DETAIL, profile)
    expect(signedVolume(m.geometry(), b.indexFirst, b.indexCount)).toBeGreaterThan(0)
  })
  it('lifts the tip by curve x length, and stays straight at curve 0', () => {
    const up = buildBill(new Mesher(), TEST_DETAIL, profile)
    const rise = up.tip.clone().sub(up.base).dot(up.up)
    expect(rise).toBeCloseTo(TEST_DETAIL.bill.curve * TEST_DETAIL.measurements.culmen, 4)
    const straight = buildBill(new Mesher(), { ...TEST_DETAIL, bill: { ...TEST_DETAIL.bill, curve: 0 } }, profile)
    expect(Math.abs(straight.tip.clone().sub(straight.base).dot(straight.up))).toBeLessThan(1e-6)
  })
  it('curves only over the distal half', () => {
    const mid = billCenter(TEST_DETAIL, profile, 0.5).p
    const flat = billCenter({ ...TEST_DETAIL, bill: { ...TEST_DETAIL.bill, curve: 0 } }, profile, 0.5).p
    expect(mid.distanceTo(flat)).toBeLessThan(1e-9)
  })
  it('is billDepth deep where it leaves the forehead', () => {
    const b = buildBill(new Mesher(), TEST_DETAIL, profile)
    const ys = b.baseRing.map(v => v.clone().sub(b.base).dot(b.up))
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(TEST_DETAIL.measurements.billDepth, 3)
  })
})

describe('eyes', () => {
  it('sit on either side of the head, facing out', () => {
    const { center, outward } = eyePlacement(TEST_DETAIL, profile)
    expect(center.z).toBeGreaterThan(0)
    expect(outward.z).toBeGreaterThan(0.5)
    const m = new Mesher()
    buildEyes(m, TEST_DETAIL, profile)
    const g = m.geometry()
    expect(meanNormal(m, g, 'eye', p => p.z > 0).z).toBeGreaterThan(0)
    expect(meanNormal(m, g, 'eye', p => p.z < 0).z).toBeLessThan(0)
  })
})

describe('folded wings', () => {
  it('reach wingChord from the wrist to the tip', () => {
    const f = buildFoldedWings(new Mesher(), TEST_DETAIL, profile)
    expect(f.tip.clone().setZ(0).distanceTo(f.wrist.clone().setZ(0))).toBeCloseTo(TEST_DETAIL.measurements.wingChord, 4)
  })
  it('lie outside the flank and face away from the body', () => {
    const m = new Mesher()
    buildFoldedWings(m, TEST_DETAIL, profile)
    m.parts.forEach((p, i) => {
      if (p !== 'wingFold') return
      const v = m.position(i)
      expect(Math.abs(v.z)).toBeGreaterThanOrEqual(bodySurfaceZ(profile, v.x, v.y))
    })
    const g = m.geometry()
    expect(meanNormal(m, g, 'wingFold', p => p.z > 0).z).toBeGreaterThan(0.5)
    expect(meanNormal(m, g, 'wingFold', p => p.z < 0).z).toBeLessThan(-0.5)
  })
  it('interpolates the outline', () => {
    expect(outlineAt([[0, 0.1], [1, 0.3]], 0.5)).toBeCloseTo(0.2, 9)
    expect(outlineAt([[0, 0.1], [1, 0.3]], 2)).toBe(0.3)
  })
})

describe('spread wings', () => {
  it('show their upper face up and their under face down, on both sides', () => {
    const m = new Mesher()
    buildSpreadWings(m, TEST_DETAIL, shoulderAt(TEST_DETAIL, profile))
    const g = m.geometry()
    for (const side of [1, -1]) {
      expect(meanNormal(m, g, 'wingSpread', p => p.z * side > 0).y).toBeGreaterThan(0.9)
      expect(meanNormal(m, g, 'wingUnder', p => p.z * side > 0).y).toBeLessThan(-0.9)
    }
  })
})

describe('tail', () => {
  it('is tail long from the tail base, pointing back', () => {
    const t = buildTail(new Mesher(), TEST_DETAIL, profile)
    expect(t.tip.distanceTo(t.root)).toBeCloseTo(TEST_DETAIL.measurements.tail, 4)
    expect(t.tip.x).toBeLessThan(t.root.x)
  })
  it('shows its upper face up and its under face down', () => {
    const m = new Mesher()
    buildTail(m, TEST_DETAIL, profile)
    const g = m.geometry()
    expect(meanNormal(m, g, 'tail').y).toBeGreaterThan(0.8)
    expect(meanNormal(m, g, 'tailUnder').y).toBeLessThan(-0.8)
  })
  it('shapes the tip: square flat, rounded and wedge longer in the middle, notched shorter', () => {
    expect(tipShape('square', 0.5)).toBe(0)
    expect(tipShape('rounded', 0.5)).toBeGreaterThan(tipShape('rounded', 0))
    expect(tipShape('wedge', 0.5)).toBeGreaterThan(tipShape('rounded', 0.5))
    expect(tipShape('notched', 0.5)).toBeLessThan(0)
  })
})
