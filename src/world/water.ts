import * as THREE from 'three'
import type { Wind } from './wind'
import type { ScenePalette } from './palette'
import type { WorldModule } from './scene'
import { RippleBuffer, MAX_RIPPLES, RING_GLSL } from './ripples'
import { VISIBILITY, type WaterDepth } from './waterDepth'
import { FRESNEL_GLSL, REFLECT } from './fresnel'
import type { Mirror } from './mirror'

const vert = /* glsl */ `
#include <fog_pars_vertex>
uniform mat4 uTextureMatrix;
varying vec3 vWorld;
varying vec4 vMirrorUv;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vMirrorUv = uTextureMatrix * wp;
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
uniform sampler2D uDepth; uniform vec4 uDepthBounds;
uniform sampler2D uMirror; uniform float uReflect; uniform float uFov; uniform float uAspect;
varying vec3 vWorld;
varying vec4 vMirrorUv;
${RING_GLSL}
${FRESNEL_GLSL}

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
    float life = ringLife(r.w);
    if (r.z > life) continue;
    float d = distance(p, r.xy);
    float radius = r.z * ringSpeed(r.w);
    float fade = 1.0 - r.z / life;
    ring += smoothstep(0.12 * r.w, 0.0, abs(d - radius)) * fade * 0.6 * r.w;
  }
  // Perturbed normal from the height field
  float e = 0.15;
  float hx = noise((p + vec2(e, 0)) * 0.9 + flow) * 0.7 + noise((p + vec2(e, 0)) * 2.3 - flow * 1.7 + 13.0) * 0.3;
  float hz = noise((p + vec2(0, e)) * 0.9 + flow) * 0.7 + noise((p + vec2(0, e)) * 2.3 - flow * 1.7 + 13.0) * 0.3;
  float amp = 0.06 + 0.25 * wind;
  vec3 n = normalize(vec3(-(hx - h) * amp / e, 1.0, -(hz - h) * amp / e));
  // What the water reflects: the mirror's render of the scene, shifted by the ripples' tilt (research 6.3: along the
  // view by 2 s / vFOV, across it by only 2 s sin(g) / hFOV, so reflections smear into columns), falling back to a sky
  // gradient where the shift runs off it, or when reflections are off
  vec3 v = normalize(uCamera - vWorld);
  vec3 refl = reflect(-v, n);
  vec3 sky = mix(uSkyHorizon, uSkyTop, pow(clamp(refl.y, 0.0, 1.0), 0.6));
  vec2 look = normalize(vWorld.xz - uCamera.xz);
  float sAlong = dot(n.xz, look), sAcross = dot(n.xz, vec2(-look.y, look.x));
  vec2 off = clamp(vec2(2.0 * sAcross * v.y / (uFov * uAspect), 2.0 * sAlong / uFov), -${REFLECT.clampUV.toFixed(2)}, ${REFLECT.clampUV.toFixed(2)});
  vec3 mirrored = texture2D(uMirror, vMirrorUv.xy / vMirrorUv.w + off).rgb;
  float fall = smoothstep(${REFLECT.fadeFromUV.toFixed(2)}, ${REFLECT.clampUV.toFixed(2)}, max(abs(off.x), abs(off.y)));
  sky = mix(sky, mix(mirrored, sky, fall), uReflect);
  float fres = fresnel(dot(v, n));
  // Depth, baked from the terrain: the water's own colour builds with it, so the bed shows through the shallows and
  // is gone by 30 cm; its tint goes from the shallows' olive to the open water's by 2 m
  vec2 duv = (p - uDepthBounds.xz) / (uDepthBounds.yw - uDepthBounds.xz);
  float depth = texture2D(uDepth, duv).r;
  float body = 1.0 - exp(-depth / ${VISIBILITY.toFixed(3)});
  vec3 tint = mix(uShallow, uDeep, smoothstep(0.0, 2.0, depth));
  // the surface reflects whatever the depth: over the bed, the water's colour and then the reflection lie on it, so
  // what shows is bed (1 - body)(1 - fres), tint body (1 - fres), and sky fres, blended over the bed below
  float edgeFade = smoothstep(0.0, 0.01, depth);
  fres *= edgeFade;
  float alpha = 1.0 - (1.0 - body) * (1.0 - fres);
  vec3 col = (tint * body * (1.0 - fres) + sky * fres) / max(alpha, 1e-4);
  // the waterline: the meniscus catching the sky over the last centimetre, broken up by the ripples
  float edge = (1.0 - edgeFade) * step(0.0005, depth) * (0.5 + 0.5 * n2);
  col = mix(col, uSkyHorizon, edge * 0.5 / max(alpha + edge * 0.6, 1e-4));
  alpha = max(alpha, edge * 0.6);
  // Sun glitter
  float spec = pow(max(dot(refl, uSunDir), 0.0), 180.0) * (0.4 + wind);
  col += uSun * spec;
  col += vec3(streak) * 0.6;
  col += vec3(ring);
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`

