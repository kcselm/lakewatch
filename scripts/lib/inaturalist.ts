import type { HttpFn } from './http'

const BASE = 'https://api.inaturalist.org/v1'
const CC_LICENSES = 'cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa'

export interface INatPhoto {
  url: string
  licenseCode: string
  attribution: string
  sourceUrl: string
}

interface INatPhotoRaw {
  id: number
  license_code: string | null
  attribution: string
  url: string
}

interface INatTaxon {
  id: number
  default_photo: INatPhotoRaw | null
}

interface INatObservation {
  photos?: INatPhotoRaw[]
}

/** iNaturalist serves a square thumbnail by default; ask for the large variant. */
export function largeUrl(squareUrl: string): string {
  return squareUrl.replace(/\/square\.(jpe?g|png)$/i, '/large.$1')
}

function toPhoto(p: INatPhotoRaw & { license_code: string }): INatPhoto {
  return {
    url: largeUrl(p.url),
    licenseCode: p.license_code,
    attribution: p.attribution,
    sourceUrl: `https://www.inaturalist.org/photos/${p.id}`,
  }
}

function licensed(p: INatPhotoRaw | null | undefined): p is INatPhotoRaw & { license_code: string } {
  return !!p && p.license_code !== null
}

export function createINatClient(http: HttpFn) {
  async function get<T>(path: string): Promise<T> {
    const res = await http(`${BASE}${path}`)
    if (!res.ok) throw new Error(`iNaturalist lookup failed with status ${res.status}`)
    return (await res.json()) as T
  }

  return {
    async photoFor(scientificName: string): Promise<INatPhoto | null> {
      const taxa = await get<{ results?: INatTaxon[] }>(
        `/taxa?q=${encodeURIComponent(scientificName)}&rank=species&per_page=1`,
      )
      const taxon = taxa.results?.[0]
      if (!taxon) return null

      if (licensed(taxon.default_photo)) return toPhoto(taxon.default_photo)

      // The default photo is unlicensed or missing. Use the best-voted
      // research-grade observation that carries a CC photo instead.
      const obs = await get<{ results?: INatObservation[] }>(
        `/observations?taxon_id=${taxon.id}&photo_license=${CC_LICENSES}` +
        `&quality_grade=research&order_by=votes&per_page=1`,
      )
      const fallback = obs.results?.[0]?.photos?.find(licensed)
      return fallback ? toPhoto(fallback) : null
    },
  }
}
