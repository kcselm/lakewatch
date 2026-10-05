import * as THREE from 'three'
import type { ScatterPoint } from './scatter'
import { GUST_FRONT_GLSL, type Wind } from './wind'
import type { WorldModule } from './scene'

const swayChunk = /* glsl */ `
  uniform vec2 uWindDir; uniform float uWindStrength; uniform float uWindGust; uniform float uTime;
  attribute float aPhase;
  attribute float aTint;
  varying float vTint;
${GUST_FRONT_GLSL}
`

const swayVertex = /* glsl */ `
  vTint = aTint;
  vec4 worldPos = instanceMatrix * vec4(transformed, 1.0);
  float t = clamp(position.y / 1.0, 0.0, 1.0);           // 0 at root, 1 at tip (blade height is 1 before instance scale)
  float bend = t * t;
  // Gust front travels downwind across the bed
  float front = gustFront(worldPos.xz, aPhase);
  float wind = uWindStrength * (0.5 + 0.5 * uWindGust * front);
  float flutter = sin(uTime * 3.0 + aPhase) * 0.05 * (0.3 + wind);
  vec2 lean = uWindDir * (wind * 0.9 * bend) + vec2(flutter * bend);
  transformed.xz += lean;
  transformed.y -= length(lean) * 0.35 * bend;
`

function bladeGeometry(height: number, width: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(width, height, 1, 4)
  g.translate(0, height / 2, 0)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / height
    pos.setX(i, pos.getX(i) * (1 - t * 0.85))   // taper to the tip
  }
  g.computeVertexNormals()
  return g
}

function makeMaterial(wind: Wind, base: THREE.Color, alt: THREE.Color): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.9, side: THREE.DoubleSide })
  mat.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, wind.uniforms, { uAlt: { value: alt } })
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + swayChunk)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + swayVertex)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uAlt; varying float vTint;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( mix(diffuse, uAlt, vTint), opacity );')
  }
  return mat
}

function instanced(points: ScatterPoint[], geo: THREE.BufferGeometry, mat: THREE.Material, heightScale: number): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geo, mat, points.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const s = new THREE.Vector3()
  const p = new THREE.Vector3()
  const phase = new Float32Array(points.length)
  const tint = new Float32Array(points.length)
  points.forEach((pt, i) => {
    p.set(pt.x, pt.y, pt.z)
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), pt.phase)
    s.set(pt.scale, pt.scale * heightScale, pt.scale)
    m.compose(p, q, s)
    mesh.setMatrixAt(i, m)
    phase[i] = pt.phase
    tint[i] = pt.tint
  })
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1))
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return mesh
}

export function createReeds(points: ScatterPoint[], wind: Wind): WorldModule & { object: THREE.InstancedMesh } {
  const mat = makeMaterial(wind, new THREE.Color('#7f8a3f'), new THREE.Color('#b9a45a'))
  const object = instanced(points, bladeGeometry(1, 0.06), mat, 2.2)
  return { object, update() {} }
}

/**
 * Grass: blades `height` metres tall at their mean scale (the near bank's, half a metre) and `width` wide at the root;
 * a grazed lawn's are a few centimetres.
 */
export function createGrass(points: ScatterPoint[], wind: Wind, { height = 0.5, width = 0.05 }: { height?: number; width?: number } = {}): WorldModule & { object: THREE.InstancedMesh } {
  const mat = makeMaterial(wind, new THREE.Color('#5f7a2e'), new THREE.Color('#9a9448'))
  const object = instanced(points, bladeGeometry(1, width), mat, height)
  return { object, update() {} }
}
