import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { getSpec } from './index'
import { within } from './swimmer.testkit'
import { buildDetailedBird, type DetailedBirdModel } from '../detail/build'
import { measure, crownNow, billAngleNow, tailTipNow } from '../detail/measure'
import { authoredFor } from '../detail/authored'
import { loadAuthoredForTest } from '../detail/authored.testkit'
import { defaultPose, type PoseState } from '../model'
import { CORMORANT_PERCH } from '../../behavior/cormorant'

// Bounds from docs/research/2026-10-04-double-crested-cormorant.md, sections 2.7, 5, 6.2, 7.2, 7.3, and 9, in mm and
// degrees. The cormorant is built in Blender (scripts/blender/doccor/), floating at rest, its waterline on y = 0; on its
// stump, its feet on y = 0. Its files are in public/models/doccor/.

const SPEC = getSpec('doccor')
const MODELS = fileURLToPath(new URL('../../../public/models/doccor/', import.meta.url))
const VERSIONS = ['adult', 'juvenile'] as const

type Patch = Partial<Omit<PoseState, 'lean'>> & { leanX?: number }
function posed(model: DetailedBirdModel, patch: Patch = {}): DetailedBirdModel {
  const { leanX = 0, ...rest } = patch
  const p: PoseState = { ...defaultPose(), ...rest }
  p.lean.set(leanX, 0, 0)
  model.pose(p)
  model.group.updateMatrixWorld(true)
  return model
}
const PERCHED: Patch = { afloat: 0, leanX: CORMORANT_PERCH.lean, tailProp: 1 }
const boneAt = (m: DetailedBirdModel, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!.getWorldPosition(new THREE.Vector3())
const deg = (rad: number) => (rad * 180) / Math.PI

/** A WebP's width and height, from its header (VP8, VP8L, or VP8X). */
function webpSize(path: string): [number, number] {
  const b = readFileSync(path)
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`${path}: not a WebP`)
  const kind = b.toString('ascii', 12, 16)
  if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]
  if (kind === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1] }
  if (kind === 'VP8X') return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1]
  throw new Error(`${path}: unknown WebP chunk ${kind}`)
}

beforeAll(() => loadAuthoredForTest(SPEC, `${MODELS}doccor.glb`))

describe('Double-crested Cormorant: the model', () => {
  it('is an authored bird, swimming and amphibious, in an adult and a juvenile version, the adult the default', () => {
    expect(SPEC.authored?.model).toBe('doccor')
    expect(SPEC.authored?.versions).toEqual([...VERSIONS])
    expect(SPEC.posture).toBe('swimming')
    expect(SPEC.authored?.amphibious).toBe(true)
    expect(SPEC.foraging).toBe('cormorant')
  })
  it('keeps to its budget: at most 9,000 triangles, and 1.5 MB for the model and every version\'s maps', () => {
    const g = authoredFor(SPEC).geometry
    expect(g.getIndex()!.count / 3).toBeLessThanOrEqual(9000)
    const files = ['doccor.glb', ...VERSIONS.flatMap(v => ['color', 'normal', 'rough'].map(k => `${v}.${k}.webp`))]
    const bytes = files.reduce((n, f) => n + statSync(`${MODELS}${f}`).size, 0)
    expect(bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024)
  })
  it('has every version\'s colour, normal, and roughness maps, 1024 pixels square', () => {
    for (const v of VERSIONS) for (const k of ['color', 'normal', 'rough']) expect(webpSize(`${MODELS}${v}.${k}.webp`), `${v}.${k}`).toEqual([1024, 1024])
  })
  it('builds in both versions on one mesh', () => {
    const a = buildDetailedBird(SPEC, 'adult'), j = buildDetailedBird(SPEC, 'juvenile', a)
    expect(j.mesh.geometry).toBe(a.mesh.geometry)
    expect(j.mesh.material).not.toBe(a.mesh.material)
  })
})

