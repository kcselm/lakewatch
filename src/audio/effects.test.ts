import * as THREE from 'three'
import { opticEvent, overlayEvents, createEffects } from './effects'
import type { GameState } from '../store/game'

const base: GameState = {
  optic: 'eye', target: null, guideOpen: false, guideMode: 'browse', identifying: null, card: null, lifeListOpen: false,
  titleOpen: false, settingsOpen: false, creditsOpen: false,
}

describe('opticEvent', () => {
  it('raises going up from the eye, lowers coming back, raises between optics, nothing when unchanged', () => {
    expect(opticEvent('eye', 'binoculars')).toBe('raise')
    expect(opticEvent('binoculars', 'eye')).toBe('lower')
    expect(opticEvent('binoculars', 'telescope')).toBe('raise')
    expect(opticEvent('telescope', 'telescope')).toBeNull()
  })
})

describe('overlayEvents', () => {
  it('sounds the guide opening and each card as it appears', () => {
    expect(overlayEvents(base, { ...base, guideOpen: true })).toEqual(['guide-open'])
    expect(overlayEvents({ ...base, guideOpen: true }, { ...base, guideOpen: true })).toEqual([])
    const wrong = { kind: 'wrong' as const, guess: 'mallar3', hint: 'h' }
    expect(overlayEvents(base, { ...base, card: wrong })).toEqual(['wrong'])
    expect(overlayEvents({ ...base, card: wrong }, { ...base, card: wrong })).toEqual([])
    expect(overlayEvents({ ...base, card: wrong }, { ...base, card: { kind: 'correct', species: 'y00475' } })).toEqual(['correct'])
    expect(overlayEvents(base, { ...base, card: { kind: 'revealed', species: 'y00475' } })).toEqual(['reveal'])
  })
})

describe('createEffects', () => {
  function fakeEngine(unlocked: boolean) {
    return {
      unlocked,
      bufferFrom: vi.fn((s: Float32Array) => ({ length: s.length }) as unknown as AudioBuffer),
      play: vi.fn(() => ({ playing: true, stop() {}, setVolume() {}, follow() {} })),
      playAt: vi.fn(() => ({ playing: true, stop() {}, setVolume() {}, follow() {} })),
    }
  }
  it('renders each sound once and reuses the buffer', () => {
    const engine = fakeEngine(true)
    const fx = createEffects(engine)
    fx.play('page'); fx.play('page'); fx.playAt('splash', new THREE.Vector3(1, 0, 1)); fx.playAt('splash', new THREE.Vector3(2, 0, 2))
    expect(engine.bufferFrom).toHaveBeenCalledTimes(2)
    expect(engine.play).toHaveBeenCalledTimes(2)
    expect(engine.playAt).toHaveBeenCalledTimes(2)
  })
  it('stays quiet while the context is locked', () => {
    const engine = fakeEngine(false)
    createEffects(engine).play('correct')
    expect(engine.play).not.toHaveBeenCalled()
  })
})
