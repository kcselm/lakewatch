import * as THREE from 'three'
import type { ScenePalette } from './palette'
import type { Wind } from './wind'
import type { WorldModule } from './scene'

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const skyFrag = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunDir;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uTop, pow(h, 0.55));
  float s = dot(normalize(vDir), uSunDir);
  col += uSun * (smoothstep(0.9985, 0.9995, s) * 1.0 + pow(max(s, 0.0), 24.0) * 0.18);
  gl_FragColor = vec4(col, 1.0);
}`

export function sunDirection(p: ScenePalette): THREE.Vector3 {
  const el = THREE.MathUtils.degToRad(p.sunElevation)
  const az = THREE.MathUtils.degToRad(p.sunAzimuth)
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize()
}

function cloudTexture(): THREE.Texture {
  const size = 128
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function createSky(palette: ScenePalette, wind: Wind): WorldModule & { object: THREE.Object3D } {
  const object = new THREE.Group()
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(900, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color(palette.skyTop) },
        uHorizon: { value: new THREE.Color(palette.skyHorizon) },
        uSun: { value: new THREE.Color(palette.sun) },
        uSunDir: { value: sunDirection(palette) },
      },
      vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false,
    }),
  )
  dome.renderOrder = -10
  object.add(dome)

  const tex = cloudTexture()
  const clouds: THREE.Sprite[] = []
  for (let i = 0; i < 6; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7, depthWrite: false, fog: false })
    const s = new THREE.Sprite(m)
    const scale = 120 + i * 30
    s.scale.set(scale * 1.8, scale * 0.7, 1)
    s.position.set(-300 + i * 120, 140 + (i % 3) * 25, -420 - (i % 2) * 90)
    clouds.push(s)
    object.add(s)
  }

  return {
    object,
    update(dt, w) {
      const v = w.effective() * 2.5 * dt
      for (const c of clouds) {
        c.position.x += w.state.dir.x * v
        c.position.z += w.state.dir.y * v
        if (c.position.x > 450) c.position.x = -450
        if (c.position.x < -450) c.position.x = 450
      }
    },
  }
}
