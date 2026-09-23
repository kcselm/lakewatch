/**
 * Habitat is derived from "was this species in the top slice by reporting
 * frequency at these three hotspots". The anchor sites are large and mixed —
 * Fort Stevens is mostly coastal forest, Oaks Bottom is a floodplain wetland
 * inside the city — so the sample records where a bird was *seen*, not where it
 * *lives*. That produces both false positives (a shoveler on a nature-park pond
 * labelled forest) and false negatives (a starling that never tops the list at
 * a wildlife refuge, so it is never labelled urban).
 *
 * This is the editorial layer over that sample, in the style of
 * `data/name-overrides.json`. It is committed and reviewable.
 */

export interface HabitatOverride {
  add?: string[]
  remove?: string[]
  /** Why the sample was wrong. Ignored by the code; the file documents itself. */
  why?: string
}

export type HabitatOverrides = Record<string, HabitatOverride>

interface SpeciesLike {
  speciesCode: string
  habitats: string[]
}

/**
 * Adds and removes habitats per species code. `unused` lists override keys that
 * matched nothing, so a mistyped species code surfaces instead of doing nothing.
 */
export function applyHabitatOverrides<T extends SpeciesLike>(
  birds: readonly T[],
  overrides: HabitatOverrides,
): { birds: T[]; unused: string[] } {
  const matched = new Set<string>()

  const out = birds.map(bird => {
    const override = overrides[bird.speciesCode]
    if (!override) return { ...bird }
    matched.add(bird.speciesCode)

    const habitats = [...bird.habitats]
    for (const h of override.add ?? []) {
      if (!habitats.includes(h)) habitats.push(h)
    }

    const removed = new Set(override.remove ?? [])
    return { ...bird, habitats: habitats.filter(h => !removed.has(h)) }
  })

  return { birds: out, unused: Object.keys(overrides).filter(code => !matched.has(code)) }
}
