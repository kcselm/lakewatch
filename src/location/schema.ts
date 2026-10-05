import { z } from 'zod'
import type { Habitat } from '../catalog/types'

const vec2 = z.tuple([z.number(), z.number()])
const vec3 = z.tuple([z.number(), z.number(), z.number()])

const polygonZone = z.object({ kind: z.literal('polygon'), points: z.array(vec2).min(3, 'polygon needs at least 3 points') })
const pointZone = z.object({ kind: z.literal('point'), position: vec3 })
const laneZone = z.object({
  kind: z.literal('lane'), from: vec3, to: vec3,
  altitude: z.tuple([z.number(), z.number()]),
})
/**
 * A perch over the water. `position` is where a bird's feet grip it, the top of the branch, as [x, z], and `height` how
 * far that is above the water (y = 0); `radius` is the branch's there. `facing` is the compass bearing a bird on it faces,
 * out over the water, in degrees as the vantage's heading is (0 toward -z, 90 toward +x); the branch runs across it.
 * `on` says what the perch is: a branch of the snag (the `snag` point zone's dead tree), or a dead branch of its own,
 * built from this entry.
 */
const perch = z.object({
  name: z.string().min(1),
  on: z.enum(['snag', 'branch']),
  position: vec2,
  height: z.number().positive(),
  radius: z.number().positive(),
  facing: z.number().min(0).lt(360),
})
/** Every perch one bird moves between; the first is where it starts. */
const perchesZone = z.object({ kind: z.literal('perches'), perches: z.array(perch).min(1, 'perches needs at least one perch') })
const zoneSchema = z.discriminatedUnion('kind', [polygonZone, pointZone, laneZone, perchesZone])

export const behaviorSchema = z.enum(['swim', 'wade', 'probe', 'perch', 'flyover', 'kingfisher'])

const castEntry = z.object({
  species: z.string().min(1),
  behavior: behaviorSchema,
  zone: z.string().min(1),
  count: z.number().int().min(1),
  /**
   * one version for every bird, `mixed` for a random pick each, or how many birds wear each version (summing to
   * `count`; validateCast checks the names and the sum)
   */
  plumage: z.union([z.enum(['male', 'female', 'mixed']), z.record(z.string(), z.number().int().min(1))]).optional(),
  everySeconds: z.tuple([z.number().positive(), z.number().positive()]).optional(),
  /** flyover only: pelicans fly a line, geese a V. Default line. */
  formation: z.enum(['line', 'vee']).optional(),
  /** the goose style only: the polygon zone its family walks out to graze, across the shore from `zone` */
  ashore: z.string().min(1).optional(),
  /**
   * the goose style only: the entry's birds in their units, in order, summing to `count`: the first a family (a pair
   * and its young), each later one a loose unit of adults
   */
  groups: z.array(z.number().int().min(1)).min(1).optional(),
})

export const locationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string(),
  habitat: z.enum(['wetland', 'forest', 'shoreline', 'urban']),
  season: z.enum(['spring', 'summer', 'early-autumn', 'autumn', 'winter']),
  timeOfDay: z.enum(['dawn', 'morning', 'midday', 'evening']),
  vantage: z.object({ position: vec3, heading: z.number() }),
  wind: z.object({
    direction: z.number().min(0).max(360),
    strength: z.number().min(0).max(1),
    gustiness: z.number().min(0).max(1),
  }),
  zones: z.record(z.string(), zoneSchema),
  cast: z.array(castEntry),
  ambience: z.array(z.string()),
})

export type Vec2 = z.infer<typeof vec2>
export type Vec3 = z.infer<typeof vec3>
export type Zone = z.infer<typeof zoneSchema>
export type PolygonZone = z.infer<typeof polygonZone>
export type PointZone = z.infer<typeof pointZone>
export type LaneZone = z.infer<typeof laneZone>
export type PerchesZone = z.infer<typeof perchesZone>
export type PerchEntry = z.infer<typeof perch>
export type Behavior = z.infer<typeof behaviorSchema>
export type CastEntry = z.infer<typeof castEntry>
export type Location = Omit<z.infer<typeof locationSchema>, 'habitat'> & { habitat: Habitat }

export function parseLocation(data: unknown): Location {
  return locationSchema.parse(data) as Location
}
