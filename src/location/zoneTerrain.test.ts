import { loadLocation } from './index'
import { lakeHeightfield } from '../world/heightfield'
import { terrainSurface } from '../world/terrain'
import { getSpec, hasSpec } from '../birds/species'
import { STYLES } from '../behavior/probe'
import { HERON_WATER } from '../behavior/heron'
import { PELICAN, dipSeconds } from '../behavior/pelican'
import { bakeWaterDepth } from '../world/waterDepth'
import { createSnag, createDeadBranch } from '../world/trees'
import { pointInPolygon } from './zones'
import type { Vec2, PerchEntry } from './schema'

/**
 * The kingfisher's perches, from the research (2026-09-30-belted-kingfisher.md, sections 6, 7.1 and 11): water at least
 * 0.3 m deep under a plunge by the depth bake (an Estimate from the 15 cm its fish swim in and the body's length), a
 * perch 2-6 m above the water, and perches one every 25 m of shore at the closest (Prose 1985's 40 a kilometre) and
 * no more than the longest flight between them, 100 m, apart. The reeds' clearance is chosen: a perch and its plunge
 * well off the reed bed, so a bird on it is seen against open water.
 */
const PLUNGE_DEPTH = 0.3
const PERCH_HEIGHT = [2, 6] as const
const PERCH_SPACING = [25, 100] as const
const REED_CLEARANCE = 3

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

  describe("the kingfisher's perches", () => {
    const zone = loc.zones['perches']
    if (zone?.kind !== 'perches') throw new Error('the lake has a perches zone')
    const depth = bakeWaterDepth(heightfield)
    const [vx, , vz] = loc.vantage.position
    const fromVantage = (p: PerchEntry) => Math.hypot(p.position[0] - vx, p.position[1] - vz)
    const toward = (p: PerchEntry, bearing: number, d: number): Vec2 => {
      const b = (bearing * Math.PI) / 180
      return [p.position[0] + Math.sin(b) * d, p.position[1] - Math.cos(b) * d]
    }
    /**
     * Where a plunge from the perch can go in: the water under it, and ahead out to the perch's height either side of
     * its facing. The flight research has a perch plunge enter at 40-70 degrees below level on a path curving out from
     * the perch, so a 45-degree line from the perch reaches about as far as one goes, and the bird turns a little to
     * its fish (Estimate).
     */
    const plungeReach = (p: PerchEntry): Vec2[] => {
      const out: Vec2[] = [p.position]
      for (let d = 0.25; d <= p.height + 1e-9; d += 0.25) {
        for (let a = -60; a <= 60; a += 10) out.push(toward(p, p.facing + a, d))
      }
      return out
    }

    for (const p of zone.perches) {
      it(`${p.name}: water at least ${PLUNGE_DEPTH} m deep below it and wherever a plunge from it goes in`, () => {
        for (const [x, z] of plungeReach(p)) expect(depth.at(x, z), `(${x.toFixed(2)}, ${z.toFixed(2)})`).toBeGreaterThanOrEqual(PLUNGE_DEPTH)
      })
      it(`${p.name}: clear of the reed bed by ${REED_CLEARANCE} m, plunge and all`, () => {
        const reeds = loc.zones['reeds']
        if (reeds?.kind !== 'polygon') throw new Error('reeds is a polygon')
        const [x0, x1, z0, z1] = bboxOf(reeds.points)
        for (const [x, z] of plungeReach(p)) {
          const gap = Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1))
          expect(gap, `(${x.toFixed(2)}, ${z.toFixed(2)})`).toBeGreaterThanOrEqual(REED_CLEARANCE)
        }
      })
      it(`${p.name}: ${PERCH_HEIGHT[0]}-${PERCH_HEIGHT[1]} m above the water, and no nearer the vantage than the research's edge`, () => {
        expect(p.height).toBeGreaterThanOrEqual(PERCH_HEIGHT[0])
        expect(p.height).toBeLessThanOrEqual(PERCH_HEIGHT[1])
        expect(fromVantage(p)).toBeGreaterThanOrEqual(25)
      })
      if (p.on === 'branch') {
        it(`${p.name}: a branch the research's 3-4 cm across`, () => {
          expect(p.radius).toBeGreaterThanOrEqual(0.015)
          expect(p.radius).toBeLessThanOrEqual(0.02)
        })
        it(`${p.name}: its dead branch roots on the bank behind it`, () => {
          const d = createDeadBranch(p, heightfield)
          expect(heightfield.sample(d.root.x, d.root.z)).toBeGreaterThan(0)
          expect(d.perchPoint.toArray()).toEqual([p.position[0], p.height, p.position[1]])
        })
      }
    }

    it('starts the bird on the snag, the perch it has always had, and the snag perch is where the snag puts it', () => {
      const first = zone.perches[0]!
      expect([first.name, first.on]).toEqual(['snag', 'snag'])
      const at = loc.zones['snag']
      if (at?.kind !== 'point') throw new Error('snag is a point')
      const snag = createSnag(at.position)
      expect(first.position[0]).toBeCloseTo(snag.perchPoint.x, 2)
      expect(first.height).toBeCloseTo(snag.perchPoint.y, 2)
      expect(first.position[1]).toBeCloseTo(snag.perchPoint.z, 2)
      expect(first.radius).toBeCloseTo(snag.perchRadius, 3)
      // the snag's branch runs along x, so a bird across it faces along z
      expect(Math.sin((first.facing * Math.PI) / 180)).toBeCloseTo(0, 9)
    })
    it('has a near perch in binocular range, 30-35 m out, side-on to the vantage', () => {
      const near = zone.perches.filter(p => fromVantage(p) >= 30 && fromVantage(p) <= 35)
      expect(near).toHaveLength(1)
      const p = near[0]!
      // the research: facing the water, side-on to the player, not toward them; within 30 degrees of square to the line of sight
      const sight = Math.atan2(p.position[0] - vx, -(p.position[1] - vz)) * 180 / Math.PI
      const off = Math.abs(((p.facing - sight + 540) % 360) - 180)
      expect(Math.abs(off - 90)).toBeLessThanOrEqual(30)
    })
    it('keeps its perches apart along the shore', () => {
      const ps = zone.perches
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const d = Math.hypot(ps[i]!.position[0] - ps[j]!.position[0], ps[i]!.position[1] - ps[j]!.position[1])
          expect(d, `${ps[i]!.name} to ${ps[j]!.name}`).toBeGreaterThanOrEqual(PERCH_SPACING[0])
          expect(d, `${ps[i]!.name} to ${ps[j]!.name}`).toBeLessThanOrEqual(PERCH_SPACING[1])
        }
      }
    })
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
