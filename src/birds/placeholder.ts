import { buildBird } from './procedural'
import type { BirdModel } from './model'
import type { SpeciesSpec } from './spec'

const GREY: SpeciesSpec['plumage'] = {
  crown: '#8a8a8a', cheek: '#8f8f8f', throat: '#9a9a9a', breast: '#a0a0a0', flank: '#969696',
  back: '#7c7c7c', wing: '#808080', speculum: null, rump: '#7c7c7c', tail: '#707070',
  bill: '#555555', legs: '#666666', eye: '#222222',
}

/** A neutral duck-shaped stand-in for cast species that have no spec yet. */
export function buildPlaceholder(code: string, posture: SpeciesSpec['posture'] = 'swimming'): BirdModel {
  return buildBird({
    code, commonName: code, length: 0.5,
    body: { length: 1, height: 0.5, width: 0.5 }, neck: { length: 0.3, thickness: 0.17, angle: 50 },
    head: { size: 0.3 }, bill: { length: 0.18, thickness: 0.1, shape: 'pointed' },
    legs: { length: posture === 'swimming' ? 0.2 : 0.5, thickness: 0.04 }, tail: { length: 0.15, angle: 10 },
    wing: { length: 0.55, width: 0.3 }, posture, draft: 0.4, plumage: GREY, variants: {},
    marks: { size: '', bill: '', head: '', body: '', legs: '' }, wingbeatHz: 5,
  })
}
