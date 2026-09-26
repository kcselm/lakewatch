import * as THREE from 'three'
import { BONE_INDEX, type BoneName } from './rig'
import { atlasUV } from '../paint/atlas'
import type { Part } from './spec'

/** Up to four bone influences; weights should sum to 1. */
export type Weights = readonly (readonly [BoneName, number])[]

/** Collects vertices (position, atlas uv, skinning) and triangles for one skinned geometry. */
export class Mesher {
  private readonly pos: number[] = []
  private readonly uv: number[] = []
  private readonly skinIndex: number[] = []
  private readonly skinWeight: number[] = []
  private readonly index: number[] = []
  /** part of every vertex, for measurement and tests */
  readonly parts: Part[] = []

  get count(): number { return this.pos.length / 3 }
  get indexCount(): number { return this.index.length }

  vertex(p: THREE.Vector3, part: Part, s: number, t: number, weights: Weights): number {
    if (weights.length === 0 || weights.length > 4) throw new Error(`a vertex needs 1 to 4 bone weights, got ${weights.length}`)
    const [u, v] = atlasUV(part, s, t)
    this.pos.push(p.x, p.y, p.z)
    this.uv.push(u, v)
    for (let k = 0; k < 4; k++) {
      const w = weights[k]
      this.skinIndex.push(w ? BONE_INDEX[w[0]] : 0)
      this.skinWeight.push(w ? w[1] : 0)
    }
    this.parts.push(part)
    return this.count - 1
  }

  /** a, b, c counter-clockwise seen from the side the face should show */
  tri(a: number, b: number, c: number): void { this.index.push(a, b, c) }

  /** a, b, c, d counter-clockwise seen from the side the face should show */
  quad(a: number, b: number, c: number, d: number): void { this.tri(a, b, c); this.tri(a, c, d) }

  /** Vertex position by index. */
  position(i: number, target = new THREE.Vector3()): THREE.Vector3 {
    return target.set(this.pos[i * 3]!, this.pos[i * 3 + 1]!, this.pos[i * 3 + 2]!)
  }

  /**
   * Where the horizontal plane at height `y` cuts the triangles from index `indexFirst` for `indexCount` indices: its
   * x extent, the side view's length at that height. Null if the plane misses them.
   */
  spanAtHeight(y: number, indexFirst: number, indexCount: number): [number, number] | null {
    let lo = Infinity, hi = -Infinity
    for (let i = indexFirst; i < indexFirst + indexCount; i += 3) {
      for (let k = 0; k < 3; k++) {
        const a = this.index[i + k]!, b = this.index[i + ((k + 1) % 3)]!
        const ya = this.pos[a * 3 + 1]! - y, yb = this.pos[b * 3 + 1]! - y
        if (ya < 0 === yb < 0) continue
        const xa = this.pos[a * 3]!, xb = this.pos[b * 3]!
        const x = xa + ((xb - xa) * ya) / (ya - yb)
        lo = Math.min(lo, x); hi = Math.max(hi, x)
      }
    }
    return lo <= hi ? [lo, hi] : null
  }

  /** Move every vertex (the builder authors in the profile frame, then shifts into group space). */
  translate(offset: THREE.Vector3): void {
    for (let i = 0; i < this.pos.length; i += 3) {
      this.pos[i]! += offset.x
      this.pos[i + 1]! += offset.y
      this.pos[i + 2]! += offset.z
    }
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.skinIndex, 4))
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.skinWeight, 4))
    g.setIndex(this.index)
    g.computeVertexNormals()
    return g
  }
}

/**
 * A closed tapered tube from a to b (radius ra at a, rb at b), capped at both ends, every face outward.
 * Returns the index range it added, for volume checks.
 */
export function tube(
  m: Mesher, a: THREE.Vector3, b: THREE.Vector3, ra: number, rb: number,
  part: Part, s: number, t: number, weights: Weights, radial = 6,
): { indexFirst: number; indexCount: number } {
  const indexFirst = m.indexCount
  const w = b.clone().sub(a).normalize()
  const ref = Math.abs(w.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)
  const u1 = w.clone().cross(ref).normalize()
  const u2 = w.clone().cross(u1)          // (u1, u2, w) is right-handed
  const ringAt = (c: THREE.Vector3, r: number) => {
    const out: number[] = []
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2
      const p = c.clone().addScaledVector(u1, Math.cos(th) * r).addScaledVector(u2, Math.sin(th) * r)
      out.push(m.vertex(p, part, s, t, weights))
    }
    return out
  }
  const ra_ = ringAt(a, ra), rb_ = ringAt(b, rb)
  for (let j = 0; j < radial; j++) {
    const j1 = (j + 1) % radial
    m.quad(ra_[j]!, ra_[j1]!, rb_[j1]!, rb_[j]!)
  }
  const ca = m.vertex(a, part, s, t, weights), cb = m.vertex(b, part, s, t, weights)
  for (let j = 0; j < radial; j++) {
    const j1 = (j + 1) % radial
    m.tri(ca, ra_[j1]!, ra_[j]!)
    m.tri(cb, rb_[j]!, rb_[j1]!)
  }
  return { indexFirst, indexCount: m.indexCount - indexFirst }
}

