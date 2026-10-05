import * as THREE from 'three'
import { SPEC as KINGFISHER_SPEC } from './belkin1'
import { billWidthAt, billDepthAt, billAngleNow } from '../detail/measure'
import { eyePlacement } from '../detail/bill'
import { createProfile } from '../detail/profile'
import { worstFold } from '../detail/loft'
import { defaultPose, type PoseState } from '../model'
import { built, atlas, within, hueIn } from './swimmer.testkit'

// Bounds from docs/research/2026-09-30-belted-kingfisher.md, section 10 (Ridgway's caurina, AVONET, and the traced
// photo), in mm, and docs/research/2026-09-30-kingfisher-flight-and-plunge.md, section 2.4, for the spread wing.

const F = built(KINGFISHER_SPEC, 'female')
const detail = KINGFISHER_SPEC.detail!
const profile = createProfile(detail.profile)
const deg = (rad: number) => THREE.MathUtils.radToDeg(rad)
const posed = (patch: Partial<PoseState>) => {
  F.model.pose({ ...defaultPose(), ...patch })
  F.model.group.updateMatrixWorld(true)
  return F.model
}
/** the model's group frame from the profile frame: the bird stands with its feet at the origin */
const offset = F.model.anatomy.foot.clone().sub(F.model.layout.foot).setZ(0)
const eye = eyePlacement(detail, profile).center.clone().add(offset)
/** the highest point of the crest's strands now, metres */
function crestTop(): number {
  const m = F.model, bones = new Set(['crest', 'crestBack'].map(n => m.mesh.skeleton.bones.findIndex(b => b.name === n)))
  const index = m.mesh.geometry.getAttribute('skinIndex'), weight = m.mesh.geometry.getAttribute('skinWeight'), v = new THREE.Vector3()
  let top = -Infinity
  for (let i = 0; i < index.count; i++) {
    let best = 0, w = -1
    for (let k = 0; k < 4; k++) if (weight.getComponent(i, k) > w) { w = weight.getComponent(i, k); best = index.getComponent(i, k) }
    if (bones.has(best)) top = Math.max(top, m.mesh.getVertexPosition(i, v).applyMatrix4(m.mesh.matrixWorld).y)
  }
  return top
}

describe('Belted Kingfisher: structure', () => {
  it('builds both versions, the same bird', () => {
    expect(built(KINGFISHER_SPEC, 'male').M.length).toBeCloseTo(F.M.length, 6)
  })
  it('a long, heavy dagger of a bill: longer than the head, deeper than wide, more than a third of the wing', () => {
    within(F.M.culmen, 53, 66)
    within(F.M.billDepth, 13, 18)
    within(billDepthAt(F.model, 0) / billWidthAt(F.model, 0), 1.2, 1.8)
    within(F.M.culmen / F.M.wingChord, 0.33, 0.42)
    expect(F.M.culmen).toBeGreaterThan(F.M.head)
  })
  it('tiny feet, a short tail, and its length as traced', () => {
    within(F.M.tarsus, 10, 13)
    within(F.M.wingChord, 155, 172)
    within(F.M.tail / F.M.wingChord, 0.52, 0.63)
    within(F.M.length, 300, 345)
  })
  it('its eye 18-32 mm behind where the bill leaves the head, the bill near level at rest', () => {
    within((F.model.anatomy.billBase.x - eye.x) * 1000, 18, 32)
    posed({})
    // billAngleNow is positive below level
    within(deg(billAngleNow(F.model)), 0, 15)
  })
  it('on its perch: the feet on the branch, the breast 30-65 mm ahead of them, the eye about 124 mm above', () => {
    const a = F.model.anatomy
    expect(Math.abs(a.foot.x)).toBeLessThan(1e-9)
    within((a.breastFront.x - a.foot.x) * 1000, 30, 65)
    within(eye.y * 1000, 110, 135)
  })
  it('its crest 14-24 mm over the eye lowered, and 26-36 mm raised', () => {
    posed({})
    within((crestTop() - eye.y) * 1000, 14, 24)
    posed({ crestRaise: 1 })
    within((crestTop() - eye.y) * 1000, 26, 36)
    posed({})
  })
  it('never folds its skin', () => {
    expect(worstFold(profile, detail.rig)).toBe(0)
  })
})

