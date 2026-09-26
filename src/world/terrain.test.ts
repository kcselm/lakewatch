import * as THREE from 'three'
import { lakeHeightfield, BENCH } from './heightfield'
import { createTerrain, terrainSurface } from './terrain'

describe('terrainSurface', () => {
  const hf = lakeHeightfield(7)
  const mesh = createTerrain(hf).object
  mesh.updateMatrixWorld(true)
  const ray = new THREE.Raycaster()
  const rendered = (x: number, z: number) => {
    ray.set(new THREE.Vector3(x, 50, z), new THREE.Vector3(0, -1, 0))
    return ray.intersectObject(mesh)[0]!.point.y
  }
  const surface = terrainSurface(hf)

  it('is the height of the rendered mesh, not of the smooth field it samples', () => {
    // the mudflat and shallows, where the lake's rim runs through, and a scatter across the scene
    const points: [number, number][] = []
    for (let x = 17; x <= 24; x += 0.37) for (let z = -10.6; z <= -6; z += 0.29) points.push([x, z])
    for (let i = 0; i < 200; i++) points.push([-60 + ((i * 37) % 120) + 0.13, -120 + ((i * 53) % 150) + 0.71])
    for (const [x, z] of points) expect(surface.sample(x, z), `(${x}, ${z})`).toBeCloseTo(rendered(x, z), 6)
  }, 30_000)   // about 460 rays against the 80,000-triangle terrain: past the 5 s default in a busy full run
  it('renders the dowitcher bench flat: its top covers whole cells of the mesh', () => {
    for (let x = BENCH.x[0]; x <= BENCH.x[1]; x += 0.25) {
      for (let z = BENCH.z[0]; z <= BENCH.z[1]; z += 0.25) expect(surface.sample(x, z), `(${x}, ${z})`).toBeCloseTo(-BENCH.depth, 6)
    }
  })
  it('matches the smooth field at the mesh vertices', () => {
    for (const [x, z] of [[20, -8], [0, 0], [-30, -40]] as const) expect(surface.sample(x, z)).toBeCloseTo(hf.sample(x, z), 9)
  })
  it('is where the mudflat birds meet the ground the player sees: up to 11 cm off the smooth field there', () => {
    let worst = 0
    for (let x = 17; x <= 23; x += 0.25) for (let z = -8.5; z <= -6; z += 0.25) worst = Math.max(worst, Math.abs(surface.sample(x, z) - hf.sample(x, z)))
    expect(worst).toBeGreaterThan(0.05)
  })
})
