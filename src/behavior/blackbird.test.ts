import * as THREE from 'three'
import { createBlackbird, blackbirdGroup, BLACKBIRD, BLACKBIRD_RATES, type BlackbirdContext, type BlackbirdController, type Version } from './blackbird'
import { BEHAVIORS } from './index'
import type { CallAsk } from './types'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { loadLocation } from '../location'
import { lakeHeightfield } from '../world/heightfield'
import { terrainSurface } from '../world/terrain'
import { Wind } from '../world/wind'
import { layoutStems, createStemField, TULE_HOLD, type StemField } from '../world/stems'
import type { SongCue } from '../audio/cues'

// The blackbird behaviour against the spec's tests (docs/superpowers/specs/2026-10-13-red-winged-blackbird-design.md,
// "Behaviour tests"), on the lake's own reed bed and wind, with a seeded random source.

const S = BLACKBIRD
const lake = loadLocation()
const reeds = lake.zones['reeds']
if (reeds?.kind !== 'polygon') throw new Error('reeds is a polygon')
const postZone = lake.zones['reed-perch']
if (postZone?.kind !== 'point') throw new Error('reed-perch is a point')
const post = postZone
const hf = lakeHeightfield(7)
const surface = terrainSurface(hf)
const STEMS = layoutStems({ heightfield: hf, ground: (x, z) => surface.sample(x, z) })
const VANTAGE = lake.vantage.position
/** the songs it may be played: XC703912's first and an XC678807 song (data/cues.json) */
const CUES: SongCue[] = [
  { file: 'a.mp3', start: 2.8, trill: 3.06, end: 3.89 },
  { file: 'b.mp3', start: 1.84, trill: 2.19, end: 2.7 },
]
const VERSIONS: Version[] = ['male', 'male', 'firstYearMale', 'female', 'female']

interface Asked { t: number; bird: number; kind: string; played: boolean; cue?: SongCue }
interface Bed { field: StemField; wind: Wind; birds: BlackbirdController[]; poses: PoseState[]; asks: Asked[]; t: () => number }

/**
 * The five birds of the cast on a fresh bed: each asks through `onCall`, which plays a song or check (calling its
 * onStart at once with a 0.4 s lead) unless `drop` says the cap dropped it.
 */
function bed(seed: number, drop = () => false, versions: Version[] = VERSIONS, settings = S): Bed {
  const field = createStemField(STEMS)
  const wind = new Wind({ ...lake.wind, seed: 7 })
  const group = blackbirdGroup()
  const rng = makeRng(seed)
  const asks: Asked[] = []
  let t = 0
  const birds = versions.map((variant, i) => {
    const ctx: BlackbirdContext = {
      zone: reeds!, rng: makeRng(Math.floor(rng() * 1e9)),
      wind: () => ({ dirX: wind.state.dir.x, dirZ: wind.state.dir.y, effective: wind.effective() }),
      ground: (x, z) => surface.sample(x, z),
      stems: field, blackbirds: group, variant, size: variant === 'female' ? 0.85 : 1,
      post: post!.position, vantage: VANTAGE,
      onCall: (ask?: CallAsk) => {
        const played = !drop()
        const cue = CUES[Math.floor(rng() * CUES.length)]!
        asks.push({ t, bird: i, kind: ask?.kind ?? 'call', played, ...(ask?.kind === 'song' ? { cue } : {}) })
        if (!played || !ask || ask.kind === 'call') return
        if (ask.kind === 'song') ask.onStart?.(0.4, cue)
        else ask.onStart?.(0.03)
      },
    }
    const [x, z] = [-6 - rng() * 8, -4 - rng() * 8]
    return createBlackbird(ctx, x, z, settings)
  })
  return { field, wind, birds, poses: birds.map(() => defaultPose()), asks, t: () => t, set: (v: number) => { t = v } } as Bed & { set: (v: number) => void }
}

/** Runs a bed for `seconds` at `fps`, calling `each` after every frame. */
function run(b: Bed, seconds: number, fps: number, each?: (t: number) => void): void {
  const set = (b as Bed & { set: (v: number) => void }).set
  const dt = 1 / fps
  for (let i = 0; i < seconds * fps; i++) {
    set(i * dt)
    b.wind.update(dt)
    b.field.update(dt, b.wind)
    b.birds.forEach((c, k) => c.update(dt, b.poses[k]!))
    each?.(i * dt)
  }
}

