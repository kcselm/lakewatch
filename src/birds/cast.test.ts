import { spawnCast } from './spawn'
import { BirdRegistry } from './registry'
import { Wind } from '../world/wind'
import { RippleBuffer, MAX_RIPPLES } from '../world/ripples'
import { loadLocation } from '../location'
import { targetCandidates } from '../player/candidates'

/**
 * Everything on the lake that rings the water: the 29 swimmers, each in the style its species file names (the
 * pelicans' bills ring it as they dip), the six dowitchers, the Kingfisher, whose dives ring too, and the herons'
 * strikes.
 */
function ringers() {
  const lake = loadLocation()
  const RINGS = ['y00475', 'mallar3', 'gadwal', 'amewig', 'norsho', 'pibgre', 'lobdow', 'belkin1', 'grbher3', 'greegr', 'amwpel']
  // not the flock in the sky, which rings nothing
  return { ...lake, cast: lake.cast.filter(e => RINGS.includes(e.species) && e.behavior !== 'flyover') }
}

describe('the whole cast on the water', () => {
  it('rings the water within the buffer: over ten minutes no ring is pushed out before it fades, about 29 alive at once', () => {
    // 24 swimmers' dips, tip-ups, and dives (their wakes are drawn from their speed, not rung), six dowitchers' bills,
    // the Kingfisher, and the herons' strikes, for two seeds, each ring lasting 2 + 4 size seconds. The test steps at 10
    // frames a second to keep it quick; the game steps at the display rate. In the scratch runs at 10 frames a second
    // (seeds 42 and 7), the live rings averaged 28-29 and peaked at 46-48 of the 64, with nothing pushed out.
    const counts: number[] = []
    let dropped = 0
    for (const seed of [42, 7]) {
      const wind = new Wind({ direction: 240, strength: 0.35, gustiness: 0.5, seed: 1 })
      const ripples = new RippleBuffer()
      const spawn = ripples.spawn.bind(ripples)
      ripples.spawn = (x: number, z: number, size?: number) => { if (ripples.rings.length >= MAX_RIPPLES) dropped++; spawn(x, z, size) }
      const world = spawnCast(ringers(), { registry: new BirdRegistry(), wind, ground: () => -1, ripples, seed, perches: { snag: [22, 3, -48] } })
      for (let i = 0; i < 600 * 10; i++) {
        world.update(0.1, wind)
        ripples.update(0.1)
        counts.push(ripples.rings.length)
      }
    }
    expect(dropped).toBe(0)
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length
    expect(mean).toBeGreaterThan(20)
    expect(mean).toBeLessThan(36)
  }, 240_000)   // two seeds x 600 s of the whole cast: about 30 s alone with 29 swimmers (each minds every other), past 120 s on a loaded machine
  it('hides each diving bird exactly while it is under the water, and never offers a hidden bird as a target', () => {
    const wind = new Wind({ direction: 240, strength: 0.35, gustiness: 0.5, seed: 1 })
    const registry = new BirdRegistry()
    const world = spawnCast(ringers(), { registry, wind, ground: () => -1, ripples: new RippleBuffer(), seed: 42, perches: { snag: [22, 3, -48] } })
    let hidden = 0
    for (let i = 0; i < 300 * 10; i++) {
      world.update(0.1, wind)
      for (const b of registry.all()) {
        if (b.behavior !== 'swim') continue
        // a coot or grebe all the way down sits 0.4 m under; anything less is still in sight
        const down = b.model.group.position.y <= -0.4 + 1e-9
        if (b.model.group.visible === down) expect.fail(`${b.species} ${b.id} at y ${b.model.group.position.y} is ${b.model.group.visible ? 'shown' : 'hidden'}`)
        if (down) hidden++
      }
      const offered = new Set(targetCandidates(registry.all()).map(c => c.id))
      for (const b of registry.all()) if (!b.model.group.visible && offered.has(b.id)) expect.fail(`hidden ${b.species} offered as a target`)
    }
    expect(hidden).toBeGreaterThan(100)
  }, 120_000)   // 300 s of the whole cast, checking every bird each frame; slower as each swimmer is detailed
})
