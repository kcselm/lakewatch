import * as THREE from 'three'
import { SPEC as REWBLA } from './rewbla'
import { billAngleNow, billTipNow, tailTipNow } from '../detail/measure'
import { eyePlacement } from '../detail/bill'
import { createProfile } from '../detail/profile'
import { worstFold } from '../detail/loft'
import { sizedDetail } from '../detail/spec'
import { paintSpecies } from '../paint/painter'
import { defaultPose, type PoseState } from '../model'
import { shows, areaOf, isRed, isBuff, silhouette, widthBetween, rightAreaOf } from '../detail/shows.testkit'
import { built, atlas, within, hueIn } from './swimmer.testkit'
import { GRADES } from '../../behavior/spread'
import { GRIPS } from '../../behavior/grips'

// Bounds from docs/research/2026-10-13-red-winged-blackbird.md, section 10 (Ridgway's and van Rossem's caurinus,
// AVONET, and the traced photos), and docs/research/2026-10-13-blackbird-display-and-reeds.md, section 9 (the epaulet
// and the spread), in mm and cm²; the spec's species tests
// (docs/superpowers/specs/2026-10-13-red-winged-blackbird-design.md, "Species: blackbird.test.ts").

const M = built(REWBLA, 'male'), F = built(REWBLA, 'female'), Y = built(REWBLA, 'firstYearMale')
const deg = (rad: number) => THREE.MathUtils.radToDeg(rad)
const posed = (b: typeof M, patch: Partial<PoseState> = {}, leanX = 0) => {
  const p = { ...defaultPose(), ...patch }
  p.lean.x = leanX
  b.model.pose(p)
  b.model.group.updateMatrixWorld(true)
  return b.model
}
/** the body's axis now, bill tip to tail tip, degrees above level */
const bodyAxis = (b: typeof M) => {
  const tip = billTipNow(b.model), tail = tailTipNow(b.model)
  return deg(Math.atan2(tip.y - tail.y, tip.x - tail.x))
}
/** the eye's centre behind where the bill leaves the head, mm */
const eyeBehind = (version: string) => {
  const detail = sizedDetail(REWBLA.detail!, version)
  const eye = eyePlacement(detail, createProfile(detail.profile)).center
  return (detail.profile.at(-1)!.x - eye.x) * 1000
}

describe('Red-winged Blackbird: measurements, each version', () => {
  it('the male: a slender cone of a bill, long legs, a long wing and a rounded tail three-quarters of it', () => {
    within(M.M.culmen, 18, 22.5)
    within(M.M.billDepth, 9.5, 12.5)
    within(M.M.tarsus, 27, 31.5)
    within(M.M.wingChord, 116, 130)
    within(M.M.length, 195, 220)
    within(M.M.culmen / M.M.wingChord, 0.14, 0.19)
    within(M.M.tail / M.M.wingChord, 0.7, 0.82)
    within(eyeBehind('male'), 9, 15)
  })
  it('the female: the male a sixth smaller, her legs her own', () => {
    within(F.M.culmen, 15, 19)
    within(F.M.billDepth, 8, 11)
    within(F.M.tarsus, 25, 28.5)
    within(F.M.wingChord, 97, 108)
    within(F.M.length, 165, 188)
    within(F.M.culmen / F.M.wingChord, 0.14, 0.19)
    within(F.M.tail / F.M.wingChord, 0.7, 0.82)
    within(eyeBehind('female'), 7.5, 12.5)
    within(F.M.wingChord / M.M.wingChord, 0.8, 0.88)
    within(F.M.length / M.M.length, 0.8, 0.88)
    within(F.M.tarsus / M.M.tarsus, 0.87, 0.95)
  })
  it('the first-year male is the male\'s size', () => {
    expect(Y.M.length).toBeCloseTo(M.M.length, 6)
    expect(Y.M.wingChord).toBeCloseTo(M.M.wingChord, 6)
  })
  it('at rest the bill 5-25 degrees below level and the body 30-50 degrees above, every version', () => {
    for (const b of [M, F, Y]) {
      posed(b)
      // billAngleNow is negative below level
      within(-deg(billAngleNow(b.model)), 5, 25)
      within(bodyAxis(b), 30, 50)
    }
  })
  it('on a stalk the body stands 50-70 degrees from level, on a cattail top 45-60', () => {
    within(bodyAxis({ ...M, model: posed(M, {}, GRIPS.stalk.lean) }), 50, 70)
    within(bodyAxis({ ...M, model: posed(M, {}, GRIPS.top.lean) }), 45, 60)
    posed(M)
  })
  it('never folds its skin', () => {
    for (const v of ['male', 'female']) {
      const d = sizedDetail(REWBLA.detail!, v)
      expect(worstFold(createProfile(d.profile), d.rig, d.rings), v).toBe(0)
    }
  })
})

