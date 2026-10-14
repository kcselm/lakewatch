import * as THREE from 'three'
import { ATLAS_SIZE, PAD, REGIONS, pixelST } from './atlas'
import { compileLayer, hashString, hexRGB, pointMm, skinSpan, type Frame, type Out, type Px, type RGB } from './layers'
import { createProfile, type Profile } from '../detail/profile'
import { layersFor, sizedDetail, PARTS, type DetailSpec, type Layer, type Part } from '../detail/spec'
import { SPAN, ROOT_CHORD, outlineAt, flightEdges } from '../detail/wing'
import { tailWidth } from '../detail/tail'
import { billScale, pouchFrame } from '../detail/bill'
import { CURL_LENGTH, CURL_RADIUS, PLUME_RADIUS, CREST_RADIUS } from '../detail/extras'
import type { SpeciesSpec } from '../spec'

/** Running totals for the dev overlay. */
export const paintStats = { atlases: 0, ms: 0, bytes: 0 }

const BASE_GREY = hexRGB('#808080')

/** mm frames for every part: the skin from the profile, the rest from the measurements. */
export function partFrames(detail: DetailSpec, profile: Profile): Record<Part, Frame> {
  const m = detail.measurements
  const noLabels = (label: string): number => { throw new Error(`station label "${label}" used outside the skin`) }
  const perimeter = new Map<number, number>()
  const skinWidth = (s: number) => {
    const k = Math.round(s * 511)
    let v = perimeter.get(k)
    if (v === undefined) { v = profile.halfPerimeter(k / 511) * 1000; perimeter.set(k, v) }
    return v
  }
  const flat = (lengthMm: number, widthMm: (s: number) => number): Frame => ({ lengthMm, widthMm, uOf: noLabels })
  const F = detail.flight
  // a flight wing's own span and chord; else the plain spread wing's
  const spread = F
    ? flat(F.span * 1000, s => { const e = flightEdges(F, s); return Math.max((e.lead - e.trail) * 1000, 0.01) })
    : flat(SPAN * m.wingChord * 1000, s => ROOT_CHORD * m.wingChord * 1000 * (1 - 0.85 * s ** 1.3))
  const tail = flat(m.tail * 1000, s => tailWidth(detail, profile, s) * 1000)
  const curl = detail.parts?.find(p => p.kind === 'curl'), plume = detail.parts?.find(p => p.kind === 'plume')
  const crest = detail.parts?.find(p => p.kind === 'crest')
  return {
    skin: { lengthMm: profile.length * 1000, widthMm: skinWidth, uOf: l => profile.uOf(l) },
    // the folded wing's t spans its outline height at s (wing.ts), so its frame does too
    wingFold: flat(m.wingChord * 1000, s => Math.max(outlineAt(detail.wing.outline, s) * m.wingChord * 1000, 0.01)),
    wingSpread: spread,
    wingUnder: spread,
    tail,
    tailUnder: tail,
    // half the bill's girth: a tapered bill's width and depth shrink together, a profiled one's each its own way
    bill: flat(m.culmen * 1000, detail.bill.profile
      ? s => { const k = billScale(detail.bill, s); return (Math.PI * (m.billDepth * k.depth + m.billWidth * k.width) * 1000) / 4 }
      : s => (Math.PI * (m.billDepth + m.billWidth) * 1000 / 4) * billScale(detail.bill, s).width),
    legs: flat(10, () => 10),
    eye: flat(detail.eye.radius * 2000, () => detail.eye.radius * 2000),
    shield: detail.bill.shield ? flat(detail.bill.shield.length * 1000, () => detail.bill.shield!.width * 1000) : flat(1, () => 1),
    curl: flat(CURL_LENGTH * (curl?.height ?? 0.001) * 1000, () => 2 * Math.PI * CURL_RADIUS * 1000),
    plume: flat((plume?.length ?? 0.001) * 1000, () => 2 * Math.PI * PLUME_RADIUS * 1000),
    pouch: detail.bill.pouch ? flat(pouchFrame(detail).lengthMm, pouchFrame(detail).widthMm) : flat(1, () => 1),
    // every strand of the crest shares the region, s along it: the longer lobe sets its length
    crest: flat(Math.max(...(crest?.lobes.map(l => l.length) ?? [0.001])) * 1000, () => 2 * Math.PI * CREST_RADIUS * 1000),
    // a song spread's cover and coverts take their share of the folded wing's chord and height; the mouth the bill's
    cover: patchFrame(detail, detail.display?.shoulder, detail.display?.shoulder.margin ?? 0),
    coverts: patchFrame(detail, detail.display?.coverts, 0),
    mouth: flat(m.culmen * 1000, () => m.billWidth * 1000),
  }
}

