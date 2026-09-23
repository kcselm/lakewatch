import type { HttpFn } from './http'
import type { ClipType } from '../../src/catalog/types'

const BASE = 'https://xeno-canto.org/api/3/recordings'
const SONG_LIKE = /song/i

export interface XCRecording {
  id: string
  en: string
  rec: string
  cnt: string
  loc: string
  type: string
  q: string
  /** Background species the recordist heard; empty means a clean recording. */
  also: string[]
  file: string
  url: string
  lic: string
}

/** A recording plus whether it came from a Pacific Northwest-scoped query. */
export interface FoundRecording extends XCRecording {
  regional: boolean
}

/** Run in order; stop as soon as enough candidates are found. */
export const QUERY_SCOPES: ReadonlyArray<{ scope: string; regional: boolean; pages: number }> = [
  { scope: 'loc:oregon', regional: true, pages: 1 },
  { scope: 'loc:washington', regional: true, pages: 1 },
  { scope: 'loc:"british columbia"', regional: true, pages: 1 },
  { scope: 'area:america', regional: false, pages: 2 },
]

export function normalizeClipType(rec: XCRecording): ClipType {
  return SONG_LIKE.test(rec.type) ? 'song' : 'call'
}

/** Trimming and transcoding is a derivative; NoDerivatives licenses are out. */
export function isDerivable(rec: XCRecording): boolean {
  return !/-nd\b/i.test(rec.lic)
}

export function licenseLabel(lic: string): string {
  const m = /creativecommons\.org\/licenses\/([a-z-]+)\/([\d.]+)/i.exec(lic)
  if (!m) return lic
  return `CC ${m[1]!.toUpperCase()} ${m[2]}`
}

function score(r: FoundRecording): number {
  return (r.regional ? 4 : 0) + (r.also.length === 0 ? 2 : 0) + (r.q === 'A' ? 1 : 0)
}

/**
 * Regional > clean (no background species) > quality A, then alternating
 * song and call so three clips are not three near-identical songs.
 * Sort is stable, so ties keep query order (most regional scope first).
 */
export function selectClips(recs: readonly FoundRecording[], count: number): FoundRecording[] {
  const ranked = recs.filter(isDerivable).sort((a, b) => score(b) - score(a))
  const songs = ranked.filter(r => normalizeClipType(r) === 'song')
  const calls = ranked.filter(r => normalizeClipType(r) === 'call')

  const out: FoundRecording[] = []
  let i = 0
  while (out.length < count && (i < songs.length || i < calls.length)) {
    if (i < songs.length && out.length < count) out.push(songs[i]!)
    if (i < calls.length && out.length < count) out.push(calls[i]!)
    i++
  }
  return out
}

/** Strips the API key out of a message so a propagated request error never logs it. */
function redactKey(message: string): string {
  return message.replace(/([?&]key=)[^&\s]+/g, '$1REDACTED')
}

export function createXenoCantoClient(http: HttpFn, apiKey: string) {
  async function fetchPage(query: string, page: number) {
    const url = `${BASE}?query=${encodeURIComponent(query)}&page=${page}&key=${apiKey}`
    let res: Response
    try {
      res = await http(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(redactKey(message))
    }
    if (!res.ok) throw new Error(`xeno-canto search failed with status ${res.status}`)
    const body = (await res.json()) as { recordings?: XCRecording[]; numPages?: number }
    return { recordings: body.recordings ?? [], numPages: body.numPages ?? 1 }
  }

  return {
    /**
     * Regional scopes first, then a continent-wide fallback. Stops as soon as
     * `enough` distinct candidates are in hand. Deduplicated by id.
     */
    async search(scientificName: string, enough = 12): Promise<FoundRecording[]> {
      const seen = new Set<string>()
      const out: FoundRecording[] = []

      for (const { scope, regional, pages } of QUERY_SCOPES) {
        const query = `sp:"${scientificName}" ${scope} q:">C" grp:birds`
        for (let page = 1; page <= pages; page++) {
          const { recordings, numPages } = await fetchPage(query, page)
          for (const r of recordings) {
            if (seen.has(r.id)) continue
            seen.add(r.id)
            out.push({ ...r, also: r.also ?? [], regional })
          }
          if (page >= numPages) break
        }
        if (out.length >= enough) break
      }
      return out
    },
  }
}
