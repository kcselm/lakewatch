import type { Location } from '../location/schema'
import type { SpeciesSpec } from './spec'
import { SPECIES } from './species'
import { expandCast } from './spawn'
import { makeRng } from '../catalog/rng'
import { createBirdModel } from './factory'

export interface PrewarmOptions {
  /** yields to the browser between species; defaults to one animation frame, or a zero timeout without one */
  next?: () => Promise<void>
  /** called once for each detailed species built: how many are built, of how many */
  onProgress?: (done: number, total: number) => void
  /** the registry, or a test's own (as castAtlases takes) */
  specs?: Record<string, SpeciesSpec>
}

function defaultNext(): Promise<void> {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve())
    else setTimeout(resolve, 0)
  })
}

/**
 * Every detailed species the cast can need, once each, in cast order: whatever `expandCast` would build, minus the
 * duplicates and the block species. Doesn't depend on the spawner's seed (mirrors castAtlases's own traversal).
 */
function detailedCastSpecies(loc: Location, specs: Record<string, SpeciesSpec>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const ind of expandCast(loc, makeRng(1))) {
    if (seen.has(ind.species) || !specs[ind.species]?.detail) continue
    seen.add(ind.species)
    out.push(ind.species)
  }
  return out
}

/**
 * Builds each detailed species the cast needs once, throwaway, so its first build's cost (the folded wing's
 * placement, the loft, and the rest of it: about 2 s across a fresh process's 12 species) runs here, a species at a
 * time behind the title card, instead of blocking `spawnCast` on the main thread all at once.
 *
 * Only the geometry a throwaway build makes is disposed. The atlas material (and its texture) it draws from stays in
 * the painter's cache, which `prepaint` has already filled for the cast and which every bird of the species shares;
 * disposing it here would break every bird `spawnCast` builds afterward.
 *
 * Yields to the browser (`next`, one animation frame by default) between species, so no single step blocks the main
 * thread for longer than one species' build. A build that throws rejects here, exactly as `spawnCast`'s would.
 */
export async function prewarmBirds(loc: Location, opts: PrewarmOptions = {}): Promise<void> {
  const specs = opts.specs ?? SPECIES
  const next = opts.next ?? defaultNext
  const species = detailedCastSpecies(loc, specs)
  const total = species.length
  for (let i = 0; i < species.length; i++) {
    if (i > 0) await next()
    const model = createBirdModel(specs[species[i]!]!)
    model.dispose()
    opts.onProgress?.(i + 1, total)
  }
}
