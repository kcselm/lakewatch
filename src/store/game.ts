import { createStore } from './store'
import type { OpticMode } from '../player/optics'

export interface GameState {
  optic: OpticMode
  target: { id: number; species: string; tooSmall: boolean } | null
  guideOpen: boolean
  /** what the field guide is for: free browsing, or confirming a guess against `identifying` */
  guideMode: 'browse' | 'identify'
  identifying: { targetId: number; species: string; misses: number } | null
  card:
    | { kind: 'correct'; species: string }
    | { kind: 'wrong'; guess: string; hint: string }
    | { kind: 'revealed'; species: string }
    | null
  lifeListOpen: boolean
  /** the title card; true until the player clicks Begin (which also unlocks audio) */
  titleOpen: boolean
  /** the study screen, opened from the title card in its place: the birds' models, photos, calls, and marks */
  studyOpen: boolean
  settingsOpen: boolean
  creditsOpen: boolean
}

export const game = createStore<GameState>({
  optic: 'eye', target: null, guideOpen: false, guideMode: 'browse', identifying: null, card: null, lifeListOpen: false,
  titleOpen: true, studyOpen: false, settingsOpen: false, creditsOpen: false,
})

/** True when any overlay owns the input and the world should pause. */
export function isPaused(s: GameState): boolean {
  return s.titleOpen || s.studyOpen || s.guideOpen || s.card !== null || s.lifeListOpen || s.settingsOpen || s.creditsOpen
}