/** A patch of the folded wing (s and t ranges, widened by `margin` all round) as a paint frame, mm; a stand-in without one. */
function patchFrame(detail: DetailSpec, patch: { s: [number, number]; t: [number, number] } | undefined, margin: number): Frame {
  const noLabels = (label: string): number => { throw new Error(`station label "${label}" used outside the skin`) }
  if (!patch) return { lengthMm: 1, widthMm: () => 1, uOf: noLabels }
  const chord = detail.measurements.wingChord * 1000
  const s0 = Math.max(0, patch.s[0] - margin), s1 = Math.min(1, patch.s[1] + margin)
  const t0 = Math.max(0, patch.t[0] - margin), t1 = Math.min(1, patch.t[1] + margin)
  return {
    lengthMm: (s1 - s0) * chord,
    widthMm: s => Math.max((t1 - t0) * outlineAt(detail.wing.outline, s0 + s * (s1 - s0)) * chord, 0.01),
    uOf: noLabels,
  }
}

/** Pixel columns a layer can touch in its part's region (skin layers limited to their span). */
function columns(layer: Layer, part: Part, f: Frame): [number, number] {
  const r = REGIONS[part]
  const usable = r.w - 2 * PAD
  const toCol = (s: number) => r.x + PAD + s * usable
  const margin = (mm: number) => (mm / f.lengthMm) * usable + 2
  let lo = r.x, hi = r.x + r.w
  if (part === 'skin') {
    if ('where' in layer && layer.where.part === 'skin') {
      const [a, b] = skinSpan(layer.where, f)
      const m = margin((layer.soft ?? 1) * 2)
      lo = toCol(a) - m; hi = toCol(b) + m
    } else if (layer.kind === 'stripe') {
      const xs = [pointMm(layer.from, f)[0], pointMm(layer.to, f)[0]]
      lo = toCol(Math.min(...xs) / f.lengthMm) - margin(layer.width * 2)
      hi = toCol(Math.max(...xs) / f.lengthMm) + margin(layer.width * 2)
    } else if (layer.kind === 'ring') {
      const x = pointMm(layer.at, f)[0]
      lo = toCol(x / f.lengthMm) - margin(layer.radius + layer.width * 2)
      hi = toCol(x / f.lengthMm) + margin(layer.radius + layer.width * 2)
    }
  }
  return [Math.max(r.x, Math.floor(lo)), Math.min(r.x + r.w, Math.ceil(hi))]
}

function partOf(layer: Layer): Part {
  return 'where' in layer ? layer.where.part : 'skin'
}

/**
 * Iris, pupil, and a catchlight in the eye region, inside a bare eyelid ring when the species has one; outside the
 * iris (or the lid), dark. The lid takes the outer part of the eye's radius, and the iris and pupil shrink inside it.
 */
function paintEye(buf: Float32Array, eye: DetailSpec['eye']): void {
  const r = REGIONS.eye
  const irisC = hexRGB(eye.iris), dark: RGB = [0.05, 0.05, 0.05], light: RGB = [0.95, 0.95, 0.95]
  const lidC = eye.lid ? hexRGB(eye.lid.color) : null
  const k = eye.lid ? 1 - Math.min(0.5, eye.lid.width / eye.radius) : 1
  for (let py = r.y; py < r.y + r.h; py++) {
    for (let px = r.x; px < r.x + r.w; px++) {
      const [s, t] = pixelST('eye', px, py)
      const d = Math.hypot(s - 0.5, t - 0.5) * 2
      let c: RGB = d < 0.45 * k ? dark : d < 0.92 * k ? irisC : lidC ?? dark
      if (Math.hypot(s - 0.5 + 0.14 * k, t - 0.5 - 0.14 * k) < 0.12 * k) c = light
      buf.set(c, (py * ATLAS_SIZE + px) * 3)
    }
  }
}

