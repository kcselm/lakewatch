import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { SpeciesSpec } from '../spec'
import { authoredBuilt, authoredReady, parseGlb, storeAuthored } from './authored'

/** Load an authored species' model from disk for a test, as the game loads it at startup. */
export async function loadAuthoredForTest(spec: SpeciesSpec, path: string): Promise<void> {
  if (authoredReady(spec.code)) return
  const buf = readFileSync(path)
  const scene = await parseGlb(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
  storeAuthored(spec.code, authoredBuilt(spec, scene))
}

/** the Blender test bird, beside this file */
export const TEST_BIRD_GLB = fileURLToPath(new URL('./testbird.glb', import.meta.url))
