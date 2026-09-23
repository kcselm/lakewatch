import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'grbher3',
  commonName: 'Great Blue Heron',
  length: 1.2,
  body: { length: 1, height: 0.5, width: 0.42 },
  neck: { length: 0.95, thickness: 0.13, angle: 70 },
  head: { size: 0.22 },
  bill: { length: 0.32, thickness: 0.08, shape: 'dagger' },
  legs: { length: 0.85, thickness: 0.035 },
  tail: { length: 0.12, angle: 0 },
  wing: { length: 0.95, width: 0.42 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#f0efe8', cheek: '#d8d6cc', throat: '#e6e4da', breast: '#8a8e96', flank: '#6f7684',
    back: '#5f6b7c', wing: '#566273', speculum: null, rump: '#5f6b7c', tail: '#4c5563',
    bill: '#d9b23a', legs: '#6b6650', eye: '#e2c229',
  },
  variants: {},
  marks: {
    size: 'very large and tall, standing over a metre',
    bill: 'long heavy yellow dagger bill',
    head: 'white face and crown with a black stripe over the eye',
    body: 'blue-grey body and wings, held still for long stretches',
    legs: 'very long dull legs, wading',
  },
  wingbeatHz: 2.2,
}
