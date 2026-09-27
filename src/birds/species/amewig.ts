import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'amewig',
  commonName: 'American Wigeon',
  length: 0.5,
  body: { length: 1, height: 0.56, width: 0.5 },
  neck: { length: 0.28, thickness: 0.16, angle: 55 },
  head: { size: 0.3 },
  bill: { length: 0.14, thickness: 0.09, shape: 'flat' },
  legs: { length: 0.24, thickness: 0.045 },
  tail: { length: 0.16, angle: 12 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#f1ead6', cheek: '#7f8a80', throat: '#8a8d86', breast: '#b48a7a', flank: '#b58c78',
    back: '#8e7f6a', wing: '#8a8073', speculum: '#2f7a55', rump: '#1e1e1e', tail: '#1a1a1a',
    bill: '#a9c5d1', legs: '#6b6b6b', eye: '#1a1a1a',
  },
  variants: {
    male: {},
    female: {
      crown: '#8a7d6c', cheek: '#8d8578', throat: '#9a9286', breast: '#a98a76', flank: '#a98a76',
      back: '#7a6a58', wing: '#7f7466', speculum: null, rump: '#6f6252', tail: '#6f6252',
    },
  },
  marks: {
    size: 'a compact medium duck with a round head',
    bill: 'a small pale blue-grey bill with a black tip',
    head: 'a cream crown with a green patch behind the eye (male) or a plain grey head (female)',
    body: 'a pinkish-brown body with a white flank patch before the black rear',
    legs: 'dark grey legs',
  },
  wingbeatHz: 5.5,
  foraging: 'dabbler',
}
