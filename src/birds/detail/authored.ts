import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { SpeciesSpec } from '../spec'
import type { AuthoredSpec } from './spec'
import type { Anatomy, Built } from './build'
import type { LegLayout } from './legs'
import { BONE_INDEX, BONE_NAMES, BONE_PARENT, NECK_BONES, chainBones, type BoneName, type Joints } from './rig'

/**
 * The parts of an authored bird, in the order of the `_PART` vertex attribute's values (scripts/blender/lib/gamebird.py,
 * PARTS): each vertex says which part it belongs to, as the builder knows which it built.
 */
export const AUTHORED_PARTS = ['skin', 'bill', 'eye', 'wingFold', 'wingSpread', 'tail', 'legs'] as const
export type AuthoredPart = (typeof AUTHORED_PARTS)[number]
/** the landmarks the model marks with empties named mark_<name> */
export const MARKS = ['billBase', 'billTip', 'tailRoot', 'tailTip', 'wrist', 'wingTip'] as const

/** within this of the bill's base along the bill, a bill vertex is on its base ring (metres) */
const BASE_RING = 0.0015
/** a landmark on a part lies within this of one of its vertices (metres) */
const LANDMARK = 0.005
/** a joint this close to the one before it along the neck is parked there, with no length (metres) */
const PARKED = 1e-4

/** Parse a glb (the bytes of <model>.glb) into its scene. Works without a DOM: the glb holds no images. */
export function parseGlb(bytes: ArrayBuffer): Promise<THREE.Group> {
  return new Promise((resolve, reject) => new GLTFLoader().parse(bytes, '', g => resolve(g.scene), reject))
}

/**
 * What every bird of an authored species shares, from its model: the skinned mesh in group space, its skin indices
 * remapped to the builder's bones (BONE_NAMES), each joint at its bone's head, and the anatomy the pose code and the
 * measures read, from the landmarks and the parts. The model is built as the builder builds: floating on y = 0 (a
 * swimmer) with its legs standing, or standing on y = 0.
 */
