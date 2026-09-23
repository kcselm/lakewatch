import { describe, it, expect, vi } from 'vitest'
import { createEBirdClient, matchAnchors } from './ebird'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })

describe('createEBirdClient', () => {
  it('sends the API token header', async () => {
    const http = vi.fn().mockResolvedValue(json([]))
    await createEBirdClient(http, 'KEY123').taxonomy(['sonspa'])
    expect(http.mock.calls[0]![1]).toMatchObject({
      headers: { 'x-ebirdapitoken': 'KEY123' },
    })
  })

  it('parses hotspots near a point, including species counts', async () => {
    const http = vi.fn().mockResolvedValue(json([
      { locId: 'L1', locName: 'Ridgefield NWR', lat: 45.8, lng: -122.7, numSpeciesAllTime: 250 },
    ]))
    const out = await createEBirdClient(http, 'K').hotspotsNear(45.5, -122.6, 40)
    expect(out).toEqual([
      { locId: 'L1', locName: 'Ridgefield NWR', lat: 45.8, lng: -122.7, numSpeciesAllTime: 250 },
    ])
    expect(http.mock.calls[0]![0]).toContain('fmt=json')
  })

  it('extracts unique species codes from historic observations', async () => {
    const http = vi.fn().mockResolvedValue(json([
      { speciesCode: 'sonspa', comName: 'Song Sparrow' },
      { speciesCode: 'amerob', comName: 'American Robin' },
      { speciesCode: 'sonspa', comName: 'Song Sparrow' },
    ]))
    expect(await createEBirdClient(http, 'K').historicObs('L1', 2025, 6, 15))
      .toEqual(['sonspa', 'amerob'])
  })

  it('requests only true species for a historic date', async () => {
    const http = vi.fn().mockResolvedValue(json([]))
    await createEBirdClient(http, 'K').historicObs('L1', 2025, 6, 1)
    const url = http.mock.calls[0]![0] as string
    expect(url).toContain('/historic/2025/6/1')
    expect(url).toContain('cat=species')
  })

  it('requests taxonomy for the given species codes', async () => {
    const http = vi.fn().mockResolvedValue(json([
      { speciesCode: 'sonspa', comName: 'Song Sparrow', sciName: 'Melospiza melodia',
        category: 'species', familyComName: 'New World Sparrows', familySciName: 'Passerellidae' },
    ]))
    const out = await createEBirdClient(http, 'K').taxonomy(['sonspa'])
    expect(out[0]!.familySciName).toBe('Passerellidae')
    expect(out[0]!.category).toBe('species')
    expect(http.mock.calls[0]![0]).toContain('species=sonspa')
  })

  it('throws on a non-OK response', async () => {
    const http = vi.fn().mockResolvedValue(new Response('nope', { status: 403 }))
    await expect(createEBirdClient(http, 'K').taxonomy(['sonspa'])).rejects.toThrow(/403/)
  })
})

describe('matchAnchors', () => {
  const hs = (locId: string, locName: string, numSpeciesAllTime: number) =>
    ({ locId, locName, lat: 0, lng: 0, numSpeciesAllTime })
  const hotspots = [
    hs('L1', 'Ridgefield NWR--Carty Unit', 180),
    hs('L2', 'Forest Park--Lower Macleay Trail', 120),
    hs('L3', 'Random Pond', 40),
    hs('L4', 'Sauvie Island--Coon Point', 150),
    hs('L5', 'Sauvie Island--Rentenaar Rd', 230),
    hs('L6', 'Sauvie Island--Oak Island', 190),
  ]

  it('matches anchors case-insensitively by substring', () => {
    expect(matchAnchors(hotspots, ['ridgefield nwr']).map(h => h.locId)).toEqual(['L1'])
  })

  it('picks the richest hotspot when several match', () => {
    expect(matchAnchors(hotspots, ['Sauvie Island']).map(h => h.locId)).toEqual(['L5'])
  })

  it('returns one hotspot per anchor, in anchor order', () => {
    expect(matchAnchors(hotspots, ['Forest Park', 'Ridgefield']).map(h => h.locId))
      .toEqual(['L2', 'L1'])
  })

  it('skips anchors with no match', () => {
    expect(matchAnchors(hotspots, ['Nonexistent Marsh'])).toEqual([])
  })
})