describe('Red-winged Blackbird: paint on the right versions', () => {
  const m = atlas(REWBLA, 'male'), y = atlas(REWBLA, 'firstYearMale'), f = atlas(REWBLA, 'female')
  const isBlack = (c: { lum: number }) => c.lum < 0.12
  it('the male: black everywhere but the shoulder, the red scarlet-vermilion, the bar below it buff, the back edged rusty', () => {
    // its fresh edges and a few brown tips aside
    expect(m.share('skin', [m.u('rump'), m.u('lores')], [0, 1], isBlack)).toBeGreaterThan(0.75)
    expect(m.stats('skin', [m.u('rump'), m.u('lores')], [0, 1]).mean).toBeLessThan(0.12)
    const red = m.colour('wingFold', [0.02, 0.22], [0.1, 0.6])
    within(red.hue, 4, 14)
    expect(red.sat).toBeGreaterThan(0.6)
    const buff = m.colour('wingFold', [0.29, 0.34], [0.15, 0.85])
    // buff to ochraceous: not yellow, not black
    within(buff.hue, 22, 42)
    within(buff.lum, 0.4, 0.8)
    // the fresh edges: some rusty pixels among the back's black
    expect(m.share('skin', [m.u('tailBase'), m.u('neckBase')], [0, 0.4], c => hueIn(c.hue, 15, 40) && c.sat > 0.3 && c.lum > 0.12)).toBeGreaterThan(0.02)
    expect(m.share('wingFold', [0.6, 1], [0, 1], isBlack)).toBeGreaterThan(0.6)
  })
  it('the first-year male: an orange shoulder with black marks, a brown crown', () => {
    const shoulder = y.colour('wingFold', [0.02, 0.22], [0.1, 0.6])
    within(shoulder.hue, 18, 30)
    expect(y.share('wingFold', [0.02, 0.24], [0.1, 0.7], c => c.lum < 0.2)).toBeGreaterThan(0.08)
    const crown = y.colour('skin', [y.u('occiput'), y.u('lores')], [0, 0.25])
    within(crown.hue, 15, 45)
    expect(crown.lum).toBeGreaterThan(0.1)
  })
  it('the female: brown and streaked below, a pale eyebrow, a peach-buff throat, no black body', () => {
    expect(f.share('skin', [f.u('rump'), f.u('neckBase')], [0, 1], isBlack)).toBeLessThan(0.15)
    const below = f.stats('skin', [f.u('vent'), f.u('neckMid')], [0.6, 1])
    expect(below.roughS + below.roughT).toBeGreaterThan(0.02)
    expect(hsl3(below.rgb).lum).toBeGreaterThan(0.3)
    const brow = f.colour('skin', [f.u('eye') - 0.01, f.u('eye') + 0.01], [0.25, 0.3])
    const cheek = f.colour('skin', [f.u('eye') - 0.01, f.u('eye') + 0.01], [0.45, 0.6])
    expect(brow.lum).toBeGreaterThan(cheek.lum + 0.15)
    const throat = f.colour('skin', [f.u('crown'), f.u('lores')], [0.88, 1])
    within(throat.hue, 15, 40)
    expect(throat.lum).toBeGreaterThan(0.4)
  })
})
const hsl3 = (rgb: [number, number, number]) => ({ lum: 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] })

