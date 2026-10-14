import { SPECIES } from '../birds/species'
import { findBird } from '../catalog'
import { loadLocation } from '../location'
import { posesFor, versionsFor, studySpecies, habitsAt } from './study'

const poses = (code: string) => posesFor(SPECIES[code]!).map(p => p.id)

describe('study', () => {
  it('lists every species with a model, each with its catalog entry, by family then name', () => {
    const list = studySpecies(SPECIES, findBird)
    expect(list.map(b => b.speciesCode).sort()).toEqual(Object.keys(SPECIES).sort())
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1]!, b = list[i]!
      expect(a.familyCommon.localeCompare(b.familyCommon) || a.commonName.localeCompare(b.commonName)).toBeLessThan(0)
    }
  })

  it('shows every bird at rest, and only the poses its model has', () => {
    for (const spec of Object.values(SPECIES)) expect(posesFor(spec)[0]!.id).toBe('rest')
    // a sandpiper has no chained neck, flight wing, or drying pose, and doesn't swim
    expect(poses('leasan')).toEqual(['rest'])
    expect(poses('grbher3')).toEqual(['rest', 'alert'])
    expect(poses('belkin1')).toEqual(['rest', 'flight'])
    expect(poses('amwpel')).toEqual(['rest', 'alert', 'flight'])
    expect(poses('cangoo')).toEqual(['rest', 'alert', 'ashore'])
    // the authored cormorant: its neck, flight wing, and drying pose are in its authored block
    expect(poses('doccor')).toEqual(['rest', 'alert', 'flight', 'dry', 'ashore'])
    // the red-wing's song spread
    expect(poses('rewbla')).toEqual(['rest', 'spread'])
  })

  it("names a species' plumage versions in its spec's order, and none for a bird with one plumage", () => {
    expect(versionsFor(SPECIES['mallar3']!)).toEqual([
      { id: 'male', label: 'Male' }, { id: 'maleMoult', label: 'Male, moulting' }, { id: 'female', label: 'Female' },
    ])
    expect(versionsFor(SPECIES['pibgre']!).map(v => v.label)).toEqual(['Non-breeding', 'Juvenile'])
    expect(versionsFor(SPECIES['greegr']!)).toEqual([])
  })

  it('says where a species is on the lake, once for each of its cast entries', () => {
    const loc = loadLocation()
    expect(habitsAt(loc, 'killde')).toEqual(['3 feed on the mudflat'])
    expect(habitsAt(loc, 'belkin1')).toEqual(['One hunts from dead branches over the water, hovering and plunging'])
    expect(habitsAt(loc, 'rewbla')).toEqual(['5 cling to the cattails and tules in the reeds, a male singing from his stalk'])
    expect(habitsAt(loc, 'marwre')).toEqual(['One perches in the reeds'])
    expect(habitsAt(loc, 'cangoo')).toEqual([
      'Flocks of up to 14 fly over the lake in a V every few minutes',
      '8 swim on the water off the grassy flat, and walk out to graze on the grassy flat on the right',
    ])
    expect(habitsAt(loc, 'doccor')).toEqual(['3 perch on the stumps', 'One swims on the water by the stumps'])
  })

  it('has a sentence for every species in the cast', () => {
    const loc = loadLocation()
    for (const code of new Set(loc.cast.map(e => e.species))) expect(habitsAt(loc, code).length).toBeGreaterThan(0)
  })
})
