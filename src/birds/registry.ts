import type * as THREE from 'three'
import type { PoseState } from './model'

/** What targeting needs from a registered bird. A BirdModel satisfies it; flock members use a proxy. */
export interface TargetModel { group: THREE.Object3D; center: THREE.Vector3; radius: number }

export interface BirdInstance {
  id: number
  species: string
  variant?: string
  model: TargetModel
  behavior: string
  identified: boolean
  readonly position: THREE.Vector3
  /**
   * whether it floats this frame, from its pose: `afloat` above one half (a goose wading out has its feet on the bed and
   * floats no longer). A bird registered without a pose (a flyover's member) never floats
   */
  readonly floating: boolean
}

export class BirdRegistry {
  private next = 1
  private map = new Map<number, BirdInstance>()

  /** `pose` is the bird's own, which its behaviour sets each frame: the registry reads whether it floats from it */
  add({ pose, ...inst }: Omit<BirdInstance, 'id' | 'identified' | 'position' | 'floating'> & { pose?: Readonly<Pick<PoseState, 'afloat'>> }): BirdInstance {
    const id = this.next++
    const model = inst.model
    const full: BirdInstance = {
      ...inst, id, identified: false,
      get position() { return model.group.position },
      get floating() { return pose !== undefined && pose.afloat > 0.5 },
    }
    this.map.set(id, full)
    return full
  }

  remove(id: number): void { this.map.delete(id) }
  get(id: number): BirdInstance | undefined { return this.map.get(id) }
  all(): readonly BirdInstance[] { return [...this.map.values()] }
  bySpecies(code: string): BirdInstance[] { return this.all().filter(b => b.species === code) }
  get size(): number { return this.map.size }
}
