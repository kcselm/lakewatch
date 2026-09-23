import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'norsho',
  commonName: 'Northern Shoveler',
  length: 0.48,
  body: { length: 1, height: 0.52, width: 0.5 },
  neck: { length: 0.25, thickness: 0.16, angle: 45 },
  head: { size: 0.3 },
  bill: { length: 0.26, thickness: 0.12, shape: 'flat' },
  legs: { length: 0.24, thickness: 0.045 },
  tail: { length: 0.14, angle: 8 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#1f4a35', cheek: '#27563d', throat: '#2b5a41', breast: '#f0eee6', flank: '#a85a2a',
    back: '#2a2a2a', wing: '#3f4a55', speculum: '#2f7a45', rump: '#1a1a1a', tail: '#3a3a3a',
    bill: '#1e1e1e', legs: '#f08a2a', eye: '#e8c22a',
  },
  variants: {
    male: {},
    female: {
      crown: '#6a5a42', cheek: '#a8957a', throat: '#b8a68a', breast: '#b09472', flank: '#a88c6a',
      back: '#6e5a44', wing: '#7a6a56', rump: '#6e5a44', tail: '#6e5a44', bill: '#c48a3a', eye: '#2a2a2a',
    },
  },
  marks: {
    size: 'a medium duck that sits low and front-heavy',
    bill: 'a huge spoon-shaped bill, longer than the head',
    head: 'a dark green head (male) or a plain brown head (female) on a short neck',
    body: 'a white breast and rusty flanks (male) or mottled brown all over (female)',
    legs: 'bright orange legs',
  },
  wingbeatHz: 5.5,
}
