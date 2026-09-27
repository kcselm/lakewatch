import * as THREE from 'three'
import { render } from 'preact'
import { loadLocation, type Vec3 } from './location'
import { World } from './world/scene'
import { createDevOverlay } from './hud/devOverlay'
import { createZoneOutlines } from './hud/zoneOutlines'
import { lakeHeightfield } from './world/heightfield'
import { createTerrain, terrainSurface } from './world/terrain'
import { createWater } from './world/water'
import { RippleBuffer } from './world/ripples'
import { sunDirection } from './world/sky'
import { scatterInBand } from './world/scatter'
import { createReeds, createGrass } from './world/vegetation'
import { createTree, createSnag, createTreeLine } from './world/trees'
import { BirdRegistry } from './birds/registry'
import { spawnCast, type SpawnEvents } from './birds/spawn'
import { prepareBirds } from './birds/prewarm'
import { createStore } from './store/store'
import type { PaintProgress } from './ui/Title'
import { LookControls } from './player/look'
import { Optics, nextMode, type OpticMode } from './player/optics'
import { createMask } from './hud/mask'
import { game, isPaused } from './store/game'
import { pickTarget } from './player/target'
import { targetCandidates } from './player/candidates'
import { createPrompt } from './hud/prompt'
import { loadCatalog, findBird } from './catalog'
import { App } from './ui/App'
import { fieldMarkFor } from './game/identify'
import { createIdentifyController } from './game/identifyController'
import { guideSpecies } from './game/guideSpecies'
import { creditsFor } from './game/credits'
import { SPECIES } from './birds/species'
import { createLifeListStorage } from './game/lifeListStorage'
import { recordSighting, seenState, emptyLifeList } from './game/lifeList'
import { createSettingsStorage, applySettings, type Settings } from './game/settings'
import { AudioEngine, type Voice } from './audio/engine'
import { createAmbience } from './audio/ambience'
import { loadAmbience } from './audio/ambienceManifest'
import { createCallPlayer } from './audio/callPlayer'
import { pickClip } from './audio/clips'
import { createEffects, opticEvent, overlayEvents, type Effects } from './audio/effects'
import { makeRng } from './catalog/rng'

const loc = loadLocation()
const catalog = loadCatalog()
const guide = guideSpecies(catalog, loc.habitat)

let ls: Storage | null = null
try { ls = window.localStorage } catch { ls = null }
const lifeStorage = createLifeListStorage(ls)
let lifeList = lifeStorage.load()
const settingsStorage = createSettingsStorage(ls)
let settings = settingsStorage.load()
let settingsPersistent = ls !== null

function record(species: string, selfIdentified: boolean, wrongGuesses: number) {
  lifeList = recordSighting(lifeList, { species, location: loc.id, timeOfDay: loc.timeOfDay, selfIdentified, wrongGuesses, at: new Date().toISOString() })
  lifeStorage.save(lifeList)
}

const registry = new BirdRegistry()
const identifyController = createIdentifyController({
  store: game,
  registry,
  specs: SPECIES,
  names: code => findBird(code).commonName,
  record,
  exitPointerLock: () => document.exitPointerLock(),
})

let audio: AudioEngine | null = null
let effects: Effects | null = null

const credits = creditsFor(guide, loadAmbience())
const painting = createStore<PaintProgress>({ done: 0, total: 0, ready: false })

function renderApp(unsupported: string | null) {
  render(
    <App
      guide={guide}
      specs={SPECIES}
      birdOf={findBird}
      fieldMark={code => fieldMarkFor(code, SPECIES)}
      seen={() => seenState(lifeList)}
      onGuess={code => identifyController.guess(code)}
      onGuideSelect={() => effects?.play('page', 0.5)}
      onCloseGuide={() => identifyController.closeGuide()}
      onDismissCard={() => identifyController.dismissCard()}
      lifeList={() => lifeList}
      locationName={loc.name}
      locationSpecies={guide.map(b => b.speciesCode)}
      persistent={() => lifeStorage.persistent}
      onCloseLifeList={() => game.set({ lifeListOpen: false })}
      unsupported={unsupported}
      painting={painting}
      onBegin={() => {
        if (!painting.get().ready) return
        void audio?.unlock()
        game.set({ titleOpen: false })
      }}
      onOpenSettings={() => game.set({ settingsOpen: true })}
      onOpenCredits={() => game.set({ creditsOpen: true })}
      settings={() => settings}
      settingsPersistent={() => settingsPersistent}
      onSettingsChange={s => {
        settings = s
        if (!settingsStorage.save(s)) settingsPersistent = false
        if (!unsupported) applySettings(s, { look, engine })
      }}
      onResetLifeList={() => { lifeList = emptyLifeList(); lifeStorage.save(lifeList); for (const b of registry.all()) b.identified = false }}
      onCloseSettings={() => game.set({ settingsOpen: false })}
      clipVolume={() => settings.volumes.master * settings.volumes.calls}
      credits={credits}
      onCloseCredits={() => game.set({ creditsOpen: false })}
    />,
    document.getElementById('ui')!,
  )
}

