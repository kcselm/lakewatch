import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { measure, tailTipNow } from './measure'
import { loftWeights } from './loft'
import { createProfile } from './profile'
import { signedVolume } from './mesher'
import { detailSchema, type Part } from './spec'
import { TEST_SPEC, TEST_SWIM_SPEC, TEST_SWIM_DETAIL, TEST_HERON_SPEC, TEST_HERON_DETAIL } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose } from '../model'
import { REGIONS, ATLAS_SIZE } from '../paint/atlas'
import { paintAtlas, regionStats } from '../paint/painter'

/** the vertices mapped into a part's atlas region */
function inRegion(m: DetailedBirdModel, part: Part): number[] {
  const uv = m.mesh.geometry.getAttribute('uv') as THREE.BufferAttribute
  const r = REGIONS[part]
  const out: number[] = []
  for (let i = 0; i < uv.count; i++) {
    const x = uv.getX(i) * ATLAS_SIZE, y = uv.getY(i) * ATLAS_SIZE
    if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) out.push(i)
  }
  return out
}
/** where the model's last pose() put these vertices, group space */
function skinnedAt(m: DetailedBirdModel, vertices: number[]): THREE.Vector3[] {
  m.group.updateMatrixWorld(true)
  return vertices.map(i => m.mesh.getVertexPosition(i, new THREE.Vector3()))
}

describe('tailTilt', () => {
  it('lifts the tail when positive, as PoseState says, standing or swimming', () => {
    for (const spec of [TEST_SPEC, TEST_SWIM_SPEC]) {
      const m = buildDetailedBird(spec)
      const rest = tailTipNow(m).y
      m.pose({ ...defaultPose(), tailTilt: 0.3 })
      expect(tailTipNow(m).y, spec.code).toBeGreaterThan(rest + 0.01)
    }
  })
})

describe("tail 'none'", () => {
  const detail = { ...TEST_SWIM_DETAIL, tail: { shape: 'none' as const } }
  const tailless = () => buildDetailedBird(parseSpeciesSpec({ ...TEST_SWIM_SPEC, detail }))
  it('builds no tail', () => {
    const tailed = buildDetailedBird(TEST_SWIM_SPEC), m = tailless()
    expect(inRegion(tailed, 'tail').length).toBeGreaterThan(0)
    expect(inRegion(m, 'tail')).toHaveLength(0)
    expect(inRegion(m, 'tailUnder')).toHaveLength(0)
    // the tail's two faces, 6 x 7 vertices each, are all that is missing
    expect(m.mesh.geometry.getAttribute('position').count).toBe(tailed.mesh.geometry.getAttribute('position').count - 84)
  })
  it('makes the rear of the body the stern: the tail tip is its rearmost point', () => {
    const m = tailless()
    const loft = m.anatomy.closed.find(c => c.name === 'loft')!
    const pos = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute, idx = m.mesh.geometry.getIndex()!
    let rear = Infinity
    for (let t = loft.indexFirst; t < loft.indexFirst + loft.indexCount; t++) rear = Math.min(rear, pos.getX(idx.getX(t)))
    expect(m.anatomy.tailTip.x).toBeCloseTo(rear, 6)
    expect(measure(m).tailTipAbove).toBe(m.anatomy.tailTip.y)
    expect(measure(m).length).toBeCloseTo(m.anatomy.billTip.distanceTo(m.anatomy.tailTip), 12)
  })
  it('hands the rear of the body from the tail bone to the body over the rump', () => {
    const profile = createProfile(detail.profile)
    const kT = profile.uOf('tailBase')
    expect(loftWeights(0, profile, detail.rig, true)).toEqual([['tail', 1]])
    const mid = loftWeights(kT / 2, profile, detail.rig, true)
    expect(mid.map(([b]) => b)).toEqual(['tail', 'body'])
    expect(mid[0]![1]).toBeCloseTo(0.5, 9)
    expect(loftWeights(kT, profile, detail.rig, true)).toEqual([['body', 1]])
    expect(loftWeights(0, profile, detail.rig)).toEqual([['body', 1]])          // a tailed bird's rear is all body
  })
  it('cocks the stern with tailTilt', () => {
    const m = tailless()
    const rear = inRegion(m, 'skin').filter(i => m.mesh.getVertexPosition(i, new THREE.Vector3()).distanceTo(m.anatomy.tailTip) < 1e-6)
    expect(rear.length).toBeGreaterThan(0)
    const rest = tailTipNow(m)
    m.pose({ ...defaultPose(), tailTilt: 0.4 })
    const cocked = tailTipNow(m)
    expect(cocked.y - rest.y).toBeGreaterThan(0.005)
    for (const v of skinnedAt(m, rear)) expect(v.distanceTo(cocked)).toBeLessThan(1e-6)
  })
})

