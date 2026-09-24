import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'amwpel',
  commonName: 'American White Pelican',
  length: 1.5,
  body: { length: 1, height: 0.5, width: 0.5 },
  neck: { length: 0.6, thickness: 0.18, angle: 60 },
  head: { size: 0.32 },
  bill: { length: 0.7, thickness: 0.14, shape: 'flat' },
  legs: { length: 0.25, thickness: 0.06 },
  tail: { length: 0.15, angle: 5 },
  wing: { length: 1.4, width: 0.45 },
  posture: 'swimming',
  draft: 0.35,
  plumage: {
    crown: '#fbfaf4', cheek: '#f9f8f2', throat: '#f6f4ec', breast: '#f7f5ee', flank: '#f6f4ec',
    back: '#f7f5ee', wing: '#f4f2ea', speculum: '#1a1a1a', rump: '#f6f4ec', tail: '#f0eee6',
    bill: '#f2a03a', legs: '#f2a03a', eye: '#2a2a2a',
  },
  variants: {},
  marks: {
    size: 'huge, one of the largest birds in North America',
    bill: 'an enormous orange bill with a pouch',
    head: 'a white head on a long neck folded back in flight',
    body: 'all white with black wingtips, gliding in lines',
    legs: 'short orange legs',
  },
  wingbeatHz: 1.6,
}
