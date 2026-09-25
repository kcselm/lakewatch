import { buildBird } from './procedural'
import { buildDetailedBird } from './detail/build'
import type { BirdModel } from './model'
import type { SpeciesSpec } from './spec'

/** The detailed builder for species with a detail block, the block builder for everything else. */
export function createBirdModel(spec: SpeciesSpec, variant?: string): BirdModel {
  return spec.detail ? buildDetailedBird(spec, variant) : buildBird(spec, variant)
}
