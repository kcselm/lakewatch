import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { createProfile } from './profile'
import { signedVolume } from './mesher'
import { eyePlacement } from './bill'
import { CREST_RADIUS } from './extras'
import { detailSchema } from './spec'
import { TEST_PERCHER_SPEC, TEST_PERCHER_DETAIL, TEST_SPEC } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'
import { REGIONS, ATLAS_SIZE } from '../paint/atlas'
import { paintAtlas, regionStats } from '../paint/painter'

type Crest = Extract<NonNullable<typeof TEST_PERCHER_DETAIL.parts>[number], { kind: 'crest' }>
const CREST = TEST_PERCHER_DETAIL.parts!.find((p): p is Crest => p.kind === 'crest')!
const LOBES = ['crest', 'crestBack'] as const

const bone = (m: DetailedBirdModel, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!
const posed = (patch: Partial<Omit<PoseState, 'lean'>>, leanX = 0): PoseState => {
  const p = { ...defaultPose(), ...patch }
  p.lean.x = leanX
  return p
}

/** the crest's vertices, lobe by lobe: each lobe's strands ride its own bone */
function lobeVertices(m: DetailedBirdModel): number[][] {
  const uv = m.mesh.geometry.getAttribute('uv') as THREE.BufferAttribute
  const skin = m.mesh.geometry.getAttribute('skinIndex') as THREE.BufferAttribute
  const r = REGIONS.crest
  return LOBES.map(name => {
    const k = m.mesh.skeleton.bones.indexOf(bone(m, name))
    const out: number[] = []
    for (let i = 0; i < uv.count; i++) {
      const x = uv.getX(i) * ATLAS_SIZE, y = uv.getY(i) * ATLAS_SIZE
      if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h && skin.getX(i) === k) out.push(i)
    }
    return out
  })
}
/** where the model's last pose() put these vertices, in group space or, given a bone, in that bone's frame */
function skinnedAt(m: DetailedBirdModel, vertices: number[], frame?: THREE.Bone): THREE.Vector3[] {
  m.group.updateMatrixWorld(true)
  const to = frame ? frame.matrixWorld.clone().invert().multiply(m.group.matrixWorld) : new THREE.Matrix4()
  return vertices.map(i => m.mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(to))
}
const station = (m: DetailedBirdModel, label: string) => m.anatomy.stations.find(s => s.label === label)!.position
const profile = createProfile(TEST_PERCHER_DETAIL.profile)
/** the shift the builder gave every point of the traced side view into group space */
const shift = (m: DetailedBirdModel) => {
  const p = profile.sampleAt(profile.uOf('eye')).point
  return station(m, 'eye').clone().sub(new THREE.Vector3(p.x, p.y, 0))
}

