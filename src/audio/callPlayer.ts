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
 * of its own (Task 10).
 */
export function createCallPlayer(deps: CallPlayerDeps): CallPlayer {
  const scheduler = deps.scheduler ?? createCallScheduler(deps.rng)
  const live: { voice: Voice; id: number }[] = []
  let pending = 0
  let now = 0

  return {
    get active() { return live.length + pending },
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
        .filter(b => b.behavior !== 'flyover')
        .map(b => ({ id: b.id, species: b.species, distance: worldPos(b).distanceTo(listener) }))
      for (const req of scheduler.tick(now, cands, live.length + pending)) {
        const clip = pickClip(deps.birdOf(req.species), req.prefer, deps.rng)
        if (!clip) continue
        pending++
        deps.engine.load('/' + clip.file)
          .then(buffer => {
            const inst = deps.registry.get(req.id)
            if (!inst) return
            live.push({ id: req.id, voice: deps.engine.playAt(buffer, worldPos(inst), 'calls', { refDistance: REF_DISTANCE, maxDistance: MAX_DISTANCE }) })
          })
          .catch(err => console.warn(`call ${clip.file}: ${String(err)}`))
          .finally(() => { pending-- })
      }
    },
  }
}
