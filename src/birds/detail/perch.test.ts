import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { measure, tailTipNow } from './measure'
import { createProfile } from './profile'
import { worstFold } from './loft'
import { loadAuthoredForTest, TEST_BIRD_GLB } from './authored.testkit'
import {
  TEST_PERCHER_SPEC, TEST_PERCHER_DETAIL, TEST_SPEC, TEST_AUTHORED_SPEC, TEST_GOOSE_SPEC, TEST_SWIM_SPEC, TEST_SWIM_DETAIL,
} from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'

const R = TEST_PERCHER_DETAIL.perch!.radius
const M = TEST_PERCHER_DETAIL.measurements
const LEGS = ['legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR']

const bone = (m: DetailedBirdModel, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!
const boneAt = (m: DetailedBirdModel, name: string) => { m.group.updateMatrixWorld(true); return bone(m, name).getWorldPosition(new THREE.Vector3()) }
const posed = (patch: Partial<Omit<PoseState, 'lean'>>, leanX = 0): PoseState => {
  const p = { ...defaultPose(), ...patch }
  p.lean.x = leanX
  return p
}

/** the pose with `over` laid on the default's, lean and all */
const posedAs = (over: Partial<PoseState> = {}): PoseState => ({ ...defaultPose(), ...over })

/** Every vertex whose heaviest bone is one of `names`, where the model's last pose() put it, group space. */
function skinned(m: DetailedBirdModel, names: string[]): THREE.Vector3[] {
  m.group.updateMatrixWorld(true)
  const want = new Set(names.map(n => m.mesh.skeleton.bones.indexOf(bone(m, n))))
  const index = m.mesh.geometry.getAttribute('skinIndex') as THREE.BufferAttribute
  const weight = m.mesh.geometry.getAttribute('skinWeight') as THREE.BufferAttribute
  const out: THREE.Vector3[] = []
  for (let i = 0; i < index.count; i++) {
    let best = 0, bw = -1
    for (let k = 0; k < 4; k++) { const w = weight.getComponent(i, k); if (w > bw) { bw = w; best = index.getComponent(i, k) } }
    if (want.has(best)) out.push(m.mesh.getVertexPosition(i, new THREE.Vector3()))
  }
  return out
}

/** how far a point lies from the branch's axis: the branch runs across the bird (along z), its top on the origin */
const fromAxis = (p: THREE.Vector3) => Math.hypot(p.x, p.y + R)

describe('the test percher', () => {
  it('lofts without a crease', () => {
    expect(worstFold(createProfile(TEST_PERCHER_DETAIL.profile), TEST_PERCHER_DETAIL.rig)).toBe(0)
  })
  it("is about a kingfisher's size, perched as the research's photo has it (belted-kingfisher.md, sections 6 and 10)", () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const r = measure(m)
    expect(r.length).toBeGreaterThan(0.3)
    expect(r.length).toBeLessThan(0.345)
    // the breast 30-65 mm ahead of the feet (photo 48); the body's weight over them
    expect(m.anatomy.breastFront.x - m.anatomy.foot.x).toBeGreaterThan(0.03)
    expect(m.anatomy.breastFront.x - m.anatomy.foot.x).toBeLessThan(0.065)
  })
})

describe('a perched detailed bird in the schema', () => {
  it('is legal with its perch: the branch its toes curl round', () => {
    expect(TEST_PERCHER_SPEC.posture).toBe('perched')
    expect(TEST_PERCHER_SPEC.detail!.perch!.radius).toBe(0.0175)
  })
  it('needs detail.perch, has it only when perched, and has plain toes', () => {
    const { perch: _drop, ...noPerch } = TEST_PERCHER_DETAIL
    expect(() => parseSpeciesSpec({ ...TEST_PERCHER_SPEC, detail: noPerch })).toThrow(/testpercher.*detail\.perch/)
    expect(() => parseSpeciesSpec({ ...TEST_SPEC, detail: { ...TEST_SPEC.detail!, perch: { radius: R } } })).toThrow(/testbird.*perch/)
    expect(() => parseSpeciesSpec({ ...TEST_PERCHER_SPEC, detail: { ...TEST_PERCHER_DETAIL, feet: 'webbed' } })).toThrow(/testpercher.*feet/)
  })
})

