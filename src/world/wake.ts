/**
 * A swimming bird's V (research 2026-09-30-lake-water.md section 5). A duck at 0.35-0.70 m/s is in the Kelvin regime:
 * the wake's outer edge is at 19.47 degrees either side of its track, its brightest arms a little inside, about 15
 * degrees. Nothing slower than c_min, 0.23 m/s, makes waves; the wake comes in over 0.23-0.30 m/s. It fades behind the
 * bird with an e-folding distance of 1.5 m, and is drawn out to 5 m.
 */
export const WAKE = {
  minSpeed: 0.23,
  fullSpeed: 0.30,
  halfAngle: 19.47 * Math.PI / 180,
  armAngle: 15 * Math.PI / 180,
  efold: 1.5,
  reach: 5,
  /** the wake's share on its centreline, between the arms, from its transverse crests */
  centre: 0.4,
} as const

const G = 9.81

function smooth(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

/** how much of a wake a bird swimming at `speed` m/s makes, 0..1 */
export function wakeStrength(speed: number): number {
  return speed <= WAKE.minSpeed ? 0 : smooth((speed - WAKE.minSpeed) / (WAKE.fullSpeed - WAKE.minSpeed))
}

/** the wavelength of the crests across the track behind a bird at `speed`: where a wave's speed matches the bird's */
export function transverseWavelength(speed: number): number {
  return 2 * Math.PI * speed * speed / G
}

/**
 * The wake's height envelope, 0..1, at a point `behind` metres back along the bird's track and `across` metres to
 * either side, for a bird at `speed`: 0 outside the wedge, ahead of the bird, and past its reach.
 */
export function wakeAt(behind: number, across: number, speed: number): number {
  if (behind <= 0 || behind > WAKE.reach) return 0
  const a = Math.atan2(Math.abs(across), behind)
  if (a >= WAKE.halfAngle) return 0
  const arm = a >= WAKE.armAngle
    ? smooth((WAKE.halfAngle - a) / (WAKE.halfAngle - WAKE.armAngle))
    : WAKE.centre + (1 - WAKE.centre) * smooth(a / WAKE.armAngle)
  return arm * Math.exp(-behind / WAKE.efold) * wakeStrength(speed)
}

/** `wakeAt` in GLSL, for the water's fragment shader */
export const WAKE_GLSL = /* glsl */ `
float wakeStrength(float speed) {
  return smoothstep(${WAKE.minSpeed.toFixed(3)}, ${WAKE.fullSpeed.toFixed(3)}, speed);
}
float wakeAt(float behind, float across, float speed) {
  if (behind <= 0.0 || behind > ${WAKE.reach.toFixed(1)}) return 0.0;
  float a = atan(abs(across), behind);
  if (a >= ${WAKE.halfAngle.toFixed(5)}) return 0.0;
  float arm = a >= ${WAKE.armAngle.toFixed(5)}
    ? smoothstep(0.0, 1.0, (${WAKE.halfAngle.toFixed(5)} - a) / ${(WAKE.halfAngle - WAKE.armAngle).toFixed(5)})
    : ${WAKE.centre.toFixed(2)} + ${(1 - WAKE.centre).toFixed(2)} * smoothstep(0.0, 1.0, a / ${WAKE.armAngle.toFixed(5)});
  return arm * exp(-behind / ${WAKE.efold.toFixed(2)}) * wakeStrength(speed);
}`
