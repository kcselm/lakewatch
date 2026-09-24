import { creditsFor } from './credits'
import { loadAmbience } from '../audio/ambienceManifest'
import type { Bird } from '../catalog/types'

const bird = (code: string, photo: Bird['photo'], audio: Bird['audio']): Bird => ({
  speciesCode: code, commonName: code.toUpperCase(), scientificName: 's', family: 'f', familyCommon: 'F', habitats: ['wetland'], frequency: 1, monthly: Array(12).fill(1), audio, photo,
})
const clip = (xcId: string) => ({ file: `media/audio/${xcId}.mp3`, type: 'call' as const, xcId, recordist: 'R', license: 'CC BY-NC-SA 4.0', sourceUrl: `https://xeno-canto.org/${xcId}` })

describe('creditsFor', () => {
  it('lists every clip and photo per species, null for a missing photo', () => {
    const c = creditsFor([
      bird('aaa', { file: 'media/photos/aaa.jpg', attribution: '(c) P', license: 'cc-by-nc', sourceUrl: 'https://inat.org/1' }, [clip('XC1'), clip('XC2')]),
      bird('bbb', null, [clip('XC3')]),
    ], [])
    expect(c.species).toEqual([
      { code: 'aaa', name: 'AAA', photo: { attribution: '(c) P', license: 'cc-by-nc', sourceUrl: 'https://inat.org/1' }, clips: [
        { xcId: 'XC1', type: 'call', recordist: 'R', license: 'CC BY-NC-SA 4.0', sourceUrl: 'https://xeno-canto.org/XC1' },
        { xcId: 'XC2', type: 'call', recordist: 'R', license: 'CC BY-NC-SA 4.0', sourceUrl: 'https://xeno-canto.org/XC2' },
      ] },
      { code: 'bbb', name: 'BBB', photo: null, clips: [{ xcId: 'XC3', type: 'call', recordist: 'R', license: 'CC BY-NC-SA 4.0', sourceUrl: 'https://xeno-canto.org/XC3' }] },
    ])
  })
  it('credits synth ambience without a source link and file ambience with one', () => {
    const c = creditsFor([], [
      ...loadAmbience(),
      { id: 'loons', source: { kind: 'file', file: 'media/ambience/loons.mp3', license: 'CC BY-NC 4.0', sourceUrl: 'https://example.org/loons' }, gain: 0.3, followsWind: false, attribution: 'Someone' },
    ])
    expect(c.ambience.map(a => a.sourceUrl)).toEqual([null, null, null, 'https://example.org/loons'])
    expect(c.ambience[0]!.attribution).toContain('Synthesized')
  })
})
