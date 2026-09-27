import { createDabbler, MALLARD, GADWALL, WIGEON, dabblerFor, type DabblerSettings } from './dabbler'
import { createSwim } from './swim'
import { mid } from './swimmer'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import type { BehaviorContext } from './types'

// Every bout begins with a pick of what to do next, and a bird can pick the same again: loafing on, or a second tip-up
// bout straight after the first, the two running together with nothing to show where one ends. The picks are counted
// so the tests can tell such bouts apart.
const picks = vi.hoisted(() => ({ made: 0 }))
vi.mock('./swimmer', async importOriginal => {
  const real = await importOriginal<typeof import('./swimmer')>()
  const pickByShare = (...args: Parameters<typeof real.pickByShare>) => { picks.made++; return real.pickByShare(...args) }
  return { ...real, pickByShare: pickByShare as typeof real.pickByShare }
})

type Pt = [number, number]
const zone = { kind: 'polygon' as const, points: [[-20, -20], [20, -20], [20, 20], [-20, 20]] as Pt[] }
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: () => -2, ...more,
})

interface Frame { t: number; state: string; bout: number; lean: number; tail: number; reach: number; depth: number; angle: number; paddle: number; phase: number; neck: number; bob: number }
interface Ring { t: number; size: number }

/**
 * A bird feeding on its own for `seconds`, one record per frame, under the state it was in as the frame began and the
 * number of the pick that began its bout.
 */
function record(S: DabblerSettings, seed: number, seconds: number, fps = 30) {
  const rings: Ring[] = []
  let t = 0
  const c = createDabbler(ctx(seed, { onRipple: (_x, _z, size) => rings.push({ t, size: size ?? 1 }) }), 0, 0, S)
  const pose = defaultPose(), frames: Frame[] = []
  for (let i = 0; i < seconds * fps; i++) {
    t = i / fps
    const state = c.state, bout = picks.made
    c.update(1 / fps, pose)
    frames.push({ t, state, bout, lean: pose.lean.x, tail: pose.tailTilt, reach: pose.reach, depth: pose.reachDepth, angle: pose.reachAngle, paddle: pose.paddle, phase: pose.paddlePhase, neck: pose.neckExtend, bob: pose.headBob })
  }
  return { frames, rings }
}

interface Bout { state: string; from: number; to: number; first: number; last: number }

/** Each bout: the frames under one pick, its state, its start and end times, and its first and last frame. */
function bouts(frames: Frame[]): Bout[] {
  const out: Bout[] = []
  for (let i = 1, first = 0; i < frames.length; i++) {
    if (frames[i]!.bout === frames[first]!.bout && frames[i]!.state === frames[first]!.state) continue
    out.push({ state: frames[first]!.state, from: frames[first]!.t, to: frames[i]!.t, first, last: i - 1 })
    first = i
  }
  return out
}

/** How many times `above` comes to hold within a bout: the tip-ups, or head-dips, it starts. */
function starts(frames: Frame[], above: (f: Frame) => boolean): (b: Bout) => number {
  const upTo: number[] = []
  let n = 0
  frames.forEach((f, i) => { if (i > 0 && above(f) && !above(frames[i - 1]!)) n++; upTo.push(n) })
  return b => upTo[b.last]! - (b.first > 0 ? upTo[b.first - 1]! : 0)
}

/** Runs of consecutive frames where `test` holds: start and end times. */
function runs(frames: Frame[], test: (f: Frame) => boolean): { from: number; to: number; frames: Frame[] }[] {
  const out: { from: number; to: number; frames: Frame[] }[] = []
  let cur: Frame[] = []
  for (const f of frames) {
    if (test(f)) cur.push(f)
    else if (cur.length) { out.push({ from: cur[0]!.t, to: f.t, frames: cur }); cur = [] }
  }
  return out
}

const share = (frames: Frame[], states: string[]) => frames.filter(f => states.includes(f.state)).length / frames.length
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/**
 * What each species must show, from its research's sections 7 and 11: the feeding split as a share of feeding time,
 * and tip-up and head-dip lengths in seconds.
 */
