import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { pouchDepth } from './bill'
import { signedVolume } from './mesher'
import { detailSchema, type DetailSpec } from './spec'
import { TEST_SWIM_SPEC, TEST_SWIM_DETAIL } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose } from '../model'
import { REGIONS } from '../paint/atlas'
import { paintAtlas, regionStats } from '../paint/painter'
import { createProfile } from './profile'

/** A pouch for the test duck's bill (53 mm): from under the throat to near the tip, slack and full. */
const POUCH: [number, number, number][] = [[-0.3, 0.004, 0.004], [0, 0.012, 0.03], [0.5, 0.011, 0.045], [0.9, 0.006, 0.012], [0.97, 0.002, 0.002]]
const detailWith = (pouch?: [number, number, number][]): DetailSpec => ({ ...TEST_SWIM_DETAIL, bill: { ...TEST_SWIM_DETAIL.bill, pouch } })
const duck = (pouch?: [number, number, number][]): DetailedBirdModel => buildDetailedBird(parseSpeciesSpec({ ...TEST_SWIM_SPEC, detail: detailWith(pouch) }))

/** How far the pouch's skin hangs below the bill's axis now, at most, metres. */
function hang(m: DetailedBirdModel): number {
  const a = m.anatomy, v = new THREE.Vector3()
  m.group.updateMatrixWorld(true)
  let low = 0
  for (let i = a.pouch!.first; i < a.pouch!.first + a.pouch!.count; i++) {
    low = Math.max(low, -m.mesh.getVertexPosition(i, v).sub(a.billBase).dot(a.billUp))
  }
  return low
}

describe('a pouch under the bill', () => {
  it('reads its outline between its points, and holds it past its ends', () => {
    expect(pouchDepth(POUCH, 0.25)).toEqual({ rest: 0.0115, full: 0.0375 })
    expect(pouchDepth(POUCH, -0.5)).toEqual({ rest: 0.004, full: 0.004 })
    expect(pouchDepth(POUCH, 1)).toEqual({ rest: 0.002, full: 0.002 })
  })
  it('hangs as deep as its slack outline at rest, and as deep as its full one when filled', () => {
    const m = duck(POUCH)
    expect(hang(m)).toBeCloseTo(0.012, 4)
    m.pose({ ...defaultPose(), pouch: 1 })
    expect(hang(m)).toBeCloseTo(0.045, 4)
    m.pose({ ...defaultPose(), pouch: 0.5 })
    expect(hang(m)).toBeGreaterThan(0.025)
    expect(hang(m)).toBeLessThan(0.03)
    // and past 1 no further
    m.pose({ ...defaultPose(), pouch: 3 })
    expect(hang(m)).toBeCloseTo(0.045, 4)
  })
  it('is a closed mesh facing outward, on the bill bone, and goes where the bill goes', () => {
    const m = duck(POUCH)
    const c = m.anatomy.closed.find(x => x.name === 'pouch')!
    expect(signedVolume(m.mesh.geometry, c.indexFirst, c.indexCount)).toBeGreaterThan(0)
    const before = hang(m)
    m.pose({ ...defaultPose(), neckExtend: 1, headPitch: -0.4 })
    // the bill's own frame turned with the head: measured in the group's frame the pouch now hangs elsewhere
    const now = () => { m.group.updateMatrixWorld(true); return m.mesh.getVertexPosition(m.anatomy.pouch!.first + 4, new THREE.Vector3()) }
    const v = now()
    m.pose(defaultPose())
    expect(now().distanceTo(v)).toBeGreaterThan(0.005)
    expect(hang(m)).toBeCloseTo(before, 6)
  })
  it('is no wider than the bill it hangs from', () => {
    const m = duck(POUCH), v = new THREE.Vector3()
    let wide = 0
    for (let i = m.anatomy.pouch!.first; i < m.anatomy.pouch!.first + m.anatomy.pouch!.count; i++) wide = Math.max(wide, Math.abs(m.mesh.getVertexPosition(i, v).z))
    expect(wide).toBeLessThan(TEST_SWIM_DETAIL.measurements.billWidth / 2)
    expect(wide).toBeGreaterThan(0.8 * TEST_SWIM_DETAIL.measurements.billWidth / 2)
  })
  it('leaves a bird without one exactly as it was: no pouch, no morph target', () => {
    const plain = duck()
    expect(plain.anatomy.pouch).toBeNull()
    expect(plain.mesh.geometry.morphAttributes.position).toBeUndefined()
    const withPouch = duck(POUCH)
    // the pouch's vertices come after the bill's and before the eyes'; everything before them is the same bird
    const a = plain.mesh.geometry.getAttribute('position').array, b = withPouch.mesh.geometry.getAttribute('position').array
    for (let i = 0; i < withPouch.anatomy.pouch!.first * 3; i++) expect(b[i]).toBe(a[i])
    expect(withPouch.mesh.geometry.getAttribute('position').count - plain.mesh.geometry.getAttribute('position').count).toBe(withPouch.anatomy.pouch!.count)
    plain.pose({ ...defaultPose(), pouch: 1 })     // and the pose is ignored
  })
  it('is painted as its own part, in free space of the atlas', () => {
    const r = REGIONS.pouch
    for (const [name, o] of Object.entries(REGIONS)) {
      if (name === 'pouch') continue
      const apart = o.x + o.w <= r.x || r.x + r.w <= o.x || o.y + o.h <= r.y || r.y + r.h <= o.y
      expect(apart, name).toBe(true)
    }
    const detail = detailWith(POUCH)
    const layers = [...detail.plumage, { kind: 'fill' as const, where: { part: 'pouch' as const }, color: '#f0a020' }]
    const px = paintAtlas({ code: 'testduck', detail, layers, profile: createProfile(detail.profile) })
    const [red, green, blue] = regionStats(px, 'pouch', [0, 1], [0, 1]).rgb
    expect(red).toBeGreaterThan(0.9)
    expect(green).toBeCloseTo(0xa0 / 255, 1)
    expect(blue).toBeLessThan(0.2)
  })
  it('is refused out of order, or fuller slack than full', () => {
    const bad = (pouch: [number, number, number][]) => detailSchema.safeParse(detailWith(pouch)).success
    expect(bad(POUCH)).toBe(true)
    expect(bad([[0, 0.01, 0.02], [0.5, 0.01, 0.02], [0.4, 0.01, 0.02]])).toBe(false)
    expect(bad([[0, 0.01, 0.02], [0.5, 0.03, 0.02], [0.9, 0.01, 0.02]])).toBe(false)
    expect(bad([[0, 0.01, 0.02], [0.9, 0.01, 0.02]])).toBe(false)
  })
})
