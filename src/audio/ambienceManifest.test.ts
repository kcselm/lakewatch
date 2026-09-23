import { parseAmbience, loadAmbience } from './ambienceManifest'

const synth = { id: 'wind-reeds', source: { kind: 'synth', recipe: 'wind' }, gain: 0.5, followsWind: true, attribution: 'Synthesized in-game' }

describe('parseAmbience', () => {
  it('accepts synth and file layers, defaulting followsWind to false', () => {
    const file = { id: 'loons', source: { kind: 'file', file: 'media/ambience/loons.mp3', license: 'CC BY-NC 4.0', sourceUrl: 'https://example.org/loons' }, gain: 0.3, attribution: 'Someone, CC BY-NC 4.0' }
    const layers = parseAmbience({ layers: [synth, file] })
    expect(layers[1]!.followsWind).toBe(false)
    expect(layers[0]!.followsWind).toBe(true)
  })
  it('rejects an unknown recipe, a missing attribution, and a gain above 1', () => {
    expect(() => parseAmbience({ layers: [{ ...synth, source: { kind: 'synth', recipe: 'thunder' } }] })).toThrow()
    expect(() => parseAmbience({ layers: [{ ...synth, attribution: '' }] })).toThrow()
    expect(() => parseAmbience({ layers: [{ ...synth, gain: 1.5 }] })).toThrow()
  })
  it('rejects duplicate ids', () => {
    expect(() => parseAmbience({ layers: [synth, synth] })).toThrow(/duplicate layer id wind-reeds/)
  })
  it('the committed manifest parses', () => {
    expect(loadAmbience().map(l => l.id)).toEqual(['water-lapping', 'wind-reeds', 'distant-frogs'])
  })
})
