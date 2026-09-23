import type { Habitat } from '../src/catalog/types'

export interface SearchCenter {
  name: string
  lat: number
  lng: number
  distKm: number
}

/** Two searches: Portland metro, and the north Oregon coast. */
export const SEARCH_CENTERS: SearchCenter[] = [
  { name: 'Portland', lat: 45.52, lng: -122.68, distKm: 50 },
  { name: 'North Coast', lat: 45.85, lng: -123.95, distKm: 50 },
]

/** Substrings matched against eBird hotspot names, case-insensitively. */
export const ANCHORS: Record<Habitat, string[]> = {
  wetland: ['Ridgefield NWR', 'Sauvie Island', 'Smith and Bybee'],
  forest: ['Tryon Creek', 'Tualatin Hills Nature', 'Pittock'],
  shoreline: ['Bayocean', 'Fort Stevens', 'Tillamook Bay'],
  urban: ['Oaks Bottom', 'Mt. Tabor', 'Westmoreland'],
}