export interface PaintInput { code: string; detail: DetailSpec; layers: Layer[]; profile: Profile }

/** Paint an atlas: RGBA bytes, ATLAS_SIZE x ATLAS_SIZE, row 0 at v = 0. */
export function paintAtlas({ code, detail, layers, profile }: PaintInput): Uint8ClampedArray {
  const t0 = performance.now()
  const frames = partFrames(detail, profile)
  const buf = new Float32Array(ATLAS_SIZE * ATLAS_SIZE * 3)
  for (let i = 0; i < buf.length; i += 3) buf.set(BASE_GREY, i)
  paintEye(buf, detail.eye)
  const base = hashString(code)
  const out: Out = { alpha: 0, color: [0, 0, 0] }
  const px: Px = { s: 0, t: 0, X: 0, Y: 0, pixelMm: 0 }
  layers.forEach((layer, li) => {
    const part = partOf(layer)
    const f = frames[part]
    const r = REGIONS[part]
    const [c0, c1] = columns(layer, part, f)
    const L = compileLayer(layer, f, (base + li * 7919) | 0)
    const usableW = r.w - 2 * PAD, usableH = r.h - 2 * PAD
    for (let x = c0; x < c1; x++) {
      const s = Math.min(Math.max((x + 0.5 - r.x - PAD) / usableW, 0), 1)
      const ms = L.sMask(s)
      if (ms === 0) continue
      const w = f.widthMm(s)
      px.s = s; px.X = s * f.lengthMm
      px.pixelMm = Math.max(f.lengthMm / usableW, w / usableH)
      const [ta, tb] = L.tRange(w)
      // a range that reaches the region's edge paints through the padding too
      const y0 = ta <= 0 ? r.y : Math.max(r.y, Math.floor(r.y + PAD + ta * usableH - 1))
      const y1 = tb >= 1 ? r.y + r.h : Math.min(r.y + r.h, Math.ceil(r.y + PAD + tb * usableH + 1))
      for (let y = y0; y < y1; y++) {
        const t = Math.min(Math.max((y + 0.5 - r.y - PAD) / usableH, 0), 1)
        const m = ms * L.tMask(t, w)
        if (m === 0) continue
        px.t = t; px.Y = t * w
        L.shade(px, out)
        const a = Math.min(out.alpha * m * L.opacity, 1)
        if (a <= 0) continue
        const k = (y * ATLAS_SIZE + x) * 3
        buf[k] = buf[k]! + (out.color[0] - buf[k]!) * a
        buf[k + 1] = buf[k + 1]! + (out.color[1] - buf[k + 1]!) * a
        buf[k + 2] = buf[k + 2]! + (out.color[2] - buf[k + 2]!) * a
      }
    }
  })
  const rgba = new Uint8ClampedArray(ATLAS_SIZE * ATLAS_SIZE * 4)
  for (let i = 0, j = 0; i < buf.length; i += 3, j += 4) {
    rgba[j] = buf[i]! * 255; rgba[j + 1] = buf[i + 1]! * 255; rgba[j + 2] = buf[i + 2]! * 255; rgba[j + 3] = 255
  }
  tally(performance.now() - t0, rgba)
  return rgba
}

/** Count one atlas's paint for the dev overlay, wherever it was painted. */
function tally(ms: number, pixels: Uint8ClampedArray): void {
  paintStats.atlases++
  paintStats.ms += ms
  paintStats.bytes += Math.round(pixels.length * 4 / 3)     // with mipmaps
}

