import { loadLocation } from './index'
import { lakeHeightfield } from '../world/heightfield'
import { terrainSurface } from '../world/terrain'
import { getSpec, hasSpec } from '../birds/species'
import { STYLES } from '../behavior/probe'
import { pointInPolygon } from './zones'
import type { Vec2 } from './schema'

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
  wade: y => y > -0.3,
}
const styleOf = (species: string) => (hasSpec(species) ? getSpec(species).foraging : undefined)
const checkFor = (behavior: string, species: string) => {
  const style = behavior === 'probe' ? styleOf(species) : undefined
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
    const style = entry.behavior === 'probe' ? styleOf(entry.species) : undefined
    const key = `${entry.zone}:${entry.behavior}:${style}`
    if (seen.has(key)) continue
    seen.add(key)

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
