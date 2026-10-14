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
  /**
   * metres below the ground or water surface a reach aims, added to the species' probeDepth; 0 = the surface itself.
   * Negative aims above it: a heron standing on the bed strikes into the water over it
   */
  reachDepth: number
  /** the steepest the bill may point during a reach, radians below level; PI/2 = straight down (every existing peck) */
  reachAngle: number
  /** radians the head turns after the neck and any reach; positive raises the bill (a heron swallowing) */
  headPitch: number
  /**
   * radians the head turns about the neck's axis, after headPitch; positive turns the bill to the bird's left (a
   * kingfisher watching the water, or beating a fish on its branch)
   */
  headYaw: number
  /**
   * an amphibious bird (a goose): 1 floating, its waterline on the origin and its legs folded away (paddling if
   * `paddle` says so); 0 standing on its feet on the origin's ground, walking with `gait`; between, the body's height
   * and the legs blend from the one to the other. Every other bird ignores it
   */
  afloat: number
  /** 0 slack .. 1 full: how far a pouch under the bill (a pelican's) hangs; a bird without one ignores it */
  pouch: number
  /** 0 flapping .. 1 gliding: a flight wing held out still, in its glide; a bird without a flight wing ignores it */
  glide: number
  /**
   * 0 folded .. 1 held out to dry: a flight wing raised and opened in the species' drying pose (flight.dry, a
   * cormorant's), wingPhase and wingSpread adding a slow flap to it; a bird without one ignores it
   */
  dry: number
  /**
   * 0 .. 1: how far the tail turns down from where tailTilt puts it toward resting its tip on the ground or perch under
   * the feet (y = 0), as a prop; a perched cormorant's, its body raised
   */
  tailProp: number
  /** 0 flapping .. 1 hovering: a flight wing's stroke, blended from its beat to its hover; a bird without a hover ignores it */
  wingStroke: number
  /**
   * 0 down .. 1 folded up under the belly: a perched bird's legs in flight, tucked once it is away and lowered again to
   * land; any other bird ignores it
   */
  legsUp: number
  /** 0 lowered .. 1 raised: a crest turned up about its base; a bird without one ignores it */
  crestRaise: number
  /** 0 closed .. 1 fully fanned: the tail spread about its base (a kingfisher hovering); a bird whose tail doesn't fan ignores it */
  tailSpread: number
  /** 0 none .. 1 held: a fish in the bill; a bird that holds none ignores it */
  fish: number
  /** 0 crosswise .. 1 lengthwise, head first: a held fish turned in the bill to be swallowed */
  fishTurn: number
}

export function defaultPose(): PoseState {
  return {
    wingPhase: 0, wingSpread: 0, headBob: 0, neckExtend: 0.5, tailTilt: 0, lean: new THREE.Vector3(), strideDistance: 0, gait: 0, reach: 0,
    paddle: 0, paddlePhase: 0, reachDepth: 0, reachAngle: Math.PI / 2, headPitch: 0, headYaw: 0, afloat: 1, pouch: 0, glide: 0,
    dry: 0, tailProp: 0, crestRaise: 0, tailSpread: 0, fish: 0, fishTurn: 0, wingStroke: 0, legsUp: 0,
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
