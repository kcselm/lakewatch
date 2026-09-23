import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'belkin1',
  commonName: 'Belted Kingfisher',
  length: 0.32,
  body: { length: 1, height: 0.6, width: 0.5 },
  neck: { length: 0.12, thickness: 0.2, angle: 40 },
  head: { size: 0.42 },
  bill: { length: 0.24, thickness: 0.1, shape: 'dagger' },
  legs: { length: 0.08, thickness: 0.03 },
  tail: { length: 0.2, angle: 5 },
  wing: { length: 0.5, width: 0.25 },
  posture: 'perched',
  draft: 0,
  plumage: {
    crown: '#3f6f8a', cheek: '#3f6f8a', throat: '#f4f2ec', breast: '#f2f0ea', flank: '#f0eee8',
    back: '#3f6f8a', wing: '#3a667f', speculum: null, rump: '#3f6f8a', tail: '#355d73',
    bill: '#1f1f1f', legs: '#3a3a3a', eye: '#111111',
  },
  variants: {
    male: {},
    female: { flank: '#b8683a', breast: '#e8e0d4' },
  },
  marks: {
    size: 'a stocky pigeon-sized bird with an oversized head',
    bill: 'a long, heavy, dagger-shaped bill',
    head: 'a shaggy blue-grey crest on a big head',
    body: 'blue-grey above with a white collar and a blue breast band (females add a rusty band)',
    legs: 'tiny dark legs, perched over water',
  },
  wingbeatHz: 6,
}
