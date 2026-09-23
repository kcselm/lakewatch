import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'greegr',
  commonName: 'Great Egret',
  length: 1.0,
  body: { length: 1, height: 0.48, width: 0.4 },
  neck: { length: 0.95, thickness: 0.12, angle: 72 },
  head: { size: 0.2 },
  bill: { length: 0.3, thickness: 0.07, shape: 'dagger' },
  legs: { length: 0.85, thickness: 0.03 },
  tail: { length: 0.1, angle: 0 },
  wing: { length: 0.9, width: 0.4 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#fbfaf5', cheek: '#fbfaf5', throat: '#f8f7f1', breast: '#f6f4ec', flank: '#f4f2e9',
    back: '#f7f5ee', wing: '#f4f2ea', speculum: null, rump: '#f4f2ea', tail: '#f2f0e7',
    bill: '#e9b93a', legs: '#2a2a2a', eye: '#e8d24a',
  },
  variants: {},
  marks: {
    size: 'very large and tall, nearly heron-sized',
    bill: 'a long yellow dagger bill',
    head: 'a white head with a yellow bill and a dark line through the eye',
    body: 'pure white all over, held tall and slim',
    legs: 'long black legs and black feet',
  },
  wingbeatHz: 2.4,
}
