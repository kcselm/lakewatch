import { z } from 'zod'

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'expected #rrggbb')
const pos = z.number().positive()
const unit = z.number().min(0).max(1)
const range = z.tuple([unit, unit])

export const PARTS = ['skin', 'wingFold', 'wingSpread', 'wingUnder', 'tail', 'tailUnder', 'bill', 'legs', 'eye', 'shield', 'curl', 'plume'] as const
export type Part = (typeof PARTS)[number]

export const stationSchema = z.object({
  label: z.string().min(1).optional(),
  /** spine point in the side view, metres, +x forward, +y up */
  x: z.number(),
  y: z.number(),
  /** surface height above the spine */
  up: pos,
  /** surface depth below the spine */
  down: pos,
  halfWidth: pos,
  /**
   * Degrees the cross-section turns away from square to the spine: positive swings its lower side (belly, throat)
   * forward toward the bill and its upper side back. Where the spine turns sharply (a head resting on the breast),
   * tilted sections keep clear of each other, so the underside can follow the throat without creasing. Default 0.
   */
  tilt: z.number().min(-60).max(60).optional(),
})
export type Station = z.infer<typeof stationSchema>

/** Where a layer paints: a span of the skin between two station labels, or a rectangle of another part. */
export const whereSchema = z.union([
  z.object({ part: z.literal('skin'), from: z.string(), to: z.string(), band: range.optional() }),
  z.object({ part: z.enum(['wingFold', 'wingSpread', 'wingUnder', 'tail', 'tailUnder', 'bill', 'legs', 'eye', 'shield', 'curl', 'plume']), s: range.optional(), t: range.optional() }),
])
export type Where = z.infer<typeof whereSchema>

/** A point on the skin: a station label, a t (0 back midline .. 1 belly midline), an optional shift along the spine in mm. */
export const skinPointSchema = z.object({ at: z.string(), t: unit, dx: z.number().optional() })
export type SkinPoint = z.infer<typeof skinPointSchema>

const common = {
  /** region edge softness, mm */
  soft: z.number().min(0).optional(),
  opacity: unit.optional(),
}
/** pattern-element edge blur, mm */
const blur = z.number().min(0).optional()

export const layerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('base'), where: whereSchema, top: hex, side: hex, bottom: hex, ...common }),
  z.object({ kind: z.literal('fill'), where: whereSchema, color: hex, ...common }),
  z.object({ kind: z.literal('gradient'), where: whereSchema, axis: z.enum(['s', 't']), from: unit, to: unit, colorA: hex, colorB: hex, ...common }),
  z.object({ kind: z.literal('spots'), where: whereSchema, color: hex, size: pos, spacing: pos, jitter: unit.optional(), blur, ...common }),
  z.object({ kind: z.literal('bars'), where: whereSchema, color: hex, width: pos, spacing: pos, angle: z.number(), blur, ...common }),
  z.object({ kind: z.literal('streaks'), where: whereSchema, color: hex, length: pos, width: pos, spacing: pos, jitter: unit.optional(), blur, ...common }),
  z.object({ kind: z.literal('stripe'), from: skinPointSchema, to: skinPointSchema, width: pos, color: hex, blur, ...common }),
  z.object({ kind: z.literal('ring'), at: skinPointSchema, radius: pos, width: pos, color: hex, blur, ...common }),
  z.object({
    kind: z.literal('feathers'), where: whereSchema,
    /** feather length along the spine and width across it, mm */
    length: pos, width: pos,
    center: hex.optional(), edge: hex, edgeWidth: pos,
    notch: z.object({ color: hex, size: pos, count: z.number().int().positive() }).optional(),
    ...common,
  }),
])
export type Layer = z.infer<typeof layerSchema>

