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
const zoneSchema = z.discriminatedUnion('kind', [polygonZone, pointZone, laneZone])

export const behaviorSchema = z.enum(['swim', 'wade', 'probe', 'perch', 'flyover', 'hover'])

const castEntry = z.object({
  species: z.string().min(1),
  behavior: behaviorSchema,
  zone: z.string().min(1),
  count: z.number().int().min(1),
  plumage: z.enum(['male', 'female', 'mixed']).optional(),
  everySeconds: z.tuple([z.number().positive(), z.number().positive()]).optional(),
  /** flyover only: pelicans fly a line, geese a V. Default line. */
  formation: z.enum(['line', 'vee']).optional(),
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
export type Behavior = z.infer<typeof behaviorSchema>
export type CastEntry = z.infer<typeof castEntry>
export type Location = Omit<z.infer<typeof locationSchema>, 'habitat'> & { habitat: Habitat }

export function parseLocation(data: unknown): Location {
  return locationSchema.parse(data) as Location
}
