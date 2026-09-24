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
