import { pickClip } from './clips'
import { findBird } from '../catalog'
import { makeRng } from '../catalog/rng'

describe('pickClip', () => {
  it('prefers the requested type when the species has one', () => {
    const coot = findBird('y00475')
    for (let seed = 0; seed < 10; seed++) expect(pickClip(coot, 'call', makeRng(seed))?.type).toBe('call')
  })
  it('falls back to any clip when the preferred type is missing', () => {
    // Canada Goose has calls only
    const goose = findBird('cangoo')
    expect(goose.audio.every(c => c.type === 'call')).toBe(true)
    expect(pickClip(goose, 'song', makeRng(1))).not.toBeNull()
  })
  it('returns null for a species with no audio', () => {
    expect(pickClip({ audio: [] }, 'any', makeRng(1))).toBeNull()
  })
  it('is deterministic per seed', () => {
    const b = findBird('mallar3')
    expect(pickClip(b, 'any', makeRng(3))).toEqual(pickClip(b, 'any', makeRng(3)))
  })
})
