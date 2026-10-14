import type { Bird } from '../catalog/types'
import type { Location, CastEntry } from '../location/schema'
import type { SpeciesSpec } from '../birds/spec'

/**
 * The study screen's choices for a species, before the lake: which birds it lists, the poses and plumages each can be
 * shown in, and where on the lake each one lives. Plain data, so the screen (ui/Study.tsx) and the stage
 * (study/stage.ts) only draw it.
 */

/** A pose the study stage can hold a bird in. */
export type StudyPose = 'rest' | 'alert' | 'flight' | 'dry' | 'ashore'

export interface PoseOption { id: StudyPose; label: string }

/**
 * The poses a species can be shown in: at rest always; alert where its neck is a chain that stretches (herons, the
 * goose, the pelican, the cormorant); in flight where it has a flight wing; drying its wings where it has a drying
 * pose; and ashore where it both swims and stands.
 */
export function posesFor(spec: SpeciesSpec): PoseOption[] {
  const out: PoseOption[] = [{ id: 'rest', label: 'At rest' }]
  const neck = spec.detail?.rig?.neck ?? spec.authored?.neck
  if (neck) out.push({ id: 'alert', label: 'Alert' })
  if (spec.detail?.flight || spec.authored?.flight) out.push({ id: 'flight', label: 'In flight' })
  if (spec.detail?.flight?.dry || spec.authored?.flight?.dry) out.push({ id: 'dry', label: 'Drying its wings' })
  if (spec.detail?.amphibious || spec.authored?.amphibious) out.push({ id: 'ashore', label: 'Ashore' })
  return out
}

/** How a plumage version's key reads: `maleMoult` as "Male, moulting". */
const VERSION_LABELS: Record<string, string> = {
  adult: 'Adult', juvenile: 'Juvenile', male: 'Male', female: 'Female', eclipse: 'Eclipse male', basic: 'Non-breeding',
  maleMoult: 'Male, moulting',
}

export interface VersionOption { id: string; label: string }

/** A species' plumage versions, in its spec's order; none for a species with one plumage. */
export function versionsFor(spec: SpeciesSpec): VersionOption[] {
  return Object.keys(spec.variants).map(id => ({ id, label: VERSION_LABELS[id] ?? id.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()) }))
}

/**
 * The species the study lists: every one with a model in the game, its catalog entry beside it, in the field guide's
 * order (by family, then name).
 */
export function studySpecies(specs: Record<string, SpeciesSpec>, birdOf: (code: string) => Bird): Bird[] {
  return Object.keys(specs)
    .map(code => birdOf(code))
    .sort((a, b) => a.familyCommon.localeCompare(b.familyCommon) || a.commonName.localeCompare(b.commonName))
}

/** How the lake's zones read in a sentence; a zone missing here reads as its id, its dashes as spaces. */
const ZONE_NAMES: Record<string, string> = {
  'open-water': 'the open water', 'far-water': 'the far water', 'near-water': 'the water near the bank',
  reeds: 'the reeds', mudflat: 'the mudflat', shallows: 'the shallows by the mudflat', bench: 'the mud bench below the mudflat',
  'far-shallows': 'the far shallows', 'goose-flat': 'the grassy flat on the right', 'goose-water': 'the water off the grassy flat',
  snag: 'the dead tree', stumps: 'the stumps', 'cormorant-water': 'the water by the stumps',
  perches: 'dead branches over the water', 'reed-perch': 'the reeds', 'reed-perch-2': 'the reeds', sky: 'the lake',
}
const zoneName = (id: string) => ZONE_NAMES[id] ?? `the ${id.replace(/-/g, ' ')}`

function habit(e: CastEntry): string {
  const n = e.count
  const zone = zoneName(e.zone)
  switch (e.behavior) {
    case 'swim': return `${n === 1 ? 'One swims' : `${n} swim`} on ${zone}${e.ashore ? `, and walk out to graze on ${zoneName(e.ashore)}` : ''}`
    case 'wade': return `${n === 1 ? 'One wades' : `${n} wade`} in ${zone}`
    case 'probe': return `${n === 1 ? 'One feeds' : `${n} feed`} on ${zone}`
    case 'perch': return `${n === 1 ? 'One perches' : `${n} perch`} ${e.zone.startsWith('reed') ? 'in' : 'on'} ${zone}`
    case 'kingfisher': return `${n === 1 ? 'One hunts' : `${n} hunt`} from ${zone}, hovering and plunging`
    case 'flyover': return `Flocks of up to ${n} fly over ${zone}${e.formation === 'vee' ? ' in a V' : e.formation === 'line' ? ' in a line' : ''} every few minutes`
  }
}

/** Where a species is on the lake, a sentence for each of its cast entries; none if it isn't in the cast. */
export function habitsAt(loc: Location, code: string): string[] {
  return loc.cast.filter(e => e.species === code).map(habit)
}
