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
  // eight on the lake: a call every 15 s between them, a loafing and grazing family being mostly quiet (estimate)
  cangoo:  { every: [60, 180], prefer: 'call' },
  leasan:  { every: [20, 60], prefer: 'call' },
  greyel:  { every: [30, 90], prefer: 'call' },
  amwpel:  { every: [200, 600], prefer: 'call' },
  lobdow:  { every: [20, 60], prefer: 'call' },
  pecsan:  { every: [30, 90], prefer: 'call' },
}

export const MAX_SIMULTANEOUS_CALLS = 3

export interface CallCandidate { id: number; species: string; distance: number }
export interface CallRequest { id: number; species: string; prefer: CallSchedule['prefer'] }

export interface CallScheduler {
  /** Birds due to call now, nearest first, at most (max - active) of them. */
  tick(now: number, birds: readonly CallCandidate[], active: number): CallRequest[]
}

export function createCallScheduler(rng: Rng, opts: { max?: number; schedules?: Record<string, CallSchedule> } = {}): CallScheduler {
  const max = opts.max ?? MAX_SIMULTANEOUS_CALLS
  const schedules = opts.schedules ?? CALL_SCHEDULES
  const nextAt = new Map<number, number>()
  const scheduleFor = (species: string) => schedules[species] ?? DEFAULT_SCHEDULE
  const between = ([lo, hi]: [number, number]) => lo + rng() * (hi - lo)

  return {
    tick(now, birds, active) {
      const due: CallCandidate[] = []
      const present = new Set<number>()
      for (const b of birds) {
        present.add(b.id)
        let t = nextAt.get(b.id)
        if (t === undefined) {
          t = now + between(scheduleFor(b.species).every) * rng()     // stagger first calls
          nextAt.set(b.id, t)
        }
        if (t <= now) due.push(b)
      }
      for (const id of [...nextAt.keys()]) if (!present.has(id)) nextAt.delete(id)   // birds that left (flocks)
      due.sort((a, b) => a.distance - b.distance)
      const slots = Math.max(0, max - active)
      const out: CallRequest[] = []
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