describe('buildDetailedBird, perched', () => {
  it('sets its feet on the perch point: the foot joints over the origin, just above the branch top at y = 0', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    for (const side of ['R', 'L']) {
      const foot = boneAt(m, `toes${side}`)
      expect(Math.abs(foot.x), side).toBeLessThan(1e-9)
      expect(foot.y, side).toBeGreaterThan(0)
      expect(foot.y, side).toBeLessThan(0.001)
    }
    // the legs keep their lengths
    expect(boneAt(m, 'tarsusR').distanceTo(boneAt(m, 'toesR'))).toBeCloseTo(M.tarsus, 9)
    expect(boneAt(m, 'tibiaR').distanceTo(boneAt(m, 'tarsusR'))).toBeCloseTo(m.layout.tibia, 9)
  })
  it('crouches on the branch: little more than the toes shows below the belly, and the intertarsal joint stays above the foot', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    // the research: "in the perched bird only the toes show, curled round the perch, and sometimes a few mm of tarsus"
    // (the belly under the hips: the body's lowest point is its rear, angled down behind the branch)
    expect(m.anatomy.bellyY).toBeGreaterThan(0.003)
    expect(m.anatomy.bellyY).toBeLessThan(0.012)
    expect(m.anatomy.knee.y).toBeGreaterThanOrEqual(m.anatomy.foot.y - 1e-9)
  })
  it('curls its toes round the branch: every toe on its surface and none inside it, the front toes wrapping down over its top', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const toes = skinned(m, ['toesR', 'toesL'])
    expect(toes.length).toBeGreaterThan(100)
    const r = m.layout.tarsusRadius
    for (const p of toes) {
      expect(fromAxis(p)).toBeGreaterThan(R - 1e-6)
      expect(fromAxis(p)).toBeLessThan(R + 2.5 * r)
    }
    // the middle toe, 15.8 mm long, wraps about 50° round a branch of 17.5 mm radius: its tip well down the front
    const front = toes.filter(p => p.x > 0)
    const tip = front.reduce((a, b) => (b.y < a.y ? b : a))
    const angle = Math.atan2(tip.x, tip.y + R)
    expect(angle).toBeGreaterThan(0.75 * (M.toe / R))
    expect(angle).toBeLessThan(1.1 * (M.toe / R))
    // and the hind toe, a quarter of the middle toe's length, wraps back and down behind the branch's top: its tip
    // behind the centre line, below the top, and round the branch by its length over the radius (a toe laid straight
    // back along the top would be about 0.2 rad short of that at its tip and off the surface)
    const hind = toes.reduce((a, b) => (b.x < a.x ? b : a))
    expect(hind.x).toBeLessThan(-0.2 * M.toe)
    expect(hind.y).toBeLessThan(0)
    expect(Math.atan2(hind.x, hind.y + R)).toBeLessThan(-0.8 * (0.25 * M.toe) / R)
    expect(Math.atan2(hind.x, hind.y + R)).toBeGreaterThan(-1.2 * (0.25 * M.toe) / R)
  })
  for (const [name, leanX] of [['forward', 0.5], ['back', -0.3], ['far forward, to plunge', 1.2]] as const) {
    it(`pivots its lean over its feet, leaning ${name}: the toes stay on the branch and the body turns about the feet`, () => {
      const m = buildDetailedBird(TEST_PERCHER_SPEC)
      m.pose(defaultPose())
      const toes = skinned(m, ['toesR', 'toesL']), body = skinned(m, ['body']), hip = boneAt(m, 'tibiaR')
      const pivot = boneAt(m, 'body')
      m.pose(posed({}, leanX))
      skinned(m, ['toesR', 'toesL']).forEach((p, i) => expect(p.distanceTo(toes[i]!)).toBeLessThan(1e-9))
      const turned = skinned(m, ['body'])
      expect(body.length).toBeGreaterThan(500)
      // turned rigidly about the pivot, which sits between the feet
      body.forEach((p, i) => expect(turned[i]!.distanceTo(pivot)).toBeCloseTo(p.distanceTo(pivot), 9))
      expect(pivot.distanceTo(boneAt(m, 'toesR').setZ(0))).toBeLessThan(1e-9)
      // and the legs went with it: the hip is still where the body carries it
      const carried = hip.clone().sub(pivot).applyAxisAngle(new THREE.Vector3(0, 0, 1), -leanX).add(pivot)
      expect(boneAt(m, 'tibiaR').distanceTo(carried)).toBeLessThan(1e-9)
      expect(boneAt(m, 'body').distanceTo(pivot)).toBeLessThan(1e-12)
    })
  }
  it('lets nothing walk it off the branch: a stride leaves the legs where they were', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    m.pose(defaultPose())
    const legs = skinned(m, LEGS)
    m.pose(posed({ gait: 1, strideDistance: 0.07 }))
    skinned(m, LEGS).forEach((p, i) => expect(p.distanceTo(legs[i]!)).toBeLessThan(1e-12))
  })
})

/** a perched bird: on its feet, its body raised 40 degrees */
const PERCHED = { afloat: 0, lean: new THREE.Vector3(-0.7, 0, 0) }

beforeAll(() => loadAuthoredForTest(TEST_AUTHORED_SPEC, TEST_BIRD_GLB))

