import * as THREE from 'three'
import { lakeHeightfield } from './heightfield'
import { terrainSurface } from './terrain'
import { Wind } from './wind'
import { leafSway } from './vegetation'
import { LEAVES } from './reedbed'
import {
  BED, CATTAIL, SWAY, TULE, TULE_HOLD, PART, bendVertex, cattailShare, createStemField, glslFloat, inBand, layoutStems,
  shapeOf, stemDims, stemFrequency, stemGLSL, tuleShare, type Stem, type StemField,
} from './stems'

const hf = lakeHeightfield(7)
const surface = terrainSurface(hf)
const ground = (x: number, z: number) => surface.sample(x, z)
const stems = layoutStems({ heightfield: hf, ground, seed: 11 })
const cattails = stems.filter(s => s.kind === 'cattail')
const tules = stems.filter(s => s.kind === 'tule')
const singer = cattails[0]!
const MALE = 0.065, FEMALE = 0.042

const still = () => new Wind({ direction: 0, strength: 0, gustiness: 0, seed: 1 })
const sceneWind = () => new Wind({ direction: 240, strength: 0.35, gustiness: 0.5, seed: 7 })

/** steps the field and its wind `seconds` at 60 fps, calling `each` after every frame */
function run(field: StemField, wind: Wind, seconds: number, each?: (t: number) => void): void {
  const dt = 1 / 60
  for (let i = 1; i <= Math.round(seconds * 60); i++) {
    wind.update(dt)
    field.update(dt, wind)
    each?.(i * dt)
  }
}

/** the unit direction of a stem's rest lean, which a bird's weight bends it along, and the one across it */
function leanAxes(s: Stem) {
  const l = Math.hypot(s.lean.x, s.lean.z)
  return { along: { x: s.lean.x / l, z: s.lean.z / l }, across: { x: -s.lean.z / l, z: s.lean.x / l } }
}

/** the top's displacement from its rest along a direction */
function moved(field: StemField, s: Stem, dir: { x: number; z: number }): number {
  const d = field.displacement(s)
  return (d.x - s.lean.x) * dir.x + (d.z - s.lean.z) * dir.z
}

/** the frequency of a sampled oscillation about zero, from its upward zero crossings */
function frequency(samples: { t: number; v: number }[]): number {
  const ups: number[] = []
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!, b = samples[i]!
    if (a.v < 0 && b.v >= 0) ups.push(a.t + (b.t - a.t) * (-a.v / (b.v - a.v)))
  }
  expect(ups.length).toBeGreaterThanOrEqual(3)
  return (ups.length - 1) / (ups[ups.length - 1]! - ups[0]!)
}

/** the peaks of a sampled oscillation's positive swings */
function peaks(samples: { t: number; v: number }[]): number[] {
  const out: number[] = []
  for (let i = 1; i + 1 < samples.length; i++) {
    const v = samples[i]!.v
    if (v > 0 && v >= samples[i - 1]!.v && v > samples[i + 1]!.v) out.push(v)
  }
  return out
}

