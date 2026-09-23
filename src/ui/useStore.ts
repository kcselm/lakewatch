import { useEffect, useState } from 'preact/hooks'
import type { Store } from '../store/store'

export function useStore<T extends object>(store: Store<T>): T {
  const [state, setState] = useState(store.get())
  useEffect(() => store.subscribe(setState), [store])
  return state
}