describe('version-only parts', () => {
  // the Mallard drake's curl: two loops about 20 mm high on the rump, on the male only
  // (docs/research/2026-09-25-mallard.md, sections 4.1, 5, and 9)
  const CURL = { kind: 'curl' as const, at: 'rump', height: 0.02, versions: ['male'] }
  const detail = { ...TEST_SWIM_DETAIL, parts: [CURL], variants: { male: TEST_SWIM_DETAIL.plumage, female: TEST_SWIM_DETAIL.plumage } }
  const spec = parseSpeciesSpec({ ...TEST_SWIM_SPEC, variants: { male: {}, female: {} }, detail })
  const curlBone = (m: DetailedBirdModel) => m.mesh.skeleton.bones.find(b => b.name === 'curl')!
  it('is built on every bird of the species, whatever its version, and on no other species', () => {
    for (const v of [undefined, 'male', 'female']) expect(inRegion(buildDetailedBird(spec, v), 'curl').length, `${v}`).toBeGreaterThan(100)
    expect(inRegion(buildDetailedBird(TEST_SWIM_SPEC), 'curl')).toHaveLength(0)
  })
  it('shows on the versions it names and hides by bone scale on the rest, whatever the pose', () => {
    const male = buildDetailedBird(spec, 'male'), female = buildDetailedBird(spec, 'female'), plain = buildDetailedBird(spec)
    const height = (m: DetailedBirdModel) => {
      const ys = skinnedAt(m, inRegion(m, 'curl')).map(v => v.y)
      return Math.max(...ys) - Math.min(...ys)
    }
    for (const m of [male, female, plain]) {
      const p = defaultPose(); p.lean.x = 1.2; p.tailTilt = 0.3; p.paddle = 1
      m.pose(p)
      m.pose(defaultPose())
    }
    expect(curlBone(male).scale.x).toBe(1)
    expect(male.anatomy.parts[0]!.shown).toBe(true)
    expect(height(male)).toBeGreaterThan(0.018)
    for (const m of [female, plain]) {
      expect(curlBone(m).scale.x).toBeLessThan(0.01)
      expect(m.anatomy.parts[0]!.shown).toBe(false)
      expect(height(m)).toBeLessThan(0.0001)
    }
  })
  it('rises its height from the back at its station, and goes where the body goes', () => {
    const m = buildDetailedBird(spec, 'male')
    const { base, top } = m.anatomy.parts[0]!
    const rump = m.anatomy.stations.find(s => s.label === 'rump')!.position
    const s = TEST_SWIM_DETAIL.profile.find(x => x.label === 'rump')!
    expect(base.distanceTo(rump.clone().add(new THREE.Vector3(0, s.up, 0)))).toBeLessThan(0.002)
    expect(top.distanceTo(base)).toBeCloseTo(CURL.height, 3)
    const rest = skinnedAt(m, inRegion(m, 'curl'))
    const p = defaultPose(); p.lean.x = 1.5
    m.pose(p)
    const tipped = skinnedAt(m, inRegion(m, 'curl'))
    rest.forEach((v, i) => expect(tipped[i]!.length()).toBeCloseTo(v.length(), 9))     // turned with the body about the pivot
    expect(Math.min(...tipped.map(v => v.y))).toBeGreaterThan(Math.max(...rest.map(v => v.y)))
  })
  it('is a closed mesh, painted as its own part', () => {
    const m = buildDetailedBird(spec, 'male')
    const c = m.anatomy.closed.find(x => x.name === 'curl')!
    expect(signedVolume(m.mesh.geometry, c.indexFirst, c.indexCount)).toBeGreaterThan(0)
    const px = paintAtlas({ code: 'testduck', detail, layers: [{ kind: 'fill', where: { part: 'curl' }, color: '#101010' }], profile: createProfile(detail.profile) })
    expect(regionStats(px, 'curl', [0, 1], [0, 1]).mean).toBeLessThan(0.1)
    expect(regionStats(px, 'shield', [0, 1], [0, 1]).mean).toBeCloseTo(0.5, 1)
  })
  it('names versions the species paints, a station it has, and one part of each kind', () => {
    expect(() => detailSchema.parse({ ...detail, parts: [{ ...CURL, versions: ['eclipse'] }] })).toThrow(/part version eclipse/)
    expect(() => detailSchema.parse({ ...detail, parts: [{ ...CURL, at: 'uppertail' }] })).toThrow(/label: uppertail/)
    expect(() => detailSchema.parse({ ...detail, parts: [CURL, CURL] })).toThrow(/more than one curl/)
  })
})

