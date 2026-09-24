import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'greyel',
  commonName: 'Greater Yellowlegs',
  length: 0.33,
  body: { length: 1, height: 0.5, width: 0.42 },
  neck: { length: 0.32, thickness: 0.12, angle: 65 },
  head: { size: 0.26 },
  bill: { length: 0.36, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.75, thickness: 0.025 },
  tail: { length: 0.12, angle: 0 },
  wing: { length: 0.6, width: 0.28 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6a6252', cheek: '#a8a292', throat: '#f2f0ea', breast: '#d8d2c4', flank: '#eeeae0',
    back: '#6a6454', wing: '#736c5c', speculum: null, rump: '#f2f0ea', tail: '#c8c2b2',
    bill: '#2a2a2a', legs: '#e8c22a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a tall slim shorebird, larger than a killdeer',
    bill: 'a long, slightly upturned dark bill, longer than the head',
    head: 'a grey streaked head with a white eye ring',
    body: 'grey-brown speckled above, white below, with a white rump in flight',
    legs: 'long bright yellow legs',
  },
  wingbeatHz: 5,
}
