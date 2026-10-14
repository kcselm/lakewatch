import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { paletteFor } from '../world/palette'
import { sunDirection } from '../world/sky'
import { createBirdModel } from '../birds/factory'
import { defaultPose, type BirdModel, type PoseState } from '../birds/model'
import { ensureAuthored } from '../birds/models'
import type { SpeciesSpec } from '../birds/spec'
import { CORMORANT_PERCH } from '../behavior/cormorant'
import { GRIPS, holdOn } from '../behavior/grips'
import { spreadPose, spreadLength } from '../behavior/spread'
import { songCues, type SongCue } from '../audio/cues'
import type { StudyPose } from './study'

/**
 * The study screen's stage: one bird on a turntable under the lake's morning light, on the water if it swims, on the
 * ground if it stands, on its branch if it perches, on a cattail stalk if it holds stems. Drag to turn it, scroll to zoom; left alone, the view turns
 * slowly round it. A renderer of its own, so the lake's can stop while the study is open.
 */

/** the camera's field of view, degrees: narrow, so a bird reads as it does through binoculars, not a wide lens */
const FOV = 28
/** seconds the camera takes to move to a new bird or pose */
const REFRAME = 0.6
/** seconds after a drag before the view turns by itself again */
const IDLE = 5
/** a perch's length, metres: the branch the kingfisher stands on, lying across under its feet */
const BRANCH = 0.4
/**
 * a cattail stalk for a bird that holds stems: 8 mm across where it is held, `STALK_HOLD` metres up, running on 25 cm
 * above (the viewer's)
 */
const STALK_RADIUS = 0.004
const STALK_HOLD = 0.35
/** the song spread: from half a second before each song's first note, so its onset comes before it; 1.5 s between songs */
const SONG_LEAD = 0.5
const SONG_GAP = 1.5
/** a male's resting epaulet, its buff bar showing (behavior/blackbird.ts) */
const REST_EPAULET = 0.15
/** the 10 cm grid on the ground, for scale */
const CELL = 0.1

const palette = paletteFor('early-autumn', 'morning')
const SKY = new THREE.Color('#d5dcd6')

export interface StageEvents {
  /** a bird's model is loading or being built (true), or is on the stage (false) */
  onBusy?: (busy: boolean) => void
  onError?: (err: unknown) => void
}

/** Two animation frames, so whatever the screen set just now (a "Preparing" line) is drawn before a long build. */
const frames = () => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))

