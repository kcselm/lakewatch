import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'killde',
  commonName: 'Killdeer',
  length: 0.25,
  body: { length: 1, height: 0.5, width: 0.45 },
  neck: { length: 0.18, thickness: 0.2, angle: 60 },
  head: { size: 0.34 },
  bill: { length: 0.14, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.38, thickness: 0.03 },
  tail: { length: 0.3, angle: 5 },
  wing: { length: 0.55, width: 0.25 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6b5638', cheek: '#f3efe6', throat: '#1c1c1c', breast: '#f6f3ea', flank: '#efe9dc',
    back: '#7a6444', wing: '#6f5a3c', speculum: null, rump: '#c9782e', tail: '#3a3025',
    bill: '#1a1a1a', legs: '#d9c39a', eye: '#1a1a1a',
  },
  variants: {},
  marks: {
    size: 'robin-sized plover on long legs',
    bill: 'short thin black bill',
    head: 'brown cap, white forehead and collar, with two black bands across the breast',
    body: 'brown back, white belly, rusty orange rump and a long tail',
    legs: 'pale long legs; runs in short bursts and stops',
  },
  wingbeatHz: 7,
  foraging: 'plover',
}