describe('the blackbird style', () => {
  it('is the cast\'s `blackbird` behaviour', () => {
    expect(BEHAVIORS.blackbird).toBe(createBlackbird)
  })
  it('starts each bird on a stem of the bed, the singer the first adult male, on the stalk nearest his post', () => {
    const b = bed(1)
    expect(b.birds.map(c => c.singer)).toEqual([true, false, false, false, false])
    const p = b.birds[0]!.hold!.stems[0]
    expect(Math.hypot(p.x - post.position[0], p.z - post.position[2])).toBeLessThan(0.4)
    expect(b.birds[0]!.hold!.grip).toBe('top')
    for (const c of b.birds) {
      expect(c.hold).not.toBeNull()
      for (const s of c.hold!.stems) expect(s.kind === 'cattail' || s.kind === 'tule').toBe(true)
    }
  })
})

describe('a long morning on the bed', () => {
  // 40 minutes at 15 frames a second, once, for every long-run test below
  const b = bed(42)
  const states: string[][] = b.birds.map(() => [])
  const frames: { t: number; birds: { state: string; x: number; y: number; z: number; heading: number; hold: string | null; song: boolean; spreading: boolean }[] }[] = []
  const grips: Record<string, number> = { top: 0, stalk: 0, tule: 0, straddle: 0 }
  const activities: Record<string, number> = { alert: 0, preen: 0, feed: 0, stretch: 0 }
  const tuleHeights: number[] = []
  let lastHold: (object | null)[] = b.birds.map(() => null)
  run(b, 40 * 60, 15, t => {
    frames.push({
      t,
      birds: b.birds.map(c => ({
        state: c.state, x: c.x, y: c.y, z: c.z, heading: c.heading,
        hold: c.hold ? c.hold.stems.map(s => s.index).join() : null, song: c.song !== null, spreading: c.song?.spreading ?? false,
      })),
    })
    b.birds.forEach((c, k) => {
      states[k]!.push(c.state)
      if (c.hold && c.hold !== lastHold[k]) {
        grips[c.hold.grip]!++
        if (c.hold.grip === 'tule' || c.hold.grip === 'straddle') tuleHeights.push(...c.hold.at)
      }
      lastHold[k] = c.hold
    })
  })
  // each bout's activity, counted when it starts
  it('perches in every grip about as often as the settings ask, over the run', () => {
    const n = Object.values(grips).reduce((a, x) => a + x, 0)
    expect(n).toBeGreaterThan(40)
    // a grip with no stem in reach falls through to the next: within a margin of its share
    expect(grips.top! / n).toBeGreaterThan(0.25)
    expect(grips.stalk! / n).toBeGreaterThan(0.08)
    expect(grips.tule! + grips.straddle!).toBeGreaterThan(0)
  })
  it('holds a tule only between 0.6 and 1.2 m', () => {
    for (const h of tuleHeights) {
      expect(h).toBeGreaterThanOrEqual(TULE_HOLD[0] - 1e-9)
      expect(h).toBeLessThanOrEqual(TULE_HOLD[1] + 1e-9)
    }
  })
  it('no two birds hold one stem', () => {
    for (const f of frames) {
      const held = f.birds.flatMap(x => (x.hold ? x.hold.split(',') : []))
      expect(new Set(held).size).toBe(held.length)
    }
  })
  it('no bird stays nearer the player than 5 m for more than a few seconds', () => {
    for (let k = 0; k < b.birds.length; k++) {
      let near = 0
      for (const f of frames) {
        const x = f.birds[k]!
        near = Math.hypot(x.x - VANTAGE[0], x.z - VANTAGE[2]) < S.player ? near + 1 / 15 : 0
        expect(near).toBeLessThan(3)
      }
    }
  })
  it('flutters stay over the bed, above the leaves\' bases, and never turn faster than their setting', () => {
    const [x0, z0] = [Math.min(...reeds.points.map(p => p[0])), Math.min(...reeds.points.map(p => p[1]))]
    const [x1, z1] = [Math.max(...reeds.points.map(p => p[0])), Math.max(...reeds.points.map(p => p[1]))]
    let flights = 0
    for (let i = 1; i < frames.length; i++) {
      for (let k = 0; k < b.birds.length; k++) {
        const a = frames[i - 1]!.birds[k]!, c = frames[i]!.birds[k]!
        if (c.state !== 'flutter') continue
        flights++
        expect(c.x).toBeGreaterThanOrEqual(x0 - 0.5); expect(c.x).toBeLessThanOrEqual(x1 + 0.5)
        expect(c.z).toBeGreaterThanOrEqual(z0 - 0.5); expect(c.z).toBeLessThanOrEqual(z1 + 0.5)
        expect(c.y - surface.sample(c.x, c.z)).toBeGreaterThan(0.4)
        const turn = Math.abs(Math.atan2(Math.sin(c.heading - a.heading), Math.cos(c.heading - a.heading)))
        if (a.state === 'flutter') expect(turn).toBeLessThanOrEqual(S.flutter.turn / 15 + 1e-9)
      }
    }
    expect(flights).toBeGreaterThan(30)
  })
  it('moves between stems in every way: climbing, stepping and fluttering', () => {
    const all = new Set(states.flat())
    for (const s of ['perch', 'climb', 'flutter']) expect(all.has(s), s).toBe(true)
  })
  it('the singer sings in bouts from his post; the females never sing', () => {
    const sung = b.asks.filter(a => a.kind === 'song')
    expect(sung.filter(a => a.bird === 0).length).toBeGreaterThan(12)
    expect(sung.filter(a => a.bird >= 3)).toEqual([])
    // within a bout, 8-20 s between songs (a song's own seconds aside); between bouts, minutes
    const times = sung.filter(a => a.bird === 0).map(a => a.t)
    const gaps = times.slice(1).map((t, i) => t - times[i]!)
    const inBout = gaps.filter(g => g < 60)
    for (const g of inBout) { expect(g).toBeGreaterThanOrEqual(S.song.every[0]); expect(g).toBeLessThanOrEqual(S.song.every[1] + 4) }
    expect(gaps.some(g => g >= S.song.early[0])).toBe(true)
  })
  it('every bird checks, the settled ones every 10-40 s', () => {
    for (let k = 0; k < b.birds.length; k++) expect(b.asks.filter(a => a.bird === k && a.kind === 'check').length, `${k}`).toBeGreaterThan(30)
  })
  void activities
})

