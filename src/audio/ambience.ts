import { valueNoise1 } from '../world/noise'
import type { WorldModule } from '../world/scene'
import type { AudioEngine } from './engine'
import type { AmbienceLayer } from './ambienceManifest'
import { renderNoise, renderFrogLoop, SAMPLE_RATE } from './synth'

/** Wind-in-reeds level: a floor so the bed never goes dead silent, rising with the gust. */
export function windLayerGain(strength: number, gust: number): number {
  const w = Math.min(1, Math.max(0, strength * (0.5 + 0.5 * gust)))
  return 0.25 + 0.75 * w
}

/** Band-pass centre for the wind noise: gusts hiss higher. */
export function windFilterHz(gust: number): number {
  return 500 + 900 * Math.min(1, Math.max(0, gust))
}

/**
 * How much a still lake lets the bank be heard: near-silent in a calm, waves
 * only slap the shore once a breeze is pushing them. 0.1..1 over effective wind.
 */
export function lappingWindScale(effectiveWind: number): number {
  const w = Math.min(1, Math.max(0, effectiveWind))
  return 0.1 + 0.9 * w
}

/** Slow swell of water against the bank, 0.4..1, seeded noise so it never repeats. */
export function lappingGain(t: number, seed: number): number {
  return 0.4 + 0.6 * valueNoise1(t * 0.35, seed)
}

type Recipe = 'wind' | 'lapping' | 'frogs' | 'file'

interface Layer {
  recipe: Recipe
  base: number
  followsWind: boolean
  gain: GainNode
  filter: BiquadFilterNode | null
  buffer: AudioBuffer | null
  file: string | null
  source: AudioBufferSourceNode | null
}

/**
 * Looping ambience layers mixed straight into the listener. Sources start
 * on the first update after the context is unlocked, so nothing is scheduled
 * against a suspended context.
 */
export function createAmbience(engine: AudioEngine, layers: readonly AmbienceLayer[], ids: readonly string[]): WorldModule & { dispose(): void } {
  const ctx = engine.context
  const out = engine.listener.getInput()
  const built: Layer[] = []
  let started = false
  let disposed = false
  let time = 0

  for (const id of ids) {
    const layer = layers.find(l => l.id === id)
    if (!layer) throw new Error(`ambience layer ${id} is not in the manifest`)
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(out)
    let filter: BiquadFilterNode | null = null
    let buffer: AudioBuffer | null = null
    let file: string | null = null
    let recipe: Recipe
    if (layer.source.kind === 'synth') {
      recipe = layer.source.recipe
      filter = ctx.createBiquadFilter()
      if (recipe === 'wind') {
        buffer = engine.bufferFrom(renderNoise(4, 1), SAMPLE_RATE)
        filter.type = 'bandpass'; filter.Q.value = 0.7; filter.frequency.value = windFilterHz(0)
      } else if (recipe === 'lapping') {
        buffer = engine.bufferFrom(renderNoise(6, 2), SAMPLE_RATE)
        filter.type = 'lowpass'; filter.frequency.value = 350
      } else {
        buffer = engine.bufferFrom(renderFrogLoop(24, 3), SAMPLE_RATE)
        filter.type = 'lowpass'; filter.frequency.value = 1800      // distance
      }
      filter.connect(gain)
    } else {
      recipe = 'file'
      file = layer.source.file
    }
    built.push({ recipe, base: layer.gain, followsWind: layer.followsWind, gain, filter, buffer, file, source: null })
  }

  function startLayer(l: Layer, buffer: AudioBuffer): void {
    if (disposed) return
    const s = ctx.createBufferSource()
    s.buffer = buffer
    s.loop = true
    s.connect(l.filter ?? l.gain)
    s.start()
    l.source = s
  }

  function startAll(): void {
    for (const l of built) {
      if (l.buffer) startLayer(l, l.buffer)
      else if (l.file) void engine.load('/' + l.file).then(b => startLayer(l, b)).catch(err => console.warn(`ambience ${l.file}: ${String(err)}`))
    }
  }

  return {
    update(dt, wind) {
      time += dt
      if (!started && engine.unlocked) { started = true; startAll() }
      const vol = engine.layerVolume('ambience')
      const now = ctx.currentTime
      for (const l of built) {
        let g = l.base * vol
        if (l.recipe === 'wind' || l.followsWind) g *= windLayerGain(wind.state.strength, wind.state.gust)
        if (l.recipe === 'lapping') g *= lappingGain(time, 5) * lappingWindScale(wind.effective())
        l.gain.gain.setTargetAtTime(g, now, 0.1)
        if (l.recipe === 'wind' && l.filter) l.filter.frequency.setTargetAtTime(windFilterHz(wind.state.gust), now, 0.2)
      }
    },
    dispose() {
      disposed = true
      for (const l of built) { l.source?.stop(); l.gain.disconnect() }
    },
  }
}