export function atlasTexture(pixels: Uint8ClampedArray): THREE.DataTexture {
  const tex = new THREE.DataTexture(pixels, ATLAS_SIZE, ATLAS_SIZE, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

/** One atlas: a species, and one of its versions (none: the species' own plumage). */
export interface AtlasJob { code: string; variant?: string }

/** An atlas painted off the main thread: its RGBA pixels, and how long the painting took in ms. */
export interface PaintedAtlas extends AtlasJob { pixels: Uint8ClampedArray; ms: number }

/** Paint one species' atlas for one version, here and now. */
export function paintSpecies(spec: SpeciesSpec, variant?: string): Uint8ClampedArray {
  if (!spec.detail) throw new Error(`${spec.code}: no detail block to paint`)
  // a version of its own size has its own skin and so its own layout
  const detail = sizedDetail(spec.detail, variant)
  return paintAtlas({ code: spec.code, detail, layers: layersFor(detail, variant), profile: createProfile(detail.profile) })
}

/** The key an atlas is cached under: one per species and version. */
export const atlasKey = ({ code, variant }: AtlasJob): string => `${code}:${variant ?? ''}`

const materials = new Map<string, THREE.MeshStandardMaterial>()
const material = (pixels: Uint8ClampedArray) => new THREE.MeshStandardMaterial({ map: atlasTexture(pixels), roughness: 0.85, metalness: 0 })

/** True once this species and version has its atlas, so materialFor won't paint it. */
export function atlasReady(job: AtlasJob): boolean {
  return materials.has(atlasKey(job))
}

/** Keep an atlas painted elsewhere (the paint worker) for materialFor, and count its paint time for the dev overlay. */
export function storeAtlas(a: PaintedAtlas): void {
  if (atlasReady(a)) return
  materials.set(atlasKey(a), material(a.pixels))
  tally(a.ms, a.pixels)
}

/**
 * One material (and one painted atlas) per species and plumage, shared by every bird of that kind. At startup
 * `prepaint` has painted every atlas the cast needs; anything else (the viewer, tests) is painted here on first use.
 */
export function materialFor(spec: SpeciesSpec, variant?: string): THREE.MeshStandardMaterial {
  const key = atlasKey({ code: spec.code, variant })
  let mat = materials.get(key)
  if (!mat) {
    mat = material(paintSpecies(spec, variant))
    materials.set(key, mat)
  }
  return mat
}

/**
 * Luminance (0..1) over part-local s and t ranges: mean, standard deviation, and roughness, the mean change
 * between neighbouring texels along s and along t. Roughness sees pattern (bars, streaks) and ignores smooth
 * gradients. For tests and the viewer.
 */
export function regionStats(pixels: Uint8ClampedArray, part: Part, s: [number, number], t: [number, number]): { mean: number; std: number; roughS: number; roughT: number; rgb: [number, number, number] } {
  const r = REGIONS[part]
  const lum = (x: number, y: number) => {
    const k = (y * ATLAS_SIZE + x) * 4
    return (0.2126 * pixels[k]! + 0.7152 * pixels[k + 1]! + 0.0722 * pixels[k + 2]!) / 255
  }
  const inside = (x: number, y: number) => {
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h) return false
    const [ps, pt] = pixelST(part, x, y)
    return ps >= s[0] && ps <= s[1] && pt >= t[0] && pt <= t[1]
  }
  let n = 0, sum = 0, sum2 = 0, ns = 0, ds = 0, nt = 0, dt = 0, red = 0, green = 0, blue = 0
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (!inside(x, y)) continue
      const l = lum(x, y)
      n++; sum += l; sum2 += l * l
      const k = (y * ATLAS_SIZE + x) * 4
      red += pixels[k]! / 255; green += pixels[k + 1]! / 255; blue += pixels[k + 2]! / 255
      if (inside(x + 1, y)) { ns++; ds += Math.abs(lum(x + 1, y) - l) }
      if (inside(x, y + 1)) { nt++; dt += Math.abs(lum(x, y + 1) - l) }
    }
  }
  const mean = sum / (n || 1)
  return {
    mean, std: Math.sqrt(Math.max(0, sum2 / (n || 1) - mean * mean)), roughS: ds / (ns || 1), roughT: dt / (nt || 1),
    rgb: [red / (n || 1), green / (n || 1), blue / (n || 1)],
  }
}
