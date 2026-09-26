import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { buildBill, billCenter } from './bill'
import { measure, billWidthAt, billDepthAt } from './measure'
import { createProfile } from './profile'
import { Mesher, signedVolume } from './mesher'
import { detailSchema, type DetailSpec } from './spec'
import { BONE_INDEX } from './rig'
import { TEST_SPEC, TEST_DETAIL, TEST_SWIM_SPEC, TEST_SWIM_DETAIL } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { REGIONS, ATLAS_SIZE } from '../paint/atlas'
import { paintAtlas, partFrames, regionStats } from '../paint/painter'

/**
 * The Northern Shoveler's bill, docs/research/2026-09-25-northern-shoveler.md section 2.4: width (top view) and depth
 * (side view) in mm against s, a fraction of the culmen from the base, as the research recommends them.
 */
const SHOVELER_WIDTH: [number, number][] = [
  [0, 16.5], [0.1, 18.0], [0.18, 19.5], [0.3, 21.2], [0.4, 23.3], [0.5, 25.4], [0.6, 27.4], [0.7, 28.9], [0.75, 29.5],
  [0.8, 28.9], [0.85, 26.8], [0.9, 23.6], [0.93, 20.7], [0.975, 10.6], [1, 0],
]
const SHOVELER_DEPTH: [number, number][] = [
  [0, 21], [0.13, 20.5], [0.225, 19.3], [0.325, 17.5], [0.43, 16.3], [0.535, 15.6], [0.625, 15.2], [0.7, 13.2], [0.8, 10],
  [0.88, 7], [0.955, 5], [1, 2.5],
]
/** the two tables at every point of either, as multiples of the base (16.5 mm wide, 21 mm deep), linear between */
const SHOVELER_PROFILE: [number, number, number][] = [
  [0, 1, 1], [0.1, 1.0909, 0.9817], [0.13, 1.125, 0.9762], [0.18, 1.1818, 0.9461], [0.225, 1.2205, 0.919],
  [0.3, 1.2848, 0.8548], [0.325, 1.3167, 0.8333], [0.4, 1.4121, 0.7925], [0.43, 1.4503, 0.7762], [0.5, 1.5394, 0.754],
  [0.535, 1.5818, 0.7429], [0.6, 1.6606, 0.7291], [0.625, 1.6833, 0.7238], [0.7, 1.7515, 0.6286], [0.75, 1.7879, 0.5524],
  [0.8, 1.7515, 0.4762], [0.85, 1.6242, 0.3869], [0.88, 1.5079, 0.3333], [0.9, 1.4303, 0.3079], [0.93, 1.2545, 0.2698],
  [0.955, 0.9145, 0.2381], [0.975, 0.6424, 0.1852], [1, 0, 0.119],
]
/**
 * The Mallard's bill, docs/research/2026-09-25-mallard.md section 9: width as a fraction of the widest (22.4 mm; the
 * base is 0.93 of it), here over the base's, and depth as a fraction of the base's, at every point of either table.
 */
const MALLARD_PROFILE: [number, number, number][] = [
  [0, 1, 1], [0.1, 0.9624, 1], [0.2, 0.9247, 1], [0.3, 0.957, 0.92], [0.4, 1.0215, 0.81], [0.5, 1.0215, 0.7],
  [0.58, 1.0753, 0.636], [0.6, 1.0753, 0.62], [0.7, 1.0753, 0.54], [0.74, 1.0753, 0.492], [0.8, 1.0323, 0.42],
  [0.84, 0.9785, 0.372], [0.85, 0.9534, 0.36], [0.87, 0.9032, 0.316], [0.9, 0.8172, 0.25], [0.93, 0.6774, 0.25],
  [0.95, 0.6129, 0.25], [0.97, 0.4839, 0.25], [0.98, 0.4086, 0.25], [1, 0, 0.25],
]

/** The test duck with another bill. */
function duckWith(bill: Partial<DetailSpec['bill']>, measurements: Partial<DetailSpec['measurements']> = {}): DetailedBirdModel {
  const detail = { ...TEST_SWIM_DETAIL, bill: { ...TEST_SWIM_DETAIL.bill, ...bill }, measurements: { ...TEST_SWIM_DETAIL.measurements, ...measurements } }
  return buildDetailedBird(parseSpeciesSpec({ ...TEST_SWIM_SPEC, detail }))
}
const shoveler = () => duckWith({ taper: undefined, profile: SHOVELER_PROFILE }, { culmen: 0.064, billWidth: 0.0165, billDepth: 0.021 })
const mallard = () => duckWith({ taper: undefined, profile: MALLARD_PROFILE }, { culmen: 0.053, billWidth: 0.0208, billDepth: 0.0183 })

