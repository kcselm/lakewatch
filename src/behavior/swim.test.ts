import { createSwim, companyOf } from './swim'
import { MALLARD } from './dabbler'
import { AVOID, DRIFT, startSpot, createSwimmer } from './swimmer'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon, randomPointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController, FlockGroup } from './types'
import type { Foraging } from '../birds/spec'

// Every swimmer body made, in order, so a test can watch the steps a style hands its body and what the body makes of
// them. The bodies are the real ones.
const made = vi.hoisted(() => [] as ReturnType<typeof import('./swimmer').createSwimmer>[])
vi.mock('./swimmer', async importOriginal => {
  const real = await importOriginal<typeof import('./swimmer')>()
  return { ...real, createSwimmer: (...a: Parameters<typeof real.createSwimmer>) => { const b = real.createSwimmer(...a); made.push(b); return b } }
})

type Pt = [number, number]
const zone = { kind: 'polygon' as const, points: [[-10, -10], [10, -10], [10, 10], [-10, 10]] as Pt[] }
const WIND = { dirX: 1, dirZ: 0, effective: 0.5 }
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => WIND, ground: () => -2, ...more,
})

interface Bird { seed: number; x: number; z: number; group?: FlockGroup; foraging?: Foraging; species?: string }
/** Swimmers sharing a zone, each seeing all the others, as the spawner wires them. */
function crowd(birds: Bird[], area: Pt[] = zone.points): BehaviorController[] {
  const list: BehaviorController[] = []
  for (const b of birds) {
    list.push(createSwim(ctx(b.seed, { zone: { kind: 'polygon', points: area }, group: b.group, foraging: b.foraging, species: b.species, neighbours: () => list }), b.x, b.z))
  }
  return list
}
/** Flocks started as the spawner starts them: each bird near its flock's target, clear of the birds placed before it. */
function formed(area: Pt[], flocks: { group: FlockGroup; count: number; foraging?: Foraging; species?: string }[], seed: number): BehaviorController[] {
  const rng = makeRng(seed), list: BehaviorController[] = [], zone = { kind: 'polygon' as const, points: area }
  for (const f of flocks) {
    for (let n = 0; n < f.count; n++) {
      const [x, z] = startSpot(zone, rng, f.group, companyOf(f.foraging, f.species), list)
      list.push(createSwim(ctx(seed * 100 + list.length, { zone, group: f.group, foraging: f.foraging, species: f.species, neighbours: () => list }), x, z))
    }
  }
  return list
}
/** Each pair's distance less the spacing it must keep: a flock's own between flockmates, else the smaller of the two. */
function pairGaps(birds: BehaviorController[]): number[] {
  const out: number[] = []
  for (let a = 0; a < birds.length; a++) {
    for (let c = a + 1; c < birds.length; c++) {
      const A = birds[a]!, C = birds[c]!
      const keep = A.group === C.group ? companyOf(undefined, undefined).spacing.flock : Math.min(A.spacing!, C.spacing!)
      out.push(Math.hypot(A.x - C.x, A.z - C.z) - keep)
    }
  }
  return out
}
const shortestGap = (birds: BehaviorController[]) => Math.min(...pairGaps(birds))
const run = (birds: BehaviorController[], seconds: number, each?: (frame: number) => void) => {
  const poses = birds.map(() => defaultPose())
  for (let i = 0; i < seconds * 30; i++) {
    birds.forEach((b, k) => b.update(1 / 30, poses[k]!))
    each?.(i)
  }
}
/** The most a dabbler moves in a frame: its cruise, plus paddling away from a neighbour, plus the wind. */
const PACE = (MALLARD.cruise.speed + AVOID + DRIFT * WIND.effective) / 30 + 1e-9

