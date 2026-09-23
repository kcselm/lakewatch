import * as THREE from 'three'
import { render } from 'preact'
import { loadLocation } from './location'
import { World } from './world/scene'
import { createDevOverlay } from './hud/devOverlay'
import { lakeHeightfield } from './world/heightfield'
import { createTerrain } from './world/terrain'
import { createWater } from './world/water'
import { RippleBuffer } from './world/ripples'
import { sunDirection } from './world/sky'
import { scatterInBand } from './world/scatter'
import { createReeds, createGrass } from './world/vegetation'
import { createTree, createSnag, createTreeLine } from './world/trees'
import { BirdRegistry } from './birds/registry'
import { spawnCast } from './birds/spawn'
import { LookControls } from './player/look'
import { Optics, nextMode } from './player/optics'
import { createMask } from './hud/mask'
import { game, isPaused } from './store/game'
import { pickTarget } from './player/target'
import { createPrompt } from './hud/prompt'
import { loadCatalog, findBird } from './catalog'
import { App } from './ui/App'
import { judge, fieldMarkFor } from './game/identify'
import { guideSpecies } from './game/guideSpecies'
import { SPECIES } from './birds/species'

const loc = loadLocation()
const catalog = loadCatalog()
const guide = guideSpecies(catalog, loc.habitat)
const world = new World(document.getElementById('app')!, loc)
const heightfield = lakeHeightfield(7)
world.add(createTerrain(heightfield))
// vantage.position[1] is eye height above the ground, not an absolute world y
const [vx, , vz] = loc.vantage.position
world.camera.position.y = heightfield.sample(vx, vz) + loc.vantage.position[1]
const dev = createDevOverlay(document.getElementById('hud')!)
const hud = document.getElementById('hud')!
const look = new LookControls(world.renderer.domElement, loc.vantage.heading)
const optics = new Optics()
const mask = createMask(hud)
const prompt = createPrompt(hud)
const modeEl = document.createElement('div'); modeEl.className = 'mode'; hud.appendChild(modeEl)

game.subscribe(s => world.setPaused(isPaused(s)))

addEventListener('wheel', e => {
  if (isPaused(game.get())) return
  optics.setMode(nextMode(optics.mode, e.deltaY < 0 ? 1 : -1))
}, { passive: true })
addEventListener('keydown', e => {
  if (isPaused(game.get())) return
  if (e.key === 'b' || e.key === 'B') optics.setMode(optics.mode === 'binoculars' ? 'eye' : 'binoculars')
  if (e.key === 't' || e.key === 'T') optics.setMode(optics.mode === 'telescope' ? 'eye' : 'telescope')
  if (e.key === 'Escape') optics.setMode('eye')
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
const snagZone = loc.zones['snag']
if (snagZone?.kind === 'point') {
  const snag = createSnag(snagZone.position)
  world.scene.add(snag.object)
}

const registry = new BirdRegistry()
world.add(spawnCast(loc, { registry, wind: world.wind, ground: (x, z) => heightfield.sample(x, z), ripples, seed: 42 }))

addEventListener('keydown', e => {
  const s = game.get()
  if ((e.key === 'e' || e.key === 'E') && s.target && !s.target.tooSmall && !s.guideOpen && !s.card) {
    const inst = registry.get(s.target.id)
    if (!inst || inst.identified) return
    // reuse an existing session for the same target so the miss count survives a "Look again"
    const existing = s.identifying && s.identifying.targetId === s.target.id ? s.identifying : null
    game.set({ identifying: existing ?? { targetId: s.target.id, species: s.target.species, misses: 0 }, guideOpen: true })
    document.exitPointerLock()
  }
  if ((e.key === 'g' || e.key === 'G') && !s.card) {
    game.set({ guideOpen: !s.guideOpen, identifying: s.guideOpen ? null : s.identifying })
    if (!s.guideOpen) document.exitPointerLock()
  }
})

render(
  <App
    guide={guide}
    specs={SPECIES}
    birdOf={findBird}
    fieldMark={code => fieldMarkFor(code, SPECIES)}
    seen={() => ({})}
    onGuess={code => {
      const s = game.get()
      if (!s.identifying) return
      const j = judge(s.identifying, code, SPECIES, c => findBird(c).commonName)
      if (j.result === 'correct') {
        const inst = registry.get(s.identifying.targetId)
        if (inst) inst.identified = true
        game.set({ guideOpen: false, identifying: null, card: { kind: 'correct', species: s.identifying.species } })
      } else if (j.result === 'wrong') {
        game.set({ guideOpen: false, identifying: j.session, card: { kind: 'wrong', guess: code, hint: j.hint } })
      } else {
        const inst = registry.get(s.identifying.targetId)
        if (inst) inst.identified = true
        game.set({ guideOpen: false, identifying: null, card: { kind: 'revealed', species: j.species } })
      }
    }}
    onCloseGuide={() => game.set({ guideOpen: false, identifying: null })}
    onDismissCard={() => {
      const s = game.get()
      // after a wrong guess the session continues; pressing E on the same bird resumes it with its miss count
      game.set({ card: null })
      if (s.identifying) game.set({ identifying: s.identifying })
    }}
  />,
  document.getElementById('ui')!,
)

world.start(dt => {
  optics.update(dt, world.camera, look)
  // targeting projects through the camera's world matrix, which render() only refreshes afterwards
  world.camera.updateMatrixWorld()

  if (game.get().optic !== optics.mode) game.set({ optic: optics.mode })

  if (optics.mode === 'eye' || optics.transition < 1) {
    if (game.get().target !== null) game.set({ target: null })
    prompt.set(null)
  } else {
    const cands = registry.all().map(b => ({ id: b.id, species: b.species, position: b.position, radius: b.model.radius }))
    const t = pickTarget(cands, world.camera, { width: innerWidth, height: innerHeight })
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
  dev.update(dt, { birds: registry.size, gust: world.wind.state.gust, mode: optics.mode })
})
