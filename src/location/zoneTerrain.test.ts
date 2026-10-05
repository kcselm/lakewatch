import { loadLocation } from './index'
import { lakeHeightfield } from '../world/heightfield'
import { terrainSurface } from '../world/terrain'
import { getSpec, hasSpec } from '../birds/species'
import { STYLES } from '../behavior/probe'
import { HERON_WATER } from '../behavior/heron'
import { CANADA_GOOSE, findCrossing } from '../behavior/goose'
import { FLAT } from '../world/heightfield'
import { makeRng } from '../catalog/rng'
import { PELICAN, dipSeconds } from '../behavior/pelican'
import { pointInPolygon } from './zones'
import type { Vec2 } from './schema'
import { STUMPS } from '../world/trees'

function bboxOf(points: readonly Vec2[]): [number, number, number, number] {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const [x, z] of points) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z)
  }
  return [x0, x1, z0, z1]
}

/** Every point of a 0.5 m grid over the polygon's bounding box that falls inside it. */
function samplePolygon(points: readonly Vec2[], step = 0.5): Vec2[] {
  const [x0, x1, z0, z1] = bboxOf(points)
  const out: Vec2[] = []
  for (let x = x0; x <= x1; x += step) {
    for (let z = z0; z <= z1; z += step) {
      if (pointInPolygon(x, z, points)) out.push([x, z])
    }
  }
  return out
}

const DOWITCHER_WATER = STYLES.dowitcher.water

// Ground-height bounds that make each behavior look right against the terrain: swimmers need
// real water, plovers and sandpipers damp flat ground (not standing water, not dry), a dowitcher
// water up to its belly, waders dry-ish ground clear of deep water. A prober's bounds follow its
// species' foraging style.
const GROUND_OK: Record<string, (y: number) => boolean> = {
  swim: y => y < -0.2,
  probe: y => y >= -0.03 && y <= 0.5,
  'probe:dowitcher': y => y >= -DOWITCHER_WATER[1] && y <= -DOWITCHER_WATER[0],
  'wade:heron': y => y >= -HERON_WATER[1] && y <= -HERON_WATER[0],
  wade: y => y > -0.3,
  // a goose's grass: above the water, no higher than the flat's top
  ashore: y => y > 0.05 && y <= FLAT.top + FLAT.rough / 2,
}
const styleOf = (species: string) => (hasSpec(species) ? getSpec(species).foraging : undefined)
const checkFor = (behavior: string, species: string) => {
  const style = behavior === 'probe' || behavior === 'wade' ? styleOf(species) : undefined
  return GROUND_OK[`${behavior}:${style}`] ?? GROUND_OK[behavior]
}

