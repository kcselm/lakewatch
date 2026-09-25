import { OPTICS } from '../player/optics'

export const VIEWS = ['side', 'front', 'top', 'three'] as const
export type View = (typeof VIEWS)[number]

/** Field views: how the player sees the pair from the bank. */
export const FIELD_VIEWS = {
  scope22: { label: 'telescope, 22 m (shallows)', distance: 22, fov: OPTICS.telescope.fov },
  scope65: { label: 'telescope, 65 m (far shore)', distance: 65, fov: OPTICS.telescope.fov },
  bino22: { label: 'binoculars, 22 m', distance: 22, fov: OPTICS.binoculars.fov },
  bino65: { label: 'binoculars, 65 m', distance: 65, fov: OPTICS.binoculars.fov },
} as const
export type FieldView = keyof typeof FIELD_VIEWS | ''

/** Everything the viewer shows, kept in the URL hash so a reload (Vite's hot reload of a species file) restores it. */
export interface ViewerState {
  a: string; av: string
  b: string; bv: string
  view: View
  field: FieldView
  neck: number; lean: number; spread: number; phase: number
  walk: boolean
  water: boolean; wire: boolean; skel: boolean; uv: boolean; atlas: boolean; stations: boolean
}

const NUMBERS = ['neck', 'lean', 'spread', 'phase'] as const
const FLAGS = ['walk', 'water', 'wire', 'skel', 'uv', 'atlas', 'stations'] as const
const STRINGS = ['a', 'av', 'b', 'bv'] as const

/** What the viewer can show: species codes it knows, and each one's plumages. */
export interface Catalog { has(code: string): boolean; variants(code: string): string[] }

/**
 * Read a hash like "#a=greyel&b=lesyel&field=scope22&wire=1" over the defaults. Unknown or bad values keep the
 * default; a species the catalog lacks keeps the default species, and a plumage it lacks becomes the default one.
 */
export function parseState(hash: string, defaults: ViewerState, catalog?: Catalog): ViewerState {
  const p = new URLSearchParams(hash.replace(/^#/, ''))
  const s: ViewerState = { ...defaults }
  for (const k of STRINGS) { const v = p.get(k); if (v !== null) s[k] = v }
  if (catalog) {
    for (const [code, variant] of [['a', 'av'], ['b', 'bv']] as const) {
      if (!catalog.has(s[code])) { s[code] = defaults[code]; s[variant] = defaults[variant] }
      if (s[variant] && !catalog.variants(s[code]).includes(s[variant])) s[variant] = ''
    }
  }
  for (const k of NUMBERS) {
    const v = Number(p.get(k))
    if (p.has(k) && Number.isFinite(v)) s[k] = Math.min(Math.max(v, 0), 1)
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
  for (const k of NUMBERS) p.set(k, String(s[k]))
  for (const k of FLAGS) p.set(k, s[k] ? '1' : '0')
  return '#' + p.toString()
}
