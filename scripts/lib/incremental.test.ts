import { describe, it, expect } from 'vitest'
import { keepClips, keepPhoto, clipFile } from './incremental'
import type { AudioClip, Photo } from '../../src/catalog/types'

const clip = (xcId: string): AudioClip => ({
  file: `media/audio/sonspa-${xcId}.mp3`, type: 'song', xcId,
  recordist: 'r', license: 'CC BY 4.0', sourceUrl: 'https://xeno-canto.org/1',
})
const photo: Photo = {
  file: 'media/photos/sonspa.jpg', attribution: 'a', license: 'cc-by-nc',
  sourceUrl: 'https://www.inaturalist.org/photos/1',
}
const onDisk = (...files: string[]) => (f: string) => files.includes(f)

describe('keepClips', () => {
  const prior = { audio: [clip('XC1'), clip('XC2'), clip('XC3')], photo: null }

  it('keeps clips that are not rejected and still on disk', () => {
    const files = prior.audio.map(c => c.file)
    expect(keepClips(prior, new Set(), onDisk(...files)).map(c => c.xcId))
      .toEqual(['XC1', 'XC2', 'XC3'])
  })

  it('drops rejected clips', () => {
    const files = prior.audio.map(c => c.file)
    expect(keepClips(prior, new Set(['XC2']), onDisk(...files)).map(c => c.xcId))
      .toEqual(['XC1', 'XC3'])
  })

  it('drops clips whose file is missing', () => {
    expect(keepClips(prior, new Set(), onDisk('media/audio/sonspa-XC3.mp3')).map(c => c.xcId))
      .toEqual(['XC3'])
  })

  it('returns nothing for a species with no prior run', () => {
    expect(keepClips(undefined, new Set(), () => true)).toEqual([])
  })
})

describe('keepPhoto', () => {
  it('keeps a photo that exists on disk', () => {
    expect(keepPhoto({ audio: [], photo }, onDisk(photo.file))).toEqual(photo)
  })

  it('drops a photo whose file is missing', () => {
    expect(keepPhoto({ audio: [], photo }, () => false)).toBeNull()
  })

  it('returns null with no prior run', () => {
    expect(keepPhoto(undefined, () => true)).toBeNull()
  })
})

describe('clipFile', () => {
  it('names clips by species and recording id', () => {
    expect(clipFile('sonspa', 'XC123456')).toBe('media/audio/sonspa-XC123456.mp3')
  })
})
