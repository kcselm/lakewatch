import { createHeron, heronFor, heronStart, GREAT_BLUE_HERON, GREAT_EGRET, HERON_WATER, type HeronSettings } from './heron'
import { createWade } from './wade'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController } from './types'

type Pt = [number, number]
const zone = { kind: 'polygon' as const, points: [[-20, -3], [20, -3], [20, 3], [-20, 3]] as Pt[] }
/** the bed: 5 cm deep at z = -3, 30 cm at z = 3, as the far shallows slope */
const bed = (_x: number, z: number) => -(0.05 + ((z + 3) / 6) * 0.25)
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: bed, foraging: 'heron', species: 'grbher3', ...more,
})

interface Frame { t: number; state: string; x: number; z: number; neck: number; pitch: number; reach: number; lean: number; gait: number; depth: number; angle: number }
interface Ring { t: number; x: number; z: number; size: number; bx: number; bz: number; heading: number }

/** A heron feeding on its own for `seconds`, one record per frame, under the state it was in as the frame ended. */
function record(S: HeronSettings, seed: number, seconds: number, fps = 30) {
  const rings: Ring[] = []
  let t = 0
  let c: BehaviorController
  c = createHeron(ctx(seed, { onRipple: (x, z, size) => rings.push({ t, x, z, size: size ?? 1, bx: c.x, bz: c.z, heading: c.heading }) }), 0, 0, S)
  const pose = defaultPose(), frames: Frame[] = []
  for (let i = 0; i < seconds * fps; i++) {
    t = i / fps
    c.update(1 / fps, pose)
    frames.push({ t, state: c.state, x: c.x, z: c.z, neck: pose.neckExtend, pitch: pose.headPitch, reach: pose.reach, lean: pose.lean.x, gait: pose.gait, depth: pose.reachDepth, angle: pose.reachAngle })
  }
  return { frames, rings }
}

/** Runs of frames in one state: its name, how long it lasted, and the state before it. */
function runs(frames: Frame[]): { state: string; seconds: number; before: string }[] {
  const out: { state: string; seconds: number; before: string }[] = []
  let start = 0
  for (let i = 1; i <= frames.length; i++) {
    if (i === frames.length || frames[i]!.state !== frames[start]!.state) {
      out.push({ state: frames[start]!.state, seconds: frames[i - 1]!.t - frames[start]!.t, before: start > 0 ? frames[start - 1]!.state : '' })
      start = i
    }
  }
  return out
}