describe('the stems\' layout', () => {
  it('stands every stem in the bed, where the leaves grow, on the ground under it', () => {
    const [x0, x1, z0, z1] = BED.bounds
    for (const s of stems) {
      expect(s.x).toBeGreaterThanOrEqual(x0)
      expect(s.x).toBeLessThanOrEqual(x1)
      expect(s.z).toBeGreaterThanOrEqual(z0)
      expect(s.z).toBeLessThanOrEqual(z1)
      expect(inBand(hf, s.x, s.z)).toBe(true)
      expect(s.base).toBe(ground(s.x, s.z))
    }
    stems.forEach((s, i) => expect(s.index).toBe(i))
  })

  it('tops every cattail\'s spike at 1.85-2.0 m above its base, 5-25 cm long and 24-36 mm thick, a bare axis 5-15 cm x 2-3 mm above it', () => {
    for (const s of cattails) {
      const sp = s.spike!
      expect(sp.top).toBe(s.height)
      expect(s.height).toBeGreaterThanOrEqual(1.85)
      expect(s.height).toBeLessThanOrEqual(2.0)
      expect(sp.top - sp.bottom).toBeGreaterThanOrEqual(0.05)
      expect(sp.top - sp.bottom).toBeLessThanOrEqual(0.25)
      expect(2 * sp.radius).toBeGreaterThanOrEqual(0.024)
      expect(2 * sp.radius).toBeLessThanOrEqual(0.036)
      expect(sp.axisTop - sp.top).toBeGreaterThanOrEqual(0.05)
      expect(sp.axisTop - sp.top).toBeLessThanOrEqual(0.15)
      expect(2 * sp.axisRadius).toBeGreaterThanOrEqual(0.002)
      expect(2 * sp.axisRadius).toBeLessThanOrEqual(0.003)
    }
    const lengths = cattails.map(s => s.spike!.top - s.spike!.bottom)
    expect(lengths.reduce((a, v) => a + v, 0) / lengths.length).toBeCloseTo(0.15, 1)
  })

  it('tapers each stalk from 16 mm at the base to 5-7 mm under the spike', () => {
    for (const s of cattails) {
      expect(2 * s.radiusAt(0)).toBeCloseTo(0.016, 6)
      expect(2 * s.radiusAt(1.0)).toBeCloseTo(0.010, 6)
      const under = 2 * s.radiusAt(s.spike!.bottom)
      expect(under).toBeGreaterThanOrEqual(0.005)
      expect(under).toBeLessThanOrEqual(0.007)
      expect(s.radiusAt(s.spike!.axisTop - 0.01)).toBe(s.spike!.axisRadius)
    }
  })

  it('bursts about one spike in seven into cotton', () => {
    const burst = cattails.filter(s => stemDims(s).tone[1] > 0.75).length / cattails.length
    expect(burst).toBeGreaterThan(0.08)
    expect(burst).toBeLessThan(0.22)
  })

  it('lays out a few hundred flowering stalks, 2-6 a square metre of cattail, and the tules denser', () => {
    let cattailArea = 0, tuleArea = 0
    const [x0, x1, z0, z1] = BED.bounds, step = 0.1
    for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) {
      if (!inBand(hf, x, z)) continue
      cattailArea += cattailShare(ground(x, z)) * step * step
      tuleArea += tuleShare(ground(x, z)) * step * step
    }
    expect(cattails.length).toBeGreaterThan(150)
    expect(cattails.length).toBeLessThan(400)
    expect(cattails.length / cattailArea).toBeGreaterThanOrEqual(2)
    expect(cattails.length / cattailArea).toBeLessThanOrEqual(6)
    expect(tules.length / tuleArea).toBeGreaterThan(cattails.length / cattailArea)
  })

  it('stands the tules only on the water side, in water at least 15 cm deep, culms 1.8-2.5 m tapering from 15 to 5 mm', () => {
    expect(tules.length).toBeGreaterThan(100)
    const meanZ = (list: Stem[]) => list.reduce((a, s) => a + s.z, 0) / list.length
    expect(meanZ(tules)).toBeLessThan(meanZ(cattails) - 1.5)
    for (const s of tules) {
      expect(s.base).toBeLessThanOrEqual(BED.tule[0])
      expect(s.base).toBeLessThan(0)
      expect(s.height).toBeGreaterThanOrEqual(1.8)
      expect(s.height).toBeLessThanOrEqual(2.5)
      expect(s.spike).toBeUndefined()
      expect(2 * s.radiusAt(0)).toBeCloseTo(0.015, 6)
      expect(2 * s.radiusAt(stemDims(s).hs)).toBeCloseTo(0.005, 6)
    }
  })

  it('holds a tule only between 0.6 and 1.2 m, a range above the water for every tule', () => {
    expect(TULE_HOLD).toEqual([0.6, 1.2])
    for (const s of tules) expect(s.base + TULE_HOLD[0]).toBeGreaterThan(-0.02)
  })

  it('puts the singer\'s stalk within 0.3 m of the old reed-perch point (-8, -5), first in the list', () => {
    const near = createStemField(stems).near(-8, -5, 0.3)
    expect(near[0]).toBe(singer)
    expect(singer.kind).toBe('cattail')
    expect(Math.hypot(singer.x + 8, singer.z + 5)).toBeLessThanOrEqual(0.3)
    expect(singer.height).toBe(2.0)
    // the ground there is the rim of the lake's basin, 0.7 m above the water: the spike's top stands at about 2.7 m
    expect(singer.base + singer.height).toBeGreaterThan(2.5)
    expect(singer.base + singer.height).toBeLessThan(2.9)
  })

  it('is the same from the same seed', () => {
    const again = layoutStems({ heightfield: hf, ground, seed: 11 })
    expect(again.map(s => [s.x, s.z, s.height])).toEqual(stems.map(s => [s.x, s.z, s.height]))
  })

  it('keeps stems apart', () => {
    const field = createStemField(stems)
    for (const s of stems) {
      for (const o of field.near(s.x, s.z, BED.spacing.mixed)) {
        if (o === s) continue
        expect(o.kind === s.kind ? Math.hypot(o.x - s.x, o.z - s.z) >= BED.spacing[s.kind] : true).toBe(true)
      }
    }
  })
})