const SPECIES = [
  // mallard section 11: tip-up / head-dip / surface 45 / 45 / 10 (Szijj 1965: 42 / 44 / 7); tip-ups 1.5-6 s, mean 4;
  // head-dips 0.5-3 s
  { name: 'Mallard', code: 'mallar3', S: MALLARD, split: { tipUp: [0.35, 0.55], headDip: [0.35, 0.55], surface: [0.04, 0.16] }, tipUp: { range: [1.5, 6], mean: [3.6, 4.4] }, headDip: [0.5, 3] },
  // gadwall section 11: 50 / 38 / 12, an estimate between Szijj (1 / 71 / 13) and McKnight & Hepp in October
  // (93 / 5 / 2); tip-ups 1.1-4.5 s, mean 3.1 (video, n = 23); head-dips 1-3 s
  { name: 'Gadwall', code: 'gadwal', S: GADWALL, split: { tipUp: [0.06, 0.18], headDip: [0.28, 0.48], surface: [0.4, 0.6] }, tipUp: { range: [1.1, 4.5], mean: [2.8, 3.4] }, headDip: [1, 3] },
  // american-wigeon section 11: tip-ups at most 10% of feeding, 2-4 s; head-dips 1-2 s
  { name: 'Wigeon', code: 'amewig', S: WIGEON, split: { tipUp: [0.03, 0.1], headDip: [0.36, 0.56], surface: [0.36, 0.56] }, tipUp: { range: [2, 4], mean: [2.7, 3.3] }, headDip: [1, 2] },
] as const

