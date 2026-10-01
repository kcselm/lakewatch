import type { Location } from '../location/schema'
import type { SpeciesSpec } from './spec'
import { SPECIES } from './species'
import { expandCast } from './spawn'
import { makeRng } from '../catalog/rng'
import { placeFoldedWing } from './detail/wing'
import { castAtlases, prepaint, type PrepaintOptions } from './paint/prepaint'

export interface PlaceFoldsOptions {
  /** yields to the browser; defaults to one animation frame, or a zero timeout without one */
  next?: () => Promise<void>
  /** called at the start and after each species: how many are done, of how many */
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
 * Every detailed species the cast can need, once each: whatever `expandCast` would build, in cast order, then the
 * flyover flocks', minus the duplicates and the block species. Doesn't depend on the spawner's seed (mirrors
 * castAtlases's own traversal).
 */
function detailedCastSpecies(loc: Location, specs: Record<string, SpeciesSpec>): string[] {
  const seen = new Set<string>()
  for (const ind of expandCast(loc, makeRng(1))) if (specs[ind.species]?.detail) seen.add(ind.species)
  for (const entry of loc.cast) if (entry.behavior === 'flyover' && specs[entry.species]?.detail) seen.add(entry.species)
  return [...seen]
}

/**
 * Places the folded wing of each detailed species the cast needs (`placeFoldedWing`), a species at a time, so no bird
 * build places one later. It is the builder's only per-species cache, and the costly part of a species' first build.
 * It needs no atlas, so it runs on the main thread while the worker paints them.
 *
 * Yields (`next`) before each species: two frames before the first, so the title card is drawn before any placing (a
 * frame's animation callbacks, where the work resumes, run before it is drawn), and one between species, whose count
 * is then drawn. Counts from 0 to the number of species, once each. A placement that throws rejects here.
 */
export async function placeFolds(loc: Location, opts: PlaceFoldsOptions = {}): Promise<void> {
  const specs = opts.specs ?? SPECIES
  const next = opts.next ?? defaultNext
  const species = detailedCastSpecies(loc, specs)
  const total = species.length
  opts.onProgress?.(0, total)
  for (let i = 0; i < total; i++) {
    if (i === 0) await next()
    await next()
    placeFoldedWing(specs[species[i]!]!.detail!)
    opts.onProgress?.(i + 1, total)
  }
}

export interface PrepareOptions extends PlaceFoldsOptions {
  /** makes the paint worker, as for `prepaint` */
  worker?: PrepaintOptions['worker']
  /** builds the cast (main.tsx: `spawnCast`), once every atlas is painted and every fold placed; one step of the count */
  build?: () => void
}

/**
 * Gets the cast's birds ready behind the title card. It paints every atlas the cast needs (`prepaint`, in the worker)
 * and, meanwhile, places every folded wing on the main thread (`placeFolds`). When both are done, it yields two frames,
 * so one draws the count, and runs `build`.
 *
 * `onProgress` gets one count over all of it: the atlases still to paint, the species, and the build. The total is set
 * before anything starts, so it never changes, and the count reaches it once, when the build is done. Rejects if any
 * part does, and builds nothing if painting or placing does.
 *
 * No throwaway build warms the engine first: measured in the browser, one per species after painting cut the cast's
 * build by about 0.2 s but took 0.4 s itself, so Begin came later.
 */
export async function prepareBirds(loc: Location, opts: PrepareOptions = {}): Promise<void> {
  const specs = opts.specs ?? SPECIES
  const next = opts.next ?? defaultNext
  const folds = { done: 0, total: detailedCastSpecies(loc, specs).length }
  const atlases = { done: 0, total: 0 }
  const built = { done: 0, total: opts.build ? 1 : 0 }
  const report = () => opts.onProgress?.(
    atlases.done + folds.done + built.done,
    atlases.total + folds.total + built.total,
  )
  // prepaint first: it reports its total before it awaits anything, so even the first count has the whole total
  const painting = prepaint(castAtlases(loc, specs), {
    worker: opts.worker,
    onProgress: (done, total) => { atlases.done = done; atlases.total = total; report() },
  })
  const placing = placeFolds(loc, { next, specs, onProgress: done => { folds.done = done; report() } })
  await Promise.all([painting, placing])
  if (!opts.build) return
  // the build blocks the main thread for a while, so draw the count first. The last atlas can arrive between frames,
  // and a frame's animation callbacks run before it is drawn: one frame to draw it, the build in the next.
  await next()
  await next()
  opts.build()
  built.done = 1
  report()
}
