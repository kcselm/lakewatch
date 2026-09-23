import { renderNoise, lowpass, tone, envelope, mix, normalize, renderEffect, renderFrogLoop, EFFECT_KINDS, SAMPLE_RATE } from './synth'

function peak(s: Float32Array): number { let m = 0; for (const v of s) m = Math.max(m, Math.abs(v)); return m }
function rms(s: Float32Array): number { let a = 0; for (const v of s) a += v * v; return Math.sqrt(a / s.length) }

describe('renderNoise', () => {
  it('has the requested length and stays within [-1, 1)', () => {
    const n = renderNoise(0.5, 1)
    expect(n.length).toBe(Math.round(0.5 * SAMPLE_RATE))
    expect(peak(n)).toBeLessThanOrEqual(1)
    expect(rms(n)).toBeGreaterThan(0.4)
  })
  it('is deterministic per seed and differs across seeds', () => {
    expect(renderNoise(0.1, 7)).toEqual(renderNoise(0.1, 7))
    expect(renderNoise(0.1, 7)).not.toEqual(renderNoise(0.1, 8))
  })
})

describe('lowpass', () => {
  it('removes most of the energy of white noise at a low cutoff', () => {
    const n = renderNoise(1, 2)
    expect(rms(lowpass(n, 200))).toBeLessThan(rms(n) * 0.5)
  })
})

describe('tone', () => {
  it('crosses zero twice per cycle at a constant frequency', () => {
    const t = tone(440, 440, 1)
    let crossings = 0
    for (let i = 1; i < t.length; i++) if ((t[i - 1]! < 0) !== (t[i]! < 0)) crossings++
    expect(crossings).toBeGreaterThanOrEqual(877)
    expect(crossings).toBeLessThanOrEqual(883)
  })
})

describe('envelope', () => {
  it('starts at zero, reaches one, and ends at zero', () => {
    const e = envelope(4410, 0.01, 0.05)
    expect(e[0]).toBe(0)
    expect(Math.max(...e)).toBeCloseTo(1, 6)
    expect(e[e.length - 1]).toBe(0)
  })
})

describe('mix and normalize', () => {
  it('places parts at their offsets and scales to the requested peak', () => {
    const a = new Float32Array([1, 1, 1, 1])
    const m = mix([{ samples: a }, { samples: a, at: 2 / SAMPLE_RATE, gain: 0.5 }])
    expect(Array.from(m)).toEqual([1, 1, 1.5, 1.5, 0.5, 0.5])
    expect(peak(normalize(m, 0.8))).toBeCloseTo(0.8, 6)
    expect(peak(normalize(new Float32Array(4), 0.8))).toBe(0)
  })
})

describe('renderEffect', () => {
  for (const kind of EFFECT_KINDS) {
    it(`${kind} is short, click-free, and peaks at 0.8`, () => {
      const s = renderEffect(kind)
      expect(s.length / SAMPLE_RATE).toBeGreaterThan(0.05)
      expect(s.length / SAMPLE_RATE).toBeLessThan(1.5)
      expect(peak(s)).toBeCloseTo(0.8, 5)
      expect(Math.abs(s[0]!)).toBeLessThan(0.05)
      expect(Math.abs(s[s.length - 1]!)).toBeLessThan(0.05)
    })
  }
  it('is deterministic', () => {
    expect(renderEffect('splash')).toEqual(renderEffect('splash'))
  })
})

describe('renderFrogLoop', () => {
  it('fills exactly the requested loop length with sparse chirps', () => {
    const s = renderFrogLoop(8, 3)
    expect(s.length).toBe(8 * SAMPLE_RATE)
    expect(peak(s)).toBeCloseTo(0.5, 5)
    // sparse: most samples are near-silent between bouts
    let quiet = 0
    for (const v of s) if (Math.abs(v) < 0.01) quiet++
    expect(quiet / s.length).toBeGreaterThan(0.5)
  })
  it('is deterministic per seed', () => {
    expect(renderFrogLoop(2, 4)).toEqual(renderFrogLoop(2, 4))
  })
})
