import { makeRng } from '../catalog/rng'

export const SAMPLE_RATE = 44100

export function renderNoise(seconds: number, seed: number, sampleRate = SAMPLE_RATE): Float32Array {
  const rng = makeRng(seed)
  const out = new Float32Array(Math.round(seconds * sampleRate))
  for (let i = 0; i < out.length; i++) out[i] = rng() * 2 - 1
  return out
}

/** One-pole low-pass. */
export function lowpass(samples: Float32Array, cutoffHz: number, sampleRate = SAMPLE_RATE): Float32Array {
  const out = new Float32Array(samples.length)
  const a = 1 - Math.exp((-2 * Math.PI * cutoffHz) / sampleRate)
  let y = 0
  for (let i = 0; i < samples.length; i++) {
    y += a * (samples[i]! - y)
    out[i] = y
  }
  return out
}

/** Sine that sweeps exponentially from startHz to endHz. */
export function tone(startHz: number, endHz: number, seconds: number, sampleRate = SAMPLE_RATE): Float32Array {
  const n = Math.round(seconds * sampleRate)
  const out = new Float32Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const hz = startHz * Math.pow(endHz / startHz, i / n)
    phase += (2 * Math.PI * hz) / sampleRate
    out[i] = Math.sin(phase)
  }
  return out
}

/** Linear attack to 1, hold, squared release to 0 over the last `releaseSec`. First and last samples are 0. */
export function envelope(n: number, attackSec: number, releaseSec: number, sampleRate = SAMPLE_RATE): Float32Array {
  const out = new Float32Array(n)
  const a = Math.max(1, Math.round(attackSec * sampleRate))
  const r = Math.max(1, Math.round(releaseSec * sampleRate))
  for (let i = 0; i < n; i++) {
    const att = Math.min(1, i / a)
    const remaining = n - 1 - i
    const rel = remaining < r ? remaining / r : 1
    out[i] = att * rel * rel
  }
  if (n > 0) out[n - 1] = 0
  return out
}

export function mul(a: Float32Array, b: Float32Array): Float32Array {
  const n = Math.min(a.length, b.length)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = a[i]! * b[i]!
  return out
}

export interface MixPart { samples: Float32Array; gain?: number; at?: number }

/** Sums parts at their offsets (seconds). The result is as long as the latest-ending part. */
export function mix(parts: MixPart[], sampleRate = SAMPLE_RATE): Float32Array {
  let n = 0
  for (const p of parts) n = Math.max(n, Math.round((p.at ?? 0) * sampleRate) + p.samples.length)
  const out = new Float32Array(n)
  for (const p of parts) {
    const off = Math.round((p.at ?? 0) * sampleRate)
    const g = p.gain ?? 1
    for (let i = 0; i < p.samples.length; i++) out[off + i] = (out[off + i] ?? 0) + p.samples[i]! * g
  }
  return out
}

export function normalize(samples: Float32Array, peak = 0.8): Float32Array {
  let max = 0
  for (const s of samples) max = Math.max(max, Math.abs(s))
  const out = new Float32Array(samples.length)
  if (max === 0) return out
  const k = peak / max
  for (let i = 0; i < samples.length; i++) out[i] = samples[i]! * k
  return out
}

function shaped(samples: Float32Array, attack: number, release: number, sampleRate: number): Float32Array {
  return mul(samples, envelope(samples.length, attack, release, sampleRate))
}

export type EffectKind = 'raise' | 'lower' | 'guide-open' | 'page' | 'correct' | 'wrong' | 'reveal' | 'splash' | 'flap'
export const EFFECT_KINDS: readonly EffectKind[] = ['raise', 'lower', 'guide-open', 'page', 'correct', 'wrong', 'reveal', 'splash', 'flap']

/**
 * Short UI and world sounds, rendered from noise and sine primitives. Seeds
 * are fixed so a sound is the same on every run.
 */
