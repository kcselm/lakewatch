import type { Rng } from '../catalog/types'

export interface CallSchedule {
  /** seconds between one bird's calls, [min, max] */
  every: [number, number]
  prefer: 'call' | 'song' | 'any'
}

export const DEFAULT_SCHEDULE: CallSchedule = { every: [30, 90], prefer: 'any' }

/** Per-species cadence. Herons and egrets are nearly silent; wrens and blackbirds never stop. */
export const CALL_SCHEDULES: Record<string, CallSchedule> = {
  y00475:  { every: [15, 50], prefer: 'call' },
  mallar3: { every: [20, 70], prefer: 'call' },
  gadwal:  { every: [40, 120], prefer: 'call' },
  amewig:  { every: [20, 60], prefer: 'call' },
  norsho:  { every: [60, 180], prefer: 'call' },
  pibgre:  { every: [45, 150], prefer: 'song' },
  grbher3: { every: [120, 300], prefer: 'call' },
  greegr:  { every: [120, 300], prefer: 'call' },
  killde:  { every: [12, 40], prefer: 'call' },
  rewbla:  { every: [8, 25], prefer: 'song' },
  marwre:  { every: [10, 30], prefer: 'song' },
  belkin1: { every: [40, 120], prefer: 'call' },
  cangoo:  { every: [15, 45], prefer: 'call' },
  leasan:  { every: [20, 60], prefer: 'call' },
  greyel:  { every: [30, 90], prefer: 'call' },
  lobdow:  { every: [20, 60], prefer: 'call' },
  pecsan:  { every: [30, 90], prefer: 'call' },
}

/**
 * Species that never call here. An American White Pelican is silent away from its colony
 * (docs/research/2026-09-30-american-white-pelican.md, section 7.6).
 */
export const SILENT: ReadonlySet<string> = new Set(['amwpel'])

export const MAX_SIMULTANEOUS_CALLS = 3

export interface CallCandidate { id: number; species: string; distance: number }
export interface CallRequest { id: number; species: string; prefer: CallSchedule['prefer'] }

export interface CallScheduler {
  /**
   * Birds to call now, at most (max - active) of them: first those whose behaviour asked for a call since the last
   * tick, then those due by their timers, each nearest first.
   */
  tick(now: number, birds: readonly CallCandidate[], active: number): CallRequest[]
  /**
   * A behaviour asks for its bird's call now (the kingfisher's rattle as it takes off). It plays at the next tick if
   * the cap leaves room, and is dropped if not, or if the bird isn't among those offered then: a call tied to a
   * moment would be wrong late. A call played this way puts the bird's next timed one off by a full interval.
   */
  ask(id: number): void
}

export function createCallScheduler(rng: Rng, opts: { max?: number; schedules?: Record<string, CallSchedule>; silent?: ReadonlySet<string> } = {}): CallScheduler {
  const max = opts.max ?? MAX_SIMULTANEOUS_CALLS
  const schedules = opts.schedules ?? CALL_SCHEDULES
  const silent = opts.silent ?? SILENT
  const nextAt = new Map<number, number>()
  const asked = new Set<number>()
  const scheduleFor = (species: string) => schedules[species] ?? DEFAULT_SCHEDULE
  const between = ([lo, hi]: [number, number]) => lo + rng() * (hi - lo)

  return {
    ask(id) { asked.add(id) },
    tick(now, birds, active) {
      const due: CallCandidate[] = []
      const asking: CallCandidate[] = []
      const present = new Set<number>()
      for (const b of birds) {
        if (silent.has(b.species)) continue
        present.add(b.id)
        let t = nextAt.get(b.id)
        if (t === undefined) {
          t = now + between(scheduleFor(b.species).every) * rng()     // stagger first calls
          nextAt.set(b.id, t)
        }
        if (asked.has(b.id)) asking.push(b)
        else if (t <= now) due.push(b)
      }
      asked.clear()
      for (const id of [...nextAt.keys()]) if (!present.has(id)) nextAt.delete(id)   // birds that left (flocks)
      asking.sort((a, b) => a.distance - b.distance)
      due.sort((a, b) => a.distance - b.distance)
      let slots = Math.max(0, max - active)
      const out: CallRequest[] = []
      for (const b of asking) {
        if (slots === 0) break                         // no room: the ask is dropped, and its timer left as it was
        slots--
        out.push({ id: b.id, species: b.species, prefer: scheduleFor(b.species).prefer })
        nextAt.set(b.id, now + between(scheduleFor(b.species).every))
      }
      due.forEach((b, i) => {
        if (i < slots) {
          out.push({ id: b.id, species: b.species, prefer: scheduleFor(b.species).prefer })
          nextAt.set(b.id, now + between(scheduleFor(b.species).every))
        } else {
          nextAt.set(b.id, now + 2 + rng() * 4)      // crowded out: try again soon
        }
      })
      return out
    },
  }
}
