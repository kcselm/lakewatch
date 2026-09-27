import * as THREE from 'three'
import { SPECIES } from '../species'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { BONE_INDEX } from './rig'
import { GAP } from './wing'

/** how far along its normal a point on the wing looks for the loft, each way, metres */
const REACH = 0.05

/**
 * Where the line through p along d first crosses triangle (a, b, c), as a multiple of d (either sign); NaN if it
 * misses. Moller-Trumbore, both faces.
 */
function crossing(p: ArrayLike<number>, d: ArrayLike<number>, t: Float64Array, k: number): number {
  const ax = t[k]!, ay = t[k + 1]!, az = t[k + 2]!
  const e1x = t[k + 3]! - ax, e1y = t[k + 4]! - ay, e1z = t[k + 5]! - az
  const e2x = t[k + 6]! - ax, e2y = t[k + 7]! - ay, e2z = t[k + 8]! - az
  const px = d[1]! * e2z - d[2]! * e2y, py = d[2]! * e2x - d[0]! * e2z, pz = d[0]! * e2y - d[1]! * e2x
  const det = e1x * px + e1y * py + e1z * pz
  if (Math.abs(det) < 1e-18) return NaN
  const tx = p[0]! - ax, ty = p[1]! - ay, tz = p[2]! - az
  const u = (tx * px + ty * py + tz * pz) / det
  if (u < 0 || u > 1) return NaN
  const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x
  const v = (d[0]! * qx + d[1]! * qy + d[2]! * qz) / det
  if (v < 0 || u + v > 1) return NaN
  return (e2x * qx + e2y * qy + e2z * qz) / det
}

interface Clearance {
  /** metres: how far the loft lies behind the wing along its outward normal; negative where the loft stands outside it */
  gap: number
  /** where on the wing, group space at rest */
  at: THREE.Vector3
}

/**
 * The folded wings' true clearance from the loft, at rest: at points spread over the inside of each of the wings'
 * triangles (K + 1 along each edge), the nearest crossing of the loft along the line through the point square to the
 * triangle, behind it (positive) or in front (negative). Points whose line meets no loft within REACH, where the wing
 * lies off the body (over the rump and the tail), give none. A triangle with no area (a wing with no height) has none.
 */
function foldClearances(m: DetailedBirdModel, K = 4): Clearance[] {
  const g = m.mesh.geometry
  const pos = (g.getAttribute('position') as THREE.BufferAttribute).array
  const bone = g.getAttribute('skinIndex') as THREE.BufferAttribute
  const index = g.getIndex()!.array
  const loft = m.anatomy.closed.find(c => c.name === 'loft')!
  // the loft's triangles, and each one's box
  const n = loft.indexCount / 3
  const tris = new Float64Array(n * 9), box = new Float64Array(n * 6)
  for (let f = 0; f < n; f++) {
    for (let v = 0; v < 3; v++) for (let a = 0; a < 3; a++) tris[f * 9 + v * 3 + a] = pos[index[loft.indexFirst + f * 3 + v]! * 3 + a]!
    for (let a = 0; a < 3; a++) {
      box[f * 6 + a] = Math.min(tris[f * 9 + a]!, tris[f * 9 + 3 + a]!, tris[f * 9 + 6 + a]!)
      box[f * 6 + 3 + a] = Math.max(tris[f * 9 + a]!, tris[f * 9 + 3 + a]!, tris[f * 9 + 6 + a]!)
    }
  }
  const folded = (i: number) => bone.getX(i) === BONE_INDEX.wingFoldR || bone.getX(i) === BONE_INDEX.wingFoldL
  const at = (i: number) => new THREE.Vector3(pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!)
  const out: Clearance[] = []
  const p = [0, 0, 0], d = [0, 0, 0]
  for (let f = 0; f < index.length; f += 3) {
    const ia = index[f]!, ib = index[f + 1]!, ic = index[f + 2]!
    if (!folded(ia) || !folded(ib) || !folded(ic)) continue
    const a = at(ia), b = at(ib), c = at(ic)
    const normal = b.clone().sub(a).cross(c.clone().sub(a))
    if (normal.length() < 1e-10) continue
    normal.normalize()
    d[0] = normal.x; d[1] = normal.y; d[2] = normal.z
    for (let i = 0; i <= K; i++) {
      for (let j = 0; j <= K - i; j++) {
        const wb = i / K, wc = j / K, wa = 1 - wb - wc
        p[0] = wa * a.x + wb * b.x + wc * c.x; p[1] = wa * a.y + wb * b.y + wc * c.y; p[2] = wa * a.z + wb * b.z + wc * c.z
        let near = NaN
        for (let t = 0; t < n; t++) {
          let clear = false
          for (let k = 0; k < 3 && !clear; k++) {
            const r = Math.abs(d[k]!) * REACH
            clear = p[k]! + r < box[t * 6 + k]! || p[k]! - r > box[t * 6 + 3 + k]!
          }
          if (clear) continue
          const l = crossing(p, d, tris, t * 9)
          if (Math.abs(l) <= REACH && !(Math.abs(l) >= Math.abs(near))) near = l
        }
        if (!Number.isNaN(near)) out.push({ gap: -near, at: new THREE.Vector3(p[0], p[1], p[2]) })
      }
    }
  }
  return out
}

describe('the folded wing', () => {
  for (const spec of Object.values(SPECIES).filter(s => s.detail)) {
    it(`${spec.code}: clears the body's skin by GAP everywhere on its surface, at rest`, () => {
      const c = foldClearances(buildDetailedBird(spec))
      expect(c.length).toBeGreaterThan(500)
      const worst = c.reduce((w, x) => (x.gap < w.gap ? x : w))
      const where = `at (${worst.at.toArray().map(v => (v * 1000).toFixed(1)).join(', ')}) mm`
      expect(worst.gap * 1000, where).toBeGreaterThanOrEqual((GAP - 0.0001) * 1000)
    })
  }
})
