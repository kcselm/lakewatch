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
