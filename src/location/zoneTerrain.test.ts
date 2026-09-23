import { loadLocation } from './index'
import { lakeHeightfield } from '../world/heightfield'
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

// Ground-height bounds that make each behavior look right against the terrain: swimmers need
// real water, probers need damp flat ground (not standing water, not dry), waders need dry-ish
// ground clear of deep water.
const GROUND_OK: Record<string, (y: number) => boolean> = {
  swim: y => y < -0.2,
  probe: y => y >= -0.03 && y <= 0.5,
  wade: y => y > -0.3,
}

describe('zone polygons agree with the heightfield', () => {
  const loc = loadLocation()
  const heightfield = lakeHeightfield(7)

  const seen = new Set<string>()
  for (const entry of loc.cast) {
    const zone = loc.zones[entry.zone]
    const check = GROUND_OK[entry.behavior]
    if (!zone || zone.kind !== 'polygon' || !check) continue
    const key = `${entry.zone}:${entry.behavior}`
    if (seen.has(key)) continue
    seen.add(key)

    it(`${entry.zone} (${entry.behavior}) samples all agree with the terrain`, () => {
      const samples = samplePolygon(zone.points)
      expect(samples.length).toBeGreaterThan(0)
      for (const [x, z] of samples) {
        const y = heightfield.sample(x, z)
        expect(check(y)).toBe(true)
      }
    })
  }

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
