import * as THREE from 'three'
import type { ScenePalette } from './palette'
import { sunDirection } from './sky'

export function createLighting(palette: ScenePalette) {
  const object = new THREE.Group()
  const sun = new THREE.DirectionalLight(new THREE.Color(palette.sun), 2.6)
  sun.position.copy(sunDirection(palette)).multiplyScalar(120)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -60
  sun.shadow.camera.right = 60
  sun.shadow.camera.top = 60
  sun.shadow.camera.bottom = -60
  sun.shadow.camera.near = 10
  sun.shadow.camera.far = 300
  sun.shadow.bias = -0.0005
  object.add(sun, sun.target)

  const hemi = new THREE.HemisphereLight(new THREE.Color(palette.ambientSky), new THREE.Color(palette.ambientGround), 0.9)
  object.add(hemi)

  return { sun, hemi, object, update() {} }
}
