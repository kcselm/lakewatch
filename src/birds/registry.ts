import type * as THREE from 'three'
import type { BirdModel } from './model'

export interface BirdInstance {
  id: number
  species: string
  variant?: string
  model: BirdModel
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
