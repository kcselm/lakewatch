import * as THREE from 'three'
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

const loc = loadLocation()
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
const modeEl = document.createElement('div'); modeEl.className = 'mode'; hud.appendChild(modeEl)

addEventListener('wheel', e => optics.setMode(nextMode(optics.mode, e.deltaY < 0 ? 1 : -1)), { passive: true })
addEventListener('keydown', e => {
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

world.start(dt => {
  optics.update(dt, world.camera, look)
  mask.update(optics.mode, optics.transition, optics.focusBlur)
  modeEl.textContent = optics.mode === 'eye' ? 'scroll / B / T for optics' : optics.mode
  ;(water.object.material as THREE.ShaderMaterial).uniforms.uCamera!.value.copy(world.camera.position)
  dev.update(dt, { birds: registry.size, gust: world.wind.state.gust, mode: optics.mode })
})
