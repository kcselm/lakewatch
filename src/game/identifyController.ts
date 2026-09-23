import type { Store } from '../store/store'
import type { GameState } from '../store/game'
import type { SpeciesSpec } from '../birds/spec'
import { judge, MAX_MISSES } from './identify'

export interface IdentifyControllerDeps {
  store: Store<GameState>
  registry: { get(id: number): { species: string; identified: boolean } | undefined }
  specs: Record<string, SpeciesSpec>
  names: (code: string) => string
  record: (species: string, selfIdentified: boolean, wrongGuesses: number) => void
  exitPointerLock: () => void
}

export interface IdentifyController {
  pressIdentify(): void
  toggleGuide(): void
  toggleLifeList(): void
  closeOverlay(): void
  guess(code: string): void
  closeGuide(): void
  dismissCard(): void
}

function anyOverlayOpen(s: GameState): boolean {
  return s.guideOpen || s.card !== null || s.lifeListOpen
}

/**
 * Orchestrates the E (identify) / G (guide) / L (life list) / Esc keys against the game store.
 * Keeps the field guide's browse/identify MODE (`guideMode`) separate from the identify SESSION
 * (`identifying`): closing the guide (via G, Esc, or the Close button) never discards a session
 * in progress, so a miss count survives a "Look again" or a detour into browsing.
 */
export function createIdentifyController(deps: IdentifyControllerDeps): IdentifyController {
  const { store, registry, specs, names, record, exitPointerLock } = deps

  function pressIdentify(): void {
    const s = store.get()
    if (anyOverlayOpen(s)) return
    if (!s.target || s.target.tooSmall) return
    const inst = registry.get(s.target.id)
    if (!inst || inst.identified) return
    const existing = s.identifying && s.identifying.targetId === s.target.id ? s.identifying : null
    store.set({
      identifying: existing ?? { targetId: s.target.id, species: s.target.species, misses: 0 },
      guideOpen: true,
      guideMode: 'identify',
    })
    exitPointerLock()
  }

  function toggleGuide(): void {
    const s = store.get()
    if (s.card !== null || s.lifeListOpen) return
    const opening = !s.guideOpen
    store.set(opening ? { guideOpen: true, guideMode: 'browse' } : { guideOpen: false })
    if (opening) exitPointerLock()
  }

  function toggleLifeList(): void {
    const s = store.get()
    if (s.card !== null || s.guideOpen) return
    const opening = !s.lifeListOpen
    store.set({ lifeListOpen: opening })
    if (opening) exitPointerLock()
  }

  function closeGuide(): void {
    store.set({ guideOpen: false })
  }

  function dismissCard(): void {
    store.set({ card: null })
  }

  function closeOverlay(): void {
    const s = store.get()
    if (s.card !== null) dismissCard()
    else if (s.guideOpen) closeGuide()
    else if (s.lifeListOpen) store.set({ lifeListOpen: false })
  }

  function guess(code: string): void {
    const s = store.get()
    if (s.guideMode !== 'identify' || !s.identifying) return
    const session = s.identifying
    const j = judge(session, code, specs, names)
    if (j.result === 'correct') {
      const inst = registry.get(session.targetId)
      if (inst) inst.identified = true
      record(session.species, true, session.misses)
      store.set({ guideOpen: false, identifying: null, card: { kind: 'correct', species: session.species } })
    } else if (j.result === 'wrong') {
      store.set({ guideOpen: false, identifying: j.session, card: { kind: 'wrong', guess: code, hint: j.hint } })
    } else {
      const inst = registry.get(session.targetId)
      if (inst) inst.identified = true
      record(j.species, false, MAX_MISSES)
      store.set({ guideOpen: false, identifying: null, card: { kind: 'revealed', species: j.species } })
    }
  }

  return { pressIdentify, toggleGuide, toggleLifeList, closeOverlay, guess, closeGuide, dismissCard }
}
