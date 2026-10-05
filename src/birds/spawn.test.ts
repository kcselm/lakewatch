import { expandCast, flockEntries, spawnCast, speciesTraits, perchesOf, DEFAULT_FLOCK_EVERY, type SpawnEvents } from './spawn'
import { makeRng } from '../catalog/rng'
import { BirdRegistry, type BirdInstance } from './registry'
import { Wind } from '../world/wind'
import { RippleBuffer } from '../world/ripples'
import type { Location } from '../location/schema'
import { STYLES } from '../behavior/probe'
import { MALLARD } from '../behavior/dabbler'
import { companyOf } from '../behavior/swim'
import { heronFor } from '../behavior/heron'
import { BEHAVIORS, type BehaviorController } from '../behavior'

const loc = (cast: Location['cast']): Location => ({
  id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 0 }, wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
  zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] }, snag: { kind: 'point', position: [1, 2, 3] }, sky: { kind: 'lane', from: [0, 0, 0], to: [1, 0, 0], altitude: [1, 2] } },
  cast, ambience: [],
})

describe('expandCast', () => {
  it('expands count into individuals', () => {
    const out = expandCast(loc([{ species: 'y00475', behavior: 'swim', zone: 'w', count: 3 }]), makeRng(1))
    expect(out).toHaveLength(3)
    expect(out.every(b => b.species === 'y00475' && b.variant === undefined)).toBe(true)
  })
  it("assigns every one of the species' versions for mixed plumage", () => {
    const out = expandCast(loc([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 20, plumage: 'mixed' }]), makeRng(2))
    const variants = new Set(out.map(b => b.variant))
    expect(variants).toEqual(new Set(['male', 'maleMoult', 'female']))
  })
  it('uses the named variant when plumage is not mixed', () => {
    const out = expandCast(loc([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 2, plumage: 'female' }]), makeRng(3))
    expect(out.every(b => b.variant === 'female')).toBe(true)
  })
  it('assigns exactly the counts a record gives, each version in a different spot from seed to seed', () => {
    const orders = new Set<string>()
    for (let seed = 1; seed <= 20; seed++) {
      const out = expandCast(loc([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 4, plumage: { male: 1, female: 3 } }]), makeRng(seed))
      expect(out.map(b => b.variant).sort()).toEqual(['female', 'female', 'female', 'male'])
      orders.add(out.map(b => b.variant).join())
    }
    expect(orders.size).toBe(4)          // the drake has been first, second, third, and last
  })
  it('deals a flyover flock its versions from a record, a bird each (a detailed species: validateCast allows no other)', () => {
    const orders = new Set<string>()
    for (let seed = 1; seed <= 20; seed++) {
      const out = flockEntries(loc([{ species: 'mallar3', behavior: 'flyover', zone: 'sky', count: 3, plumage: { male: 1, female: 2 } }]), makeRng(seed))
      expect(out[0]!.variant).toBeUndefined()
      expect([...out[0]!.versions!].sort()).toEqual(['female', 'female', 'male'])
      orders.add(out[0]!.versions!.join())
    }
    expect(orders.size).toBe(3)
    // with one version, or none, there is nothing to deal
    expect(flockEntries(loc([{ species: 'mallar3', behavior: 'flyover', zone: 'sky', count: 3, plumage: 'female' }]), makeRng(7))[0]!.versions).toBeUndefined()
  })
  it('leaves flyover entries to flockEntries', () => {
    const l = loc([{ species: 'cangoo', behavior: 'flyover', zone: 'sky', count: 5 }])
    expect(expandCast(l, makeRng(4))).toEqual([])
    expect(flockEntries(l, makeRng(4))).toHaveLength(1)
  })
  it('gives each probe entry its own group key', () => {
    const out = expandCast(loc([
      { species: 'killde', behavior: 'probe', zone: 'w', count: 2 },
      { species: 'killde', behavior: 'probe', zone: 'w', count: 2 },
    ]), makeRng(5))
    expect(new Set(out.map(b => b.groupKey)).size).toBe(2)
  })
  it('expands perch and hover entries like any other individual', () => {
    const out = expandCast(loc([
      { species: 'belkin1', behavior: 'hover', zone: 'snag', count: 1, plumage: 'female' },
      { species: 'rewbla', behavior: 'perch', zone: 'snag', count: 2, plumage: 'male' },
    ]), makeRng(6))
    expect(out.map(b => [b.behavior, b.variant])).toEqual([['hover', 'female'], ['perch', 'male'], ['perch', 'male']])
  })
})

