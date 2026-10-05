import * as THREE from 'three'
import { SPEC as PELICAN_SPEC } from './amwpel'
import { billWidthAt, billDepthAt, billAngleNow, billTipNow, crownNow } from '../detail/measure'
import { flightEdges, chordStrips } from '../detail/wing'
import { worstFold } from '../detail/loft'
import { posedFold } from '../detail/neck.testkit'
import { defaultPose, type PoseState } from '../model'
import { PELICAN, NECK } from '../../behavior/pelican'
import { PELICAN_FLIGHT } from '../../behavior/flyover'
import { built, atlas, within, draftShare, hueIn } from './swimmer.testkit'

// Bounds from docs/research/2026-09-30-american-white-pelican.md, section 10 (Baird, Brewer & Ridgway, AVONET, the
// sexed means, and the traced photo), in mm. Both versions are late-September birds: no horn, no crest.

const A = built(PELICAN_SPEC, 'adult')
const detail = PELICAN_SPEC.detail!
const deg = (rad: number) => THREE.MathUtils.radToDeg(rad)
const posed = (patch: Partial<PoseState>, leanX = 0) => {
  const st = { ...defaultPose(), ...patch }
  st.lean = new THREE.Vector3(leanX, 0, 0)
  A.model.pose(st)
  A.model.group.updateMatrixWorld(true)
  return A.model
}
/** the lowest the pouch hangs below the bill's axis now, mm */
const pouchHang = () => {
  const a = A.model.anatomy, v = new THREE.Vector3()
  let low = 0
  for (let i = a.pouch!.first; i < a.pouch!.first + a.pouch!.count; i++) low = Math.max(low, -A.model.mesh.getVertexPosition(i, v).sub(a.billBase).dot(a.billUp))
  return low * 1000
}

describe('American White Pelican: structure', () => {
  it('builds both versions, the same bird', () => {
    expect(built(PELICAN_SPEC, 'juvenile').M.length).toBeCloseTo(A.M.length, 6)
  })
  it('an enormous flat bill: a foot long, as wide as deep at the base, thin beyond, straight to a hooked nail', () => {
    within(A.M.culmen, 285, 345)
    within(A.M.billDepth, 34, 44)
    within(billWidthAt(A.model, 0) * 1000, 35, 45)
    within(billWidthAt(A.model, 0) / billDepthAt(A.model, 0), 0.85, 1.2)
    within(billDepthAt(A.model, 0.67) * 1000, 15, 25)
    // the nail hooks down 3-9 mm; but for it the bill is straight
    within(-A.M.billTipRise, 3, 9)
    within(A.M.culmen / A.M.tarsus, 2.3, 3.0)
  })
  it('a pouch under it: bill and pouch 60-90 mm deep at the base, slack, tapering to nothing at the tip; a deep bag when full', () => {
    posed({})
    const slack = pouchHang()
    // from the bill's top edge, half its depth above the axis, to the pouch's lowest
    within(slack + A.M.billDepth / 2, 60, 105)
    posed({ pouch: 1 })
    expect(pouchHang()).toBeGreaterThan(slack + 20)
    posed({})
    const at = (s: number) => detail.bill.pouch!.find(p => p[0] >= s)!
    expect(at(0.9)[1]).toBeLessThan(0.01)
  })
  it('tarsus, toe, wing chord, tail, the eye, and its length on the water', () => {
    within(A.M.tarsus, 105, 132)
    within(detail.measurements.toe * 1000, 92, 110)
    within(A.M.wingChord, 525, 640)
    within(A.M.tail, 130, 175)
    within(detail.eye.radius * 1000, 4.5, 6.5)
    within(A.M.length, 800, 1050)
    // breast front to tail tip, over the culmen
    within((A.M.waterlineLength + 85) / A.M.culmen, 1.8, 2.3)
  })
  it('floats high: the back highest at mid-body, the crown a foot up, the tail just clear, under a third of it under water', () => {
    within(A.M.backAbove, 120, 180)
    within(A.M.crownAbove, 260, 320)
    within(A.M.tailTipAbove, 10, 60)
    within(draftShare(A.M), 0.22, 0.38)
    // highest in the middle, not at the stern: the stations' tops fall away both ways from the hip and flank
    const top = (label: string) => { const s = detail.profile.find(p => p.label === label)!; return s.y + s.up }
    expect(Math.max(top('hip'), top('flank'))).toBeGreaterThan(top('tailBase'))
    expect(Math.max(top('hip'), top('flank'))).toBeGreaterThan(top('breast'))
  })
  it('carries its bill slanting down in front of the neck, the tip just over the water', () => {
    posed({})
    within(-deg(billAngleNow(A.model)), 30, 60)
    within(billTipNow(A.model).y * 1000, 0, 80)
  })
  it('never folds its skin, traced or posed', () => {
    expect(worstFold(A.model.profile!, detail.rig)).toBe(0)
    for (const e of [0, 0.25, 0.5, 0.75, 1]) expect(posedFold(posed({ neckExtend: e })), `neck ${e}`).toBeLessThan(0.001)
    posed({})
  })
})