export class StudyStage {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 200)
  private readonly controls: OrbitControls
  private readonly sun: THREE.DirectionalLight
  private readonly ground: THREE.Mesh
  private readonly grid: THREE.Group
  private readonly water: THREE.Mesh
  private readonly branch: THREE.Mesh
  private readonly stalk: THREE.Mesh
  private readonly resize: ResizeObserver
  private model: BirdModel | null = null
  private spec: SpeciesSpec | null = null
  private version: string | undefined
  private poseId: StudyPose = 'rest'
  /** the song playing with the spread: its cue, the clip, and the song's clock (seconds from its first note) */
  private song: { cue: SongCue; audio: HTMLAudioElement; t: number } | null = null
  private songs = 0
  private volume = 1
  private readonly pose: PoseState = defaultPose()
  /** where the bird's feet (or waterline) stand: lifted for a percher on its branch, and in flight */
  private readonly base = new THREE.Vector3()
  private beat = 0
  private clock = 0
  private last = performance.now()
  private frame = 0
  /** the latest show() call's number; an older build that finishes late is dropped */
  private request = 0
  private idleFor = IDLE
  /** the first bird is framed at once; every later one, and every pose, by moving the camera */
  private framed = false
  private move: { from: THREE.Vector3; to: THREE.Vector3; fromDist: number; toDist: number; t: number } | null = null

  constructor(private readonly container: HTMLElement, private readonly events: StageEvents = {}) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)

    this.scene.background = SKY
    this.scene.fog = new THREE.Fog(SKY, 4, 20)
    this.sun = new THREE.DirectionalLight(new THREE.Color(palette.sun), 2.6)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    this.sun.shadow.bias = -0.0002
    this.sun.shadow.normalBias = 0.002
    this.scene.add(this.sun, this.sun.target)
    this.scene.add(new THREE.HemisphereLight(new THREE.Color(palette.ambientSky), new THREE.Color(palette.ambientGround), 0.9))

    this.ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#9b927d', roughness: 1 }))
    this.ground.receiveShadow = true
    this.grid = new THREE.Group()
    this.grid.position.y = 0.0005
    this.water = new THREE.Mesh(
      new THREE.CircleGeometry(60, 64).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#6a868b', roughness: 0.18, metalness: 0.05, transparent: true, opacity: 0.8 }),
    )
    this.water.receiveShadow = true
    this.branch = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, BRANCH, 20), new THREE.MeshStandardMaterial({ color: '#6b5d4f', roughness: 1 }))
    this.branch.castShadow = this.branch.receiveShadow = true
    this.stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(STALK_RADIUS * 0.8, STALK_RADIUS * 1.6, STALK_HOLD + 0.25, 10, 8).translate(0, (STALK_HOLD + 0.25) / 2, 0),
      new THREE.MeshStandardMaterial({ color: '#9aa060', roughness: 0.9 }),
    )
    this.stalk.castShadow = this.stalk.receiveShadow = true
    this.scene.add(this.ground, this.grid, this.water, this.branch, this.stalk)

    this.camera.position.set(0.6, 0.22, 0.75)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.autoRotateSpeed = 0.8
    this.controls.addEventListener('start', () => { this.idleFor = 0; this.move = null })

    this.resize = new ResizeObserver(() => this.fit())
    this.resize.observe(container)
    this.fit()
    this.frame = requestAnimationFrame(this.tick)
  }

  /** Put a species on the stage in a plumage version and a pose; loads an authored bird's model first. */
  async show(spec: SpeciesSpec, version: string | undefined, pose: StudyPose): Promise<void> {
    const request = ++this.request
    this.events.onBusy?.(true)
    try {
      await ensureAuthored(spec)
      await frames()
      if (request !== this.request) return
      const model = createBirdModel(spec, version)
      model.group.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = true })
      this.clear()
      this.model = model
      this.spec = spec
      this.version = version
      this.scene.add(model.group)
      this.setPose(pose)
    } catch (err) {
      if (request === this.request) this.events.onError?.(err)
    } finally {
      if (request === this.request) this.events.onBusy?.(false)
    }
  }

  /** Hold the bird on the stage in another pose, and frame it there. */
  setPose(pose: StudyPose): void {
    this.poseId = pose
    this.hush()
    if (!this.model || !this.spec) return
    const spec = this.spec
    const swims = spec.posture === 'swimming' && pose !== 'ashore' && pose !== 'dry'
    const stems = !!spec.detail?.perch?.stems
    const radius = stems ? undefined : spec.detail?.perch?.radius
    // a percher stands on its branch's top: the branch lies across under its feet on the ground, the bird on it; a bird
    // that holds stems clasps a stalk standing from the ground, the stalk a little ahead of its feet
    this.base.set(stems ? -GRIPS.stalk.ahead * this.size() : 0, radius ? 2 * radius : stems ? STALK_HOLD : 0, 0)
    this.stalk.visible = stems
    this.branch.visible = !!radius
    if (radius) {
      this.branch.scale.set(radius, 1, radius)
      this.branch.rotation.set(Math.PI / 2, 0, 0)
      this.branch.position.set(0, radius, 0)
    }
    this.water.visible = swims
    this.ground.visible = this.grid.visible = !swims
    this.beat = 0
    this.posed(0)
    // in flight it is held up off the ground (or the water), about half its span
    if (pose === 'flight') {
      this.base.y += Math.max(0.3, this.bounds().getSize(new THREE.Vector3()).z * 0.6)
      this.posed(0)
    }
    // from under the ground only a flying bird is worth seeing
    this.controls.maxPolarAngle = pose === 'flight' ? Math.PI - 0.1 : Math.PI / 2 - 0.04
    this.reframe()
  }

  /** How loud the songs of the spread play, 0-1 (the clips' volume). */
  setVolume(volume: number): void {
    this.volume = volume
    if (this.song) this.song.audio.volume = volume
  }

  dispose(): void {
    cancelAnimationFrame(this.frame)
    this.request++
    this.hush()
    this.resize.disconnect()
    this.controls.dispose()
    this.clear()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
  }

  /** stops the spread's song */
  private hush(): void {
    this.song?.audio.pause()
    this.song = null
  }

  /** the bird's size against its species' traced one (a female red-wing's 0.85) */
  private size(): number {
    return (this.version && this.spec?.detail?.sizes?.[this.version]?.scale) || 1
  }

  private clear(): void {
    this.hush()
    if (!this.model) return
    this.scene.remove(this.model.group)
    this.model.dispose()
    this.model = null
  }

  private fit(): void {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  /** The bird's pose at time t: its study pose, and a little life in it (the head turning, the water lifting it). */
  private posed(dt: number): void {
    const spec = this.spec!, p = this.pose, pose = this.poseId
    Object.assign(p, defaultPose())
    const flying = pose === 'flight'
    p.afloat = pose === 'ashore' || pose === 'dry' ? 0 : 1
    p.neckExtend = pose === 'alert' ? 1 : 0.5
    if (flying) {
      this.beat = (this.beat + spec.wingbeatHz * dt) % 1
      p.wingSpread = 1
      p.wingPhase = this.beat
      p.legsUp = 1
      p.neckExtend = 0
      // a body traced upright on its perch (the kingfisher's) levelled for flight
      p.lean.x = THREE.MathUtils.degToRad(spec.detail?.flight?.pitch ?? 0)
    } else if (pose === 'dry') {
      // the cormorant's on its stump: upright, the tail propped, the wings held out, the neck in a loose S
      p.dry = 1
      p.lean.x = CORMORANT_PERCH.lean
      p.tailProp = 1
      p.neckExtend = 0.6
    } else if (pose !== 'spread') {
      p.headYaw = Math.sin(this.clock * 0.55) * 0.35 + Math.sin(this.clock * 0.21) * 0.15
    }
    if (this.stalk.visible) {
      // its feet round the stalk, the upper the right, its body at the stalk grip's angle
      const at = (h: number) => new THREE.Vector3(0, h, 0)
      const up = new THREE.Vector3(0, 1, 0)
      p.feet = {
        right: holdOn(at(STALK_HOLD + GRIPS.stalk.apart / 2), up, STALK_RADIUS, this.base, 0),
        left: holdOn(at(STALK_HOLD - GRIPS.stalk.apart / 2), up, STALK_RADIUS, this.base, 0),
      }
      p.lean.x = GRIPS.stalk.lean
    }
    // a bird with a song spread at rest as in the game, its shoulder's edge showing
    if (spec.detail?.display) p.epaulet = REST_EPAULET
    if (pose === 'spread') this.sing(dt, p)
    this.model!.pose(p)
    const g = this.model!.group
    g.position.copy(this.base)
    if (this.water.visible && !flying) g.position.y += Math.sin(this.clock * 1.4) * 0.003
  }

  /**
   * The song spread: the species' songs in turn, each played from its cue, with a full spread on the song's own clock
   * (the clip's time while it plays), so the red comes up as the song starts and is fullest at its trill.
   */
  private sing(dt: number, p: PoseState): void {
    const cues = songCues(this.spec!.code)
    if (cues.length === 0) return
    if (!this.song) {
      const cue = cues[this.songs++ % cues.length]!
      const audio = new Audio('/' + cue.file)
      audio.volume = this.volume
      audio.currentTime = Math.max(0, cue.start - SONG_LEAD)
      audio.play().catch(() => {})
      this.song = { cue, audio, t: -SONG_LEAD }
    }
    const s = this.song
    const shape = { trill: s.cue.trill - s.cue.start, end: s.cue.end - s.cue.start }
    // the clip's clock while it plays (held at the lead while it loads); the frame clock once it is stopped at the song's end
    if (!s.audio.paused) s.t = s.audio.currentTime - s.cue.start
    else s.t += dt
    if (s.t > shape.end + 0.15 && !s.audio.paused) s.audio.pause()
    const v = spreadPose(3, s.t, shape, { epaulet: REST_EPAULET, tailTilt: p.tailTilt, lean: p.lean.x })
    Object.assign(p, { epaulet: v.epaulet, epauletRaise: v.epauletRaise, fluff: v.fluff, wingHold: v.wingHold, tailSpread: v.tailSpread, tailTilt: v.tailTilt, neckExtend: v.neckExtend, headPitch: v.headPitch, gape: v.gape })
    p.lean.x = v.lean
    if (s.t > spreadLength(shape) + SONG_GAP) this.song = null
  }

  /** The posed bird's bounds in the world: over a whole wingbeat in flight, so the framing holds for every stroke. */
  private bounds(): THREE.Box3 {
    const box = new THREE.Box3()
    const g = this.model!.group
    const v = new THREE.Vector3()
    const take = () => {
      g.updateMatrixWorld(true)
      g.traverseVisible(o => {
        if (!(o instanceof THREE.Mesh)) return
        const pos = o.geometry.getAttribute('position')
        const step = Math.max(1, Math.floor(pos.count / 3000))
        for (let i = 0; i < pos.count; i += step) box.expandByPoint(o.getVertexPosition(i, v).applyMatrix4(o.matrixWorld))
      })
    }
    if (this.poseId !== 'flight') take()
    else for (const phase of [0, 0.25, 0.5, 0.75]) { this.pose.wingPhase = phase; this.model!.pose(this.pose); take() }
    return box
  }

  /** Move the camera to take in the whole bird, keeping the side it is looking from; light and fade to suit its size. */
  private reframe(): void {
    const box = this.bounds()
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const r = Math.max(sphere.radius, 0.05)
    // its width across the view, whichever way it has turned (its length or its span), fitted to the view's width, and
    // its height to the view's height; then back a little more, so the side nearest the camera fits too
    const size = box.getSize(new THREE.Vector3())
    const across = Math.max(size.x, size.z)
    const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2)), tanH = tanV * this.camera.aspect
    const dist = Math.max(across / 2 / tanH, size.y / 2 / tanV) * 1.18 + across * 0.3
    // aimed a little below its middle, so it stands clear of the chips along the stage's foot
    const to = sphere.center.clone()
    to.y -= 2 * dist * tanV * 0.05
    this.move = { from: this.controls.target.clone(), to, fromDist: this.camera.position.distanceTo(this.controls.target), toDist: dist, t: 0 }
    if (!this.framed) this.move.t = REFRAME
    this.framed = true
    this.controls.minDistance = r * 1.2
    this.controls.maxDistance = r * 8
    this.camera.near = Math.max(0.005, r / 50)
    this.camera.far = r * 400
    this.camera.updateProjectionMatrix()
    // the ground fades into the sky a few bird-lengths out
    const fog = this.scene.fog as THREE.Fog
    fog.near = dist * 1.5
    fog.far = dist * 5
    // the sun's shadow box just round the bird, so its shadow is sharp
    const s = r * 2.5
    Object.assign(this.sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: r, far: r * 40 })
    this.sun.shadow.camera.updateProjectionMatrix()
    this.sun.target.position.copy(sphere.center)
    this.sun.position.copy(sunDirection(palette)).multiplyScalar(r * 20).add(sphere.center)
    this.buildGrid(dist * 5)
  }

  /** a 10 cm grid, and every metre a stronger line, out as far as the ground shows */
  private buildGrid(reach: number): void {
    for (const c of this.grid.children) { (c as THREE.LineSegments).geometry.dispose() }
    this.grid.clear()
    const metres = Math.min(Math.ceil(reach), 30)
    const fine = new THREE.GridHelper(2 * metres, (2 * metres) / CELL, '#8c846f', '#8c846f')
    const strong = new THREE.GridHelper(2 * metres, 2 * metres, '#776f5c', '#776f5c')
    strong.position.y = 0.0005
    this.grid.add(fine, strong)
  }

  private readonly tick = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.clock += dt
    if (this.model) this.posed(dt)
    if (this.move) {
      const m = this.move
      m.t = Math.min(REFRAME, m.t + dt)
      const k = THREE.MathUtils.smootherstep(m.t / REFRAME, 0, 1)
      const dir = this.camera.position.clone().sub(this.controls.target)
      if (dir.lengthSq() < 1e-9) dir.set(0.6, 0.22, 0.75)
      this.controls.target.lerpVectors(m.from, m.to, k)
      this.camera.position.copy(this.controls.target).add(dir.normalize().multiplyScalar(THREE.MathUtils.lerp(m.fromDist, m.toDist, k)))
      if (m.t >= REFRAME) this.move = null
    }
    this.idleFor += dt
    this.controls.autoRotate = this.idleFor > IDLE
    this.controls.update(dt)
    this.renderer.render(this.scene, this.camera)
    this.frame = requestAnimationFrame(this.tick)
  }
}