export function authoredBuilt(spec: SpeciesSpec, scene: THREE.Object3D): Built {
  const A = spec.authored
  if (!A) throw new Error(`${spec.code}: not an authored bird`)
  scene.updateMatrixWorld(true)
  const skins: THREE.SkinnedMesh[] = []
  scene.traverse(o => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) skins.push(o as THREE.SkinnedMesh) })
  if (skins.length !== 1) throw new Error(`${spec.code}: the model has ${skins.length} skinned meshes, not one`)
  const skin = skins[0]!
  const fileBones = skin.skeleton.bones
  const names = fileBones.map(b => b.name)
  const missing = BONE_NAMES.filter(n => !names.includes(n))
  if (missing.length) throw new Error(`${spec.code}: the model's skeleton lacks ${missing.join(', ')}`)
  for (const b of fileBones) {
    if (!(b.name in BONE_INDEX)) throw new Error(`${spec.code}: the model has a bone the builder doesn't: ${b.name}`)
    const want = BONE_PARENT[b.name as BoneName]
    const got = b.parent && (b.parent as THREE.Bone).isBone ? b.parent.name : null
    if (got !== want) throw new Error(`${spec.code}: ${b.name}'s parent is ${got}, not ${want}`)
  }
  const joints = Object.fromEntries(fileBones.map(b => [b.name, b.getWorldPosition(new THREE.Vector3())])) as Joints
  const marks = Object.fromEntries(MARKS.map(n => {
    const o = scene.getObjectByName(`mark_${n}`)
    if (!o) throw new Error(`${spec.code}: the model has no landmark mark_${n}`)
    return [n, o.getWorldPosition(new THREE.Vector3())]
  })) as Record<(typeof MARKS)[number], THREE.Vector3>

  const geometry = groupSpace(skin, names)
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute
  const at = (i: number) => new THREE.Vector3().fromBufferAttribute(pos, i)
  const ranges = partRanges(geometry)
  const verts = (p: AuthoredPart) => { const r = ranges.vertices[p]; return r ? Array.from({ length: r.count }, (_, k) => r.first + k) : [] }
  const strongest = (i: number) => {
    const si = geometry.getAttribute('skinIndex'), sw = geometry.getAttribute('skinWeight')
    let best = 0
    for (let k = 1; k < 4; k++) if (sw.getComponent(i, k) > sw.getComponent(i, best)) best = k
    return BONE_NAMES[si.getComponent(i, best)]!
  }

  // the neck chain: its joints, base to head, until the first one parked on the one before it
  const chain = A.neck === undefined ? null : chainBones(A.neck)
  if (chain) {
    const used = chain.length - 1
    NECK_BONES.forEach((n, k) => {
      if (k === 0) return
      const parked = joints[n].distanceTo(joints[NECK_BONES[k - 1]!]) < PARKED
      if (k < used && parked) throw new Error(`${spec.code}: ${n} is parked, but authored.neck says the chain uses it`)
      if (k >= used && !parked) throw new Error(`${spec.code}: ${n} has a length, but authored.neck says the chain stops before it`)
    })
  }

  const hipR = joints.tibiaR.clone(), kneeR = joints.tarsusR.clone(), footR = joints.toesR.clone()
  const legs = verts('legs').map(at)
  const sole = legs.length ? Math.min(...legs.map(v => v.y)) : footR.y
  const skinVerts = verts('skin')
  const bodyVerts = skinVerts.filter(i => strongest(i) === 'body')
  const headVerts = skinVerts.filter(i => strongest(i) === 'head')
  // the back's skin: weighted almost wholly to the body...
  const weightOn = (i: number, bone: BoneName) => {
    const si = geometry.getAttribute('skinIndex'), sw = geometry.getAttribute('skinWeight')
    let w = 0
    for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === BONE_INDEX[bone]) w += sw.getComponent(i, k)
    return w
  }
  // ...and behind the neck: the rearmost skin that leans most on a neck bone
  const neckRear = Math.min(...skinVerts.filter(i => (NECK_BONES as readonly string[]).includes(strongest(i))).map(i => at(i).x))
  const backPts = bodyVerts.filter(i => weightOn(i, 'body') > 0.9 && at(i).x < neckRear).map(at)
  const bodyPts = bodyVerts.map(at)
  const under = bodyPts.filter(v => Math.abs(v.x - hipR.x) < 0.01)
  const bellyY = under.length ? Math.min(...under.map(v => v.y)) : Math.min(...bodyPts.map(v => v.y))
  const neckY = joints.neck.y
  const breastFront = bodyPts.filter(v => v.y < neckY).reduce((a, v) => (v.x > a.x ? v : a), new THREE.Vector3(-Infinity, 0, 0)).clone()
  // the landmarks and the mesh must agree: a mesh moved apart from its skeleton (an armature moved as an object, whose
  // transform the export then bakes into the vertices a second time) leaves the bill's tip off the bill
  const billPts = verts('bill').map(at)
  const offTip = Math.min(...billPts.map(v => v.distanceTo(marks.billTip)))
  if (!(offTip < LANDMARK)) throw new Error(`${spec.code}: mark_billTip is ${(offTip * 1000).toFixed(1)} mm from the bill: the mesh and the skeleton disagree`)
  const billDir = billDirection(billPts, marks.billBase, marks.billTip)
  const billUp = new THREE.Vector3(-billDir.y, billDir.x, 0).normalize()
  const billBaseRing = verts('bill').map(at).filter(v => Math.abs(v.clone().sub(marks.billBase).dot(billDir)) < BASE_RING)
  const fold = verts('wingFold').map(at)
  const spread = ranges.vertices.wingSpread
  const flightTip = scene.getObjectByName('mark_flightTip')?.getWorldPosition(new THREE.Vector3()) ?? null
  if (A.flight && (!spread || !flightTip)) throw new Error(`${spec.code}: authored.flight needs the model's spread wing and its mark_flightTip`)
  const water = waterSpan(geometry, ranges.indices.skin)
  const swimming = spec.posture === 'swimming'
  const amphibious = swimming && !!A.amphibious

  const anatomy: Anatomy = {
    billBase: marks.billBase, billTip: marks.billTip, billDir, billUp, billBaseRing,
    tailRoot: marks.tailRoot, tailTip: marks.tailTip, wrist: marks.wrist, wingTip: marks.wingTip,
    hip: hipR, knee: kneeR, foot: footR, bellyY,
    bodyLowY: Math.min(...bodyPts.map(v => v.y)),
    wingLowY: fold.length ? Math.min(...fold.map(v => v.y)) : bellyY,
    // the back: the body's own skin, clear of the neck, as a lofted bird's is the loft's behind its neck base
    backTopY: Math.max(...(backPts.length ? backPts : bodyPts).map(v => v.y)),
    breastFront, waterline: { back: water[0], front: water[1] },
    head: headVerts.map(at), crown: headVerts, rings: 0,
    stations: [], spine: [],
    closed: AUTHORED_PARTS.flatMap(p => (ranges.indices[p] ? [{ name: p, ...ranges.indices[p]! }] : [])),
    shield: null, pouch: null,
    flightWing: A.flight && spread ? { first: spread.first, count: spread.count, wrist: joints.handR.clone(), tip: flightTip! } : null,
    parts: [],
  }
  // the leg's segments as the builder's leg IK sees them, in the side view
  const tibia = Math.hypot(kneeR.x - hipR.x, kneeR.y - hipR.y), tarsus = Math.hypot(footR.x - kneeR.x, footR.y - kneeR.y)
  const layout: LegLayout = {
    hip: hipR, bellyY, tibia, tarsus, toe: A.measurements.toe,
    standHeight: hipR.y - footR.y, footY: footR.y - sole, tarsusRadius: (A.measurements.tarsus * 0.045) / 2,
    knee: kneeR, foot: footR, swimming: swimming && !amphibious,
  }
  // standing, the hips over the origin and the soles on y = 0
  const ashore = new THREE.Vector3(-hipR.x, -sole, 0)
  // the head pump's reach is a share of the body's length: tail root to bill base along the joints
  const line = [marks.tailRoot, joints.body, ...(chain ?? ['neck', 'neckMid', 'head'] as const).map(n => joints[n]), marks.billBase]
  const bodyLength = line.slice(1).reduce((s, p, k) => s + p.distanceTo(line[k]!), 0)
  const neckAlong = chain ? joints[chain[1]!].clone().sub(joints[chain[0]!]) : null
  geometry.deleteAttribute('_part')
  return { profile: null, layout, geometry, joints, anatomy, ashore, bodyLength, neckAlong }
}

