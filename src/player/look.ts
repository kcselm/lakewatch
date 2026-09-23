import * as THREE from 'three'

export interface LookState { yaw: number; pitch: number }

const PITCH_LIMIT = (75 * Math.PI) / 180

export function applyLookDelta(s: LookState, dx: number, dy: number, sensitivity: number, fovScale: number): LookState {
  const k = sensitivity * fovScale
  return {
    yaw: s.yaw + dx * k,
    pitch: THREE.MathUtils.clamp(s.pitch - dy * k, -PITCH_LIMIT, PITCH_LIMIT),
  }
}

/** Pulled out so the pause gate can be asserted without a DOM: mirrors `enabled()`. */
export function shouldHandleInput(enabled: () => boolean): boolean {
  return enabled()
}

export class LookControls {
  state: LookState
  sensitivity = 0.0022
  fovScale = 1
  private isLocked = false
  private touchLast: { x: number; y: number } | null = null

  constructor(private canvas: HTMLElement, initialHeadingDeg: number, private enabled: () => boolean = () => true) {
    this.state = { yaw: THREE.MathUtils.degToRad(initialHeadingDeg), pitch: 0 }
    canvas.addEventListener('click', () => {
      if (!shouldHandleInput(this.enabled)) return
      if (this.isLocked) return
      // requestPointerLock() can return a promise that rejects (e.g. WrongDocumentError) when
      // the lock is unavailable; swallow it so it doesn't surface as an unhandled rejection.
      const p = canvas.requestPointerLock() as unknown
      if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => {})
    })
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerlockchange', () => { this.isLocked = document.pointerLockElement === canvas })
      document.addEventListener('mousemove', e => {
        if (!shouldHandleInput(this.enabled)) return
        if (!this.isLocked) return
        this.state = applyLookDelta(this.state, e.movementX, e.movementY, this.sensitivity, this.fovScale)
      })
    }
    canvas.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) this.touchLast = { x: t.clientX, y: t.clientY } }, { passive: true })
    canvas.addEventListener('touchmove', e => {
      const t = e.touches[0]
      if (!t || !this.touchLast) return
      this.state = applyLookDelta(this.state, -(t.clientX - this.touchLast.x) * 2, -(t.clientY - this.touchLast.y) * 2, this.sensitivity, this.fovScale)
      this.touchLast = { x: t.clientX, y: t.clientY }
    }, { passive: true })
    canvas.addEventListener('touchend', () => { this.touchLast = null })
  }

  get locked(): boolean { return this.isLocked }

  applyTo(camera: THREE.PerspectiveCamera, swayX = 0, swayY = 0): void {
    camera.rotation.set(0, 0, 0)
    camera.rotation.order = 'YXZ'
    camera.rotation.y = -this.state.yaw + swayX
    camera.rotation.x = this.state.pitch + swayY
  }
}