describe('speciesTraits', () => {
  it("hands a behavior the species' code, wingbeat, and foraging style", () => {
    expect(speciesTraits('killde')).toEqual({ species: 'killde', wingbeatHz: 7, foraging: 'plover' })
    expect(speciesTraits('leasan')).toEqual({ species: 'leasan', wingbeatHz: 9, foraging: 'sandpiper' })
    expect(speciesTraits('greyel').foraging).toBeUndefined()
    expect(speciesTraits('nosuchbird')).toEqual({ species: 'nosuchbird', wingbeatHz: 5 })
  })
})

describe('flockEntries', () => {
  it('returns one record per flyover entry with defaults filled in', () => {
    const out = flockEntries(loc([
      { species: 'cangoo', behavior: 'flyover', zone: 'sky', count: 14, everySeconds: [150, 360], formation: 'vee' },
      { species: 'mallar3', behavior: 'flyover', zone: 'sky', count: 6, plumage: 'female' },
      { species: 'y00475', behavior: 'swim', zone: 'w', count: 2 },
    ]), makeRng(1))
    expect(out).toEqual([
      { species: 'cangoo', variant: undefined, zone: 'sky', count: 14, everySeconds: [150, 360], formation: 'vee', groupKey: 'cast0' },
      { species: 'mallar3', variant: 'female', zone: 'sky', count: 6, everySeconds: DEFAULT_FLOCK_EVERY, formation: 'line', groupKey: 'cast1' },
    ])
  })
})

