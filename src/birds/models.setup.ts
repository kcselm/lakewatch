import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SPECIES } from './species'
import { loadAuthoredForTest } from './detail/authored.testkit'

/**
 * A Vitest setup file (vite.config.ts): before each test file, load every registered authored species' model from
 * public/models/, as the game loads them at startup, so any test can build one: the cast's spawns, the ring budget, the
 * species' own tests. A model not built yet is skipped (that species' tests say so).
 */
for (const spec of Object.values(SPECIES)) {
  if (!spec.authored) continue
  const path = fileURLToPath(new URL(`../../public/models/${spec.authored.model}/${spec.authored.model}.glb`, import.meta.url))
  if (existsSync(path)) await loadAuthoredForTest(spec, path)
}