let world: World
try {
  world = new World(document.getElementById('app')!, loc)
} catch (err) {
  console.error(err)
  renderApp('This browser could not start WebGL, so the lake cannot be drawn. The credits still work.')
  throw err
}
audio = new AudioEngine(world.scene, world.camera)
const engine = audio
world.add(createAmbience(engine, loadAmbience(), loc.ambience))
effects = createEffects(engine)
const fx = effects
const heightfield = lakeHeightfield(7)
world.add(createTerrain(heightfield))
// what the birds and outlines stand on: the rendered mesh, which sags or bulges up to 11 cm from the smooth field
const surface = terrainSurface(heightfield)
// vantage.position[1] is eye height above the ground, not an absolute world y
const [vx, , vz] = loc.vantage.position
world.camera.position.y = heightfield.sample(vx, vz) + loc.vantage.position[1]
const outlines = createZoneOutlines(loc, (x, z) => surface.sample(x, z))
world.scene.add(outlines.object)
const dev = createDevOverlay(document.getElementById('hud')!, v => outlines.setVisible(v))
const hud = document.getElementById('hud')!
const look = new LookControls(world.renderer.domElement, loc.vantage.heading, () => !isPaused(game.get()))
applySettings(settings, { look, engine })
const optics = new Optics()
const mask = createMask(hud)
const prompt = createPrompt(hud)
const modeEl = document.createElement('div'); modeEl.className = 'mode'; hud.appendChild(modeEl)

function setOptic(m: OpticMode) {
  const ev = opticEvent(optics.mode, m)
  optics.setMode(m)
  if (ev) fx.play(ev, 0.6)
}

game.subscribe(s => {
  world.setPaused(isPaused(s))
  if (isPaused(s) && document.pointerLockElement) document.exitPointerLock()
})
world.setPaused(isPaused(game.get()))

let prevState = game.get()
game.subscribe(s => {
  for (const ev of overlayEvents(prevState, s)) fx.play(ev)
  prevState = s
})

addEventListener('wheel', e => {
  if (isPaused(game.get())) return
  setOptic(nextMode(optics.mode, e.deltaY < 0 ? 1 : -1))
}, { passive: true })
addEventListener('keydown', e => {
  if (isPaused(game.get())) return
  if (e.key === 'b' || e.key === 'B') setOptic(optics.mode === 'binoculars' ? 'eye' : 'binoculars')
  if (e.key === 't' || e.key === 'T') setOptic(optics.mode === 'telescope' ? 'eye' : 'telescope')
  if (e.key === 'Escape') setOptic('eye')
})

const ripples = new RippleBuffer()
const water = createWater(world.wind, world.palette, ripples)
;(water.object.material as THREE.ShaderMaterial).uniforms.uSunDir!.value.copy(sunDirection(world.palette))
world.add(water)

world.add(createReeds(scatterInBand(heightfield, { minY: -0.5, maxY: 0.7, bounds: [-16, -3, -14, -2], count: 9000, seed: 11 }), world.wind))
world.add(createGrass(scatterInBand(heightfield, { minY: 0.5, maxY: 3, bounds: [-40, 40, -12, 14], count: 12000, seed: 12 }), world.wind))

world.add(createTreeLine(heightfield, world.palette))
for (const [i, [tx, tz]] of [[-26, 4], [-18, 9], [30, 6], [38, -2], [-44, -30], [48, -34]].entries()) {
  world.add(createTree(tx!, tz!, heightfield, 100 + i, world.wind))
}
const perches: Record<string, Vec3> = {}
const snagZone = loc.zones['snag']
if (snagZone?.kind === 'point') {
  const snag = createSnag(snagZone.position)
  world.scene.add(snag.object)
  perches['snag'] = [snag.perchPoint.x, snag.perchPoint.y, snag.perchPoint.z]
}

