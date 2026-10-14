import * as THREE from 'three'

export type AudioLayer = 'ambience' | 'calls' | 'effects'

export interface Voice {
  readonly playing: boolean
  stop(): void
  setVolume(v: number): void
  /** move a positional voice; a no-op for 2D voices */
  follow(p: THREE.Vector3): void
}

export interface PlayOptions {
  volume?: number
  loop?: boolean
  /** seconds into the buffer to start from (a cue's start); default 0 */
  offset?: number
  /** seconds of the buffer to play from `offset`; default to its end. The voice ends when they are played */
  duration?: number
  /** seconds from now to start the sound, on the audio clock; default 0, at once. The voice counts as playing meanwhile */
  delay?: number
  /** seconds to fade in over from the start, so a cut into the middle of a recording doesn't click */
  fadeIn?: number
  /** seconds to fade out over before the end of `duration` (needs it), for the same reason */
  fadeOut?: number
}
export interface PlayAtOptions extends PlayOptions { refDistance?: number; maxDistance?: number; rolloff?: number }

class VoiceImpl implements Voice {
  private released = false

  constructor(
    readonly node: THREE.Audio | THREE.PositionalAudio,
    readonly layer: AudioLayer,
    private base: number,
    private layerGain: () => number,
    private onEnd: (v: VoiceImpl) => void,
  ) {
    this.refresh()
    // Audio.play() binds this.onEnded at play time, so an instance property set beforehand wins over the prototype's.
    // isPlaying is readonly in the type, so delegate to the prototype method (which flips it internally) rather than assigning it.
    node.onEnded = () => { THREE.Audio.prototype.onEnded.call(node); this.end() }
  }
  get playing(): boolean { return this.node.isPlaying }
  refresh(): void { this.node.setVolume(this.base * this.layerGain()) }
  setVolume(v: number): void { this.base = v; this.refresh() }
  stop(): void { this.end() }
  follow(p: THREE.Vector3): void { this.node.position.copy(p) }
  /** The single path to onEnd: reachable from natural playback end and explicit stop(), any number of times, in any order. */
  private end(): void {
    if (this.released) return
    this.released = true
    if (this.node.isPlaying) this.node.stop()     // stop() nulls source.onended, so this can't re-enter via onEnded
    this.onEnd(this)
  }
}

/**
 * Three.js audio with the listener on the camera. Layers (ambience, calls,
 * effects) each have a volume that multiplies every voice in the layer, so
 * settings can move one slider without touching the voices. Everything that
 * decides WHAT to play is pure and lives elsewhere; this only plays.
 */
export class AudioEngine {
  readonly listener = new THREE.AudioListener()
  private layers: Record<AudioLayer, number> = { ambience: 1, calls: 1, effects: 1 }
  private buffers = new Map<string, Promise<AudioBuffer>>()
  private voices = new Set<VoiceImpl>()
  private loader = new THREE.AudioLoader()

  constructor(private scene: THREE.Scene, camera: THREE.Object3D) {
    camera.add(this.listener)
  }

  get context(): AudioContext { return this.listener.context }
  get unlocked(): boolean { return this.context.state === 'running' }

  /** Resume the context from a user gesture. A rejection (no gesture, autoplay policy) leaves the game silent, not broken. */
  async unlock(): Promise<boolean> {
    try {
      if (this.context.state !== 'running') await this.context.resume()
    } catch { /* stays locked */ }
    return this.unlocked
  }

  setMasterVolume(v: number): void { this.listener.setMasterVolume(v) }
  setLayerVolume(layer: AudioLayer, v: number): void {
    this.layers[layer] = v
    for (const voice of this.voices) if (voice.layer === layer) voice.refresh()
  }
  layerVolume(layer: AudioLayer): number { return this.layers[layer] }

  /** Decoded and cached per URL. A failed load is forgotten so a retry can succeed. */
  load(url: string): Promise<AudioBuffer> {
    let p = this.buffers.get(url)
    if (!p) {
      p = this.loader.loadAsync(url)
      this.buffers.set(url, p)
      p.catch(() => this.buffers.delete(url))
    }
    return p
  }

  bufferFrom(samples: Float32Array, sampleRate: number): AudioBuffer {
    const b = this.context.createBuffer(1, samples.length, sampleRate)
    b.getChannelData(0).set(samples)
    return b
  }

  play(buffer: AudioBuffer, layer: AudioLayer, o: PlayOptions = {}): Voice {
    const node: THREE.Audio = new THREE.Audio(this.listener)
    return this.start(node, layer, buffer, o)
  }

  playAt(buffer: AudioBuffer, position: THREE.Vector3, layer: AudioLayer, o: PlayAtOptions = {}): Voice {
    const node = new THREE.PositionalAudio(this.listener)
    node.setRefDistance(o.refDistance ?? 8)
    node.setMaxDistance(o.maxDistance ?? 500)
    node.setRolloffFactor(o.rolloff ?? 1)
    node.position.copy(position)
    this.scene.add(node)         // the renderer's scene.updateMatrixWorld() feeds the panner each frame
    return this.start(node, layer, buffer, o)
  }

  private start(node: THREE.Audio | THREE.PositionalAudio, layer: AudioLayer, buffer: AudioBuffer, o: PlayOptions): Voice {
    node.setBuffer(buffer)
    node.setLoop(o.loop ?? false)
    if (o.offset !== undefined) node.offset = Math.max(0, o.offset)
    if (o.duration !== undefined) node.duration = Math.max(0, o.duration)
    const delay = Math.max(0, o.delay ?? 0)
    if (o.fadeIn || o.fadeOut) node.setFilters([this.envelope(delay, o)])
    const voice = new VoiceImpl(node, layer, o.volume ?? 1, () => this.layers[layer], v => this.release(v))
    this.voices.add(voice)
    node.play(delay)             // source.start(currentTime + delay, offset, duration)
    return voice
  }

  /**
   * A gain of the voice's own between its source and its volume, ramped up from silence over `fadeIn` at the start and
   * down to silence over the last `fadeOut` of `duration`, so setVolume (the layer sliders) never fights it.
   */
  private envelope(delay: number, o: PlayOptions): GainNode {
    const env = this.context.createGain()
    const g = env.gain
    const t0 = this.context.currentTime + delay
    const fadeIn = Math.max(0, o.fadeIn ?? 0)
    g.setValueAtTime(fadeIn > 0 ? 0 : 1, t0)
    if (fadeIn > 0) g.linearRampToValueAtTime(1, t0 + fadeIn)
    const fadeOut = Math.max(0, o.fadeOut ?? 0)
    if (fadeOut > 0 && o.duration !== undefined) {
      const t1 = t0 + o.duration
      g.setValueAtTime(1, Math.max(t0 + fadeIn, t1 - fadeOut))
      g.linearRampToValueAtTime(0, t1)
    }
    return env
  }

  private release(v: VoiceImpl): void {
    this.voices.delete(v)
    v.node.parent?.remove(v.node)
    v.node.disconnect()
  }
}