describe('American White Pelican: the neck', () => {
  it('erect, the crown stands 300-360 mm above the water', () => {
    within(crownNow(posed({ neckExtend: NECK.alert })) * 1000, 300, 360)
  })
  it('sunk, the head rides on the shoulders, well below where the S carries it', () => {
    const s = crownNow(posed({ neckExtend: NECK.loaf })), sunk = crownNow(posed({ neckExtend: NECK.sunk }))
    expect(s - sunk).toBeGreaterThan(0.05)
  })
  it('at the bottom of a dip the bill points 20-70 degrees down and the head is under to the eye', () => {
    const m = posed({ reach: 1, reachDepth: PELICAN.dip.depth, reachAngle: PELICAN.dip.angle, neckExtend: NECK.feed }, PELICAN.dip.lean)
    within(-deg(billAngleNow(m)), 20, 70)
    expect(billTipNow(m).y).toBeCloseTo(-PELICAN.dip.depth, 2)
    // the eye's station on the spine, where the head carries it
    const head = m.mesh.skeleton.bones.find(b => b.name === 'head')!
    const eye = m.anatomy.stations.find(s => s.label === 'eye')!.position.clone().sub(m.anatomy.stations.find(s => s.label === 'occiput')!.position)
    const now = eye.applyMatrix4(new THREE.Matrix4().extractRotation(head.matrixWorld)).add(head.getWorldPosition(new THREE.Vector3()))
    expect(now.y).toBeLessThan(0.02)
  })
  it('swallowing, the bill tips 15-50 degrees above level', () => {
    within(deg(billAngleNow(posed({ neckExtend: NECK.swallow, headPitch: PELICAN.dip.pitch }))), 15, 50)
  })
  it('in flight the head is on the shoulders and the bill points a little down along the line of flight', () => {
    const m = posed({ neckExtend: PELICAN_FLIGHT.neck, wingSpread: 1, glide: 1 })
    within(-deg(billAngleNow(m)), 10, 40)
    expect(crownNow(m)).toBeLessThan(A.M.crownAbove / 1000 - 0.04)
    posed({})
  })
})

describe('American White Pelican: the spread wing', () => {
  const F = detail.flight!
  const tipToTip = 2 * A.model.anatomy.flightWing!.tip.z * 1000
  // the wing's area: both wings, and the body's width between them at the root's chord
  const N = 400
  let half = 0
  for (let k = 0; k < N; k++) { const e = flightEdges(F, (k + 0.5) / N); half += (e.lead - e.trail) * (F.span / N) }
  const root = flightEdges(F, 0), between = (tipToTip / 1000 - 2 * F.span) * (root.lead - root.trail)
  const area = 2 * half + between

  it('spans 2.44-2.9 m, nine feet, with an aspect ratio of 7-9', () => {
    within(tipToTip, 2440, 2900)
    within((tipToTip / 1000) ** 2 / area, 7, 9)
  })
  it('is half as long as it is wide, bill tip to tail tip, in flight', () => {
    const m = posed({ neckExtend: PELICAN_FLIGHT.neck, wingSpread: 1, glide: 1 })
    const length = billTipNow(m).x - m.anatomy.tailTip.x
    within(length / (tipToTip / 1000), 0.3, 0.58)
    posed({})
  })
  it('has fingered tips, and bends at a wrist near the middle', () => {
    expect(chordStrips(F, 1)).toHaveLength(6)
    within(F.wrist, 0.4, 0.6)
  })
  for (const version of ['adult', 'juvenile'] as const) {
    it(`${version}: below, black along the whole trailing edge and at the tip, white coverts, a quarter to under half of it black`, () => {
      const a = atlas(PELICAN_SPEC, version)
      const black = (c: { lum: number }) => c.lum < 0.2
      // by area: the atlas gives the narrow outer wing as many texels as the broad inner, so each strip of the span
      // counts by its chord
      let dark = 0, all = 0
      for (let k = 0; k < 20; k++) {
        const e = flightEdges(F, (k + 0.5) / 20), chord = e.lead - e.trail
        dark += chord * a.share('wingUnder', [k / 20, (k + 1) / 20], [0, 1], black)
        all += chord
      }
      within(dark / all, 0.25, 0.45)
      // the black reaches inward along the trailing edge almost to the body
      expect(a.share('wingUnder', [0.15, 0.3], [0.75, 0.95], black)).toBeGreaterThan(0.9)
      // the outer fifth black across the chord behind the coverts
      expect(a.share('wingUnder', [0.86, 0.98], [0.3, 0.95], black)).toBeGreaterThan(0.9)
      // the inner wing's coverts white
      expect(a.colour('wingUnder', [0.1, 0.5], [0.05, 0.4]).lum).toBeGreaterThan(0.75)
      // and above the same, the primary coverts black too
      expect(a.share('wingSpread', [0.6, 0.95], [0.4, 0.95], black)).toBeGreaterThan(0.9)
      expect(a.colour('wingSpread', [0.1, 0.45], [0.42, 0.55]).lum).toBeGreaterThan(0.6)
    })
  }
})

