import * as THREE from 'three'

export interface PoseState {
  /** 0..1 wingbeat cycle; 0 = wings level */
  wingPhase: number
  /** 0 folded .. 1 fully spread */
  wingSpread: number
  /** forward/back head displacement in body lengths, for the coot pump */
  headBob: number
  /** 0 tucked .. 1 stretched */
  neckExtend: number
  /** radians, positive lifts the tail */
  tailTilt: number
  /** body lean; x pitches nose down (tip-up feeding), z rolls */
  lean: THREE.Vector3
}

export function defaultPose(): PoseState {
  return { wingPhase: 0, wingSpread: 0, headBob: 0, neckExtend: 0.5, tailTilt: 0, lean: new THREE.Vector3() }
}

export interface BirdParts {
  body: THREE.Object3D
  neck: THREE.Object3D
  head: THREE.Object3D
  bill: THREE.Object3D
  wingL: THREE.Object3D
  wingR: THREE.Object3D
  tail: THREE.Object3D
  legs: THREE.Object3D
}

export interface BirdModel {
  group: THREE.Group
  parts: BirdParts
  pose(state: PoseState): void
  dispose(): void
  /** bounding radius in metres, for apparent-size math */
  radius: number
  /** local-space bounding-box centre of the whole model at rest pose, for targeting */
  center: THREE.Vector3
}