export function createWater(wind: Wind, palette: ScenePalette, ripples: RippleBuffer, depth: WaterDepth, mirror: Mirror): WorldModule & { object: THREE.Mesh; setReflections(on: boolean): void; follow(camera: THREE.PerspectiveCamera): void } {
  // half floats, which WebGL 2 filters linearly without an extension
  const half = new Uint16Array(depth.data.length)
  for (let i = 0; i < half.length; i++) half[i] = THREE.DataUtils.toHalfFloat(depth.data[i]!)
  const depthTexture = new THREE.DataTexture(half, depth.width, depth.height, THREE.RedFormat, THREE.HalfFloatType)
  depthTexture.magFilter = depthTexture.minFilter = THREE.LinearFilter
  depthTexture.needsUpdate = true
  const [x0, x1, z0, z1] = depth.bounds
  const packed = new Float32Array(MAX_RIPPLES * 4)
  const rippleUniform = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, 99, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      ...wind.uniforms,
      // the research's tints (section 2.2, set by eye), as displayed: this shader writes its colour out unconverted, as
      // the sky's does
      uDeep: { value: new THREE.Color().setStyle('#2e392d', THREE.LinearSRGBColorSpace) },
      uShallow: { value: new THREE.Color().setStyle('#5e5c42', THREE.LinearSRGBColorSpace) },
      uDepth: { value: depthTexture },
      uDepthBounds: { value: new THREE.Vector4(x0, x1, z0, z1) },
      uMirror: { value: mirror.texture },
      uTextureMatrix: { value: mirror.textureMatrix },
      uReflect: { value: 1 },
      uFov: { value: 1 },
      uAspect: { value: 1 },
      uSkyTop: { value: new THREE.Color(palette.skyTop) },
      uSkyHorizon: { value: new THREE.Color(palette.skyHorizon) },
      uSun: { value: new THREE.Color(palette.sun) },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uRipples: { value: rippleUniform },
      uCamera: { value: new THREE.Vector3() },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    },
    vertexShader: vert, fragmentShader: frag, fog: true,
    // over the bed, which shows through the shallows
    transparent: true, depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 1, 1).rotateX(-Math.PI / 2), mat)
  mesh.position.set(0, 0, -140)
  mesh.receiveShadow = false
  const u = mat.uniforms
  return {
    object: mesh,
    setReflections(on) {
      u.uReflect!.value = on ? 1 : 0
      mirror.enabled = on
    },
    follow(camera) {
      u.uCamera!.value.copy(camera.position)
      u.uFov!.value = THREE.MathUtils.degToRad(camera.fov)
      u.uAspect!.value = camera.aspect
    },
    update(dt) {
      ripples.update(dt)
      ripples.pack(packed)
      for (let i = 0; i < MAX_RIPPLES; i++) rippleUniform[i]!.set(packed[i * 4]!, packed[i * 4 + 1]!, packed[i * 4 + 2]!, packed[i * 4 + 3]!)
    },
  }
}
