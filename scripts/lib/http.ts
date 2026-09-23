export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>
export type Sleeper = (ms: number) => Promise<void>
export type HttpFn = (url: string, init?: RequestInit) => Promise<Response>

export interface HttpDeps {
  fetcher: Fetcher
  sleep: Sleeper
}

export interface RetryOptions {
  retries?: number
  baseDelayMs?: number
  throttleMs?: number
}

export function createHttpClient(deps: HttpDeps, opts: RetryOptions = {}): HttpFn {
  const { retries = 4, baseDelayMs = 500, throttleMs = 120 } = opts
  let hasRequested = false

  return async function http(url, init) {
    if (hasRequested && throttleMs > 0) await deps.sleep(throttleMs)
    hasRequested = true

    let lastStatus: number | null = null
    let lastError: unknown = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await deps.sleep(baseDelayMs * 2 ** (attempt - 1))

      try {
        const res = await deps.fetcher(url, init)
        if (res.status !== 429 && res.status < 500) return res
        lastStatus = res.status
      } catch (err) {
        lastError = err
      }
    }

    const reason = lastStatus !== null ? `status ${lastStatus}` : String(lastError)
    throw new Error(`Request to ${url} failed after ${retries} retries (${reason})`)
  }
}

export const realSleep: Sleeper = (ms) => new Promise(r => setTimeout(r, ms))