/**
 * The skinned mesh's geometry in group space, its skin indices remapped from the file's joint order to BONE_NAMES, and
 * its vertices and triangles sorted by part, so each part is one run of each.
 */
function groupSpace(skin: THREE.SkinnedMesh, fileNames: string[]): THREE.BufferGeometry {
  const src = skin.geometry.clone()
  src.applyMatrix4(skin.matrixWorld)
  const partAttr = src.getAttribute('_part')
  if (!partAttr) throw new Error('the model has no _PART attribute')
  const n = src.getAttribute('position').count
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => partAttr.getX(a) - partAttr.getX(b) || a - b)
  const newIndex = new Uint32Array(n)
  order.forEach((old, k) => { newIndex[old] = k })
  const out = new THREE.BufferGeometry()
  for (const [name, attr] of Object.entries(src.attributes)) {
    const a = attr as THREE.BufferAttribute
    const size = a.itemSize
    const arr = name === 'skinIndex' ? new Uint16Array(n * size) : new Float32Array(n * size)
    order.forEach((old, k) => {
      for (let c = 0; c < size; c++) {
        const v = a.getComponent(old, c)
        arr[k * size + c] = name === 'skinIndex' ? BONE_INDEX[fileNames[v] as BoneName] : v
      }
    })
    out.setAttribute(name, new THREE.BufferAttribute(arr, size, name === 'normal' ? false : a.normalized && name !== 'skinIndex'))
  }
  const index = src.getIndex()
  const tris: number[][] = []
  if (index) for (let i = 0; i < index.count; i += 3) tris.push([newIndex[index.getX(i)]!, newIndex[index.getX(i + 1)]!, newIndex[index.getX(i + 2)]!])
  else for (let i = 0; i < n; i += 3) tris.push([newIndex[i]!, newIndex[i + 1]!, newIndex[i + 2]!])
  const p = out.getAttribute('_part')
  tris.sort((a, b) => p.getX(a[0]!) - p.getX(b[0]!))
  out.setIndex(tris.flat())
  out.computeBoundingSphere()
  return out
}

/**
 * The bill's direction at its base, as a lofted bird's billDir is: through the middle of its base and the middle of its
 * middle, so a hooked tip (dropping below that line) doesn't tip it. Base to tip, for a bill with no vertices there.
 */
