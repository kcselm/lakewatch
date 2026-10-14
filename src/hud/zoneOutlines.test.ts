import * as THREE from 'three'
import { zoneSegments, createZoneOutlines } from './zoneOutlines'
import type { Location } from '../location/schema'

const ground = (x: number, _z: number) => (x < 0 ? -2 : 1)

describe('zoneSegments', () => {
  it('traces a polygon edge by edge, closed, just above the ground or the water', () => {
    const s = zoneSegments({ kind: 'polygon', points: [[-5, 0], [5, 0], [5, 5], [-5, 5]] }, ground)
    expect(s).toHaveLength(4)
    expect(s[3]![1]).toEqual(s[0]![0])                       // closes
    expect(s[0]![0]).toEqual([-5, 0.05, 0])                  // under water: 0.05 above the surface
    expect(s[0]![1]).toEqual([5, 1.05, 0])                   // on land: 0.05 above the ground
  })
  it('marks a point with a three-axis cross', () => {
    const s = zoneSegments({ kind: 'point', position: [1, 2, 3] }, ground)
    expect(s).toHaveLength(3)
    expect(s[0]).toEqual([[0.5, 2, 3], [1.5, 2, 3]])
    expect(s[2]).toEqual([[1, 1.5, 3], [1, 2.5, 3]])
  })
  it('marks each perch with a cross at its point and a tick the way it faces', () => {
    const s = zoneSegments({
      kind: 'perches', perches: [
        { name: 'a', on: 'branch', position: [1, 3], height: 2, radius: 0.02, facing: 90 },
        { name: 'b', on: 'snag', position: [-4, -6], height: 4, radius: 0.05, facing: 0 },
      ],
    }, ground)
    expect(s).toHaveLength(8)
    expect(s[0]).toEqual([[0.5, 2, 3], [1.5, 2, 3]])
    expect(s[3]![0]).toEqual([1, 2, 3])
    expect(s[3]![1][0]).toBeCloseTo(2, 9)                    // facing 90: toward +x
    expect(s[3]![1][2]).toBeCloseTo(3, 9)
    expect(s[7]![1][0]).toBeCloseTo(-4, 9)                   // facing 0: toward -z
    expect(s[7]![1][2]).toBeCloseTo(-7, 9)
  })
  it('draws a lane as its altitude band', () => {
    const s = zoneSegments({ kind: 'lane', from: [-10, 0, -20], to: [10, 0, -20], altitude: [40, 80] }, ground)
    expect(s).toHaveLength(4)
    expect(s[0]).toEqual([[-10, 40, -20], [10, 40, -20]])
    expect(s[1]).toEqual([[-10, 80, -20], [10, 80, -20]])
  })
})

describe('createZoneOutlines', () => {
  it('builds one hidden LineSegments per zone, named after it', () => {
    const loc = {
      zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] }, snag: { kind: 'point', position: [1, 2, 3] } },
    } as unknown as Location
    const o = createZoneOutlines(loc, ground)
    expect(o.object.visible).toBe(false)
    expect(o.object.children.map(c => c.name).sort()).toEqual(['zone:snag', 'zone:w'])
    expect(o.object.children.every(c => c instanceof THREE.LineSegments)).toBe(true)
    o.setVisible(true)
    expect(o.object.visible).toBe(true)
  })
})