describe('spawnCast flocks', () => {
  // a short lane (40m) crossed at 14 m/s finishes in a few seconds, so the test doesn't need many steps
  const flockLoc: Location = {
    id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
    vantage: { position: [0, 1.6, 0], heading: 0 }, wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
    zones: { sky: { kind: 'lane', from: [-20, 0, -50], to: [20, 0, -50], altitude: [40, 50] } },
    cast: [{ species: 'cangoo', behavior: 'flyover', zone: 'sky', count: 3, everySeconds: [1, 2], formation: 'vee' }],
    ambience: [],
  }

  function makeDeps(seed: number, events?: SpawnEvents) {
    return {
      registry: new BirdRegistry(),
      wind: new Wind({ direction: 0, strength: 0.3, gustiness: 0.5, seed: 1 }),
      ground: () => 0,
      ripples: new RippleBuffer(),
      seed,
      events,
    }
  }

  /** Advance world.update(dt, wind) until `pred` is true or the guard trips. */
  function advanceUntil(world: ReturnType<typeof spawnCast>, wind: Wind, pred: () => boolean, guard = 5000): void {
    let steps = 0
    while (!pred() && steps < guard) {
      world.update(0.1, wind)
      steps++
    }
    if (steps >= guard) throw new Error('advanceUntil: guard tripped before predicate became true')
  }

  it('registers flock members while crossing, with a flyover behavior and an altitude inside the lane band, then removes them and hides the model', () => {
    const deps = makeDeps(5)
    const world = spawnCast(flockLoc, deps)
    expect(deps.registry.size).toBe(0)

    advanceUntil(world, deps.wind, () => deps.registry.size === 3)
    for (const b of deps.registry.all()) {
      expect(b.behavior).toBe('flyover')
      expect(b.species).toBe('cangoo')
      const p = b.model.group.localToWorld(b.model.center.clone())
      expect(p.y).toBeGreaterThanOrEqual(40)
      expect(p.y).toBeLessThanOrEqual(50)
    }
    const firstIds = deps.registry.all().map(b => b.id)
    const flockGroup = world.object.children.find(c => c.name.startsWith('flock:'))!

    advanceUntil(world, deps.wind, () => deps.registry.size === 0)
    for (const id of firstIds) expect(deps.registry.get(id)).toBeUndefined()
    expect(flockGroup.visible).toBe(false)

    advanceUntil(world, deps.wind, () => deps.registry.size === 3)
    const secondIds = deps.registry.all().map(b => b.id)
    expect(secondIds.every(id => !firstIds.includes(id))).toBe(true)
  })

  it('flies a detailed species as skinned birds: each member its own model and version, aimed at itself, and none registered while it waits', () => {
    const deps = makeDeps(5)
    const world = spawnCast({ ...flockLoc, cast: [{ species: 'mallar3', behavior: 'flyover', zone: 'sky', count: 3, everySeconds: [1, 2], plumage: { male: 1, female: 2 } }] }, deps)
    const flockGroup = world.object.children.find(c => c.name === 'flock:mallar3')!
    expect(flockGroup.visible).toBe(false)
    expect(deps.registry.size).toBe(0)
    advanceUntil(world, deps.wind, () => deps.registry.size === 3)
    expect(flockGroup.visible).toBe(true)
    const birds = deps.registry.all()
    expect(birds.map(b => b.variant).sort()).toEqual(['female', 'female', 'male'])
    for (const b of birds) {
      expect(b.behavior).toBe('flyover')
      // the model aimed at is the bird drawn: one of the flock's own, where the flock put it
      expect(b.model.group.parent).toBe(flockGroup)
      expect(b.model.group.name).toBe(`bird:mallar3:${b.variant}`)
      expect(b.position.y).toBeGreaterThanOrEqual(39)
      expect(b.position.y).toBeLessThanOrEqual(51)
    }
    expect(new Set(birds.map(b => b.model.group)).size).toBe(3)
    advanceUntil(world, deps.wind, () => deps.registry.size === 0)
    expect(flockGroup.visible).toBe(false)
  })

  it('fires flockStart once, then one or more flockMove, then flockEnd once, all with the same key', () => {
    const calls: string[] = []
    let key: string | undefined
    const events: SpawnEvents = {
      flockStart(k, species) { calls.push('flockStart'); key = k; expect(species).toBe('cangoo') },
      flockMove(k) { calls.push('flockMove'); expect(k).toBe(key) },
      flockEnd(k) { calls.push('flockEnd'); expect(k).toBe(key) },
    }
    const deps = makeDeps(6, events)
    const world = spawnCast(flockLoc, deps)

    advanceUntil(world, deps.wind, () => calls.includes('flockEnd'))

    expect(calls[0]).toBe('flockStart')
    expect(calls.filter(c => c === 'flockStart')).toHaveLength(1)
    expect(calls.filter(c => c === 'flockMove').length).toBeGreaterThan(0)
    expect(calls.filter(c => c === 'flockEnd')).toHaveLength(1)
    expect(calls[calls.length - 1]).toBe('flockEnd')
    expect(key).toBe('cast0')
  })
})