describe('bill profile', () => {
  it("follows the Shoveler's research table within 0.5 mm at each point", () => {
    const m = shoveler()
    for (const [s, mm] of SHOVELER_WIDTH) expect(Math.abs(billWidthAt(m, s) * 1000 - mm), `width at ${s}`).toBeLessThan(0.5)
    // the tip itself closes to a point, so the nail's 2.5 mm of depth at s = 1 is the one point left out
    for (const [s, mm] of SHOVELER_DEPTH.filter(([s]) => s < 1)) expect(Math.abs(billDepthAt(m, s) * 1000 - mm), `depth at ${s}`).toBeLessThan(0.5)
  })
  it("widens the Shoveler's to its spoon: widest at 0.65-0.80 of the bill, 1.6-2.0 times the base (research section 10)", () => {
    const r = measure(shoveler())
    expect(r.billWidestAt).toBeGreaterThanOrEqual(0.65); expect(r.billWidestAt).toBeLessThanOrEqual(0.8)
    expect(r.billWidestRatio).toBeGreaterThanOrEqual(1.6); expect(r.billWidestRatio).toBeLessThanOrEqual(2)
  })
  it("gives the Mallard's its widest point at 58-74% of its length, 1.02-1.10 times the base (research sections 9, 10)", () => {
    const r = measure(mallard())
    expect(r.billWidestAt).toBeGreaterThanOrEqual(0.58); expect(r.billWidestAt).toBeLessThanOrEqual(0.74)
    expect(r.billWidestRatio).toBeGreaterThanOrEqual(1.02); expect(r.billWidestRatio).toBeLessThanOrEqual(1.1)
  })
  it('measures a tapered bill too: as wide and deep as its measurements at the base, narrowing to the tip', () => {
    const m = buildDetailedBird(TEST_SPEC)
    expect(billWidthAt(m, 0) / TEST_DETAIL.measurements.billWidth).toBeCloseTo(1, 2)
    expect(billDepthAt(m, 0) / TEST_DETAIL.measurements.billDepth).toBeCloseTo(1, 2)
    expect(billWidthAt(m, 0.5)).toBeLessThan(billWidthAt(m, 0.2))
    expect(measure(m).billWidestAt).toBeLessThan(0.05)
  })
  it("sizes the bill's paint frame by the profile: the spoon is wider than the base, a tapered bill narrower", () => {
    const spoon = { ...TEST_SWIM_DETAIL, bill: { curve: 0, profile: SHOVELER_PROFILE } }
    const f = partFrames(spoon, createProfile(spoon.profile))
    expect(f.bill.widthMm(0.75)).toBeGreaterThan(1.2 * f.bill.widthMm(0))
    const g = partFrames(TEST_DETAIL, createProfile(TEST_DETAIL.profile))
    expect(g.bill.widthMm(0.75)).toBeLessThan(0.6 * g.bill.widthMm(0))
  })
  it('needs a taper or a profile, and profile points that run from the base to the tip', () => {
    expect(() => detailSchema.parse({ ...TEST_DETAIL, bill: { curve: 0 } })).toThrow(/taper or a profile/)
    expect(() => detailSchema.parse({ ...TEST_DETAIL, bill: { curve: 0, profile: [[0.5, 1, 1], [0.2, 1, 1]] } })).toThrow(/base to tip/)
  })
})

describe('bill hook', () => {
  const profile = createProfile(TEST_DETAIL.profile)
  const hooked = { ...TEST_DETAIL, bill: { ...TEST_DETAIL.bill, hook: 0.0015 } }
  it('drops the tip by its value, and only over the last tenth of the bill', () => {
    const plain = buildBill(new Mesher(), TEST_DETAIL, profile), hook = buildBill(new Mesher(), hooked, profile)
    expect(plain.tip.clone().sub(hook.tip).dot(plain.up)).toBeCloseTo(0.0015, 9)
    for (const s of [0, 0.5, 0.9]) expect(billCenter(hooked, profile, s).p.distanceTo(billCenter(TEST_DETAIL, profile, s).p), `${s}`).toBeLessThan(1e-12)
    // a grebe's hooked tip reads as a lower tip on the built bird
    const m = buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: hooked }))
    expect(measure(m).billTipRise - measure(buildDetailedBird(TEST_SPEC)).billTipRise).toBeCloseTo(-0.0015, 6)
  })
  it('keeps the hooked bill closed and outward-facing', () => {
    const m = new Mesher()
    const b = buildBill(m, hooked, profile)
    expect(signedVolume(m.geometry(), b.indexFirst, b.indexCount)).toBeGreaterThan(0)
  })
})

