import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { SPEC as amecoo } from './amecoo'
import { SPEC as mallar3 } from './mallar3'
import { SPEC as grbher3 } from './grbher3'
import { SPEC as killde } from './killde'
import { SPEC as gadwal } from './gadwal'
import { SPEC as amewig } from './amewig'
import { SPEC as norsho } from './norsho'
import { SPEC as pibgre } from './pibgre'
import { SPEC as greegr } from './greegr'
import { SPEC as cangoo } from './cangoo'
import { SPEC as belkin1 } from './belkin1'
import { SPEC as rewbla } from './rewbla'
import { SPEC as marwre } from './marwre'
import { SPEC as amwpel } from './amwpel'
import { SPEC as leasan } from './leasan'
import { SPEC as greyel } from './greyel'
import { SPEC as lesyel } from './lesyel'
import { SPEC as pecsan } from './pecsan'
import { SPEC as lobdow } from './lobdow'
import { SPEC as doccor } from './doccor'

const ALL: SpeciesSpec[] = [amecoo, mallar3, grbher3, killde, gadwal, amewig, norsho, pibgre, greegr, cangoo, belkin1, rewbla, marwre, amwpel, leasan, greyel, lesyel, pecsan, lobdow, doccor].map(parseSpeciesSpec)

export const SPECIES: Record<string, SpeciesSpec> = Object.fromEntries(ALL.map(s => [s.code, s]))

/** Own keys only, so "constructor" or "toString" (say, from a hand-edited viewer link) is never a species. */
export function hasSpec(code: string): boolean {
  return Object.hasOwn(SPECIES, code)
}

export function getSpec(code: string): SpeciesSpec {
  if (!hasSpec(code)) throw new Error(`No species spec for ${code}`)
  return SPECIES[code]!
}
