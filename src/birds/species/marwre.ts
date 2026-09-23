import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'marwre',
  commonName: 'Marsh Wren',
  length: 0.125,
  body: { length: 1, height: 0.6, width: 0.5 },
  neck: { length: 0.06, thickness: 0.2, angle: 40 },
  head: { size: 0.36 },
  bill: { length: 0.14, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.28, thickness: 0.02 },
  tail: { length: 0.35, angle: 45 },
  wing: { length: 0.35, width: 0.2 },
  posture: 'perched',
  draft: 0,
  plumage: {
    crown: '#4a3a2a', cheek: '#a88a68', throat: '#f0e8d8', breast: '#e8dcc4', flank: '#c9a878',
    back: '#5a4030', wing: '#7a5a40', speculum: null, rump: '#a06a40', tail: '#6a4a34',
    bill: '#4a3a2a', legs: '#8a7a68', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'tiny, smaller than a sparrow',
    bill: 'a thin, slightly curved bill',
    head: 'a dark cap with a bold white eyebrow',
    body: 'rusty brown with a striped back and a cocked tail',
    legs: 'thin pale legs clinging to reed stems',
  },
  wingbeatHz: 12,
}