describe('a part hung from the head', () => {
  // an adult heron's occipital plumes: two strands trailing back from the top of the head, on the adult only
  const PLUME = { kind: 'plume' as const, at: 'occiput', length: 0.12, droop: 15, versions: ['adult'] }
  const detail = { ...TEST_HERON_DETAIL, parts: [PLUME], variants: { adult: TEST_HERON_DETAIL.plumage, juvenile: TEST_HERON_DETAIL.plumage } }
  const spec = parseSpeciesSpec({ ...TEST_HERON_SPEC, variants: { adult: {}, juvenile: {} }, detail })
  const plumeBone = (m: DetailedBirdModel) => m.mesh.skeleton.bones.find(b => b.name === 'plume')!
  const headBone = (m: DetailedBirdModel) => m.mesh.skeleton.bones.find(b => b.name === 'head')!
  it('is built on every bird of the species and shown only on the versions it names', () => {
    for (const v of [undefined, 'adult', 'juvenile']) expect(inRegion(buildDetailedBird(spec, v), 'plume').length, `${v}`).toBeGreaterThan(100)
    expect(inRegion(buildDetailedBird(TEST_HERON_SPEC), 'plume')).toHaveLength(0)
    const adult = buildDetailedBird(spec, 'adult'), juvenile = buildDetailedBird(spec, 'juvenile')
    expect(plumeBone(adult).scale.x).toBe(1)
    expect(adult.anatomy.parts[0]).toMatchObject({ kind: 'plume', shown: true })
    expect(plumeBone(juvenile).scale.x).toBeLessThan(0.01)
    expect(juvenile.anatomy.parts[0]!.shown).toBe(false)
  })
  it('leaves the top of the head at its station and trails back its length, drooping', () => {
    const m = buildDetailedBird(spec, 'adult')
    const { base } = m.anatomy.parts[0]!
    const occiput = m.anatomy.stations.find(s => s.label === 'occiput')!.position
    expect(base.distanceTo(occiput)).toBeLessThan(0.03)
    expect(base.y).toBeGreaterThan(occiput.y)
    const far = skinnedAt(m, inRegion(m, 'plume')).reduce((a, v) => (v.distanceTo(base) > a.distanceTo(base) ? v : a))
    expect(far.distanceTo(base)).toBeGreaterThan(PLUME.length * 0.95)
    expect(far.distanceTo(base)).toBeLessThan(PLUME.length * 1.02)
    expect(far.x).toBeLessThan(base.x - PLUME.length * 0.8)       // straight back, drooping
    expect(far.y).toBeLessThan(base.y - PLUME.length * 0.2)       // and below where it leaves it
  })
  it('goes wherever the head goes', () => {
    const m = buildDetailedBird(spec, 'adult')
    const inHead = () => {
      m.group.updateMatrixWorld(true)
      const toHead = headBone(m).matrixWorld.clone().invert()
      return skinnedAt(m, inRegion(m, 'plume')).map(v => v.applyMatrix4(m.group.matrixWorld).applyMatrix4(toHead))
    }
    const rest = inHead(), world = skinnedAt(m, inRegion(m, 'plume'))
    for (const patch of [{ neckExtend: 0 }, { neckExtend: 1, headPitch: 0.8 }, { reach: 1 }]) {
      const p = { ...defaultPose(), ...patch }; p.lean.x = 0.4
      m.pose(p)
      const moved = skinnedAt(m, inRegion(m, 'plume'))
      expect(Math.max(...moved.map((v, i) => v.distanceTo(world[i]!)))).toBeGreaterThan(0.01)
      inHead().forEach((v, i) => expect(v.distanceTo(rest[i]!), JSON.stringify(patch)).toBeLessThan(1e-9))
    }
  })
  it('is a closed mesh, painted as its own part', () => {
    const m = buildDetailedBird(spec, 'adult')
    const c = m.anatomy.closed.find(x => x.name === 'plume')!
    expect(signedVolume(m.mesh.geometry, c.indexFirst, c.indexCount)).toBeGreaterThan(0)
    const px = paintAtlas({ code: 'testheron', detail, layers: [{ kind: 'fill', where: { part: 'plume' }, color: '#101010' }], profile: createProfile(detail.profile) })
    expect(regionStats(px, 'plume', [0, 1], [0, 1]).mean).toBeLessThan(0.1)
    expect(regionStats(px, 'curl', [0, 1], [0, 1]).mean).toBeCloseTo(0.5, 1)
  })
  it('names versions the species paints, a station it has, and a droop in range', () => {
    expect(() => detailSchema.parse({ ...detail, parts: [{ ...PLUME, versions: ['breeding'] }] })).toThrow(/part version breeding/)
    expect(() => detailSchema.parse({ ...detail, parts: [{ ...PLUME, at: 'crest' }] })).toThrow(/label: crest/)
    expect(() => detailSchema.parse({ ...detail, parts: [PLUME, PLUME] })).toThrow(/more than one plume/)
    expect(() => detailSchema.parse({ ...detail, parts: [{ ...PLUME, droop: 120 }] })).toThrow()
  })
})
