import * as THREE from 'three'
import type { Bird, Rng } from '../catalog/types'
import type { CallAsk } from '../behavior/types'
import type { Voice, PlayAtOptions } from './engine'
import { createCallScheduler, type CallScheduler } from './calls'
import { pickClip } from './clips'
import { cueBook, type CueBook, type SongCue, type CheckCue } from './cues'

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
  /** the song and check cues asks are played from (default: data/cues.json) */
  cues?: CueBook
}

export interface CallPlayer {
  update(dt: number): void
  /**
   * The bird `id`'s behaviour asks for its call now: it plays if the simultaneous-call cap allows, and moves with the
   * bird. An ask is let go while the audio is locked, while the bird is already calling, and (a song or a check) when
   * its species has no such cue; one the cap drops is dropped without a word. The last ask of a frame wins.
   * - none, or `{ kind: 'call' }`: the species' clip, whole, as soon as it loads (the kingfisher's rattle).
   * - `{ kind: 'song' }`: one of the species' song cues; `{ kind: 'check' }`: one of its single checks. The clip plays
   *   from the cue's start to its end, the voice lasting only that long (PRE_ROLL before, RELEASE after). Once its
   *   buffer is ready, an update schedules the sound and, in that same update, calls `onStart(lead, cue)` (a check:
   *   `onStart(lead)`), `lead` being the seconds from then to the cue's first note: SONG_LEAD for a song, so the
   *   spread can begin ahead of it; PRE_ROLL, at once, for a check.
   */
  ask(id: number, ask?: CallAsk): void
  /** voices sounding (or scheduled) plus clips still loading or waiting for the next update */
  readonly active: number
}

/** Seconds from a song's report to its first note: the spread starts 0.3 s before the note, so a few frames more. */
export const SONG_LEAD = 0.4
/**
 * A cue's sound begins this long before its first note, faded in over it, so the cut into the recording doesn't click
 * and the note's attack is whole. A check starts at once, so its first note sounds this long after the report.
 */
export const PRE_ROLL = 0.03
/** A cue's sound runs this long past its end, faded out over it. */
export const RELEASE = 0.08

const REF_DISTANCE = 8
const MAX_DISTANCE = 500

type SongAsk = Extract<CallAsk, { kind: 'song' }>
type CheckAsk = Extract<CallAsk, { kind: 'check' }>
/** a song or check granted by the scheduler: its clip loading, then waiting for the next update to start */
type Cued = ({ kind: 'song'; ask: SongAsk; cue: SongCue } | { kind: 'check'; ask: CheckAsk; cue: CheckCue }) &
  { id: number; buffer: AudioBuffer | null }

function worldPos(inst: CallBird): THREE.Vector3 {
  return inst.model.group.localToWorld(inst.model.center.clone())
}

/**
 * Binds the pure scheduler to the registry and the engine: asks it who calls,
 * picks a clip, loads it, plays it at the bird, and keeps the voice on the
 * bird while it moves. Flock members are left out; a flock has one source
 * of its own (Task 10). So is a bird out of sight, as a diver under the water.
 * A song or check asked for is played from a cue, and its start reported to the asker.
 */