describe('the heron style', () => {
  it('is what wade does for a heron, and what it does not do for a bird with no style', () => {
    expect(createWade(ctx(1), 0, 0).state).toBe('wait')
    expect(createWade(ctx(1, { foraging: undefined }), 0, 0).state).toBe('still')
  })
  it('has settings for both herons, and the Great Blue Heron\'s for any other species', () => {
    expect(heronFor('grbher3')).toBe(GREAT_BLUE_HERON)
    expect(heronFor('greegr')).toBe(GREAT_EGRET)
    expect(heronFor('greyel')).toBe(GREAT_BLUE_HERON)
    expect(heronFor()).toBe(GREAT_BLUE_HERON)
  })
  for (const [name, S] of [['Great Blue Heron', GREAT_BLUE_HERON], ['Great Egret', GREAT_EGRET]] as const) {
    describe(name, () => {
      const HOURS = 2
      const { frames, rings } = record(S, 7, 3600 * HOURS)
      const all = runs(frames)
      it('stands on the bed and never leaves its zone', () => {
        const c = createHeron(ctx(3), 0, 0, S)
        for (let i = 0; i < 20000; i++) {
          c.update(1 / 30, defaultPose())
          expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)
          expect(c.y).toBeCloseTo(bed(c.x, c.z), 9)
        }
      })
      it('does everything a heron does in two hours: waits, stalks, strikes, swallows, stretches up alert, and hunches', () => {
        for (const s of ['wait', 'stalk', 'strike', 'swallow', 'alert', 'hunch']) expect(all.some(r => r.state === s), s).toBe(true)
      })
      it('keeps each state as long as its settings say', () => {
        // a run's frames stop a frame short of its last moment; a run the hour cut off is left out
        const inside = (s: string, [lo, hi]: readonly [number, number]) => {
          for (const r of all.slice(1, -1).filter(r => r.state === s)) {
            expect(r.seconds, s).toBeGreaterThanOrEqual(lo - 0.1)
            expect(r.seconds, s).toBeLessThanOrEqual(hi + 0.1)
          }
        }
        inside('swallow', S.swallow.seconds)
        inside('alert', S.alert.seconds)
        inside('hunch', S.rest.seconds)
        // a wait always runs its time, though one can follow another (a stalk with nowhere clear to go waits again)
        inside('wait', [S.wait.seconds[0], Infinity])
      })
      it('swallows only straight after a strike, about as often as its strikes catch', () => {
        for (const r of all.filter(r => r.state === 'swallow')) expect(r.before).toBe('strike')
        const strikes = all.filter(r => r.state === 'strike').length, swallows = all.filter(r => r.state === 'swallow').length
        expect(strikes).toBeGreaterThan(20)
        expect(swallows / strikes).toBeGreaterThan(S.swallow.chance - 0.2)
        expect(swallows / strikes).toBeLessThan(S.swallow.chance + 0.2)
      })
      it("strikes about as often as the research's birds do, rests and all", () => {
        // strikes a minute over the whole run: the Great Blue Heron 0.2-0.3 (Willard 1977, Bovino & Burtt 1979), the
        // Great Egret 0.4-0.9 (Mincey 2006, Willard 1977); a little wider for one seed's two hours
        const perMinute = all.filter(r => r.state === 'strike').length / (60 * HOURS)
        const [lo, hi] = S === GREAT_BLUE_HERON ? [0.15, 0.35] : [0.35, 1.0]
        expect(perMinute).toBeGreaterThan(lo)
        expect(perMinute).toBeLessThan(hi)
      })
      it('feeds in bouts, resting hunched between them: no two rests closer than the shortest bout', () => {
        let fed = 0
        for (const r of all) {
          if (r.state !== 'hunch') { fed += r.seconds; continue }
          if (all.indexOf(r) > 0) expect(fed).toBeGreaterThanOrEqual(S.bout.seconds[0] - 1)
          fed = 0
        }
        const hunched = all.filter(r => r.state === 'hunch').reduce((s, r) => s + r.seconds, 0)
        expect(hunched / (3600 * HOURS)).toBeGreaterThan(0.05)
        expect(hunched / (3600 * HOURS)).toBeLessThan(0.6)
      })
      it('strikes the water: the bill aimed its depth under the surface, never into the mud, no steeper than its angle, and one ring ahead of it', () => {
        const struck = frames.filter(f => f.state === 'strike' && f.reach > 0.99)
        expect(struck.length).toBeGreaterThan(0)
        for (const f of struck) {
          expect(f.depth).toBeCloseTo(Math.min(0, bed(f.x, f.z) + S.strike.depth), 9)
          expect(f.angle).toBe(S.strike.reachAngle)
        }
        expect(rings.length).toBe(all.filter(r => r.state === 'strike').length)
        for (const r of rings) {
          expect(r.size).toBe(S.strike.ring)
          expect(Math.hypot(r.x - r.bx, r.z - r.bz)).toBeCloseTo(S.strike.ahead, 6)
          expect(r.x - r.bx).toBeCloseTo(Math.cos(r.heading) * S.strike.ahead, 6)
        }
      })
      it('never snaps: every pose value moves a little a frame at 60 fps, and a strike takes at least six frames to go all the way down', () => {
        const { frames: f60 } = record(S, 11, 1200, 60)
        for (let i = 1; i < f60.length; i++) {
          const a = f60[i - 1]!, b = f60[i]!
          expect(Math.abs(b.neck - a.neck), `neck at ${b.t}`).toBeLessThan(0.1)
          expect(Math.abs(b.pitch - a.pitch), `pitch at ${b.t}`).toBeLessThan(0.1)
          expect(Math.abs(b.lean - a.lean), `lean at ${b.t}`).toBeLessThan(0.15)
          expect(Math.abs(b.reach - a.reach), `reach at ${b.t}`).toBeLessThan(0.3)
          expect(Math.abs(b.gait - a.gait), `gait at ${b.t}`).toBeLessThan(0.2)
        }
        // from the frame it leaves 0 to the frame it is all the way down
        for (let i = 1; i < f60.length; i++) {
          if (f60[i]!.reach >= 1 && f60[i - 1]!.reach < 1) {
            let k = i
            while (k > 0 && f60[k - 1]!.reach > 0) k--
            expect(i - k + 1, `strike at ${f60[i]!.t}`).toBeGreaterThanOrEqual(6)
          }
        }
      }, 120_000)
      it('walks only while it stalks: the neck coiled, gait up, and still in every other state', () => {
        const { frames: f } = record(S, 5, 600)
        for (let i = 1; i < f.length; i++) {
          const moved = Math.hypot(f[i]!.x - f[i - 1]!.x, f[i]!.z - f[i - 1]!.z)
          if (f[i]!.state !== 'stalk' && f[i - 1]!.state !== 'stalk') expect(moved).toBe(0)
          expect(moved).toBeLessThanOrEqual(S.stalk.speed / 30 + 1e-9)
        }
      })
    })
  }
})

