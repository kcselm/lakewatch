export interface V2 { x: number; y: number }

/** fraction of a stride each foot spends on the ground */
export const STANCE = 0.6

/**
 * Analytic two-bone IK in the side view: hip to joint is `a` (tibia), joint to foot is `b` (tarsus). The
 * intertarsal joint always bends backward (-x of the hip-foot line), as a bird's does. An out-of-reach target
 * is pulled in along the hip-target line.
 */
export function solveLeg(hip: V2, target: V2, a: number, b: number): { joint: V2; foot: V2 } {
  let dx = target.x - hip.x, dy = target.y - hip.y
  const d0 = Math.hypot(dx, dy) || 1e-9
  const d = Math.min(Math.max(d0, Math.abs(a - b) + 1e-6), (a + b) * 0.9999)
  dx /= d0; dy /= d0
  const along = (a * a + d * d - b * b) / (2 * d)
  const across = Math.sqrt(Math.max(0, a * a - along * along))
  // of the two perpendiculars to the hip-foot line, take the one pointing back (-x)
  let px = -dy, py = dx
  if (px > 0 || (px === 0 && py < 0)) { px = -px; py = -py }
  return {
    joint: { x: hip.x + dx * along + px * across, y: hip.y + dy * along + py * across },
    foot: { x: hip.x + dx * d, y: hip.y + dy * d },
  }
}

/** smoothstep on 0..1 */
export const smooth = (w: number) => w * w * (3 - 2 * w)

/**
 * One foot's offset from its standing position at `phase` (0..1) of a stride `stride` metres long. During
 * stance the foot slides back exactly as fast as the bird moves forward, so it stays put in the world; during
 * swing it lifts on an arc and reaches forward again.
 */
export function footOffset(phase: number, stride: number, lift: number): V2 {
  const travel = stride * STANCE
  if (phase < STANCE) return { x: travel * (0.5 - phase / STANCE), y: 0 }
  const w = (phase - STANCE) / (1 - STANCE)
  return { x: travel * (-0.5 + smooth(w)), y: lift * Math.sin(Math.PI * w) }
}

/**
 * Both feet's offsets for a bird that has walked `strideDistance` metres, blended toward standing by `gait`
 * (0 standing, 1 walking). A stride is two steps; the feet are half a stride apart in phase.
 */
export function legOffsets(strideDistance: number, gait: number, stepLength: number, lift: number): { left: V2; right: V2 } {
  const stride = 2 * stepLength
  const phase = ((strideDistance / stride) % 1 + 1) % 1
  const g = Math.min(Math.max(gait, 0), 1)
  const of = (p: number) => { const o = footOffset(p, stride, lift); return { x: o.x * g, y: o.y * g } }
  return { left: of(phase), right: of((phase + 0.5) % 1) }
}