describe('Belted Kingfisher: the spread wing', () => {
  const tipToTip = 2 * F.model.anatomy.flightWing!.tip.z * 1000
  it('spans 0.50-0.56 m, its wrist at 0.34-0.4 of the half-span, the outer five primaries parted', () => {
    within(tipToTip, 500, 560)
    within(detail.flight!.wrist, 0.34, 0.4)
    expect(detail.flight!.fingers!.count).toBe(5)
  })
  it('above: a white patch across the primaries\' bases, 0.64-0.88 of the half-span; the tip and trailing edge dark', () => {
    for (const version of ['female', 'male'] as const) {
      const a = atlas(KINGFISHER_SPEC, version)
      expect(a.colour('wingSpread', [0.68, 0.84], [0.15, 0.55]).lum, version).toBeGreaterThan(0.5)
      expect(a.colour('wingSpread', [0.9, 1], [0.15, 0.9]).lum, version).toBeLessThan(0.2)
      expect(a.colour('wingSpread', [0.1, 0.5], [0.05, 0.35]).lum, version).toBeGreaterThan(a.colour('wingSpread', [0.9, 1], [0.15, 0.9]).lum)
    }
  })
  it("below: the male's coverts white, the female's rufous", () => {
    const m = atlas(KINGFISHER_SPEC, 'male'), f = atlas(KINGFISHER_SPEC, 'female')
    expect(m.colour('wingUnder', [0.05, 0.4], [0.05, 0.3]).lum).toBeGreaterThan(0.8)
    const rufous = f.colour('wingUnder', [0.05, 0.4], [0.05, 0.3])
    expect(hueIn(rufous.hue, 10, 35)).toBe(true)
    expect(rufous.sat).toBeGreaterThan(0.4)
  })
})

describe('Belted Kingfisher: plumage (late September: adults, a female and a male)', () => {
  const f = atlas(KINGFISHER_SPEC, 'female'), m = atlas(KINGFISHER_SPEC, 'male')
  /** s of a skin point: a station's u moved dx mm along the spine */
  const s = (x: typeof f, at: string, dx = 0) => x.u(at) + dx / 1000 / profile.length
  const isRufous = (c: { hue: number; sat: number; lum: number }) => hueIn(c.hue, 10, 35) && c.sat > 0.35 && c.lum > 0.12
  it('both: blue-grey above, the crown darker; white below', () => {
    for (const x of [f, m]) {
      const back = x.colour('skin', [x.u('thigh'), x.u('hip')], [0, 0.2])
      expect(hueIn(back.hue, 190, 230)).toBe(true)
      within(back.lum, 0.25, 0.55)
      expect(x.colour('skin', [x.u('nape'), x.u('eye')], [0, 0.2]).lum).toBeLessThan(back.lum)
      expect(x.colour('skin', [x.u('thigh'), x.u('foreBelly')], [0.9, 1]).lum).toBeGreaterThan(0.75)
    }
  })
  it('both: the white collar meets round the hindneck and is broad at the throat; the white spot before the eye', () => {
    for (const x of [f, m]) {
      expect(x.colour('skin', [s(x, 'hip', -10), s(x, 'hip', -8)], [0, 0.04]).lum).toBeGreaterThan(0.8)
      expect(x.colour('skin', [s(x, 'neckMid', -2), s(x, 'neckMid', 0)], [0.55, 0.6]).lum).toBeGreaterThan(0.8)
      expect(x.colour('skin', [s(x, 'lores', 0.5), s(x, 'lores', 2)], [0.29, 0.33]).lum).toBeGreaterThan(0.7)
      // and the face dark under the eye, down to the gape
      expect(x.colour('skin', [s(x, 'eye', -1), s(x, 'eye', 1)], [0.45, 0.55]).lum).toBeLessThan(0.4)
    }
  })
  it('both: one blue-grey band across the breast, below the collar', () => {
    for (const x of [f, m]) {
      const band = x.colour('skin', [s(x, 'neckBase', -2.5), s(x, 'neckBase', 0)], [0.69, 0.75])
      expect(hueIn(band.hue, 190, 230)).toBe(true)
      expect(band.lum).toBeLessThan(0.55)
    }
  })
  it('male: no rufous anywhere below', () => {
    expect(m.share('skin', [m.u('tailBase'), m.u('neckBase')], [0.5, 1], isRufous)).toBe(0)
  })
  it('female: a rufous band below the blue one with white between, and long rufous flanks', () => {
    expect(isRufous(f.colour('skin', [s(f, 'hip', -5), s(f, 'hip', -4)], [0.79, 0.82]))).toBe(true)
    // the white gap between the bands
    expect(f.colour('skin', [s(f, 'hip', 2), s(f, 'hip', 4)], [0.73, 0.77]).lum).toBeGreaterThan(0.75)
    for (const at of ['belly', 'thigh'] as const) expect(isRufous(f.colour('skin', [s(f, at, -7), s(f, at, -5)], [0.67, 0.7])), at).toBe(true)
  })
})
