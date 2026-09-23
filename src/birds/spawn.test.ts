import { expandCast, flockEntries, spawnCast, DEFAULT_FLOCK_EVERY, type SpawnEvents } from './spawn'
import { makeRng } from '../catalog/rng'
import { BirdRegistry } from './registry'
import { Wind } from '../world/wind'
import { RippleBuffer } from '../world/ripples'
import type { Location } from '../location/schema'

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
  it('assigns male and female variants for mixed plumage', () => {
    const out = expandCast(loc([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 20, plumage: 'mixed' }]), makeRng(2))
    const variants = new Set(out.map(b => b.variant))
    expect(variants).toEqual(new Set(['male', 'female']))
  })
  it('uses the named variant when plumage is not mixed', () => {
    const out = expandCast(loc([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 2, plumage: 'female' }]), makeRng(3))
    expect(out.every(b => b.variant === 'female')).toBe(true)
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
