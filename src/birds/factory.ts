import { buildBird } from './procedural'
import { buildDetailedBird } from './detail/build'
import type { BirdModel } from './model'
import { isDetailed, type SpeciesSpec } from './spec'

/** The detailed builder for detailed species (lofted or authored), the block builder for everything else. */
export function createBirdModel(spec: SpeciesSpec, variant?: string): BirdModel {
  return isDetailed(spec) ? buildDetailedBird(spec, variant) : buildBird(spec, variant)
}
