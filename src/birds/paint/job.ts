import { getSpec } from '../species'
import { paintSpecies, type AtlasJob, type PaintedAtlas } from './painter'

/**
 * The paint worker's handler, a plain function so node tests can run it: paint one species-and-version atlas from
 * the registry, timed. The pixels own their whole buffer, so the worker can transfer it back rather than copy it.
 */
export function paintJob(job: AtlasJob): PaintedAtlas {
  const t0 = performance.now()
  const pixels = paintSpecies(getSpec(job.code), job.variant)
  return { code: job.code, variant: job.variant, pixels, ms: performance.now() - t0 }
}
