import * as THREE from 'three'
import type { Wind } from './wind'
import type { ScenePalette } from './palette'
import type { WorldModule } from './scene'
import { RippleBuffer, MAX_RIPPLES, RIPPLE_LIFE } from './ripples'

const vert = /* glsl */ `
#include <fog_pars_vertex>
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`

const frag = /* glsl */ `
#include <fog_pars_fragment>
uniform vec2 uWindDir; uniform float uWindStrength; uniform float uWindGust; uniform float uTime;
uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSkyTop; uniform vec3 uSkyHorizon; uniform vec3 uSun; uniform vec3 uSunDir;
uniform vec4 uRipples[${MAX_RIPPLES}];
uniform vec3 uCamera;
varying vec3 vWorld;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

void main() {
  float wind = uWindStrength * (0.6 + 0.4 * uWindGust);
  vec2 p = vWorld.xz;
  // Two ripple layers scrolling downwind
  vec2 flow = uWindDir * uTime * (0.6 + 1.4 * wind);
  float n1 = noise(p * 0.9 + flow);
  float n2 = noise(p * 2.3 - flow * 1.7 + 13.0);
  float h = (n1 * 0.7 + n2 * 0.3);
  // Wind streaks: elongated along the wind during gusts
  vec2 along = vec2(-uWindDir.y, uWindDir.x);
  float streak = noise(vec2(dot(p, uWindDir) * 0.15 + uTime * 0.8, dot(p, along) * 1.6)) * uWindGust * 0.35;
  // Ripple rings from birds
  float ring = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    // w is the ring's size: a small one (a bill going in) spreads slower, fades sooner, and is fainter
    float life = ${RIPPLE_LIFE.toFixed(1)} * r.w;
    if (r.z > life) continue;
    float d = distance(p, r.xy);
    float radius = r.z * 1.1 * r.w;
    float fade = 1.0 - r.z / life;
    ring += smoothstep(0.12 * r.w, 0.0, abs(d - radius)) * fade * 0.6 * r.w;
  }
  // Perturbed normal from the height field
  float e = 0.15;
  float hx = noise((p + vec2(e, 0)) * 0.9 + flow) * 0.7 + noise((p + vec2(e, 0)) * 2.3 - flow * 1.7 + 13.0) * 0.3;
  float hz = noise((p + vec2(0, e)) * 0.9 + flow) * 0.7 + noise((p + vec2(0, e)) * 2.3 - flow * 1.7 + 13.0) * 0.3;
  float amp = 0.06 + 0.25 * wind;
  vec3 n = normalize(vec3(-(hx - h) * amp / e, 1.0, -(hz - h) * amp / e));
  // Fake sky reflection by the reflected view direction's elevation
  vec3 v = normalize(uCamera - vWorld);
  vec3 refl = reflect(-v, n);
  vec3 sky = mix(uSkyHorizon, uSkyTop, pow(clamp(refl.y, 0.0, 1.0), 0.6));
  float fres = pow(1.0 - max(dot(v, n), 0.0), 3.0);
  // Depth tint: shallow toward the basin rim (ellipse from the heightfield)
  vec2 ep = vec2((p.x - 2.0) / 44.0, (p.y + 36.0) / 32.0);
  float depth = clamp(1.0 - length(ep), 0.0, 1.0);
  vec3 body = mix(uShallow, uDeep, depth);
  vec3 col = mix(body, sky, 0.35 + 0.55 * fres);
  // Sun glitter
  float spec = pow(max(dot(refl, uSunDir), 0.0), 180.0) * (0.4 + wind);
  col += uSun * spec;
  col += vec3(streak) * 0.6;
  col += vec3(ring);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`

export function createWater(wind: Wind, palette: ScenePalette, ripples: RippleBuffer): WorldModule & { object: THREE.Mesh } {
  const packed = new Float32Array(MAX_RIPPLES * 4)
  const rippleUniform = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, 99, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      ...wind.uniforms,
      uDeep: { value: new THREE.Color('#1f3a44') },
      uShallow: { value: new THREE.Color('#4f6f5c') },
      uSkyTop: { value: new THREE.Color(palette.skyTop) },
      uSkyHorizon: { value: new THREE.Color(palette.skyHorizon) },
      uSun: { value: new THREE.Color(palette.sun) },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uRipples: { value: rippleUniform },
      uCamera: { value: new THREE.Vector3() },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    },
    vertexShader: vert, fragmentShader: frag, fog: true,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 1, 1).rotateX(-Math.PI / 2), mat)
  mesh.position.set(0, 0, -140)
  mesh.receiveShadow = false
  return {
    object: mesh,
    update(dt) {
      ripples.update(dt)
      ripples.pack(packed)
      for (let i = 0; i < MAX_RIPPLES; i++) rippleUniform[i]!.set(packed[i * 4]!, packed[i * 4 + 1]!, packed[i * 4 + 2]!, packed[i * 4 + 3]!)
    },
  }
}
