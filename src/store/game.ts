import { createStore } from './store'
import type { OpticMode } from '../player/optics'

export interface GameState {
  optic: OpticMode
  target: { id: number; species: string; tooSmall: boolean } | null
  guideOpen: boolean
  identifying: { targetId: number; species: string; misses: number } | null
  card:
    | { kind: 'correct'; species: string }
    | { kind: 'wrong'; guess: string; hint: string }
    | { kind: 'revealed'; species: string }
    | null
  lifeListOpen: boolean
}

export const game = createStore<GameState>({
  optic: 'eye', target: null, guideOpen: false, identifying: null, card: null, lifeListOpen: false,
})

/** True when any overlay owns the input and the world should pause. */
export function isPaused(s: GameState): boolean {
  return s.guideOpen || s.card !== null || s.lifeListOpen
}