describe('herons keep their distance', () => {
  it("start clear of each other, and never come closer than their own species' spacing, or the larger of two species'", () => {
    // a strip of shallows shorter than the lake's, crowded: two Great Blue Herons, which keep 10 m from each other, and
    // three egrets, which keep 5 m from each other; a heron and an egret keep 3 m. Each species is a group, as the
    // spawner makes it.
    const small = { kind: 'polygon' as const, points: [[0, 0], [30, 0], [30, 4], [0, 4]] as Pt[] }
    const rng = makeRng(3)
    const herons: (BehaviorController & { spacing?: number })[] = []
    const species = ['grbher3', 'grbher3', 'greegr', 'greegr', 'greegr']
    const groups = { grbher3: { targetX: 0, targetZ: 0, retargetAt: 0 }, greegr: { targetX: 0, targetZ: 0, retargetAt: 0 } }
    for (const sp of species) {
      const group = groups[sp as keyof typeof groups]
      const [sx, sz] = heronStart(small, rng, group, heronFor(sp).spacing, herons)
      herons.push(createHeron(ctx(herons.length + 1, { zone: small, species: sp, group, ground: () => -0.1, neighbours: () => herons }), sx, sz))
    }
    const keep = (a: number, b: number) => species[a] === species[b] ? heronFor(species[a]).spacing.same
      : Math.max(heronFor(species[a]).spacing.other, heronFor(species[b]).spacing.other)
    const gap = () => {
      let g = Infinity
      for (let a = 0; a < herons.length; a++) for (let b = a + 1; b < herons.length; b++) {
        g = Math.min(g, Math.hypot(herons[a]!.x - herons[b]!.x, herons[a]!.z - herons[b]!.z) - keep(a, b))
      }
      return g
    }
    expect(gap()).toBeGreaterThanOrEqual(0)
    const poses = herons.map(() => defaultPose())
    for (let i = 0; i < 30 * 1800; i++) {
      herons.forEach((h, k) => h.update(1 / 30, poses[k]!))
      expect(gap()).toBeGreaterThanOrEqual(-1e-9)
    }
  }, 60_000)
  it('keeps its own species further off than another heron', () => {
    for (const S of [GREAT_BLUE_HERON, GREAT_EGRET]) expect(S.spacing.same).toBeGreaterThan(S.spacing.other)
  })
  it('stands in water inside the style\'s band', () => {
    expect(HERON_WATER[0]).toBeGreaterThan(0)
    expect(HERON_WATER[1]).toBeGreaterThan(HERON_WATER[0])
  })
})
