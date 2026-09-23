import { describe, it, expect } from 'vitest'
import { mergeBirds } from './merge'

const species = [{
  speciesCode: 'sonspa', commonName: 'Song Sparrow', scientificName: 'Melospiza melodia',
  family: 'Passerellidae', familyCommon: 'New World Sparrows',
  habitats: ['urban'], frequency: 0.9, monthly: Array(12).fill(0.9),
}]

const clip = {
  file: 'media/audio/sonspa-XC1.mp3', type: 'song' as const, xcId: 'XC1',
  recordist: 'r', license: 'CC BY 4.0', sourceUrl: 'https://xeno-canto.org/1',
}

describe('mergeBirds', () => {
  it('attaches media to the matching species', () => {
    const out = mergeBirds(species, { sonspa: { audio: [clip], photo: null } })
    expect(out[0]).toMatchObject({ speciesCode: 'sonspa', audio: [clip], photo: null })
  })

  it('defaults to empty audio and null photo when media is missing', () => {
    const out = mergeBirds(species, {})
    expect(out[0]).toMatchObject({ audio: [], photo: null })
  })

  it('drops species with neither audio nor photo', () => {
    expect(mergeBirds(species, {}, { dropEmpty: true })).toEqual([])
  })

  it('keeps a species that has only a photo', () => {
    const photo = {
      file: 'media/photos/sonspa.jpg', attribution: 'a',
      license: 'cc-by-nc', sourceUrl: 'https://inaturalist.org/photos/1',
    }
    const out = mergeBirds(species, { sonspa: { audio: [], photo } }, { dropEmpty: true })
    expect(out).toHaveLength(1)
  })
})