export function renderEffect(kind: EffectKind, sampleRate = SAMPLE_RATE): Float32Array {
  const sr = sampleRate
  const noise = (sec: number, hz: number, seed: number) => lowpass(renderNoise(sec, seed, sr), hz, sr)
  let out: Float32Array
  switch (kind) {
    case 'raise':     // a soft swoosh rising in pitch: optics coming up to the eyes
      out = mix([
        { samples: shaped(noise(0.25, 1800, 11), 0.05, 0.15, sr), gain: 0.5 },
        { samples: shaped(tone(300, 600, 0.2, sr), 0.02, 0.15, sr), gain: 0.15 },
      ], sr)
      break
    case 'lower':
      out = mix([
        { samples: shaped(noise(0.25, 900, 12), 0.05, 0.15, sr), gain: 0.5 },
        { samples: shaped(tone(600, 300, 0.2, sr), 0.02, 0.15, sr), gain: 0.15 },
      ], sr)
      break
    case 'guide-open':  // paper
      out = shaped(noise(0.3, 2500, 13), 0.02, 0.25, sr)
      break
    case 'page':
      out = shaped(noise(0.12, 3000, 14), 0.01, 0.1, sr)
      break
    case 'correct':     // two rising notes
      out = mix([
        { samples: shaped(tone(660, 660, 0.18, sr), 0.01, 0.15, sr) },
        { samples: shaped(tone(880, 880, 0.35, sr), 0.01, 0.3, sr), at: 0.15 },
      ], sr)
      break
    case 'wrong':       // a dull low thud
      out = mix([
        { samples: shaped(tone(220, 180, 0.35, sr), 0.01, 0.3, sr) },
        { samples: shaped(noise(0.2, 400, 15), 0.01, 0.15, sr), gain: 0.3 },
      ], sr)
      break
    case 'reveal':      // a falling note
      out = shaped(tone(440, 330, 0.5, sr), 0.02, 0.45, sr)
      break
    case 'splash':      // a bright hit with a low body
      out = mix([
        { samples: shaped(noise(0.6, 1500, 16), 0.005, 0.5, sr) },
        { samples: shaped(noise(0.6, 400, 17), 0.02, 0.55, sr), gain: 0.8 },
      ], sr)
      break
    case 'flap':        // four quick beats
      out = mix([0, 0.13, 0.26, 0.39].map((at, i) => ({ samples: shaped(noise(0.08, 1200, 20 + i), 0.01, 0.06, sr), at })), sr)
      break
    default:
      throw new Error(`unknown effect ${String(kind)}`)
  }
  return normalize(out, 0.8)
}

/**
 * A Pacific tree frog chorus at a distance: bouts of two to five pulsed
 * two-part chirps, spaced at random, sized to loop at exactly `seconds`.
 */
export function renderFrogLoop(seconds: number, seed: number, sampleRate = SAMPLE_RATE): Float32Array {
  const sr = sampleRate
  const rng = makeRng(seed)
  const sweep = tone(2200, 2600, 0.09, sr)
  const pulsed = new Float32Array(sweep.length)
  for (let i = 0; i < sweep.length; i++) pulsed[i] = sweep[i]! * (Math.sin((2 * Math.PI * 40 * i) / sr) > 0 ? 1 : 0.15)
  const chirp = mix([
    { samples: shaped(pulsed, 0.005, 0.07, sr) },
    { samples: shaped(tone(2900, 2900, 0.05, sr), 0.005, 0.04, sr), at: 0.1, gain: 0.7 },
  ], sr)
  const chirpSec = chirp.length / sr
  const parts: MixPart[] = []
  let t = rng() * 2
  while (t < seconds) {
    const n = 2 + Math.floor(rng() * 4)
    for (let k = 0; k < n; k++) {
      const at = t + k * 0.35
      if (at + chirpSec < seconds) parts.push({ samples: chirp, at, gain: 0.6 + rng() * 0.4 })
    }
    t += 1.5 + rng() * 2.5
  }
  const out = new Float32Array(Math.round(seconds * sr))
  if (parts.length > 0) {
    const body = mix(parts, sr)
    out.set(body.subarray(0, out.length))
  }
  return normalize(out, 0.5)
}
