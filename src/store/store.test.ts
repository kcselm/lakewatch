import { createStore } from './store'

describe('createStore', () => {
  it('patches state and notifies subscribers once per set', () => {
    const s = createStore({ a: 1, b: 'x' })
    const seen: number[] = []
    const off = s.subscribe(st => seen.push(st.a))
    s.set({ a: 2 })
    s.set(st => ({ a: st.a + 1 }))
    expect(s.get()).toEqual({ a: 3, b: 'x' })
    expect(seen).toEqual([2, 3])
    off()
    s.set({ a: 9 })
    expect(seen).toEqual([2, 3])
  })
})
