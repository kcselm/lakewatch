import * as THREE from 'three'
import type { Location } from '../location/schema'
import { Wind } from './wind'
import { paletteFor, type ScenePalette } from './palette'
import { createSky } from './sky'
import { createLighting } from './lighting'

export interface WorldModule {
  update(dt: number, wind: Wind): void
}

export class World {
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly wind: Wind
  readonly palette: ScenePalette
  private modules: WorldModule[] = []
  private paused = false
  private last = 0

  constructor(container: HTMLElement, loc: Location) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)

    this.palette = paletteFor(loc.season, loc.timeOfDay)
    this.scene.fog = new THREE.Fog(new THREE.Color(this.palette.fog), 60, 420)

    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000)
    const [x, y, z] = loc.vantage.position
    this.camera.position.set(x, y, z)

    this.wind = new Wind({ ...loc.wind, seed: 7 })
    this.add(createSky(this.palette, this.wind))
    const lights = createLighting(this.palette)
    this.scene.add(lights.object)

    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(innerWidth, innerHeight)
    })
  }

  add(mod: WorldModule & { object?: THREE.Object3D }): void {
    this.modules.push(mod)
    if (mod.object) this.scene.add(mod.object)
  }

  setPaused(p: boolean): void {
    this.paused = p
  }

  start(onFrame?: (dt: number) => void): void {
    this.last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      if (!this.paused) {
        this.wind.update(dt)
        for (const m of this.modules) m.update(dt, this.wind)
        onFrame?.(dt)
      }
      this.renderer.render(this.scene, this.camera)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
}