const flockRng = makeRng(77)
const flockVoices = new Map<string, Voice>()
const flockPositions = new Map<string, THREE.Vector3>()
const spawnEvents: SpawnEvents = {
  flockStart(key, species) {
    const clip = pickClip(findBird(species), 'call', flockRng)
    if (!clip || !engine.unlocked) return
    engine.load('/' + clip.file).then(buffer => {
      const at = flockPositions.get(key)
      if (!at) return                                   // the flock already left
      flockVoices.get(key)?.stop()
      flockVoices.set(key, engine.playAt(buffer, at, 'calls', { loop: true, refDistance: 40, maxDistance: 900, volume: 0.8 }))
    }).catch(err => console.warn(`flock ${species}: ${String(err)}`))
  },
  flockMove(key, x, y, z) {
    let p = flockPositions.get(key)
    if (!p) { p = new THREE.Vector3(); flockPositions.set(key, p) }
    p.set(x, y, z)
    flockVoices.get(key)?.follow(p)
  },
  flockEnd(key) {
    flockVoices.get(key)?.stop()
    flockVoices.delete(key)
    flockPositions.delete(key)
  },
  effect: (name, x, y, z) => fx.playAt(name, new THREE.Vector3(x, y, z)),
}
// Behind the title card, every atlas the cast needs paints in a worker while the main thread places each detailed
// species' folded wing, the costly part of its first build, a species at a time. Then the cast is built, and Begin
// enabled. The card counts all three: atlases, species, and the build.
prepareBirds(loc, {
  worker: () => new Worker(new URL('./birds/paint/paint.worker.ts', import.meta.url), { type: 'module' }),
  onProgress: (done, total) => painting.set({ done, total }),
  build: () => world.add(spawnCast(loc, { registry, wind: world.wind, ground: (x, z) => surface.sample(x, z), ripples, seed: 42, events: spawnEvents, perches })),
}).then(() => {
  painting.set({ ready: true })
}).catch(err => {
  console.error(err)
  renderApp('The birds could not be set up, so the lake cannot start. The credits still work.')
})

const calls = createCallPlayer({
  engine, registry, birdOf: findBird,
  listenerPosition: () => world.camera.position,
  rng: makeRng(1234),
})

renderApp(null)

addEventListener('keydown', e => {
  if ((e.key === 'e' || e.key === 'E') && !e.repeat) identifyController.pressIdentify()
  if ((e.key === 'g' || e.key === 'G') && !e.repeat) identifyController.toggleGuide()
  if ((e.key === 'l' || e.key === 'L') && !e.repeat) identifyController.toggleLifeList()
  if ((e.key === 'o' || e.key === 'O') && !e.repeat) identifyController.toggleSettings()
  if ((e.key === 'c' || e.key === 'C') && !e.repeat) identifyController.toggleCredits()
  if (e.key === 'Escape') identifyController.closeOverlay()
})

world.start(dt => {
  optics.update(dt, world.camera, look)
  // targeting projects through the camera's world matrix, which render() only refreshes afterwards
  world.camera.updateMatrixWorld()

  if (game.get().optic !== optics.mode) game.set({ optic: optics.mode })

  if (optics.mode === 'eye' || optics.transition < 1) {
    if (game.get().target !== null) game.set({ target: null })
    prompt.set(null)
  } else {
    // A bird that dives drops out of the candidates, so the target goes (to null, or another bird) as if it had left
    // the reticle: E does nothing until it is back, and an identification begun on it carries on only when it is.
    const t = pickTarget(targetCandidates(registry.all()), world.camera, { width: innerWidth, height: innerHeight })
    const prevTarget = game.get().target
    if (!t) {
      if (prevTarget !== null) game.set({ target: null })
      prompt.set(null)
    } else {
      if (!prevTarget || prevTarget.id !== t.id || prevTarget.tooSmall !== t.tooSmall) {
        game.set({ target: { id: t.id, species: t.species, tooSmall: t.tooSmall } })
      }
      if (t.tooSmall) prompt.set(optics.mode === 'telescope' ? 'Too far to identify' : 'Too far. Try the telescope')
      else if (registry.get(t.id)?.identified) prompt.set(findBird(t.species).commonName)
      else prompt.set('Identify  [E]')
    }
  }

  mask.update(optics.mode, optics.transition, optics.focusBlur)
  modeEl.textContent = optics.mode === 'eye' ? 'scroll / B / T for optics' : optics.mode
  ;(water.object.material as THREE.ShaderMaterial).uniforms.uCamera!.value.copy(world.camera.position)
  calls.update(dt)
  dev.update(dt, { birds: registry.size, gust: world.wind.state.gust, mode: optics.mode, audio: engine.unlocked ? 'running' : 'locked', calls: calls.active })
})