describe('the field\'s queries', () => {
  it('finds the stems near a point, nearest first', () => {
    const field = createStemField(stems)
    const found = field.near(-10, -8, 1)
    expect(found.length).toBeGreaterThan(5)
    const d = found.map(s => Math.hypot(s.x + 10, s.z + 8))
    for (let i = 1; i < d.length; i++) expect(d[i]!).toBeGreaterThanOrEqual(d[i - 1]!)
    expect(d[d.length - 1]!).toBeLessThanOrEqual(1)
    const all = stems.filter(s => Math.hypot(s.x + 10, s.z + 8) <= 1)
    expect(found.length).toBe(all.length)
  })

  it('stands an unloaded stem in still air at its base, leaning its rest lean, its axis a unit vector up it', () => {
    const field = createStemField(stems)
    run(field, still(), 0.1)
    for (const s of [singer, tules[0]!]) {
      const base = field.pointAt(s, 0)
      expect(base.x).toBeCloseTo(s.x, 9)
      expect(base.y).toBeCloseTo(s.base, 9)
      expect(base.z).toBeCloseTo(s.z, 9)
      const d = field.displacement(s)
      expect(d.x).toBeCloseTo(s.lean.x, 6)
      expect(d.z).toBeCloseTo(s.lean.z, 6)
      const lean = Math.atan(Math.hypot(s.lean.x, s.lean.z) / s.height)
      expect(lean).toBeGreaterThanOrEqual(SWAY.restLean[0] - 1e-9)
      expect(lean).toBeLessThanOrEqual(SWAY.restLean[1] + 1e-9)
      const top = field.pointAt(s, s.height)
      expect(top.x - s.x).toBeCloseTo(d.x, 9)
      expect(top.z - s.z).toBeCloseTo(d.z, 9)
      expect(field.axisAt(s, 1).length()).toBeCloseTo(1, 9)
      expect(field.axisAt(s, 0).y).toBeCloseTo(1, 9)
    }
  })

  it('keeps the stem\'s length as it bends: the axis\'s arc from the base to h is h, to a millimetre', () => {
    const field = createStemField(stems)
    field.hold(singer, MALE, singer.height, 0.5, 0)
    run(field, sceneWind(), 4)
    const a = new THREE.Vector3(), b = new THREE.Vector3()
    let arc = 0
    const n = 400, top = singer.spike!.axisTop
    for (let i = 0; i < n; i++) {
      field.pointAt(singer, top * i / n, a)
      field.pointAt(singer, top * (i + 1) / n, b)
      arc += a.distanceTo(b)
    }
    expect(Math.abs(arc - top)).toBeLessThan(0.001)
  })

  it('points the axis along the stem: the tangent of pointAt', () => {
    const field = createStemField(stems)
    field.hold(singer, MALE, singer.height, 0.5, 0)
    run(field, sceneWind(), 3)
    for (const h of [0.2, 1, 1.5, 1.9, 2.05]) {
      const t = field.pointAt(singer, h + 1e-4).sub(field.pointAt(singer, h - 1e-4)).normalize()
      expect(field.axisAt(singer, h).dot(t)).toBeGreaterThan(1 - 1e-6)
    }
  })
})