describe('frontal shield', () => {
  // the American Coot's in late September: 9 mm up the forehead, 7 mm wide, 2.2 mm thick
  // (docs/research/2026-09-25-american-coot.md, sections 5.2 and 9)
  const COOT_SHIELD = { length: 0.009, width: 0.007, thickness: 0.0022 }
  const coot = () => duckWith({ shield: COOT_SHIELD })
  /** how many vertices map into the shield's atlas region */
  const inShield = (m: DetailedBirdModel) => {
    const uv = m.mesh.geometry.getAttribute('uv') as THREE.BufferAttribute
    const r = REGIONS.shield
    let n = 0
    for (let i = 0; i < uv.count; i++) {
      const x = uv.getX(i) * ATLAS_SIZE, y = uv.getY(i) * ATLAS_SIZE
      if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) n++
    }
    return n
  }
  it('is built only when the bill has one', () => {
    const plain = buildDetailedBird(TEST_SWIM_SPEC), shielded = coot()
    expect(inShield(plain)).toBe(0)
    expect(plain.anatomy.shield).toBeNull()
    expect(plain.anatomy.closed.map(c => c.name)).toEqual(['loft', 'bill'])
    expect(inShield(shielded)).toBeGreaterThan(50)
    expect(shielded.anatomy.closed.map(c => c.name)).toEqual(['loft', 'bill', 'shield'])
  })
  it('is closed and faces outward, and moves with the head', () => {
    const m = coot()
    const c = m.anatomy.closed.find(x => x.name === 'shield')!
    expect(signedVolume(m.mesh.geometry, c.indexFirst, c.indexCount)).toBeGreaterThan(0)
    const uv = m.mesh.geometry.getAttribute('uv') as THREE.BufferAttribute
    const bones = m.mesh.geometry.getAttribute('skinIndex') as THREE.BufferAttribute
    const r = REGIONS.shield
    for (let i = 0; i < uv.count; i++) {
      const x = uv.getX(i) * ATLAS_SIZE, y = uv.getY(i) * ATLAS_SIZE
      if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) expect(bones.getX(i)).toBe(BONE_INDEX.head)
    }
  })
  it('runs from the top of the bill base up the forehead for its length', () => {
    const m = coot()
    const { base, top } = m.anatomy.shield!
    const a = m.anatomy
    const billTop = a.billBase.clone().addScaledVector(a.billUp, TEST_SWIM_DETAIL.profile.at(-1)!.up)
    expect(base.distanceTo(billTop)).toBeLessThan(0.001)
    expect(top.y).toBeGreaterThan(base.y)
    expect(top.x).toBeLessThan(base.x)
    // measured along the curving forehead, so the straight line from end to end is a little shorter
    expect(base.distanceTo(top)).toBeGreaterThan(0.8 * COOT_SHIELD.length)
    expect(base.distanceTo(top)).toBeLessThanOrEqual(COOT_SHIELD.length + 1e-9)
  })
  it('stands off the head by its thickness at the middle', () => {
    const m = coot()
    const c = m.anatomy.closed.find(x => x.name === 'shield')!
    const pos = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const idx = m.mesh.geometry.getIndex()!
    const v = new THREE.Vector3()
    let far = 0
    const { base, top } = m.anatomy.shield!
    // the plate's rise off the line from its base to its top, square to that line in the side view
    const along = top.clone().sub(base).normalize(), out = new THREE.Vector3(along.y, -along.x, 0)
    if (out.dot(new THREE.Vector3(1, 1, 0)) < 0) out.negate()
    for (let i = c.indexFirst; i < c.indexFirst + c.indexCount; i++) far = Math.max(far, v.fromBufferAttribute(pos, idx.getX(i)).sub(base).dot(out))
    expect(far).toBeGreaterThan(COOT_SHIELD.thickness * 0.8)
  })
  it('paints in its own atlas region, and nothing else', () => {
    const px = paintAtlas({ code: 'testduck', detail: TEST_SWIM_DETAIL, layers: [{ kind: 'fill', where: { part: 'shield' }, color: '#ffffff' }], profile: createProfile(TEST_SWIM_DETAIL.profile) })
    expect(regionStats(px, 'shield', [0, 1], [0, 1]).mean).toBeCloseTo(1, 2)
    expect(regionStats(px, 'bill', [0, 1], [0, 1]).mean).toBeCloseTo(0.5, 1)
    expect(regionStats(px, 'eye', [0, 1], [0, 1]).mean).toBeLessThan(0.5)
  })
})
