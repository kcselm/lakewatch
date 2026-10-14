import * as THREE from 'three'
import { createCallPlayer, SONG_LEAD, PRE_ROLL, RELEASE, type CallEngine, type CallBird } from './callPlayer'
import { createCallScheduler, type CallScheduler, type CallRequest } from './calls'
import type { Voice, PlayAtOptions } from './engine'
import { cueBook, type CueBook, type SongCue, type CheckCue } from './cues'
import { findBird, type Bird } from '../catalog'
import { makeRng } from '../catalog/rng'

/** `clock.frame` is the test's frame count, recorded with each voice so a test can tell which update scheduled it. */
function fakeEngine(unlocked: boolean, clock = { frame: 0 }) {
  const voices: { voice: Voice & { follow: ReturnType<typeof vi.fn> }; position: THREE.Vector3; options: PlayAtOptions; frame: number }[] = []
  const engine: CallEngine & { loads: string[]; voices: typeof voices } = {
    unlocked,
    loads: [],
    voices,
    load: vi.fn(async (url: string) => { engine.loads.push(url); return {} as AudioBuffer }),
    playAt: vi.fn((_b: AudioBuffer, position: THREE.Vector3, _layer: 'calls', options: PlayAtOptions = {}) => {
      const voice = { playing: true, stop() { voice.playing = false }, setVolume() {}, follow: vi.fn() }
      voices.push({ voice, position: position.clone(), options, frame: clock.frame })
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
    ask() {},
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

  it('plays a call its behaviour asks for at once, at the bird, and keeps the sound on the bird as it flies', async () => {
    const engine = fakeEngine(true)
    const registry = fakeRegistry([{ id: 1, species: 'belkin1', at: [22, 4, -48] }])
    const p = createCallPlayer({ engine, registry, birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler: createCallScheduler(makeRng(2)) })
    p.update(1 / 60)
    expect(engine.load).not.toHaveBeenCalled()             // its first timed call is some way off
    p.ask(1)
    p.update(1 / 60)
    expect(engine.load).toHaveBeenCalledTimes(1)
    await flush()
    expect(engine.voices[0]!.position.toArray()).toEqual([22, 4, -48])
    const group = registry.get(1)!.model.group
    group.position.set(18, 1, -40)
    group.updateMatrixWorld()
    p.update(1 / 60)
    expect((engine.voices[0]!.voice.follow.mock.calls.at(-1)![0] as THREE.Vector3).toArray()).toEqual([18, 1, -40])
  })

  it('lets an ask go while the audio is locked, and while the bird is already calling', async () => {
    const engine = fakeEngine(false)
    const registry = fakeRegistry([{ id: 1, species: 'belkin1', at: [22, 4, -48] }])
    const p = createCallPlayer({ engine, registry, birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler: createCallScheduler(makeRng(2)) })
    p.ask(1)
    p.update(1 / 60)
    ;(engine as { unlocked: boolean }).unlocked = true
    p.update(1 / 60)
    expect(engine.load).not.toHaveBeenCalled()             // the ask from before the audio started is gone
    p.ask(1)
    p.update(1 / 60)
    p.ask(1)                                               // still loading: one rattle at a time
    p.update(1 / 60)
    await flush()
    p.ask(1)                                               // sounding
    p.update(1 / 60)
    expect(engine.load).toHaveBeenCalledTimes(1)
    engine.voices[0]!.voice.stop()
    p.update(1 / 60)
    p.ask(1)
    p.update(1 / 60)
    expect(engine.load).toHaveBeenCalledTimes(2)
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

describe('createCallPlayer: songs and checks played from cues', () => {
  const SONGS: SongCue[] = [
    { file: 'media/audio/rewbla-a.mp3', start: 2.8, trill: 3.06, end: 3.89 },
    { file: 'media/audio/rewbla-b.mp3', start: 1.84, trill: 2.19, end: 2.7 },
    { file: 'media/audio/rewbla-b.mp3', start: 7.46, trill: 7.79, end: 8.28 },
  ]
  const CHECKS: CheckCue[] = [{ file: 'media/audio/rewbla-b.mp3', start: 0.49, end: 0.72 }]
  const book: CueBook = { songs: s => (s === 'rewbla' ? SONGS : []), checks: s => (s === 'rewbla' ? CHECKS : []) }
  const blackbird = { audio: [{ file: 'media/audio/rewbla-whole.mp3', type: 'call' as const, xcId: 'XC2', recordist: 'r', license: 'l', sourceUrl: 'https://x.org/2' }] }
  const FRAME = 1 / 60

  function setup(o: { unlocked?: boolean; birds?: { id: number; species: string; at: [number, number, number] }[]; max?: number; cues?: CueBook; birdOf?: (code: string) => Pick<Bird, 'audio'> } = {}) {
    const clock = { frame: 0 }
    const engine = fakeEngine(o.unlocked ?? true, clock)
    const registry = fakeRegistry(o.birds ?? [{ id: 1, species: 'rewbla', at: [-8, 0.5, -5] }])
    const p = createCallPlayer({
      engine, registry, birdOf: o.birdOf ?? (() => blackbird), listenerPosition: () => new THREE.Vector3(), rng: makeRng(3),
      scheduler: createCallScheduler(makeRng(4), { max: o.max }), cues: o.cues ?? book,
    })
    const step = () => { clock.frame++; p.update(FRAME) }
    return { engine, registry, p, clock, step }
  }

  it('a cue played starts within one frame of the time reported', async () => {
    const { engine, p, clock, step } = setup()
    const reports: { lead: number; cue: SongCue; frame: number }[] = []
    p.ask(1, { kind: 'song', onStart: (lead, cue) => reports.push({ lead, cue, frame: clock.frame }) })
    step()                                                 // granted under the cap: its clip loads
    expect(engine.load).toHaveBeenCalledTimes(1)
    await flush()                                          // the buffer comes in between frames...
    expect(engine.playAt).not.toHaveBeenCalled()           // ...and waits for the next update
    expect(reports).toHaveLength(0)
    step()
    expect(engine.voices).toHaveLength(1)
    expect(reports).toHaveLength(1)
    const { options: o, frame } = engine.voices[0]!
    const { lead, cue } = reports[0]!
    expect(frame).toBe(reports[0]!.frame)                  // scheduled and reported in the same update
    expect(engine.loads[0]).toBe('/' + cue.file)
    // the voice is the cue: from just before its first note to just after its end
    expect(o.offset).toBeCloseTo(cue.start - PRE_ROLL, 9)
    expect(o.duration).toBeCloseTo(cue.end - cue.start + PRE_ROLL + RELEASE, 9)
    expect(o.fadeIn).toBeCloseTo(PRE_ROLL, 9)
    expect(o.fadeOut).toBeCloseTo(RELEASE, 9)
    // the first note sounds `delay + (start - offset)` after scheduling: the lead reported, within a frame
    const firstNote = o.delay! + (cue.start - o.offset!)
    expect(Math.abs(firstNote - lead)).toBeLessThan(FRAME)
    expect(lead).toBe(SONG_LEAD)
    expect(lead).toBeGreaterThanOrEqual(0.35)              // room for the spread's 0.3 s ahead of the first note
    expect(cue.trill).toBeGreaterThan(cue.start)
    expect(cue.end).toBeGreaterThan(cue.trill)
  })

  it('plays a check at once, from one single check, and holds its slot only for the check', async () => {
    const { engine, p, step } = setup()
    const leads: number[] = []
    p.ask(1, { kind: 'check', onStart: lead => leads.push(lead) })
    step()
    await flush()
    step()
    const o = engine.voices[0]!.options
    expect(o.delay).toBe(0)
    expect(leads).toEqual([PRE_ROLL])
    expect(o.offset).toBeCloseTo(CHECKS[0]!.start - PRE_ROLL, 9)
    expect(o.duration).toBeCloseTo(CHECKS[0]!.end - CHECKS[0]!.start + PRE_ROLL + RELEASE, 9)
    expect(o.duration).toBeLessThan(0.5)
    expect(p.active).toBe(1)
    engine.voices[0]!.voice.stop()                         // the check has played
    step()
    expect(p.active).toBe(0)
  })

  it('an ask the cap drops is dropped without a callback', async () => {
    const birds = [{ id: 1, species: 'rewbla', at: [-8, 0.5, -5] as [number, number, number] }, { id: 2, species: 'rewbla', at: [-12, 0.5, -9] as [number, number, number] }]
    const { engine, p, step } = setup({ birds, max: 1 })
    const heard: number[] = []
    p.ask(1, { kind: 'song', onStart: () => heard.push(1) })
    p.ask(2, { kind: 'song', onStart: () => heard.push(2) })
    step()                                                 // one slot: the nearer bird sings, the other's ask is gone
    await flush()
    for (let i = 0; i < 30; i++) { step(); await flush() }
    expect(heard).toEqual([1])
    expect(engine.load).toHaveBeenCalledTimes(1)
    // and a check asked while the cap is full is dropped too
    p.ask(2, { kind: 'check', onStart: () => heard.push(22) })
    step()
    await flush()
    step()
    expect(heard).toEqual([1])
  })

  it('lets a song or check go while the audio is locked', async () => {
    const { engine, p, step } = setup({ unlocked: false })
    const heard: string[] = []
    p.ask(1, { kind: 'song', onStart: () => heard.push('song') })
    p.ask(1, { kind: 'check', onStart: () => heard.push('check') })
    step()
    ;(engine as { unlocked: boolean }).unlocked = true
    for (let i = 0; i < 5; i++) { step(); await flush() }
    expect(engine.load).not.toHaveBeenCalled()
    expect(heard).toEqual([])
  })

  it('lets a song go, without a word, for a species with no song cues', async () => {
    const { engine, p, step } = setup({ birds: [{ id: 1, species: 'marwre', at: [0, 0, -10] }] })
    const heard: number[] = []
    p.ask(1, { kind: 'song', onStart: lead => heard.push(lead) })
    step()
    await flush()
    step()
    expect(engine.load).not.toHaveBeenCalled()
    expect(heard).toEqual([])
  })

  it('neither starts nor reports a song for a bird that left while its clip loaded', async () => {
    const { engine, registry, p, step } = setup()
    const heard: number[] = []
    p.ask(1, { kind: 'song', onStart: lead => heard.push(lead) })
    step()
    registry.remove(1)
    await flush()
    step()
    expect(engine.playAt).not.toHaveBeenCalled()
    expect(heard).toEqual([])
    expect(p.active).toBe(0)
  })

  it('with no ask, or a call ask, plays the species\' clip whole as soon as it loads, as before', async () => {
    for (const ask of [undefined, { kind: 'call' as const }]) {
      const { engine, p, step } = setup()
      p.ask(1, ask)
      step()
      await flush()
      expect(engine.loads).toEqual(['/media/audio/rewbla-whole.mp3'])
      expect(engine.playAt).toHaveBeenCalledTimes(1)       // no wait for the next update
      expect(engine.voices[0]!.options).toEqual({ refDistance: 8, maxDistance: 500 })
    }
  })

  it('does not sing the same song twice running when it has another', async () => {
    const { engine, p, step } = setup()
    const sung: SongCue[] = []
    for (let i = 0; i < 40; i++) {
      p.ask(1, { kind: 'song', onStart: (_lead, cue) => sung.push(cue) })
      step()
      await flush()
      step()
      engine.voices.at(-1)?.voice.stop()
      step()
    }
    expect(sung).toHaveLength(40)
    for (let i = 1; i < sung.length; i++) expect(sung[i]).not.toBe(sung[i - 1])
    expect(new Set(sung).size).toBe(SONGS.length)
  })

  it('never plays XC469000 for a song: with the cues and catalog as shipped, a song comes only from a song cue', async () => {
    const { engine, p, step } = setup({ cues: cueBook(), birdOf: findBird })
    const songFiles = new Set(cueBook().songs('rewbla').map(c => '/' + c.file))
    const sung: SongCue[] = []
    for (let i = 0; i < 60; i++) {
      p.ask(1, { kind: 'song', onStart: (_lead, cue) => sung.push(cue) })
      step()
      await flush()
      step()
      engine.voices.at(-1)?.voice.stop()
      step()
    }
    expect(sung).toHaveLength(60)
    expect(engine.loads.some(f => f.includes('XC469000'))).toBe(false)
    for (const f of engine.loads) expect(songFiles.has(f)).toBe(true)
  })
})