describe('the song spread', () => {
  it('runs only with a song that plays: a dropped song is skipped without a spread', () => {
    const b = bed(7, () => true)
    let spread = false
    run(b, 6 * 60, 15, () => { for (const c of b.birds) if (c.song?.spreading) spread = true })
    expect(b.asks.some(a => a.kind === 'song')).toBe(true)
    expect(spread).toBe(false)
    // and the bird goes on with its morning
    expect(b.birds[0]!.state).not.toBe('sing')
  })
  it('the grades over a long run within 5 points of 35/35/20/10', () => {
    const counts = [0, 0, 0, 0]
    // the singer with no other male on the bed, so no rival raises a grade, over many bouts (his bouts brought closer
    // together, for a run long in songs and short in time)
    const often = { ...S, song: { ...S.song, gap: [20, 40] as const, early: [20, 40] as const } }
    for (let seed = 1; seed <= 6; seed++) {
      const b = bed(100 + seed, () => false, ['male', 'female', 'female'], often)
      let counted = 0
      run(b, 30 * 60, 6, () => {
        const s = b.birds[0]!.song
        // each song once, its own draw (a rival near raises it one: those are left out)
        if (s && s.number !== counted && s.spreading && typeof s.grade === 'number') {
          counted = s.number
          if (!s.rival) counts[s.grade]!++
        }
      })
    }
    const n = counts.reduce((a, x) => a + x, 0)
    expect(n).toBeGreaterThan(400)
    S.song.grades.forEach((g, i) => { expect(Math.abs(counts[i]! / n - g), `grade ${i}`).toBeLessThan(0.05) })
  }, 60_000)
  it('builds over at least 18 frames at 60 fps, and no pose value changes faster than its rate', () => {
    const b = bed(3)
    const prev = b.poses.map(p => ({ ...p, lean: p.lean.clone() }))
    const R = BLACKBIRD_RATES
    const keys: [keyof typeof R, (p: PoseState) => number][] = [
      ['lean', p => p.lean.x], ['roll', p => p.lean.z], ['headPitch', p => p.headPitch], ['headYaw', p => p.headYaw], ['neck', p => p.neckExtend],
      ['wingSpread', p => p.wingSpread], ['legsUp', p => p.legsUp], ['tailSpread', p => p.tailSpread], ['tailTilt', p => p.tailTilt],
      ['epaulet', p => p.epaulet], ['epauletRaise', p => p.epauletRaise], ['fluff', p => p.fluff], ['wingHold', p => p.wingHold], ['gape', p => p.gape],
    ]
    let builds = 0, buildFrames = 0, building = false
    run(b, 8 * 60, 60, () => {
      b.poses.forEach((p, k) => {
        for (const [key, get] of keys) {
          const d = Math.abs(get(p) - get(prev[k] as PoseState))
          expect(d, `${key}`).toBeLessThanOrEqual(R[key] / 60 + 1e-9)
        }
        prev[k] = { ...p, lean: p.lean.clone() }
      })
      const s = b.birds[0]!.song
      if (s?.spreading && b.poses[0]!.epauletRaise > 0.001 && b.poses[0]!.epauletRaise < 0.95 * 0.1) { if (!building) builds++; building = true; buildFrames++ }
      else building = false
    })
  }, 120_000)
})