describe('spawnCast swimmers', () => {
  const pond = (cast: Location['cast'], w = 20, d = 12): Location => ({ ...loc(cast), zones: { w: { kind: 'polygon', points: [[0, 0], [w, 0], [w, d], [0, d]] } } })
  const deps = (seed: number) => ({ registry: new BirdRegistry(), wind: new Wind({ direction: 0, strength: 0.3, gustiness: 0.5, seed: 1 }), ground: () => -1, ripples: new RippleBuffer(), seed })
  /** metres a swimmer of this species keeps from any bird not of its flock: its style's `other` spacing */
  const otherOf = (code: string) => companyOf(speciesTraits(code).foraging, code).spacing.other
  /**
   * The closest any two birds on the water come, less the spacing they keep: a flock's own between flockmates, else
   * the other (a Mallard's, which the Coot shares). With `zoneOf` (each species' zone), only birds of different zones
   * are measured, each pair against the larger of the two birds' own `other` spacings. A bird all the way under the
   * water (hidden) is left out: it is no one's neighbour until it comes up.
   */
  function shortestGap(birds: readonly BirdInstance[], zoneOf?: Readonly<Record<string, string>>): number {
    const up = birds.filter(b => b.model.group.visible)
    let gap = Infinity
    for (let a = 0; a < up.length; a++) {
      for (let c = a + 1; c < up.length; c++) {
        const A = up[a]!, C = up[c]!
        if (zoneOf && zoneOf[A.species] === zoneOf[C.species]) continue
        const keep = zoneOf ? Math.max(otherOf(A.species), otherOf(C.species))
          : A.species === C.species ? MALLARD.spacing.flock : MALLARD.spacing.other
        gap = Math.min(gap, Math.hypot(A.position.x - C.position.x, A.position.z - C.position.z) - keep)
      }
    }
    return gap
  }
  it('starts each swimming flock formed round a point in its zone, every bird clear of the others', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const d = deps(seed)
      const world = spawnCast(pond([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 4 }, { species: 'y00475', behavior: 'swim', zone: 'w', count: 6 }]), d)
      world.update(1e-6, d.wind)
      for (const code of ['mallar3', 'y00475']) {
        const flock = d.registry.bySpecies(code).map(b => b.position)
        for (const a of flock) for (const b of flock) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeLessThanOrEqual(2 * MALLARD.flock.radius + 1e-9)
      }
      expect(shortestGap(d.registry.all())).toBeGreaterThanOrEqual(0)
    }
  })
  it("lets every swimmer see the others: crowded into a small pond, none comes inside another's spacing", () => {
    const d = deps(4)
    const world = spawnCast(pond([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 4 }, { species: 'y00475', behavior: 'swim', zone: 'w', count: 6 }], 6, 4), d)
    let gap = Infinity
    for (let i = 0; i < 60 * 30; i++) { world.update(1 / 30, d.wind); gap = Math.min(gap, shortestGap(d.registry.all())) }
    expect(gap).toBeGreaterThan(-0.01)
  })
  it('keeps every swimmer clear of those in other zones: flocks in two overlapping zones meet, and none swims into another', () => {
    // Gadwalls in one zone; Coots and a grebe, which keeps 1.5 m, in another that overlaps it by 5 of its 8 m, as the
    // lake's near and open water overlap. The flocks meet within seconds; while each swimmer saw only its own zone's,
    // they swam through each other.
    const cast: Location['cast'] = [
      { species: 'gadwal', behavior: 'swim', zone: 'a', count: 3 },
      { species: 'y00475', behavior: 'swim', zone: 'b', count: 6 },
      { species: 'pibgre', behavior: 'swim', zone: 'b', count: 1 },
    ]
    const l: Location = {
      ...loc(cast),
      zones: {
        a: { kind: 'polygon', points: [[0, 0], [8, 0], [8, 5], [0, 5]] },
        b: { kind: 'polygon', points: [[3, 0], [11, 0], [11, 5], [3, 5]] },
      },
    }
    const zoneOf = Object.fromEntries(cast.map(e => [e.species, e.zone]))
    for (const seed of [1, 2]) {
      const d = deps(seed)
      const world = spawnCast(l, d)
      world.update(1e-6, d.wind)
      let gap = shortestGap(d.registry.all(), zoneOf)
      for (let i = 0; i < 120 * 30; i++) { world.update(1 / 30, d.wind); gap = Math.min(gap, shortestGap(d.registry.all(), zoneOf)) }
      expect(gap, `seed ${seed}`).toBeGreaterThan(-0.01)
    }
  }, 60_000)   // two seeds x 120 s of ten swimmers: about 6 s alone, and a busy full run can take three times as long
})

