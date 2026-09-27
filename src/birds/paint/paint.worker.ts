// The paint worker: an atlas job in, its pixels (transferred, not copied) and paint time out. main.tsx starts it
// with `new Worker(new URL(...), { type: 'module' })`, which Vite bundles as a worker of its own.
import { paintJob } from './job'
import type { AtlasJob } from './painter'

addEventListener('message', (e: MessageEvent<AtlasJob>) => {
  const reply = paintJob(e.data)
  postMessage(reply, { transfer: [reply.pixels.buffer as ArrayBuffer] })
})
