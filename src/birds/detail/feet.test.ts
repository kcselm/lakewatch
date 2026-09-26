import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { signedVolume } from './mesher'
import { TEST_SPEC, TEST_DETAIL, TEST_SWIM_SPEC, TEST_SWIM_DETAIL } from './fixture'
import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import type { DetailSpec } from './spec'

const withDetail = (spec: SpeciesSpec, patch: Partial<DetailSpec>) => buildDetailedBird(parseSpeciesSpec({ ...spec, detail: { ...spec.detail!, ...patch } }))

/**
 * Whether the triangles in an index range close up: every edge (between distinct points) is met once each way. Points
 * are matched by position, so separate pieces that share a rim, as a lens's two faces do, count as joined.
 */
function isClosed(g: THREE.BufferGeometry, first: number, count: number): boolean {
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const idx = g.getIndex()!
  const key = (i: number) => [pos.getX(i), pos.getY(i), pos.getZ(i)].map(v => Math.round(v * 1e7)).join(',')
  const edges = new Map<string, number>()
  for (let t = first; t < first + count; t += 3) {
    for (let k = 0; k < 3; k++) {
      const a = key(idx.getX(t + k)), b = key(idx.getX(t + ((k + 1) % 3)))
      if (a !== b) edges.set(`${a}|${b}`, (edges.get(`${a}|${b}`) ?? 0) + 1)
    }
  }
  for (const [e, n] of edges) {
    const [a, b] = e.split('|')
    if ((edges.get(`${b}|${a}`) ?? 0) !== n) return false
  }
  return true
}
const feet = (m: DetailedBirdModel) => m.anatomy.closed.filter(c => c.name === 'footR' || c.name === 'footL')
/** the points of one foot's range, in the plane its toes spread in: along the middle toe and across it */
function spread(m: DetailedBirdModel, name: string) {
  const c = m.anatomy.closed.find(x => x.name === name)!
  const pos = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
  const idx = m.mesh.geometry.getIndex()!
  const pts: THREE.Vector3[] = []
  for (let t = c.indexFirst; t < c.indexFirst + c.indexCount; t++) pts.push(new THREE.Vector3().fromBufferAttribute(pos, idx.getX(t)))
  return pts
}

describe('feet', () => {
  it('are plain toes without a feet type: no web, no lobes', () => {
    expect(feet(buildDetailedBird(TEST_SPEC))).toHaveLength(0)
    expect(feet(buildDetailedBird(TEST_SWIM_SPEC))).toHaveLength(0)
  })
  for (const kind of ['webbed', 'lobed'] as const) {
    it(`builds ${kind} feet as closed, outward-facing meshes, standing or swimming`, () => {
      for (const spec of [TEST_SPEC, TEST_SWIM_SPEC]) {
        const m = withDetail(spec, { feet: kind })
        expect(feet(m).map(c => c.name)).toEqual(['footR', 'footL'])
        for (const c of feet(m)) {
          expect(isClosed(m.mesh.geometry, c.indexFirst, c.indexCount), `${spec.code} ${c.name}`).toBe(true)
          expect(signedVolume(m.mesh.geometry, c.indexFirst, c.indexCount), `${spec.code} ${c.name}`).toBeGreaterThan(0)
        }
      }
    })
  }
  it('webs the three front toes: the membrane covers the ground between them, most of the way to their tips', () => {
    const toe = TEST_DETAIL.measurements.toe
    /** whether any triangle of the right foot covers the point (x, z) of the ground, seen from above */
    const covers = (m: DetailedBirdModel, x: number, z: number) => {
      const c = m.anatomy.closed.find(e => e.name === 'footR')!
      const pos = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute, idx = m.mesh.geometry.getIndex()!
      for (let t = c.indexFirst; t < c.indexFirst + c.indexCount; t += 3) {
        const [a, b, d] = [0, 1, 2].map(k => new THREE.Vector2(pos.getX(idx.getX(t + k)), pos.getZ(idx.getX(t + k))))
        const side = (p: THREE.Vector2, q: THREE.Vector2) => (q.x - p.x) * (z - p.y) - (q.y - p.y) * (x - p.x)
        const s1 = side(a!, b!), s2 = side(b!, d!), s3 = side(d!, a!)
        if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) return true
      }
      return false
    }
    // standing, the right foot's toes spread over the ground 0.45 rad apart: points midway between two toes, half and
    // seven-tenths of a toe out, are under the web and clear of any lobe
    const webbed = withDetail(TEST_SPEC, { feet: 'webbed' }), lobed = withDetail(TEST_SPEC, { feet: 'lobed' })
    for (const angle of [-0.225, 0.225]) {
      for (const out of [0.5, 0.7]) {
        const x = webbed.anatomy.foot.x + Math.cos(angle) * out * toe, z = webbed.anatomy.foot.z + Math.sin(angle) * out * toe
        expect(covers(webbed, x, z), `webbed ${angle} ${out}`).toBe(true)
        expect(covers(lobed, x, z), `lobed ${angle} ${out}`).toBe(false)
      }
    }
  })
  it("lobes each toe to the given width: the Coot's middle toe 10 mm across its lobes (research sections 5.5 and 9)", () => {
    const m = withDetail(TEST_SPEC, { feet: 'lobed', lobeWidth: 0.01 })
    const foot = m.anatomy.foot
    // out along the middle toe (straight forward from the foot, standing), past the shorter toes' tips, how far either
    // side its last lobe reaches
    const middle = spread(m, 'footR').filter(p => p.x > foot.x + 0.78 * TEST_DETAIL.measurements.toe)
    const width = Math.max(...middle.map(p => p.z)) - Math.min(...middle.map(p => p.z))
    expect(width).toBeGreaterThan(0.0095)
    expect(width).toBeLessThan(0.0105)
  })
})
