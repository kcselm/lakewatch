import * as THREE from 'three'
import type { DetailedBirdModel } from './build'
import { BONE_INDEX } from './rig'

/** The flight wing's vertices where the model's last pose() put them, group space, each with its side and face. */
export function flightWingNow(m: DetailedBirdModel): { i: number; p: THREE.Vector3; right: boolean }[] {
  const a = m.anatomy.flightWing!
  const built = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
  m.group.updateMatrixWorld(true)
  return Array.from({ length: a.count }, (_, k) => {
    const i = a.first + k
    return { i, p: m.mesh.getVertexPosition(i, new THREE.Vector3()), right: built.getZ(i) > 0 }
  })
}

/** The folded wing's vertices where the model's last pose() put them, group space: those on the wingFold bones. */
export function foldedWingNow(m: DetailedBirdModel): { p: THREE.Vector3; right: boolean }[] {
  const g = m.mesh.geometry
  const skinIndex = g.getAttribute('skinIndex'), skinWeight = g.getAttribute('skinWeight')
  m.group.updateMatrixWorld(true)
  const out: { p: THREE.Vector3; right: boolean }[] = []
  for (let i = 0; i < skinIndex.count; i++) {
    const bone = skinIndex.getComponent(i, 0)
    if (skinWeight.getComponent(i, 0) !== 1 || (bone !== BONE_INDEX.wingFoldR && bone !== BONE_INDEX.wingFoldL)) continue
    out.push({ p: m.mesh.getVertexPosition(i, new THREE.Vector3()), right: bone === BONE_INDEX.wingFoldR })
  }
  return out
}

/** The triangles of one of the model's closed sub-meshes (anatomy.closed) as its last pose() left them, group space. */
export function posedTriangles(m: DetailedBirdModel, name: string): THREE.Triangle[] {
  const part = m.anatomy.closed.find(c => c.name === name)
  if (!part) throw new Error(`no closed part ${name}`)
  const index = m.mesh.geometry.getIndex()!.array
  m.group.updateMatrixWorld(true)
  const at = new Map<number, THREE.Vector3>()
  const v = (i: number) => {
    let p = at.get(i)
    if (!p) { p = m.mesh.getVertexPosition(i, new THREE.Vector3()); at.set(i, p) }
    return p
  }
  const out: THREE.Triangle[] = []
  for (let f = part.indexFirst; f < part.indexFirst + part.indexCount; f += 3) out.push(new THREE.Triangle(v(index[f]!), v(index[f + 1]!), v(index[f + 2]!)))
  return out
}

/** a direction no face of a bird's loft lies along */
const RAY = new THREE.Vector3(0.5773, 0.5812, 0.5735).normalize()

/**
 * How deep each point lies inside the closed mesh `tris`, metres: 0 outside it (an even number of crossings along a
 * ray), else its distance to the nearest face.
 */
export function depthInside(tris: THREE.Triangle[], points: THREE.Vector3[]): number[] {
  const box = new THREE.Box3()
  for (const t of tris) box.expandByPoint(t.a).expandByPoint(t.b).expandByPoint(t.c)
  const ray = new THREE.Ray(), hit = new THREE.Vector3(), near = new THREE.Vector3()
  return points.map(p => {
    if (!box.containsPoint(p)) return 0
    ray.set(p, RAY)
    let crossings = 0
    for (const t of tris) if (ray.intersectTriangle(t.a, t.b, t.c, false, hit)) crossings++
    if (crossings % 2 === 0) return 0
    let d = Infinity
    for (const t of tris) d = Math.min(d, t.closestPointToPoint(p, near).distanceTo(p))
    return d
  })
}

/** The farthest any point of `from` lies from the nearest point of the triangles `to`, metres. */
export function farthestFrom(from: THREE.Vector3[], to: THREE.Triangle[]): number {
  const near = new THREE.Vector3()
  let worst = 0
  for (const p of from) {
    let d = Infinity
    for (const t of to) d = Math.min(d, t.closestPointToPoint(p, near).distanceTo(p))
    worst = Math.max(worst, d)
  }
  return worst
}
