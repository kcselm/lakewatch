import { SPECIES, getSpec, hasSpec } from './index'
import { createBirdModel } from '../factory'
import { buildDetailedBird } from '../detail/build'
import { measure } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { worstFold } from '../detail/loft'
import { loadCatalog } from '../../catalog'
import { loadLocation } from '../../location'

describe('species specs', () => {
  it('has a spec for every species the lake casts', () => {
    for (const entry of loadLocation().cast) expect(hasSpec(entry.species), entry.species).toBe(true)
  })
  it('has specs for the birds that arrive with flyover, perch, and hover', () => {
    for (const code of ['cangoo', 'belkin1', 'rewbla', 'marwre']) expect(hasSpec(code), code).toBe(true)
  })
  it('every mark is a non-empty sentence fragment', () => {
    for (const spec of Object.values(SPECIES)) for (const [k, m] of Object.entries(spec.marks)) expect(m.length, `${spec.code}.${k}`).toBeGreaterThan(8)
  })
  it('every spec code exists in the catalog with the same common name', () => {
    const catalog = loadCatalog()
    for (const spec of Object.values(SPECIES)) {
      const bird = catalog.find(b => b.speciesCode === spec.code)
      expect(bird, spec.code).toBeDefined()
      expect(bird!.commonName).toBe(spec.commonName)
    }
  })
  it('every spec and variant builds without throwing', () => {
    for (const spec of Object.values(SPECIES)) {
      expect(() => createBirdModel(spec)).not.toThrow()
      for (const v of Object.keys(spec.variants)) expect(() => createBirdModel(spec, v)).not.toThrow()
    }
  })
  it('every detailed species builds to its own measurements', () => {
    for (const spec of Object.values(SPECIES)) {
      const d = spec.detail
      if (!d) continue
      const r = measure(buildDetailedBird(spec))
      const m = d.measurements
      expect(Math.abs(r.length - m.length) / m.length, `${spec.code} length`).toBeLessThan(0.05)
      for (const k of ['culmen', 'billDepth', 'tarsus', 'wingChord', 'tail'] as const) {
        expect(Math.abs(r[k] - m[k]) / m[k], `${spec.code} ${k}`).toBeLessThan(0.02)
      }
      expect(Math.abs(r.tibia - m.tibia) / m.tibia, `${spec.code} tibia`).toBeLessThan(0.15)
    }
  })
  it('no detailed species creases its body: the spine never turns tighter than the body is deep', () => {
    for (const spec of Object.values(SPECIES)) {
      if (spec.detail) expect(worstFold(createProfile(spec.detail.profile), spec.detail.rig), spec.code).toBe(0)
    }
  })
  it('mallard has male and female variants', () => {
    expect(Object.keys(getSpec('mallar3').variants).sort()).toEqual(['female', 'male'])
  })
  it('heron stands taller than it is long', () => {
    const h = getSpec('grbher3')
    expect(h.legs.length + h.neck.length).toBeGreaterThan(h.body.length)
  })
})
