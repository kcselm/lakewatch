import { dubinsPaths, pointAt, type Pose2 } from './flightPath'

const close = (a: Pose2, b: Pose2, eps = 1e-6) => {
  expect(a.x).toBeCloseTo(b.x, 6)
  expect(a.z).toBeCloseTo(b.z, 6)
  expect(Math.abs(Math.atan2(Math.sin(a.heading - b.heading), Math.cos(a.heading - b.heading)))).toBeLessThan(eps * 10)
}

describe('dubinsPaths', () => {
  const cases: [Pose2, Pose2, number][] = [
    [{ x: 0, z: 0, heading: 0 }, { x: 40, z: -10, heading: 1 }, 6],
    [{ x: 23.7, z: -48, heading: -Math.PI / 2 }, { x: -27.5, z: -17.5, heading: 2.13 }, 10],
    // a bird come up from the water 2.5 m out from its perch, facing out, flies round to land on it facing in
    [{ x: 0, z: -2.5, heading: Math.PI / 2 }, { x: 0, z: 0, heading: -Math.PI / 2 }, 3],
    [{ x: 5, z: 5, heading: 3 }, { x: 5.5, z: 5, heading: 3 }, 4],
  ]
  for (const [a, b, r] of cases) {
    it(`joins (${a.x}, ${a.z}) to (${b.x}, ${b.z}) at radius ${r}, ending exactly there, shortest first`, () => {
      const paths = dubinsPaths(a, b, r)
      expect(paths.length).toBeGreaterThan(0)
      for (const p of paths) {
        close(pointAt(p, 0), a)
        close(pointAt(p, p.length), b)
      }
      for (let i = 1; i < paths.length; i++) expect(paths[i]!.length).toBeGreaterThanOrEqual(paths[i - 1]!.length)
    })
  }
  it('turns no tighter than its radius, and its heading never jumps', () => {
    for (const p of dubinsPaths({ x: 0, z: 0, heading: 0 }, { x: -3, z: 8, heading: 2 }, 5)) {
      let prev = pointAt(p, 0)
      for (let s = 0.05; s <= p.length; s += 0.05) {
        const q = pointAt(p, s)
        const turn = Math.atan2(Math.sin(q.heading - prev.heading), Math.cos(q.heading - prev.heading))
        expect(Math.abs(turn)).toBeLessThanOrEqual(0.05 / 5 + 1e-9)
        expect(Math.abs(q.curvature)).toBeLessThanOrEqual(1 / 5 + 1e-12)
        // it moves along the way it faces: heading 0 is +x, counter-clockwise from above
        expect(q.x - prev.x).toBeCloseTo(0.05 * Math.cos((q.heading + prev.heading) / 2), 3)
        expect(q.z - prev.z).toBeCloseTo(-0.05 * Math.sin((q.heading + prev.heading) / 2), 3)
        prev = q
      }
    }
  })
})
