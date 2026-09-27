import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createLighting } from '../world/lighting'
import { paletteFor } from '../world/palette'
import { SPECIES, getSpec, hasSpec } from '../birds/species'
import { createBirdModel } from '../birds/factory'
import { defaultPose, type BirdModel } from '../birds/model'
import type { DetailedBirdModel } from '../birds/detail/build'
import { measure } from '../birds/detail/measure'
import { createProfile } from '../birds/detail/profile'
import { layersFor } from '../birds/detail/spec'
import { paintAtlas } from '../birds/paint/painter'
import { ATLAS_SIZE } from '../birds/paint/atlas'
import { parseState, stateHash, FIELD_VIEWS, VIEWS, type ViewerState } from './state'

// Dev-only model viewer (npm run dev, then /viewer.html). Not part of the game build.

const DEFAULTS: ViewerState = {
  a: 'greyel', av: '', b: SPECIES['lesyel'] ? 'lesyel' : 'killde', bv: '', view: 'side', field: '',
  neck: 0.5, lean: 0, spread: 0, phase: 0, reach: 0, depth: 0, angle: Math.PI / 2, paddle: 0, sink: 0, bob: 0, tail: 0,
  walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
}
/** a swimmer's paddle strokes a second (docs/research/2026-09-25-mallard.md, section 11: 2.4 for a Mallard) */
const STROKES = 2.4
let state = parseState(location.hash, DEFAULTS, { has: hasSpec, variants: c => Object.keys(getSpec(c).variants) })
const save = () => history.replaceState(null, '', stateHash(state))
// a pasted or bookmarked link: start over from its state (replaceState above never fires this)
addEventListener('hashchange', () => location.reload())

// --- scene ---------------------------------------------------------------------------------------
const stage = document.getElementById('stage')!
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(1)
renderer.shadowMap.enabled = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
stage.appendChild(renderer.domElement)
const scene = new THREE.Scene()
const BACKGROUND = new THREE.Color('#cfd8dc')
scene.background = BACKGROUND
scene.add(createLighting(paletteFor('early-autumn', 'morning')).object)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#8a8272', roughness: 1 }))
ground.receiveShadow = true
const grid = new THREE.GridHelper(4, 80, '#6f685a', '#7c7566')
grid.position.y = 0.0005
const waterMaterial = new THREE.MeshStandardMaterial({ color: '#6f8a93', roughness: 0.15, transparent: true, opacity: 0.55 })
const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), waterMaterial)
scene.add(ground, grid, water)

const camera = new THREE.PerspectiveCamera(20, 1, 0.01, 500)
const controls = new OrbitControls(camera, renderer.domElement)

// --- birds ---------------------------------------------------------------------------------------
interface Slot {
  model: BirdModel
  base: THREE.Vector3
  skeleton?: THREE.SkeletonHelper
  /** a detailed bird's own copy of its material, so viewer toggles never touch the game's shared one */
  material?: THREE.MeshStandardMaterial
  painted?: THREE.Texture | null
}
let slots: Slot[] = []
let checker: THREE.DataTexture | null = null
/** the left bird's spine, drawn through its profile when stations are shown */
const spine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#b3261e', depthTest: false }))
spine.renderOrder = 1
scene.add(spine)

function checkerTexture(): THREE.DataTexture {
  if (checker) return checker
  const n = 256, data = new Uint8Array(n * n * 4)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const on = ((x >> 4) + (y >> 4)) & 1
    data.set(on ? [230, 90, 60, 255] : [240, 240, 240, 255], (y * n + x) * 4)
  }
  checker = new THREE.DataTexture(data, n, n)
  checker.needsUpdate = true
  return checker
}

function build(): void {
  for (const s of slots) { scene.remove(s.model.group); if (s.skeleton) scene.remove(s.skeleton); s.model.dispose() }
  const models = [[state.a, state.av], [state.b, state.bv]].map(([code, v]) => createBirdModel(getSpec(code!), v || undefined))
  const gap = Math.max(...models.map(m => m.radius)) * 1.15
  slots = models.map((model, i) => {
    const base = new THREE.Vector3(i === 0 ? -gap : gap, 0, 0)
    model.group.position.copy(base)
    scene.add(model.group)
    const slot: Slot = { model, base }
    if ('mesh' in model) {
      const d = model as DetailedBirdModel
      slot.material = (d.mesh.material as THREE.MeshStandardMaterial).clone()
      slot.painted = slot.material.map
      d.mesh.material = slot.material
      slot.skeleton = new THREE.SkeletonHelper(d.mesh)
      scene.add(slot.skeleton)
    }
    return slot
  })
  const left = slots[0]!.model as Partial<DetailedBirdModel>
  spine.parent?.remove(spine)
  if (left.anatomy) {
    spine.geometry.setFromPoints(left.anatomy.spine)
    slots[0]!.model.group.add(spine)
  }
  paintAtlasPanel()
  applyLook()
  place()
}

