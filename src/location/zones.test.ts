import { pointInPolygon, randomPointInPolygon, polygonCentroid, clampToPolygon } from './zones'
import { makeRng } from '../catalog/rng'
import type { Vec2 } from './schema'

const square: Vec2[] = [[0, 0], [10, 0], [10, 10], [0, 10]]
const tri: Vec2[] = [[0, 0], [10, 0], [0, 10]]

describe('pointInPolygon', () => {
  it('detects inside and outside for a square', () => {
    expect(pointInPolygon(5, 5, square)).toBe(true)
    expect(pointInPolygon(-1, 5, square)).toBe(false)
    expect(pointInPolygon(5, 11, square)).toBe(false)
  })
  it('works on a triangle', () => {
    expect(pointInPolygon(2, 2, tri)).toBe(true)
    expect(pointInPolygon(8, 8, tri)).toBe(false)
  })
})

describe('randomPointInPolygon', () => {
  it('always returns a point inside', () => {
    const rng = makeRng(5)
    for (let i = 0; i < 200; i++) {
      const [x, z] = randomPointInPolygon(tri, rng)
      expect(pointInPolygon(x, z, tri)).toBe(true)
    }
  })
  it('is deterministic per seed', () => {
    expect(randomPointInPolygon(square, makeRng(2))).toEqual(randomPointInPolygon(square, makeRng(2)))
  })
})

describe('polygonCentroid and clampToPolygon', () => {
  it('centroid of the square is its centre', () => {
    expect(polygonCentroid(square)).toEqual([5, 5])
  })
  it('leaves inside points alone and pulls outside points in', () => {
    expect(clampToPolygon(3, 3, square)).toEqual([3, 3])
    const [x, z] = clampToPolygon(15, 5, square)
    expect(pointInPolygon(x, z, square)).toBe(true)
    expect(x).toBeGreaterThan(8)
  })
})
