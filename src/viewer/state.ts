import { OPTICS } from '../player/optics'

export const VIEWS = ['side', 'front', 'top', 'three'] as const
export type View = (typeof VIEWS)[number]

/** Field views: how the player sees the pair from the bank, through the game's optics (their fov and near plane). */
export const FIELD_VIEWS = {
  scope22: { label: 'telescope, 22 m (shallows)', distance: 22, fov: OPTICS.telescope.fov, near: OPTICS.telescope.near },
  scope35: { label: 'telescope, 35 m (open water)', distance: 35, fov: OPTICS.telescope.fov, near: OPTICS.telescope.near },
  scope65: { label: 'telescope, 65 m (far shore)', distance: 65, fov: OPTICS.telescope.fov, near: OPTICS.telescope.near },
  bino15: { label: 'binoculars, 15 m (near water)', distance: 15, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
  bino22: { label: 'binoculars, 22 m', distance: 22, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
  bino65: { label: 'binoculars, 65 m', distance: 65, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
} as const
export type FieldView = keyof typeof FIELD_VIEWS | ''

/** Everything the viewer shows, kept in the URL hash so a reload (Vite's hot reload of a species file) restores it. */
export interface ViewerState {
  a: string; av: string
  b: string; bv: string
  view: View
  field: FieldView
  /** lean is the body's pitch, radians: a peck's 0.8, a dabbler's tip-up about 1.5 */
  neck: number; lean: number; spread: number; phase: number; reach: number
  /**
   * a reach's aim below the ground or water, metres (negative aims above it: a heron's strike into the water over the
   * bed), and the steepest its bill may point, radians below level
   */
  depth: number; angle: number
  /** the head turned after the neck, radians; positive raises the bill (a heron swallowing) */
  pitch: number
  /** 0 legs hidden .. 1 shown and paddling (a swimmer's) */
  paddle: number
  /** how far the birds sink below the surface, metres (a grebe's periscope) */
  sink: number
  /** the head pump, body lengths fore and aft, and the tail cocked up, radians */
  bob: number; tail: number
  walk: boolean
  /** walking speed, m/s */
  speed: number
  /** depth of the water over the ground, metres (a heron wades to about 30 cm); 0 hides it */
  water: number
  /** the lake, as in the game: opaque water at y = 0 (a swimmer's waterline) and no ground; `see` makes it see-through */
  float: boolean; see: boolean
  wire: boolean; skel: boolean; uv: boolean; atlas: boolean; stations: boolean
}

/** each number's range: a value outside it is clamped */
const NUMBERS = {
  neck: [0, 1], lean: [0, 1.6], spread: [0, 1], phase: [0, 1], reach: [0, 1], speed: [0.05, 2], water: [0, 0.4],
  depth: [-0.4, 0.3], angle: [0, Math.PI / 2], paddle: [0, 1], sink: [0, 0.15], bob: [-0.2, 0.2], tail: [-0.5, 1],
  pitch: [-0.5, 1.4],
} as const satisfies Record<string, readonly [number, number]>
const NUMBER_KEYS = Object.keys(NUMBERS) as (keyof typeof NUMBERS)[]
const FLAGS = ['walk', 'float', 'see', 'wire', 'skel', 'uv', 'atlas', 'stations'] as const
const STRINGS = ['a', 'av', 'b', 'bv'] as const

/** What the viewer can show: species codes it knows, and each one's plumages. */
export interface Catalog { has(code: string): boolean; variants(code: string): string[] }

/**
 * Read a hash like "#a=greyel&b=lesyel&field=scope22&wire=1" over the defaults. Unknown or bad values keep the
 * default; a species the catalog lacks keeps the default species, and a plumage it lacks becomes the default one.
 */
export function parseState(hash: string, defaults: ViewerState, catalog?: Catalog): ViewerState {
  const p = new URLSearchParams(hash.replace(/^#/, ''))
  // water was once an on-off flag for a plane 3 cm up; an old link still shows it there
  if (p.get('water') === '1') p.set('water', '0.03')
  const s: ViewerState = { ...defaults }
  for (const k of STRINGS) { const v = p.get(k); if (v !== null) s[k] = v }
  if (catalog) {
    for (const [code, variant] of [['a', 'av'], ['b', 'bv']] as const) {
      if (!catalog.has(s[code])) { s[code] = defaults[code]; s[variant] = defaults[variant] }
      if (s[variant] && !catalog.variants(s[code]).includes(s[variant])) s[variant] = ''
    }
  }
  for (const k of NUMBER_KEYS) {
    const v = Number(p.get(k))
    if (p.has(k) && Number.isFinite(v)) s[k] = Math.min(Math.max(v, NUMBERS[k][0]), NUMBERS[k][1])
  }
  for (const k of FLAGS) if (p.has(k)) s[k] = p.get(k) === '1'
  const view = p.get('view')
  if (view && (VIEWS as readonly string[]).includes(view)) s.view = view as View
  const field = p.get('field')
  if (field !== null && (field === '' || field in FIELD_VIEWS)) s.field = field as FieldView
  return s
}

export function stateHash(s: ViewerState): string {
  const p = new URLSearchParams()
  for (const k of STRINGS) p.set(k, s[k])
  p.set('view', s.view)
  p.set('field', s.field)
  for (const k of NUMBER_KEYS) p.set(k, String(s[k]))
  for (const k of FLAGS) p.set(k, s[k] ? '1' : '0')
  return '#' + p.toString()
}
