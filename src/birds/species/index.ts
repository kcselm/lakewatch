import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { SPEC as amecoo } from './amecoo'
import { SPEC as mallar3 } from './mallar3'
import { SPEC as grbher3 } from './grbher3'
import { SPEC as killde } from './killde'

const ALL: SpeciesSpec[] = [amecoo, mallar3, grbher3, killde].map(parseSpeciesSpec)

export const SPECIES: Record<string, SpeciesSpec> = Object.fromEntries(ALL.map(s => [s.code, s]))

export function hasSpec(code: string): boolean {
  return code in SPECIES
}

export function getSpec(code: string): SpeciesSpec {
  const s = SPECIES[code]
  if (!s) throw new Error(`No species spec for ${code}`)
  return s
}
