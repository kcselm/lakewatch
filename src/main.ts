import { loadLocation } from './location'
import { World } from './world/scene'
import { createDevOverlay } from './hud/devOverlay'

const loc = loadLocation()
const world = new World(document.getElementById('app')!, loc)
const dev = createDevOverlay(document.getElementById('hud')!)

world.start(dt => {
  dev.update(dt, { birds: 0, gust: world.wind.state.gust, mode: 'eye' })
})
