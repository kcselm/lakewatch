import * as THREE from 'three'
import { targetCandidates } from './candidates'
import { pickTarget } from './target'
import { BirdRegistry } from '../birds/registry'
import { createStore } from '../store/store'
import type { GameState } from '../store/game'
import { createIdentifyController } from '../game/identifyController'
import { SPECIES } from '../birds/species'

/** A bird's model as the registry holds it: a group placed in the world, its centre, its size. */
function model(x: number, y: number, z: number) {
  const group = new THREE.Group()
  group.position.set(x, y, z)
  group.updateMatrixWorld(true)
  return { group, center: new THREE.Vector3(0, 0.1, 0), radius: 0.2 }
}
/** The camera through binoculars, looking straight down -z. */
function binoculars() {
  const c = new THREE.PerspectiveCamera(7.5, 16 / 9, 0.1, 1000)
  c.lookAt(0, 0, -1)
  c.updateMatrixWorld(true)
  c.updateProjectionMatrix()
  return c
}
const vp = { width: 1600, height: 900 }

describe('targetCandidates', () => {
  it("offers every bird at its model's centre in the world", () => {
    const registry = new BirdRegistry()
    const a = registry.add({ species: 'y00475', model: model(1, 0, -10), behavior: 'swim' })
    const [c] = targetCandidates(registry.all())
    expect(c).toMatchObject({ id: a.id, species: 'y00475', radius: 0.2 })
    expect(c!.position.toArray()).toEqual([1, 0.1, -10])
  })
  it('leaves out a bird the spawner has hidden, one all the way under the water', () => {
    const registry = new BirdRegistry()
    registry.add({ species: 'y00475', model: model(0, 0, -10), behavior: 'swim' })
    const grebe = registry.add({ species: 'pibgre', model: model(0.5, -0.4, -12), behavior: 'swim' })
    grebe.model.group.visible = false
    expect(targetCandidates(registry.all()).map(c => c.species)).toEqual(['y00475'])
  })
  it('drops an identification in progress on a bird that dives, as leaving the reticle does', () => {
    // A coot straight ahead through binoculars. The player presses E, guesses wrong, and dismisses the card; the coot
    // dives before the next guess.
    const registry = new BirdRegistry()
    const coot = registry.add({ species: 'y00475', model: model(0, 0, -15), behavior: 'swim' })
    const store = createStore<GameState>({
      optic: 'binoculars', target: null, guideOpen: false, guideMode: 'browse', identifying: null, card: null, lifeListOpen: false,
      titleOpen: false, settingsOpen: false, creditsOpen: false,
    })
    const controller = createIdentifyController({ store, registry, specs: SPECIES, names: c => c, record: () => {}, exitPointerLock: () => {} })
    /** main.tsx's frame: pick from the candidates, and set the target to it or to nothing */
    const frame = () => {
      const t = pickTarget(targetCandidates(registry.all()), binoculars(), vp)
      store.set({ target: t ? { id: t.id, species: t.species, tooSmall: t.tooSmall } : null })
    }
    frame()
    expect(store.get().target?.id).toBe(coot.id)
    controller.pressIdentify()
    controller.guess('mallar3')
    controller.dismissCard()
    expect(store.get().identifying).toEqual({ targetId: coot.id, species: 'y00475', misses: 1 })

    // it dives: the spawner hides it, it drops out of the candidates, and the target goes as if it had left the reticle
    coot.model.group.visible = false
    frame()
    expect(store.get().target).toBeNull()
    controller.pressIdentify()
    expect(store.get().guideOpen).toBe(false)

    // it comes up in the reticle again: the identification carries on where it was, as it would for a bird that had
    // swum out of the reticle and back
    coot.model.group.visible = true
    frame()
    controller.pressIdentify()
    expect(store.get().guideOpen).toBe(true)
    expect(store.get().identifying).toEqual({ targetId: coot.id, species: 'y00475', misses: 1 })
  })
})