describe('drying the wings (PoseState.dry)', () => {
  it('holds the flight wings out: the wrists raised above the shoulders, the hands hanging below the wrists', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    m.pose(posedAs({ ...PERCHED, dry: 1 }))
    const tip = m.anatomy.flightWing!.tip.clone().sub(m.anatomy.flightWing!.wrist)
    const hand = m.mesh.skeleton.bones.find(b => b.name === 'handR')!
    const tipNow = tip.applyMatrix4(hand.matrixWorld)
    for (const side of ['L', 'R']) expect(boneAt(m, `hand${side}`).y).toBeGreaterThan(boneAt(m, `wing${side}`).y)
    expect(tipNow.y).toBeLessThan(boneAt(m, 'handR').y)
    // the right wing on +z, the left mirroring it
    expect(boneAt(m, 'handR').z).toBeCloseTo(-boneAt(m, 'handL').z, 6)
    expect(boneAt(m, 'handR').y).toBeCloseTo(boneAt(m, 'handL').y, 6)
    // swept back from straight out
    expect(boneAt(m, 'handR').x).toBeLessThan(boneAt(m, 'wingR').x)
  })
  it('shows the spread wing and hides the folded one while drying, and folds again at 0', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    const bone = (n: string) => m.mesh.skeleton.bones.find(b => b.name === n)!
    m.pose(posedAs({ dry: 1 }))
    expect(bone('wingFoldR').scale.x).toBeLessThan(0.01)
    expect(bone('wingR').scale.x).toBe(1)
    m.pose(posedAs({ dry: 0 }))
    expect(bone('wingFoldR').scale.x).toBe(1)
    expect(bone('wingR').scale.x).toBeLessThan(0.01)
  })
  it('flaps slowly while drying: a beat at a small spread moves the held wing', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    m.pose(posedAs({ dry: 1, wingSpread: 0.2, wingPhase: 0.25 }))
    const up = boneAt(m, 'handR').y
    m.pose(posedAs({ dry: 1, wingSpread: 0.2, wingPhase: 0.75 }))
    expect(up - boneAt(m, 'handR').y).toBeGreaterThan(0.01)
  })
  it('is ignored by a bird whose flight wing has no drying pose', () => {
    const flight = {
      span: 0.4, outline: [[0, 0.05, -0.09], [0.45, 0.06, -0.08], [1, -0.02, -0.04]] as [number, number, number][], wrist: 0.45,
      beat: { shoulder: 35, lift: 5, hand: 25, lag: 0.15 }, glide: { shoulder: 4, hand: -8 },
    }
    const m = buildDetailedBird(parseSpeciesSpec({ ...TEST_SWIM_SPEC, detail: { ...TEST_SWIM_DETAIL, flight } }))
    m.pose(posedAs({ dry: 1 }))
    expect(m.mesh.skeleton.bones.find(b => b.name === 'wingFoldR')!.scale.x).toBe(1)
  })
})

describe('propping the tail (PoseState.tailProp)', () => {
  it('rests a raised body\'s tail tip on the perch under the feet', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posedAs({ ...PERCHED }))
    const free = tailTipNow(m).y
    m.pose(posedAs({ ...PERCHED, tailProp: 1 }))
    expect(tailTipNow(m).y).toBeCloseTo(0, 4)
    expect(free).not.toBeCloseTo(0, 2)
    // the tip stays behind the hips: the tail turns down, not round
    expect(tailTipNow(m).x).toBeLessThan(boneAt(m, 'tibiaR').x)
  })
  it('turns part of the way at part of a prop, and not at all at 0', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const tail = () => m.mesh.skeleton.bones.find(b => b.name === 'tail')!.rotation.z
    m.pose(posedAs({ ...PERCHED }))
    const none = tail()
    m.pose(posedAs({ ...PERCHED, tailProp: 1 }))
    const full = tail()
    m.pose(posedAs({ ...PERCHED, tailProp: 0.5 }))
    expect(tail()).toBeCloseTo((none + full) / 2, 9)
    m.pose(posedAs({ ...PERCHED, tailProp: 0 }))
    expect(tail()).toBe(none)
  })
  it('points a tail too short to reach the perch straight down (the authored test bird\'s, 7 cm from 8 cm up)', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    m.pose(posedAs({ ...PERCHED, tailProp: 1 }))
    const root = boneAt(m, 'tail'), tip = tailTipNow(m)
    expect(tip.x).toBeCloseTo(root.x, 6)
    expect(tip.y).toBeGreaterThan(0)
    expect(root.y - tip.y).toBeCloseTo(m.anatomy.tailTip.distanceTo(m.anatomy.tailRoot), 4)
  })
  it('keeps the feet planted on the perch as the body rises', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posedAs({ afloat: 0 }))
    const toes = boneAt(m, 'toesR')
    m.pose(posedAs({ ...PERCHED, tailProp: 1 }))
    expect(boneAt(m, 'toesR').distanceTo(toes)).toBeLessThan(1e-9)
  })
})