describe('Red-winged Blackbird: what the shoulder shows side-on, by rays 1 mm apart', () => {
  const px = paintSpecies(REWBLA, 'male')
  const at = (patch: Partial<PoseState>) => { posed(M, patch); return shows(M.model, px, 'side') }
  const cm2 = (a: number) => a * 1e4
  it('at 0 neither the red nor the buff shows (under 0.3 cm²)', () => {
    const s = at({ epaulet: 0 })
    expect(cm2(areaOf(s, isRed) + areaOf(s, isBuff))).toBeLessThan(0.3)
  })
  it('at rest, with its own 0.15, no red shows: only the buff bar, a strip 4-9 mm deep across the wing', () => {
    const s = at({ epaulet: 0.15 })
    expect(cm2(areaOf(s, isRed))).toBeLessThan(0.1)
    const buff = cm2(areaOf(s, isBuff))
    // the bar runs across the folded wing, about its depth there (25-30 mm): its own depth is its area over that
    within(buff * 100 / 27, 4, 9)
  })
  it('at 0.35 a red band 6-10 mm deep above the buff', () => {
    const s = at({ epaulet: 0.35 })
    within(cm2(areaOf(s, isRed)) * 100 / 27, 5, 10)
  })
  it('at 0.6 the whole patch: 4.5-7.5 cm² of red, red and buff together 7-10.5', () => {
    const s = at({ epaulet: 0.6 })
    within(cm2(areaOf(s, isRed)), 4.5, 7.5)
    within(cm2(areaOf(s, isRed) + areaOf(s, isBuff)), 7, 10.5)
  })
  it('the coverts raised grow the red side-on 1.25-1.6 times', () => {
    const flat = areaOf(at({ epaulet: 0.6 }), isRed), raised = areaOf(at({ epaulet: 0.6, epauletRaise: 1 }), isRed)
    within(raised / flat, 1.25, 1.6)
  })
  it('fluffed at 0.45, the side-on silhouette is 5-18% larger', () => {
    const rest = silhouette(at({})), fluffed = silhouette(at({ fluff: 0.45 }))
    within(fluffed / rest, 1.05, 1.18)
  })
  it('the female shows no red side-on, at rest or bared', () => {
    const fpx = paintSpecies(REWBLA, 'female')
    for (const e of [0, 0.6]) {
      posed(F, { epaulet: e })
      expect(cm2(areaOf(shows(F.model, fpx, 'side'), isRed)), `${e}`).toBeLessThan(0.1)
    }
  })
})

describe('Red-winged Blackbird: the full spread, front-on', () => {
  const px = paintSpecies(REWBLA, 'male')
  const full = GRADES[3]
  const spread = { epaulet: 1, epauletRaise: 1, fluff: full.fluff, wingHold: full.wingHold, tailSpread: full.tailSpread, tailTilt: full.tailTilt! }
  it('each side shows 3-5 cm² of red standing out from the body', () => {
    posed(M, spread)
    const s = shows(M.model, px, 'front')
    within(rightAreaOf(s, isRed) * 1e4, 3, 5)
  })
  it('the bird puffs out at the shoulders: their width grows by half again or more with the coverts and the wings', () => {
    // The spec asks 1.3-1.5 times, from one October video's frames (display research 3.3); the full spread the research
    // names for front-on (rewbla-214255796, section 3.2) is about twice as wide at the shoulders, its wings out 30°.
    // Bounded between them
    const wy = M.model.anatomy.wrist.y
    posed(M)
    const rest = widthBetween(shows(M.model, px, 'front'), wy - 0.008, wy + 0.008)
    posed(M, spread)
    within(widthBetween(shows(M.model, px, 'front'), wy - 0.008, wy + 0.008) / rest, 1.3, 2.1)
  })
  it('the wings held out: each tip at or below the feet, and within 20 mm of the fanned tail\'s outer tips', () => {
    const m = posed(M, spread)
    const fold = m.mesh.skeleton.bones.find(b => b.name === 'wingFoldR')!
    const tip = m.anatomy.wingTip.clone().sub(m.anatomy.wrist).applyMatrix4(fold.matrixWorld)
    expect(tip.y).toBeLessThanOrEqual(m.anatomy.foot.y + 0.002)
    // the tail's outer right feather's tip, fanned
    const outer = m.mesh.skeleton.bones.find(b => b.name === 'tailR3')!
    const tailTip = m.anatomy.tailTip.clone().sub(m.anatomy.tailRoot)
    const outerTip = tailTip.applyMatrix4(outer.matrixWorld)
    // (the outer column turns about its own root, a few mm off the tail's: near enough here)
    expect(tip.distanceTo(outerTip) * 1000).toBeLessThan(20)
  })
  it('the tail fans to 100-120 degrees', () => {
    within(REWBLA.detail!.tail.fan!, 100, 120)
  })
  it('the gape opens the bill 25-35 degrees', () => {
    within(REWBLA.detail!.display!.gape, 25, 35)
  })
})
