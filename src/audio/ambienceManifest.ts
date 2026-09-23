import { z } from 'zod'
import raw from '../../data/ambience.json'

const synthSource = z.object({ kind: z.literal('synth'), recipe: z.enum(['wind', 'lapping', 'frogs']) })
const fileSource = z.object({ kind: z.literal('file'), file: z.string().min(1), license: z.string().min(1), sourceUrl: z.string().url() })

export const ambienceLayerSchema = z.object({
  id: z.string().min(1),
  source: z.discriminatedUnion('kind', [synthSource, fileSource]),
  gain: z.number().min(0).max(1),
  /** gain follows the wind gust curve (wind-in-reeds) */
  followsWind: z.boolean().default(false),
  attribution: z.string().min(1),
})
export const ambienceManifestSchema = z.object({ layers: z.array(ambienceLayerSchema) })

export type AmbienceLayer = z.infer<typeof ambienceLayerSchema>

export function parseAmbience(data: unknown): AmbienceLayer[] {
  const m = ambienceManifestSchema.parse(data)
  const ids = new Set<string>()
  for (const l of m.layers) {
    if (ids.has(l.id)) throw new Error(`ambience: duplicate layer id ${l.id}`)
    ids.add(l.id)
  }
  return m.layers
}

let cache: AmbienceLayer[] | null = null
export function loadAmbience(): AmbienceLayer[] {
  if (!cache) cache = parseAmbience(raw)
  return cache
}