function billDirection(bill: THREE.Vector3[], base: THREE.Vector3, tip: THREE.Vector3): THREE.Vector3 {
  const along = tip.clone().sub(base), length = along.length()
  along.normalize()
  const mean = (lo: number, hi: number) => {
    const pts = bill.filter(v => { const s = v.clone().sub(base).dot(along) / length; return s >= lo && s <= hi })
    return pts.length ? pts.reduce((a, v) => a.add(v), new THREE.Vector3()).divideScalar(pts.length) : null
  }
  const near = mean(0, 0.15), mid = mean(0.4, 0.6)
  return near && mid && mid.distanceTo(near) > 1e-6 ? mid.sub(near).normalize() : along
}

/** Each part's run of vertices and of triangle indices, once groupSpace has sorted them. */
function partRanges(g: THREE.BufferGeometry) {
  const p = g.getAttribute('_part'), index = g.getIndex()!
  const vertices: Partial<Record<AuthoredPart, { first: number; count: number }>> = {}
  const indices: Partial<Record<AuthoredPart, { indexFirst: number; indexCount: number }>> = {}
  for (let i = 0; i < p.count; i++) {
    const k = AUTHORED_PARTS[p.getX(i)]!
    const r = vertices[k] ?? (vertices[k] = { first: i, count: 0 })
    r.count++
  }
  for (let i = 0; i < index.count; i += 3) {
    const k = AUTHORED_PARTS[p.getX(index.getX(i))]!
    const r = indices[k] ?? (indices[k] = { indexFirst: i, indexCount: 0 })
    r.indexCount += 3
  }
  return { vertices, indices }
}

/** Where the plane y = 0 cuts the skin in the side view: its rearmost and frontmost x; 0, 0 if it misses. */
function waterSpan(g: THREE.BufferGeometry, run: { indexFirst: number; indexCount: number } | undefined): [number, number] {
  if (!run) return [0, 0]
  const pos = g.getAttribute('position'), index = g.getIndex()!
  let lo = Infinity, hi = -Infinity
  for (let i = run.indexFirst; i < run.indexFirst + run.indexCount; i += 3) {
    for (let k = 0; k < 3; k++) {
      const a = index.getX(i + k), b = index.getX(i + ((k + 1) % 3))
      const ya = pos.getY(a), yb = pos.getY(b)
      if ((ya < 0) === (yb < 0)) continue
      const x = pos.getX(a) + (pos.getX(b) - pos.getX(a)) * (ya / (ya - yb))
      lo = Math.min(lo, x); hi = Math.max(hi, x)
    }
  }
  return lo === Infinity ? [0, 0] : [lo, hi]
}

const builts = new Map<string, Built>()

/** Keep an authored species' Built, once its model has loaded, for every bird built of it. */
export function storeAuthored(code: string, built: Built): void {
  builts.set(code, built)
}

/** An authored species' Built; its model must have loaded (loadAuthored at startup, or the viewer's). */
export function authoredFor(spec: SpeciesSpec): Built {
  const b = builts.get(spec.code)
  if (!b) throw new Error(`${spec.code}: its model hasn't loaded (public/models/${spec.authored?.model}/)`)
  return b
}

/** True once an authored species' model has loaded. */
export function authoredReady(code: string): boolean {
  return builts.has(code)
}

export type { AuthoredSpec }

/** each version's maps, once loaded */
export interface AuthoredMaps { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture }
const maps = new Map<string, AuthoredMaps>()
const materials = new Map<string, THREE.MeshStandardMaterial>()
const versionOf = (spec: SpeciesSpec, variant?: string) => variant ?? spec.authored!.versions[0]!

/** Keep a version's maps, once loaded, for authoredMaterial. */
export function storeAuthoredMaps(code: string, version: string, m: AuthoredMaps): void {
  maps.set(`${code}:${version}`, m)
  materials.delete(`${code}:${version}`)
}

/**
 * One material per authored species and version, shared by every bird of that kind: its colour, normal, and roughness
 * maps. Without them (Node, where no image loads) a plain grey stands in, so the tests can build the bird.
 */
export function authoredMaterial(spec: SpeciesSpec, variant?: string): THREE.MeshStandardMaterial {
  const key = `${spec.code}:${versionOf(spec, variant)}`
  let mat = materials.get(key)
  if (!mat) {
    const m = maps.get(key)
    mat = m
      ? new THREE.MeshStandardMaterial({ map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap, roughness: 1, metalness: 0 })
      : new THREE.MeshStandardMaterial({ color: '#555555', roughness: 0.8, metalness: 0 })
    materials.set(key, mat)
  }
  return mat
}
