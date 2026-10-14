import { z } from 'zod'

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'expected #rrggbb')
const pos = z.number().positive()
const unit = z.number().min(0).max(1)
const range = z.tuple([unit, unit])
/** a crest's tuft: see detailSchema's `parts` */
const crestLobe = z.object({ at: z.string(), dx: z.number().optional(), length: pos, lie: z.number().min(-45).max(45) })

export const PARTS = [
  'skin', 'wingFold', 'wingSpread', 'wingUnder', 'tail', 'tailUnder', 'bill', 'legs', 'eye', 'shield', 'curl', 'plume', 'pouch', 'crest',
  // a song spread's parts (`display`): the feathers covering the shoulder, the coverts it raises, and the mouth a gape shows
  'cover', 'coverts', 'mouth',
] as const
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
  z.object({
    part: z.enum(['wingFold', 'wingSpread', 'wingUnder', 'tail', 'tailUnder', 'bill', 'legs', 'eye', 'shield', 'curl', 'plume', 'pouch', 'crest', 'cover', 'coverts', 'mouth']),
    s: range.optional(), t: range.optional(),
  }),
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
    /** how loosely the feathers lie: 0 (the default) in even rows, up to 1 shifted and sized at random by about their spacing */
    jitter: unit.optional(),
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
  /**
   * How many cross-sections the skin is lofted from, evenly along the spine (default 64, loft.ts RINGS). A bird whose
   * head is short against its spine (a duck's, drawn in on the shoulders) needs more to keep the head round.
   */
  rings: z.number().int().min(16).max(256).optional(),
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
     * The cross-section's squareness, a superellipse's exponent as the skin's (profile.ts): 2, the default, is an ellipse;
     * higher flattens the top and squares the sides, as a dabbling duck's broad bill is
     */
    section: z.number().min(2).max(6).optional(),
    /**
     * A frontal shield (the Coot's): a plate from the top of the bill's base up the forehead, `length` along it,
     * `width` across, standing `thickness` off the head at its middle, all metres. Painted as its own part, 'shield'.
     */
    shield: z.object({ length: pos, width: pos, thickness: pos }).optional(),
    /**
     * A pouch hanging under the bill (a pelican's): its lower outline as [s, rest, full], s a fraction of the culmen
     * from the base (0) to the tip (1), negative behind the base, under the throat; `rest` and `full` how far below
     * the bill's axis it hangs there, metres, slack and filled. Linear between points; it begins at the first and
     * ends at the last. PoseState.pouch fills it. Painted as its own part, 'pouch': s along it, t across.
     */
    pouch: z.array(z.tuple([z.number().min(-0.6).max(1), z.number().min(0), z.number().min(0)])).min(3).optional(),
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
  /**
   * 'none': no tail at all (a grebe's is a hidden tuft); the rear of the body is the stern, and it cocks on the tail bone.
   * `fan`: degrees between the outer feathers with the tail fully fanned (PoseState.tailSpread 1), each column of
   * feathers turning about its own root on a bone of its own; without it the tail never fans.
   * `width`: the tail's width at its root, as a share of the body's full width at the tail base (default 0.55);
   * `spread`: its width at the tip, as a multiple of the root's (default 1.3: widening; under 1 a closed tail that
   * narrows to its tip); `vault`: how far its outer feathers lie below its middle ones, as a share of its width there
   * (default 0.12: a shallow cup; a dabbling duck's closed tail is a steeper roof).
   */
  tail: z.object({
    shape: z.enum(['square', 'rounded', 'wedge', 'notched', 'none']), angle: z.number().optional(), fan: z.number().min(0).max(180).optional(),
    width: z.number().min(0.1).max(1).optional(), spread: z.number().min(0.2).max(3).optional(), vault: z.number().min(0).max(0.5).optional(),
  }),
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
   * 'crest': a shaggy crest in two `lobes`, a tuft at each lobe's station `at` (`dx` metres forward along the spine),
   * each a few tapering strands `length` metres long, lying back `lie` degrees above straight back in the traced side
   * view; each lobe on a bone of its own that hangs from the head ('crest' the first, 'crestBack' the second), which
   * PoseState.crestRaise turns up about the lobe's base by `raise` degrees. A crest that names no `versions` is on every
   * bird of the species.
   * Painted as the parts 'curl', 'plume' and 'crest'. One part of each kind.
   */
  parts: z.array(z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('curl'), at: z.string(), dx: z.number().optional(), height: pos, versions: z.array(z.string().min(1)).min(1) }),
    z.object({
      kind: z.literal('plume'), at: z.string(), dx: z.number().optional(), length: pos,
      droop: z.number().min(-30).max(90), versions: z.array(z.string().min(1)).min(1),
    }),
    z.object({
      kind: z.literal('crest'),
      lobes: z.tuple([crestLobe, crestLobe]),
      raise: z.number().min(0).max(60),
      versions: z.array(z.string().min(1)).min(1).optional(),
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
   * A percher's branch: its radius, metres, and optionally `top`, the height of the branch's top under the hips in the
   * traced side view (the profile frame), where the reference photo's feet stand. The builder sets the bird's feet on
   * the branch's top at y = 0 and curls its toes round it: reaching down to `top` as far as the legs allow, or without
   * it crouched. Required for a species whose posture is 'perched', and only for one.
   */
  perch: z.object({
    radius: pos, top: z.number().optional(),
    /**
     * Its toes take any stem the pose gives them (PoseState.feet): each foot's toes are made round its own stem, of any
     * angle and radius, rather than built once round the branch; without a stem to hold they wrap the branch as ever
     */
    stems: z.boolean().optional(),
  }).optional(),
  /**
   * A song spread's parts and how far each goes (PoseState's epaulet, epauletRaise, fluff, wingHold and gape); a bird
   * without it ignores those values.
   * - `shoulder`: the patch on the folded wing the covering feathers hide, as wingFold's s (from the wrist back) and t
   *   (down from its top edge). The cover, a shell of the scapulars and the breast-side feathers painted as 'cover',
   *   lies over it and over `margin` more of the wing all round, `gap` metres off the wing; epaulet draws it forward off
   *   the patch from its rear edge, its buff end first.
   * - `coverts`: the part of the patch whose feathers rise (epauletRaise), a shell just over the wing painted as
   *   'coverts', at 1 turned `turn` degrees out about its front edge (so it faces forward), lifted `raise` degrees off
   *   the wing about its upper edge, moved `forward` and `out` metres and grown by `grow`.
   * - `fluff`: how far the contour feathers stand out at fluff 1, metres: over the body, and over the crown and nape.
   * - `hold`: wingHold 1: the folded wing turned `out` degrees from the body about its chord, its tip dropped `droop`.
   * - `gape`: degrees the lower mandible drops at gape 1. The bill is built as two mandibles, the lower on a jaw of
   *   its own, the inside of the mouth painted as 'mouth'.
   */
  display: z.object({
    shoulder: z.object({ s: range, t: range, margin: z.number().min(0).max(0.3), gap: pos }),
    coverts: z.object({
      s: range, t: range, turn: z.number().min(0).max(90), raise: z.number().min(0).max(90), forward: z.number(), out: z.number(),
      grow: z.number().min(1).max(2),
    }),
    fluff: z.object({ body: pos, head: pos }),
    hold: z.object({ out: z.number().min(0).max(60), droop: z.number().min(0).max(60) }),
    gape: z.number().min(0).max(60),
  }).optional(),
  /**
   * Versions of a different size: the whole traced bird (its profile, eye, wing, tail, perch and parts) scaled by
   * `scale`, then any of `measurements` given outright, before the bird is built. A version not named here is the
   * traced size. Each size is a bird of its own (its own mesh); every number downstream is the built bird's.
   */
  sizes: z.record(z.string(), z.object({
    scale: z.number().min(0.5).max(1.5),
    measurements: z.object({
      length: pos, culmen: pos, billDepth: pos, billWidth: pos, tarsus: pos, tibia: pos, toe: pos, wingChord: pos, tail: pos,
    }).partial().optional(),
  })).optional(),
  /**
   * A fish the bird can hold in its bill (PoseState.fish), crosswise or turned to swallow (PoseState.fishTurn): its
   * length, metres. One fish shape serves every bird, scaled to this.
   */
  fish: z.object({ length: pos }).optional(),
  /**
   * A swimmer that also stands and walks (a goose): one bird, built floating on its waterline, with its legs built
   * standing from `measurements`, so `PoseState.afloat` takes it from its float (1) to its feet (0). Needs `float`.
   */
  amphibious: z.boolean().optional(),
  /**
   * How a flyover flock of the species flies: as detailed birds (the default), or as instances of its block bird
   * ('block': a species detailed on the water whose wing to fly on comes later).
   */
  flock: z.enum(['detailed', 'block']).optional(),
  /**
   * How far the body rolls toward the planted foot at a full walk, degrees, once a step and in time with it (a goose's
   * waddle). Default 0: no roll.
   */
  waddle: z.number().min(0).max(20).optional(),
  /**
   * A wing to fly on, in place of the plain spread wing: its own planform, and a wrist it bends at.
   * - `span`: shoulder to wingtip, metres. `rootX`: where the shoulder sits along the body, metres in the traced side
   *   view (unset: just behind the folded wing's wrist, as the plain wing's).
   * - `outline`: [s, lead, trail], s a fraction of the span from the shoulder (0) to the tip (1); the leading and
   *   trailing edges there, metres ahead of the shoulder (behind it: negative). Linear between points.
   * - `wrist`: where the wing bends, a fraction of the span. The inner wing turns at the shoulder, the hand at the wrist.
   * - `fingers`: separated primaries at the tip: from `from` of the span outward the wing parts into `count` feathers,
   *   the slots between them opening until, at the tip, each feather keeps `fill` of its share of the chord.
   * - `beat`: a wingbeat, degrees: the inner wing swings `shoulder` either side of `lift` (positive: up), the hand
   *   `hand` either side of the inner wing's line, `lag` of a beat behind it.
   * - `glide`: the wing held still, degrees: the inner wing's angle above level, and the hand's from the inner wing's;
   *   and, if `sweep` says so, the inner wing swept at the shoulder and the hand at the wrist (positive: forward), the
   *   half-closed wing of a kingfisher's glide. PoseState.glide eases the wing into it.
   * - `dry`: the wing held out to dry (a cormorant's), degrees: the inner wing swept `sweep` back and raised `shoulder`
   *   above level, the hand swept `handSweep` further back and turned `hand` from the inner wing's line (negative:
   *   hanging). PoseState.dry holds it; a bird without it ignores PoseState.dry.
   * - `pitch`: degrees the body's long axis rises toward the head at the shoulder, in the traced side view (default 0).
   *   The wing is laid out in the body's plane, its chord along that axis, and turns about the body's own axes: a
   *   bird traced upright on a perch flies with its wing where its body has it, once its lean levels the body.
   * - `hover`: a second stroke, of the shape of `beat`, with the inner wing also sweeping `sweep` either side of square
   *   about the body's vertical axis, forward on the downstroke and back on the upstroke. PoseState.wingStroke blends
   *   from `beat` (0) to it (1). The body's tilt, set through its lean, tips the stroke plane toward the horizontal.
   * - `fold`: how the wing closes as PoseState.wingSpread falls, degrees at the closed end: the inner wing swept at the
   *   shoulder and the hand at the wrist (positive: forward; a fold sweeps back) about the body's vertical axis, and
   *   each twisted about its own span (positive: the leading edge up), so the wing lies back along the flank. Its
   *   feathers gather onto the folded wing's place as it closes (the geometry's 'fold' morph target), and the folded
   *   wing takes over where the two coincide. Without it the wing opens all at once, its stroke growing with
   *   wingSpread, and the swap comes at 0.05.
   * Painted as 'wingSpread' above and 'wingUnder' below: s along the span, t from the leading edge (0) to the trailing.
   */
  flight: z.object({
    span: pos,
    rootX: z.number().optional(),
    outline: z.array(z.tuple([unit, z.number(), z.number()])).min(3),
    wrist: z.number().min(0.2).max(0.8),
    fingers: z.object({ count: z.number().int().min(2).max(8), from: z.number().min(0.5).max(0.95), fill: z.number().min(0.3).max(0.95) }).optional(),
    beat: z.object({ shoulder: z.number().min(0).max(80), lift: z.number().min(-30).max(30), hand: z.number().min(0).max(80), lag: unit }),
    glide: z.object({
      shoulder: z.number().min(-30).max(30), hand: z.number().min(-45).max(45),
      sweep: z.object({ shoulder: z.number().min(-60).max(30), hand: z.number().min(-90).max(30) }).optional(),
    }),
    dry: z.object({
      shoulder: z.number().min(-30).max(80), sweep: z.number().min(0).max(80),
      hand: z.number().min(-90).max(30), handSweep: z.number().min(0).max(90),
    }).optional(),
    pitch: z.number().min(-60).max(60).optional(),
    hover: z.object({
      shoulder: z.number().min(0).max(80), lift: z.number().min(-30).max(30), hand: z.number().min(0).max(80), lag: unit,
      sweep: z.number().min(0).max(45),
    }).optional(),
    // the hand's fold is held under 120° either way, so where the skin blends across the wrist it never turns inside out
    fold: z.object({
      sweep: z.object({ shoulder: z.number().min(-150).max(30), hand: z.number().min(-120).max(30) }),
      twist: z.object({ shoulder: z.number().min(-120).max(120), hand: z.number().min(-120).max(120) }),
    }).optional(),
  }).optional(),
  plumage: z.array(layerSchema),
  variants: z.record(z.string(), z.array(layerSchema)),
  sources: z.array(z.string().min(1)).min(1),
}).superRefine((d, ctx) => {
  if (d.bill.taper === undefined && !d.bill.profile) ctx.addIssue({ code: 'custom', message: 'a bill needs a taper or a profile', path: ['bill'] })
  d.bill.profile?.forEach(([s], i, list) => {
    if (i > 0 && s <= list[i - 1]![0]) ctx.addIssue({ code: 'custom', message: 'bill profile points must run from base to tip', path: ['bill', 'profile', i] })
  })
  d.flight?.outline.forEach(([s, lead, trail], i, list) => {
    if (i > 0 && s <= list[i - 1]![0]) ctx.addIssue({ code: 'custom', message: 'flight outline points must run from the shoulder to the tip', path: ['flight', 'outline', i] })
    if (trail > lead) ctx.addIssue({ code: 'custom', message: "the wing's trailing edge lies behind its leading edge", path: ['flight', 'outline', i] })
  })
  if (d.tail.fan !== undefined && d.tail.shape === 'none') ctx.addIssue({ code: 'custom', message: 'a bird without a tail has none to fan', path: ['tail', 'fan'] })
  if (d.flight && (d.flight.outline[0]![0] !== 0 || d.flight.outline.at(-1)![0] !== 1)) {
    ctx.addIssue({ code: 'custom', message: 'the flight outline runs from s = 0 to s = 1', path: ['flight', 'outline'] })
  }
  d.bill.pouch?.forEach(([s, rest, full], i, list) => {
    if (i > 0 && s <= list[i - 1]![0]) ctx.addIssue({ code: 'custom', message: 'pouch points must run from the throat to the tip', path: ['bill', 'pouch', i] })
    if (full < rest) ctx.addIssue({ code: 'custom', message: 'a full pouch hangs no higher than a slack one', path: ['bill', 'pouch', i] })
  })
  const labels = new Set(d.profile.flatMap(s => (s.label ? [s.label] : [])))
  const need = (label: string, path: (string | number)[]) => {
    if (!labels.has(label)) ctx.addIssue({ code: 'custom', message: `unknown station label: ${label}`, path })
  }
  need('occiput', ['profile'])
  need('eye', ['profile'])
  d.parts?.forEach((p, i) => {
    if (p.kind === 'crest') p.lobes.forEach((l, k) => need(l.at, ['parts', i, 'lobes', k, 'at']))
    else need(p.at, ['parts', i, 'at'])
    if (d.parts!.findIndex(q => q.kind === p.kind) !== i) ctx.addIssue({ code: 'custom', message: `more than one ${p.kind}`, path: ['parts', i] })
    for (const v of p.versions ?? []) {
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
  for (const v of Object.keys(d.sizes ?? {})) {
    if (!(v in d.variants)) ctx.addIssue({ code: 'custom', message: `size ${v} is not one of detail.variants`, path: ['sizes', v] })
  }
  const layers = (list: Layer[], path: (string | number)[]) => list.forEach((l, i) => {
    if ('where' in l && l.where.part === 'skin') { need(l.where.from, [...path, i, 'where', 'from']); need(l.where.to, [...path, i, 'where', 'to']) }
    if (l.kind === 'stripe') { need(l.from.at, [...path, i, 'from']); need(l.to.at, [...path, i, 'to']) }
    if (l.kind === 'ring') need(l.at.at, [...path, i, 'at'])
  })
  layers(d.plumage, ['plumage'])
  for (const [k, v] of Object.entries(d.variants)) layers(v, ['variants', k])
})
export type DetailSpec = z.infer<typeof detailSchema>

/**
 * A detailed bird made outside the game, in Blender (scripts/blender/): its mesh, skin, and each version's textures come
 * from public/models/<model>/, and only how it moves is set here. The model is built on the detailed builder's
 * skeleton (rig.ts), so it poses with the same code as a lofted bird. The fields mean what the same fields of a lofted
 * detail block mean.
 * - `model`: the folder under public/models/, holding <model>.glb (the mesh, its skin and landmarks, no images) and
 *   <version>.color.webp, <version>.normal.webp, <version>.rough.webp for each version.
 * - `versions`: the versions it has textures for, each one of the species' variants; the first is the default (a bird
 *   cast with no plumage).
 * - `neck`: how many labels the model's neck chain has, its base to its head (chainBones): the loader checks the model's
 *   joints against it.
 * - `flight`: a flight wing's wingbeat, glide, and drying pose; its planform is the model's.
 */
export const authoredSchema = z.object({
  model: z.string().regex(/^[a-z0-9-]+$/, 'a folder name under public/models/'),
  versions: z.array(z.string().min(1)).min(1),
  measurements: detailSchema.shape.measurements,
  neck: z.number().int().min(3).max(7).optional(),
  neckShapes: detailSchema.shape.neckShapes,
  neckStretch: detailSchema.shape.neckStretch,
  reachStretch: detailSchema.shape.reachStretch,
  stepLength: detailSchema.shape.stepLength,
  probeDepth: detailSchema.shape.probeDepth,
  amphibious: detailSchema.shape.amphibious,
  flock: detailSchema.shape.flock,
  waddle: detailSchema.shape.waddle,
  flight: z.object({
    beat: detailSchema.shape.flight.unwrap().shape.beat, glide: detailSchema.shape.flight.unwrap().shape.glide,
    dry: detailSchema.shape.flight.unwrap().shape.dry,
  }).optional(),
  sources: detailSchema.shape.sources,
}).superRefine((d, ctx) => {
  if (d.neck !== undefined) {
    if (!d.neckShapes) ctx.addIssue({ code: 'custom', message: 'a chained neck needs neckShapes', path: ['neckShapes'] })
    else for (const [k, v] of Object.entries(d.neckShapes)) {
      if (v.length !== d.neck) ctx.addIssue({ code: 'custom', message: `neckShapes.${k} needs one bend per joint (${d.neck})`, path: ['neckShapes', k] })
    }
  } else {
    for (const k of ['neckShapes', 'neckStretch', 'reachStretch'] as const) {
      if (d[k] !== undefined) ctx.addIssue({ code: 'custom', message: `${k} needs neck`, path: [k] })
    }
  }
  if (new Set(d.versions).size !== d.versions.length) ctx.addIssue({ code: 'custom', message: 'a version is named twice', path: ['versions'] })
})
export type AuthoredSpec = z.infer<typeof authoredSchema>

const sized = new WeakMap<DetailSpec, Map<string, DetailSpec>>()

/**
 * The detail block a version is built from: the traced bird for a version without a size of its own (`sizes`), the
 * same object every time; else the bird scaled, with its own measurements, made once and kept, so whatever is cached
 * against a detail block (the folded wing's placement) is cached once per size.
 */
export function sizedDetail(detail: DetailSpec, variant?: string): DetailSpec {
  const size = variant ? detail.sizes?.[variant] : undefined
  if (!size) return detail
  let byVersion = sized.get(detail)
  if (!byVersion) sized.set(detail, (byVersion = new Map()))
  let out = byVersion.get(variant!)
  if (!out) byVersion.set(variant!, (out = scaleDetail(detail, size.scale, size.measurements ?? {})))
  return out
}

/** Whether two versions of a species are the same size, so one's mesh serves the other. */
export function sameSize(detail: DetailSpec, a?: string, b?: string): boolean {
  return sizedDetail(detail, a) === sizedDetail(detail, b)
}

/** Every length of a detail block times k (proportions, angles, paint and the rig as they are), then `measurements` set. */
function scaleDetail(d: DetailSpec, k: number, measurements: Partial<DetailSpec['measurements']>): DetailSpec {
  const m = (v: number) => v * k
  const opt = (v: number | undefined) => (v === undefined ? undefined : v * k)
  const scaled = Object.fromEntries(Object.entries(d.measurements).map(([key, v]) => [key, v * k])) as DetailSpec['measurements']
  return {
    ...d,
    measurements: { ...scaled, ...measurements },
    profile: d.profile.map(s => ({ ...s, x: m(s.x), y: m(s.y), up: m(s.up), down: m(s.down), halfWidth: m(s.halfWidth) })),
    bill: {
      ...d.bill,
      hook: opt(d.bill.hook),
      shield: d.bill.shield && { length: m(d.bill.shield.length), width: m(d.bill.shield.width), thickness: m(d.bill.shield.thickness) },
      pouch: d.bill.pouch?.map(([s, rest, full]) => [s, m(rest), m(full)] as [number, number, number]),
    },
    eye: { ...d.eye, radius: m(d.eye.radius), lid: d.eye.lid && { ...d.eye.lid, width: m(d.eye.lid.width) } },
    wing: { ...d.wing, wrist: [m(d.wing.wrist[0]), m(d.wing.wrist[1])] },
    lobeWidth: opt(d.lobeWidth),
    parts: d.parts?.map(p => p.kind === 'crest'
      ? { ...p, lobes: p.lobes.map(l => ({ ...l, length: m(l.length), dx: opt(l.dx) })) as typeof p.lobes }
      : p.kind === 'curl' ? { ...p, height: m(p.height), dx: opt(p.dx) } : { ...p, length: m(p.length), dx: opt(p.dx) }),
    probeDepth: opt(d.probeDepth),
    float: d.float && { waterline: m(d.float.waterline) },
    perch: d.perch && { ...d.perch, radius: m(d.perch.radius), top: opt(d.perch.top) },
    fish: d.fish && { length: m(d.fish.length) },
    flight: d.flight && {
      ...d.flight, span: m(d.flight.span), rootX: opt(d.flight.rootX),
      outline: d.flight.outline.map(([s, lead, trail]) => [s, m(lead), m(trail)] as [number, number, number]),
    },
    display: d.display && {
      ...d.display,
      shoulder: { ...d.display.shoulder, gap: m(d.display.shoulder.gap) },
      coverts: { ...d.display.coverts, forward: m(d.display.coverts.forward), out: m(d.display.coverts.out) },
      fluff: { body: m(d.display.fluff.body), head: m(d.display.fluff.head) },
    },
    sizes: undefined,
  }
}

/** The layer list for a variant: the variant's own list when it has one, else the base plumage. */
export function layersFor(detail: DetailSpec, variant?: string): Layer[] {
  return (variant && detail.variants[variant]) || detail.plumage
}