function applyLook(): void {
  // Float mode is the lake as the game draws it: opaque water at y = 0, where a swimmer's waterline sits, and no ground
  // near enough to see. See-through lets the hull show under it. Otherwise, a wader's shallow water over the ground.
  water.visible = state.float || state.water > 0
  water.position.y = state.float ? 0 : state.water
  waterMaterial.opacity = state.float && !state.see ? 1 : state.float ? 0.35 : 0.55
  waterMaterial.transparent = waterMaterial.opacity < 1
  waterMaterial.color.set(state.float ? '#4d6a73' : '#6f8a93')
  waterMaterial.needsUpdate = true
  ground.position.y = state.float ? -1 : 0
  grid.visible = !state.float && ground.visible
  spine.visible = state.stations
  for (const s of slots) {
    if (s.skeleton) s.skeleton.visible = state.skel
    if (s.material) {
      s.material.wireframe = state.wire
      s.material.map = state.uv ? checkerTexture() : s.painted ?? null
      s.material.needsUpdate = true
    } else s.model.group.traverse(o => { if (o instanceof THREE.Mesh) (o.material as THREE.MeshStandardMaterial).wireframe = state.wire })
  }
  document.getElementById('atlas')!.style.display = state.atlas ? 'block' : 'none'
}

function paintAtlasPanel(): void {
  const spec = getSpec(state.a)
  const canvas = document.getElementById('atlas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  if (!spec.detail) { ctx.clearRect(0, 0, canvas.width, canvas.height); return }
  const px = paintAtlas({ code: spec.code, detail: spec.detail, layers: layersFor(spec.detail, state.av || undefined), profile: createProfile(spec.detail.profile) })
  const img = ctx.createImageData(ATLAS_SIZE, ATLAS_SIZE)
  for (let y = 0; y < ATLAS_SIZE; y++) img.data.set(px.subarray((ATLAS_SIZE - 1 - y) * ATLAS_SIZE * 4, (ATLAS_SIZE - y) * ATLAS_SIZE * 4), y * ATLAS_SIZE * 4)
  ctx.putImageData(img, 0, 0)
}

// --- camera --------------------------------------------------------------------------------------
/**
 * The near plane: a field view's is its optics' (player/optics.ts), as in the game; an orbiting camera's follows its
 * distance to its target, a 200th of it and at least 1 cm (a fixed 0.01 m left depth steps of about 7 mm at 35 m, and
 * showed z-fighting the game never would).
 */
function fitNear(): void {
  const field = state.field ? FIELD_VIEWS[state.field] : null
  const near = field ? field.near : Math.max(0.01, camera.position.distanceTo(controls.target) / 200)
  if (near === camera.near) return
  camera.near = near
  camera.updateProjectionMatrix()
}

function place(): void {
  const field = state.field ? FIELD_VIEWS[state.field] : null
  const w = field ? 1280 : innerWidth, h = field ? 720 : innerHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  const mid = slots.reduce((acc, s) => acc.add(s.model.center.clone().add(s.base)), new THREE.Vector3()).multiplyScalar(1 / slots.length)
  if (field) {
    camera.fov = field.fov
    camera.position.set(mid.x, 1.6, field.distance)
    camera.lookAt(mid)
    controls.enabled = false
  } else {
    camera.fov = 20
    // back off far enough to fit both birds side by side, with room for the panel
    const span = Math.abs(slots[0]!.base.x - slots[1]!.base.x) + 2 * Math.max(...slots.map(s => s.model.radius))
    const d = (span / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.5
    const at = { side: [0, 0, d], front: [d, 0, 0], top: [0, d, 0.001], three: [d * 0.6, d * 0.3, d * 0.75] }[state.view]
    camera.position.set(mid.x + at[0]!, mid.y + at[1]!, mid.z + at[2]!)
    controls.target.copy(mid)
    controls.enabled = true
    controls.update()
  }
  camera.updateProjectionMatrix()
}
addEventListener('resize', place)

// --- reference photo -----------------------------------------------------------------------------
const ref = document.getElementById('ref') as HTMLImageElement
const photo = { opacity: 0.5, scale: 1, x: 0, y: 0 }
function applyPhoto(): void {
  const on = !!ref.src && ref.style.display !== 'none'
  ref.style.opacity = String(photo.opacity)
  ref.style.transform = `translate(${photo.x}px, ${photo.y}px) scale(${photo.scale})`
  scene.background = on ? null : BACKGROUND
  ground.visible = !on
  grid.visible = !on && !state.float
}

// --- panel ---------------------------------------------------------------------------------------
const panel = document.getElementById('panel')!
function group(title: string): HTMLFieldSetElement {
  const f = document.createElement('fieldset')
  const legend = document.createElement('legend')
  legend.textContent = title
  f.appendChild(legend)
  panel.appendChild(f)
  return f
}
function select(parent: HTMLElement, label: string, options: [string, string][], value: string, on: (v: string) => void) {
  const l = document.createElement('label')
  l.textContent = label
  const s = document.createElement('select')
  for (const [v, t] of options) s.add(new Option(t, v, false, v === value))
  s.onchange = () => on(s.value)
  l.appendChild(s)
  parent.appendChild(l)
  return s
}
function slider(parent: HTMLElement, label: string, value: number, on: (v: number) => void, min = 0, max = 1, step = 0.01) {
  const l = document.createElement('label')
  l.textContent = label
  const r = Object.assign(document.createElement('input'), { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) })
  r.oninput = () => on(Number(r.value))
  l.appendChild(r)
  parent.appendChild(l)
}
function check(parent: HTMLElement, label: string, value: boolean, on: (v: boolean) => void) {
  const l = document.createElement('label')
  l.textContent = label
  const c = Object.assign(document.createElement('input'), { type: 'checkbox', checked: value })
  c.onchange = () => on(c.checked)
  l.appendChild(c)
  parent.appendChild(l)
}
const set = (patch: Partial<ViewerState>, rebuild = false) => {
  state = { ...state, ...patch }
  save()
  if (rebuild) build()
  else { applyLook(); place() }
}

const species: [string, string][] = Object.values(SPECIES).map(s => [s.code, `${s.commonName}${s.detail ? ' *' : ''}`])
const variants = (code: string): [string, string][] => [['', '(default)'], ...Object.keys(getSpec(code).variants).map(v => [v, v] as [string, string])]
for (const key of ['a', 'b'] as const) {
  const g = group(key === 'a' ? 'Left bird' : 'Right bird')
  const vKey = key === 'a' ? 'av' : 'bv'
  let plumage: HTMLSelectElement | null = null
  select(g, 'species', species, state[key], v => {
    plumage?.replaceChildren(...variants(v).map(([val, t]) => new Option(t, val)))
    set({ [key]: v, [vKey]: '' }, true)
  })
  plumage = select(g, 'plumage', variants(state[key]), state[vKey], v => set({ [vKey]: v }, true))
}
const cam = group('Camera')
select(cam, 'view', VIEWS.map(v => [v, v] as [string, string]), state.view, v => set({ view: v as ViewerState['view'] }))
select(cam, 'field view', [['', 'off (orbit)'], ...Object.entries(FIELD_VIEWS).map(([k, f]) => [k, f.label] as [string, string])], state.field,
  v => set({ field: v as ViewerState['field'] }))
slider(cam, 'water depth, cm', state.water * 100, v => set({ water: v / 100 }), 0, 10, 0.5)
check(cam, 'float (the lake)', state.float, v => set({ float: v }))
check(cam, 'see-through water', state.see, v => set({ see: v }))
const pose = group('Pose')
slider(pose, 'neck', state.neck, v => set({ neck: v }))
slider(pose, 'lean (tip-up 1.5)', state.lean, v => set({ lean: v }), 0, 1.6, 0.01)
slider(pose, 'tail up', state.tail, v => set({ tail: v }), -0.5, 1, 0.01)
slider(pose, 'wing spread', state.spread, v => set({ spread: v }))
slider(pose, 'wing phase', state.phase, v => set({ phase: v }))
slider(pose, 'reach', state.reach, v => set({ reach: v }))
slider(pose, 'reach depth, cm', state.depth * 100, v => set({ depth: v / 100 }), 0, 30, 0.5)
slider(pose, 'bill angle, deg', THREE.MathUtils.radToDeg(state.angle), v => set({ angle: THREE.MathUtils.degToRad(v) }), 0, 90, 1)
slider(pose, 'paddle', state.paddle, v => set({ paddle: v }))
slider(pose, 'sink, cm', state.sink * 100, v => set({ sink: v / 100 }), 0, 15, 0.5)
slider(pose, 'head bob', state.bob, v => set({ bob: v }), -0.2, 0.2, 0.005)
check(pose, 'walk', state.walk, v => set({ walk: v }))
slider(pose, 'walk speed, m/s', state.speed, v => set({ speed: v }), 0.05, 2, 0.05)
const aids = group('Authoring')
check(aids, 'stations (left bird)', state.stations, v => set({ stations: v }))
check(aids, 'wireframe', state.wire, v => set({ wire: v }))
check(aids, 'skeleton', state.skel, v => set({ skel: v }))
check(aids, 'UV checker', state.uv, v => set({ uv: v }))
check(aids, 'atlas (left bird)', state.atlas, v => set({ atlas: v }))
const photoGroup = group('Reference photo (not saved)')
const file = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' })
file.onchange = () => {
  const f = file.files?.[0]
  if (!f) return
  ref.src = URL.createObjectURL(f)
  ref.style.display = 'block'
  applyPhoto()
}
photoGroup.appendChild(file)
slider(photoGroup, 'opacity', photo.opacity, v => { photo.opacity = v; applyPhoto() })
slider(photoGroup, 'scale', photo.scale, v => { photo.scale = v; applyPhoto() }, 0.1, 4, 0.01)
slider(photoGroup, 'x', photo.x, v => { photo.x = v; applyPhoto() }, -1500, 1500, 1)
slider(photoGroup, 'y', photo.y, v => { photo.y = v; applyPhoto() }, -1500, 1500, 1)
check(photoGroup, 'show', true, v => { ref.style.display = v && ref.src ? 'block' : 'none'; applyPhoto() })
const readout = document.createElement('pre')
group('Measurements, mm').appendChild(readout)

// --- loop ----------------------------------------------------------------------------------------
const labels = document.getElementById('labels')!
const WALK_LOOP = 1.2            // metres before the walk starts over
let stride = 0, paddlePhase = 0
let last = performance.now()
const tmp = new THREE.Vector3()

function frame(): void {
  const now = performance.now()
  const dt = Math.min((now - last) / 1000, 0.1)
  last = now
  if (state.walk) stride += state.speed * dt
  if (state.paddle > 0) paddlePhase = (paddlePhase + STROKES * dt) % 1
  const p = {
    ...defaultPose(), neckExtend: state.neck, wingSpread: state.spread, wingPhase: state.phase, reach: state.reach,
    reachDepth: state.depth, reachAngle: state.angle, paddle: state.paddle, paddlePhase, headBob: state.bob, tailTilt: state.tail,
    strideDistance: stride, gait: state.walk ? 1 : 0,
  }
  p.lean.x = state.lean
  for (const s of slots) {
    s.model.group.position.copy(s.base)
    s.model.group.position.y -= state.sink
    if (state.walk) s.model.group.position.x += stride % WALK_LOOP
    s.model.pose(p)
  }
  fitNear()
  renderer.render(scene, camera)

  labels.replaceChildren()
  const a = slots[0]?.model as DetailedBirdModel | undefined
  if (state.stations && a?.anatomy) {
    for (const st of a.anatomy.stations) {
      tmp.copy(st.position).applyMatrix4(a.group.matrixWorld).project(camera)
      const el = document.createElement('span')
      el.textContent = `• ${st.label}`
      el.style.left = `${(tmp.x * 0.5 + 0.5) * renderer.domElement.width}px`
      el.style.top = `${(-tmp.y * 0.5 + 0.5) * renderer.domElement.height}px`
      labels.appendChild(el)
    }
  }
  readout.textContent = slots.map(s => {
    const name = s.model.group.name.replace('bird:', '')
    if (!('anatomy' in s.model)) return `${name}: block model`
    const m = measure(s.model as DetailedBirdModel)
    const f = (v: number) => (v * 1000).toFixed(1)
    const floating = m.waterlineLength > 0
      ? `\n  above water: back ${f(m.backAbove)}  crown ${f(m.crownAbove)}  tail tip ${f(m.tailTipAbove)}\n  wingtip ${f(m.wingTipAbove)}  breast ${f(m.breastFrontAbove)}  draft ${f(m.draft)}  waterline ${f(m.waterlineLength)}`
      : ''
    return `${name}\n  length ${f(m.length)}  culmen ${f(m.culmen)}  head ${f(m.head)}\n  culmen/head ${(m.culmen / m.head).toFixed(2)}  culmen/tarsus ${(m.culmen / m.tarsus).toFixed(2)}\n  bill depth ${f(m.billDepth)}  tip rise ${f(m.billTipRise)}  widest ${m.billWidestAt.toFixed(2)} x${m.billWidestRatio.toFixed(2)}\n  tarsus ${f(m.tarsus)}  bare tibia ${f(m.tibia)}\n  wing ${f(m.wingChord)}  tail ${f(m.tail)}  projection ${f(m.projection)}${floating}`
  }).join('\n')
  requestAnimationFrame(frame)
}

build()
save()
frame()
