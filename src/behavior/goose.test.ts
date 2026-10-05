import {
  createGoose, gooseUnits, placeIn, roleOf, footing, findCrossing, gooseFor, CANADA_GOOSE,
  type GooseController, type GooseSettings, type GooseUnit,
} from './goose'
import { createSwim, companyOf } from './swim'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext } from './types'

type Pt = [number, number]
/** the water zone, deep everywhere, and the grass across a 3 m bank from it, as the lake's are laid out */
const WATER = { kind: 'polygon' as const, points: [[-20, -10], [2, -10], [2, 10], [-20, 10]] as Pt[] }
const GRASS = { kind: 'polygon' as const, points: [[5, -10], [25, -10], [25, 10], [5, 10]] as Pt[] }
/** the bed: 1 in 4 up from the deep water to a flat 0.3 m above it, meeting the water at x = 4 */
const ground = (x: number) => Math.min(0.3, Math.max(-1.5, (x - 4) * 0.25))
const S = CANADA_GOOSE
/** the same goose on short trips, for the tests that need many of them */
const QUICK: GooseSettings = { ...S, trip: { ...S.trip, water: [60, 120], grass: [120, 240], settle: [10, 20] } }

/** the pose values a test reads, kept only when it asks: the whole cast's pose every frame is too much to hold */
type Kept = Pick<PoseState, 'neckExtend' | 'reach' | 'reachDepth' | 'reachAngle' | 'tailTilt' | 'paddle' | 'headBob' | 'gait' | 'afloat'> & { leanX: number; leanZ: number }
interface Frame { t: number; phase: string; state: string; x: number; z: number; y: number; afloat: number; pose?: Kept }
interface Ring { t: number; bird: number; x: number; z: number; size: number }

/**
 * A family of five and a loose unit of three, as the cast's groups [5, 3] make them, for `seconds` at `fps`: every
 * goose's frames, the rings each starts, and the family's crossings as they were chosen.
 */
function run(seed: number, seconds: number, fps = 10, settings: GooseSettings = S, keepPose = false) {
  const units = gooseUnits([5, 3])
  const group = { targetX: -8, targetZ: 0, retargetAt: 60 }
  const geese: GooseController[] = []
  const rings: Ring[] = []
  let t = 0
  for (let i = 0; i < 8; i++) {
    const ctx: BehaviorContext = {
      zone: WATER, ashore: GRASS, unit: placeIn(units, i), group, rng: makeRng(seed * 1000 + i),
      wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: x => ground(x), neighbours: () => geese, species: 'cangoo',
      onRipple: (x, z, size) => rings.push({ t, bird: i, x, z, size: size ?? 1 }),
    }
    geese.push(createGoose(ctx, -8 - (i % 4), -2 + 1.2 * Math.floor(i / 4), settings))
  }
  const poses = geese.map(() => defaultPose())
  const frames: Frame[][] = geese.map(() => [])
  const crossings: { t: number; stage: string; water: Pt; land: Pt; order: number[] }[] = []
  let crossing = units[0]!.crossing
  for (let k = 0; k < seconds * fps; k++) {
    t = k / fps
    geese.forEach((g, i) => g.update(1 / fps, poses[i]!))
    if (units[0]!.crossing !== crossing) {
      crossing = units[0]!.crossing
      crossings.push({ t, stage: units[0]!.stage, water: crossing!.water, land: crossing!.land, order: [...units[0]!.order] })
    }
    geese.forEach((g, i) => {
      const p = poses[i]!
      const pose = keepPose ? {
        neckExtend: p.neckExtend, reach: p.reach, reachDepth: p.reachDepth, reachAngle: p.reachAngle, tailTilt: p.tailTilt,
        paddle: p.paddle, headBob: p.headBob, gait: p.gait, afloat: p.afloat, leanX: p.lean.x, leanZ: p.lean.z,
      } : undefined
      frames[i]!.push({ t, phase: g.phase, state: g.state, x: g.x, z: g.z, y: g.y, afloat: p.afloat, pose })
    })
  }
  return { geese, units, frames, rings, crossings, unit: units[0]! }
}