describe('the shape', () => {
  it('is clamped at the bed and reaches the top: φ(0) = 0, φ\'(0) = 0, φ(1) = 1, rising all the way', () => {
    for (const kind of ['cattail', 'tule'] as const) {
      const shape = shapeOf(kind)
      expect(shape.phi(0)).toBe(0)
      expect(shape.dphi(0)).toBe(0)
      expect(shape.phi(1)).toBeCloseTo(1, 12)
      for (let s = 0.01; s <= 1; s += 0.01) expect(shape.dphi(s)).toBeGreaterThan(0)
      // the drop's integral is φ' squared's
      let psi = 0
      for (let i = 0; i < 1000; i++) psi += shape.dphi((i + 0.5) / 1000) ** 2 / 1000
      expect(shape.psi(1)).toBeCloseTo(psi, 5)
    }
  })

  it('bends a cattail stalk as research 5.6\'s tapered stalk bends under a load at its top, to within 0.005', () => {
    // 16 mm at the base, 10 mm at 1.0 m, 5 mm at the top of a 1.925 m stalk: curvature P (H - z) / EI(z), EI as d⁴
    const H = 1.925, n = 4000
    const d = (z: number) => z < 1 ? 0.016 - 0.006 * z : 0.010 - 0.005 * (z - 1) / (H - 1)
    const w: number[] = [0]
    let slope = 0, defl = 0
    for (let i = 0; i < n; i++) {
      const z = (i + 0.5) * H / n
      const s0 = slope
      slope += (H - z) / d(z) ** 4 * H / n
      defl += (s0 + slope) / 2 * H / n
      w.push(defl)
    }
    const shape = CATTAIL.shape
    for (let i = 0; i <= n; i += 40) expect(Math.abs(shape.phi(i / n) - w[i]! / defl)).toBeLessThan(0.005)
  })

  it('is the shader\'s: stemGLSL carries the same coefficients and sizes', () => {
    for (const kind of ['cattail', 'tule'] as const) {
      const glsl = stemGLSL(kind), shape = shapeOf(kind)
      for (const c of shape.c) expect(glsl).toContain(glslFloat(c))
      expect(glsl).toContain(glslFloat(shape.slope))
      expect(glsl).toContain(glslFloat(shape.psiTop))
      expect(glsl).toContain('void stemBend()')
    }
    expect(stemGLSL('cattail')).toContain(glslFloat(CATTAIL.diameter.mid / 2))
  })
})

