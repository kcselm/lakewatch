import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'gadwal',
  commonName: 'Gadwall',
  length: 0.51,
  body: { length: 1, height: 0.55, width: 0.5 },
  neck: { length: 0.3, thickness: 0.16, angle: 50 },
  head: { size: 0.3 },
  bill: { length: 0.17, thickness: 0.09, shape: 'flat' },
  legs: { length: 0.25, thickness: 0.045 },
  tail: { length: 0.15, angle: 10 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#4a3f35', cheek: '#6b5f52', throat: '#7a6d5e', breast: '#6e6258', flank: '#7d746a',
    back: '#5e564d', wing: '#6a625a', speculum: '#f2f2ee', rump: '#1a1a1a', tail: '#2a2825',
    bill: '#2b2b2b', legs: '#e0a13a', eye: '#1a1a1a',
  },
  variants: {
    male: {},
    female: {
      crown: '#5a4a36', cheek: '#a08a6a', throat: '#b8a888', breast: '#a4906f', flank: '#9c8767',
      back: '#6e5a42', wing: '#7a6650', rump: '#7a6650', tail: '#6b5a45', bill: '#c9862d',
    },
  },
  marks: {
    size: 'a medium dabbling duck, a little smaller than a Mallard',
    bill: 'a dark grey bill (male) or an orange-edged bill (female), shorter than a Mallard\'s',
    head: 'a plain grey-brown head with a steep forehead',
    body: 'a subtle grey body with a crisp black rear end and a white patch in the wing',
    legs: 'orange-yellow legs',
  },
  wingbeatHz: 5,
}