describe('spawnCast herons', () => {
  const shallows: Location = {
    ...loc([{ species: 'grbher3', behavior: 'wade', zone: 'w', count: 2 }, { species: 'greegr', behavior: 'wade', zone: 'w', count: 3 }]),
    zones: { w: { kind: 'polygon', points: [[0, 0], [50, 0], [50, 4], [0, 4]] } },
  }
  const deps = (seed: number) => ({ registry: new BirdRegistry(), wind: new Wind({ direction: 0, strength: 0.3, gustiness: 0.5, seed: 1 }), ground: () => -0.1, ripples: new RippleBuffer(), seed })
  /** the closest any two herons come, less what they keep: their own species' spacing, or the larger of two species' */
  function shortestGap(birds: readonly BirdInstance[]): number {
    let gap = Infinity
    for (let a = 0; a < birds.length; a++) for (let c = a + 1; c < birds.length; c++) {
      const A = birds[a]!, C = birds[c]!
      const keep = A.species === C.species ? heronFor(A.species).spacing.same
        : Math.max(heronFor(A.species).spacing.other, heronFor(C.species).spacing.other)
      gap = Math.min(gap, Math.hypot(A.position.x - C.position.x, A.position.z - C.position.z) - keep)
    }
    return gap
  }
  it('starts every heron clear of the others, and lets each see them all, whatever its species', () => {
    for (let seed = 1; seed <= 3; seed++) {
      const d = deps(seed)
      const world = spawnCast(shallows, d)
      world.update(1e-6, d.wind)
      expect(d.registry.all()).toHaveLength(5)
      let gap = shortestGap(d.registry.all())
      expect(gap, `seed ${seed}`).toBeGreaterThanOrEqual(0)
      for (let i = 0; i < 600 * 10; i++) { world.update(1 / 10, d.wind); gap = Math.min(gap, shortestGap(d.registry.all())) }
      expect(gap, `seed ${seed}`).toBeGreaterThan(-1e-6)
    }
  }, 60_000)
  it("keeps a species' own spacing between its herons when they come from different cast entries", () => {
    // a shelf 30 m long: room for two Great Blue Herons 10 m apart wherever the first starts, where kept only the 3 m
    // between species they would often start closer
    const split: Location = {
      ...loc([
        { species: 'grbher3', behavior: 'wade', zone: 'w', count: 1, plumage: { adult: 1 } },
        { species: 'grbher3', behavior: 'wade', zone: 'w', count: 1, plumage: { juvenile: 1 } },
      ]),
      zones: { w: { kind: 'polygon', points: [[0, 0], [30, 0], [30, 4], [0, 4]] } },
    }
    for (let seed = 1; seed <= 5; seed++) {
      const d = deps(seed)
      const world = spawnCast(split, d)
      world.update(1e-6, d.wind)
      let gap = shortestGap(d.registry.all())
      for (let i = 0; i < 600 * 10; i++) { world.update(1 / 10, d.wind); gap = Math.min(gap, shortestGap(d.registry.all())) }
      expect(gap, `seed ${seed}`).toBeGreaterThan(-1e-6)
    }
  }, 60_000)
})

describe('spawnCast divers', () => {
  it('hides a bird while it is all the way under the water, and shows it again when it comes up', () => {
    // a stand-in swimmer that dives when told to
    const real = BEHAVIORS.swim
    let under = false
    BEHAVIORS.swim = (_ctx, x, z): BehaviorController => ({ name: 'swim', state: 'x', x, y: 0, z, heading: 0, get submerged() { return under }, update() {} })
    try {
      const deps = { registry: new BirdRegistry(), wind: new Wind({ direction: 0, strength: 0.3, gustiness: 0.5, seed: 1 }), ground: () => -1, ripples: new RippleBuffer(), seed: 1 }
      const world = spawnCast(loc([{ species: 'pibgre', behavior: 'swim', zone: 'w', count: 1 }]), deps)
      const bird = deps.registry.all()[0]!
      world.update(1 / 30, deps.wind)
      expect(bird.model.group.visible).toBe(true)
      under = true
      world.update(1 / 30, deps.wind)
      expect(bird.model.group.visible).toBe(false)
      under = false
      world.update(1 / 30, deps.wind)
      expect(bird.model.group.visible).toBe(true)
    } finally {
      BEHAVIORS.swim = real
    }
  })
})

