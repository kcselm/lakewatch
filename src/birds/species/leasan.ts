import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'leasan',
  commonName: 'Least Sandpiper',
  length: 0.15,
  body: { length: 1, height: 0.55, width: 0.45 },
  neck: { length: 0.12, thickness: 0.16, angle: 45 },
  head: { size: 0.3 },
  bill: { length: 0.16, thickness: 0.05, shape: 'pointed' },
  legs: { length: 0.28, thickness: 0.02 },
  tail: { length: 0.15, angle: 0 },
  wing: { length: 0.4, width: 0.2 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6e5a3a', cheek: '#a89070', throat: '#f0ece0', breast: '#c9b89a', flank: '#f0ece2',
    back: '#6a5636', wing: '#7a6440', speculum: null, rump: '#6a5636', tail: '#5a4830',
    bill: '#1f1f1f', legs: '#b8b03a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'the smallest sandpiper, sparrow-sized',
    bill: 'a short thin bill with a slight droop',
    head: 'a brown head with a faint pale eyebrow',
    body: 'brown above with a streaked breast, crouched low',
    legs: 'yellow-green legs (the other small sandpipers have black legs)',
  },
  wingbeatHz: 9,
}
