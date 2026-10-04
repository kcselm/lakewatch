import type { Location } from '../../location/schema'
import { fliesDetailed, type SpeciesSpec } from '../spec'
import { SPECIES, getSpec } from '../species'
import { expandCast } from '../spawn'
import { makeRng } from '../../catalog/rng'
import { atlasKey, atlasReady, materialFor, storeAtlas, type AtlasJob, type PaintedAtlas } from './painter'

/**
 * Every atlas the cast's detailed birds can need: each version of a species with versions, and the species' own
 * plumage for a bird with none. That covers whatever versions a 'mixed' entry picks, so the list doesn't depend on
 * the spawner's seed. A flyover flock of a detailed species needs its atlases too; one of block birds needs none.
 * `specs` is the registry, or a test's own.
 */
export function castAtlases(loc: Location, specs: Record<string, SpeciesSpec> = SPECIES): AtlasJob[] {
  const jobs = new Map<string, AtlasJob>()
  const add = (code: string, variant?: string) => { jobs.set(atlasKey({ code, variant }), { code, variant }) }
  for (const ind of expandCast(loc, makeRng(1))) {
    const spec = specs[ind.species]
    if (!spec?.detail) continue
    if (ind.variant === undefined) add(ind.species)
    else for (const v of Object.keys(spec.variants)) add(ind.species, v)
  }
  for (const entry of loc.cast) {
    const spec = specs[entry.species]
    if (entry.behavior !== 'flyover' || !spec || !fliesDetailed(spec)) continue
    if (entry.plumage === undefined || Object.keys(spec.variants).length === 0) add(entry.species)
    else for (const v of Object.keys(spec.variants)) add(entry.species, v)
  }
  return [...jobs.values()]
}

/** The part of a Worker that prepaint uses, so a test can hand it a stand-in. */
export interface PaintWorker {
  onmessage: ((e: MessageEvent<PaintedAtlas>) => void) | null
  onerror: ((e: ErrorEvent) => void) | null
  postMessage(job: AtlasJob): void
  terminate(): void
}

export interface PrepaintOptions {
  /** makes the paint worker (main.tsx: `paint.worker.ts`); none, or one that throws, paints on the main thread */
  worker?: () => PaintWorker
  /** called at the start and after each atlas: how many are ready, of how many */
  onProgress?: (done: number, total: number) => void
}

/**
 * Paint every atlas in `jobs` that isn't painted yet, in the worker, and keep each for materialFor, so building a bird
 * paints nothing. Each paint's time goes into paintStats. If the worker can't be made, or fails, whatever it hasn't
 * painted is painted here on the main thread, one atlas per task so the page can still redraw between them.
 * Resolves once every atlas is ready.
 */
export async function prepaint(jobs: readonly AtlasJob[], opts: PrepaintOptions = {}): Promise<void> {
  const todo = new Map<string, AtlasJob>()
  for (const j of jobs) if (!atlasReady(j)) todo.set(atlasKey(j), j)
  const total = todo.size
  let done = 0
  opts.onProgress?.(0, total)
  if (total === 0) return

  let worker: PaintWorker | null = null
  try {
    worker = opts.worker?.() ?? null
  } catch (err) {
    console.warn(`paint worker: ${String(err)}; painting on the main thread`)
  }
  if (worker) {
    const w = worker
    await new Promise<void>(resolve => {
      w.onmessage = e => {
        if (!todo.delete(atlasKey(e.data))) return
        storeAtlas(e.data)
        opts.onProgress?.(++done, total)
        if (todo.size === 0) resolve()
      }
      w.onerror = e => {
        console.warn(`paint worker failed (${e.message || 'it did not load'}); painting the rest on the main thread`)
        resolve()
      }
      for (const j of todo.values()) w.postMessage(j)
    })
    w.onmessage = null
    w.onerror = null
    w.terminate()
  }
  for (const j of todo.values()) {
    await new Promise(r => setTimeout(r, 0))
    materialFor(getSpec(j.code), j.variant)
    opts.onProgress?.(++done, total)
  }
}
