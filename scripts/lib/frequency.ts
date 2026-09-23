export interface SampleDate {
  year: number
  month: number
  day: number
}

/** The 1st and 15th of each month — 24 samples across the year. */
export function sampleDates(year: number): SampleDate[] {
  const out: SampleDate[] = []
  for (let month = 1; month <= 12; month++) {
    out.push({ year, month, day: 1 }, { year, month, day: 15 })
  }
  return out
}

/** One sampled date at one hotspot: the species reported that day. */
export interface Sample {
  month: number
  observed: string[]
}

export interface SpeciesStats {
  frequency: number
  /** Jan..Dec share of reporting dates in that month on which the species appeared. */
  monthly: number[]
}

/**
 * Frequency per species. The denominator counts only samples on which
 * something was reported: a date with no checklists carries no information
 * about the birds.
 */
export function summarize(samples: readonly Sample[]): Map<string, SpeciesStats> {
  const active = samples.filter(s => s.observed.length > 0)
  const activePerMonth: number[] = Array(12).fill(0)
  for (const s of active) activePerMonth[s.month - 1]!++

  const seen = new Map<string, { total: number; perMonth: number[] }>()
  for (const s of active) {
    for (const code of new Set(s.observed)) {
      const e = seen.get(code) ?? { total: 0, perMonth: Array(12).fill(0) }
      e.total++
      e.perMonth[s.month - 1]!++
      seen.set(code, e)
    }
  }

  const out = new Map<string, SpeciesStats>()
  for (const [code, e] of seen) {
    out.set(code, {
      frequency: e.total / active.length,
      monthly: e.perMonth.map((n, i) => (activePerMonth[i] === 0 ? 0 : n / activePerMonth[i]!)),
    })
  }
  return out
}

export interface Candidate {
  habitats: string[]
  frequency: number
  monthly: number[]
}

export interface SelectOptions {
  /** Share of reporting dates a species must reach to count as living here. */
  minFrequency: number
  /** Backstop against a habitat with an unusually dense sample. */
  maxPerHabitat: number
}

/**
 * Species per habitat, deduped across habitats with habitats merged.
 *
 * The bar is the frequency, not the ranking. Taking a fixed top-n instead let
 * each habitat admit species at a completely different rate: the forest sample
 * was thin enough that its list reached down to birds reported on a tenth of
 * dates, while the wetland list — dense with waterfowl — cut off at a half.
 * Common marsh birds were dropped while marginal woodland ones were kept, and
 * every habitat ended up with exactly n species, which said more about n than
 * about the region.
 */
export function selectPerHabitat(
  statsByHabitat: Record<string, Map<string, SpeciesStats>>,
  { minFrequency, maxPerHabitat }: SelectOptions,
): Map<string, Candidate> {
  const out = new Map<string, Candidate>()

  for (const [habitat, stats] of Object.entries(statsByHabitat)) {
    const top = [...stats.entries()]
      .filter(([, s]) => s.frequency >= minFrequency)
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, maxPerHabitat)

    for (const [code, s] of top) {
      const existing = out.get(code)
      if (existing) {
        existing.habitats.push(habitat)
        existing.frequency = Math.max(existing.frequency, s.frequency)
        existing.monthly = existing.monthly.map((v, i) => Math.max(v, s.monthly[i]!))
      } else {
        out.set(code, { habitats: [habitat], frequency: s.frequency, monthly: [...s.monthly] })
      }
    }
  }

  return out
}
