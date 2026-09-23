import { createLifeListStorage } from './lifeListStorage'
import { emptyLifeList, recordSighting } from './lifeList'

function memStorage(initial: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(initial))
  return {
    get length() { return m.size },
    clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
    getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v) }, removeItem: k => { m.delete(k) },
  }
}

describe('createLifeListStorage', () => {
  it('round-trips data', () => {
    const st = createLifeListStorage(memStorage())
    const d = recordSighting(emptyLifeList(), { species: 'a', location: 'l', timeOfDay: 'morning', selfIdentified: true, wrongGuesses: 0, at: 't' })
    expect(st.save(d)).toBe(true)
    expect(st.load()).toEqual(d)
    expect(st.persistent).toBe(true)
  })
  it('loads an empty list from corrupt JSON and from an unknown version, then overwrites on save', () => {
    const s1 = memStorage({ 'lakewatch.lifelist': '{not json' })
    expect(createLifeListStorage(s1).load()).toEqual(emptyLifeList())
    const s2 = memStorage({ 'lakewatch.lifelist': JSON.stringify({ version: 99, species: {}, journal: [] }) })
    const st = createLifeListStorage(s2)
    expect(st.load()).toEqual(emptyLifeList())
    st.save(emptyLifeList())
    expect(JSON.parse(s2.getItem('lakewatch.lifelist')!).version).toBe(1)
  })
  it('loads an empty list when species is null or an array', () => {
    const s1 = memStorage({ 'lakewatch.lifelist': JSON.stringify({ version: 1, species: null, journal: [] }) })
    expect(createLifeListStorage(s1).load()).toEqual(emptyLifeList())
    const s2 = memStorage({ 'lakewatch.lifelist': JSON.stringify({ version: 1, species: [], journal: [] }) })
    expect(createLifeListStorage(s2).load()).toEqual(emptyLifeList())
  })
  it('falls back to memory when storage is null or throws', () => {
    const st = createLifeListStorage(null)
    expect(st.persistent).toBe(false)
    const d = recordSighting(emptyLifeList(), { species: 'a', location: 'l', timeOfDay: 'morning', selfIdentified: true, wrongGuesses: 0, at: 't' })
    expect(st.save(d)).toBe(false)
    expect(st.load()).toEqual(d)
    const throwing = memStorage()
    throwing.setItem = () => { throw new Error('quota') }
    const st2 = createLifeListStorage(throwing)
    expect(st2.save(d)).toBe(false)
    expect(st2.load()).toEqual(d)
  })
})
