import { z } from 'zod'
import type { Bird } from './types'

const habitatSchema = z.enum(['wetland', 'forest', 'shoreline', 'urban'])

const audioClipSchema = z.object({
  file: z.string().min(1),
  type: z.enum(['song', 'call']),
  xcId: z.string().min(1),
  recordist: z.string(),
  license: z.string().min(1),
  sourceUrl: z.string().url(),
})

const photoSchema = z.object({
  file: z.string().min(1),
  attribution: z.string(),
  license: z.string().min(1),
  sourceUrl: z.string().url(),
})

export const birdSchema = z.object({
  speciesCode: z.string().min(1),
  commonName: z.string().min(1),
  scientificName: z.string().min(1),
  family: z.string().min(1),
  familyCommon: z.string(),
  habitats: z.array(habitatSchema).min(1),
  frequency: z.number().min(0).max(1),
  monthly: z.array(z.number().min(0).max(1)).length(12),
  audio: z.array(audioClipSchema),
  photo: photoSchema.nullable(),
})

export const birdsSchema = z.array(birdSchema)

export function parseBirds(data: unknown): Bird[] {
  return birdsSchema.parse(data) as Bird[]
}
