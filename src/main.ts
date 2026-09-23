import { loadLocation } from './location'
import { World } from './world/scene'
import { createDevOverlay } from './hud/devOverlay'
import { lakeHeightfield } from './world/heightfield'
import { createTerrain } from './world/terrain'

const loc = loadLocation()
const world = new World(document.getElementById('app')!, loc)
const heightfield = lakeHeightfield(7)
world.add(createTerrain(heightfield))
const dev = createDevOverlay(document.getElementById('hud')!)

world.start(dt => {
  dev.update(dt, { birds: 0, gust: world.wind.state.gust, mode: 'eye' })
})
