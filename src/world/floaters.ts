import type { BirdInstance } from '../birds/registry'

/** The cast has 50 birds in the water: 34 swimmers (eight of them geese, which go ashore, and five pelicans), four herons, three yellowlegs, and six dowitchers. */
export const MAX_FLOATERS = 56

/** a bird in the water: where, how fast it's going and which way, which way it faces (radians about y, as its model turns), its size, and whether it floats or stands */
export interface Floater { id: number; x: number; z: number; vx: number; vz: number; heading: number; radius: number; wading: boolean }

/** how quickly a floater's velocity follows its steps: a time constant, in seconds, so a frame's jitter doesn't flicker the wake */
export const VELOCITY_SMOOTHING = 0.3

/**
 * The birds whose feet or float are in the water, found each frame from the registry: shown, no higher than the
 * surface, and over water (`depthAt` > 0). One that floats this frame (its pose's `afloat`: a swimmer, a goose on the
 * water) gets a swimmer's contact line and wake; anything else in the water (a heron, a yellowlegs, a dowitcher, a goose
 * wading out) stands. Each one's velocity is measured from its steps and smoothed, so the water shader can draw its wake.
 */
export class FloaterTracker {
  private list: Floater[] = []
  private last = new Map<number, { x: number; z: number; vx: number; vz: number }>()
  constructor(readonly max: number = MAX_FLOATERS) {}

  get floaters(): readonly Floater[] { return this.list }

  update(birds: readonly BirdInstance[], depthAt: (x: number, z: number) => number, dt: number): void {
    const next = new Map<number, { x: number; z: number; vx: number; vz: number }>()
    const k = dt > 0 ? 1 - Math.exp(-dt / VELOCITY_SMOOTHING) : 0
    this.list = []
    for (const b of birds) {
      const p = b.position
      if (!b.model.group.visible || p.y > 0.02 || depthAt(p.x, p.z) <= 0) continue
      const was = this.last.get(b.id)
      let vx = 0, vz = 0
      if (was && dt > 0) {
        vx = was.vx + ((p.x - was.x) / dt - was.vx) * k
        vz = was.vz + ((p.z - was.z) / dt - was.vz) * k
      }
      next.set(b.id, { x: p.x, z: p.z, vx, vz })
      if (this.list.length < this.max) this.list.push({ id: b.id, x: p.x, z: p.z, vx, vz, heading: b.model.group.rotation.y, radius: b.model.radius, wading: !b.floating })
    }
    this.last = next
  }

  /**
   * two vec4s a floater: (x, z, vx, vz) and (radius, wading 0 or 1, and the way it faces on the water, cos h and -sin h);
   * an empty slot has radius 0, and the floaters come first
   */
  pack(target: Float32Array): void {
    target.fill(0)
    this.list.forEach((f, i) => {
      target.set([f.x, f.z, f.vx, f.vz, f.radius, f.wading ? 1 : 0, Math.cos(f.heading), -Math.sin(f.heading)], i * 8)
    })
  }
}
