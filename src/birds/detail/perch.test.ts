import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { loadAuthoredForTest, TEST_BIRD_GLB } from './authored.testkit'
import { TEST_AUTHORED_SPEC, TEST_GOOSE_SPEC, TEST_SWIM_SPEC, TEST_SWIM_DETAIL } from './fixture'
import { tailTipNow } from './measure'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'

const posed = (over: Partial<PoseState> = {}): PoseState => ({ ...defaultPose(), ...over })
const at = (m: DetailedBirdModel, name: string) => {
  m.group.updateMatrixWorld(true)
  return m.mesh.skeleton.bones.find(b => b.name === name)!.getWorldPosition(new THREE.Vector3())
}
/** a perched bird: on its feet, its body raised 40 degrees */
const PERCHED = { afloat: 0, lean: new THREE.Vector3(-0.7, 0, 0) }

beforeAll(() => loadAuthoredForTest(TEST_AUTHORED_SPEC, TEST_BIRD_GLB))

describe('drying the wings (PoseState.dry)', () => {
  it('holds the flight wings out: the wrists raised above the shoulders, the hands hanging below the wrists', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    m.pose(posed({ ...PERCHED, dry: 1 }))
    const tip = m.anatomy.flightWing!.tip.clone().sub(m.anatomy.flightWing!.wrist)
    const hand = m.mesh.skeleton.bones.find(b => b.name === 'handR')!
    const tipNow = tip.applyMatrix4(hand.matrixWorld)
    for (const side of ['L', 'R']) expect(at(m, `hand${side}`).y).toBeGreaterThan(at(m, `wing${side}`).y)
    expect(tipNow.y).toBeLessThan(at(m, 'handR').y)
    // the right wing on +z, the left mirroring it
    expect(at(m, 'handR').z).toBeCloseTo(-at(m, 'handL').z, 6)
    expect(at(m, 'handR').y).toBeCloseTo(at(m, 'handL').y, 6)
    // swept back from straight out
    expect(at(m, 'handR').x).toBeLessThan(at(m, 'wingR').x)
  })
  it('shows the spread wing and hides the folded one while drying, and folds again at 0', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    const bone = (n: string) => m.mesh.skeleton.bones.find(b => b.name === n)!
    m.pose(posed({ dry: 1 }))
    expect(bone('wingFoldR').scale.x).toBeLessThan(0.01)
    expect(bone('wingR').scale.x).toBe(1)
    m.pose(posed({ dry: 0 }))
    expect(bone('wingFoldR').scale.x).toBe(1)
    expect(bone('wingR').scale.x).toBeLessThan(0.01)
  })
  it('flaps slowly while drying: a beat at a small spread moves the held wing', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    m.pose(posed({ dry: 1, wingSpread: 0.2, wingPhase: 0.25 }))
    const up = at(m, 'handR').y
    m.pose(posed({ dry: 1, wingSpread: 0.2, wingPhase: 0.75 }))
    expect(up - at(m, 'handR').y).toBeGreaterThan(0.01)
  })
  it('is ignored by a bird whose flight wing has no drying pose', () => {
    const flight = {
      span: 0.4, outline: [[0, 0.05, -0.09], [0.45, 0.06, -0.08], [1, -0.02, -0.04]] as [number, number, number][], wrist: 0.45,
      beat: { shoulder: 35, lift: 5, hand: 25, lag: 0.15 }, glide: { shoulder: 4, hand: -8 },
    }
    const m = buildDetailedBird(parseSpeciesSpec({ ...TEST_SWIM_SPEC, detail: { ...TEST_SWIM_DETAIL, flight } }))
    m.pose(posed({ dry: 1 }))
    expect(m.mesh.skeleton.bones.find(b => b.name === 'wingFoldR')!.scale.x).toBe(1)
  })
})

describe('propping the tail (PoseState.tailProp)', () => {
  it('rests a raised body\'s tail tip on the perch under the feet', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed({ ...PERCHED }))
    const free = tailTipNow(m).y
    m.pose(posed({ ...PERCHED, tailProp: 1 }))
    expect(tailTipNow(m).y).toBeCloseTo(0, 4)
    expect(free).not.toBeCloseTo(0, 2)
    // the tip stays behind the hips: the tail turns down, not round
    expect(tailTipNow(m).x).toBeLessThan(at(m, 'tibiaR').x)
  })
  it('turns part of the way at part of a prop, and not at all at 0', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const tail = () => m.mesh.skeleton.bones.find(b => b.name === 'tail')!.rotation.z
    m.pose(posed({ ...PERCHED }))
    const none = tail()
    m.pose(posed({ ...PERCHED, tailProp: 1 }))
    const full = tail()
    m.pose(posed({ ...PERCHED, tailProp: 0.5 }))
    expect(tail()).toBeCloseTo((none + full) / 2, 9)
    m.pose(posed({ ...PERCHED, tailProp: 0 }))
    expect(tail()).toBe(none)
  })
  it('points a tail too short to reach the perch straight down (the authored test bird\'s, 7 cm from 8 cm up)', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    m.pose(posed({ ...PERCHED, tailProp: 1 }))
    const root = at(m, 'tail'), tip = tailTipNow(m)
    expect(tip.x).toBeCloseTo(root.x, 6)
    expect(tip.y).toBeGreaterThan(0)
    expect(root.y - tip.y).toBeCloseTo(m.anatomy.tailTip.distanceTo(m.anatomy.tailRoot), 4)
  })
  it('keeps the feet planted on the perch as the body rises', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed({ afloat: 0 }))
    const toes = at(m, 'toesR')
    m.pose(posed({ ...PERCHED, tailProp: 1 }))
    expect(at(m, 'toesR').distanceTo(toes)).toBeLessThan(1e-9)
  })
})