describe('riding a stem', () => {
  it('the feet stay on their stems while the stems sway: every hold on its stem\'s axis', () => {
    const b = bed(11)
    run(b, 90, 30, () => {
      b.birds.forEach((c, k) => {
        const p = b.poses[k]!
        if (!c.hold || !p.feet) return
        // the holds come in the bird's frame: back to the world, each on its stem's axis
        for (const f of [p.feet.right, p.feet.left]) {
          const w = f.at.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), c.heading).add(new THREE.Vector3(c.x, c.y, c.z))
          // its stems, or the one it is stepping to
          const d = Math.min(...b.field.near(w.x, w.z, 0.6).map(s => {
            // the nearest point of the stem's axis to w
            let best = Infinity
            for (let h = 0; h <= s.height + 0.2; h += 0.005) best = Math.min(best, b.field.pointAt(s, h).distanceTo(w))
            return best
          }))
          expect(d).toBeLessThan(0.004)
        }
      })
    })
  }, 60_000)
})

describe('a perch bout', () => {
  it('lasts 20-120 s, spent alert, preening, feeding or stretching about as the settings share them', () => {
    const b = bed(5)
    const seen: Record<string, number> = { alert: 0, preen: 0, feed: 0, stretch: 0 }
    const lengths: number[] = []
    const last = b.birds.map(() => ({ bouts: 0, since: 0, sang: false }))
    run(b, 60 * 60, 6, t => {
      b.birds.forEach((c, k) => {
        const l = last[k]!
        if (c.song) l.sang = true
        if (c.bouts !== l.bouts) {
          if (c.activity) seen[c.activity]!++
          // a bout's length, from its start to the next's, unless a song lengthened it; not the singer's, whose bouts
          // a flight back to his post cuts short before each bout of song
          if (k > 0 && l.bouts > 1 && !l.sang) lengths.push(t - l.since)
          l.bouts = c.bouts; l.since = t; l.sang = false
        }
      })
    })
    const n = Object.values(seen).reduce((a, x) => a + x, 0)
    expect(n).toBeGreaterThan(60)
    // feeding needs a cattail top: on any other grip the bout is spent alert
    expect(seen.alert! / n).toBeGreaterThan(S.idle.alert - 0.15)
    expect(seen.preen! / n).toBeGreaterThan(S.idle.preen - 0.12)
    expect(seen.preen! / n).toBeLessThan(S.idle.preen + 0.12)
    expect(seen.feed! / n).toBeLessThan(S.idle.feed + 0.1)
    expect(seen.stretch! / n).toBeLessThan(S.idle.stretch + 0.08)
    // each bout 20-120 s, and the move after it (a flutter or a climb) a few seconds more
    expect(lengths.length).toBeGreaterThan(30)
    for (const s of lengths) { expect(s).toBeGreaterThan(S.perch.seconds[0] - 1); expect(s).toBeLessThan(S.perch.seconds[1] + 15) }
  }, 60_000)
})