/** runs of frames in which `test` holds: their first and last frames */
function spells(frames: Frame[], test: (f: Frame) => boolean): Frame[][] {
  const out: Frame[][] = []
  let cur: Frame[] = []
  for (const f of frames) {
    if (test(f)) cur.push(f)
    else if (cur.length) { out.push(cur); cur = [] }
  }
  if (cur.length) out.push(cur)
  return out
}

/** distance from p to the segment a-b */
function toSegment(p: Pt, a: Pt, b: Pt): number {
  const [dx, dz] = [b[0] - a[0], b[1] - a[1]]
  const k = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(p[0] - a[0] - k * dx, p[1] - a[1] - k * dz)
}

describe('goose units and roles', () => {
  it('makes the first group a family and every later one a loose unit, and places each bird of the entry in its unit', () => {
    const units = gooseUnits([5, 3])
    expect(units.map(u => [u.family, u.size])).toEqual([[true, 5], [false, 3]])
    expect([0, 4, 5, 7].map(i => { const { unit, place } = placeIn(units, i); return [units.indexOf(unit), place] })).toEqual([[0, 0], [0, 4], [1, 0], [1, 2]])
    expect(() => placeIn(units, 8)).toThrow()
  })
  it('gives the family a gander, his mate, and young, and the loose unit adults', () => {
    const units = gooseUnits([5, 3])
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(i => { const { unit, place } = placeIn(units, i); return roleOf(unit, place) }))
      .toEqual(['gander', 'goose', 'young', 'young', 'young', 'adult', 'adult', 'adult'])
    expect(roleOf(undefined, 0)).toBe('adult')
    expect(run(1, 1).geese.map(g => g.role)).toEqual(['gander', 'goose', 'young', 'young', 'young', 'adult', 'adult', 'adult'])
  })
})

describe('footing', () => {
  it('floats on deep water, stands on dry ground and in shallow water, and wades between, with no jump', () => {
    expect(footing(-0.5, S.wade)).toEqual({ y: 0, afloat: 1 })
    expect(footing(-S.wade.float, S.wade)).toEqual({ y: 0, afloat: 1 })
    expect(footing(0.2, S.wade)).toEqual({ y: 0.2, afloat: 0 })
    expect(footing(-0.1, S.wade)).toEqual({ y: -0.1, afloat: 0 })
    let prev = footing(0.4, S.wade)
    for (let g = 0.4; g >= -0.5; g -= 0.001) {
      const now = footing(g, S.wade)
      // the origin drops from the bed to the surface faster than the bed falls, while the body stays on the water
      expect(Math.abs(now.y - prev.y)).toBeLessThan((0.001 * S.wade.stand) / (S.wade.float - S.wade.stand) + 1e-9)
      expect(Math.abs(now.afloat - prev.afloat)).toBeLessThan(0.001 / (S.wade.float - S.wade.stand) + 1e-9)
      prev = now
    }
  })
})

describe('findCrossing', () => {
  it('joins a spot in the water zone, deep enough to float, to a dry spot on the grass, up a bank it can walk', () => {
    const rng = makeRng(3)
    for (let i = 0; i < 20; i++) {
      const c = findCrossing(WATER, GRASS, x => ground(x), S, rng)!
      expect(pointInPolygon(c.water[0], c.water[1], WATER.points)).toBe(true)
      expect(pointInPolygon(c.land[0], c.land[1], GRASS.points)).toBe(true)
      expect(ground(c.water[0])).toBeLessThanOrEqual(-S.wade.float)
      expect(ground(c.land[0])).toBeGreaterThan(0)
      expect(Math.hypot(c.land[0] - c.water[0], c.land[1] - c.water[1])).toBeLessThan(S.shore.gap + 2)
    }
  })
  it('finds none where the bank is a step it cannot climb, and picks the nearest of its tries to a spot', () => {
    const cliff = (x: number) => (x < 4 ? -1 : 0.6)
    expect(findCrossing(WATER, GRASS, x => cliff(x), S, makeRng(3))).toBeNull()
    const c = findCrossing(WATER, GRASS, x => ground(x), S, makeRng(3), [5.5, 9])!
    expect(Math.hypot(c.land[0] - 5.5, c.land[1] - 9)).toBeLessThan(3)
  })
})

