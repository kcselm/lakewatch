import { createStore } from '../store/store'
import type { GameState } from '../store/game'
import { createIdentifyController } from './identifyController'
import { SPECIES } from '../birds/species'

function makeStore(patch: Partial<GameState> = {}) {
  return createStore<GameState>({
    optic: 'eye', target: null, guideOpen: false, guideMode: 'browse', identifying: null, card: null, lifeListOpen: false,
    titleOpen: false, settingsOpen: false, creditsOpen: false,
    ...patch,
  })
}

function makeRegistry(entries: Record<number, { species: string; identified: boolean }>) {
  return { get: (id: number) => entries[id] }
}

function makeController(store: ReturnType<typeof makeStore>, registry: ReturnType<typeof makeRegistry>) {
  const recordCalls: Array<{ species: string; selfIdentified: boolean; wrongGuesses: number }> = []
  const controller = createIdentifyController({
    store,
    registry,
    specs: SPECIES,
    names: (code: string) => SPECIES[code]?.commonName ?? code,
    record: (species, selfIdentified, wrongGuesses) => recordCalls.push({ species, selfIdentified, wrongGuesses }),
    exitPointerLock: () => {},
  })
  return { controller, recordCalls }
}

// y00475 (coot) and mallar3 (mallard) have differing marks, so a coot target guessed as a
// mallard is reliably 'wrong' rather than an accidental 'correct'.
const TARGET = { id: 1, species: 'y00475', tooSmall: false }

describe('createIdentifyController', () => {
  it('keeps the miss count across a wrong guess, a dismiss, and pressing E again on the same target', () => {
    const store = makeStore({ target: TARGET })
    const registry = makeRegistry({ 1: { species: 'y00475', identified: false } })
    const { controller } = makeController(store, registry)

    controller.pressIdentify()
    controller.guess('mallar3') // wrong
    controller.dismissCard()
    controller.pressIdentify()

    expect(store.get().identifying?.misses).toBe(1)
  })

  it('reveals and records one wrong sighting after the third wrong guess', () => {
    const store = makeStore({ target: TARGET })
    const registry = makeRegistry({ 1: { species: 'y00475', identified: false } })
    const { controller, recordCalls } = makeController(store, registry)

    controller.pressIdentify()
    controller.guess('mallar3')
    controller.dismissCard()
    controller.pressIdentify()
    controller.guess('mallar3')
    controller.dismissCard()
    controller.pressIdentify()
    controller.guess('mallar3')

    expect(recordCalls).toEqual([{ species: 'y00475', selfIdentified: false, wrongGuesses: 3 }])
    expect(registry.get(1)?.identified).toBe(true)
  })

  it('records a correct guess once and ignores a second E on the same bird', () => {
    const store = makeStore({ target: TARGET })
    const registry = makeRegistry({ 1: { species: 'y00475', identified: false } })
    const { controller, recordCalls } = makeController(store, registry)

    controller.pressIdentify()
    controller.guess('y00475')
    expect(recordCalls).toEqual([{ species: 'y00475', selfIdentified: true, wrongGuesses: 0 }])
    expect(store.get().identifying).toBeNull()

    controller.pressIdentify()
    expect(recordCalls).toHaveLength(1)
    expect(store.get().guideOpen).toBe(false)
  })

  it('opens the guide in browse mode without clearing an existing session, and closing keeps it', () => {
    const existing = { targetId: 1, species: 'y00475', misses: 1 }
    const store = makeStore({ target: TARGET, identifying: existing })
    const registry = makeRegistry({ 1: { species: 'y00475', identified: false } })
    const { controller } = makeController(store, registry)

    controller.toggleGuide()
    expect(store.get().guideOpen).toBe(true)
    expect(store.get().guideMode).toBe('browse')
    expect(store.get().identifying).toEqual(existing)

    controller.toggleGuide()
    expect(store.get().guideOpen).toBe(false)
    expect(store.get().identifying).toEqual(existing)
  })

  it('starts a fresh session with misses 0 when E is pressed on a different target', () => {
    const store = makeStore({ target: TARGET, identifying: { targetId: 99, species: 'mallar3', misses: 2 } })
    const registry = makeRegistry({ 1: { species: 'y00475', identified: false } })
    const { controller } = makeController(store, registry)

    controller.pressIdentify()
    expect(store.get().identifying).toEqual({ targetId: 1, species: 'y00475', misses: 0 })
  })

  it('Esc dismisses a card, then closes the guide, then closes the life list', () => {
    const store = makeStore({ guideOpen: true, lifeListOpen: true, card: { kind: 'correct', species: 'y00475' } })
    const registry = makeRegistry({})
    const { controller } = makeController(store, registry)

    controller.closeOverlay()
    expect(store.get().card).toBeNull()
    expect(store.get().guideOpen).toBe(true)
    expect(store.get().lifeListOpen).toBe(true)

    controller.closeOverlay()
    expect(store.get().guideOpen).toBe(false)
    expect(store.get().lifeListOpen).toBe(true)

    controller.closeOverlay()
    expect(store.get().lifeListOpen).toBe(false)
  })

  it('does nothing on E while the life list is open', () => {
    const store = makeStore({ target: TARGET, lifeListOpen: true })
    const registry = makeRegistry({ 1: { species: 'y00475', identified: false } })
    const { controller } = makeController(store, registry)

    controller.pressIdentify()
    expect(store.get().guideOpen).toBe(false)
    expect(store.get().identifying).toBeNull()
  })

  it('ignores every key while the title card is up', () => {
    const store = makeStore({ target: TARGET, titleOpen: true })
    const registry = makeRegistry({ 1: { species: 'y00475', identified: false } })
    const { controller } = makeController(store, registry)

    controller.pressIdentify()
    controller.toggleGuide()
    controller.toggleLifeList()
    controller.toggleSettings()
    controller.toggleCredits()
    controller.closeOverlay()

    expect(store.get()).toMatchObject({ titleOpen: true, guideOpen: false, lifeListOpen: false, settingsOpen: false, creditsOpen: false, identifying: null })
  })

  it('toggles settings and credits, each exclusive with the other overlays', () => {
    const store = makeStore()
    const { controller } = makeController(store, makeRegistry({}))

    controller.toggleSettings()
    expect(store.get().settingsOpen).toBe(true)
    controller.toggleCredits()                       // blocked while settings is open
    expect(store.get().creditsOpen).toBe(false)
    controller.toggleGuide()                         // also blocked
    expect(store.get().guideOpen).toBe(false)
    controller.toggleSettings()
    expect(store.get().settingsOpen).toBe(false)

    controller.toggleCredits()
    expect(store.get().creditsOpen).toBe(true)
    controller.closeOverlay()
    expect(store.get().creditsOpen).toBe(false)
  })
})
