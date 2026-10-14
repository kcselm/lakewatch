import * as THREE from 'three'
import { SplashBuffer, SPRAY, MAX_SPRAYS, MIN_DROP_PX, foamAt, sprayLife, dropletPixels, pixelsPerRadian, createSplash } from './splash'
import { NO_REFLECT } from './mirror'
import { paletteFor } from './palette'
import { Wind } from './wind'
import { makeRng } from '../catalog/rng'

const FRAME = 1 / 60

/** One spray of `size` followed at 60 fps until its last droplet is down: its highest droplet, when the last came down, and where each landed. */
function follow(seed: number, size = 1) {
  const b = new SplashBuffer(makeRng(seed))
  b.spawn(3, -4, size)
  const count = b.sprays[0]!.drops.length
  const diameters = b.sprays[0]!.drops.map(d => d.d)
  let highest = 0, lastDown = 0, t = 0
  const landed: number[] = []
  const inAir = new Set(b.sprays[0]!.drops)
  while (b.sprays.length > 0 && t < 3) {
    b.update(FRAME)
    t += FRAME
    const s = b.sprays[0]
    for (const d of s?.drops ?? []) highest = Math.max(highest, d.y)
    for (const d of [...inAir]) {
      if (s?.drops.includes(d)) continue
      inAir.delete(d)
      lastDown = t
      landed.push(Math.hypot(d.x - 3, d.z + 4))
    }
  }
  return { count, diameters, highest, lastDown, landed: landed.sort((a, c) => a - c) }
}

describe("a kingfisher's spray (size 1)", () => {
  // the research's adopted spray (2026-09-30-kingfisher-flight-and-plunge.md section 6.5) and its test thresholds (10)
  const runs = Array.from({ length: 12 }, (_, i) => follow(i + 1))

  it('throws 60-120 droplets, each 1-3 mm across', () => {
    for (const r of runs) {
      expect(r.count).toBeGreaterThanOrEqual(60)
      expect(r.count).toBeLessThanOrEqual(120)
      for (const d of r.diameters) { expect(d).toBeGreaterThanOrEqual(0.001); expect(d).toBeLessThanOrEqual(0.003) }
    }
  })
  it('rises 0.3-0.7 m at its highest', () => {
    for (const r of runs) {
      expect(r.highest).toBeGreaterThanOrEqual(0.3)
      expect(r.highest).toBeLessThanOrEqual(0.7)
    }
  })
  it('is all back on the water within 0.5-0.8 s', () => {
    for (const r of runs) {
      expect(r.lastDown).toBeGreaterThanOrEqual(0.5)
      expect(r.lastDown).toBeLessThanOrEqual(0.8)
    }
  })
  it('spreads 0.2-0.6 m: nine droplets in ten land within that of where it went in, and none past 0.9 m', () => {
    for (const r of runs) {
      expect(r.landed).toHaveLength(r.count)
      const p90 = r.landed[Math.floor(r.landed.length * 0.9)]!
      expect(p90).toBeGreaterThanOrEqual(0.2)
      expect(p90).toBeLessThanOrEqual(0.6)
      expect(r.landed.at(-1)!).toBeLessThanOrEqual(0.9)
    }
  })
  it('a smaller splash throws fewer droplets, less high', () => {
    const half = Array.from({ length: 12 }, (_, i) => follow(i + 1, 0.5))
    const mean = (xs: number[]) => xs.reduce((a, c) => a + c, 0) / xs.length
    expect(mean(half.map(r => r.count))).toBeCloseTo(mean(runs.map(r => r.count)) / 2, 0)
    const ratio = mean(half.map(r => r.highest)) / mean(runs.map(r => r.highest))
    expect(ratio).toBeGreaterThan(0.4)
    expect(ratio).toBeLessThan(0.65)
  })
})

describe('the white burst at the water', () => {
  it('comes up to its brightest at 0.1 s and is gone within 0.8-1.2 s', () => {
    expect(foamAt(0)).toBe(0)
    expect(foamAt(SPRAY.foam.peak)).toBeCloseTo(1, 6)
    expect(foamAt(0.05)).toBeGreaterThan(0)
    expect(foamAt(0.5)).toBeGreaterThan(0)
    expect(foamAt(0.5)).toBeLessThan(1)
    expect(SPRAY.foam.life).toBeGreaterThanOrEqual(0.8)
    expect(SPRAY.foam.life).toBeLessThanOrEqual(1.2)
    expect(foamAt(SPRAY.foam.life)).toBe(0)
    for (let t = SPRAY.foam.peak; t < SPRAY.foam.life; t += 0.05) expect(foamAt(t + 0.05)).toBeLessThanOrEqual(foamAt(t))
  })
  it('is 0.15-0.3 m across on a size-1 spray', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const b = new SplashBuffer(makeRng(seed))
      b.spawn(0, 0)
      expect(b.sprays[0]!.foamRadius * 2).toBeGreaterThanOrEqual(0.15)
      expect(b.sprays[0]!.foamRadius * 2).toBeLessThanOrEqual(0.3)
    }
  })
})