describe('the goose style: the family\'s cycle', () => {
  // two families for three hours each, with the research's times
  const long = [1, 2].map(seed => run(seed, 3 * 3600))
  it('leaves the water, grazes, and comes back, each stage within its time range; the loose unit never leaves the water', () => {
    let trips = 0
    for (const r of long) {
      const g = r.frames[0]!
      // the water: from the whole family being back on it to the gander turning for the shore
      const onWater = spells(g, f => f.phase === 'water')
      for (const s of onWater.slice(1, -1)) {
        expect(s.at(-1)!.t - s[0]!.t).toBeGreaterThanOrEqual(S.trip.water[0] - 1)
        // the gander's water time runs from when the last of the family is back in
        expect(s.at(-1)!.t - s[0]!.t).toBeLessThanOrEqual(S.trip.water[1] + 200)
      }
      // the grass: from the gander starting to graze to his turning back
      const grazing = spells(g, f => f.phase === 'graze')
      for (const s of grazing.slice(1, -1)) {
        trips++
        expect(s.at(-1)!.t - s[0]!.t).toBeGreaterThanOrEqual(S.trip.grass[0] - 1)
        expect(s.at(-1)!.t - s[0]!.t).toBeLessThanOrEqual(S.trip.grass[1] + 1)
      }
      // every bird of the family grazes and swims each trip; the loose unit only swims
      for (const f of r.frames.slice(0, 5)) expect(new Set(f.map(x => x.phase))).toEqual(new Set(['water', 'file', 'wadeOut', 'stand', 'walk', 'graze', 'walkBack', 'wadeIn', 'settle']))
      for (const f of r.frames.slice(5)) expect(new Set(f.map(x => x.phase))).toEqual(new Set(['water']))
    }
    expect(trips).toBeGreaterThanOrEqual(2)
  })
})

