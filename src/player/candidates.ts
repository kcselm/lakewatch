import type { BirdInstance } from '../birds/registry'
import type { Candidate } from './target'

/**
 * What the reticle can pick from: every registered bird the player can see, at its model's centre. A bird the spawner
 * has hidden, one all the way under the water, is not a candidate: otherwise the player could identify a bird they
 * cannot see.
 */
export function targetCandidates(birds: readonly BirdInstance[]): Candidate[] {
  return birds
    .filter(b => b.model.group.visible)
    .map(b => ({ id: b.id, species: b.species, position: b.model.group.localToWorld(b.model.center.clone()), radius: b.model.radius }))
}
