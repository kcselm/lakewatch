import { OPTICS } from '../player/optics'

export const VIEWS = ['side', 'front', 'top', 'below', 'three'] as const
export type View = (typeof VIEWS)[number]

/** Field views: how the player sees the pair from the bank, through the game's optics (their fov and near plane). */
export const FIELD_VIEWS = {
  scope22: { label: 'telescope, 22 m (shallows)', distance: 22, fov: OPTICS.telescope.fov, near: OPTICS.telescope.near },
  scope35: { label: 'telescope, 35 m (open water)', distance: 35, fov: OPTICS.telescope.fov, near: OPTICS.telescope.near },
  scope65: { label: 'telescope, 65 m (far shore)', distance: 65, fov: OPTICS.telescope.fov, near: OPTICS.telescope.near },
  bino15: { label: 'binoculars, 15 m (near water)', distance: 15, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
  bino22: { label: 'binoculars, 22 m', distance: 22, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
  bino35: { label: 'binoculars, 35 m (the geese on the flat)', distance: 35, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
  bino65: { label: 'binoculars, 65 m', distance: 65, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
  // a flock crossing: with `raise`, the birds as high as the flock flies
  scope120: { label: 'telescope, 120 m (a flock crossing)', distance: 120, fov: OPTICS.telescope.fov, near: OPTICS.telescope.near },
  bino120: { label: 'binoculars, 120 m (a flock crossing)', distance: 120, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
} as const
export type FieldView = keyof typeof FIELD_VIEWS | ''

/** Everything the viewer shows, kept in the URL hash so a reload (Vite's hot reload of a species file) restores it. */
export interface ViewerState {
  a: string; av: string
  b: string; bv: string
  view: View
  field: FieldView
  /**
   * lean is the body's pitch, radians, positive nose down: a peck's 0.8, a dabbler's tip-up about 1.5; a bird traced
   * upright on a perch flies level at its flight.pitch, and hovers nose up at about that less 0.96 (55 degrees), below 0
   */
  neck: number; lean: number; spread: number; phase: number; reach: number
  /**
   * a reach's aim below the ground or water, metres (negative aims above it: a heron's strike into the water over the
   * bed), and the steepest its bill may point, radians below level
   */
  depth: number; angle: number
  /** the head turned after the neck, radians; positive raises the bill (a heron swallowing) */
  pitch: number
  /** an amphibious bird (a goose): 1 floating on its waterline, 0 standing on its feet, and between */
  afloat: number
  /** 0 legs hidden .. 1 shown and paddling (a swimmer's) */
  paddle: number
  /** a pouch under the bill, 0 slack .. 1 full; and a flight wing's glide, 0 flapping .. 1 held still */
  pouch: number; glide: number
  /** a flight wing held out to dry, 0 folded .. 1 (a cormorant's), and the tail propped on the perch, 0 .. 1 */
  dry: number; prop: number
  /** how high the birds are lifted off the ground, metres: a flock crosses 40-80 m up */
  raise: number
  /** the wings beat by themselves, at the species' wingbeat */
  flap: boolean
  /** a flight wing's stroke, 0 flapping .. 1 hovering; and the tail fanned, 0 closed .. 1 fully */
  stroke: number; fan: number
  /** the head turned about the neck after its pitch, radians, positive to the bird's left; and a crest raised, 0 .. 1 */
  yaw: number; crest: number
  /** a fish held in the bill, 0 none .. 1 held, and turned in it, 0 crosswise .. 1 lengthwise to swallow */
  fish: number; turn: number
  /** a percher's legs, 0 down on its branch .. 1 tucked up in flight */
  legs: number
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
  neck: [0, 1], lean: [-1, 1.6], spread: [0, 1], phase: [0, 1], reach: [0, 1], speed: [0.05, 2], water: [0, 0.4],
  depth: [-0.4, 0.3], angle: [0, Math.PI / 2], paddle: [0, 1], sink: [0, 0.15], bob: [-0.2, 0.2], tail: [-0.5, 1],
  pitch: [-0.5, 1.4], afloat: [0, 1], pouch: [0, 1], glide: [0, 1], raise: [0, 80], dry: [0, 1], prop: [0, 1],
  stroke: [0, 1], fan: [0, 1], yaw: [-1.6, 1.6], crest: [0, 1], fish: [0, 1], turn: [0, 1], legs: [0, 1],
} as const satisfies Record<string, readonly [number, number]>
const NUMBER_KEYS = Object.keys(NUMBERS) as (keyof typeof NUMBERS)[]
const FLAGS = ['walk', 'flap', 'float', 'see', 'wire', 'skel', 'uv', 'atlas', 'stations'] as const
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