describe('zone polygons agree with the terrain the birds stand on', () => {
  const loc = loadLocation()
  // the rendered mesh, not the smooth field it samples every 2 m: the two differ by centimetres, which matters in
  // water a few centimetres deep
  const heightfield = terrainSurface(lakeHeightfield(7))

  const seen = new Set<string>()
  for (const entry of loc.cast) {
    const zone = loc.zones[entry.zone]
    const check = checkFor(entry.behavior, entry.species)
    if (!zone || zone.kind !== 'polygon' || !check) continue
    const style = entry.behavior === 'probe' || entry.behavior === 'wade' ? styleOf(entry.species) : undefined
    const key = `${entry.zone}:${entry.behavior}:${style}`
    if (seen.has(key)) continue
    seen.add(key)

    if (entry.ashore && !seen.has(`${entry.ashore}:ashore`)) {
      seen.add(`${entry.ashore}:ashore`)
      const ashore = loc.zones[entry.ashore]!
      it(`${entry.ashore} (ashore, from ${entry.zone}) samples all agree with the terrain`, () => {
        expect(ashore.kind).toBe('polygon')
        if (ashore.kind !== 'polygon') return
        const samples = samplePolygon(ashore.points, 0.25)
        expect(samples.length).toBeGreaterThan(1000)
        for (const [x, z] of samples) expect(GROUND_OK.ashore!(heightfield.sample(x, z)), `(${x}, ${z})`).toBe(true)
      })
    }

    it(`${entry.zone} (${entry.behavior}${style ? ', ' + style : ''}) samples all agree with the terrain`, () => {
      // at least five samples across the zone's narrow side, however thin the strip
      const [x0, x1, z0, z1] = bboxOf(zone.points)
      const samples = samplePolygon(zone.points, Math.min(0.5, Math.min(x1 - x0, z1 - z0) / 5))
      expect(samples.length).toBeGreaterThan(0)
      for (const [x, z] of samples) {
        const y = heightfield.sample(x, z)
        expect(check(y)).toBe(true)
      }
    })
  }

  it('keeps the shallows ankle-deep, so the yellowlegs stand in water, not on it or under it', () => {
    const shallows = loc.zones['shallows']
    expect(shallows?.kind).toBe('polygon')
    if (shallows?.kind !== 'polygon') return
    for (const [x, z] of samplePolygon(shallows.points)) {
      const y = heightfield.sample(x, z)
      expect(y).toBeGreaterThanOrEqual(-0.15)
      expect(y).toBeLessThanOrEqual(0.08)
    }
  })

  it('keeps the far shallows ankle- to knee-deep for the herons, all over', () => {
    const shallows = loc.zones['far-shallows']
    expect(shallows?.kind).toBe('polygon')
    if (shallows?.kind !== 'polygon') return
    const samples = samplePolygon(shallows.points, 0.25)
    expect(samples.length).toBeGreaterThan(1000)
    for (const [x, z] of samples) {
      const y = heightfield.sample(x, z)
      expect(y, `(${x}, ${z})`).toBeLessThanOrEqual(-HERON_WATER[0])
      expect(y, `(${x}, ${z})`).toBeGreaterThanOrEqual(-HERON_WATER[1])
    }
  })
  it('keeps the geese\'s water deep enough for a goose to float, all over, and their flat dry and on the flat\'s top', () => {
    const water = loc.zones['goose-water'], flat = loc.zones['goose-flat']
    expect([water?.kind, flat?.kind]).toEqual(['polygon', 'polygon'])
    if (water?.kind !== 'polygon' || flat?.kind !== 'polygon') return
    for (const [x, z] of samplePolygon(water.points, 0.25)) expect(heightfield.sample(x, z), `(${x}, ${z})`).toBeLessThanOrEqual(-CANADA_GOOSE.wade.float)
    for (const [x, z] of flat.points) {
      expect(x).toBeGreaterThanOrEqual(FLAT.x[0]); expect(x).toBeLessThanOrEqual(FLAT.x[1])
      expect(z).toBeGreaterThanOrEqual(FLAT.z[0]); expect(z).toBeLessThanOrEqual(FLAT.z[1])
    }
  })
  it('lets the geese walk up and down the bank between their water and their flat: no steeper than 1 in 3 at any step', () => {
    const water = loc.zones['goose-water'], flat = loc.zones['goose-flat']
    if (water?.kind !== 'polygon' || flat?.kind !== 'polygon') throw new Error('no goose zones')
    // every way across the shore the style finds, over many tries, on the rendered surface
    const rng = makeRng(5)
    let found = 0, worst = 0
    for (let i = 0; i < 200; i++) {
      const c = findCrossing(water, flat, (x, z) => heightfield.sample(x, z), CANADA_GOOSE, rng)
      if (!c) continue
      found++
      const len = Math.hypot(c.land[0] - c.water[0], c.land[1] - c.water[1]), n = Math.ceil(len / 0.25)
      for (let k = 1; k <= n; k++) {
        const at = (j: number) => heightfield.sample(c.water[0] + ((c.land[0] - c.water[0]) * j) / n, c.water[1] + ((c.land[1] - c.water[1]) * j) / n)
        worst = Math.max(worst, Math.abs(at(k) - at(k - 1)) / (len / n))
      }
    }
    expect(found).toBe(200)
    expect(worst).toBeLessThan(1 / 3)
  })
  it('keeps the flat smooth under the geese: no step of 0.25 m over its zone rises more than 2 cm', () => {
    const flat = loc.zones['goose-flat']
    if (flat?.kind !== 'polygon') throw new Error('no goose-flat')
    for (const [x, z] of samplePolygon(flat.points, 0.25)) {
      expect(Math.abs(heightfield.sample(x + 0.25, z) - heightfield.sample(x, z)), `(${x}, ${z})`).toBeLessThan(0.02)
      expect(Math.abs(heightfield.sample(x, z + 0.25) - heightfield.sample(x, z)), `(${x}, ${z})`).toBeLessThan(0.02)
    }
  })
  it('keeps the bench belly-deep for a dowitcher, all over', () => {
    const bench = loc.zones['bench']
    expect(bench?.kind).toBe('polygon')
    if (bench?.kind !== 'polygon') return
    const samples = samplePolygon(bench.points, 0.1)
    expect(samples.length).toBeGreaterThan(1000)
    for (const [x, z] of samples) {
      const y = heightfield.sample(x, z)
      expect(y, `(${x}, ${z})`).toBeLessThanOrEqual(-DOWITCHER_WATER[0])
      expect(y, `(${x}, ${z})`).toBeGreaterThanOrEqual(-DOWITCHER_WATER[1])
    }
  })

  it('keeps the far water deep enough that a dipping pelican never finds the bed, with room for the line to swim a whole bout', () => {
    const water = loc.zones['far-water']
    expect(water?.kind).toBe('polygon')
    if (water?.kind !== 'polygon') return
    const samples = samplePolygon(water.points, 0.5)
    expect(samples.length).toBeGreaterThan(1000)
    // the bill tip goes `depth` under; the bed at least 15 cm below that
    for (const [x, z] of samples) expect(heightfield.sample(x, z), `(${x}, ${z})`).toBeLessThanOrEqual(-(PELICAN.dip.depth + 0.15))
    // the longest bout's line, abreast, swimming the zone's long way, with as much water again to choose where
    const birds = loc.cast.filter(e => e.zone === 'far-water').reduce((n, e) => n + e.count, 0)
    const longest = PELICAN.feed.speed * (PELICAN.feed.first + (PELICAN.feed.dips[1] - 1) * PELICAN.feed.every[1] + PELICAN.feed.window + dipSeconds(PELICAN, true) + 1)
    const [x0, x1, z0, z1] = bboxOf(water.points)
    expect(Math.max(x1 - x0, z1 - z0)).toBeGreaterThan(1.5 * longest)
    expect(Math.min(x1 - x0, z1 - z0)).toBeGreaterThan(4 * (birds - 1) * PELICAN.feed.spacing)
    // and all of it inside the open water the ducks have: no bank, no shelf
    const open = loc.zones['open-water']
    if (open?.kind !== 'polygon') throw new Error('open-water is a polygon')
    for (const [x, z] of water.points) expect(pointInPolygon(x + Math.sign(-x) * 0.01, z + (z < -40 ? 0.01 : -0.01), open.points), `(${x}, ${z})`).toBe(true)
  })

  it('stands the stumps the cormorants perch on in water, and keeps the water round them deep enough to dive in, all over', () => {
    const stumps = loc.zones['stumps']!
    expect(stumps.kind).toBe('point')
    if (stumps.kind !== 'point') return
    for (const s of STUMPS) expect(heightfield.sample(stumps.position[0] + s.dx, stumps.position[2] + s.dz)).toBeLessThan(-1)
    const water = loc.zones['cormorant-water']!
    expect(water.kind).toBe('polygon')
    if (water.kind !== 'polygon') return
    // a valley lake 1-5 m deep is fished to the bottom (research 7.1): a metre at least, so a dive goes under
    for (const [x, z] of samplePolygon(water.points)) expect(heightfield.sample(x, z), `(${x}, ${z})`).toBeLessThan(-1)
    // within a few metres of the stumps, so the fisher is seen from where the others perch
    const [cx, , cz] = stumps.position
    for (const [x, z] of water.points) expect(Math.hypot(x - cx, z - cz)).toBeLessThan(12)
  })
  it('the reeds zone matches the rendered reed bed bounds', () => {
    const reeds = loc.zones['reeds']
    expect(reeds?.kind).toBe('polygon')
    if (reeds?.kind !== 'polygon') return
    for (const [x, z] of reeds.points) {
      expect(x).toBeGreaterThanOrEqual(-16)
      expect(x).toBeLessThanOrEqual(-3)
      expect(z).toBeGreaterThanOrEqual(-14)
      expect(z).toBeLessThanOrEqual(-2)
    }
  })
})
