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
  /** metres walked so far; the model maps it to its own stride phase */
  strideDistance: number
  /** 0 standing .. 1 walking */
  gait: number
  /** 0 .. 1, how far a peck or strike has reached toward the ground; at 1 the bill tip is on it */
  reach: number
  /** 0 legs hidden (floating) .. 1 legs shown and paddling; only swimmers set it */
  paddle: number
  /** 0..1 paddle stroke cycle, advanced by the behaviour like wingPhase */
  paddlePhase: number
  /** metres below the ground or water surface a reach aims, added to the species' probeDepth; 0 = the surface itself */
  reachDepth: number
  /** the steepest the bill may point during a reach, radians below level; PI/2 = straight down (every existing peck) */
  reachAngle: number
}

export function defaultPose(): PoseState {
  return {
    wingPhase: 0, wingSpread: 0, headBob: 0, neckExtend: 0.5, tailTilt: 0, lean: new THREE.Vector3(), strideDistance: 0, gait: 0, reach: 0,
    paddle: 0, paddlePhase: 0, reachDepth: 0, reachAngle: Math.PI / 2,
  }
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
