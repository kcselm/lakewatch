import * as THREE from 'three'

export interface DirectionColors { top: string; side: string; bottom: string; front?: string; back?: string }

/**
 * Vertex-colors a geometry by the direction of each vertex from the origin:
 * up -> top, down -> bottom, sideways -> side, with optional front (+x) and
 * back (-x) tints. Smooth blends give the soft-edged plumage blocks the art
 * direction wants without any texture.
 */
export function paintByDirection(geo: THREE.BufferGeometry, c: DirectionColors): void {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const top = new THREE.Color(c.top), side = new THREE.Color(c.side), bottom = new THREE.Color(c.bottom)
  const front = c.front ? new THREE.Color(c.front) : null
  const back = c.back ? new THREE.Color(c.back) : null
  const out = new Float32Array(pos.count * 3)
  const n = new THREE.Vector3()
  const col = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize()
    const up = THREE.MathUtils.smoothstep(n.y, -0.15, 0.55)
    const down = THREE.MathUtils.smoothstep(-n.y, 0.05, 0.6)
    col.copy(side).lerp(top, up).lerp(bottom, down)
    if (front) col.lerp(front, THREE.MathUtils.smoothstep(n.x, 0.55, 0.95))
    if (back) col.lerp(back, THREE.MathUtils.smoothstep(-n.x, 0.55, 0.95))
    out.set([col.r, col.g, col.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(out, 3))
}

export function paintSolid(geo: THREE.BufferGeometry, color: string): void {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const c = new THREE.Color(color)
  const out = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) out.set([c.r, c.g, c.b], i * 3)
  geo.setAttribute('color', new THREE.BufferAttribute(out, 3))
}
