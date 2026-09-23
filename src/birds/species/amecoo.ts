import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'y00475',
  commonName: 'American Coot',
  length: 0.39,
  body: { length: 1, height: 0.62, width: 0.55 },
  neck: { length: 0.28, thickness: 0.16, angle: 55 },
  head: { size: 0.3 },
  bill: { length: 0.16, thickness: 0.09, shape: 'pointed' },
  legs: { length: 0.3, thickness: 0.05 },
  tail: { length: 0.12, angle: 10 },
  wing: { length: 0.55, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#141414', cheek: '#1c1c1c', throat: '#222222', breast: '#2a2a2c', flank: '#2e2e30',
    back: '#1e1e20', wing: '#232325', speculum: null, rump: '#1e1e20', tail: '#1a1a1a',
    bill: '#f4f1e6', legs: '#9aa86a', eye: '#c8202a',
  },
  variants: {},
  marks: {
    size: 'chicken-sized, compact and round',
    bill: 'short white bill with a dark band near the tip and a white frontal shield',
    head: 'small dark head that pumps back and forth while swimming',
    body: 'slate black all over',
    legs: 'yellow-green legs with lobed toes',
  },
  wingbeatHz: 5,
}
