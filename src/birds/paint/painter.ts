import * as THREE from 'three'
import { ATLAS_SIZE, PAD, REGIONS, pixelST } from './atlas'
import { compileLayer, hashString, hexRGB, pointMm, skinSpan, type Frame, type Out, type Px, type RGB } from './layers'
import { createProfile, type Profile } from '../detail/profile'
import { layersFor, PARTS, type DetailSpec, type Layer, type Part } from '../detail/spec'
import { SPAN, ROOT_CHORD, outlineAt } from '../detail/wing'
import { ROOT_WIDTH, TIP_SPREAD } from '../detail/tail'
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
  const spread = flat(SPAN * m.wingChord * 1000, s => ROOT_CHORD * m.wingChord * 1000 * (1 - 0.85 * s ** 1.3))
  const tailRoot = profile.sampleAt(profile.uOf(detail.rig.tailBase)).halfWidth * 2 * ROOT_WIDTH * 1000
  const tail = flat(m.tail * 1000, s => tailRoot * (1 + (TIP_SPREAD - 1) * s))
  return {
    skin: { lengthMm: profile.length * 1000, widthMm: skinWidth, uOf: l => profile.uOf(l) },
    // the folded wing's t spans its outline height at s (wing.ts), so its frame does too
    wingFold: flat(m.wingChord * 1000, s => Math.max(outlineAt(detail.wing.outline, s) * m.wingChord * 1000, 0.01)),
    wingSpread: spread,
    wingUnder: spread,
    tail,
    tailUnder: tail,
    bill: flat(m.culmen * 1000, s => (Math.PI * (m.billDepth + m.billWidth) * 1000 / 4) * (1 - 0.85 * s ** detail.bill.taper)),
    legs: flat(10, () => 10),
    eye: flat(detail.eye.radius * 2000, () => detail.eye.radius * 2000),
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
  paintStats.atlases++
  paintStats.ms += performance.now() - t0
  paintStats.bytes += Math.round(rgba.length * 4 / 3)     // with mipmaps
  return rgba
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

const materials = new Map<string, THREE.MeshStandardMaterial>()

/** One material (and one painted atlas) per species and plumage, shared by every bird of that kind. */
export function materialFor(spec: SpeciesSpec, variant?: string): THREE.MeshStandardMaterial {
  const key = `${spec.code}:${variant ?? ''}`
  let mat = materials.get(key)
  if (!mat) {
    const detail = spec.detail
    if (!detail) throw new Error(`${spec.code}: no detail block to paint`)
    const pixels = paintAtlas({ code: spec.code, detail, layers: layersFor(detail, variant), profile: createProfile(detail.profile) })
    mat = new THREE.MeshStandardMaterial({ map: atlasTexture(pixels), roughness: 0.85, metalness: 0 })
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