/**
 * A closed tube swept along `points` (at least two), `radius` at each point, capped at both ends, every face outward.
 * Its rings turn with the path, so it can curl. Texture s runs along it (0..1) at t 0.5.
 */
export function sweep(m: Mesher, points: THREE.Vector3[], radius: number[], part: Part, weights: Weights, radial = 6): { indexFirst: number; indexCount: number } {
  const indexFirst = m.indexCount
  const rings: number[][] = []
  let u1 = new THREE.Vector3()
  points.forEach((c, i) => {
    const w = points[Math.min(i + 1, points.length - 1)]!.clone().sub(points[Math.max(i - 1, 0)]!).normalize()
    // carry the ring's frame along the path so it never twists
    if (i === 0) u1 = w.clone().cross(Math.abs(w.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)).normalize()
    else u1.addScaledVector(w, -u1.dot(w)).normalize()
    const u2 = w.clone().cross(u1)
    const row: number[] = []
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2
      const p = c.clone().addScaledVector(u1, Math.cos(th) * radius[i]!).addScaledVector(u2, Math.sin(th) * radius[i]!)
      row.push(m.vertex(p, part, i / (points.length - 1), 0.5, weights))
    }
    rings.push(row)
  })
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const j1 = (j + 1) % radial
      m.quad(rings[i]![j]!, rings[i]![j1]!, rings[i + 1]![j1]!, rings[i + 1]![j]!)
    }
  }
  const ca = m.vertex(points[0]!, part, 0, 0.5, weights), cb = m.vertex(points.at(-1)!, part, 1, 0.5, weights)
  for (let j = 0; j < radial; j++) {
    const j1 = (j + 1) % radial
    m.tri(ca, rings[0]![j1]!, rings[0]![j]!)
    m.tri(cb, rings.at(-1)![j]!, rings.at(-1)![j1]!)
  }
  return { indexFirst, indexCount: m.indexCount - indexFirst }
}

/**
 * A thin closed lens over a grid of a (along) by b (across), both 0..1: two faces, each `bulge(a, b)` off the middle
 * surface `at(a, b)` along the unit normal `n`, which meet wherever the bulge is 0 (it must be, all round the grid's
 * edge). Every face outward.
 */
export function lens(
  m: Mesher, S: number, T: number, at: (a: number, b: number) => THREE.Vector3, bulge: (a: number, b: number) => number,
  n: THREE.Vector3, part: Part, weights: Weights,
): { indexFirst: number; indexCount: number } {
  const indexFirst = m.indexCount
  // the winding that faces +n: which way the grid turns about n
  const da = at(0.6, 0.5).sub(at(0.4, 0.5)), db = at(0.5, 0.6).sub(at(0.5, 0.4))
  const turn = da.cross(db).dot(n) > 0
  for (const side of [1, -1]) {
    const grid: number[][] = []
    for (let i = 0; i < S; i++) {
      const row: number[] = []
      for (let j = 0; j < T; j++) {
        const a = i / (S - 1), b = j / (T - 1)
        row.push(m.vertex(at(a, b).addScaledVector(n, side * bulge(a, b)), part, a, b, weights))
      }
      grid.push(row)
    }
    for (let i = 0; i < S - 1; i++) {
      for (let j = 0; j < T - 1; j++) {
        const q = [grid[i]![j]!, grid[i + 1]![j]!, grid[i + 1]![j + 1]!, grid[i]![j + 1]!] as const
        if (turn === side > 0) m.quad(q[0], q[1], q[2], q[3])
        else m.quad(q[0], q[3], q[2], q[1])
      }
    }
  }
  return { indexFirst, indexCount: m.indexCount - indexFirst }
}

/** Signed volume of a closed triangle mesh; positive when every face points outward. */
export function signedVolume(g: THREE.BufferGeometry, first = 0, count?: number): number {
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const idx = g.getIndex()!
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const end = count === undefined ? idx.count : first + count
  let v = 0
  for (let i = first; i < end; i += 3) {
    a.fromBufferAttribute(pos, idx.getX(i))
    b.fromBufferAttribute(pos, idx.getX(i + 1))
    c.fromBufferAttribute(pos, idx.getX(i + 2))
    v += a.dot(b.clone().cross(c)) / 6
  }
  return v
}
