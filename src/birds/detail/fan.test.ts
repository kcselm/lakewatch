import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { tailTipNow } from './measure'
import { FAN_BONES } from './rig'
import { detailSchema } from './spec'
import { TEST_PERCHER_SPEC, TEST_PERCHER_DETAIL, TEST_SPEC } from './fixture'
import { defaultPose, type PoseState } from '../model'
import { REGIONS, ATLAS_SIZE } from '../paint/atlas'

const FAN = TEST_PERCHER_DETAIL.tail.fan!

const posed = (patch: Partial<Omit<PoseState, 'lean'>>, leanX = 0): PoseState => {
  const p = { ...defaultPose(), ...patch }
  p.lean.x = leanX
  return p
}

/**
 * The tail's upper face by its columns of feathers, outer left (−z, the bird's left) to outer right: each column's
 * vertices, root first. The tail is a grid of 6 rows by 7 columns, laid down row by row from the root.
 */
function columns(m: DetailedBirdModel): number[][] {
  const uv = m.mesh.geometry.getAttribute('uv') as THREE.BufferAttribute
  const r = REGIONS.tail
  const face: number[] = []
  for (let i = 0; i < uv.count; i++) {
    const x = uv.getX(i) * ATLAS_SIZE, y = uv.getY(i) * ATLAS_SIZE
    if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) face.push(i)
  }
  expect(face).toHaveLength(42)
  return Array.from({ length: 7 }, (_, j) => Array.from({ length: 6 }, (_, i) => face[i * 7 + j]!))
}
function skinnedAt(m: DetailedBirdModel, vertices: number[]): THREE.Vector3[] {
  m.group.updateMatrixWorld(true)
  return vertices.map(i => m.mesh.getVertexPosition(i, new THREE.Vector3()))
}
/**
 * The angle between the outer feathers, root to tip, seen square to the tail: the tail's plane is the one through the
 * middle feather and the line of the roots, which neither the fan nor the tail's cup tips.
 */
function spread(m: DetailedBirdModel): number {
  const cols = columns(m)
  const line = (c: number[]) => { const v = skinnedAt(m, c); return v.at(-1)!.clone().sub(v[0]!) }
  const roots = skinnedAt(m, [cols[6]![0]!])[0]!.sub(skinnedAt(m, [cols[0]![0]!])[0]!)
  const n = line(cols[3]!).cross(roots).normalize()
  const flat = (v: THREE.Vector3) => v.addScaledVector(n, -v.dot(n))
  return THREE.MathUtils.radToDeg(flat(line(cols[0]!)).angleTo(flat(line(cols[6]!))))
}

describe('tailSpread: the tail fanned about its base', () => {
  it('fans the outer feathers the species\' fan apart at 1, and part way at 0.5, from the closed tail at 0', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const closed = spread(m)
    expect(closed).toBeLessThan(15)
    m.pose(posed({ tailSpread: 1 }))
    expect(spread(m)).toBeCloseTo(FAN, 6)
    m.pose(posed({ tailSpread: 0.5 }))
    expect(spread(m)).toBeCloseTo(closed + (FAN - closed) / 2, 6)
  })
  it('turns each column of feathers rigidly about its own root: the roots stay, every feather keeps its length', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const rest = columns(m).map(c => skinnedAt(m, c))
    m.pose(posed({ tailSpread: 0.8 }))
    columns(m).forEach((c, j) => {
      const now = skinnedAt(m, c)
      expect(now[0]!.distanceTo(rest[j]![0]!), `column ${j} root`).toBeLessThan(1e-7)
      now.forEach((p, i) => expect(p.distanceTo(now[0]!)).toBeCloseTo(rest[j]![i]!.distanceTo(rest[j]![0]!), 9))
    })
    // the middle feathers stay where they were, and the outer ones swing out to their own side
    columns(m)[3]!.forEach((v, i) => expect(skinnedAt(m, [v])[0]!.distanceTo(rest[3]![i]!)).toBeLessThan(1e-9))
    expect(skinnedAt(m, columns(m)[0]!).at(-1)!.z).toBeLessThan(rest[0]!.at(-1)!.z - 0.03)
    expect(skinnedAt(m, columns(m)[6]!).at(-1)!.z).toBeGreaterThan(rest[6]!.at(-1)!.z + 0.03)
    expect(tailTipNow(m).distanceTo(m.anatomy.tailTip)).toBeLessThan(1e-9)
  })
  it('fans with the tail wherever it goes: lifted, and with the body leaning', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    m.pose(posed({ tailSpread: 1, tailTilt: 0.4 }, 0.6))
    expect(spread(m)).toBeCloseTo(FAN, 6)
    const tail = m.mesh.skeleton.bones.find(b => b.name === 'tail')!
    for (const name of FAN_BONES.filter(n => n !== 'tail')) expect(m.mesh.skeleton.bones.find(b => b.name === name)!.parent).toBe(tail)
  })
  it('leaves nothing behind: posed back to tailSpread 0, every bone is where a fresh bird has it', () => {
    const fresh = buildDetailedBird(TEST_PERCHER_SPEC), m = buildDetailedBird(TEST_PERCHER_SPEC)
    m.pose(posed({ tailSpread: 1 }))
    m.pose(posed({})); fresh.pose(posed({}))
    m.group.updateMatrixWorld(true); fresh.group.updateMatrixWorld(true)
    m.mesh.skeleton.bones.forEach((b, i) => expect(b.matrixWorld.equals(fresh.mesh.skeleton.bones[i]!.matrixWorld), b.name).toBe(true))
  })
  it('does nothing to a bird without a fan: its tail is all on the tail bone, as it always was', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const rest = columns(m).map(c => skinnedAt(m, c))
    m.pose(posed({ tailSpread: 1 }))
    columns(m).forEach((c, j) => skinnedAt(m, c).forEach((p, i) => expect(p.distanceTo(rest[j]![i]!)).toBeLessThan(1e-12)))
    const skin = m.mesh.geometry.getAttribute('skinIndex') as THREE.BufferAttribute
    const tail = m.mesh.skeleton.bones.findIndex(b => b.name === 'tail')
    for (const v of columns(m).flat()) expect(skin.getX(v)).toBe(tail)
  })
  it('takes a fan of 0-180°', () => {
    const tail = (fan: number) => ({ ...TEST_PERCHER_DETAIL, tail: { ...TEST_PERCHER_DETAIL.tail, fan } })
    expect(() => detailSchema.parse(tail(190))).toThrow()
    expect(() => detailSchema.parse(tail(-10))).toThrow()
    expect(() => detailSchema.parse(tail(120))).not.toThrow()
  })
})
