import { describe, it, expect, vi } from 'vitest'
import { createINatClient, largeUrl } from './inaturalist'

const photo = (id: number, license_code: string | null) => ({
  id, license_code,
  attribution: `(c) someone ${id}, some rights reserved (CC BY-NC)`,
  url: `https://inaturalist-open-data.s3.amazonaws.com/photos/${id}/square.jpg`,
})
const taxon = (over: Record<string, unknown> = {}) =>
  ({ id: 9, name: 'Melospiza melodia', default_photo: photo(55, 'cc-by-nc'), ...over })
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

describe('largeUrl', () => {
  it('swaps square for large', () => {
    expect(largeUrl('https://x.test/photos/55/square.jpg'))
      .toBe('https://x.test/photos/55/large.jpg')
  })

  it('leaves an unrecognized URL alone', () => {
    expect(largeUrl('https://x.test/photo.jpg')).toBe('https://x.test/photo.jpg')
  })
})

describe('photoFor', () => {
  it('returns the licensed default photo without a second request', async () => {
    const http = vi.fn().mockResolvedValue(json({ results: [taxon()] }))
    const out = await createINatClient(http).photoFor('Melospiza melodia')
    expect(out).toEqual({
      url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/55/large.jpg',
      licenseCode: 'cc-by-nc',
      attribution: '(c) someone 55, some rights reserved (CC BY-NC)',
      sourceUrl: 'https://www.inaturalist.org/photos/55',
    })
    expect(http).toHaveBeenCalledTimes(1)
    expect(http.mock.calls[0]![0]).toContain('rank=species')
  })

  it('falls back to a licensed observation photo when the default is unlicensed', async () => {
    const http = vi.fn()
      .mockResolvedValueOnce(json({ results: [taxon({ default_photo: photo(55, null) })] }))
      .mockResolvedValueOnce(json({ results: [{ photos: [photo(77, 'cc-by')] }] }))
    const out = await createINatClient(http).photoFor('X x')
    expect(out?.licenseCode).toBe('cc-by')
    expect(out?.sourceUrl).toBe('https://www.inaturalist.org/photos/77')
    const url = http.mock.calls[1]![0] as string
    expect(url).toContain('/observations?')
    expect(url).toContain('taxon_id=9')
    expect(url).toContain('photo_license=')
    expect(url).toContain('quality_grade=research')
  })

  it('falls back when the taxon has no default photo at all', async () => {
    const http = vi.fn()
      .mockResolvedValueOnce(json({ results: [taxon({ default_photo: null })] }))
      .mockResolvedValueOnce(json({ results: [{ photos: [photo(78, 'cc-by-sa')] }] }))
    expect((await createINatClient(http).photoFor('X x'))?.licenseCode).toBe('cc-by-sa')
  })

  it('returns null when there is no matching taxon', async () => {
    const http = vi.fn().mockResolvedValue(json({ results: [] }))
    expect(await createINatClient(http).photoFor('X x')).toBeNull()
    expect(http).toHaveBeenCalledTimes(1)
  })

  it('returns null when the fallback finds nothing licensed either', async () => {
    const http = vi.fn()
      .mockResolvedValueOnce(json({ results: [taxon({ default_photo: null })] }))
      .mockResolvedValueOnce(json({ results: [] }))
    expect(await createINatClient(http).photoFor('X x')).toBeNull()
  })

  it('throws on a non-OK response', async () => {
    const http = vi.fn().mockResolvedValue(new Response('', { status: 500 }))
    await expect(createINatClient(http).photoFor('X x')).rejects.toThrow(/500/)
  })
})
