import { detailSchema, layersFor } from './spec'
import { parseSpeciesSpec } from '../spec'
import { TEST_DETAIL, TEST_SPEC } from './fixture'

describe('detailSchema', () => {
  it('accepts the test fixture', () => {
    expect(detailSchema.parse(TEST_DETAIL).profile.length).toBe(14)
  })
  it('rejects a rig label missing from the profile', () => {
    const bad = { ...TEST_DETAIL, rig: { ...TEST_DETAIL.rig, hip: 'knee' } }
    expect(() => detailSchema.parse(bad)).toThrow(/unknown station label: knee/)
  })
  it('requires occiput and eye stations', () => {
    const profile = TEST_DETAIL.profile.map(s => (s.label === 'occiput' ? { ...s, label: 'back' } : s))
    expect(() => detailSchema.parse({ ...TEST_DETAIL, profile })).toThrow(/label: occiput/)
  })
  it('rejects a layer region that names an unknown station', () => {
    const plumage = [{ kind: 'fill', where: { part: 'skin', from: 'rear', to: 'chin' }, color: '#ffffff' }]
    expect(() => detailSchema.parse({ ...TEST_DETAIL, plumage })).toThrow(/label: chin/)
  })
  it('rejects a stripe or ring anchored to an unknown station', () => {
    const plumage = [{ kind: 'ring', at: { at: 'ear', t: 0.4 }, radius: 3, width: 1, color: '#ffffff' }]
    expect(() => detailSchema.parse({ ...TEST_DETAIL, plumage })).toThrow(/label: ear/)
  })
  it('rejects non-positive sizes', () => {
    const measurements = { ...TEST_DETAIL.measurements, culmen: 0 }
    expect(() => detailSchema.parse({ ...TEST_DETAIL, measurements })).toThrow(/culmen/)
  })
  it('needs at least four stations', () => {
    expect(() => detailSchema.parse({ ...TEST_DETAIL, profile: TEST_DETAIL.profile.slice(0, 3) })).toThrow()
  })
})

describe('SpeciesSpec with a detail block', () => {
  it('rejects a detail variant the species does not have', () => {
    const detail = { ...TEST_DETAIL, variants: { juvenile: TEST_DETAIL.plumage } }
    expect(() => parseSpeciesSpec({ ...TEST_SPEC, detail })).toThrow(/detail variant juvenile/)
  })
  it('accepts a detail variant the species has', () => {
    const detail = { ...TEST_DETAIL, variants: { adult: TEST_DETAIL.plumage } }
    expect(() => parseSpeciesSpec({ ...TEST_SPEC, variants: { adult: {} }, detail })).not.toThrow()
  })
})

describe('layersFor', () => {
  it('uses the variant list when there is one, else the base plumage', () => {
    const own = [{ kind: 'fill' as const, where: { part: 'bill' as const }, color: '#ffffff' }]
    const d = { ...TEST_DETAIL, variants: { adult: own } }
    expect(layersFor(d, 'adult')).toBe(own)
    expect(layersFor(d, 'juvenile')).toBe(d.plumage)
    expect(layersFor(d)).toBe(d.plumage)
  })
})
