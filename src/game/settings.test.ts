import { sanitizeSettings, DEFAULT_SETTINGS, createSettingsStorage, applySettings, BASE_SENSITIVITY } from './settings'

function fakeStorage(initial: Record<string, string> = {}, opts: { throwOnSet?: boolean } = {}): Storage {
  const m = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { if (opts.throwOnSet) throw new Error('quota'); m.set(k, v) },
    removeItem: (k: string) => { m.delete(k) },
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size },
  } as Storage
}

describe('sanitizeSettings', () => {
  it('returns defaults for nothing, garbage, or an unknown version', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('nope')).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings({ version: 2, sensitivity: 2 })).toEqual(DEFAULT_SETTINGS)
  })
  it('clamps out-of-range values and replaces non-numbers with defaults', () => {
    const s = sanitizeSettings({ version: 1, sensitivity: -1, volumes: { master: 5, ambience: 'loud', calls: NaN, effects: 0.5 } })
    expect(s.sensitivity).toBe(0.3)
    expect(s.volumes).toEqual({ master: 1, ambience: DEFAULT_SETTINGS.volumes.ambience, calls: DEFAULT_SETTINGS.volumes.calls, effects: 0.5 })
  })
  it('keeps values already in range', () => {
    const s = sanitizeSettings({ version: 1, sensitivity: 1.5, volumes: { master: 0.2, ambience: 0.3, calls: 0.4, effects: 0.6 } })
    expect(s).toEqual({ version: 1, sensitivity: 1.5, volumes: { master: 0.2, ambience: 0.3, calls: 0.4, effects: 0.6 }, reflections: true })
  })
  it('turns reflections on for settings saved before they existed, and keeps them off once turned off', () => {
    expect(sanitizeSettings({ version: 1, sensitivity: 1 }).reflections).toBe(true)
    expect(sanitizeSettings({ version: 1, reflections: false }).reflections).toBe(false)
    expect(sanitizeSettings({ version: 1, reflections: 'no' }).reflections).toBe(true)
  })
})

describe('createSettingsStorage', () => {
  it('round-trips through storage', () => {
    const st = createSettingsStorage(fakeStorage())
    const s = { ...DEFAULT_SETTINGS, sensitivity: 2 }
    expect(st.save(s)).toBe(true)
    expect(st.load()).toEqual(s)
  })
  it('loads defaults from corrupt JSON and without storage, and reports a failed save', () => {
    expect(createSettingsStorage(fakeStorage({ 'lakewatch.settings': '{bad' })).load()).toEqual(DEFAULT_SETTINGS)
    expect(createSettingsStorage(null).load()).toEqual(DEFAULT_SETTINGS)
    expect(createSettingsStorage(null).save(DEFAULT_SETTINGS)).toBe(false)
    expect(createSettingsStorage(fakeStorage({}, { throwOnSet: true })).save(DEFAULT_SETTINGS)).toBe(false)
  })
})

describe('applySettings', () => {
  it('scales the look sensitivity, pushes every volume to the engine, and turns the water\'s reflections on or off', () => {
    const look = { sensitivity: 0 }
    const calls: [string, number][] = []
    const engine = { setMasterVolume: (v: number) => calls.push(['master', v]), setLayerVolume: (l: string, v: number) => calls.push([l, v]) }
    let reflections: boolean | undefined
    const water = { setReflections: (on: boolean) => { reflections = on } }
    applySettings({ version: 1, sensitivity: 2, volumes: { master: 0.5, ambience: 0.1, calls: 0.2, effects: 0.3 }, reflections: false }, { look, engine, water })
    expect(look.sensitivity).toBeCloseTo(BASE_SENSITIVITY * 2, 10)
    expect(calls).toEqual([['master', 0.5], ['ambience', 0.1], ['calls', 0.2], ['effects', 0.3]])
    expect(reflections).toBe(false)
  })
})