describe('the goose style: on short trips', () => {
  // three families for two hours each, on short trips: about forty trips out and back
  const runs = [3, 4, 5].map(seed => run(seed, 2 * 3600, 10, QUICK))
  it('follows the gander: the file\'s order varies, and every bird walks out and back where he turned', () => {
    const leaders: Record<string, number> = { gander: 0, goose: 0, young: 0 }
    for (const r of runs) {
      for (const c of r.crossings) leaders[r.geese[c.order[0]!]!.role]!++
      for (const f of r.frames.slice(0, 5)) {
        for (const x of f) {
          if (x.phase !== 'wadeOut' && x.phase !== 'wadeIn') continue
          const now = [...r.crossings].reverse().find(c => c.t <= x.t)!
          expect(toSegment([x.x, x.z], now.water, now.land), `${x.phase} at ${x.t}`).toBeLessThan(1.05)
        }
      }
    }
    const n = leaders.gander! + leaders.goose! + leaders.young!
    expect(n).toBeGreaterThan(30)
    // the shares of the lead (gander 0.4, goose 0.3, a young bird 0.3), each within 0.15
    expect(leaders.gander! / n).toBeGreaterThan(0.25); expect(leaders.gander! / n).toBeLessThan(0.55)
    expect(leaders.goose! / n).toBeGreaterThan(0.15); expect(leaders.goose! / n).toBeLessThan(0.45)
    expect(leaders.young! / n).toBeGreaterThan(0.15); expect(leaders.young! / n).toBeLessThan(0.45)
  })
  it('sets y and afloat from the ground wherever it goes: never afloat on dry ground, never on its feet in deep water', () => {
    for (const r of runs) {
      for (const f of r.frames) {
        for (const x of f) {
          const g = ground(x.x)
          if (x.phase === 'water' || x.phase === 'file' || x.phase === 'settle') {
            if (g > -S.wade.float || x.y !== 0 || x.afloat !== 1) expect.fail(`${x.phase} at ${x.t}: y ${x.y}, afloat ${x.afloat} over ${g}`)
          } else {
            const want = footing(g, S.wade)
            if (Math.abs(x.y - want.y) > 1e-12 || Math.abs(x.afloat - want.afloat) > 1e-12) expect.fail(`${x.phase} at ${x.t}: y ${x.y}, afloat ${x.afloat} over ${g}`)
          }
          if (g > 0 && x.afloat > 0) expect.fail(`afloat ${x.afloat} on dry ground at ${x.t}`)
          if (g <= -S.wade.float && x.afloat < 1) expect.fail(`afloat ${x.afloat} in water ${-g} m deep at ${x.t}`)
        }
      }
    }
  })
  it('keeps to its zones: ashore in the ashore zone, on the water in its water zone, and between them only on its crossing', () => {
    for (const r of runs) {
      r.frames.forEach((f, i) => {
        for (const x of f) {
          if (pointInPolygon(x.x, x.z, WATER.points)) continue
          if (i >= 5) expect.fail(`a loose adult out of the water at ${x.t}`)
          if (pointInPolygon(x.x, x.z, GRASS.points)) continue
          const now = [...r.crossings].reverse().find(c => c.t <= x.t)!
          if (toSegment([x.x, x.z], now.water, now.land) > 1.05) expect.fail(`${x.phase} at (${x.x}, ${x.z}), off its crossing, at ${x.t}`)
        }
      })
    }
  })
  it('keeps its spacing: no two of the family closer than the file\'s least gap on the bank, nor the flock\'s on the water', () => {
    for (const r of runs) {
      for (let k = 0; k < r.frames[0]!.length; k++) {
        for (let i = 0; i < 8; i++) {
          for (let j = i + 1; j < 8; j++) {
            const [a, b] = [r.frames[i]![k]!, r.frames[j]![k]!]
            const d = Math.hypot(a.x - b.x, a.z - b.z)
            const swimming = a.phase === 'water' && b.phase === 'water'
            if (d < (swimming ? S.spacing.flock - 0.1 : 0.4)) expect.fail(`${a.phase} ${i} and ${b.phase} ${j} ${d.toFixed(2)} m apart at ${a.t}`)
          }
        }
      }
    }
  })
  it('grazes spread 0.8-2 m apart: each grazing bird\'s nearest neighbour mostly within the spread', () => {
    let n = 0, within = 0
    for (const r of runs) {
      for (let k = 0; k < r.frames[0]!.length; k += 10) {
        const grazing = r.frames.slice(0, 5).map(f => f[k]!).filter(x => x.phase === 'graze')
        if (grazing.length < 5) continue
        for (const a of grazing) {
          const nearest = Math.min(...grazing.filter(b => b !== a).map(b => Math.hypot(a.x - b.x, a.z - b.z)))
          n++
          if (nearest >= S.trip.spread[0] - 0.2 && nearest <= S.trip.spread[1] + 0.5) within++
        }
      }
    }
    expect(n).toBeGreaterThan(1000)
    expect(within / n).toBeGreaterThan(0.9)
  })
  it('rings the water once at its breast as it wades out and once as it wades in, and never while it grazes', () => {
    for (const r of runs) {
      r.frames.slice(0, 5).forEach((f, i) => {
        const wades = r.rings.filter(x => x.bird === i && x.size === S.rings.wade)
        const crossings = [...spells(f, x => x.phase === 'wadeOut'), ...spells(f, x => x.phase === 'wadeIn')]
        let inside = 0
        for (const s of crossings) {
          const n = wades.filter(x => x.t >= s[0]!.t - 0.05 && x.t <= s.at(-1)!.t + 0.05).length
          inside += n
          // one each, but for a crossing the run's end cuts short
          if (s.at(-1) === f.at(-1)) expect(n).toBeLessThanOrEqual(1)
          else expect(n, `goose ${i}, ${s[0]!.phase} at ${s[0]!.t}`).toBe(1)
        }
        expect(inside, `goose ${i}`).toBe(wades.length)
        for (const ring of r.rings.filter(x => x.bird === i)) {
          const at = f[Math.round(ring.t * 10)]!
          if (at.phase === 'graze' || at.phase === 'walk' || at.phase === 'stand') expect.fail(`a ring while it ${at.phase}s at ${ring.t}`)
        }
      })
      // the loose unit rings only as a dabbler does
      const sizes = new Set(r.rings.filter(x => x.bird >= 5).map(x => x.size))
      for (const s of sizes) expect([S.rings.headDip, S.rings.tipUp, S.rings.dabble]).toContain(s)
    }
  })
})

