import { z } from 'zod'
import { detailSchema, authoredSchema } from './detail/spec'

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'expected #rrggbb')

export const plumageSchema = z.object({
  crown: hex, cheek: hex, throat: hex, breast: hex, flank: hex, back: hex, wing: hex,
  speculum: hex.nullable(), rump: hex, tail: hex, bill: hex, legs: hex, eye: hex,
})

/** how a species feeds when the cast puts it on `probe` */
export const PROBE_STYLES = ['plover', 'sandpiper', 'dowitcher'] as const
/** how a species feeds when the cast puts it on `swim` */
export const SWIM_STYLES = ['dabbler', 'shoveler', 'coot', 'grebe', 'goose', 'pelican'] as const
/** how a species feeds when the cast puts it on `wade` (with none, it steps, stands, and strikes as `wade` always has) */
export const WADE_STYLES = ['heron'] as const
export const FORAGING = [...PROBE_STYLES, ...SWIM_STYLES, ...WADE_STYLES] as const
export type ProbeStyle = (typeof PROBE_STYLES)[number]
export type SwimStyle = (typeof SWIM_STYLES)[number]
export type WadeStyle = (typeof WADE_STYLES)[number]
export type Foraging = (typeof FORAGING)[number]
export const isProbeStyle = (f: Foraging | undefined): f is ProbeStyle => (PROBE_STYLES as readonly (string | undefined)[]).includes(f)
export const isSwimStyle = (f: Foraging | undefined): f is SwimStyle => (SWIM_STYLES as readonly (string | undefined)[]).includes(f)
export const isWadeStyle = (f: Foraging | undefined): f is WadeStyle => (WADE_STYLES as readonly (string | undefined)[]).includes(f)

/** Whether a species is a detailed bird: lofted by the detailed builder (`detail`) or made in Blender (`authored`). */
export const isDetailed = (spec: { detail?: unknown; authored?: unknown } | undefined): boolean => !!(spec?.detail || spec?.authored)

/**
 * Whether a species' flyover flock flies as detailed birds: any detailed species, unless it keeps its flock to the
 * block bird (`flock: 'block'`, a goose's until it has a wing to fly on).
 */
export const fliesDetailed = (spec: { detail?: { flock?: string }; authored?: { flock?: string } } | undefined): boolean =>
  isDetailed(spec) && (spec!.detail ?? spec!.authored)!.flock !== 'block'

export const MARK_KEYS = ['size', 'bill', 'head', 'body', 'legs'] as const
export type MarkKey = (typeof MARK_KEYS)[number]

export const speciesSpecSchema = z.object({
  code: z.string().min(1),
  commonName: z.string().min(1),
  /** bill tip to tail tip, metres */
  length: z.number().positive(),
  body: z.object({ length: z.number().positive(), height: z.number().positive(), width: z.number().positive() }),
  neck: z.object({ length: z.number().min(0), thickness: z.number().positive(), angle: z.number() }),
  head: z.object({ size: z.number().positive() }),
  bill: z.object({ length: z.number().positive(), thickness: z.number().positive(), shape: z.enum(['pointed', 'flat', 'dagger', 'hooked']) }),
  legs: z.object({ length: z.number().min(0), thickness: z.number().positive() }),
  tail: z.object({ length: z.number().min(0), angle: z.number() }),
  wing: z.object({ length: z.number().positive(), width: z.number().positive() }),
  posture: z.enum(['swimming', 'standing', 'perched']),
  /** fraction of body height below the waterline when swimming */
  draft: z.number().min(0).max(1),
  plumage: plumageSchema,
  variants: z.record(z.string(), plumageSchema.partial()),
  marks: z.object({ size: z.string(), bill: z.string(), head: z.string(), body: z.string(), legs: z.string() }),
  wingbeatHz: z.number().positive(),
  foraging: z.enum(FORAGING).optional(),
  /** present when the species uses the detailed builder */
  detail: detailSchema.optional(),
  /** present when the species is a detailed bird made in Blender (detail/spec.ts); never with `detail` */
  authored: authoredSchema.optional(),
}).superRefine((s, ctx) => {
  if (s.detail && s.authored) ctx.addIssue({ code: 'custom', message: `${s.code}: a bird is lofted (detail) or authored, not both`, path: ['authored'] })
  if (s.authored) {
    if (s.posture === 'perched') ctx.addIssue({ code: 'custom', message: `${s.code}: an authored bird stands or swims, not perched`, path: ['posture'] })
    if (s.authored.amphibious && s.posture !== 'swimming') ctx.addIssue({ code: 'custom', message: `${s.code}: an amphibious bird is built floating, so its posture is swimming`, path: ['posture'] })
    // every plumage the cast can ask for has textures
    for (const k of Object.keys(s.variants)) {
      if (!s.authored.versions.includes(k)) ctx.addIssue({ code: 'custom', message: `${s.code}: variant ${k} has no textures (authored.versions)`, path: ['authored', 'versions'] })
    }
    for (const v of s.authored.versions) {
      if (!(v in s.variants)) ctx.addIssue({ code: 'custom', message: `${s.code}: authored version ${v} is not one of the species' variants`, path: ['authored', 'versions'] })
    }
  }
  // what the detailed builder refuses, refused at load
  if (s.detail && s.posture === 'perched') ctx.addIssue({ code: 'custom', message: `${s.code}: a detail block builds standing and swimming birds only, not perched`, path: ['posture'] })
  if (s.detail && s.posture === 'swimming' && !s.detail.float) ctx.addIssue({ code: 'custom', message: `${s.code}: a swimming bird's detail block needs detail.float, its waterline`, path: ['detail', 'float'] })
  if (s.detail?.amphibious && s.posture !== 'swimming') ctx.addIssue({ code: 'custom', message: `${s.code}: an amphibious bird is built floating, so its posture is swimming`, path: ['posture'] })
  for (const k of Object.keys(s.detail?.variants ?? {})) {
    if (!(k in s.variants)) ctx.addIssue({ code: 'custom', message: `detail variant ${k} is not one of the species' variants`, path: ['detail', 'variants', k] })
  }
})

export type Plumage = z.infer<typeof plumageSchema>
export type SpeciesSpec = z.infer<typeof speciesSpecSchema>

export function parseSpeciesSpec(data: unknown): SpeciesSpec {
  return speciesSpecSchema.parse(data)
}

export function resolvePlumage(spec: SpeciesSpec, variant?: string): Plumage {
  if (!variant) return spec.plumage
  const v = spec.variants[variant]
  if (!v) throw new Error(`${spec.code}: unknown variant ${variant}`)
  return { ...spec.plumage, ...v }
}