describe('the shader\'s bend', () => {
  /** a loaded cattail and tule swaying in the scene's wind */
  function swaying() {
    const field = createStemField(stems)
    const tule = tules[5]!
    field.hold(singer, MALE, singer.height, 0.4, -0.2)
    field.hold(tule, FEMALE, 1.0, -0.3, 0.1)
    run(field, sceneWind(), 6)
    return { field, tule }
  }

  it('and pointAt agree to within 1 mm at every height, for a loaded, swaying stem', () => {
    const { field, tule } = swaying()
    const p = new THREE.Vector3(), q = new THREE.Vector3()
    for (const s of [singer, tule]) {
      const d = stemDims(s), u = field.displacement(s)
      const parts: [number, (sigma: number) => number][] = s.kind === 'cattail'
        ? [[PART.stalk, g => g * d.hs], [PART.spike, g => d.hs + (d.H - d.hs) * g], [PART.axis, g => d.H + (d.axisTop - d.H) * g]]
        : [[PART.stalk, g => g * d.H]]
      for (const [part, height] of parts) {
        for (let i = 0; i <= 200; i++) {
          const sigma = i / 200
          bendVertex(d, s.x, s.base, s.z, part, 0, sigma, 0, u.x, u.z, p)
          field.pointAt(s, height(sigma), q)
          expect(p.distanceTo(q)).toBeLessThan(0.001)
        }
      }
    }
  })

  it('rings each part round its axis, square to it, at its radius', () => {
    const { field, tule } = swaying()
    const p = new THREE.Vector3(), c = new THREE.Vector3(), t = new THREE.Vector3()
    for (const s of [singer, tule]) {
      const d = stemDims(s), u = field.displacement(s)
      for (const sigma of [0, 0.3, 0.9, 1]) {
        const h = s.kind === 'cattail' ? sigma * d.hs : sigma * d.H
        field.pointAt(s, h, c)
        field.axisAt(s, h, t)
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * Math.PI * 2
          bendVertex(d, s.x, s.base, s.z, PART.stalk, Math.cos(a), sigma, Math.sin(a), u.x, u.z, p)
          p.sub(c)
          expect(p.length()).toBeCloseTo(s.radiusAt(h), 6)
          expect(Math.abs(p.dot(t))).toBeLessThan(1e-6)
        }
      }
    }
  })

  it('hangs a tule\'s spikelets from its culm where its bract begins, swaying with it', () => {
    const { field, tule } = swaying()
    const d = stemDims(tule), u = field.displacement(tule)
    const at = field.pointAt(tule, d.hs)
    const p = bendVertex(d, tule.x, tule.base, tule.z, PART.cluster, 0, 0, 0, u.x, u.z, new THREE.Vector3())
    expect(p.distanceTo(at)).toBeLessThan(1e-9)
    const out = bendVertex(d, tule.x, tule.base, tule.z, PART.cluster, 0.03, 0.02, 0, u.x, u.z, new THREE.Vector3())
    expect(out.distanceTo(at)).toBeCloseTo(Math.hypot(0.03, 0.02) * d.rHead, 6)
  })
})