export function createCallPlayer(deps: CallPlayerDeps): CallPlayer {
  const scheduler = deps.scheduler ?? createCallScheduler(deps.rng)
  const cues = deps.cues ?? cueBook()
  const live: { voice: Voice; id: number }[] = []
  /** the birds whose clips are loading, or loaded and waiting to start */
  const pending: number[] = []
  const cued: Cued[] = []
  /** this frame's asks, by bird */
  const asks = new Map<number, CallAsk>()
  /** each bird's last song and last check, so neither comes twice running when there is another */
  const last = new Map<string, SongCue | CheckCue>()
  let now = 0

  const cuesOf = (species: string, kind: 'song' | 'check'): readonly (SongCue | CheckCue)[] =>
    kind === 'song' ? cues.songs(species) : cues.checks(species)

  function pickCue<C extends SongCue | CheckCue>(id: number, kind: 'song' | 'check', from: readonly C[]): C | null {
    const key = `${id}:${kind}`
    const pool = from.length > 1 ? from.filter(c => c !== last.get(key)) : from
    const cue = pool[Math.floor(deps.rng() * pool.length)] ?? null
    if (cue) last.set(key, cue)
    return cue
  }

  function unpend(id: number): void {
    const i = pending.indexOf(id)
    if (i >= 0) pending.splice(i, 1)
  }

  /** Starts every cued sound whose buffer came in since the last update, and tells its asker, in this update. */
  function startReady(): void {
    for (let i = 0; i < cued.length;) {
      const c = cued[i]!
      if (!c.buffer) { i++; continue }
      cued.splice(i, 1)
      unpend(c.id)
      const inst = deps.registry.get(c.id)
      if (!inst) continue                                   // the bird left while its clip loaded: no sound, no word
      const pre = Math.min(PRE_ROLL, c.cue.start)
      const lead = c.kind === 'song' ? SONG_LEAD : pre
      live.push({
        id: c.id,
        voice: deps.engine.playAt(c.buffer, worldPos(inst), 'calls', {
          refDistance: REF_DISTANCE, maxDistance: MAX_DISTANCE,
          offset: c.cue.start - pre,
          duration: c.cue.end - c.cue.start + pre + RELEASE,
          delay: lead - pre,
          fadeIn: pre,
          fadeOut: RELEASE,
        }),
      })
      if (c.kind === 'song') c.ask.onStart?.(lead, c.cue)
      else c.ask.onStart?.(lead)
    }
  }

  /** Picks a granted song's or check's cue and loads its clip; the first update after the clip arrives starts it. */
  function loadCue(id: number, species: string, ask: SongAsk | CheckAsk): void {
    let entry: Cued
    if (ask.kind === 'song') {
      const c = pickCue(id, 'song', cues.songs(species))
      if (!c) return
      entry = { kind: 'song', ask, cue: c, id, buffer: null }
    } else {
      const c = pickCue(id, 'check', cues.checks(species))
      if (!c) return
      entry = { kind: 'check', ask, cue: c, id, buffer: null }
    }
    cued.push(entry)
    pending.push(id)
    deps.engine.load('/' + entry.cue.file)
      .then(buffer => { entry.buffer = buffer })        // not started here: the next update starts it and reports it
      .catch(err => {
        console.warn(`${ask.kind} ${entry.cue.file}: ${String(err)}`)
        const i = cued.indexOf(entry)
        if (i >= 0) { cued.splice(i, 1); unpend(id) }
      })
  }

  return {
    get active() { return live.length + pending.length },
    ask(id, ask) {
      if (!deps.engine.unlocked || pending.includes(id) || live.some(v => v.id === id)) return
      if (ask && ask.kind !== 'call') {
        const inst = deps.registry.get(id)
        if (!inst || cuesOf(inst.species, ask.kind).length === 0) return      // nothing to play it from
      }
      asks.set(id, ask ?? { kind: 'call' })
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
      if (!deps.engine.unlocked) { asks.clear(); return }
      startReady()
      const listener = deps.listenerPosition()
      const cands = deps.registry.all()
        // a bird out of sight (a diver all the way under the water) doesn't call
        .filter(b => b.behavior !== 'flyover' && b.model.group.visible)
        .map(b => ({ id: b.id, species: b.species, distance: worldPos(b).distanceTo(listener) }))
      for (const req of scheduler.tick(now, cands, live.length + pending.length)) {
        const ask = asks.get(req.id)
        if (ask && ask.kind !== 'call') { loadCue(req.id, req.species, ask); continue }
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
          .finally(() => { unpend(req.id) })
      }
      asks.clear()                                          // the asks the cap dropped go with the frame
    },
  }
}