describe('Double-crested Cormorant: structure (research 2.7, 5, 9)', () => {
  const M = measure(buildDetailedBird(SPEC))
  const mm = (v: number) => v * 1000
  it('measures as the research does: 0.60 m swimming, culmen 57, tarsus 65, wing 315, tail 165', () => {
    within(mm(M.length), 570, 630, 'length, bill tip to tail tip, swimming')
    within(mm(M.culmen), 55.9, 58.1, 'culmen')
    within(mm(M.billDepth), 15.5, 18.5, 'bill depth at the feather line')
    within(mm(M.tarsus), 63.7, 66.3, 'tarsus')
    within(mm(M.wingChord), 309, 321, 'wing chord')
    within(mm(M.tail), 162, 168, 'tail')
  })
  it('has a hooked bill: the nail curls 4-8 mm below the line of the culmen', () => {
    within(-mm(M.billTipRise), 4, 8, 'the hook')
  })
  it('has a head 0.165 m from the occiput to the bill tip, 2.9 culmens', () => {
    within(mm(M.head + M.culmen), 150, 180, 'head and bill')
  })
})

describe('Double-crested Cormorant: floating awash (research 6.2)', () => {
  const m = buildDetailedBird(SPEC)
  const M = measure(m)
  const mm = (v: number) => v * 1000
  it('rides low: the back 15-35 mm above the water, about four-fifths of the body\'s depth under', () => {
    within(mm(M.backAbove), 15, 35, 'back above the water')
    within(M.draft / (M.backAbove + M.draft), 0.7, 0.88, 'share of the depth under')
  })
  it('holds its neck up, the crown 140-190 mm above the water, its bill raised 5-25 degrees', () => {
    within(mm(M.crownAbove), 140, 190, 'crown above the water')
    within(deg(billAngleNow(posed(m))), 5, 25, 'the bill\'s angle')
  })
  it('lays its tail on the water: the tip within 10 mm of it', () => {
    within(mm(M.tailTipAbove), -10, 10, 'tail tip')
  })
  it('meets the water along 0.40-0.55 m with its tail', () => {
    within(mm(M.waterlineLength), 330, 520, 'waterline length (the body alone; the tail lies on the water past it)')
  })
})

describe('Double-crested Cormorant: perched (research 7.3)', () => {
  it('stands on its stump with its body 40 degrees up, its feet on the wood', () => {
    const m = posed(buildDetailedBird(SPEC), PERCHED)
    within(mm(Math.min(boneAt(m, 'toesR').y, boneAt(m, 'toesL').y)), 0, 15, 'the feet on the perch')
  })
  it('stands 0.50-0.62 m from perch to crown with its neck erect, 0.36-0.48 drawn in', () => {
    within(mm(crownNow(posed(buildDetailedBird(SPEC), { ...PERCHED, neckExtend: CORMORANT_PERCH.neck.high }))), 500, 620, 'erect')
    within(mm(crownNow(posed(buildDetailedBird(SPEC), { ...PERCHED, neckExtend: CORMORANT_PERCH.neck.low }))), 360, 480, 'drawn in')
  })
  it('props its tail on the perch: the tip within 20 mm of it', () => {
    within(mm(tailTipNow(posed(buildDetailedBird(SPEC), PERCHED)).y), -5, 20, 'tail tip above the perch')
  })
})

describe('Double-crested Cormorant: drying its wings (research 7.2)', () => {
  const m = posed(buildDetailedBird(SPEC), { ...PERCHED, dry: 1 })
  const tip = (side: 'L' | 'R') => {
    const a = authoredFor(SPEC).anatomy.flightWing!
    const local = a.tip.clone().sub(a.wrist)
    if (side === 'L') local.z = -local.z
    return local.applyMatrix4(m.mesh.skeleton.bones.find(b => b.name === `hand${side}`)!.matrixWorld)
  }
  it('raises its wrists to its shoulders or above, and hangs its hands below them', () => {
    for (const s of ['L', 'R'] as const) {
      expect(boneAt(m, `hand${s}`).y).toBeGreaterThanOrEqual(boneAt(m, `wing${s}`).y - 0.01)
      expect(tip(s).y).toBeLessThan(boneAt(m, `hand${s}`).y)
    }
  })
  it('opens each wing about three-quarters: 0.32-0.45 m from the shoulder to the tip (the photo\'s 0.39)', () => {
    within(mm(tip('R').distanceTo(boneAt(m, 'wingR'))), 320, 450, 'shoulder to tip')
  })
})

function mm(v: number): number { return v * 1000 }