describe('the crest: a part hung from the head, in two lobes', () => {
  it('is built in two lobes, one from each of its stations on top of the head, each on a bone of its own', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const lobes = lobeVertices(m)
    for (const [k, lobe] of CREST.lobes.entries()) {
      expect(lobes[k]!.length, LOBES[k]).toBeGreaterThan(100)
      // each lobe's bone sits just inside the top of the head at its station (dx along the spine), on the section's
      // own up, and hangs from the head
      const b = bone(m, LOBES[k]!), s = profile.sampleAt(profile.uOf(lobe.at) + (lobe.dx ?? 0) / profile.length)
      expect(b.parent!.name).toBe('head')
      const at = b.getWorldPosition(new THREE.Vector3())
      const top = new THREE.Vector3(s.point.x + s.axis.x * s.up, s.point.y + s.axis.y * s.up, 0).add(shift(m))
      expect(at.distanceTo(top), LOBES[k]).toBeCloseTo(CREST_RADIUS, 6)
    }
    expect(m.anatomy.parts).toEqual([expect.objectContaining({ kind: 'crest', shown: true })])
  })
  it('is on every bird of a species that has one, whatever its version, when it names none; and on no other species', () => {
    const detail = { ...TEST_PERCHER_DETAIL, variants: { male: TEST_PERCHER_DETAIL.plumage, female: TEST_PERCHER_DETAIL.plumage } }
    const spec = parseSpeciesSpec({ ...TEST_PERCHER_SPEC, variants: { male: {}, female: {} }, detail })
    for (const v of [undefined, 'male', 'female']) {
      const m = buildDetailedBird(spec, v)
      for (const name of LOBES) expect(bone(m, name).scale.x, `${v} ${name}`).toBe(1)
      expect(m.anatomy.parts[0]!.shown).toBe(true)
    }
    const only = parseSpeciesSpec({ ...spec, detail: { ...detail, parts: [{ ...CREST, versions: ['male'] }] } })
    for (const name of LOBES) {
      expect(bone(buildDetailedBird(only, 'male'), name).scale.x).toBe(1)
      expect(bone(buildDetailedBird(only, 'female'), name).scale.x).toBeLessThan(0.01)
    }
    expect(lobeVertices(buildDetailedBird(TEST_SPEC)).flat()).toHaveLength(0)
  })
  it('lies back along the head at crestRaise 0: each lobe trails back from its base about its length, no higher than its lie', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    lobeVertices(m).forEach((lobe, k) => {
      const base = bone(m, LOBES[k]!).getWorldPosition(new THREE.Vector3())
      const v = skinnedAt(m, lobe)
      const far = v.reduce((a, p) => (p.distanceTo(base) > a.distanceTo(base) ? p : a))
      const { length, lie } = CREST.lobes[k]!
      expect(far.distanceTo(base)).toBeGreaterThan(0.85 * length)
      expect(far.distanceTo(base)).toBeLessThan(1.05 * length)
      expect(far.x).toBeLessThan(base.x - 0.8 * length)
      // the strands spread a little about the lobe's lie and flip up toward their tips: none stands 25° above it
      for (const p of v) {
        if (base.x - p.x < 0.3 * length) continue
        expect(THREE.MathUtils.radToDeg(Math.atan2(p.y - base.y, base.x - p.x))).toBeLessThan(lie + 25)
      }
    })
  })
  it("stands the research's 20 and 30 mm above the eye's centre, lowered and raised (belted-kingfisher.md, section 10)", () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const eyeY = eyePlacement(TEST_PERCHER_DETAIL, profile).center.y + shift(m).y
    const top = () => Math.max(...skinnedAt(m, lobeVertices(m).flat()).map(p => p.y)) - eyeY
    m.pose(posed({}))
    expect(top()).toBeGreaterThan(0.014)
    expect(top()).toBeLessThan(0.024)
    m.pose(posed({ crestRaise: 1 }))
    expect(top()).toBeGreaterThan(0.026)
    expect(top()).toBeLessThan(0.036)
  })
  it('raises each lobe about its own base by the part\'s raise at crestRaise 1, and part way between', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const head = bone(m, 'head')
    const lobes = lobeVertices(m)
    const rest = lobes.map(l => skinnedAt(m, l, head))
    for (const w of [0.4, 1]) {
      // with the head turned and the body leaning, too: the crest rises against the head, wherever the head is
      m.pose(posed({ crestRaise: w, headPitch: 0.3, headYaw: 0.5, neckExtend: 0.8 }, 0.4))
      lobes.forEach((l, k) => {
        const base = bone(m, LOBES[k]!).position             // in the head's frame
        const turn = new THREE.Matrix4().makeRotationZ(-THREE.MathUtils.degToRad(CREST.raise * w))
        const now = skinnedAt(m, l, head)
        rest[k]!.forEach((p, i) => {
          const want = p.clone().sub(base).applyMatrix4(turn).add(base)
          expect(now[i]!.distanceTo(want), `${LOBES[k]} at ${w}`).toBeLessThan(1e-7)
        })
      })
    }
  })
  it('goes wherever the head goes: lowered, it never moves against the head', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const head = bone(m, 'head'), all = lobeVertices(m).flat()
    const rest = skinnedAt(m, all, head), world = skinnedAt(m, all)
    for (const patch of [{ neckExtend: 0 }, { neckExtend: 1, headPitch: 0.8 }, { headYaw: -0.9 }, { reach: 1 }]) {
      m.pose(posed(patch, 0.4))
      const moved = skinnedAt(m, all)
      expect(Math.max(...moved.map((v, i) => v.distanceTo(world[i]!)))).toBeGreaterThan(0.01)
      skinnedAt(m, all, head).forEach((v, i) => expect(v.distanceTo(rest[i]!), JSON.stringify(patch)).toBeLessThan(1e-9))
    }
  })
  it('leaves nothing behind: posed back to crestRaise 0, every bone is where a fresh bird has it', () => {
    const fresh = buildDetailedBird(TEST_PERCHER_SPEC), m = buildDetailedBird(TEST_PERCHER_SPEC)
    m.pose(posed({ crestRaise: 1 }))
    m.pose(posed({})); fresh.pose(posed({}))
    m.group.updateMatrixWorld(true); fresh.group.updateMatrixWorld(true)
    m.mesh.skeleton.bones.forEach((b, i) => expect(b.matrixWorld.equals(fresh.mesh.skeleton.bones[i]!.matrixWorld), b.name).toBe(true))
  })
  it('is a closed mesh, painted as its own part', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const c = m.anatomy.closed.find(x => x.name === 'crest')!
    expect(signedVolume(m.mesh.geometry, c.indexFirst, c.indexCount)).toBeGreaterThan(0)
    const d = TEST_PERCHER_DETAIL
    const px = paintAtlas({ code: 'testpercher', detail: d, layers: [{ kind: 'fill', where: { part: 'crest' }, color: '#101010' }], profile: createProfile(d.profile) })
    expect(regionStats(px, 'crest', [0, 1], [0, 1]).mean).toBeLessThan(0.1)
    expect(regionStats(px, 'plume', [0, 1], [0, 1]).mean).toBeCloseTo(0.5, 1)
  })
  it('has two lobes at stations the bird has, lies and a raise in range, and versions the species paints', () => {
    const d = TEST_PERCHER_DETAIL
    expect(() => detailSchema.parse({ ...d, parts: [{ ...CREST, lobes: [CREST.lobes[0]] }] })).toThrow()
    expect(() => detailSchema.parse({ ...d, parts: [{ ...CREST, lobes: [CREST.lobes[0], { ...CREST.lobes[1]!, at: 'tuft' }] }] })).toThrow(/label: tuft/)
    expect(() => detailSchema.parse({ ...d, parts: [{ ...CREST, lobes: [{ ...CREST.lobes[0]!, lie: 80 }, CREST.lobes[1]] }] })).toThrow()
    expect(() => detailSchema.parse({ ...d, parts: [{ ...CREST, raise: 100 }] })).toThrow()
    expect(() => detailSchema.parse({ ...d, parts: [{ ...CREST, versions: ['male'] }] })).toThrow(/part version male/)
    expect(() => detailSchema.parse({ ...d, parts: [CREST, CREST] })).toThrow(/more than one crest/)
  })
})