describe('swim', () => {
  it('swims as a dabbler when the species has no style', () => {
    const trace = (c: BehaviorController) => {
      const out: string[] = []
      run([c], 60, i => { if (i % 30 === 0) out.push(`${c.state} ${c.x.toFixed(6)} ${c.z.toFixed(6)}`) })
      return out
    }
    expect(trace(createSwim(ctx(1), 0, 0))).toEqual(trace(createSwim(ctx(1, { foraging: 'dabbler' }), 0, 0)))
  })
  it('stays in its zone, on the water, and no frame moves it further than its pace', () => {
    // two flocks of four crowded into a patch 6 m by 4 m, so they keep meeting each other and the edge
    const patch: Pt[] = [[0, 0], [6, 0], [6, 4], [0, 4]]
    for (let seed = 1; seed <= 3; seed++) {
      const rng = makeRng(seed), g1 = { targetX: 1.5, targetZ: 2, retargetAt: 0 }, g2 = { targetX: 4.5, targetZ: 2, retargetAt: 0 }
      const birds = crowd(Array.from({ length: 8 }, (_, k) => ({ seed: seed * 100 + k, x: 0.2 + rng() * 5.6, z: 0.2 + rng() * 3.6, group: k < 4 ? g1 : g2 })), patch)
      let last = birds.map(b => [b.x, b.z])
      run(birds, 120, i => {
        birds.forEach((b, k) => {
          if (!pointInPolygon(b.x, b.z, patch) || b.y !== 0) expect.fail(`seed ${seed}, bird ${k}, frame ${i}: at ${b.x}, ${b.y}, ${b.z}`)
          const moved = Math.hypot(b.x - last[k]![0]!, b.z - last[k]![1]!)
          if (moved > PACE) expect.fail(`seed ${seed}, bird ${k}, frame ${i}: moved ${moved.toFixed(4)} m`)
        })
        last = birds.map(b => [b.x, b.z])
      })
    }
  })
  it('keeps its distance: started apart as the spawner starts them, no two swimmers come closer than the smaller of their spacings', () => {
    // two flocks of five whose patches overlap, in a pond 8 m by 5 m; the tolerance is 1 cm
    const patch: Pt[] = [[0, 0], [8, 0], [8, 5], [0, 5]]
    let worst = Infinity
    for (let seed = 1; seed <= 3; seed++) {
      const birds = formed(patch, [{ group: { targetX: 2, targetZ: 2.5, retargetAt: 60 }, count: 5 }, { group: { targetX: 6, targetZ: 2.5, retargetAt: 60 }, count: 5 }], seed)
      run(birds, 180, () => { worst = Math.min(worst, shortestGap(birds)) })
    }
    expect(worst).toBeGreaterThan(-0.01)
  })
  it('parts swimmers started too close: a pair inside its spacing never closes further, and all are clear within 30 s', () => {
    const patch: Pt[] = [[0, 0], [8, 0], [8, 5], [0, 5]]
    for (let seed = 1; seed <= 3; seed++) {
      const rng = makeRng(seed), g1 = { targetX: 2, targetZ: 2.5, retargetAt: 0 }, g2 = { targetX: 6, targetZ: 2.5, retargetAt: 0 }
      const birds = crowd(Array.from({ length: 10 }, (_, k) => ({ seed: seed * 100 + k, x: 0.2 + rng() * 7.6, z: 0.2 + rng() * 4.6, group: k < 5 ? g1 : g2 })), patch)
      let gaps = pairGaps(birds), late = Infinity
      run(birds, 60, i => {
        const now = pairGaps(birds)
        now.forEach((g, p) => { if (g < -0.01 && g < gaps[p]! - 1e-9) expect.fail(`seed ${seed}, frame ${i}: a pair ${-g} m inside closed further`) })
        if (i >= 30 * 30) late = Math.min(late, ...now)
        gaps = now
      })
      expect(late, `seed ${seed}`).toBeGreaterThan(-0.01)
    }
  })
  it('keeps with its flock: birds far from the shared target swim to it', () => {
    const group = { targetX: 5, targetZ: 5, retargetAt: 1e9 }
    const birds = crowd([{ seed: 11, x: -8, z: -8, group }, { seed: 12, x: 8, z: -8, group }])
    run(birds, 90)
    for (const b of birds) expect(Math.hypot(b.x - group.targetX, b.z - group.targetZ)).toBeLessThan(MALLARD.flock.whenFarther)
  })
  it('never jumps when it starts at the zone edge in a crowd: it paddles clear along the bank, never clamped back in, never frozen', () => {
    // A strip 0.8 m wide with birds started a few centimetres apart against its edge: a push straight out of the zone
    // would have to be clamped back, jumping the bird; instead the part of a step that would leave is taken out, and
    // the bird slides along the bank.
    // Every pair started inside its spacing is clear of it within 10 s. The slowest to part is the pair 0.1 m apart
    // that must be 0.8 m apart; with only one of them able to paddle (the other wedged into the corner), AVOID takes it
    // to 0.6 m in 4.2 s, and the paddle, easing off as the gap closes (e^-0.6t), to within 1 cm in 5 s more: 9.2 s.
    // And no crowded bird stands still for more than 2 s unless the neighbour it is too close to is moving: one wedged
    // into a corner, or held against that neighbour by the wind, has no way to go that doesn't close on it, and waits
    // for the other to paddle clear, but a pair that both stand still is frozen.
    const strip: Pt[] = [[0, 0], [6, 0], [6, 0.8], [0, 0.8]]
    const pairs: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]   // pairGaps' order
    for (let seed = 1; seed <= 20; seed++) {
      const group = { targetX: 3, targetZ: 0.4, retargetAt: 0 }
      const birds = crowd([
        { seed, x: 0.05, z: 0.05, group }, { seed: seed + 50, x: 0.15, z: 0.05, group },
        { seed: seed + 100, x: 0.05, z: 0.15 }, { seed: seed + 150, x: 5.95, z: 0.75 },
      ], strip)
      const start = pairGaps(birds), clearAt = start.map(() => Infinity), still = start.map(() => 0)
      let last = birds.map(b => [b.x, b.z])
      run(birds, 60, i => {
        const moved = birds.map((b, k) => Math.hypot(b.x - last[k]![0]!, b.z - last[k]![1]!))
        birds.forEach((b, k) => {
          if (!pointInPolygon(b.x, b.z, strip)) expect.fail(`seed ${seed}, bird ${k}, frame ${i}: left the strip at ${b.x}, ${b.z}`)
          if (moved[k]! > PACE) expect.fail(`seed ${seed}, bird ${k}, frame ${i}: moved ${moved[k]!.toFixed(4)} m`)
        })
        pairGaps(birds).forEach((g, p) => {
          const [a, c] = pairs[p]!
          if (start[p]! < -0.01 && g >= -0.01) clearAt[p] = Math.min(clearAt[p]!, (i + 1) / 30)
          still[p] = g < -0.01 && moved[a]! < 1e-9 && moved[c]! < 1e-9 ? still[p]! + 1 : 0
          if (still[p]! > 2 * 30) expect.fail(`seed ${seed}, frame ${i}: birds ${a} and ${c}, ${(-g).toFixed(3)} m inside their spacing, both still for 2 s`)
        })
        last = birds.map(b => [b.x, b.z])
      })
      start.forEach((g, p) => { if (g < -0.01) expect(clearAt[p], `seed ${seed}, birds ${pairs[p]}: clear of their spacing at`).toBeLessThanOrEqual(10) })
    }
  })
  it('slides along the bank: a step out across it keeps the part along it, and one into a corner goes nowhere', () => {
    const b = createSwimmer(ctx(1), 0, -9.99, MALLARD)
    b.moveBy(0.01, -0.02)
    expect([b.x, b.z]).toEqual([0.01, -9.99])
    const c = createSwimmer(ctx(1), -9.99, -9.99, MALLARD)
    c.moveBy(-0.02, -0.005)
    expect(c.x).toBe(-9.99)
    expect(c.z).toBeCloseTo(-9.995, 12)
    const z = c.z
    c.moveBy(-0.02, -0.02)
    expect([c.x, c.z]).toEqual([-9.99, z])
  })
  it('loses way when the bank holds it up: swimming straight into it, it never gathers the speed of a wake', () => {
    const b = createSwimmer(ctx(1), 0, -9.995, MALLARD)
    b.heading = Math.PI / 2                       // facing -z, the near bank
    let fastest = 0
    for (let i = 0; i < 60; i++) {
      b.swim(1 / 30, MALLARD.cruise.speed, Math.PI / 2)
      fastest = Math.max(fastest, b.speed)
      expect(pointInPolygon(b.x, b.z, zone.points)).toBe(true)
    }
    expect(fastest).toBeLessThan(MALLARD.wake.above)
  })
  it('slides a crowded swimmer along the bank rather than freezing it: started as the spawner starts them in a small pond, no cruising bird is refused its whole step for more than 1 s, and only a bird that moves makes a wake', () => {
    // Flocks of four and six in a pond 6 m by 4 m, as the spawner starts them, so they keep meeting each other and the
    // bank. A step refused is one of at least 1 cm/s (a fiftieth of the cruise) that the body moves none of; anything
    // less is only what is left of a step that all closes on neighbours the bird is hemmed in by, and a hemmed-in bird
    // waits. A wake is made only in a frame the bird moved faster than the wake's `above`.
    const pond: Pt[] = [[0, 0], [6, 0], [6, 4], [0, 4]], area = { kind: 'polygon' as const, points: pond }
    for (let seed = 1; seed <= 15; seed++) {
      made.length = 0
      const rng = makeRng(seed), birds: BehaviorController[] = [], wakes: number[] = []
      for (const count of [4, 6]) {
        const [gx, gz] = randomPointInPolygon(pond, rng)
        const group = { targetX: gx, targetZ: gz, retargetAt: MALLARD.flock.retargetSeconds }
        for (let n = 0; n < count; n++) {
          const k = birds.length, [x, z] = startSpot(area, rng, group, companyOf(), birds)
          const onRipple = (_x: number, _z: number, size?: number) => { if (size === MALLARD.wake.size) wakes.push(k) }
          birds.push(createSwim(ctx(seed * 100 + k, { zone: area, group, neighbours: () => birds, onRipple }), x, z))
        }
      }
      // what each bird's style asks its body to move this frame
      const asked = birds.map(() => 0)
      made.forEach((b, k) => { const moveBy = b.moveBy; b.moveBy = (dx, dz) => { asked[k] = Math.hypot(dx, dz); moveBy(dx, dz) } })
      const refused = birds.map(() => 0)
      let last = birds.map(b => [b.x, b.z])
      run(birds, 120, i => {
        const moved = birds.map((b, k) => Math.hypot(b.x - last[k]![0]!, b.z - last[k]![1]!))
        birds.forEach((b, k) => {
          refused[k] = b.state === 'cruise' && asked[k]! >= 0.01 / 30 && moved[k]! < 1e-9 ? refused[k]! + 1 : 0
          if (refused[k]! > 30) expect.fail(`seed ${seed}, bird ${k}, frame ${i}: refused its whole step for 1 s at ${b.x.toFixed(3)}, ${b.z.toFixed(3)}`)
        })
        for (const k of wakes) if (moved[k]! <= MALLARD.wake.above / 30) expect.fail(`seed ${seed}, bird ${k}, frame ${i}: a wake from a bird that moved ${moved[k]!.toFixed(4)} m`)
        wakes.length = 0
        asked.fill(0)
        last = birds.map(b => [b.x, b.z])
      })
    }
  }, 60_000)   // 15 seeds x 120 s of a crowded pond: about 6.5 s alone, far longer beside a busy full run
  it('drifts downwind while it loafs', () => {
    const c = createSwim(ctx(4), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'loaf' && guard++ < 20000) c.update(1 / 30, pose)
    for (let i = 0; i < 60 && c.state === 'loaf'; i++) c.update(1 / 30, pose)   // come to a stop first
    const x0 = c.x
    for (let i = 0; i < 30 && c.state === 'loaf'; i++) c.update(1 / 30, pose)
    expect(c.x).toBeGreaterThan(x0)
  })
  it('makes a wake as it swims, a full-size ring no oftener than its wake allows', () => {
    const rings: { t: number; size?: number }[] = []
    let t = 0
    const c = createSwim(ctx(3, { onRipple: (_x, _z, size) => rings.push({ t, size }) }), 0, 0)
    const pose = defaultPose()
    for (let i = 0; i < 120 * 30; i++) { t = i / 30; c.update(1 / 30, pose) }
    expect(rings.length).toBeGreaterThan(10)
    const wake = rings.filter(r => r.size === MALLARD.wake.size)
    expect(wake.length).toBeGreaterThan(10)
    for (let i = 1; i < wake.length; i++) expect(wake[i]!.t - wake[i - 1]!.t).toBeGreaterThanOrEqual(MALLARD.wake.every - 1e-9)
  })
  it('takes no notice of a bird under the water: it swims straight over a diving coot, and round one afloat', () => {
    const closest = (submerged: boolean) => {
      const coot = { x: 2, z: 0, heading: 0, state: 'dive', spacing: 0.8, group: undefined, submerged }
      const b = createSwimmer(ctx(1, { neighbours: () => [coot] }), 0, 0, MALLARD)
      b.heading = 0
      let near = Infinity
      for (let i = 0; i < 20 * 30; i++) { b.swimTo(4, 0, MALLARD.cruise.speed, 1 / 30); near = Math.min(near, Math.hypot(b.x - 2, b.z)) }
      return near
    }
    expect(closest(true)).toBeLessThan(0.01)
    expect(closest(false)).toBeGreaterThanOrEqual(MALLARD.spacing.other - 1e-9)
  })
  it('counts a bird under the water only when a diver chooses where to come up', () => {
    const coot = { x: 1, z: 0, heading: 0, state: 'dive', spacing: 0.8, group: undefined, submerged: true }
    const b = createSwimmer(ctx(1, { neighbours: () => [coot] }), 0, 0, MALLARD)
    expect(b.clearAt(1, 0)).toBe(true)
    expect(b.clearAt(1, 0, 0, true)).toBe(false)
    expect(b.clearAt(2, 0, 0, true)).toBe(true)
  })
  it('is deterministic per seed', () => {
    const a = createSwim(ctx(9), 1, 1), b = createSwim(ctx(9), 1, 1)
    for (let i = 0; i < 500; i++) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect([a.x, a.z, a.state]).toEqual([b.x, b.z, b.state])
  })
})
