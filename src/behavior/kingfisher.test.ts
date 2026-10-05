import { createKingfisher, KINGFISHER, KINGFISHER_RATES, REAL_PACE, hoverHz } from './kingfisher'
import { BEHAVIORS } from './index'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { loadLocation } from '../location'
import { lakeHeightfield } from '../world/heightfield'
import { terrainSurface } from '../world/terrain'
import { bakeWaterDepth } from '../world/waterDepth'
import { LAKE_TREES, CANOPY_REACH } from '../world/trees'
import { WIND_SPEED } from '../world/wind'
import { perchesOf } from '../birds/spawn'
import type { BehaviorContext, BehaviorController, Perch } from './types'

const S = KINGFISHER
const lake = loadLocation()
const zone = lake.zones['perches']
if (zone?.kind !== 'perches') throw new Error('the lake has a perches zone')
const PERCHES = perchesOf(zone)
const surface = terrainSurface(lakeHeightfield(7))
const depth = bakeWaterDepth(surface)
const reeds = lake.zones['reeds']
if (reeds?.kind !== 'polygon') throw new Error('reeds is a polygon')
const snag = lake.zones['snag']
if (snag?.kind !== 'point') throw new Error('snag is a point')
/** the lake's wind, blowing toward compass 240 at 0.35, a light breeze */
const WIND = { dirX: Math.sin((240 * Math.PI) / 180), dirZ: -Math.cos((240 * Math.PI) / 180), effective: 0.35 }
/** the test flier's pitch, 45 degrees: the kingfisher's own comes with its trace */
const PITCH = Math.PI / 4

interface Ring { t: number; x: number; z: number; size: number }
interface Frame {
  t: number; state: string; x: number; y: number; z: number; heading: number; submerged: boolean
  lean: number; roll: number; pitch: number; yaw: number; neck: number; spread: number; stroke: number; glide: number; legs: number
  fan: number; tilt: number; crest: number; fish: number; turn: number; phase: number
}

const ctxFor = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => WIND, ground: (x, z) => surface.sample(x, z), perches: PERCHES, perch: PERCHES[0]!.position,
  flightPitch: PITCH, species: 'belkin1', ...more,
})

/** A kingfisher on the lake's perches for `seconds`, one record a frame, with its rings, sprays, splashes and calls. */
function record(seed: number, seconds: number, fps = 30) {
  const rings: Ring[] = [], sprays: Ring[] = [], calls: { t: number; state: string }[] = [], splashes: number[] = []
  let t = 0
  let c: BehaviorController
  c = createKingfisher(ctxFor(seed, {
    onRipple: (x, z, size) => rings.push({ t, x, z, size: size ?? 1 }),
    onSplash: (x, z, size) => sprays.push({ t, x, z, size: size ?? 1 }),
    onCall: () => calls.push({ t, state: c.state }),
    onEvent: (name, _x, y) => { if (name === 'splash') splashes.push(y) },
  }), 0, 0)
  const pose = defaultPose(), frames: Frame[] = []
  for (let i = 0; i < seconds * fps; i++) {
    t = i / fps
    c.update(1 / fps, pose)
    frames.push(snapshot(t, c, pose))
  }
  return { frames, rings, sprays, calls, splashes }
}

function snapshot(t: number, c: BehaviorController, p: PoseState): Frame {
  return {
    t, state: c.state, x: c.x, y: c.y, z: c.z, heading: c.heading, submerged: c.submerged ?? false,
    lean: p.lean.x, roll: p.lean.z, pitch: p.headPitch, yaw: p.headYaw, neck: p.neckExtend, spread: p.wingSpread, stroke: p.wingStroke,
    glide: p.glide, legs: p.legsUp, fan: p.tailSpread, tilt: p.tailTilt, crest: p.crestRaise, fish: p.fish, turn: p.fishTurn, phase: p.wingPhase,
  }
}