describe('SplashBuffer', () => {
  it('keeps a spray until its foam has faded and its droplets are down, then drops it', () => {
    const b = new SplashBuffer(makeRng(1))
    b.spawn(1, 2)
    const life = sprayLife(b.sprays[0]!)
    expect(life).toBeGreaterThanOrEqual(SPRAY.foam.life)
    for (let t = 0; t < life - 0.05; t += FRAME) b.update(FRAME)
    expect(b.sprays).toHaveLength(1)
    expect(b.sprays[0]!.drops).toHaveLength(0)          // every droplet down by now
    b.update(0.1)
    expect(b.sprays).toHaveLength(0)
  })
  it('holds a few sprays at once', () => {
    expect(MAX_SPRAYS).toBeGreaterThanOrEqual(3)
    expect(new SplashBuffer(makeRng(1)).max).toBe(MAX_SPRAYS)
  })
  it('when full, drops the spray nearest the end of its own life, not the oldest', () => {
    // a big spray, spawned first, has more of its longer life ahead of it than a kingfisher's spawned after it
    const b = new SplashBuffer(makeRng(2), 4)
    b.spawn(0, 0, 4); b.update(0.2)
    b.spawn(9, 9, 1); b.update(0.6)
    expect(b.sprays[0]!.age / sprayLife(b.sprays[0]!)).toBeLessThan(b.sprays[1]!.age / sprayLife(b.sprays[1]!))
    b.spawn(1, 1); b.spawn(2, 2)
    b.spawn(3, 3)
    expect(b.sprays.map(s => s.x)).toEqual([0, 1, 2, 3])
  })
  it('packs only the droplets in the air: where each is, its diameter, and a fade that falls as it falls', () => {
    const b = new SplashBuffer(makeRng(3))
    b.spawn(5, -6)
    const n0 = b.sprays[0]!.drops.length
    const cap = MAX_SPRAYS * SPRAY.drops * 2
    const pos = new Float32Array(cap * 3), dia = new Float32Array(cap), alpha = new Float32Array(cap)
    b.update(FRAME)
    expect(b.packDrops(pos, dia, alpha)).toBe(n0)
    for (let i = 0; i < n0; i++) {
      expect(alpha[i]).toBe(1)                             // all still rising
      expect(dia[i]).toBeGreaterThanOrEqual(0.001)
      expect(Math.hypot(pos[i * 3]! - 5, pos[i * 3 + 2]! + 6)).toBeLessThan(0.2)
    }
    for (let t = 0; t < 0.45; t += FRAME) b.update(FRAME)
    const n = b.packDrops(pos, dia, alpha)
    expect(n).toBe(b.sprays[0]!.drops.length)
    expect(n).toBeLessThan(n0)                             // some are down already
    const fading = Array.from(alpha.slice(0, n)).filter(a => a < 1)
    expect(fading.length).toBeGreaterThan(0)
    for (const a of fading) expect(a).toBeGreaterThan(0)
    for (let i = 0; i < n; i++) expect(pos[i * 3 + 1]).toBeGreaterThanOrEqual(0)
  })
  it('packs no more droplets than the arrays hold', () => {
    const b = new SplashBuffer(makeRng(4))
    b.spawn(0, 0); b.spawn(1, 1)
    const small = 30
    expect(b.packDrops(new Float32Array(small * 3), new Float32Array(small), new Float32Array(small))).toBe(small)
  })
  it('is deterministic per seed', () => {
    const run = (seed: number) => { const b = new SplashBuffer(makeRng(seed)); b.spawn(0, 0); b.update(0.2); return b.sprays[0]!.drops.map(d => d.y) }
    expect(run(7)).toEqual(run(7))
    expect(run(7)).not.toEqual(run(8))
  })
})

describe('the spray drawn', () => {
  it('draws every droplet at least a pixel across, though through binoculars at 30 m one is smaller than a pixel', () => {
    // a 1080-pixel-tall view: the binoculars' 7.5 degrees, the telescope's 2 (src/player/optics.ts)
    const bino = pixelsPerRadian(7.5, 1080), scope = pixelsPerRadian(2, 1080)
    expect(MIN_DROP_PX).toBeGreaterThanOrEqual(1)
    expect(0.002 * bino / 30).toBeLessThan(1)
    expect(dropletPixels(0.002, 30, bino)).toBe(MIN_DROP_PX)
    expect(dropletPixels(0.001, 300, scope)).toBe(MIN_DROP_PX)
    // one big enough is drawn at its own size: 3 mm through the telescope at 20 m
    expect(dropletPixels(0.003, 20, scope)).toBeCloseTo(0.003 * scope / 20, 6)
    expect(dropletPixels(0.003, 20, scope)).toBeGreaterThan(MIN_DROP_PX)
  })
  it('builds without a GPU, out of the mirror, and draws the droplets in the air', () => {
    const buffer = new SplashBuffer(makeRng(5))
    const splash = createSplash(buffer, paletteFor('early-autumn', 'morning'))
    const wind = new Wind({ direction: 0, strength: 0.3, gustiness: 0.5, seed: 1 })
    const parts: THREE.Object3D[] = []
    splash.object.traverse(o => { if (o !== splash.object) parts.push(o) })
    expect(parts.length).toBeGreaterThanOrEqual(2)
    for (const p of parts) expect(p.layers.mask).toBe(1 << NO_REFLECT)
    const points = parts.find((p): p is THREE.Points => p instanceof THREE.Points)!
    const foam = parts.find((p): p is THREE.InstancedMesh => p instanceof THREE.InstancedMesh)!
    splash.update(FRAME, wind)
    expect(points.geometry.drawRange.count).toBe(0)
    expect(foam.count).toBe(0)
    buffer.spawn(0, 0)
    splash.update(FRAME, wind)
    expect(points.geometry.drawRange.count).toBe(buffer.sprays[0]!.drops.length)
    expect(foam.count).toBe(1)
    for (let t = 0; t < 2; t += FRAME) splash.update(FRAME, wind)
    expect(points.geometry.drawRange.count).toBe(0)
    expect(foam.count).toBe(0)
  })
})
