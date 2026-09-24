import * as THREE from 'three'
import type { Location, Zone, Vec3 } from '../location/schema'

export type Segment = [Vec3, Vec3]

/** Line segments that trace a zone: a polygon's edges on the ground, a cross at a point, a lane's altitude band. */
export function zoneSegments(zone: Zone, ground: (x: number, z: number) => number): Segment[] {
  const lift = (x: number, z: number): Vec3 => [x, Math.max(ground(x, z), 0) + 0.05, z]
  if (zone.kind === 'polygon') {
    return zone.points.map((p, i) => {
      const q = zone.points[(i + 1) % zone.points.length]!
      return [lift(p[0], p[1]), lift(q[0], q[1])] as Segment
    })
  }
  if (zone.kind === 'point') {
    const [x, y, z] = zone.position
    return [
      [[x - 0.5, y, z], [x + 0.5, y, z]],
      [[x, y, z - 0.5], [x, y, z + 0.5]],
      [[x, y - 0.5, z], [x, y + 0.5, z]],
    ]
  }
  const [lo, hi] = zone.altitude
  const at = (p: Vec3, y: number): Vec3 => [p[0], y, p[2]]
  return [
    [at(zone.from, lo), at(zone.to, lo)],
    [at(zone.from, hi), at(zone.to, hi)],
    [at(zone.from, lo), at(zone.from, hi)],
    [at(zone.to, lo), at(zone.to, hi)],
  ]
}

/** Yellow outlines of every zone, hidden until the dev overlay shows them. Drawn over everything. */
export function createZoneOutlines(loc: Location, ground: (x: number, z: number) => number): { object: THREE.Group; setVisible(v: boolean): void } {
  const object = new THREE.Group()
  object.visible = false
  const mat = new THREE.LineBasicMaterial({ color: '#ffdd55', depthTest: false })
  for (const [name, zone] of Object.entries(loc.zones)) {
    const pts: number[] = []
    for (const [a, b] of zoneSegments(zone, ground)) pts.push(...a, ...b)
    const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const lines = new THREE.LineSegments(geo, mat)
    lines.name = `zone:${name}`
    lines.renderOrder = 100
    object.add(lines)
  }
  return { object, setVisible(v) { object.visible = v } }
}