describe('the sway', () => {
  it('sways a stalk alone at 1.0-2.0 Hz: freed of a bird it springs back and swings on its own', () => {
    for (const s of [singer, cattails[40]!, cattails[120]!]) {
      const field = createStemField(stems), wind = still()
      const id = field.hold(s, MALE, s.height)
      run(field, wind, 8)
      field.release(id)
      const { along } = leanAxes(s)
      const samples: { t: number; v: number }[] = []
      run(field, wind, 5, t => samples.push({ t, v: moved(field, s, along) }))
      const f = frequency(samples)
      expect(f).toBeGreaterThanOrEqual(1.0)
      expect(f).toBeLessThanOrEqual(2.0)
      // the damped frequency of its own mass and stiffness
      expect(Math.abs(f / (stemFrequency(s) * Math.sqrt(1 - SWAY.damping ** 2)) - 1)).toBeLessThan(0.02)
    }
  })

  it('sways a stalk with a male on top at 0.4-0.8 Hz, and a female near 0.7 Hz', () => {
    for (const s of [singer, cattails[40]!, cattails[120]!]) {
      for (const [mass, lo, hi] of [[MALE, 0.4, 0.8], [FEMALE, 0.55, 0.9]] as const) {
        const field = createStemField(stems), wind = still()
        const { across } = leanAxes(s)
        // landing across the lean, the swing across it is free of the dip's settling
        field.hold(s, mass, s.height, across.x * 0.4, across.z * 0.4)
        const samples: { t: number; v: number }[] = []
        run(field, wind, 8, t => samples.push({ t, v: moved(field, s, across) }))
        const f = frequency(samples)
        expect(f).toBeGreaterThanOrEqual(lo)
        expect(f).toBeLessThanOrEqual(hi)
      }
    }
  })

  it('damps a swing to 0.05-0.2 of the first after 3 cycles', () => {
    const field = createStemField(stems), wind = still()
    const { across } = leanAxes(singer)
    field.hold(singer, MALE, singer.height, across.x * 0.5, across.z * 0.5)
    const samples: { t: number; v: number }[] = []
    run(field, wind, 10, t => samples.push({ t, v: moved(field, singer, across) }))
    const p = peaks(samples)
    expect(p.length).toBeGreaterThanOrEqual(4)
    const ratio = p[3]! / p[0]!
    expect(ratio).toBeGreaterThanOrEqual(0.05)
    expect(ratio).toBeLessThanOrEqual(0.2)
  })

  it('loads a stalk less from lower down: a bird at 1.4 m slows it to about 1 Hz, not 0.55', () => {
    for (const s of [singer, cattails[40]!]) {
      expect(stemFrequency(s, MALE, 1.4)).toBeGreaterThan(0.85)
      expect(stemFrequency(s, MALE, 1.4)).toBeLessThan(1.35)
      expect(stemFrequency(s, FEMALE, 1.4)).toBeGreaterThan(stemFrequency(s, MALE, 1.4))
      expect(stemFrequency(s, MALE, 1.4)).toBeGreaterThan(stemFrequency(s, MALE, s.height))
    }
  })

  it('dips a stalk 5 cm under a female and 9 cm under a male on its top, and 1-2 cm at 1.4 m, along its lean', () => {
    const dip = (s: Stem, mass: number, h: number) => {
      const field = createStemField(stems), wind = still()
      run(field, wind, 0.1)
      const before = field.pointAt(s, h).clone()
      field.hold(s, mass, h)
      run(field, wind, 12)
      const grip = field.pointAt(s, h)
      const { along } = leanAxes(s)
      // down and away, along its lean
      expect(grip.y).toBeLessThan(before.y)
      expect(moved(field, s, along)).toBeGreaterThan(0)
      return Math.hypot(grip.x - before.x, grip.z - before.z)
    }
    for (const s of [singer, cattails[40]!, cattails[120]!]) {
      const female = dip(s, FEMALE, s.height), male = dip(s, MALE, s.height)
      expect(female).toBeGreaterThan(0.04)
      expect(female).toBeLessThan(0.065)
      expect(male).toBeGreaterThan(0.075)
      expect(male).toBeLessThan(0.11)
      const low = dip(s, MALE, 1.4)
      expect(low).toBeGreaterThan(0.007)
      expect(low).toBeLessThan(0.02)
    }
  })

  it('swings a stalk\'s top 3-15 cm under a male landing at 0.25-0.5 m/s, then settles within 1 cm of its dip in 6 s', () => {
    for (const v of [0.25, 0.5]) {
      for (const dir of ['along', 'across'] as const) {
        const field = createStemField(stems), wind = still()
        run(field, wind, 0.1)
        const d0 = field.displacement(singer)
        const axis = leanAxes(singer)[dir]
        field.hold(singer, MALE, singer.height, axis.x * v, axis.z * v)
        let swing = 0, first = 0
        const track: { t: number; x: number; z: number }[] = []
        run(field, wind, 12, t => {
          const d = field.displacement(singer)
          const m = Math.hypot(d.x - d0.x, d.z - d0.z)
          swing = Math.max(swing, m)
          if (t <= 0.8) first = Math.max(first, m)
          track.push({ t, x: d.x, z: d.z })
        })
        expect(swing).toBeGreaterThanOrEqual(0.03)
        expect(swing).toBeLessThanOrEqual(0.15)
        // the momentum's swing, before the weight has settled: 5-11 cm in the research (6.5)
        expect(first).toBeGreaterThan(v * 0.15)
        expect(first).toBeLessThan(v * 0.25)
        const end = track[track.length - 1]!
        for (const p of track) if (p.t >= 6) expect(Math.hypot(p.x - end.x, p.z - end.z)).toBeLessThan(0.01)
      }
    }
  })

  it('springs the top back past upright when a bird takes off', () => {
    for (const [s, h] of [[singer, singer.height], [cattails[40]!, 1.4], [tules[5]!, 1.1]] as const) {
      const field = createStemField(stems), wind = still()
      const id = field.hold(s, MALE, h)
      run(field, wind, 12)
      const dipped = moved(field, s, leanAxes(s).along)
      field.release(id, 2, 1)
      let back = 0
      run(field, wind, 3, () => { back = Math.min(back, moved(field, s, leanAxes(s).along)) })
      // past its rest by about half its dip or more (a damping ratio of 0.12 returns 0.69 of it)
      expect(back).toBeLessThan(-0.5 * dipped)
    }
  })

  it('moves a tule held 0.9-1.2 m up 1-5 cm under a landing bird, and a cattail held at 1.4 m less than at its top', () => {
    const grip = (s: Stem, h: number, v: number) => {
      const field = createStemField(stems), wind = still()
      run(field, wind, 0.1)
      const before = field.pointAt(s, h).clone()
      const { across } = leanAxes(s)
      field.hold(s, MALE, h, across.x * v, across.z * v)
      let most = 0
      run(field, wind, 8, () => { most = Math.max(most, field.pointAt(s, h).distanceTo(before)) })
      return most
    }
    for (const s of [tules[5]!, tules[60]!]) {
      for (const h of [0.9, 1.2]) {
        const m = grip(s, h, 0.4)
        expect(m).toBeGreaterThanOrEqual(0.01)
        expect(m).toBeLessThanOrEqual(0.05)
      }
    }
    expect(grip(singer, 1.4, 0.4)).toBeLessThan(grip(singer, singer.height, 0.4))
  })

  it('climbing moves the load: a bird moved from the top to 1.4 m dips the stalk less', () => {
    const field = createStemField(stems), wind = still()
    const id = field.hold(singer, MALE, singer.height)
    run(field, wind, 12)
    const top = moved(field, singer, leanAxes(singer).along)
    field.move(id, 1.4)
    run(field, wind, 12)
    const low = moved(field, singer, leanAxes(singer).along)
    expect(low).toBeLessThan(top / 2)
    expect(low).toBeGreaterThan(0)
  })

  it('carries two birds on one stem, and three, without breaking, and stands back up when they leave', () => {
    const field = createStemField(stems), wind = sceneWind()
    run(field, wind, 1)
    const ids = [field.hold(singer, MALE, singer.height, 0.5, 0), field.hold(singer, MALE, singer.height - 0.05, -0.4, 0.3)]
    run(field, wind, 10, () => {
      const d = field.displacement(singer)
      expect(Number.isFinite(d.x) && Number.isFinite(d.z)).toBe(true)
      expect(Math.hypot(d.x, d.z)).toBeLessThanOrEqual(SWAY.maxLean * singer.height + 1e-9)
    })
    ids.push(field.hold(singer, FEMALE, 1.6, 0, 0.5))
    run(field, wind, 10, () => {
      const d = field.displacement(singer)
      expect(Math.hypot(d.x, d.z)).toBeLessThanOrEqual(SWAY.maxLean * singer.height + 1e-9)
      const top = field.pointAt(singer, singer.height)
      expect(top.y).toBeGreaterThan(singer.base + 0.5 * singer.height)
      expect(field.axisAt(singer, singer.height).y).toBeGreaterThan(0)
    })
    for (const id of ids) field.release(id, 1, 0)
    // letting go twice does nothing more
    field.release(ids[0]!)
    run(field, wind, 15)
    // as a stem no bird ever held, at the same moment in the same wind
    const settled = createStemField(stems), w2 = sceneWind()
    run(settled, w2, 36)
    const a = field.displacement(singer), b = settled.displacement(singer)
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeLessThan(0.01)
  })

  it('is stepped exactly: the sway is the same at any frame time up to 0.05 s', () => {
    const at = (dt: number) => {
      const field = createStemField(stems), wind = still()
      const { across } = leanAxes(singer)
      field.hold(singer, MALE, singer.height, across.x * 0.5, across.z * 0.5)
      for (let i = 0; i < Math.round(2.4 / dt); i++) { wind.update(dt); field.update(dt, wind) }
      return moved(field, singer, across)
    }
    const fine = at(1 / 240)
    expect(at(1 / 60)).toBeCloseTo(fine, 3)
    expect(at(0.05)).toBeCloseTo(fine, 3)
  })
})

