import { describe, it, expect, vi } from 'vitest'
import {
  createXenoCantoClient, isDerivable, normalizeClipType, selectClips, licenseLabel,
} from './xenocanto'
import type { FoundRecording } from './xenocanto'

function rec(over: Partial<FoundRecording>): FoundRecording {
  return {
    id: '1', en: 'Song Sparrow', rec: 'A. Birder', cnt: 'United States',
    loc: 'Multnomah County, Oregon', type: 'song', q: 'A', also: [],
    file: 'https://xeno-canto.org/1/download',
    url: '//xeno-canto.org/1',
    lic: '//creativecommons.org/licenses/by-nc-sa/4.0/',
    regional: true,
    ...over,
  }
}

describe('normalizeClipType', () => {
  it('maps song-ish types to song', () => {
    expect(normalizeClipType(rec({ type: 'song' }))).toBe('song')
    expect(normalizeClipType(rec({ type: 'dawn song' }))).toBe('song')
  })

  it('maps everything else to call', () => {
    expect(normalizeClipType(rec({ type: 'call' }))).toBe('call')
    expect(normalizeClipType(rec({ type: 'alarm call' }))).toBe('call')
    expect(normalizeClipType(rec({ type: 'flight call' }))).toBe('call')
  })
})

describe('isDerivable', () => {
  it('rejects NoDerivatives licenses', () => {
    expect(isDerivable(rec({ lic: '//creativecommons.org/licenses/by-nc-nd/4.0/' }))).toBe(false)
    expect(isDerivable(rec({ lic: '//creativecommons.org/licenses/by-nd/4.0/' }))).toBe(false)
  })

  it('accepts BY, BY-SA, BY-NC, and BY-NC-SA', () => {
    for (const l of ['by', 'by-sa', 'by-nc', 'by-nc-sa']) {
      expect(isDerivable(rec({ lic: `//creativecommons.org/licenses/${l}/4.0/` }))).toBe(true)
    }
  })
})

describe('selectClips', () => {
  it('prefers regional recordings', () => {
    const out = selectClips([rec({ id: 'far', regional: false }), rec({ id: 'near', regional: true })], 1)
    expect(out[0]!.id).toBe('near')
  })

  it('prefers recordings with no background species', () => {
    const out = selectClips([
      rec({ id: 'noisy', also: ['Turdus migratorius'] }),
      rec({ id: 'clean', also: [] }),
    ], 1)
    expect(out[0]!.id).toBe('clean')
  })

  it('ranks regional above clean', () => {
    const out = selectClips([
      rec({ id: 'clean-far', regional: false, also: [] }),
      rec({ id: 'noisy-near', regional: true, also: ['x'] }),
    ], 1)
    expect(out[0]!.id).toBe('noisy-near')
  })

  it('prefers quality A over B, all else equal', () => {
    const out = selectClips([rec({ id: 'b', q: 'B' }), rec({ id: 'a', q: 'A' })], 1)
    expect(out[0]!.id).toBe('a')
  })

  it('excludes NoDerivatives recordings', () => {
    const out = selectClips([
      rec({ id: 'nd', lic: '//creativecommons.org/licenses/by-nc-nd/4.0/' }),
      rec({ id: 'ok' }),
    ], 3)
    expect(out.map(r => r.id)).toEqual(['ok'])
  })

  it('mixes song and call rather than returning three of one', () => {
    const out = selectClips([
      rec({ id: '1', type: 'song' }), rec({ id: '2', type: 'song' }),
      rec({ id: '3', type: 'song' }), rec({ id: '4', type: 'call' }),
    ], 3)
    expect(out.map(r => r.id)).toContain('4')
  })

  it('returns at most the requested count', () => {
    expect(selectClips([rec({ id: '1' }), rec({ id: '2' })], 3)).toHaveLength(2)
  })

  it('returns an empty array for no recordings', () => {
    expect(selectClips([], 3)).toEqual([])
  })

  it('never returns duplicates', () => {
    const out = selectClips([rec({ id: '1' }), rec({ id: '2' }), rec({ id: '3' })], 3)
    expect(new Set(out.map(r => r.id)).size).toBe(3)
  })
})

