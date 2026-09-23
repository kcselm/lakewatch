import type * as THREE from 'three'
import type { LookControls } from './look'

export type OpticMode = 'eye' | 'binoculars' | 'telescope'

export interface OpticSpec {
  fov: number
  /** fraction of the shorter viewport side */
  maskRadius: number
  /** edge softness in the same units */
  maskSoftness: number
  /** radians of hand sway amplitude */
  sway: number
  panScale: number
  raiseSeconds: number
}

export const OPTICS: Record<OpticMode, OpticSpec> = {
  eye:        { fov: 60,  maskRadius: 1,    maskSoftness: 0,    sway: 0,      panScale: 1,    raiseSeconds: 0.25 },
  binoculars: { fov: 7.5, maskRadius: 0.46, maskSoftness: 0.05, sway: 0.0016, panScale: 1,    raiseSeconds: 0.35 },
  telescope:  { fov: 2,   maskRadius: 0.40, maskSoftness: 0.012, sway: 0,     panScale: 0.55, raiseSeconds: 0.45 },
}

export const MODE_ORDER: OpticMode[] = ['eye', 'binoculars', 'telescope']

export function nextMode(m: OpticMode, dir: 1 | -1): OpticMode {
  const i = MODE_ORDER.indexOf(m) + dir
  return MODE_ORDER[Math.max(0, Math.min(MODE_ORDER.length - 1, i))]!
}

/** A slow figure-8 with a faster tremor, bounded by `amount`. */
export function swayOffset(t: number, amount: number): { x: number; y: number } {
  if (amount === 0) return { x: 0, y: 0 }
  const x = 0.6 * Math.sin(t * 0.9) + 0.25 * Math.sin(t * 3.7) + 0.15 * Math.sin(t * 11.3)
  const y = 0.6 * Math.sin(t * 1.3 + 1.2) + 0.25 * Math.sin(t * 4.1) + 0.15 * Math.sin(t * 9.7)
  return { x: x * amount, y: y * amount }
}

export class Optics {
  mode: OpticMode = 'eye'
  private from: OpticMode = 'eye'
  private t = 1
  private clock = 0
  private blur = 0

  get transition(): number { return this.t }
  get currentFov(): number {
    const a = OPTICS[this.from].fov, b = OPTICS[this.mode].fov
    const e = this.t * this.t * (3 - 2 * this.t)
    // interpolate in log space so the zoom feels even
    return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * e)
  }
  /** 0..1 focus-pull blur amount, for the mask overlay */
  get focusBlur(): number { return this.blur }

  setMode(m: OpticMode): void {
    if (m === this.mode) return
    this.from = this.mode
    this.mode = m
    this.t = 0
    this.blur = m === 'eye' ? 0 : 1
  }

  update(dt: number, camera: THREE.PerspectiveCamera, look: LookControls): void {
    this.clock += dt
    const spec = OPTICS[this.mode]
    if (this.t < 1) this.t = Math.min(1, this.t + dt / spec.raiseSeconds)
    this.blur = Math.max(0, this.blur - dt / 0.4)
    const fov = this.currentFov
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix() }
    look.fovScale = (fov / 60) * spec.panScale
    const sway = swayOffset(this.clock, spec.sway * this.t)
    look.applyTo(camera, sway.x, sway.y)
  }
}
