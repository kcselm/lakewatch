import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'pibgre',
  commonName: 'Pied-billed Grebe',
  length: 0.33,
  body: { length: 1, height: 0.62, width: 0.5 },
  neck: { length: 0.32, thickness: 0.15, angle: 60 },
  head: { size: 0.3 },
  bill: { length: 0.1, thickness: 0.11, shape: 'pointed' },
  legs: { length: 0.15, thickness: 0.04 },
  tail: { length: 0.03, angle: 20 },
  wing: { length: 0.45, width: 0.25 },
  posture: 'swimming',
  draft: 0.5,
  plumage: {
    crown: '#4a3f33', cheek: '#7a6a56', throat: '#8c7c68', breast: '#a89684', flank: '#8b7a66',
    back: '#5a4d3f', wing: '#5f5245', speculum: null, rump: '#c8c0b0', tail: '#c8c0b0',
    bill: '#d8d0b8', legs: '#5a5a4a', eye: '#2a2a2a',
  },
  variants: {},
  marks: {
    size: 'small and stocky, smaller than a coot',
    bill: 'a short thick pale bill, chicken-like',
    head: 'a rounded brown head that dives without warning',
    body: 'a brown body with a fluffy pale rear and no visible tail',
    legs: 'legs set far back, never seen out of the water',
  },
  wingbeatHz: 7,
  foraging: 'grebe',
}
