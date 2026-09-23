import { describe, it, expect, vi } from 'vitest'
import { createHttpClient } from './http'

const ok = () => new Response('{}', { status: 200 })
const fail = (status: number) => new Response('', { status })
const noSleep = async () => {}

describe('createHttpClient', () => {
  it('returns a successful response without retrying', async () => {
    const fetcher = vi.fn().mockResolvedValue(ok())
    const http = createHttpClient({ fetcher, sleep: noSleep })
    expect((await http('https://x.test')).status).toBe(200)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('retries on 429 and succeeds', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(fail(429))
      .mockResolvedValueOnce(ok())
    const http = createHttpClient({ fetcher, sleep: noSleep })
    expect((await http('https://x.test')).status).toBe(200)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('retries on 500', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(fail(500)).mockResolvedValueOnce(ok())
    const http = createHttpClient({ fetcher, sleep: noSleep })
    expect((await http('https://x.test')).status).toBe(200)
  })

  it('does not retry on 404', async () => {
    const fetcher = vi.fn().mockResolvedValue(fail(404))
    const http = createHttpClient({ fetcher, sleep: noSleep })
    expect((await http('https://x.test')).status).toBe(404)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('does not retry on 408', async () => {
    const fetcher = vi.fn().mockResolvedValue(fail(408))
    const http = createHttpClient({ fetcher, sleep: noSleep })
    expect((await http('https://x.test')).status).toBe(408)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('gives up after the retry limit and throws', async () => {
    const fetcher = vi.fn().mockResolvedValue(fail(429))
    const http = createHttpClient({ fetcher, sleep: noSleep }, { retries: 3 })
    await expect(http('https://x.test')).rejects.toThrow(/after 3 retries/)
    expect(fetcher).toHaveBeenCalledTimes(4)
  })

  it('backs off exponentially', async () => {
    const delays: number[] = []
    const fetcher = vi.fn().mockResolvedValue(fail(429))
    const http = createHttpClient(
      { fetcher, sleep: async (ms) => { delays.push(ms) } },
      { retries: 3, baseDelayMs: 100, throttleMs: 0 },
    )
    await expect(http('https://x.test')).rejects.toThrow()
    expect(delays).toEqual([100, 200, 400])
  })

  it('retries when the fetcher throws a network error', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(ok())
    const http = createHttpClient({ fetcher, sleep: noSleep })
    expect((await http('https://x.test')).status).toBe(200)
  })

  it('throttles between calls', async () => {
    const delays: number[] = []
    const fetcher = vi.fn().mockResolvedValue(ok())
    const http = createHttpClient(
      { fetcher, sleep: async (ms) => { delays.push(ms) } },
      { throttleMs: 50 },
    )
    await http('https://x.test')
    await http('https://x.test')
    await http('https://x.test')
    expect(delays).toEqual([50, 50])
  })
})
