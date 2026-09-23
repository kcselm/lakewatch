import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'cangoo',
  commonName: 'Canada Goose',
  length: 0.95,
  body: { length: 1, height: 0.55, width: 0.55 },
  neck: { length: 0.55, thickness: 0.16, angle: 65 },
  head: { size: 0.28 },
  bill: { length: 0.16, thickness: 0.1, shape: 'flat' },
  legs: { length: 0.3, thickness: 0.05 },
  tail: { length: 0.16, angle: 6 },
  wing: { length: 0.85, width: 0.4 },
  posture: 'swimming',
  draft: 0.4,
  plumage: {
    crown: '#141414', cheek: '#f2f0ea', throat: '#f2f0ea', breast: '#c9c0ad', flank: '#8b7f6a',
    back: '#6b6152', wing: '#6a5f50', speculum: null, rump: '#f1efe9', tail: '#1a1a1a',
    bill: '#111111', legs: '#1a1a1a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a very large, long-necked waterfowl',
    bill: 'a short black bill',
    head: 'a black head and neck with a white chinstrap',
    body: 'a brown body with a pale breast and a white rump, flying in a V',
    legs: 'black legs',
  },
  wingbeatHz: 2.6,
}