describe('the goose style: grazing and looking up', () => {
  // three families grazing for two hours each: the water a minute, the grass longer than the run
  const grazer: GooseSettings = { ...S, trip: { ...S.trip, water: [30, 60], grass: [1e5, 1e5] } }
  const runs = [6, 7, 8].map((seed, i) => run(seed, 2 * 3600, 10, grazer, i === 0))
  const up = (x: Frame) => x.state === 'headUp'
  it('keeps each role\'s share of time head-up while grazing: the gander about 0.49, his mate 0.34, the young 0.07', () => {
    const share: Record<string, [number, number]> = { gander: [0, 0], goose: [0, 0], young: [0, 0] }
    for (const r of runs) r.frames.slice(0, 5).forEach((f, i) => {
      const g = f.filter(x => x.phase === 'graze')
      const s = share[r.geese[i]!.role]!
      s[0] += g.filter(up).length; s[1] += g.length
    })
    const of = (role: string) => share[role]![0] / share[role]![1]
    // the bouts give 0.485, 0.333, and 0.068; the edge bird's longer looks raise each a little
    expect(of('gander')).toBeGreaterThan(0.44); expect(of('gander')).toBeLessThan(0.58)
    expect(of('goose')).toBeGreaterThan(0.3); expect(of('goose')).toBeLessThan(0.43)
    expect(of('young')).toBeGreaterThan(0.05); expect(of('young')).toBeLessThan(0.11)
  })
  it('keeps each bird\'s bouts its own: two birds\' heads come up no more together than chance', () => {
    for (const r of runs) {
      const both = (i: number, j: number) => {
        const k = r.frames[i]!.map((x, n) => [x, r.frames[j]![n]!] as const).filter(([a, b]) => a.phase === 'graze' && b.phase === 'graze')
        const pa = k.filter(([a]) => up(a)).length / k.length, pb = k.filter(([, b]) => up(b)).length / k.length
        const pab = k.filter(([a, b]) => up(a) && up(b)).length / k.length
        // the correlation of the two head-up records
        return (pab - pa * pb) / Math.sqrt(pa * (1 - pa) * pb * (1 - pb))
      }
      for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) expect(Math.abs(both(i, j)), `${i} and ${j}`).toBeLessThan(0.12)
    }
  })
  it('shows a family mostly head-down: usually one or two heads up, now and then none', () => {
    const heads: number[] = []
    for (const r of runs) {
      for (let k = 0; k < r.frames[0]!.length; k++) {
        const f = r.frames.slice(0, 5).map(x => x[k]!)
        if (f.every(x => x.phase === 'graze')) heads.push(f.filter(up).length)
      }
    }
    const share = (test: (n: number) => boolean) => heads.filter(test).length / heads.length
    // about 77% of birds head-down at a time (research section 11.2, computed)
    const down = 1 - heads.reduce((a, b) => a + b, 0) / (5 * heads.length)
    expect(down).toBeGreaterThan(0.72); expect(down).toBeLessThan(0.82)
    expect(share(n => n === 1 || n === 2)).toBeGreaterThan(0.55)
    expect(share(n => n === 0)).toBeGreaterThan(0.1)
    expect(share(n => n >= 4)).toBeLessThan(0.05)
  })
  it('grazes head-down with its bill on the grass, biting, and stands head-up with its neck erect', () => {
    const g = runs[0]!.frames[0]!.filter(x => x.phase === 'graze')
    const downs = g.filter(x => x.state === 'headDown' && x.pose!.reach > 0.99)
    const ups = g.filter(x => x.state === 'headUp' && x.pose!.neckExtend > 0.99)
    expect(downs.length).toBeGreaterThan(1000)
    expect(ups.length).toBeGreaterThan(1000)
    expect(Math.max(...downs.map(x => x.pose!.reachDepth))).toBeGreaterThan(S.graze.bite * 0.8)
    for (const x of downs) expect(x.pose!.reachAngle).toBeCloseTo(S.graze.reachAngle, 2)
    for (const x of ups) expect(x.pose!.reach).toBeLessThan(0.01)
  })
})