export const detailSchema = z.object({
  measurements: z.object({
    length: pos, culmen: pos, billDepth: pos, billWidth: pos,
    tarsus: pos, tibia: pos, toe: pos, wingChord: pos, tail: pos,
  }),
  profile: z.array(stationSchema).min(4),
  rig: z.object({
    neckBase: z.string(), neckMid: z.string(), head: z.string(), hip: z.string(), tailBase: z.string(),
    /**
     * A long neck's joints: station labels from the neck base to the head, in order along the spine, 3 to 7 of them,
     * starting at `neckBase`, then `neckMid`, and ending at `head`. The neck then bends at every one of them into the
     * shapes `neckShapes` names, keeping its length. Without it the neck has three joints (neckBase, neckMid, head)
     * and stretches and tucks as it always has.
     */
    neck: z.array(z.string()).min(3).max(7).optional(),
    /**
     * Where the skin starts handing off from the body to the neck's base joint: a station before `neckBase`. Without
     * it, 0.08 of the spine before it. A bird whose body's rings crowd up to its neck base (a goose's, turning about
     * the shoulders) names one close in, so the neck's bending leaves the breast alone.
     */
    neckFrom: z.string().optional(),
    /**
     * How far below the spine the neck's base joint sits, as a share of the section's depth there: 0 on the spine (the
     * default) to 1 on the skin of the throat side. A neck that bends forward and down over a deep breast (a goose's,
     * grazing) turns about its throat side, so the breast isn't crushed. Nothing turns at rest, so the loft is as built.
     */
    neckBaseDepth: z.number().min(0).max(1).optional(),
  }),
  /**
   * A chained neck's shapes: one bend per joint of `rig.neck`, degrees, relative to the traced posture; positive turns
   * what lies ahead of the joint up (counter-clockwise in the side view, the bird facing +x). The last joint's bend is
   * the head's. `hunch` at neckExtend 0 (the neck folded, the head on the shoulders), the trace at 0.5, `erect` at 1;
   * `strike` at the bottom of a reach. Required with `rig.neck`, and only with it.
   */
  neckShapes: z.object({ hunch: z.array(z.number()), erect: z.array(z.number()), strike: z.array(z.number()) }).optional(),
  /**
   * How much longer a chained neck grows going erect, a multiple of its traced length (a goose's neck, drawn down into
   * its feathers at rest, lengthens as it stands up): every segment lengthens by the same share as neckExtend goes from
   * the trace (0.5) to erect (1). Default 1: the neck keeps its length. Only with `rig.neck`.
   */
  neckStretch: z.number().min(1).max(3).optional(),
  /**
   * How much longer a chained neck grows reaching down (a goose's, to the grass), a multiple of its traced length,
   * smoothly as the reach goes in; where neckStretch would stretch it further, that holds. Default 1. Only with `rig.neck`.
   */
  reachStretch: z.number().min(1).max(3).optional(),
  bill: z.object({
    /** width and depth fall to 1 − 0.85 σ^taper of the base's at σ along the bill; a higher taper keeps it deep longer */
    taper: pos.optional(),
    /** the tip lifts by curve × culmen over the distal half (negative droops it) */
    curve: z.number(),
    /**
     * The bill's width and depth along it, in place of `taper`: [s, width, depth] with s a fraction of the culmen from
     * the base (0) to the tip (1), and width and depth multiples of measurements.billWidth and billDepth; linear
     * between points, and held beyond the first and last.
     */
    profile: z.array(z.tuple([unit, z.number().min(0), z.number().min(0)])).min(2).optional(),
    /** how far the tip drops over the bill's last tenth, metres: a duck's nail, a grebe's hooked tip */
    hook: z.number().min(0).optional(),
    /**
     * A frontal shield (the Coot's): a plate from the top of the bill's base up the forehead, `length` along it,
     * `width` across, standing `thickness` off the head at its middle, all metres. Painted as its own part, 'shield'.
     */
    shield: z.object({ length: pos, width: pos, thickness: pos }).optional(),
  }),
  eye: z.object({
    radius: pos, t: unit, iris: hex,
    /** a bare eyelid ring, drawn on the eye's own rim: its colour, and its width in metres */
    lid: z.object({ color: hex, width: pos }).optional(),
  }),
  wing: z.object({
    /** bend of the wing in the side view, metres */
    wrist: z.tuple([z.number(), z.number()]),
    /** chord direction, degrees below straight back */
    droop: z.number(),
    /** [s, height as a fraction of the chord], s from wrist (0) to tip (1) */
    outline: z.array(z.tuple([unit, z.number().min(0)])).min(3),
  }),
  /** 'none': no tail at all (a grebe's is a hidden tuft); the rear of the body is the stern, and it cocks on the tail bone */
  tail: z.object({ shape: z.enum(['square', 'rounded', 'wedge', 'notched', 'none']), angle: z.number().optional() }),
  /** 'webbed': a membrane between the three front toes (ducks); 'lobed': a flap along each toe segment (Coot, grebes) */
  feet: z.enum(['webbed', 'lobed']).optional(),
  /** lobed feet: how wide the middle toe is across its lobes at their widest, metres (default 0.2 × measurements.toe) */
  lobeWidth: pos.optional(),
  /**
   * Parts some plumage versions have and others don't. Each is built on every bird of the species, on a bone of its
   * own that is hidden on the versions it doesn't name. 'curl': the Mallard drake's two curled central tail coverts,
   * loops `height` metres high rising from the back midline at the station `at`, `dx` metres forward along the spine,
   * on a bone that hangs from the body. 'plume': an adult heron's occipital plumes, two thin strands `length` metres
   * long trailing back from the top of the head at the station `at`, `droop` degrees below the horizontal in the
   * traced side view and sagging a little further toward their tips, on a bone that hangs from the head, so they go
   * wherever the head goes.
   * Painted as the parts 'curl' and 'plume'. One part of each kind.
   */
  parts: z.array(z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('curl'), at: z.string(), dx: z.number().optional(), height: pos, versions: z.array(z.string().min(1)).min(1) }),
    z.object({
      kind: z.literal('plume'), at: z.string(), dx: z.number().optional(), length: pos,
      droop: z.number().min(-30).max(90), versions: z.array(z.string().min(1)).min(1),
    }),
  ])).optional(),
  stepLength: pos.optional(),
  /** how far below the ground the bill tip goes at the bottom of a reach, metres; a prober pushes its bill into the mud */
  probeDepth: z.number().min(0).optional(),
  /**
   * A swimmer's waterline: its height in the traced side view (the profile frame), metres, where the water meets the
   * bird in the reference photo. The builder puts it at y = 0. Required for a species whose posture is 'swimming'.
   */
  float: z.object({ waterline: z.number() }).optional(),
  /**
   * A swimmer that also stands and walks (a goose): one bird, built floating on its waterline, with its legs built
   * standing from `measurements`, so `PoseState.afloat` takes it from its float (1) to its feet (0). Needs `float`.
   */
  amphibious: z.boolean().optional(),
  /**
   * How far the body rolls toward the planted foot at a full walk, degrees, once a step and in time with it (a goose's
   * waddle). Default 0: no roll.
   */
  waddle: z.number().min(0).max(20).optional(),
  plumage: z.array(layerSchema),
  variants: z.record(z.string(), z.array(layerSchema)),
  sources: z.array(z.string().min(1)).min(1),
}).superRefine((d, ctx) => {
  if (d.bill.taper === undefined && !d.bill.profile) ctx.addIssue({ code: 'custom', message: 'a bill needs a taper or a profile', path: ['bill'] })
  d.bill.profile?.forEach(([s], i, list) => {
    if (i > 0 && s <= list[i - 1]![0]) ctx.addIssue({ code: 'custom', message: 'bill profile points must run from base to tip', path: ['bill', 'profile', i] })
  })
  const labels = new Set(d.profile.flatMap(s => (s.label ? [s.label] : [])))
  const need = (label: string, path: (string | number)[]) => {
    if (!labels.has(label)) ctx.addIssue({ code: 'custom', message: `unknown station label: ${label}`, path })
  }
  need('occiput', ['profile'])
  need('eye', ['profile'])
  d.parts?.forEach((p, i) => {
    need(p.at, ['parts', i, 'at'])
    if (d.parts!.findIndex(q => q.kind === p.kind) !== i) ctx.addIssue({ code: 'custom', message: `more than one ${p.kind}`, path: ['parts', i] })
    for (const v of p.versions) {
      if (!(v in d.variants)) ctx.addIssue({ code: 'custom', message: `part version ${v} is not one of detail.variants`, path: ['parts', i, 'versions'] })
    }
  })
  for (const [k, v] of Object.entries(d.rig)) if (typeof v === 'string') need(v, ['rig', k])
  if (d.rig.neckFrom) {
    const at = (l: string) => d.profile.findIndex(s => s.label === l)
    if (at(d.rig.neckFrom) >= at(d.rig.neckBase)) ctx.addIssue({ code: 'custom', message: 'rig.neckFrom must come before neckBase along the spine', path: ['rig', 'neckFrom'] })
  }
  const chain = d.rig.neck
  if (chain) {
    chain.forEach((l, i) => need(l, ['rig', 'neck', i]))
    if (chain[0] !== d.rig.neckBase || chain[1] !== d.rig.neckMid || chain.at(-1) !== d.rig.head) {
      ctx.addIssue({ code: 'custom', message: 'rig.neck runs neckBase, neckMid, ..., head', path: ['rig', 'neck'] })
    }
    const order = chain.map(l => d.profile.findIndex(s => s.label === l))
    if (order.some((k, i) => i > 0 && k <= order[i - 1]!)) ctx.addIssue({ code: 'custom', message: 'rig.neck labels must run along the spine', path: ['rig', 'neck'] })
    if (!d.neckShapes) ctx.addIssue({ code: 'custom', message: 'a chained neck needs neckShapes', path: ['neckShapes'] })
    else for (const [k, v] of Object.entries(d.neckShapes)) {
      if (v.length !== chain.length) ctx.addIssue({ code: 'custom', message: `neckShapes.${k} needs one bend per joint (${chain.length})`, path: ['neckShapes', k] })
    }
  } else {
    if (d.neckShapes) ctx.addIssue({ code: 'custom', message: 'neckShapes needs rig.neck', path: ['neckShapes'] })
    if (d.neckStretch !== undefined) ctx.addIssue({ code: 'custom', message: 'neckStretch needs rig.neck', path: ['neckStretch'] })
    if (d.reachStretch !== undefined) ctx.addIssue({ code: 'custom', message: 'reachStretch needs rig.neck', path: ['reachStretch'] })
  }
  if (d.amphibious && !d.float) ctx.addIssue({ code: 'custom', message: 'an amphibious bird needs float, its waterline', path: ['amphibious'] })
  const layers = (list: Layer[], path: (string | number)[]) => list.forEach((l, i) => {
    if ('where' in l && l.where.part === 'skin') { need(l.where.from, [...path, i, 'where', 'from']); need(l.where.to, [...path, i, 'where', 'to']) }
    if (l.kind === 'stripe') { need(l.from.at, [...path, i, 'from']); need(l.to.at, [...path, i, 'to']) }
    if (l.kind === 'ring') need(l.at.at, [...path, i, 'at'])
  })
  layers(d.plumage, ['plumage'])
  for (const [k, v] of Object.entries(d.variants)) layers(v, ['variants', k])
})
export type DetailSpec = z.infer<typeof detailSchema>

/** The layer list for a variant: the variant's own list when it has one, else the base plumage. */
export function layersFor(detail: DetailSpec, variant?: string): Layer[] {
  return (variant && detail.variants[variant]) || detail.plumage
}
