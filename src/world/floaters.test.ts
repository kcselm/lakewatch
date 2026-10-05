import * as THREE from 'three'
import { FloaterTracker, MAX_FLOATERS } from './floaters'
import type { BirdInstance } from '../birds/registry'
import { BirdRegistry } from '../birds/registry'
import { spawnCast } from '../birds/spawn'
import { loadLocation } from '../location'
import { Wind } from './wind'
import { RippleBuffer } from './ripples'
import { lakeHeightfield } from './heightfield'
import { terrainSurface } from './terrain'
import { bakeWaterDepth } from './waterDepth'

function bird(id: number, x: number, y: number, z: number, behavior = 'swim', visible = true, floating = behavior === 'swim'): BirdInstance {
  const group = new THREE.Group()
  group.position.set(x, y, z)
  group.visible = visible
  return { id, species: 'mallar3', behavior, identified: false, model: { group, center: new THREE.Vector3(), radius: 0.3 }, position: group.position, floating }
}
const water = () => 1

describe('FloaterTracker', () => {
  it('takes the birds on or in the water, and leaves out those on land, in the air, or hidden under it', () => {
    const t = new FloaterTracker()
    const birds = [bird(1, 0, 0, -20), bird(2, 0, -0.15, -61, 'wade'), bird(3, 0, 0.2, -20), bird(4, 0, -0.4, -20, 'swim', false), bird(5, 20, 0.08, -7, 'probe')]
    t.update(birds, (x, z) => (z < -10 ? 1 : 0), 1 / 60)
    expect(t.floaters.map(f => f.id)).toEqual([1, 2])
    expect(t.floaters.map(f => f.wading)).toEqual([false, true])
  })
  it('reads floating or wading from whether the bird floats this frame, not from its behaviour: a goose wading out stands', () => {
    const t = new FloaterTracker()
    // two geese cast to swim: one floating, one wading up the bank with its feet on the bed; and a heron
    t.update([bird(1, 0, 0, -20), bird(2, 0, -0.1, -20, 'swim', true, false), bird(3, 0, -0.15, -61, 'wade')], water, 1 / 60)
    expect(t.floaters.map(f => f.wading)).toEqual([false, true, true])
  })
  it('takes whether a bird floats from its pose, as its behaviour sets it each frame', () => {
    const registry = new BirdRegistry()
    const model = { group: new THREE.Group(), center: new THREE.Vector3(), radius: 0.4 }
    const pose = { afloat: 1 }
    const goose = registry.add({ species: 'cangoo', behavior: 'swim', model, pose })
    const flyer = registry.add({ species: 'cangoo', behavior: 'flyover', model })
    expect([goose.floating, flyer.floating]).toEqual([true, false])
    for (const [afloat, floating] of [[0.51, true], [0.5, false], [0, false]] as const) {
      pose.afloat = afloat
      expect(goose.floating, `afloat ${afloat}`).toBe(floating)
    }
  })
  it('measures a bird\'s velocity from its steps, smoothed over 0.3 s', () => {
    const t = new FloaterTracker()
    const b = bird(1, 0, 0, -20)
    t.update([b], water, 1 / 60)
    expect(t.floaters[0]!.vx).toBe(0)
    for (let i = 0; i < 120; i++) { b.position.x += 0.5 / 60; t.update([b], water, 1 / 60) }
    expect(t.floaters[0]!.vx).toBeCloseTo(0.5, 2)
    expect(t.floaters[0]!.vz).toBeCloseTo(0, 6)
    b.position.x += 0.5 / 60 * 4                   // one frame's jump: the wake mustn't flicker with it
    t.update([b], water, 1 / 60)
    expect(t.floaters[0]!.vx).toBeLessThan(0.8)
  })
  it('packs two vec4s a floater, and zeroes the slots it doesn\'t use', () => {
    const t = new FloaterTracker(2)
    const b = bird(1, 3, 0, -20, 'wade')
    b.model.group.rotation.y = Math.PI / 2       // facing -z, as a heading of a quarter turn does
    t.update([b], water, 1 / 60)
    const out = new Float32Array(16).fill(7)
    t.pack(out)
    expect(Array.from(out.slice(0, 6))).toEqual([3, -20, 0, 0, 0.30000001192092896, 1])
    expect(out[6]).toBeCloseTo(0, 6)
    expect(out[7]).toBeCloseTo(-1, 6)
    expect(Array.from(out.slice(8))).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
  })
  it('holds no more than its cap', () => {
    const t = new FloaterTracker(2)
    t.update([bird(1, 0, 0, -20), bird(2, 1, 0, -20), bird(3, 2, 0, -20)], water, 1 / 60)
    expect(t.floaters).toHaveLength(2)
  })
})

describe('the whole cast in the water', () => {
  it('keeps every bird in the water under MAX_FLOATERS, and gives a cruising duck the speed of a full wake', () => {
    const surface = terrainSurface(lakeHeightfield(7))
    const depth = bakeWaterDepth(surface)
    for (const seed of [42, 7, 11]) {
      const wind = new Wind({ direction: 240, strength: 0.35, gustiness: 0.5, seed: 1 })
      const registry = new BirdRegistry()
      const world = spawnCast(loadLocation(), { registry, wind, ground: (x, z) => surface.sample(x, z), ripples: new RippleBuffer(), seed })
      const tracker = new FloaterTracker()
      let most = 0, fewest = Infinity, fastest = 0
      for (let i = 0; i < 120 * 10; i++) {
        world.update(0.1, wind)
        tracker.update(registry.all(), (x, z) => depth.at(x, z), 0.1)
        most = Math.max(most, tracker.floaters.length)
        if (i > 10) fewest = Math.min(fewest, tracker.floaters.length)
        for (const f of tracker.floaters) if (!f.wading) fastest = Math.max(fastest, Math.hypot(f.vx, f.vz))
      }
      expect(most).toBeLessThanOrEqual(50)
      expect(most).toBeLessThan(MAX_FLOATERS)
      expect(fewest).toBeGreaterThanOrEqual(25)
      expect(fastest).toBeGreaterThanOrEqual(0.3)
      expect(fastest).toBeLessThanOrEqual(0.9)
    }
  }, 240_000)
})
