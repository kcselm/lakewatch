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

const loc = loadLocation()
const world = new World(document.getElementById('app')!, loc)
const heightfield = lakeHeightfield(7)
world.add(createTerrain(heightfield))
// vantage.position[1] is eye height above the ground, not an absolute world y
const [vx, , vz] = loc.vantage.position
world.camera.position.y = heightfield.sample(vx, vz) + loc.vantage.position[1]
const dev = createDevOverlay(document.getElementById('hud')!)

const ripples = new RippleBuffer()
const water = createWater(world.wind, world.palette, ripples)
;(water.object.material as THREE.ShaderMaterial).uniforms.uSunDir!.value.copy(sunDirection(world.palette))
world.add(water)

world.add(createReeds(scatterInBand(heightfield, { minY: -0.25, maxY: 0.45, bounds: [-34, -10, -20, -2], count: 6000, seed: 11 }), world.wind))
world.add(createGrass(scatterInBand(heightfield, { minY: 0.5, maxY: 3, bounds: [-40, 40, -12, 14], count: 12000, seed: 12 }), world.wind))

world.start(dt => {
  ;(water.object.material as THREE.ShaderMaterial).uniforms.uCamera!.value.copy(world.camera.position)
  dev.update(dt, { birds: 0, gust: world.wind.state.gust, mode: 'eye' })
})