describe('the spread against the song', () => {
  it('starts 0-0.5 s before the first note, is full within 0.15 s of the trill, and is released 0.2-0.9 s after the end', () => {
    // a singer alone, so his spreads are his draws; his song's first note sounds 0.4 s after he asks
    let checked = 0
    for (let seed = 21; seed < 60 && checked < 6; seed++) {
      const b = bed(seed, () => false, ['male'])
      const rows: { t: number; raise: number; fluff: number; grade: unknown; number: number }[] = []
      run(b, 120, 60, t => {
        const p = b.poses[0]!, s = b.birds[0]!.song
        rows.push({ t, raise: p.epauletRaise, fluff: p.fluff, grade: s?.grade, number: s?.number ?? 0 })
      })
      for (const ask of b.asks.filter(a => a.kind === 'song')) {
        const own = rows.filter(r => r.t >= ask.t && r.t < ask.t + 6)
        const grade = own.find(r => r.grade !== undefined)?.grade
        // a low or full spread raises the coverts well clear of nothing
        if (grade !== 2 && grade !== 3) continue
        const cue = ask.cue!, first = ask.t + 0.4
        const trill = first + (cue.trill - cue.start), end = first + (cue.end - cue.start)
        const onset = own.find(r => r.fluff > 0.01)!
        within(first - onset.t, -1 / 60, 0.5, 'onset before the first note')
        const peak = Math.max(...own.map(r => r.raise))
        const full = own.find(r => r.raise >= 0.95 * peak)!
        within(full.t - trill, -0.15, 0.15, 'full at the trill')
        const released = own.find(r => r.t > end && r.raise <= 0.02)
        if (released) within(released.t - end, 0.2, 0.9 + 3, 'released after the end (or after a hold of 1-3 s)')
        checked++
      }
    }
    expect(checked).toBeGreaterThan(2)
  }, 120_000)
})

const within = (v: number, lo: number, hi: number, what = '') => {
  expect(v, what).toBeGreaterThanOrEqual(lo)
  expect(v, what).toBeLessThanOrEqual(hi)
}

describe('riding a swaying stem, with the model', () => {
  it('the head moves no more than a third as far as the feet', async () => {
    const { buildDetailedBird } = await import('../birds/detail/build')
    const { SPECIES } = await import('../birds/species')
    // a female alone, still (no head turns, no flicks, no preening), on whatever stem she starts on
    const still = { ...S, idle: { alert: 1, preen: 0, feed: 0, stretch: 0 }, turn: { ...S.turn, every: [1e6, 1e6] as const }, flick: { ...S.flick, every: [1e6, 1e6] as const, settled: [1e6, 1e6] as const }, perch: { ...S.perch, seconds: [1e6, 1e6] as const } }
    for (const seed of [31, 32, 33]) {
      const b = bed(seed, () => false, ['female'], still)
      const c = b.birds[0]!, m = buildDetailedBird(SPECIES.rewbla!, 'female')
      const head = m.mesh.skeleton.bones.find(x => x.name === 'head')!
      const toes = ['toesR', 'toesL'].map(n => m.mesh.skeleton.bones.find(x => x.name === n)!)
      const heads: THREE.Vector3[] = [], feetAt: THREE.Vector3[] = []
      let kicked = false
      run(b, 14, 60, t => {
        if (!kicked && t > 4) {
          // a male lands on the stem and is gone again: it swings
          const s = c.hold!.stems[0]
          b.field.release(b.field.hold(s, 0.065, c.hold!.at[0], 0.5, 0.3), 0, 0)
          kicked = true
        }
        m.group.position.set(c.x, c.y, c.z)
        m.group.rotation.y = c.heading
        m.pose(b.poses[0]!)
        m.group.updateMatrixWorld(true)
        if (t > 4.2) {
          // each from where the stems would settle, leaving out their slow bending under the gusts, which it follows
          const h = c.hold!, rest = h.stems.map((st, i) => b.field.restAt(st, h.at[i]!)).reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / h.stems.length)
          heads.push(head.getWorldPosition(new THREE.Vector3()).sub(rest))
          feetAt.push(toes[0]!.getWorldPosition(new THREE.Vector3()).add(toes[1]!.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5).sub(rest))
        }
      })
      // how far each strays from where it sits on average, the most it does
      const spread = (ps: THREE.Vector3[]) => {
        const mean = ps.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / ps.length)
        return Math.max(...ps.map(p => Math.hypot(p.x - mean.x, p.z - mean.z)))
      }
      const feetMoved = spread(feetAt), headMoved = spread(heads)
      expect(feetMoved, `seed ${seed}: the stem swung`).toBeGreaterThan(0.005)
      expect(headMoved, `seed ${seed}`).toBeLessThanOrEqual(feetMoved / 3)
    }
  }, 120_000)
})
