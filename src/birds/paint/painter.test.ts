import * as THREE from 'three'
import { paintAtlas, regionStats, partFrames, materialFor } from './painter'
import { ATLAS_SIZE } from './atlas'
import { createProfile } from '../detail/profile'
import { TEST_DETAIL, TEST_SPEC } from '../detail/fixture'
import type { Layer } from '../detail/spec'

const profile = createProfile(TEST_DETAIL.profile)
const paint = (layers: Layer[]) => paintAtlas({ code: 'testbird', detail: TEST_DETAIL, layers, profile })

describe('paintAtlas', () => {
  it('paints only the part a layer names', () => {
    const px = paint([{ kind: 'fill', where: { part: 'bill' }, color: '#ffffff' }])
    expect(px.length).toBe(ATLAS_SIZE * ATLAS_SIZE * 4)
    expect(regionStats(px, 'bill', [0, 1], [0, 1]).mean).toBeCloseTo(1, 2)
    expect(regionStats(px, 'tail', [0, 1], [0, 1]).mean).toBeCloseTo(0.5, 1)      // untouched: the base grey
  })
  it('is deterministic', () => {
    const layers: Layer[] = [{ kind: 'spots', where: { part: 'wingFold' }, color: '#ffffff', size: 2, spacing: 5 }]
    expect(Buffer.from(paint(layers)).equals(Buffer.from(paint(layers)))).toBe(true)     // toEqual on a million bytes is slow
  })
  it('keeps pattern sizes in millimetres: spots cover the same share of the thin neck as of the wide belly', () => {
    const px = paint([
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'billBase' }, color: '#000000' },
      { kind: 'spots', where: { part: 'skin', from: 'rear', to: 'billBase' }, color: '#ffffff', size: 3, spacing: 6, jitter: 0.3 },
    ])
    const neck = regionStats(px, 'skin', [profile.uOf('neckMid'), profile.uOf('nape')], [0, 1]).mean
    const body = regionStats(px, 'skin', [profile.uOf('hip'), profile.uOf('flank')], [0, 1]).mean
    expect(neck).toBeGreaterThan(0.1)
    expect(Math.abs(neck - body) / body).toBeLessThan(0.3)
  })
  it('paints the eye: dark pupil, a catchlight', () => {
    const px = paint([])
    expect(regionStats(px, 'eye', [0.45, 0.55], [0.45, 0.55]).mean).toBeLessThan(0.1)
    expect(regionStats(px, 'eye', [0.3, 0.42], [0.58, 0.7]).mean).toBeGreaterThan(0.8)
  })
  it('gives every part a frame in millimetres', () => {
    const f = partFrames(TEST_DETAIL, profile)
    expect(f.skin.lengthMm).toBeCloseTo(profile.length * 1000, 6)
    expect(f.bill.lengthMm).toBeCloseTo(TEST_DETAIL.measurements.culmen * 1000, 6)
    expect(f.wingFold.lengthMm).toBeCloseTo(TEST_DETAIL.measurements.wingChord * 1000, 6)
    expect(f.skin.widthMm(profile.uOf('hip'))).toBeGreaterThan(f.skin.widthMm(profile.uOf('nape')))
  })
})

describe('materialFor', () => {
  it('paints once per species and plumage', () => {
    expect(materialFor(TEST_SPEC)).toBe(materialFor(TEST_SPEC))
    expect((materialFor(TEST_SPEC).map as THREE.DataTexture).image.width).toBe(ATLAS_SIZE)
  })
})