for (const sp of SPECIES) {
  describe(`dabbler, ${sp.name}`, () => {
    const S = sp.S
    // eight birds for an hour each, at 10 frames a second: enough bouts for the shares to settle
    const long = [1, 2, 3, 4, 5, 6, 7, 8].map(seed => record(S, seed, 3600, 10))
    const frames = long.flatMap(r => r.frames)
    // For the motion itself, one bird for ten minutes at 60 frames a second, busier feeding than the species: every
    // kind of bout as often as the others, so each shows up many times.
    const busy: DabblerSettings = { ...S, feeding: { share: S.feeding.share * 3, split: { surface: 1, headDip: 1, tipUp: 1 } } }
    const fine = record(busy, 9, 600, 60)
    // each activity's mean bout, in seconds: a head-dip or tip-up bout is a pause and a dip (or a tip-up), over and over
    const meanBout: Record<string, number> = {
      cruise: mid(S.cruise.seconds), loaf: mid(S.loaf.seconds), preen: mid(S.preen.seconds), alert: mid(S.alert.seconds), surfaceDabble: mid(S.surface.seconds),
      headDip: mid(S.headDip.dips) * (mid(S.headDip.seconds) + mid(S.headDip.gap)), tipUp: mid(S.tipUp.count) * (mid(S.tipUp.seconds) + mid(S.tipUp.gap)),
    }
    // For the number of dips and tip-ups a bout, two birds for an hour each that only dip their heads and tip up, as
    // many bouts of one as of the other: the eight hours above hold only about 26 of the Gadwall's tip-up bouts, too few
    // to be sure of seeing both 5 and 15.
    const feeder: DabblerSettings = {
      ...S, cruising: { share: 0 }, loaf: { ...S.loaf, share: 0 }, preen: { ...S.preen, share: 0 }, alert: { ...S.alert, share: 0 },
      feeding: { share: 1, split: { surface: 0, headDip: meanBout.headDip!, tipUp: meanBout.tipUp! } },
    }
    const feeders = [11, 12].map(seed => record(feeder, seed, 3600, 10))

    it('spends its time as the research says: each activity within a quarter of its share, or more where it has few bouts', () => {
      const total = S.cruising.share + S.loaf.share + S.preen.share + S.alert.share + S.feeding.share
      const want: Record<string, number> = {
        cruise: S.cruising.share / total, loaf: S.loaf.share / total, preen: S.preen.share / total, alert: S.alert.share / total,
        surfaceDabble: (S.feeding.share * S.feeding.split.surface) / total, headDip: (S.feeding.share * S.feeding.split.headDip) / total,
        tipUp: (S.feeding.share * S.feeding.split.tipUp) / total,
      }
      // An activity's time is the sum of its bouts, so over n bouts it wanders by about 1 / sqrt(n) of its share (0.8-1.4
      // / sqrt(n) standard deviation, measured over 40 runs of eight bird-hours each). Each is held to a quarter of its
      // share or, where the eight hours hold few bouts of it (n below 256), to 4 / sqrt(n) of it, 3.3 standard deviations
      // or more: the Mallard's surface dabbling (about 90 bouts) to 0.41, the Gadwall's tip-ups (26) to 0.79, the
      // Wigeon's (74) to 0.47, and the Mallard's and Gadwall's loafing and preening and the Wigeon's loafing and head-dips
      // (140-200) to 0.29-0.33.
      for (const [state, w] of Object.entries(want)) {
        const n = (8 * 3600 * w) / meanBout[state]!
        expect(Math.abs(share(frames, [state]) - w), state).toBeLessThan(Math.max(0.25, 4 / Math.sqrt(n)) * w)
      }
    })
    it('splits its feeding between surface dabbling, head-dips, and tip-ups within the research ranges', () => {
      const feeding = frames.filter(f => ['surfaceDabble', 'headDip', 'tipUp'].includes(f.state))
      const of = (state: string) => feeding.filter(f => f.state === state).length / feeding.length
      for (const [state, [lo, hi]] of [['tipUp', sp.split.tipUp], ['headDip', sp.split.headDip], ['surfaceDabble', sp.split.surface]] as const) {
        expect(of(state), state).toBeGreaterThanOrEqual(lo)
        expect(of(state), state).toBeLessThanOrEqual(hi)
      }
    })
    it('tips up for the research lengths: the body past half-way up for each, the mean near the research mean', () => {
      // at 10 frames a second a run's measured length is within a frame and a half of the true one
      const q = 0.15
      const ups = long.flatMap(r => runs(r.frames, f => f.lean > S.tipUp.lean / 2)).map(u => u.to - u.from)
      expect(ups.length).toBeGreaterThan(20)
      for (const d of ups) {
        expect(d).toBeGreaterThanOrEqual(sp.tipUp.range[0] - q)
        expect(d).toBeLessThanOrEqual(sp.tipUp.range[1] + q)
      }
      expect(mean(ups)).toBeGreaterThanOrEqual(sp.tipUp.mean[0])
      expect(mean(ups)).toBeLessThanOrEqual(sp.tipUp.mean[1])
    })
    it('tips up in bouts, level for the gap between tip-ups', () => {
      // inside a tip-up bout, the body is below half-way between tip-ups for its gap, give or take the tilt times
      let spells = 0
      for (const r of long) {
        for (const bout of runs(r.frames, f => f.state === 'tipUp')) {
          const level = runs(bout.frames, f => f.lean <= S.tipUp.lean / 2).filter(l => l.from > bout.from && l.to < bout.to)
          // the level spell is the gap plus half the tilt over less half the tilt back (0.05 s), measured to 0.15 s
          for (const l of level) {
            spells++
            expect(l.to - l.from).toBeGreaterThanOrEqual(S.tipUp.gap[0] - 0.15)
            expect(l.to - l.from).toBeLessThanOrEqual(S.tipUp.gap[1] + 0.2)
          }
        }
      }
      expect(spells).toBeGreaterThan(50)
    })
    it('tips up and dips its head as many times a bout as its settings say, from the fewest to the most', () => {
      // a tip-up is counted as the body passes half-way up, a head-dip as the head goes half-way under
      for (const [state, [fewest, most], above] of [
        ['tipUp', S.tipUp.count, (f: Frame) => f.lean > S.tipUp.lean / 2],
        ['headDip', S.headDip.dips, (f: Frame) => f.depth > S.headDip.depth / 2],
      ] as const) {
        const counts = [...long, ...feeders].flatMap(r => bouts(r.frames).filter(b => b.state === state).map(starts(r.frames, above)))
        expect(counts.length, state).toBeGreaterThan(50)
        // every bout within the range, and both ends of it turning up, so a bird that always drew the same would fail
        expect(Math.min(...counts), state).toBe(fewest)
        expect(Math.max(...counts), state).toBe(most)
      }
    })
    it('loafs, preens, looks about, and dabbles at the surface for its settings\' lengths, from near the shortest to near the longest', () => {
      for (const [state, [lo, hi]] of [['surfaceDabble', S.surface.seconds], ['loaf', S.loaf.seconds], ['preen', S.preen.seconds], ['alert', S.alert.seconds]] as const) {
        const lengths = long.flatMap(r => bouts(r.frames)).filter(b => b.state === state).map(b => b.to - b.from)
        expect(lengths.length, state).toBeGreaterThan(50)
        // a bout lasts its drawn length, rounded up to the frame (0.1 s)
        expect(Math.min(...lengths), state).toBeGreaterThanOrEqual(lo - 1e-6)
        expect(Math.max(...lengths), state).toBeLessThanOrEqual(hi + 0.1 + 1e-6)
        // and the lengths spread over the range: the shortest in its lowest tenth, the longest in its highest
        expect(Math.min(...lengths), state).toBeLessThan(lo + (hi - lo) / 10)
        expect(Math.max(...lengths), state).toBeGreaterThan(hi - (hi - lo) / 10)
      }
    })
    it('dips its head for the research lengths, the head and upper neck under', () => {
      const dips = long.flatMap(r => runs(r.frames, f => f.depth > S.headDip.depth / 2)).map(u => u.to - u.from)
      expect(dips.length).toBeGreaterThan(50)
      for (const d of dips) {
        expect(d).toBeGreaterThanOrEqual(sp.headDip[0] - 0.15)
        expect(d).toBeLessThanOrEqual(sp.headDip[1] + 0.15)
      }
      // fully under: reaching all the way, the bill straight down, the body at the head-dip's lean
      const deep = frames.filter(f => f.depth > S.headDip.depth - 1e-9)
      expect(deep.length).toBeGreaterThan(0)
      const off = deep.find(f => Math.abs(f.reach - 1) > 1e-6 || Math.abs(f.angle - Math.PI / 2) > 1e-6 || Math.abs(f.lean - S.headDip.lean) > 1e-6)
      expect(off).toBeUndefined()
    })
    it('upends at full tilt: the body 70-90 degrees nose-down, the tail up, the feet out and paddling at its stroke rate', () => {
      const full = fine.frames.filter(f => f.paddle > 0.999)
      expect(full.length).toBeGreaterThan(60)
      const degrees = full.map(f => (f.lean * 180) / Math.PI)
      expect(Math.min(...degrees)).toBeGreaterThanOrEqual(70)
      expect(Math.max(...degrees)).toBeLessThanOrEqual(90)
      for (const f of full) expect(f.tail).toBeCloseTo(S.tipUp.tail, 2)
      expect(Math.max(...full.map(f => f.reach))).toBeLessThan(0.01)
      // the stroke cycle advances strokes / fps each frame, wrapping at 1
      for (let i = 1; i < fine.frames.length; i++) {
        const d = (fine.frames[i]!.phase - fine.frames[i - 1]!.phase + 1) % 1
        if (Math.abs(d - S.tipUp.strokes / 60) > 1e-9) expect.fail(`the stroke advanced ${d} at ${fine.frames[i]!.t} s`)
      }
    })
    it('eases over in 0.2-0.5 s and back in 0.2-0.3 s, starting and ending gently', () => {
      const { frames: f } = fine
      let overs = 0
      for (let i = 1; i < f.length; i++) {
        // going over: from the first frame off level to the first at 99% of full tilt
        if (f[i - 1]!.paddle === 0 && f[i]!.paddle > 0) {
          overs++
          expect(f[i]!.lean - f[i - 1]!.lean).toBeLessThan(0.02)
          let j = i
          while (j < f.length && f[j]!.paddle < 0.99) j++
          if (j < f.length) { expect(f[j]!.t - f[i]!.t).toBeGreaterThanOrEqual(0.2); expect(f[j]!.t - f[i]!.t).toBeLessThanOrEqual(0.5) }
        }
        // coming back: from the first frame off full tilt to the first below 1%
        if (f[i - 1]!.paddle === 1 && f[i]!.paddle < 1) {
          let j = i
          while (j < f.length && f[j]!.paddle > 0.01) j++
          if (j < f.length) { expect(f[j]!.t - f[i]!.t).toBeGreaterThanOrEqual(0.15); expect(f[j]!.t - f[i]!.t).toBeLessThanOrEqual(0.3) }
        }
      }
      expect(overs).toBeGreaterThan(3)
    })
    it('moves smoothly: at 60 fps no part of the pose jumps in a frame', () => {
      // A tip-up coming back level in 0.25 s along smoothstep moves at most 1.5 / 0.25 / 60 = 0.1 of its range in a
      // frame; the limits allow for a head-dip easing at the same time. A snap would move the whole range at once.
      const most = { lean: 0.15, tail: 0.05, reach: 0.15, depth: 0.02, angle: 0.1, paddle: 0.1, neck: 0.1, bob: 0.01 }
      const { frames: f } = fine
      for (let i = 1; i < f.length; i++) {
        for (const [k, limit] of Object.entries(most) as [keyof typeof most, number][]) {
          const d = Math.abs(f[i]![k] - f[i - 1]![k])
          if (d > limit) expect.fail(`${k} changed by ${d.toFixed(4)} at ${f[i]!.t.toFixed(2)} s (${f[i]!.state})`)
        }
      }
    })
    it('rings the water at the start and end of each tip-up and head-dip, and every 1-2 s while dabbling', () => {
      const { frames: f, rings } = fine
      const at = (t: number, size: number) => rings.some(r => Math.abs(r.t - t) < 1e-9 && r.size === size)
      const ups = runs(f, x => x.paddle > 0), dips = runs(f, x => x.depth > 0)
      expect(ups.length).toBeGreaterThan(3)
      expect(dips.length).toBeGreaterThan(10)
      // a phase rings in the frame its posture starts to move
      for (const u of ups) expect(at(u.from, S.rings.tipUp), `tip-up at ${u.from}`).toBe(true)
      for (const d of dips) expect(at(d.from, S.rings.headDip), `head-dip at ${d.from}`).toBe(true)
      expect(rings.filter(r => r.size === S.rings.tipUp).length).toBeGreaterThanOrEqual(2 * ups.length - 1)
      expect(rings.filter(r => r.size === S.rings.headDip).length).toBeGreaterThanOrEqual(2 * dips.length - 1)
      // while dabbling at the surface, a small ring every 1-2 s
      const dabbling = runs(f, x => x.state === 'surfaceDabble')
      let gaps = 0
      for (const d of dabbling) {
        const inside = rings.filter(r => r.size === S.rings.dabble && r.t >= d.from && r.t < d.to).map(r => r.t)
        for (let i = 1; i < inside.length; i++) {
          gaps++
          expect(inside[i]! - inside[i - 1]!).toBeGreaterThanOrEqual(S.rings.dabbleEvery[0] - 1e-9)
          expect(inside[i]! - inside[i - 1]!).toBeLessThanOrEqual(S.rings.dabbleEvery[1] + 1 / 60 + 1e-9)
        }
      }
      expect(gaps).toBeGreaterThan(3)
    })
    it(`is what swim gives a species coded ${sp.code}`, () => {
      const trace = (make: () => ReturnType<typeof createSwim>) => {
        const c = make(), pose = defaultPose(), out: string[] = []
        for (let i = 0; i < 60 * 30; i++) { c.update(1 / 30, pose); if (i % 30 === 0) out.push(`${c.state} ${c.x.toFixed(6)} ${pose.lean.x.toFixed(6)}`) }
        return out
      }
      expect(trace(() => createSwim(ctx(8, { species: sp.code }), 0, 0))).toEqual(trace(() => createDabbler(ctx(8), 0, 0, S)))
      expect(dabblerFor(sp.code)).toBe(S)
    })
  })
}

describe('dabbler settings', () => {
  it('fall back to the Mallard for a dabbler with none of its own', () => {
    expect(dabblerFor('nosuchduck')).toBe(MALLARD)
    expect(dabblerFor(undefined)).toBe(MALLARD)
    expect(dabblerFor('constructor')).toBe(MALLARD)
  })
})
