import { emptyLifeList, type LifeListData } from './lifeList'

export interface LifeListStorage {
  load(): LifeListData
  /** true when written to persistent storage */
  save(d: LifeListData): boolean
  readonly persistent: boolean
}

const DEFAULT_KEY = 'lakewatch.lifelist'

function isV1(x: unknown): x is LifeListData {
  return typeof x === 'object' && x !== null && (x as { version?: unknown }).version === 1
    && typeof (x as { species?: unknown }).species === 'object' && Array.isArray((x as { journal?: unknown }).journal)
}

export function createLifeListStorage(storage: Storage | null, key = DEFAULT_KEY): LifeListStorage {
  let memory: LifeListData | null = null
  let persistent = storage !== null
  return {
    get persistent() { return persistent },
    load() {
      if (memory) return memory
      if (!storage) return (memory = emptyLifeList())
      try {
        const raw = storage.getItem(key)
        const parsed: unknown = raw ? JSON.parse(raw) : null
        memory = isV1(parsed) ? parsed : emptyLifeList()
      } catch {
        memory = emptyLifeList()
      }
      return memory
    },
    save(d) {
      memory = d
      if (!storage) return false
      try {
        storage.setItem(key, JSON.stringify(d))
        return true
      } catch {
        persistent = false
        return false
      }
    },
  }
}
