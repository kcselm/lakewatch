import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'rewbla',
  commonName: 'Red-winged Blackbird',
  length: 0.22,
  body: { length: 1, height: 0.55, width: 0.45 },
  neck: { length: 0.1, thickness: 0.18, angle: 45 },
  head: { size: 0.32 },
  bill: { length: 0.14, thickness: 0.08, shape: 'pointed' },
  legs: { length: 0.28, thickness: 0.025 },
  tail: { length: 0.35, angle: 5 },
  wing: { length: 0.42, width: 0.22 },
  posture: 'perched',
  draft: 0,
  plumage: {
    crown: '#111111', cheek: '#141414', throat: '#151515', breast: '#171717', flank: '#181818',
    back: '#141414', wing: '#161616', speculum: '#d8261f', rump: '#141414', tail: '#111111',
    bill: '#1a1a1a', legs: '#222222', eye: '#111111',
  },
  variants: {
    male: {},
    female: {
      crown: '#5a4a38', cheek: '#a08a6a', throat: '#d8c8a8', breast: '#b8a888', flank: '#9a8666',
      back: '#5e4c3a', wing: '#665442', speculum: null, rump: '#5e4c3a', tail: '#4e4032', bill: '#3a3028',
    },
  },
  marks: {
    size: 'a robin-sized songbird',
    bill: 'a sharp pointed black bill',
    head: 'a plain black head (male) or a streaked brown head with a pale eyebrow (female)',
    body: 'glossy black with a red-and-yellow shoulder patch (male) or heavily streaked brown (female)',
    legs: 'thin dark legs gripping a reed',
  },
  wingbeatHz: 7,
}
