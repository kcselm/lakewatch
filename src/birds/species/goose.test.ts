import * as THREE from 'three'
import { SPEC as GOOSE } from './cangoo'
import { SPEC as MALLARD } from './mallar3'
import { built, atlas, within, draftShare } from './swimmer.testkit'
import { crownNow, billAngleNow, billTipNow, tailTipNow } from '../detail/measure'
import { posedFold, passThrough, posedRings } from '../detail/neck.testkit'
import { RINGS } from '../detail/loft'
import type { DetailedBirdModel } from '../detail/build'
import { defaultPose, type PoseState } from '../model'
import { CANADA_GOOSE as S } from '../../behavior/goose'
import { NECK } from '../../behavior/dabbler'

// Bounds from docs/research/2026-09-30-canada-goose.md, section 10 (the published tables and the photos of section 6),
// in mm and degrees. The goose is built at rest afloat, its waterline on y = 0; standing, its feet on y = 0. Each of its
// poses is the goose style's own, from its settings, at its fullest.

type Patch = Partial<Omit<PoseState, 'lean'>> & { leanX?: number }
function pose(model: DetailedBirdModel, patch: Patch): void {
  const { leanX = 0, ...rest } = patch
  const p: PoseState = { ...defaultPose(), ...rest }
  p.lean.set(leanX, 0, 0)
  model.pose(p)
}

/** The goose style's poses, afloat and on its feet, at their fullest. */
const POSES: Record<string, Patch> = {
  rest: {},
  loaf: { neckExtend: NECK.loaf },
  alert: { neckExtend: NECK.alert },
  'head-dip': { leanX: S.headDip.lean, tailTilt: S.headDip.tail, reach: 1, reachDepth: S.headDip.depth, reachAngle: Math.PI / 2, neckExtend: NECK.headDip },
  'tip-up': { leanX: S.tipUp.lean, tailTilt: S.tipUp.tail, paddle: 1, neckExtend: NECK.tipUp },
  standing: { afloat: 0, neckExtend: S.neck.stand },
  walking: { afloat: 0, gait: 1, strideDistance: 0.1, neckExtend: S.neck.walk },
  grazing: { afloat: 0, neckExtend: 0.5, reach: 1, reachAngle: S.graze.reachAngle, leanX: S.graze.lean },
  'looking up': { afloat: 0, neckExtend: 1 },
}

/** The top of the back as posed, mm: the highest skin point from the tail to the neck's base (the rig's `neckBase`). */
function backNow(model: DetailedBirdModel): number {
  const rings = posedRings(model)
  const last = Math.floor(model.profile!.uOf(GOOSE.detail!.rig.neckBase) * (RINGS - 1))
  let top = -Infinity
  for (let i = 0; i <= last; i++) for (const v of rings[i]!) top = Math.max(top, v.y)
  return top * 1000
}

/** The crown above the top of the back, mm, in a pose. */
function crownAboveBack(model: DetailedBirdModel, patch: Patch): number {
  pose(model, patch)
  return crownNow(model) * 1000 - backNow(model)
}

const boneAt = (m: DetailedBirdModel, name: string) => {
  m.group.updateMatrixWorld(true)
  return m.mesh.skeleton.bones.find(b => b.name === name)!.getWorldPosition(new THREE.Vector3())
}
const deg = (rad: number) => (rad * 180) / Math.PI

describe('Canada Goose: structure', () => {
  const G = built(GOOSE), D = built(MALLARD, 'male')
  it('culmen, bill depth, and the bill against the tarsus', () => {
    within(G.M.culmen, 50, 63, 'culmen')
    within(G.M.billDepth, 18, 30, 'bill depth')
    within(G.M.culmen / G.M.tarsus, 0.52, 0.7, 'culmen / tarsus')
  })
  it('tarsus, middle toe, wing chord, tail, and length floating', () => {
    within(G.M.tarsus, 84, 100, 'tarsus')
    within(G.model.layout.toe * 1000, 75, 90, 'middle toe')
    within(G.M.wingChord, 450, 520, 'wing chord')
    within(G.M.tail, 125, 175, 'tail')
    within(G.M.length, 580, 700, 'length')
  })
  it('the eye 70-100 mm from the bill tip', () => {
    const eye = G.model.anatomy.stations.find(s => s.label === 'eye')!.position
    within(eye.distanceTo(G.model.anatomy.billTip) * 1000, 70, 100, 'eye to bill tip')
  })
  it('against the Mallard: a bill a little longer, a bird nearly twice as long', () => {
    within(G.M.culmen / D.M.culmen, 0.95, 1.2, 'culmen')
    within(G.M.length / D.M.length, 1.6, 2, 'length')
  })
  it('floats and stands: amphibious, on webbed feet, with a waddle and a chained neck', () => {
    const d = GOOSE.detail!
    expect(d.amphibious).toBe(true)
    expect(d.feet).toBe('webbed')
    expect(d.waddle).toBe(5)
    expect(d.rig.neck!.length).toBeGreaterThanOrEqual(5)
    expect(d.rig.neck!.length).toBeLessThanOrEqual(6)
  })
})

