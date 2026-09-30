/**
 * How much the water reflects, and how far the ripples shift a reflection (research 2026-09-30-lake-water.md section
 * 6). The shader uses Schlick's approximation with water's F0 of 0.02 and power 5, within 0.06 of the exact Fresnel
 * curve at every angle, capped at 0.85: on rippled water at grazing angles the facets tilted away are hidden, so the
 * far water reflects less than a flat mirror would.
 */
export const REFLECT = { f0: 0.02, power: 5, cap: 0.85, clampUV: 0.15, fadeFromUV: 0.1 } as const

const N = 1.333

/** the exact unpolarised Fresnel reflectance of water seen `grazing` radians above its surface */
export function fresnelExact(grazing: number): number {
  const ci = Math.sin(grazing)                       // cosine of the angle from the normal
  const st = Math.cos(grazing) / N
  const ct = Math.sqrt(1 - st * st)
  const rs = (ci - N * ct) / (ci + N * ct)
  const rp = (ct - N * ci) / (ct + N * ci)
  return (rs * rs + rp * rp) / 2
}

/** Schlick's approximation at `grazing` radians, uncapped */
export function fresnelSchlick(grazing: number): number {
  return REFLECT.f0 + (1 - REFLECT.f0) * Math.pow(1 - Math.sin(grazing), REFLECT.power)
}

/**
 * How far in the mirrored target's UV a ripple's tilt shifts what it reflects: a slope `along` the line of sight tilts
 * the reflected ray's elevation by twice the slope, and one `across` turns it by only 2 s sin(grazing), so reflections
 * smear into vertical columns. `vfov` and `hfov` are the view's in radians. Clamped to REFLECT.clampUV.
 */
export function reflectionOffset(along: number, across: number, grazing: number, vfov: number, hfov: number): [number, number] {
  const c = (v: number) => Math.min(REFLECT.clampUV, Math.max(-REFLECT.clampUV, v))
  return [c(2 * across * Math.sin(grazing) / hfov), c(2 * along / vfov)]
}

/** Schlick's approximation in GLSL, from the cosine of the angle from the normal, capped */
export const FRESNEL_GLSL = /* glsl */ `
float fresnel(float cosTheta) {
  return min(${REFLECT.cap.toFixed(2)}, ${REFLECT.f0.toFixed(2)} + ${(1 - REFLECT.f0).toFixed(2)} * pow(1.0 - clamp(cosTheta, 0.0, 1.0), ${REFLECT.power.toFixed(1)}));
}`
