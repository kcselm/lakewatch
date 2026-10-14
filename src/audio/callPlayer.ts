import * as THREE from 'three'
import type { Bird, Rng } from '../catalog/types'
import type { Voice, PlayAtOptions } from './engine'
import { createCallScheduler, type CallScheduler } from './calls'
import { pickClip } from './clips'

/** The slice of AudioEngine the player needs; tests pass a fake. */
export interface CallEngine {
  readonly unlocked: boolean
  load(url: string): Promise<AudioBuffer>
  playAt(buffer: AudioBuffer, position: THREE.Vector3, layer: 'calls', o?: PlayAtOptions): Voice
}

/** What the player reads from a registered bird. A BirdRegistry entry satisfies this. */
export interface CallBird {
  id: number
  species: string
  behavior: string
  model: { group: THREE.Object3D; center: THREE.Vector3 }
}

export interface CallRegistry {
  all(): readonly CallBird[]
  get(id: number): CallBird | undefined
}

export interface CallPlayerDeps {
  engine: CallEngine
  registry: CallRegistry
  birdOf: (code: string) => Pick<Bird, 'audio'>
  listenerPosition: () => THREE.Vector3
  rng: Rng
  scheduler?: CallScheduler
}

export interface CallPlayer {
  update(dt: number): void
  /**
   * The bird `id`'s behaviour asks for its call now: it plays at the next update if the simultaneous-call cap allows,
   * and moves with the bird. An ask is let go while the audio is locked, or while the bird is already calling.
   */
  ask(id: number): void
  /** voices sounding plus clips still loading */
  readonly active: number
}

const REF_DISTANCE = 8
const MAX_DISTANCE = 500

function worldPos(inst: CallBird): THREE.Vector3 {
  return inst.model.group.localToWorld(inst.model.center.clone())
}

/**
 * Binds the pure scheduler to the registry and the engine: asks it who calls,
 * picks a clip, loads it, plays it at the bird, and keeps the voice on the
 * bird while it moves. Flock members are left out; a flock has one source
 * of its own (Task 10). So is a bird out of sight, as a diver under the water.
 */
export function createCallPlayer(deps: CallPlayerDeps): CallPlayer {
  const scheduler = deps.scheduler ?? createCallScheduler(deps.rng)
  const live: { voice: Voice; id: number }[] = []
  /** the birds whose clips are loading */
  const pending: number[] = []
  let now = 0

  return {
    get active() { return live.length + pending.length },
    ask(id) {
      if (!deps.engine.unlocked || pending.includes(id) || live.some(v => v.id === id)) return
      scheduler.ask(id)
    },
    update(dt) {
      now += dt
      for (let i = live.length - 1; i >= 0; i--) {
        const v = live[i]!
        if (!v.voice.playing) { live.splice(i, 1); continue }
        const inst = deps.registry.get(v.id)
        if (inst) v.voice.follow(worldPos(inst))
      }
      if (!deps.engine.unlocked) return
      const listener = deps.listenerPosition()
      const cands = deps.registry.all()
        // a bird out of sight (a diver all the way under the water) doesn't call
        .filter(b => b.behavior !== 'flyover' && b.model.group.visible)
        .map(b => ({ id: b.id, species: b.species, distance: worldPos(b).distanceTo(listener) }))
      for (const req of scheduler.tick(now, cands, live.length + pending.length)) {
        const clip = pickClip(deps.birdOf(req.species), req.prefer, deps.rng)
        if (!clip) continue
        pending.push(req.id)
        deps.engine.load('/' + clip.file)
          .then(buffer => {
            const inst = deps.registry.get(req.id)
            if (!inst) return
            live.push({ id: req.id, voice: deps.engine.playAt(buffer, worldPos(inst), 'calls', { refDistance: REF_DISTANCE, maxDistance: MAX_DISTANCE }) })
          })
          .catch(err => console.warn(`call ${clip.file}: ${String(err)}`))
          .finally(() => { pending.splice(pending.indexOf(req.id), 1) })
      }
    },
  }
}
