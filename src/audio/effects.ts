import type * as THREE from 'three'
import type { OpticMode } from '../player/optics'
import type { GameState } from '../store/game'
import type { AudioEngine } from './engine'
import { renderEffect, SAMPLE_RATE, type EffectKind } from './synth'

export function opticEvent(prev: OpticMode, next: OpticMode): 'raise' | 'lower' | null {
  if (prev === next) return null
  return next === 'eye' ? 'lower' : 'raise'
}

/** Sounds owed to a store transition: the guide opening, a card appearing or changing. */
export function overlayEvents(prev: GameState, next: GameState): EffectKind[] {
  const out: EffectKind[] = []
  if (!prev.guideOpen && next.guideOpen) out.push('guide-open')
  if (next.card && next.card !== prev.card) {
    out.push(next.card.kind === 'correct' ? 'correct' : next.card.kind === 'wrong' ? 'wrong' : 'reveal')
  }
  return out
}

export interface Effects {
  play(kind: EffectKind, volume?: number): void
  playAt(kind: EffectKind, position: THREE.Vector3, volume?: number): void
}

/** Renders each effect once, on first use, into an AudioBuffer and plays it on the effects layer. */
export function createEffects(engine: Pick<AudioEngine, 'bufferFrom' | 'play' | 'playAt' | 'unlocked'>): Effects {
  const cache = new Map<EffectKind, AudioBuffer>()
  function buffer(kind: EffectKind): AudioBuffer {
    let b = cache.get(kind)
    if (!b) { b = engine.bufferFrom(renderEffect(kind), SAMPLE_RATE); cache.set(kind, b) }
    return b
  }
  return {
    play(kind, volume = 1) {
      if (!engine.unlocked) return
      engine.play(buffer(kind), 'effects', { volume })
    },
    playAt(kind, position, volume = 1) {
      if (!engine.unlocked) return
      engine.playAt(buffer(kind), position, 'effects', { volume, refDistance: 10 })
    },
  }
}