describe('Canada Goose: floating', () => {
  const G = built(GOOSE)
  it('rides as the photos show: the back, the crown, and the tail tip above the water, and the waterline\'s length', () => {
    within(G.M.waterlineLength, 440, 540, 'waterline length')
    within(G.M.backAbove, 110, 150, 'back above the water')
    within(G.M.crownAbove, 200, 280, 'crown above the water')
    within(G.M.tailTipAbove, 80, 130, 'tail tip above the water')
  })
  it('sits as deep as its weight floats it: the draft, and its share of the body\'s depth', () => {
    within(G.M.draft, 50, 80, 'draft')
    within(draftShare(G.M), 0.25, 0.4, 'draft / body depth')
  })
  it('holds its head as the photos do at rest: the crown above the back, the bill pointing down', () => {
    within(G.M.crownAbove - G.M.backAbove, 80, 190, 'crown above the back')
    pose(G.model, POSES.rest!)
    within(-deg(billAngleNow(G.model)), 10, 30, 'bill below level')
  })
})

describe('Canada Goose: the neck and its poses', () => {
  const { model } = built(GOOSE)
  it('lifts the crown above the back as the photos do: alert on the water, standing relaxed', () => {
    within(crownAboveBack(model, POSES.alert!), 250, 450, 'erect')
    within(crownAboveBack(model, POSES.standing!), 180, 280, 'standing relaxed')
  })
  it('stands 450-560 mm from its feet to its crown', () => {
    pose(model, POSES.standing!)
    within(crownNow(model) * 1000, 450, 560, 'standing height')
  })
  it('grazes with the bill on the grass, about 0.17 m ahead of its toes', () => {
    pose(model, POSES.grazing!)
    const tip = billTipNow(model)
    expect(Math.abs(tip.y)).toBeLessThan(0.005)
    const toes = Math.max(boneAt(model, 'toesR').x, boneAt(model, 'toesL').x) + model.layout.toe
    within((tip.x - toes) * 1000, 100, 250, 'bill ahead of the toes')
  })
  it('tips up 65-90 degrees, the stern and the tail out of the water and the head under', () => {
    within(deg(S.tipUp.lean), 65, 90, 'body from level')
    pose(model, POSES['tip-up']!)
    expect(tailTipNow(model).y).toBeGreaterThan(0.2)
    expect(billTipNow(model).y).toBeLessThan(-0.15)
  })
  it('folds no ring and passes no skin through skin in any of its poses', () => {
    for (const [name, patch] of Object.entries(POSES)) {
      pose(model, patch)
      expect(posedFold(model, 0.3) * 1000, name).toBeLessThan(0.1)
      expect(passThrough(model, 0.3).depth * 1000, name).toBeLessThan(3)
    }
  })
})

describe('Canada Goose: the style fits the bird', () => {
  const { model } = built(GOOSE)
  it('stands on the bed where its float\'s waterline meets the water: the style\'s wading depth is the built bird\'s, to 1 cm', () => {
    pose(model, POSES.standing!)
    // standing, the root has risen by the float's waterline's height above the feet
    expect(Math.abs(boneAt(model, 'root').y - S.wade.stand)).toBeLessThan(0.01)
  })
  it('rings the water where its bill goes in at the bottom of a head-dip, to 5 cm', () => {
    pose(model, POSES['head-dip']!)
    expect(Math.abs(billTipNow(model).x - S.rings.ahead)).toBeLessThan(0.05)
  })
})

describe('Canada Goose: plumage', () => {
  const a = atlas(GOOSE)
  const d = GOOSE.detail!
  it('a black stocking: the head and neck near-black above and behind the cheek, ending in a clean line at the neck\'s base', () => {
    expect(a.stats('skin', [a.u(d.rig.neckBase) + 0.02, a.u('occiput')], [0, 1]).mean).toBeLessThan(0.12)
    expect(a.stats('skin', [a.u('occiput'), a.u('billBase')], [0, 0.3]).mean).toBeLessThan(0.12)
    // within 3 cm along the spine either side of the line, black in front and pale behind, low on the neck
    const cm = 0.03 / (built(GOOSE).model.profile!.length)
    expect(a.stats('skin', [a.u(d.rig.neckBase) + cm / 2, a.u(d.rig.neckBase) + cm], [0.7, 1]).mean).toBeLessThan(0.15)
    expect(a.stats('skin', [a.u(d.rig.neckBase) - cm, a.u(d.rig.neckBase) - cm / 2], [0.7, 1]).mean).toBeGreaterThan(0.45)
  })
  it('a white chinstrap from behind the eye down under the jaw to the throat', () => {
    expect(a.stats('skin', [a.u('occiput'), a.u('eye')], [0.55, 0.85]).mean).toBeGreaterThan(0.8)
    expect(a.stats('skin', [a.u('eye'), a.u('billBase')], [0.88, 1]).mean).toBeGreaterThan(0.75)
  })
  it('a pale breast, at least three times as bright as the neck', () => {
    const neck = a.stats('skin', [a.u(d.rig.neckBase) + 0.02, a.u('occiput') - 0.02], [0, 1]).mean
    const breast = a.stats('skin', [a.u('breast') - 0.02, a.u('breast') + 0.02], [0.6, 1]).mean
    expect(breast).toBeGreaterThanOrEqual(3 * neck)
  })
  it('a white undertail', () => {
    expect(a.stats('skin', [0, a.u('rump')], [0.6, 1]).mean).toBeGreaterThan(0.8)
  })
})