describe('the wind on the stems', () => {
  it('leans a stalk\'s top no more than 6 cm in the scene\'s wind, about 2 cm on average, and less than half the leaves\' lean at the same height', () => {
    const field = createStemField(stems), wind = sceneWind()
    const watched = [singer, ...cattails.filter((_, i) => i % 20 === 7)]
    let most = 0, sum = 0, n = 0
    run(field, wind, 180, t => {
      if (t < 2) return
      for (const s of watched) {
        const d = field.displacement(s)
        const lean = Math.hypot(d.x - s.lean.x, d.z - s.lean.z)
        most = Math.max(most, lean)
        sum += lean
        n++
        // a leaf standing beside it, as tall as the tallest, at the stalk's top's height
        const leafLength = LEAVES.height[1]
        const leaf = leafSway(s.height / leafLength, leafLength, s.x, s.z, 0.7, 1.3, wind.state)
        expect(lean).toBeLessThan(0.5 * Math.hypot(leaf.x, leaf.z))
      }
    })
    expect(most).toBeLessThanOrEqual(0.06)
    expect(sum / n).toBeGreaterThan(0.01)
    expect(sum / n).toBeLessThan(0.03)
  })

  it('leans the stalks downwind, in step with the gust front across the bed', () => {
    const field = createStemField(stems), wind = sceneWind()
    run(field, wind, 30)
    let downwind = 0
    for (const s of cattails) {
      const d = field.displacement(s)
      downwind += (d.x - s.lean.x) * wind.state.dir.x + (d.z - s.lean.z) * wind.state.dir.y
    }
    expect(downwind / cattails.length).toBeGreaterThan(0.005)
  })

  it('sways each stem at its own frequency in the turbulence', () => {
    const field = createStemField(stems), wind = sceneWind()
    run(field, wind, 5)
    const { across } = leanAxes(singer)
    const samples: { t: number; v: number }[] = []
    run(field, wind, 40, t => samples.push({ t, v: moved(field, singer, across) }))
    // less its slow drift with the gusts: its mean over the second round each sample
    const w = 30
    const quick = samples.slice(w, samples.length - w).map((p, i) => {
      let m = 0
      for (let j = i; j <= i + 2 * w; j++) m += samples[j]!.v
      return { t: p.t, v: p.v - m / (2 * w + 1) }
    })
    const f = frequency(quick)
    expect(f).toBeGreaterThan(0.7 * stemFrequency(singer))
    expect(f).toBeLessThan(1.3 * stemFrequency(singer))
  })

  it('steps every stem in well under a millisecond a frame', () => {
    const field = createStemField(stems), wind = sceneWind()
    run(field, wind, 1)
    const t0 = performance.now()
    run(field, wind, 5)
    expect((performance.now() - t0) / 300).toBeLessThan(1)
  })
})

describe('TULE', () => {
  it('sways an unloaded culm at about 1-2 Hz, and a bird held at 1.2 m slows it least below 0.7 Hz', () => {
    for (const s of tules.slice(0, 40)) {
      expect(stemFrequency(s)).toBeGreaterThan(0.9)
      expect(stemFrequency(s)).toBeLessThan(2.2)
      expect(stemFrequency(s, MALE, TULE.hold[1])).toBeGreaterThan(0.7)
    }
  })
})
