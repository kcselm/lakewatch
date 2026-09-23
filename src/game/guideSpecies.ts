import type { Bird, Habitat } from '../catalog/types'

export function guideSpecies(catalog: readonly Bird[], habitat: Habitat): Bird[] {
  return catalog
    .filter(b => b.habitats.includes(habitat))
    .sort((a, b) => a.familyCommon.localeCompare(b.familyCommon) || a.commonName.localeCompare(b.commonName))
}
