import type { HttpFn } from './http'

const BASE = 'https://api.ebird.org/v2'

export interface EBirdHotspot {
  locId: string
  locName: string
  lat: number
  lng: number
  numSpeciesAllTime: number
}

export interface EBirdTaxon {
  speciesCode: string
  comName: string
  sciName: string
  /** 'species' | 'spuh' | 'slash' | 'hybrid' | 'issf' | 'domestic' | 'form' | 'intergrade' */
  category: string
  familyComName: string
  familySciName: string
}

export interface EBirdClient {
  hotspotsNear(lat: number, lng: number, distKm: number): Promise<EBirdHotspot[]>
  historicObs(locId: string, year: number, month: number, day: number): Promise<string[]>
  taxonomy(speciesCodes: string[]): Promise<EBirdTaxon[]>
}

export function createEBirdClient(http: HttpFn, apiKey: string): EBirdClient {
  async function get<T>(path: string): Promise<T> {
    const res = await http(`${BASE}${path}`, { headers: { 'x-ebirdapitoken': apiKey } })
    if (!res.ok) throw new Error(`eBird ${path} failed with status ${res.status}`)
    return (await res.json()) as T
  }

  return {
    async hotspotsNear(lat, lng, distKm) {
      return get<EBirdHotspot[]>(
        `/ref/hotspot/geo?lat=${lat}&lng=${lng}&dist=${distKm}&fmt=json`,
      )
    },

    async historicObs(locId, year, month, day) {
      // cat=species: no "gull sp.", no "Western/Glaucous-winged Gull", no
      // subspecies groups. Those are real eBird records but not quiz answers.
      const obs = await get<Array<{ speciesCode: string }>>(
        `/data/obs/${locId}/historic/${year}/${month}/${day}?fmt=json&cat=species`,
      )
      return [...new Set(obs.map(o => o.speciesCode))]
    },

    async taxonomy(speciesCodes) {
      return get<EBirdTaxon[]>(
        `/ref/taxonomy/ebird?fmt=json&species=${speciesCodes.join(',')}`,
      )
    },
  }
}

/**
 * One hotspot per anchor name, in anchor order. Where several hotspots match
 * an anchor, the one with the most all-time species wins: that is the most
 * heavily birded site and gives the densest frequency sample. Unmatched
 * anchors are dropped.
 */
export function matchAnchors(
  hotspots: readonly EBirdHotspot[],
  anchorNames: readonly string[],
): EBirdHotspot[] {
  const out: EBirdHotspot[] = []
  for (const anchor of anchorNames) {
    const needle = anchor.toLowerCase()
    const hits = hotspots.filter(h => h.locName.toLowerCase().includes(needle))
    if (hits.length === 0) continue
    out.push(hits.reduce((best, h) => (h.numSpeciesAllTime > best.numSpeciesAllTime ? h : best)))
  }
  return out
}
