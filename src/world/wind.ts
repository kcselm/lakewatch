import * as THREE from 'three'
import { valueNoise1 } from './noise'

export interface WindConfig {
  /** Compass degrees the wind blows toward: 0 = -z (away from the player), 90 = +x. */
  direction: number
  strength: number
  gustiness: number
  seed?: number
}

export interface WindState {
  dir: THREE.Vector2
  strength: number
  gust: number
  time: number
}

/**
 * The wind's speed in metres a second for a unit of strength (research 2026-09-30-lake-water.md section 3.1: the lake's
 * 0.35 is a light breeze, 2.8 m/s, Beaufort 2).
 */
export const WIND_SPEED = 8

/**
 * A gust front: bands 18 m apart (k = 0.35 rad/m) running downwind across the reeds and the water together at the
 * wind's own speed, ω / k = 2.9 m/s (it ran at 6.3 before the water shared it).
 */
export const GUST_FRONT = { k: 0.35, omega: 1.0 } as const

/** the gust front, 0..1, at a world point's distance downwind and time; `phase` staggers a reed's */
export function gustFront(along: number, time: number, phase = 0): number {
  return 0.5 + 0.5 * Math.sin(along * GUST_FRONT.k - time * GUST_FRONT.omega + phase * 0.3)
}

/** `gustFront` in GLSL, for the reeds' and the water's shaders, which declare uWindDir and uTime */
export const GUST_FRONT_GLSL = /* glsl */ `
float gustFront(vec2 xz, float phase) {
  return 0.5 + 0.5 * sin(dot(xz, uWindDir) * ${GUST_FRONT.k.toFixed(2)} - uTime * ${GUST_FRONT.omega.toFixed(2)} + phase * 0.3);
}`

/** Two octaves of value noise, scaled by gustiness, 0..1. */
export function gustAt(t: number, gustiness: number, seed: number): number {
  const slow = valueNoise1(t * 0.08, seed)
  const fast = valueNoise1(t * 0.5, seed + 1)
  const g = 0.7 * slow + 0.3 * fast
  return Math.min(1, Math.max(0, g * gustiness))
}

export class Wind {
  readonly state: WindState
  readonly uniforms: {
    uWindDir: { value: THREE.Vector2 }
    uWindStrength: { value: number }
    uWindGust: { value: number }
    uTime: { value: number }
  }
  private readonly gustiness: number
  private readonly seed: number

  constructor(cfg: WindConfig) {
    const rad = THREE.MathUtils.degToRad(cfg.direction)
    this.state = {
      dir: new THREE.Vector2(Math.sin(rad), -Math.cos(rad)),
      strength: cfg.strength,
      gust: 0,
      time: 0,
    }
    this.gustiness = cfg.gustiness
    this.seed = cfg.seed ?? 1
    this.uniforms = {
      uWindDir: { value: this.state.dir },
      uWindStrength: { value: cfg.strength },
      uWindGust: { value: 0 },
      uTime: { value: 0 },
    }
    this.update(0)
  }

  update(dt: number): void {
    this.state.time += dt
    this.state.gust = gustAt(this.state.time, this.gustiness, this.seed)
    this.uniforms.uWindGust.value = this.state.gust
    this.uniforms.uTime.value = this.state.time
  }

  effective(): number {
    return this.state.strength * (0.6 + 0.4 * this.state.gust)
  }
}
