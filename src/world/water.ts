import * as THREE from 'three'
import { GUST_FRONT_GLSL, WIND_SPEED, type Wind } from './wind'
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
${GUST_FRONT_GLSL}

// a hash without sine, which holds up at the large coordinates the fine octaves reach (Hoskins)
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
// value noise and its gradient
vec3 noised(vec2 x) {
  vec2 i = floor(x), f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return vec3(a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y, du * (vec2(b - a, c - a) + (a - b - c + d) * u.yx));
}

// The ripples (research sections 3.4 and 6.2): four octaves, from the 0.9 m grouping to the 17 mm capillaries, each
// running downwind at its own wave speed and stretched across the wind as wind waves are. Together they tilt the surface
// by about 0.07 rad rms per axis in rough water. An octave finer than a pixel fades out rather than alias, and the tilt it
// took with it smears the reflection instead: a rough patch far off shows smeared colour, not a mirror
const float LAMBDA[4] = float[4](0.9, 0.18, 0.06, 0.017);
const float STRETCH[4] = float[4](1.5, 1.5, 1.2, 1.0);
const float SPEED[4] = float[4](1.19, 0.53, 0.32, 0.23);
const float WEIGHT[4] = float[4](0.3, 0.5, 0.4, 0.25);
const float SLOPE = 0.19;

void main() {
  vec2 p = vWorld.xz;
  vec2 along = uWindDir, across = vec2(-uWindDir.y, uWindDir.x);
  vec2 q = vec2(dot(p, along), dot(p, across));
  // How rough the water is (research 3.2 and 3.3): glassy below the ripples' onset, about 1.5 m/s of wind, rough by 2.5.
  // Over that, lulls: glassy patches 15-40 m across drifting downwind at the wind's speed, about a fifth of the lake,
  // roughened as the gust front the reeds bend in runs over them; and calmer water in the lee of the far tree line.
  // Glassy is a rms tilt of 0.001 rad, 1.5% of rough water's 0.07
  float drift = ${WIND_SPEED.toFixed(1)} * uWindStrength * uTime;
  // the wind's speed now, about its mean (2.8 m/s at 0.35): a quarter below it between gusts, a quarter above in one
  float onset = smoothstep(1.0, 2.5, ${WIND_SPEED.toFixed(1)} * uWindStrength * (0.75 + 0.5 * uWindGust));
  vec2 lq = vec2(q.x - drift, q.y);
  float lull = 0.7 * noised(lq / 25.0 + 91.7).x + 0.3 * noised(lq / 9.0 + 43.1).x;
  float patchy = smoothstep(0.32, 0.62, lull) * (0.55 + 0.45 * gustFront(p, 0.0));
  float lee = mix(1.0, 0.5, smoothstep(-52.0, -58.0, p.y));
  float rough = mix(0.015, 1.0, onset * patchy * lee);
  // the pixel's footprint on the water, its longer side: long at grazing angles
  float fp = max(length(dFdx(p)), length(dFdy(p)));
  vec2 slope = vec2(0.0);
  float lost = 0.0, fine = 0.5;
  for (int i = 0; i < 4; i++) {
    float l = LAMBDA[i];
    vec2 u = vec2((q.x - SPEED[i] * uTime) / l, q.y / (l * STRETCH[i])) + float(i) * 17.3;
    vec3 nd = noised(u);
    float keep = 1.0 - smoothstep(0.5 * l, l, fp);
    float w = WEIGHT[i] * SLOPE * rough;
    // the height's gradient in the world: its slope along the wind and across it
    slope += (along * nd.y + across * nd.z / STRETCH[i]) * w * keep;
    lost += (w * (1.0 - keep)) * (w * (1.0 - keep));
    if (i == 2) fine = nd.x;
  }
  // Rings (research section 4): a train of crests between the calm inner edge, running out at c_g,min, and the leading
  // crest, each bending the surface, fainter as the ring spreads and ending smoothly
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    float life = ringLife(r.w);
    if (r.z >= life) continue;
    vec2 d = p - r.xy;
    float dist = length(d);
    float inner = r.z * 0.178, outer = r.z * ringSpeed(r.w);
    if (dist <= inner || dist >= outer) continue;
    float width = outer - inner, crests = ringCrests(r.w);
    float t = (dist - inner) / width;
    // crests closer than two pixels blur into the rest of the water
    float resolved = 1.0 - smoothstep(1.0, 2.0, fp * crests / width);
    float a = 0.12 * (0.4 + 0.6 * r.w) / (1.0 + r.z / 0.5) * (1.0 - smoothstep(0.8 * life, life, r.z)) * resolved;
    float window = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.7, t);
    slope += (d / dist) * a * window * cos(6.2832 * crests * t);
  }
  vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
  // What the water reflects: the mirror's render of the scene, shifted by the ripples' tilt (research 6.3: along the
  // view by 2 s / vFOV, across it by only 2 s sin(g) / hFOV, so reflections smear into columns) and smeared up and down
  // by the tilt the unresolved ripples took with them; a sky gradient where the smear runs off the mirror, or when
  // reflections are off
  vec3 v = normalize(uCamera - vWorld);
  vec3 refl = reflect(-v, n);
  vec3 sky = mix(uSkyHorizon, uSkyTop, pow(clamp(refl.y, 0.0, 1.0), 0.6));
  vec2 look = normalize(vWorld.xz - uCamera.xz);
  float sAlong = dot(slope, look), sAcross = dot(slope, vec2(-look.y, look.x));
  vec2 off = clamp(vec2(2.0 * sAcross * v.y / (uFov * uAspect), 2.0 * sAlong / uFov), -${REFLECT.clampUV.toFixed(2)}, ${REFLECT.clampUV.toFixed(2)});
  float smear = min(2.0 * sqrt(lost * 0.5) / uFov, ${REFLECT.clampUV.toFixed(2)});
  vec2 uv = vMirrorUv.xy / vMirrorUv.w + off;
  vec3 mirrored = vec3(0.0);
  for (int k = -2; k <= 2; k++) mirrored += texture2D(uMirror, clamp(uv + vec2(0.0, float(k) * 0.5 * smear), 0.0, 1.0)).rgb;
  mirrored /= 5.0;
  float offMirror = smoothstep(0.0, 0.05, max(max(-uv.x, uv.x - 1.0), max(-uv.y, uv.y - 1.0)));
  sky = mix(sky, mix(mirrored, sky, offMirror), uReflect);
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
  float edge = (1.0 - edgeFade) * step(0.0005, depth) * (0.5 + 0.5 * fine);
  col = mix(col, uSkyHorizon, edge * 0.5 / max(alpha + edge * 0.6, 1e-4));
  alpha = max(alpha, edge * 0.6);
  // Sun glitter
  float spec = pow(max(dot(refl, uSunDir), 0.0), 180.0) * (0.4 + 0.6 * rough);
  col += uSun * spec;
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