describe('spawnCast perches', () => {
  const perchLoc = (behavior: 'hover' = 'hover'): Location => ({
    ...loc([{ species: 'belkin1', behavior, zone: 'perches', count: 1, plumage: 'female' }]),
    zones: {
      perches: {
        kind: 'perches', perches: [
          { name: 'snag', on: 'snag', position: [23.7, -48], height: 4.1, radius: 0.05, facing: 180 },
          { name: 'near', on: 'branch', position: [-27, -17], height: 2.6, radius: 0.018, facing: 33 },
        ],
      },
    },
  })
  const deps = () => ({ registry: new BirdRegistry(), wind: new Wind({ direction: 0, strength: 0.3, gustiness: 0.5, seed: 1 }), ground: () => -1, ripples: new RippleBuffer(), seed: 1 })

  it('turns each perch into a world point and the heading a bird on it faces', () => {
    const zone = perchLoc().zones['perches']
    if (zone?.kind !== 'perches') throw new Error('perches')
    const out = perchesOf(zone)
    expect(out.map(p => [p.name, p.position, p.radius])).toEqual([['snag', [23.7, 4.1, -48], 0.05], ['near', [-27, 2.6, -17], 0.018]])
    // a heading is 0 toward +x and counter-clockwise from above; a bearing 0 toward -z and clockwise
    expect(Math.cos(out[0]!.heading)).toBeCloseTo(0, 9)       // facing 180: toward +z
    expect(-Math.sin(out[0]!.heading)).toBeCloseTo(1, 9)
    expect(Math.cos(out[1]!.heading)).toBeCloseTo(Math.sin(33 * Math.PI / 180), 9)
    expect(-Math.sin(out[1]!.heading)).toBeCloseTo(-Math.cos(33 * Math.PI / 180), 9)
  })
  it('hands the bird the whole list, and the first perch as the one it starts on', () => {
    const real = BEHAVIORS.hover
    const seen: unknown[] = []
    BEHAVIORS.hover = (ctx, x, z): BehaviorController => {
      seen.push(ctx.perches, ctx.perch, [x, z])
      return { name: 'hover', state: 'perch', x, y: 0, z, heading: 0, update() {} }
    }
    try {
      spawnCast(perchLoc(), deps())
    } finally {
      BEHAVIORS.hover = real
    }
    const zone = perchLoc().zones['perches']
    if (zone?.kind !== 'perches') throw new Error('perches')
    expect(seen).toEqual([perchesOf(zone), [23.7, 4.1, -48], [23.7, -48]])
  })
  it("keeps today's hover on the first perch", () => {
    const d = deps()
    const world = spawnCast(perchLoc(), d)
    world.update(1 / 30, d.wind)
    const bird = d.registry.all()[0]!
    expect(bird.model.group.position.toArray()).toEqual([23.7, 4.1, -48])
  })
})

describe('spawnCast rings', () => {
  it("hands a ring's size on to the ripple buffer: a dowitcher's bill makes a small ring", () => {
    const l: Location = { ...loc([{ species: 'lobdow', behavior: 'probe', zone: 'w', count: 1 }]), zones: { w: { kind: 'polygon', points: [[0, 0], [4, 0], [4, 4], [0, 4]] } } }
    const wind = new Wind({ direction: 0, strength: 0.3, gustiness: 0.5, seed: 1 })
    const ripples = new RippleBuffer()
    const world = spawnCast(l, { registry: new BirdRegistry(), wind, ground: () => -0.045, ripples, seed: 1 })
    for (let i = 0; i < 30 * 30 && ripples.rings.length === 0; i++) world.update(1 / 30, wind)
    expect(ripples.rings.map(r => r.size)).toEqual([STYLES.dowitcher.ripple.size])
  })
})
