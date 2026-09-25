import * as THREE from 'three'
import { SPECIES, getSpec, hasSpec } from './index'
import { createBirdModel } from '../factory'
import { buildDetailedBird } from '../detail/build'
import { measure } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { worstFold } from '../detail/loft'
import { DEFAULT_STEP } from '../detail/legs'
import { defaultPose } from '../model'
import { loadCatalog } from '../../catalog'
import { loadLocation } from '../../location'
import { BEHAVIORS } from '../../behavior'
import { speciesTraits } from '../spawn'
import { makeRng } from '../../catalog/rng'

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
  it('every detailed species keeps its stance foot planted at its own step length (too long a step slides the foot)', () => {
    for (const spec of Object.values(SPECIES)) {
      if (!spec.detail) continue
      const m = buildDetailedBird(spec)
      const toes = m.mesh.skeleton.bones.find(b => b.name === 'toesR')!
      const stride = 2 * (spec.detail.stepLength ?? DEFAULT_STEP) * (m.layout.tibia + m.layout.tarsus)
      const xs: number[] = []
      // built standing, the walk starts from the neutral phase: the right foot's whole stance is 0.2 to 0.8 of a stride
      for (const f of [0.22, 0.3, 0.4, 0.5, 0.58, 0.68, 0.78]) {
        const d = f * stride
        m.group.position.x = d
        m.pose({ ...defaultPose(), strideDistance: d, gait: 1 })
        m.group.updateMatrixWorld(true)
        xs.push(toes.getWorldPosition(new THREE.Vector3()).x)
      }
      expect(Math.max(...xs) - Math.min(...xs), spec.code).toBeLessThan(1e-4)
    }
  })
  it('does not take Object prototype names for species codes', () => {
    for (const code of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(hasSpec(code), code).toBe(false)
      expect(() => getSpec(code), code).toThrow(/No species spec/)
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

describe('detailed birds move smoothly under their cast behavior', () => {
  // Each detailed species in the lake's cast, fed by its own behavior for a minute at 60 fps on a flat patch and
  // posed every frame as the game does. The fastest intended motions (a plover's dab, a wader's strike) turn a bone
  // about 0.5-0.6 rad in a frame; a snap (a phase reset, a one-frame strike) turns it 1 rad or more.
  const patch = { kind: 'polygon' as const, points: [[0, 0], [6, 0], [6, 2.5], [0, 2.5]] as [number, number][] }
  const seen = new Set<string>()
  for (const entry of loadLocation().cast) {
    const spec = getSpec(entry.species)
    if (!spec.detail || seen.has(spec.code) || !(entry.behavior in BEHAVIORS)) continue
    seen.add(spec.code)
    it(`${spec.code} (${entry.behavior}): no bone turns more than 0.7 rad in a frame`, () => {
      const m = buildDetailedBird(spec)
      const bones = ['body', 'neck', 'neckMid', 'head'].map(n => m.mesh.skeleton.bones.find(b => b.name === n)!)
      const c = BEHAVIORS[entry.behavior as keyof typeof BEHAVIORS]({
        zone: patch, rng: makeRng(3), wind: () => ({ dirX: 0, dirZ: 0, effective: 0.3 }), ground: () => 0,
        group: { targetX: 3, targetZ: 1.25, retargetAt: 0 }, ...speciesTraits(spec.code),
      }, 3, 1.25)
      const pose = defaultPose()
      let prev: number[] | null = null, worst = 0
      for (let i = 0; i < 60 * 60; i++) {
        c.update(1 / 60, pose)
        m.pose(pose)
        const now = bones.map(b => b.rotation.z)
        if (prev) worst = Math.max(worst, ...now.map((v, k) => Math.abs(v - prev![k]!)))
        prev = now
      }
      expect(worst).toBeLessThan(0.7)
    })
  }
})