interface Run { state: string; seconds: number; before: string; after: string; from: number; to: number }
/** Runs of frames in one state: how long each lasted, the states either side, and its first and last frame. */
function runs(frames: Frame[]): Run[] {
  const out: Run[] = []
  let start = 0
  for (let i = 1; i <= frames.length; i++) {
    if (i === frames.length || frames[i]!.state !== frames[start]!.state) {
      out.push({
        state: frames[start]!.state, seconds: frames[i - 1]!.t - frames[start]!.t, before: start > 0 ? frames[start - 1]!.state : '',
        after: i < frames.length ? frames[i]!.state : '', from: start, to: i - 1,
      })
      start = i
    }
  }
  return out
}

const wrapped = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const FLYING = ['flyout', 'fly', 'land', 'emerge']
const nearestPerch = (x: number, z: number) => Math.min(...PERCHES.map(p => Math.hypot(p.position[0] - x, p.position[2] - z)))

describe('the kingfisher style', () => {
  it("is the lake's kingfisher, and hover is gone", () => {
    expect(BEHAVIORS.kingfisher).toBe(createKingfisher)
    expect('hover' in BEHAVIORS).toBe(false)
    const entry = lake.cast.find(e => e.species === 'belkin1')!
    expect([entry.behavior, entry.zone]).toEqual(['kingfisher', 'perches'])
  })
  it('starts on its first perch, facing the water, its wings folded', () => {
    const c = createKingfisher(ctxFor(1), 0, 0)
    const pose = defaultPose()
    c.update(1 / 30, pose)
    expect([c.x, c.y, c.z]).toEqual(PERCHES[0]!.position)
    expect(c.heading).toBeCloseTo(PERCHES[0]!.heading, 9)
    expect(c.state).toBe('perch')
    expect(pose.wingSpread).toBe(0)
  })
  it('needs perches', () => {
    expect(() => createKingfisher(ctxFor(1, { perches: undefined }), 0, 0)).toThrow(/perches/)
    expect(() => createKingfisher(ctxFor(1, { perches: [] }), 0, 0)).toThrow(/perches/)
  })
  it('is the same bird for the same seed', () => {
    const a = record(6, 600).frames.at(-1)!, b = record(6, 600).frames.at(-1)!
    expect(a).toEqual(b)
  })
  it("beats at the research's rates: 7 Hz flapping, a hover's 8.5 Hz in the lake's breeze, never above 9.5", () => {
    expect(S.wingbeat.quick).toBe(7)
    expect(hoverHz(S, 2.8)).toBeCloseTo(8.66, 2)
    expect(hoverHz(S, 0.35 * WIND_SPEED)).toBeGreaterThanOrEqual(7.5)
    expect(hoverHz(S, 0)).toBeLessThanOrEqual(9.5)
    expect(hoverHz(S, 40)).toBeGreaterThanOrEqual(6)
  })

  describe('over four hours on the lake', () => {
    const HOURS = 4
    const { frames, rings, sprays, calls, splashes } = record(7, 3600 * HOURS)
    const all = runs(frames)
    const plunges = all.filter(r => r.state === 'perchPlunge' || r.state === 'hoverPlunge')
    const unders = all.filter(r => r.state === 'under')

    it('does everything a kingfisher does', () => {
      for (const s of ['perch', 'peer', 'perchPlunge', 'flyout', 'hover', 'shift', 'hoverPlunge', 'under', 'emerge', 'fly', 'land', 'handle']) {
        expect(all.some(r => r.state === s), s).toBe(true)
      }
    })
    it('keeps each state as long as its settings say', () => {
      // a run's frames stop a frame short of its last moment; a run the hours cut off is left out
      const inside = (s: string, [lo, hi]: readonly [number, number], slack = 0.05) => {
        const rs = all.slice(1, -1).filter(r => r.state === s)
        expect(rs.length, s).toBeGreaterThan(0)
        for (const r of rs) {
          expect(r.seconds, `${s} at ${frames[r.from]!.t}`).toBeGreaterThanOrEqual(lo - slack)
          expect(r.seconds, `${s} at ${frames[r.from]!.t}`).toBeLessThanOrEqual(hi + slack)
        }
      }
      // a bout can follow a bout, and a quiet one runs straight on into the next
      inside('perch', [S.perch.seconds[0], Infinity])
      inside('peer', S.peer.seconds)
      inside('hover', S.hover.seconds)
      inside('shift', S.hover.shift.seconds)
      inside('under', S.under.seconds)
      inside('emerge', [S.emerge.seconds, S.emerge.seconds])
      inside('handle', S.handle.seconds)
      // the lean and the drop: from 4 m and more slowly than free fall, under 1.5 s
      inside('perchPlunge', [S.perchPlunge.lean[0], 1.5])
      // a drop of 9-12 m at 7-10 m/s
      inside('hoverPlunge', [0.8, 2.5])
      // braking to the perch, folding, and turning about on it
      inside('land', [S.land.fold[0] + S.land.about, 2.5])
    })
    it('goes from state to state as a kingfisher does', () => {
      const after: Record<string, string[]> = {
        perch: ['peer', 'flyout', 'fly'], peer: ['perchPlunge'], perchPlunge: ['under'], flyout: ['hover'], hover: ['shift', 'hoverPlunge', 'fly'],
        shift: ['hover'], hoverPlunge: ['under'], under: ['emerge'], emerge: ['fly'], fly: ['land'], land: ['perch', 'handle'], handle: ['perch'],
      }
      for (const r of all.slice(0, -1)) expect(after[r.state], `${r.state} to ${r.after}`).toContain(r.after)
    })
    it('plunges 10-15 times an hour, about two in three from the perch, and catches about half the time', () => {
      const perHour = plunges.length / HOURS
      expect(perHour).toBeGreaterThanOrEqual(10)
      expect(perHour).toBeLessThanOrEqual(15)
      const fromPerch = plunges.filter(r => r.state === 'perchPlunge').length / plunges.length
      expect(fromPerch).toBeGreaterThan(0.55)
      expect(fromPerch).toBeLessThan(0.75)
      const caught = all.filter(r => r.state === 'handle').length / unders.length
      expect(caught).toBeGreaterThan(0.3)
      expect(caught).toBeLessThan(0.7)
    })
    it('runs about four times the pace of a wintering bird: perch bouts, plunges, and flights', () => {
      const sat = all.filter(r => r.state === 'perch').reduce((n, r) => n + r.seconds, 0) / all.filter(r => r.state === 'perch' && r.before !== 'perch').length
      const realBout = (REAL_PACE.perchMinutes[0] + REAL_PACE.perchMinutes[1]) / 2 * 60
      expect(realBout / sat).toBeGreaterThan(2.5)
      expect(realBout / sat).toBeLessThan(8)
      const flights = all.filter(r => r.state === 'flyout' || r.state === 'fly').length / HOURS
      expect(flights).toBeGreaterThanOrEqual(15)
      expect(flights).toBeLessThanOrEqual(30)
      expect(flights / ((REAL_PACE.flightsPerHour[0] + REAL_PACE.flightsPerHour[1]) / 2)).toBeLessThan(6)
    })
    it('goes into the water at every plunge, deep enough by the depth bake, with one ring and one spray where it goes in', () => {
      expect(unders.length).toBe(plunges.length)
      const big = rings.filter(r => r.size === S.ring.plunge), small = rings.filter(r => r.size === S.ring.takeoff)
      expect(big).toHaveLength(unders.length)
      expect(sprays).toHaveLength(unders.length)
      expect(splashes).toHaveLength(unders.length)
      expect(big.length + small.length).toBe(rings.length)
      unders.forEach((u, i) => {
        const f = frames[u.from]!
        expect(depth.at(f.x, f.z), `plunge at ${f.t}`).toBeGreaterThanOrEqual(S.plunge.water)
        expect(sprays[i]!.x).toBeCloseTo(f.x, 6)
        expect(sprays[i]!.z).toBeCloseTo(f.z, 6)
        expect(sprays[i]!.size).toBe(1)
        expect(big[i]!.x).toBeCloseTo(f.x, 6)
        expect(Math.abs(sprays[i]!.t - f.t)).toBeLessThan(0.05)
      })
      // it comes up with a smaller ring than it went in with, one each time
      expect(small).toHaveLength(all.filter(r => r.state === 'emerge').length)
      expect(S.ring.takeoff).toBeLessThan(S.ring.plunge)
    })
    it('is hidden exactly while it is under, and the water hides it', () => {
      for (const f of frames) {
        expect(f.submerged, `${f.state} at ${f.t}`).toBe(f.state === 'under')
        if (f.state === 'under') expect(f.y).toBeLessThan(0)
        else expect(f.y).toBeGreaterThanOrEqual(-1e-9)
      }
    })
    it('shows a fish only after a catch, carries it to a perch, and swallows it there', () => {
      let holding = false
      for (const r of all) {
        const shown = frames.slice(r.from, r.to + 1).map(f => f.fish >= 0.5)
        if (r.state === 'handle') {
          expect(holding).toBe(true)
          expect(shown[0]).toBe(true)
          expect(shown.at(-1)).toBe(false)
          holding = false
          continue
        }
        if (r.state === 'under') holding = shown.at(-1)!
        else for (const s of shown) expect(s, `${r.state} at ${frames[r.from]!.t}`).toBe(holding)
        if (r.state === 'land' && holding) expect(r.after).toBe('handle')
      }
    })
    it('flies paths clear of the scene: over the water, off the reeds, the snag and the trees, never turning faster than its setting', () => {
      const [rx0, rx1, rz0, rz1] = [Math.min(...reeds.points.map(p => p[0])), Math.max(...reeds.points.map(p => p[0])), Math.min(...reeds.points.map(p => p[1])), Math.max(...reeds.points.map(p => p[1]))]
      const snagPerch = PERCHES.find(p => p.name === 'snag')!
      for (let i = 1; i < frames.length; i++) {
        const a = frames[i - 1]!, f = frames[i]!
        if (!FLYING.includes(f.state) || !FLYING.includes(a.state)) continue
        const at = `${f.state} at ${f.t.toFixed(2)} (${f.x.toFixed(1)}, ${f.y.toFixed(1)}, ${f.z.toFixed(1)})`
        // the about-turn on the perch is a hop, not flight
        const onPerch = PERCHES.some(p => Math.hypot(p.position[0] - f.x, p.position[1] - f.y, p.position[2] - f.z) < 1e-6)
        if (!onPerch) expect(Math.abs(wrapped(f.heading - a.heading)) * 30, at).toBeLessThanOrEqual(S.fly.turn + 1e-6)
        // over water all the way, but for the last metres at each perch, which stands over water itself
        if (nearestPerch(f.x, f.z) > S.fly.ends) expect(depth.at(f.x, f.z), at).toBeGreaterThanOrEqual(S.plunge.water)
        expect(f.y, at).toBeGreaterThanOrEqual(Math.max(0, surface.sample(f.x, f.z)) - 1e-9)
        const reedGap = Math.hypot(Math.max(rx0 - f.x, 0, f.x - rx1), Math.max(rz0 - f.z, 0, f.z - rz1))
        expect(reedGap, at).toBeGreaterThanOrEqual(3)
        for (const [tx, tz] of LAKE_TREES) expect(Math.hypot(f.x - tx, f.z - tz), at).toBeGreaterThan(CANOPY_REACH + 1)
        // the snag's trunk stands 1.7 m from its perch: a bird not at that perch keeps 2 m from it
        const trunk = Math.hypot(f.x - snag.position[0], f.z - snag.position[2])
        const atSnag = Math.hypot(f.x - snagPerch.position[0], f.z - snagPerch.position[2]) < S.fly.ends
        if (!atSnag) expect(trunk, at).toBeGreaterThanOrEqual(2)
        // never faster than its fastest flight
        expect(Math.hypot(f.x - a.x, f.y - a.y, f.z - a.z) * 30, at).toBeLessThanOrEqual(S.fly.speed[1] + 0.5)
      }
    })
    it('flies between perches low over the water, at the research speeds, and climbs to land', () => {
      const flights = all.filter(r => r.state === 'fly' && r.before === 'perch')
      expect(flights.length).toBeGreaterThan(10)
      for (const r of flights) {
        const fs = frames.slice(r.from, r.to + 1)
        const mid = fs[Math.floor(fs.length / 2)]!
        expect(mid.y - Math.max(0, surface.sample(mid.x, mid.z)), `at ${mid.t}`).toBeGreaterThanOrEqual(0.25)
        expect(mid.y, `at ${mid.t}`).toBeLessThanOrEqual(2)
        let fastest = 0
        for (let i = 1; i < fs.length; i++) fastest = Math.max(fastest, Math.hypot(fs[i]!.x - fs[i - 1]!.x, fs[i]!.z - fs[i - 1]!.z) * 30)
        expect(fastest).toBeGreaterThanOrEqual(7)
        expect(fastest).toBeLessThanOrEqual(S.fly.speed[1] + 0.5)
      }
    })
    it('hovers 9-12 m up over plunging water, 15-40 m out from a perch, still, facing into the wind, tilted up with its tail fanned', () => {
      const into = Math.atan2(WIND.dirZ, -WIND.dirX)
      const hovers = all.filter(r => r.state === 'hover')
      expect(hovers.length).toBeGreaterThan(5)
      for (const r of hovers) {
        const fs = frames.slice(r.from, r.to + 1)
        const f = fs[0]!
        expect(f.y).toBeGreaterThanOrEqual(S.hover.height[0] - 1e-9)
        expect(f.y).toBeLessThanOrEqual(S.hover.height[1] + 1e-9)
        expect(depth.at(f.x, f.z)).toBeGreaterThanOrEqual(S.plunge.water)
        expect(nearestPerch(f.x, f.z)).toBeLessThanOrEqual(S.flyout.metres[1] + 1e-6)
        for (const g of fs) {
          // the head holds within 5 mm: the body under it doesn't wander
          expect(Math.hypot(g.x - f.x, g.y - f.y, g.z - f.z)).toBeLessThan(0.005)
          expect(Math.abs(wrapped(g.heading - into))).toBeLessThan(1e-6)
        }
        const settled = fs.at(-1)!
        expect(settled.lean).toBeCloseTo(PITCH - S.hover.body, 1)
        expect(settled.stroke).toBeGreaterThan(0.95)
        expect(settled.fan).toBeCloseTo(S.hover.tail, 1)
      }
      const fromPerch = all.filter(r => r.state === 'flyout').map(r => frames[r.from]!)
      for (const f of fromPerch) {
        const end = frames[all.find(r => r.state === 'hover' && r.from > frames.indexOf(f))!.from]!
        const d = Math.hypot(end.x - f.x, end.z - f.z)
        expect(d).toBeGreaterThanOrEqual(S.flyout.metres[0] - 1.5)
        expect(d).toBeLessThanOrEqual(S.flyout.metres[1] + 1.5)
      }
    })
    it('rattles as it moves between perches, as it lands now and then, at some plunges, and from a quiet perch', () => {
      const moves = all.filter(r => r.state === 'fly' && r.before === 'perch')
      const called = moves.filter(r => calls.some(c => Math.abs(c.t - frames[r.from]!.t) < 0.05)).length / moves.length
      expect(called).toBeGreaterThan(S.rattle.move - 0.2)
      expect(called).toBeLessThanOrEqual(1)
      const perHour = calls.length / HOURS
      // moves 0.8, flyouts 0.3, landings 0.3, plunges 0.1 and catches 0.2, and a quiet perch's every 3-8 minutes
      expect(perHour).toBeGreaterThan(15)
      expect(perHour).toBeLessThan(40)
      for (const c of calls) expect(c.state).not.toBe('under')
    })
  })

  it('plunges into the water as the research has it: from a perch at 4-9 m/s, 35-75 degrees down, from a hover at 6-11 m/s, 70-90 down, its wings closed', () => {
    let seen = { perch: 0, hover: 0 }
    for (const seed of [3, 4]) {
      const { frames } = record(seed, 3600, 60)
      for (let i = 2; i < frames.length; i++) {
        if (frames[i]!.state !== 'under' || frames[i - 1]!.state === 'under') continue
        const a = frames[i - 2]!, b = frames[i - 1]!
        const vh = Math.hypot(b.x - a.x, b.z - a.z) * 60, vy = (a.y - b.y) * 60
        const speed = Math.hypot(vh, vy), angle = (Math.atan2(vy, vh) * 180) / Math.PI
        const [lo, hi, alo, ahi] = b.state === 'perchPlunge' ? [4, 9, 35, 75] : [6, 11, 70, 90]
        expect(speed, `${b.state} at ${b.t}`).toBeGreaterThanOrEqual(lo)
        expect(speed, `${b.state} at ${b.t}`).toBeLessThanOrEqual(hi)
        expect(angle, `${b.state} at ${b.t}`).toBeGreaterThanOrEqual(alo)
        expect(angle, `${b.state} at ${b.t}`).toBeLessThanOrEqual(ahi)
        expect(b.spread, `${b.state} at ${b.t}`).toBeLessThan(0.05)
        seen = { ...seen, [b.state === 'perchPlunge' ? 'perch' : 'hover']: seen[b.state === 'perchPlunge' ? 'perch' : 'hover'] + 1 }
      }
    }
    expect(seen.perch).toBeGreaterThan(5)
    expect(seen.hover).toBeGreaterThan(2)
  })

  it('never snaps: at 60 fps every pose value moves no further a frame than its easing allows', () => {
    const { frames } = record(11, 1800, 60)
    const R = KINGFISHER_RATES, dt = 1 / 60, eps = 1e-9
    const checks: [keyof Frame, number][] = [
      ['lean', R.lean], ['roll', R.roll], ['pitch', R.headPitch], ['yaw', R.headYaw], ['neck', R.neck], ['spread', R.wingSpread],
      ['stroke', R.wingStroke], ['glide', R.glide], ['legs', R.legsUp], ['fan', R.tailSpread], ['tilt', R.tailTilt], ['crest', R.crestRaise],
      ['turn', R.fishTurn],
    ]
    let swallowed = 0
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1]!, b = frames[i]!
      // under the water the bird is hidden, and comes up already in its rising pose
      if (a.submerged || b.submerged) continue
      for (const [k, rate] of checks) expect(Math.abs((b[k] as number) - (a[k] as number)), `${k} in ${b.state} at ${b.t}`).toBeLessThanOrEqual(rate * dt + eps)
      // a beat never has fewer than six frames
      expect(((b.phase - a.phase) % 1 + 1) % 1, `wingPhase at ${b.t}`).toBeLessThanOrEqual(1 / 6 + eps)
      // the fish goes only down the throat, in the swallow
      if (a.fish !== b.fish) { expect(b.state).toBe('handle'); expect(b.fish).toBe(0); swallowed++ }
      // it moves no faster than it flies
      expect(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / dt, `position in ${b.state} at ${b.t}`).toBeLessThanOrEqual(S.fly.speed[1] + 0.5)
    }
    expect(swallowed).toBeGreaterThan(0)
  })

  it('holds every beat to six frames or more, even when the frame rate drops', () => {
    const c = createKingfisher(ctxFor(5), 0, 0)
    const pose = defaultPose()
    let prev = pose.wingPhase, flapped = false
    for (let i = 0; i < 20 * 3600; i++) {
      c.update(1 / 20, pose)
      const step = ((pose.wingPhase - prev) % 1 + 1) % 1
      expect(step).toBeLessThanOrEqual(1 / 6 + 1e-9)
      if (step > 0) flapped = true
      prev = pose.wingPhase
    }
    expect(flapped).toBe(true)
  })

  it('works its perches on any lake: with water everywhere, it keeps to its own settings and never leaves the perches far behind', () => {
    const c = createKingfisher(ctxFor(9, { ground: () => -1 }), 0, 0)
    const pose = defaultPose()
    const reach = S.flyout.metres[1] + 20
    for (let i = 0; i < 30 * 3600; i++) {
      c.update(1 / 30, pose)
      expect(nearestPerch(c.x, c.z)).toBeLessThan(reach)
    }
  })

  it("takes the perches' own facing, whichever way each looks", () => {
    const turned: Perch[] = PERCHES.map(p => ({ ...p, heading: p.heading + 0.3 }))
    const c = createKingfisher(ctxFor(2, { perches: turned }), 0, 0)
    c.update(1 / 30, defaultPose())
    expect(c.heading).toBeCloseTo(turned[0]!.heading, 9)
  })
})
