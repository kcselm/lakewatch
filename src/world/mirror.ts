import * as THREE from 'three'

/** a layer the mirror doesn't see: the main camera does, so whatever is on it still draws, but never in the water */
export const NO_REFLECT = 1

export interface Mirror {
  /** what the water reflects, half the drawing buffer's size, in the colour the screen shows */
  readonly texture: THREE.Texture
  /** projects a world position into the mirror's texture: sample at xy / w */
  readonly textureMatrix: THREE.Matrix4
  /** false skips the pass: the water then reflects only its sky gradient */
  enabled: boolean
  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, hide: THREE.Object3D): void
  setSize(width: number, height: number): void
}

/**
 * The water's reflection: the scene rendered by a camera mirrored in the water's plane, y = 0, with an oblique near
 * plane at the water so nothing under it reflects (a diving grebe, the lake bed). Adapted from three.js's Reflector
 * (examples/jsm/objects/Reflector.js), which renders the whole scene at a fixed size; this one renders what's on layer
 * 0 only, at half the drawing buffer, with the main camera's near plane (the optics raise it to 1 m, and a mirror that
 * kept 0.1 m would flicker at 65 m), every other frame.
 */
export function createMirror(renderer: THREE.WebGLRenderer): Mirror {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2())
  const target = new THREE.WebGLRenderTarget(Math.ceil(size.x / 2), Math.ceil(size.y / 2), { type: THREE.HalfFloatType })
  // three.js renders into a render target in linear colour without tone mapping, and each material's shader program
  // depends on both: every material would switch programs twice a frame, which cost 12-17 fps on an Iris Xe. Rendered
  // as an XR target is (three.js's own device for its XR layers), the mirror takes the screen's tone mapping and output
  // colour space, so programs stay put and it holds what the screen shows, the sky's unconverted colour included.
  target.texture.colorSpace = THREE.SRGBColorSpace
  ;(target as THREE.WebGLRenderTarget & { isXRRenderTarget: boolean }).isXRRenderTarget = true
  const virtual = new THREE.PerspectiveCamera()
  virtual.layers.set(0)
  const textureMatrix = new THREE.Matrix4()
  const plane = new THREE.Plane()
  const clip = new THREE.Vector4()
  const q = new THREE.Vector4()
  const eye = new THREE.Vector3(), ahead = new THREE.Vector3(), up = new THREE.Vector3()
  const normal = new THREE.Vector3(0, 1, 0)
  const clipBias = 0.003
  let frame = 0

  const mirror: Mirror = {
    texture: target.texture,
    textureMatrix,
    enabled: true,
    render(scene, camera, hide) {
      if (!mirror.enabled) return
      // every other frame: its 175 draw calls cost 12 fps on an Iris Xe each time. The water reads the mirror through the
      // texture matrix it was rendered with, so a frame-old mirror still lines up as the camera turns; only a moving
      // bird's reflection lags by a frame
      if (frame++ % 2 === 1) return
      // the camera mirrored in y = 0: its position, the point it looks at, and its up
      eye.setFromMatrixPosition(camera.matrixWorld)
      if (eye.y <= 0) return
      ahead.set(0, 0, -1).transformDirection(camera.matrixWorld).add(eye)
      up.set(0, 1, 0).transformDirection(camera.matrixWorld)
      virtual.position.set(eye.x, -eye.y, eye.z)
      virtual.up.set(up.x, -up.y, up.z)
      virtual.lookAt(ahead.x, -ahead.y, ahead.z)
      virtual.fov = camera.fov
      virtual.aspect = camera.aspect
      virtual.near = camera.near
      virtual.far = camera.far
      virtual.updateProjectionMatrix()
      virtual.updateMatrixWorld()

      textureMatrix.set(
        0.5, 0.0, 0.0, 0.5,
        0.0, 0.5, 0.0, 0.5,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0,
      )
      textureMatrix.multiply(virtual.projectionMatrix).multiply(virtual.matrixWorldInverse)

      // the oblique near plane (Lengyel), so the pass draws only what is above the water
      plane.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3()).applyMatrix4(virtual.matrixWorldInverse)
      clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant)
      const p = virtual.projectionMatrix.elements
      q.set((Math.sign(clip.x) + p[8]!) / p[0]!, (Math.sign(clip.y) + p[9]!) / p[5]!, -1, (1 + p[10]!) / p[14]!)
      clip.multiplyScalar(2 / clip.dot(q))
      p[2] = clip.x; p[6] = clip.y; p[10] = clip.z + 1 - clipBias; p[14] = clip.w

      const was = renderer.getRenderTarget()
      const shadows = renderer.shadowMap.autoUpdate
      renderer.shadowMap.autoUpdate = false
      hide.visible = false
      renderer.setRenderTarget(target)
      renderer.state.buffers.depth.setMask(true)
      renderer.clear()
      renderer.render(scene, virtual)
      renderer.setRenderTarget(was)
      hide.visible = true
      renderer.shadowMap.autoUpdate = shadows
    },
    setSize(width, height) {
      target.setSize(Math.ceil(width / 2), Math.ceil(height / 2))
    },
  }
  return mirror
}
