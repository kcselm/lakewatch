import type * as THREE from 'three'

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
}

export class BirdRegistry {
  private next = 1
  private map = new Map<number, BirdInstance>()

  add(inst: Omit<BirdInstance, 'id' | 'identified' | 'position'>): BirdInstance {
    const id = this.next++
    const model = inst.model
    const full: BirdInstance = {
      ...inst, id, identified: false,
      get position() { return model.group.position },
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
