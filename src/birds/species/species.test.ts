import * as THREE from 'three'
import { SPECIES, getSpec, hasSpec } from './index'
import { createBirdModel } from '../factory'
import { buildDetailedBird } from '../detail/build'
import { measure } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { worstFold, buildLoft } from '../detail/loft'
import { Mesher } from '../detail/mesher'
import { DEFAULT_STEP } from '../detail/legs'
import { NECK_BONES } from '../detail/rig'
import { defaultPose } from '../model'
import { loadCatalog } from '../../catalog'
import { loadLocation } from '../../location'
import { BEHAVIORS } from '../../behavior'
import { speciesTraits, perchesOf } from '../spawn'
import { makeRng } from '../../catalog/rng'
import { lakeHeightfield } from '../../world/heightfield'
import { terrainSurface } from '../../world/terrain'
import { createStemField, layoutStems } from '../../world/stems'

describe('species specs', () => {
  it('has a spec for every species the lake casts', () => {
    for (const entry of loadLocation().cast) expect(hasSpec(entry.species), entry.species).toBe(true)
  })
  it('has specs for the birds that arrive with flyover, perch, and kingfisher', () => {
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
  }, 60_000)   // every version of every species, the folded wings placed for each: about 20 s beside a full run
  it('every detailed species builds to its own measurements', () => {
    for (const spec of Object.values(SPECIES)) {
      const d = spec.detail
      if (!d) continue
      const r = measure(buildDetailedBird(spec))
      const m = d.measurements
      expect(Math.abs(r.length - m.length) / m.length, `${spec.code} length`).toBeLessThan(0.05)
      // a bird with no tail (a grebe's is a hidden tuft) keeps measurements.tail on record, but nothing is built to it
      const keys = d.tail.shape === 'none' ? (['culmen', 'billDepth', 'tarsus', 'wingChord'] as const) : (['culmen', 'billDepth', 'tarsus', 'wingChord', 'tail'] as const)
      for (const k of keys) {
        expect(Math.abs(r[k] - m[k]) / m[k], `${spec.code} ${k}`).toBeLessThan(0.02)
      }
      // an amphibious bird's legs are built standing, the knee forward under a deep belly, so less of the tibia shows
      // below the belly than measurements.tibia, which the builder lays along an upright tibia: within 8 mm
      if (d.amphibious) expect(Math.abs(r.tibia - m.tibia) * 1000, `${spec.code} tibia`).toBeLessThan(8)
      // a percher crouched on its perch, its intertarsal joint drawn up into its belly feathers, shows none (a
      // red-winged blackbird's: little of its legs shows when it crouches)
      else if (spec.posture === 'perched' && r.tibia === 0) continue
      else expect(Math.abs(r.tibia - m.tibia) / m.tibia, `${spec.code} tibia`).toBeLessThan(0.15)
    }
  })
  it('no detailed species creases its body: the spine never turns tighter than the body is deep', () => {
    for (const spec of Object.values(SPECIES)) {
      if (spec.detail) expect(worstFold(createProfile(spec.detail.profile), spec.detail.rig, spec.detail.rings), spec.code).toBe(0)
    }
  })
  it('every detailed species keeps its stance foot planted at its own step length (too long a step slides the foot)', () => {
    for (const spec of Object.values(SPECIES)) {
      // a swimmer's legs paddle and never walk, and a percher's grip its branch; an amphibious bird's walk on its feet,
      // afloat 0
      if (!spec.detail || spec.posture === 'perched' || (spec.posture === 'swimming' && !spec.detail.amphibious)) continue
      const m = buildDetailedBird(spec)
      const toes = m.mesh.skeleton.bones.find(b => b.name === 'toesR')!
      const stride = 2 * (spec.detail.stepLength ?? DEFAULT_STEP) * (m.layout.tibia + m.layout.tarsus)
      const xs: number[] = []
      // built standing, the walk starts from the neutral phase: the right foot's whole stance is 0.2 to 0.8 of a stride
      for (const f of [0.22, 0.3, 0.4, 0.5, 0.58, 0.68, 0.78]) {
        const d = f * stride
        m.group.position.x = d
        m.pose({ ...defaultPose(), strideDistance: d, gait: 1, afloat: 0 })
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
  it('mallard has its three late-September versions: the drake, the drake still moulting, and the female', () => {
    expect(Object.keys(getSpec('mallar3').variants).sort()).toEqual(['female', 'male', 'maleMoult'])
  })
  it('heron stands taller than it is long', () => {
    const h = getSpec('grbher3')
    expect(h.legs.length + h.neck.length).toBeGreaterThan(h.body.length)
  })
})

describe('Long-billed Dowitcher: the throat under its resting head', () => {
  // The front of the bird in its tracing photo (iNaturalist 199669733; see lobdow.ts), read off the photo's silhouette
  // at 0.145 mm per pixel with the hip at (760, 720): mm forward of the hip, at every mm of height from 10 mm below the
  // hip (the breast) to 41 mm above it (the chin, under the bill)
  const PHOTO_FRONT = [
    63.50, 64.05, 64.80, 65.25, 65.95, 66.10, 66.40, 66.80, 67.10, 67.85, 68.40, 68.85, 69.30,
    69.85, 70.30, 70.60, 70.85, 71.60, 71.90, 72.20, 72.30, 72.45, 72.60, 72.75, 73.05, 73.05,
    73.20, 73.20, 73.05, 73.05, 73.20, 72.90, 72.75, 72.60, 72.45, 72.05, 71.75, 71.30, 70.75,
    70.15, 69.55, 68.85, 68.25, 67.55, 66.80, 66.10, 65.35, 64.50, 63.65, 63.35, 63.95, 65.65,
  ]
  it('follows the photo from the breast to the chin within 2 mm, without creasing', () => {
    const d = getSpec('lobdow').detail!
    const profile = createProfile(d.profile)
    const m = new Mesher()
    const loft = buildLoft(m, profile, d.rig)
    PHOTO_FRONT.forEach((x, k) => {
      const span = m.spanAtHeight((k - 10) / 1000, loft.indexFirst, loft.indexCount)!
      expect(Math.abs(span[1] * 1000 - x), `${k - 10} mm above the hip`).toBeLessThan(2)
    })
    expect(worstFold(profile, d.rig)).toBe(0)
  })
})

/** the lake's reed bed for a blackbird: its zone, stems, the singer's post, and a start in the bed */
function reedBed(post: string | undefined) {
  const lake = loadLocation()
  const hf = lakeHeightfield(7), surface = terrainSurface(hf)
  const p = post ? lake.zones[post] : undefined
  return {
    ctx: {
      zone: lake.zones['reeds']!, ground: (x: number, z: number) => surface.sample(x, z),
      stems: createStemField(layoutStems({ heightfield: hf, ground: (x, z) => surface.sample(x, z) })),
      variant: 'male', post: p?.kind === 'point' ? p.position : undefined, vantage: lake.vantage.position,
    },
    x: -8, z: -6,
  }
}

describe('detailed birds move smoothly under their cast behavior', () => {
  // Each detailed species in the lake's cast, fed by its own behavior for a minute at 60 fps on a flat patch and
  // posed every frame as the game does. The fastest intended motions (a plover's dab, a wader's strike) turn a bone
  // about 0.5-0.6 rad in a frame; a snap (a phase reset, a one-frame strike) turns it 1 rad or more. A bird that works
  // perches gets the lake's, over water everywhere, for long enough to plunge; under the water it is hidden, and comes
  // up already in its rising pose. A blackbird gets the lake's reed bed, its stems still (no wind steps them).
  const patch = { kind: 'polygon' as const, points: [[0, 0], [6, 0], [6, 2.5], [0, 2.5]] as [number, number][] }
  const lake = loadLocation()
  const seen = new Set<string>()
  for (const entry of lake.cast) {
    const spec = getSpec(entry.species)
    if (!spec.detail || seen.has(spec.code) || !(entry.behavior in BEHAVIORS)) continue
    seen.add(spec.code)
    const zone = lake.zones[entry.zone]
    const perches = zone?.kind === 'perches' ? { zone, perches: perchesOf(zone), ground: () => -1 } : {}
    const reeds = entry.behavior === 'blackbird' ? reedBed(entry.post) : undefined
    const seconds = zone?.kind === 'perches' ? 1200 : 60
    it(`${spec.code} (${entry.behavior}): no bone turns more than 0.7 rad in a frame`, () => {
      const m = buildDetailedBird(spec)
      // a chained neck turns at every joint; the spares of a neck of two joints never turn
      const bones = ['body', ...NECK_BONES, 'head'].map(n => m.mesh.skeleton.bones.find(b => b.name === n)!)
      const c = BEHAVIORS[entry.behavior as keyof typeof BEHAVIORS]({
        zone: patch, rng: makeRng(3), wind: () => ({ dirX: 0, dirZ: 0, effective: 0.3 }), ground: () => 0,
        group: { targetX: 3, targetZ: 1.25, retargetAt: 0 }, ...speciesTraits(spec.code), ...perches, ...reeds?.ctx,
      }, reeds?.x ?? 3, reeds?.z ?? 1.25)
      const pose = defaultPose()
      let prev: number[] | null = null, worst = 0
      for (let i = 0; i < seconds * 60; i++) {
        const hidden = c.submerged ?? false
        c.update(1 / 60, pose)
        m.pose(pose)
        const now = bones.map(b => b.rotation.z)
        if (prev && !hidden) worst = Math.max(worst, ...now.map((v, k) => Math.abs(v - prev![k]!)))
        prev = now
      }
      expect(worst).toBeLessThan(0.7)
    }, 60_000)
  }
})
