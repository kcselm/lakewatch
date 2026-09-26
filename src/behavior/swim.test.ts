import { createSwim, companyOf } from './swim'
import { MALLARD } from './dabbler'
import { AVOID, DRIFT, startSpot } from './swimmer'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController, FlockGroup } from './types'
import type { Foraging } from '../birds/spec'

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
  it('never jumps when it starts at the zone edge in a crowd: it paddles clear inside the zone, never clamped back in', () => {
    // A strip 0.8 m wide with birds started a few centimetres apart against its edge: a push straight out of the zone
    // would have to be clamped back, jumping the bird; instead a step that would leave is shortened.
    const strip: Pt[] = [[0, 0], [6, 0], [6, 0.8], [0, 0.8]]
    for (let seed = 1; seed <= 20; seed++) {
      const group = { targetX: 3, targetZ: 0.4, retargetAt: 0 }
      const birds = crowd([
        { seed, x: 0.05, z: 0.05, group }, { seed: seed + 50, x: 0.15, z: 0.05, group },
        { seed: seed + 100, x: 0.05, z: 0.15 }, { seed: seed + 150, x: 5.95, z: 0.75 },
      ], strip)
      let last = birds.map(b => [b.x, b.z])
      run(birds, 60, i => {
        birds.forEach((b, k) => {
          if (!pointInPolygon(b.x, b.z, strip)) expect.fail(`seed ${seed}, bird ${k}, frame ${i}: left the strip at ${b.x}, ${b.z}`)
          const moved = Math.hypot(b.x - last[k]![0]!, b.z - last[k]![1]!)
          if (moved > PACE) expect.fail(`seed ${seed}, bird ${k}, frame ${i}: moved ${moved.toFixed(4)} m`)
        })
        last = birds.map(b => [b.x, b.z])
      })
    }
  })
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
  it('is deterministic per seed', () => {
    const a = createSwim(ctx(9), 1, 1), b = createSwim(ctx(9), 1, 1)
    for (let i = 0; i < 500; i++) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect([a.x, a.z, a.state]).toEqual([b.x, b.z, b.state])
  })
})
