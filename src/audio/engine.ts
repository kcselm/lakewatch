import * as THREE from 'three'

export type AudioLayer = 'ambience' | 'calls' | 'effects'

export interface Voice {
  readonly playing: boolean
  stop(): void
  setVolume(v: number): void
  /** move a positional voice; a no-op for 2D voices */
  follow(p: THREE.Vector3): void
}

export interface PlayOptions { volume?: number; loop?: boolean }
export interface PlayAtOptions extends PlayOptions { refDistance?: number; maxDistance?: number; rolloff?: number }

class VoiceImpl implements Voice {
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
    node.onEnded = () => { THREE.Audio.prototype.onEnded.call(node); onEnd(this) }
  }
  get playing(): boolean { return this.node.isPlaying }
  refresh(): void { this.node.setVolume(this.base * this.layerGain()) }
  setVolume(v: number): void { this.base = v; this.refresh() }
  stop(): void {
    if (this.node.isPlaying) this.node.stop()     // stop() nulls source.onended, so onEnd runs exactly once
    this.onEnd(this)
  }
  follow(p: THREE.Vector3): void { this.node.position.copy(p) }
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

  /** Voices currently sounding in a layer. */
  count(layer: AudioLayer): number {
    let n = 0
    for (const v of this.voices) if (v.layer === layer && v.playing) n++
    return n
  }

  private start(node: THREE.Audio | THREE.PositionalAudio, layer: AudioLayer, buffer: AudioBuffer, o: PlayOptions): Voice {
    node.setBuffer(buffer)
    node.setLoop(o.loop ?? false)
    const voice = new VoiceImpl(node, layer, o.volume ?? 1, () => this.layers[layer], v => this.release(v))
    this.voices.add(voice)
    node.play()
    return voice
  }

  private release(v: VoiceImpl): void {
    this.voices.delete(v)
    v.node.parent?.remove(v.node)
    v.node.disconnect()
  }
}
