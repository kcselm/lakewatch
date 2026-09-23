import * as THREE from 'three'
import { paintByDirection } from './paint'

describe('paintByDirection', () => {
  it('colors upward-facing vertices with top and downward with bottom', () => {
    const geo = new THREE.SphereGeometry(1, 8, 8)
    paintByDirection(geo, { top: '#ff0000', side: '#00ff00', bottom: '#0000ff' })
    const col = geo.getAttribute('color') as THREE.BufferAttribute
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    let topIdx = -1, botIdx = -1
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0.99) topIdx = i
      if (pos.getY(i) < -0.99) botIdx = i
    }
    expect(col.getX(topIdx)).toBeCloseTo(1)
    expect(col.getZ(botIdx)).toBeCloseTo(1)
  })
})