describe('American White Pelican: plumage (late September: no horn, no crest, no yellow breast)', () => {
  const a = atlas(PELICAN_SPEC, 'adult'), j = atlas(PELICAN_SPEC, 'juvenile')
  it('adult: a white bird', () => {
    const body = a.colour('skin', [a.u('tailBase'), a.u('breast')], [0.05, 0.6])
    expect(body.lum).toBeGreaterThan(0.85)
    expect(body.sat).toBeLessThan(0.35)
    const breast = a.colour('skin', [a.u('breast'), a.u('neckBase')], [0.6, 0.95])
    expect(breast.lum).toBeGreaterThan(0.75)
    expect(a.colour('skin', [a.u('nape'), a.u('crown')], [0, 0.3]).lum).toBeGreaterThan(0.85)
  })
  it('adult: the bill pink to orange, the pouch yellow-orange and deepest at its base, the feet orange', () => {
    const bill = a.colour('bill', [0.1, 0.8], [0.25, 0.55]), pouch = a.colour('pouch', [0.1, 0.9], [0.1, 0.9]), feet = a.colour('legs', [0, 1], [0, 1])
    expect(hueIn(bill.hue, 5, 30)).toBe(true)
    expect(hueIn(pouch.hue, 20, 50)).toBe(true)
    expect(pouch.sat).toBeGreaterThan(0.6)
    // deeper, more orange, at its base
    expect(a.colour('pouch', [0, 0.2], [0.1, 0.9]).hue).toBeLessThan(a.colour('pouch', [0.7, 0.9], [0.1, 0.9]).hue)
    expect(hueIn(feet.hue, 10, 35)).toBe(true)
    expect(feet.sat).toBeGreaterThan(0.6)
  })
  it('on the folded wing the black is under a tenth of the side: a line at the water, and tips at the stern', () => {
    const black = (c: { lum: number }) => c.lum < 0.2
    // the wing's band is about a third of the side's height above the water
    expect(a.share('wingFold', [0, 1], [0, 1], black) / 3).toBeLessThan(0.1)
    expect(a.share('wingFold', [0.5, 0.85], [0.92, 1], black)).toBeGreaterThan(0.8)
    expect(a.share('wingFold', [0, 0.4], [0, 1], black)).toBe(0)
  })
  it('juvenile: the coverts scaled grey-brown, darker than the adult\'s; the crown and hindneck washed grey; the bill paler', () => {
    const coverts = (x: typeof a) => x.stats('skin', [x.u('hip'), x.u('breast')], [0.15, 0.4])
    expect(coverts(j).mean).toBeLessThan(coverts(a).mean - 0.08)
    expect(coverts(j).std).toBeGreaterThan(coverts(a).std + 0.03)
    const nape = (x: typeof a) => x.colour('skin', [x.u('neckUp'), x.u('crown')], [0, 0.2])
    expect(nape(j).lum).toBeLessThan(nape(a).lum - 0.08)
    const bill = (x: typeof a) => x.colour('bill', [0.1, 0.8], [0.25, 0.55])
    expect(bill(j).sat).toBeLessThan(bill(a).sat)
    // still a white bird below and behind
    expect(j.colour('skin', [j.u('rump'), j.u('tailBase')], [0.1, 0.5]).lum).toBeGreaterThan(0.8)
  })
})
