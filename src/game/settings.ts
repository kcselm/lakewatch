export interface Settings {
  version: 1
  /** multiplier on BASE_SENSITIVITY */
  sensitivity: number
  volumes: { master: number; ambience: number; calls: number; effects: number }
  /** the water's mirrored render of the scene; off, it reflects only the sky */
  reflections: boolean
}

export const DEFAULT_SETTINGS: Settings = { version: 1, sensitivity: 1, volumes: { master: 0.8, ambience: 0.8, calls: 1, effects: 0.8 }, reflections: true }
export const SENSITIVITY_RANGE: [number, number] = [0.3, 3]
export const BASE_SENSITIVITY = 0.0022

function num(x: unknown, fallback: number, lo: number, hi: number): number {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback
}

/** Whatever was stored, clamped into range, with defaults for anything missing or malformed. */
export function sanitizeSettings(x: unknown): Settings {
  const o = (typeof x === 'object' && x !== null ? x : {}) as { version?: unknown; sensitivity?: unknown; volumes?: unknown; reflections?: unknown }
  if (o.version !== 1) return { ...DEFAULT_SETTINGS, volumes: { ...DEFAULT_SETTINGS.volumes } }
  const v = (typeof o.volumes === 'object' && o.volumes !== null ? o.volumes : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS.volumes
  return {
    version: 1,
    sensitivity: num(o.sensitivity, DEFAULT_SETTINGS.sensitivity, SENSITIVITY_RANGE[0], SENSITIVITY_RANGE[1]),
    volumes: {
      master: num(v['master'], d.master, 0, 1),
      ambience: num(v['ambience'], d.ambience, 0, 1),
      calls: num(v['calls'], d.calls, 0, 1),
      effects: num(v['effects'], d.effects, 0, 1),
    },
    // settings saved before the water round have none: they take the default
    reflections: typeof o.reflections === 'boolean' ? o.reflections : DEFAULT_SETTINGS.reflections,
  }
}

export interface SettingsStorage {
  load(): Settings
  /** true when written to persistent storage */
  save(s: Settings): boolean
}

const DEFAULT_KEY = 'lakewatch.settings'

export function createSettingsStorage(storage: Storage | null, key = DEFAULT_KEY): SettingsStorage {
  return {
    load() {
      if (!storage) return sanitizeSettings(null)
      try {
        const raw = storage.getItem(key)
        return sanitizeSettings(raw ? JSON.parse(raw) : null)
      } catch {
        return sanitizeSettings(null)
      }
    },
    save(s) {
      if (!storage) return false
      try {
        storage.setItem(key, JSON.stringify(s))
        return true
      } catch {
        return false
      }
    },
  }
}

export interface SettingsTargets {
  look: { sensitivity: number }
  engine: { setMasterVolume(v: number): void; setLayerVolume(layer: 'ambience' | 'calls' | 'effects', v: number): void }
  water?: { setReflections(on: boolean): void }
}

export function applySettings(s: Settings, t: SettingsTargets): void {
  t.look.sensitivity = BASE_SENSITIVITY * s.sensitivity
  t.engine.setMasterVolume(s.volumes.master)
  t.engine.setLayerVolume('ambience', s.volumes.ambience)
  t.engine.setLayerVolume('calls', s.volumes.calls)
  t.engine.setLayerVolume('effects', s.volumes.effects)
  t.water?.setReflections(s.reflections)
}
