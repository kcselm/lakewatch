import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'mallar3',
  commonName: 'Mallard',
  length: 0.58,
  body: { length: 1, height: 0.5, width: 0.5 },
  neck: { length: 0.3, thickness: 0.17, angle: 50 },
  head: { size: 0.32 },
  bill: { length: 0.22, thickness: 0.12, shape: 'flat' },
  legs: { length: 0.22, thickness: 0.05 },
  tail: { length: 0.16, angle: 15 },
  wing: { length: 0.6, width: 0.32 },
  posture: 'swimming',
  draft: 0.4,
  plumage: {
    crown: '#1f6b3a', cheek: '#2a7d45', throat: '#f2f2f2', breast: '#5b2f1e', flank: '#b9b3a8',
    back: '#7a6a52', wing: '#8a7d68', speculum: '#2b4fd6', rump: '#2a2a2a', tail: '#3a3a3a',
    bill: '#e2c72e', legs: '#e8722a', eye: '#1a1a1a',
  },
  variants: {
    male: {},
    female: {
      crown: '#5a4a32', cheek: '#b59a6e', throat: '#c9b48c', breast: '#a68b62', flank: '#a68b62',
      back: '#6f5a3c', wing: '#7d684a', rump: '#8a7350', tail: '#c9bb9a', bill: '#d98a2e',
    },
  },
  marks: {
    size: 'large dabbling duck',
    bill: 'broad flat bill, yellow on the male, orange and black on the female',
    head: 'glossy green head with a white neck ring on the male; the female is mottled brown',
    body: 'chestnut breast and pale grey flanks on the male; a blue wing patch edged in white on both',
    legs: 'orange legs and feet',
  },
  wingbeatHz: 6,
  foraging: 'dabbler',
}
