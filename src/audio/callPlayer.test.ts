import * as THREE from 'three'
import { createCallPlayer, type CallEngine, type CallBird } from './callPlayer'
import type { CallScheduler, CallRequest } from './calls'
import type { Voice } from './engine'
import { makeRng } from '../catalog/rng'

function fakeEngine(unlocked: boolean) {
  const voices: { voice: Voice & { follow: ReturnType<typeof vi.fn> }; position: THREE.Vector3 }[] = []
  const engine: CallEngine & { loads: string[]; voices: typeof voices } = {
    unlocked,
    loads: [],
    voices,
    load: vi.fn(async (url: string) => { engine.loads.push(url); return {} as AudioBuffer }),
    playAt: vi.fn((_b: AudioBuffer, position: THREE.Vector3) => {
      const voice = { playing: true, stop() { voice.playing = false }, setVolume() {}, follow: vi.fn() }
      voices.push({ voice, position: position.clone() })
      return voice
    }),
  }
  return engine
}

function fakeRegistry(birds: { id: number; species: string; at: [number, number, number]; behavior?: string; hidden?: boolean }[]) {
  const map = new Map<number, CallBird>(birds.map(b => {
    const group = new THREE.Group()
    group.position.set(...b.at)
    group.visible = !b.hidden
    group.updateMatrixWorld()
    return [b.id, { id: b.id, species: b.species, behavior: b.behavior ?? 'swim', model: { group, center: new THREE.Vector3() } }]
  }))
  return { all: () => [...map.values()], get: (id: number) => map.get(id), remove: (id: number) => { map.delete(id) } }
}

/** A scheduler that emits `queue` on its first tick and records what it was offered. */
function fakeScheduler(queue: CallRequest[]) {
  const offered: { id: number; species: string; distance: number }[][] = []
  const s: CallScheduler & { offered: typeof offered } = {
    offered,
    tick(_now, birds) { offered.push([...birds]); const out = queue; queue = []; return out },
  }
  return s
}

const coot = { audio: [{ file: 'media/audio/coot-1.mp3', type: 'call' as const, xcId: 'XC1', recordist: 'r', license: 'l', sourceUrl: 'https://x.org/1' }] }
const flush = () => new Promise(r => setTimeout(r, 0))

describe('createCallPlayer', () => {
  it('schedules nothing while the audio context is locked', () => {
    const engine = fakeEngine(false)
    const scheduler = fakeScheduler([{ id: 1, species: 'y00475', prefer: 'call' }])
    const p = createCallPlayer({ engine, registry: fakeRegistry([{ id: 1, species: 'y00475', at: [0, 0, -10] }]), birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler })
    for (let i = 0; i < 10; i++) p.update(1)
    expect(scheduler.offered).toHaveLength(0)
    expect(engine.load).not.toHaveBeenCalled()
  })

  it('loads the chosen clip and plays it at the bird, counting it as active meanwhile', async () => {
    const engine = fakeEngine(true)
    const scheduler = fakeScheduler([{ id: 1, species: 'y00475', prefer: 'call' }])
    const p = createCallPlayer({ engine, registry: fakeRegistry([{ id: 1, species: 'y00475', at: [3, 0, -10] }]), birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler })
    p.update(1)
    expect(engine.loads).toEqual(['/media/audio/coot-1.mp3'])
    expect(p.active).toBe(1)                 // pending load holds a slot
    await flush()
    expect(engine.playAt).toHaveBeenCalledTimes(1)
    expect(engine.voices[0]!.position.toArray()).toEqual([3, 0, -10])
    expect(p.active).toBe(1)
  })

  it('follows a bird that moves and frees the slot when the voice ends', async () => {
    const engine = fakeEngine(true)
    const registry = fakeRegistry([{ id: 1, species: 'y00475', at: [0, 0, -10] }])
    const p = createCallPlayer({ engine, registry, birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler: fakeScheduler([{ id: 1, species: 'y00475', prefer: 'call' }]) })
    p.update(1)
    await flush()
    const inst = registry.get(1)!
    inst.model.group.position.set(5, 0, -12)
    inst.model.group.updateMatrixWorld()
    p.update(1)
    const follow = engine.voices[0]!.voice.follow
    expect(follow).toHaveBeenCalled()
    expect((follow.mock.calls.at(-1)![0] as THREE.Vector3).toArray()).toEqual([5, 0, -12])
    engine.voices[0]!.voice.stop()
    p.update(1)
    expect(p.active).toBe(0)
  })

  it('offers the scheduler distances from the listener and leaves flock members out', () => {
    const engine = fakeEngine(true)
    const scheduler = fakeScheduler([])
    const registry = fakeRegistry([{ id: 1, species: 'y00475', at: [0, 0, -10] }, { id: 2, species: 'cangoo', at: [0, 50, 0], behavior: 'flyover' }])
    const p = createCallPlayer({ engine, registry, birdOf: () => coot, listenerPosition: () => new THREE.Vector3(0, 0, 0), rng: makeRng(1), scheduler })
    p.update(1)
    expect(scheduler.offered[0]).toEqual([{ id: 1, species: 'y00475', distance: 10 }])
  })

  it('offers only the birds in sight: a diver all the way under the water does not call', () => {
    const engine = fakeEngine(true)
    const scheduler = fakeScheduler([])
    const registry = fakeRegistry([{ id: 1, species: 'y00475', at: [0, 0, -10] }, { id: 2, species: 'pibgre', at: [0, -0.4, -20], hidden: true }])
    const p = createCallPlayer({ engine, registry, birdOf: () => coot, listenerPosition: () => new THREE.Vector3(0, 0, 0), rng: makeRng(1), scheduler })
    p.update(1)
    expect(scheduler.offered[0]).toEqual([{ id: 1, species: 'y00475', distance: 10 }])
  })

  it('does not play for a bird that left the registry while its clip loaded', async () => {
    const engine = fakeEngine(true)
    const registry = fakeRegistry([{ id: 1, species: 'y00475', at: [0, 0, -10] }])
    const p = createCallPlayer({ engine, registry, birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler: fakeScheduler([{ id: 1, species: 'y00475', prefer: 'call' }]) })
    p.update(1)
    registry.remove(1)
    await flush()
    expect(engine.playAt).not.toHaveBeenCalled()
    expect(p.active).toBe(0)
  })
})