describe('the goose style: moving smoothly', () => {
  it('at 60 fps no part of the pose, afloat among them, jumps in a frame', () => {
    // A tip-up comes back level in 0.4 s along smoothstep: at most 1.5 x 1.36 / 0.4 / 60 = 0.085 rad a frame, and the
    // bill reaches the water, and points down, in 0.3 s: 1.5 / 0.3 / 60 = 0.083 of the way (the dabbler's easing). Wading,
    // afloat changes with the depth under a bird walking at most 0.5 m/s up a 1 in 4 bank, across the band from its
    // standing depth to its floating one (with a tenth to spare). A snap would move the whole range at once.
    const wading = (1.1 * 0.25 * 0.5) / 60 / (S.wade.float - S.wade.stand)
    const most: Record<keyof Kept, number> = {
      neckExtend: 0.05, reach: 0.1, reachDepth: 0.04, reachAngle: 0.1, tailTilt: 0.05, paddle: 0.1, headBob: 0.01, gait: 0.12, afloat: wading,
      leanX: 0.1, leanZ: 0.1,
    }
    const r = run(10, 20 * 60, 60, QUICK, true)
    r.frames.forEach((f, i) => {
      for (let k = 1; k < f.length; k++) {
        const [a, b] = [f[k - 1]!, f[k]!]
        for (const [key, limit] of Object.entries(most) as [keyof Kept, number][]) {
          // the steepest the bill may point means nothing while it isn't reaching
          if (key === 'reachAngle' && (a.pose!.reach < 0.01 || b.pose!.reach < 0.01)) continue
          const d = Math.abs(b.pose![key] - a.pose![key])
          if (d > limit) expect.fail(`goose ${i}: ${key} changed by ${d.toFixed(4)} at ${b.t.toFixed(2)} s (${a.phase} to ${b.phase})`)
        }
        if (Math.abs(b.y - a.y) > 0.012) expect.fail(`goose ${i}: y changed by ${Math.abs(b.y - a.y).toFixed(4)} at ${b.t.toFixed(2)} (${a.phase} to ${b.phase})`)
      }
      expect(new Set(f.map(x => x.phase)).size, `goose ${i}`).toBeGreaterThan(i < 5 ? 5 : 0)
    })
  }, 120_000)
})

describe('the goose style: where the scene opens', () => {
  it('opens at a random point in the cycle: some families grazing, more of them than on the water, as the cycle\'s times run', () => {
    const starts = Array.from({ length: 60 }, (_, seed) => run(100 + seed, 0.1).geese[0]!.phase)
    const grazing = starts.filter(p => p === 'graze').length / starts.length
    // the grass is 40 of the cycle's 52.5 minutes on average
    expect(grazing).toBeGreaterThan(0.6); expect(grazing).toBeLessThan(0.92)
    expect(new Set(starts)).toEqual(new Set(['graze', 'water']))
  })
  it('opens a grazing family on the grass, standing on the ground, spread about', () => {
    const r = [...Array(10).keys()].map(s => run(200 + s, 0.1)).find(x => x.geese[0]!.phase === 'graze')!
    for (const g of r.geese.slice(0, 5)) {
      expect(pointInPolygon(g.x, g.z, GRASS.points)).toBe(true)
      expect(g.y).toBe(ground(g.x))
    }
  })
})

describe('the goose style on swim', () => {
  it('is what swim gives a species that feeds as a goose, and keeps company as a goose', () => {
    const ctx = (): BehaviorContext => ({ zone: WATER, rng: makeRng(8), wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: () => -2, foraging: 'goose', species: 'cangoo' })
    const trace = (c: ReturnType<typeof createSwim>) => {
      const pose = defaultPose(), out: string[] = []
      for (let i = 0; i < 60 * 30; i++) { c.update(1 / 30, pose); if (i % 30 === 0) out.push(`${c.state} ${c.x.toFixed(6)} ${pose.lean.x.toFixed(6)}`) }
      return out
    }
    expect(trace(createSwim(ctx(), 0, 0))).toEqual(trace(createGoose(ctx(), 0, 0)))
    expect(companyOf('goose', 'cangoo')).toEqual({ radius: S.flock.radius, retargetSeconds: S.flock.retargetSeconds, spacing: S.spacing, apart: undefined })
    expect(gooseFor('cangoo')).toBe(CANADA_GOOSE)
  })
  it('without an ashore zone or a family, swims as a loose adult and never leaves the water', () => {
    const units: GooseUnit[] = gooseUnits([5])
    const c = createGoose({ zone: WATER, rng: makeRng(2), wind: () => ({ dirX: 0, dirZ: 0, effective: 0 }), ground: () => -2, unit: placeIn(units, 0) }, -5, 0, QUICK)
    const pose = defaultPose()
    for (let i = 0; i < 3600; i++) { c.update(1, pose); expect(c.phase).toBe('water') }
  })
})
