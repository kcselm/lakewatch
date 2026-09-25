import { band, hash, hashString, compileLayer, type Frame, type Px, type Out } from './layers'
import type { Layer } from '../detail/spec'

const LABELS: Record<string, number> = { a: 0.2, b: 0.6, c: 0.9 }
const frame: Frame = {
  lengthMm: 100,
  widthMm: () => 50,
  uOf: l => {
    const u = LABELS[l]
    if (u === undefined) throw new Error(l)
    return u
  },
}
const px = (s: number, t: number): Px => ({ s, t, X: s * 100, Y: t * 50, pixelMm: 0.2 })
const run = (layer: Layer, s: number, t: number) => {
  const L = compileLayer(layer, frame, 7)
  const out: Out = { alpha: 0, color: [0, 0, 0] }
  L.shade(px(s, t), out)
  return { alpha: out.alpha * L.sMask(s) * L.tMask(t, 50) * L.opacity, color: out.color }
}

describe('band', () => {
  it('is 1 inside, 0 well outside, and never fades at the part edge', () => {
    expect(band(0.5, 0.2, 0.8, 0.05)).toBe(1)
    expect(band(0.1, 0.2, 0.8, 0.05)).toBe(0)
    expect(band(0.2, 0.2, 0.8, 0.05)).toBeCloseTo(0.5, 9)
    expect(band(0, 0, 0.8, 0.05)).toBe(1)
    expect(band(1, 0.2, 1, 0.05)).toBe(1)
  })
})

describe('hash', () => {
  it('is stable, in [0, 1), and varies with its inputs', () => {
    expect(hash(3, 4, 5)).toBe(hash(3, 4, 5))
    const vals = Array.from({ length: 500 }, (_, i) => hash(i, i * 7, 11))
    expect(Math.min(...vals)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...vals)).toBeLessThan(1)
    expect(new Set(vals.map(v => v.toFixed(6))).size).toBeGreaterThan(490)
    expect(hashString('greyel')).not.toBe(hashString('lesyel'))
  })
})

describe('compileLayer', () => {
  const fill: Layer = { kind: 'fill', where: { part: 'skin', from: 'a', to: 'b', band: [0, 0.5] }, color: '#ff0000' }
  it('paints inside its region and nowhere outside', () => {
    expect(run(fill, 0.4, 0.2).alpha).toBe(1)
    expect(run(fill, 0.4, 0.2).color).toEqual([1, 0, 0])
    expect(run(fill, 0.1, 0.2).alpha).toBe(0)
    expect(run(fill, 0.8, 0.2).alpha).toBe(0)
    expect(run(fill, 0.4, 0.9).alpha).toBe(0)
  })
  it('accepts its span either way round', () => {
    const back: Layer = { ...fill, where: { part: 'skin', from: 'b', to: 'a', band: [0, 0.5] } }
    expect(run(back, 0.4, 0.2).alpha).toBe(1)
  })
  it('scales by opacity', () => {
    expect(run({ ...fill, opacity: 0.25 }, 0.4, 0.2).alpha).toBeCloseTo(0.25, 9)
  })
  it('grades base colour from top through side to bottom', () => {
    const base: Layer = { kind: 'base', where: { part: 'wingFold' }, top: '#000000', side: '#808080', bottom: '#ffffff' }
    expect(run(base, 0.5, 0).color[0]).toBeCloseTo(0, 9)
    expect(run(base, 0.5, 0.5).color[0]).toBeCloseTo(128 / 255, 9)
    expect(run(base, 0.5, 1).color[0]).toBeCloseTo(1, 9)
  })
  it('ramps a gradient between from and to and holds its ends', () => {
    const g: Layer = { kind: 'gradient', where: { part: 'bill' }, axis: 's', from: 0.2, to: 0.6, colorA: '#000000', colorB: '#ffffff' }
    expect(run(g, 0.1, 0.5).color[0]).toBe(0)
    expect(run(g, 0.4, 0.5).color[0]).toBeCloseTo(0.5, 9)
    expect(run(g, 0.9, 0.5).color[0]).toBe(1)
  })
  it('draws a ring around its point and not at the centre', () => {
    // the point sits at X = 60 mm, Y = 25 mm
    const ring: Layer = { kind: 'ring', at: { at: 'b', t: 0.5 }, radius: 3, width: 1, color: '#ffffff' }
    expect(run(ring, 0.63, 0.5).alpha).toBeCloseTo(1, 2)
    expect(run(ring, 0.6, 0.5).alpha).toBe(0)
  })
  it('draws a stripe between two points', () => {
    const stripe: Layer = { kind: 'stripe', from: { at: 'a', t: 0.5 }, to: { at: 'b', t: 0.5 }, width: 2, color: '#ffffff' }
    expect(run(stripe, 0.4, 0.5).alpha).toBeCloseTo(1, 6)
    expect(run(stripe, 0.4, 0.6).alpha).toBe(0)       // 5 mm off the line
    expect(run(stripe, 0.8, 0.5).alpha).toBe(0)       // past its end
  })
  it('is deterministic for a seed', () => {
    const spots: Layer = { kind: 'spots', where: { part: 'wingFold' }, color: '#ffffff', size: 2, spacing: 4 }
    const sample = () => Array.from({ length: 200 }, (_, i) => run(spots, (i % 20) / 20, Math.floor(i / 20) / 10).alpha)
    const a = sample()
    expect(sample()).toEqual(a)
    expect(a.some(v => v > 0.9)).toBe(true)
    expect(a.some(v => v === 0)).toBe(true)
  })
})