describe('licenseLabel', () => {
  it('renders a readable label from a CC URL', () => {
    expect(licenseLabel('//creativecommons.org/licenses/by-nc-sa/4.0/'))
      .toBe('CC BY-NC-SA 4.0')
  })

  it('falls back to the raw string when unrecognized', () => {
    expect(licenseLabel('some-other-license')).toBe('some-other-license')
  })
})

describe('createXenoCantoClient', () => {
  const page = (recordings: unknown[], numPages = 1) =>
    new Response(JSON.stringify({ recordings, numPages }), { status: 200 })
  const urlOf = (http: ReturnType<typeof vi.fn>, call: number) =>
    decodeURIComponent(http.mock.calls[call]![0] as string)

  it('sends the key, a quoted species tag, the quality floor, and the bird group', async () => {
    const http = vi.fn(() => Promise.resolve(page([])))
    await createXenoCantoClient(http, 'XCKEY').search('Melospiza melodia')
    const url = urlOf(http, 0)
    expect(url).toContain('key=XCKEY')
    expect(url).toContain('sp:"Melospiza melodia"')
    expect(url).toContain('q:">C"')
    expect(url).toContain('grp:birds')
  })

  it('queries regional scopes first, then the continent, and tags results', async () => {
    const http = vi.fn()
      .mockResolvedValueOnce(page([rec({ id: 'or' })]))  // loc:oregon
      .mockResolvedValueOnce(page([]))                    // loc:washington
      .mockResolvedValueOnce(page([]))                    // loc:"british columbia"
      .mockResolvedValueOnce(page([rec({ id: 'tx' })]))  // area:america
    const out = await createXenoCantoClient(http, 'K').search('X x')
    expect(urlOf(http, 0)).toContain('loc:oregon')
    expect(urlOf(http, 2)).toContain('loc:"british columbia"')
    expect(urlOf(http, 3)).toContain('area:america')
    expect(out.map(r => [r.id, r.regional])).toEqual([['or', true], ['tx', false]])
  })

  it('stops once enough candidates are found', async () => {
    const many = Array.from({ length: 12 }, (_, i) => rec({ id: `or${i}` }))
    const http = vi.fn().mockResolvedValue(page(many))
    await createXenoCantoClient(http, 'K').search('X x', 12)
    expect(http).toHaveBeenCalledTimes(1)
  })

  it('deduplicates across scopes', async () => {
    const http = vi.fn()
      .mockResolvedValueOnce(page([rec({ id: 'dup' })]))
      .mockResolvedValueOnce(page([rec({ id: 'dup' })]))
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([]))
    const out = await createXenoCantoClient(http, 'K').search('X x')
    expect(out.map(r => r.id)).toEqual(['dup'])
  })

  it('follows a second page of the continent-wide fallback', async () => {
    const http = vi.fn()
      .mockResolvedValueOnce(page([])).mockResolvedValueOnce(page([])).mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([rec({ id: 'p1' })], 3))
      .mockResolvedValueOnce(page([rec({ id: 'p2' })], 3))
    const out = await createXenoCantoClient(http, 'K').search('X x')
    expect(out.map(r => r.id)).toEqual(['p1', 'p2'])
    expect(urlOf(http, 4)).toContain('page=2')
    expect(http).toHaveBeenCalledTimes(5)  // never a third page
  })

  it('throws on a non-OK response', async () => {
    const http = vi.fn().mockResolvedValue(new Response('', { status: 401 }))
    await expect(createXenoCantoClient(http, 'K').search('X x')).rejects.toThrow(/401/)
  })

  it('redacts the API key from a propagated request error', async () => {
    const http = vi.fn().mockRejectedValue(
      new Error('Request to https://xeno-canto.org/api/3/recordings?query=x&page=1&key=XCKEY failed after 3 retries (503)')
    )
    let caught: Error | undefined
    try {
      await createXenoCantoClient(http, 'XCKEY').search('X x')
    } catch (err) {
      caught = err as Error
    }
    expect(caught).toBeDefined()
    expect(caught!.message).not.toContain('XCKEY')
    expect(caught!.message).toContain('REDACTED')
    // `cause` must not smuggle the unredacted message back in (util.inspect
    // and console.error both print it).
    expect(String((caught as unknown as { cause?: unknown }).cause ?? '')).not.toContain('XCKEY')
  })
})
