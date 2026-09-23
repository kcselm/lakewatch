# Lakewatch Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable lake scene: wind-driven world, four procedural bird species with true-to-life behavior, first-person look with binoculars and telescope, field guide identification, and a persistent life list.

**Architecture:** A Three.js render loop owns the world and birds; a tiny observable store links it to a Preact overlay (field guide, cards, life list) and a plain-DOM HUD. The location is data (`data/locations/lake.json`), validated with zod against the bird catalog copied from birdsong-quiz. Every bird is a `BirdModel` behind one interface so procedural meshes can later be swapped for Blender exports. Every animated thing reads one shared wind state.

**Tech Stack:** Vite 8, TypeScript 7, Vitest 5, Three.js 0.186, Preact 10 (via `@preact/preset-vite`), zod 4, Cloudflare Pages via wrangler (deploy is in Milestone 2).

**Spec:** `docs/superpowers/specs/2026-09-22-lakewatch-design.md`

**Milestone split:** This plan covers build-order steps 1 to 5 of the spec. Audio, flyover flocks, the kingfisher, the remaining species, title card, settings, credits, and deploy are Milestone 2 and get their own plan once this one ships.

## Global Constraints

- Browser target: Chrome, 60 fps on an integrated GPU. Fixed viewpoint, no LOD.
- Non-commercial: all media stays CC-NC with attribution carried in `data/birds.json`.
- Art direction: stylized realism. No photo textures on any mesh. Colors are per-part vertex colors or material colors.
- Every module that animates reads wind from the shared `Wind` object; nothing animates independently.
- Game logic (targeting, identification, life list) queries the `BirdRegistry`, never the Three.js scene graph.
- Validation failures in location or species data are build errors, never runtime fallbacks.
- Both optics use a single circular mask.
- Pure logic is unit-tested with Vitest. Rendering is checked by eye with the dev overlay.
- `npm run build` runs typecheck and tests before `vite build`.
- Every commit leaves `npm test` green. Do not commit `node_modules`, `.env`, or `dist`.

## Review Focus

Inputs the spec implies but no task's tests would otherwise exercise, each pinned to a test in the owning task:

1. **A cast species that exists in the catalog but is tagged only `shoreline`** must fail the habitat cast check with a message naming the species (Task 3).
2. **A polygon zone with fewer than three points** must be rejected by the location schema, since a degenerate zone would make `randomPointInPolygon` loop forever (Task 3).
3. **A bird exactly at the reticle edge or exactly at the size threshold** must resolve deterministically: inside and at threshold count as targetable (Task 16).
4. **Guessing the same wrong species twice** must count as two misses, not one, and the third miss reveals regardless of which species were guessed (Task 17).
5. **localStorage present but holding corrupt JSON or an unknown schema version** must load as an empty life list rather than throw, and the next save must overwrite it (Task 18).

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `src/main.ts`, `src/vite-env.d.ts`, `src/smoke.test.ts`, `src/styles.css`

**Interfaces:**
- Produces: an `npm test` and `npm run dev` that work; `#app` div for the canvas, `#hud` for plain DOM, `#ui` for Preact.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "lakewatch",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json",
    "build": "npm run typecheck && npm test && vite build",
    "harvest:hotspots": "tsx --env-file=.env scripts/harvest-hotspots.ts",
    "harvest:species": "tsx --env-file=.env scripts/harvest-species.ts",
    "harvest:taxonomy": "tsx --env-file=.env scripts/harvest-taxonomy.ts",
    "harvest:media": "tsx --env-file=.env scripts/harvest-media.ts",
    "build:birds": "tsx scripts/build-birds.ts",
    "harvest:all": "npm run harvest:hotspots && npm run harvest:species && npm run harvest:taxonomy && npm run harvest:media && npm run build:birds"
  },
  "dependencies": {
    "preact": "^10.29.8",
    "three": "^0.186.0",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "@preact/preset-vite": "^2.10.6",
    "@types/node": "^26.4.0",
    "@types/three": "^0.186.0",
    "ffmpeg-static": "^5.3.0",
    "tsx": "^4.23.12",
    "typescript": "^7.0.2",
    "vite": "^8.3.0",
    "vitest": "^5.0.1"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "scripts"]
}
```

- [ ] **Step 4: Create index.html, styles, entry, and env types**

`index.html`:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Lakewatch</title>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <div id="hud"></div>
    <div id="ui"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/styles.css`:

```css
html, body { margin: 0; height: 100%; background: #0b1016; overflow: hidden; font-family: system-ui, sans-serif; color: #e8e4d8; }
#app canvas { display: block; width: 100vw; height: 100vh; }
#hud { position: fixed; inset: 0; pointer-events: none; }
#ui { position: fixed; inset: 0; pointer-events: none; }
#ui > * { pointer-events: auto; }
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`src/main.ts`:

```ts
console.log('lakewatch boot')
```

`.gitignore`:

```
node_modules
dist
.env
data/raw
```

- [ ] **Step 5: Write a smoke test**

`src/smoke.test.ts`:

```ts
describe('toolchain', () => {
  it('runs vitest with globals', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Install and run**

Run: `npm install && npm test && npm run typecheck`
Expected: 1 test passes, typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite + three + preact project"
```

---

### Task 2: Copy the bird catalog and harvest pipeline

**Files:**
- Create: `src/catalog/types.ts`, `src/catalog/schema.ts`, `src/catalog/rng.ts`, `src/catalog/index.ts`, `src/catalog/rng.test.ts`
- Create (copied): `scripts/**`, `data/birds.json`, `data/hotspots.json`, `data/name-overrides.json`, `data/habitat-overrides.json`, `data/reviews.json`, `public/media/**`, `.env.example`
- Create: `data/species-allowlist.json`, `scripts/lib/allowlist.ts`, `scripts/lib/allowlist.test.ts`
- Modify: `scripts/harvest-species.ts`

**Interfaces:**
- Produces: `Bird`, `Habitat`, `AudioClip`, `Photo`, `Rng` types; `parseBirds(data: unknown): Bird[]`; `makeRng(seed: number): Rng`, `pickOne`, `shuffle`; `loadCatalog(): Bird[]` (imports `data/birds.json`).
- The copied scripts import catalog types from `../src/catalog/types` instead of `../src/quiz/types`.

- [ ] **Step 1: Copy files from birdsong-quiz**

Run from `C:/Users/kcsel/repo/lakewatch`:

```bash
cp -r ../birdsong-quiz/scripts ./scripts
mkdir -p data public
cp ../birdsong-quiz/data/{birds,hotspots,name-overrides,habitat-overrides,reviews}.json data/
cp -r ../birdsong-quiz/public/media public/media
cp ../birdsong-quiz/.env.example .env.example
mkdir -p src/catalog
cp ../birdsong-quiz/src/quiz/types.ts src/catalog/types.ts
cp ../birdsong-quiz/src/quiz/schema.ts src/catalog/schema.ts
cp ../birdsong-quiz/src/quiz/rng.ts src/catalog/rng.ts
cp ../birdsong-quiz/src/quiz/rng.test.ts src/catalog/rng.test.ts
```

- [ ] **Step 2: Trim types.ts to what the game needs**

Replace `src/catalog/types.ts` with:

```ts
export type Habitat = 'wetland' | 'forest' | 'shoreline' | 'urban'
export type ClipType = 'song' | 'call'
export type Rng = () => number

export const HABITATS: readonly Habitat[] = ['wetland', 'forest', 'shoreline', 'urban']

export interface AudioClip {
  file: string
  type: ClipType
  xcId: string
  recordist: string
  license: string
  sourceUrl: string
}

export interface Photo {
  file: string
  attribution: string
  license: string
  sourceUrl: string
}

export interface Bird {
  speciesCode: string
  commonName: string
  scientificName: string
  family: string
  familyCommon: string
  habitats: Habitat[]
  frequency: number
  /** Share of sampled dates per calendar month (Jan..Dec) on which the species was reported. */
  monthly: number[]
  audio: AudioClip[]
  photo: Photo | null
}
```

Keep `schema.ts` and `rng.ts` unchanged; their `./types` imports still resolve.

- [ ] **Step 3: Repoint script imports**

Run:

```bash
grep -rl "src/quiz" scripts | xargs sed -i "s#src/quiz/types#src/catalog/types#g; s#src/quiz/schema#src/catalog/schema#g"
grep -rn "src/quiz" scripts
```

Expected: the second grep prints only `build-birds.ts` lines importing `eligibility` and `HABITATS` from `types`. Edit `scripts/build-birds.ts`: remove the `filterEligible` import and the summary block at the bottom that uses it; replace with:

```ts
await writeFile('data/birds.json', JSON.stringify(birds, null, 2))
console.log(`Wrote ${birds.length} birds to data/birds.json`)
for (const h of HABITATS) {
  console.log(`  ${h}: ${birds.filter(b => b.habitats.includes(h)).length}`)
}
```

with `HABITATS` imported from `../src/catalog/types`.

- [ ] **Step 4: Add catalog index**

`src/catalog/index.ts`:

```ts
import raw from '../../data/birds.json'
import { parseBirds } from './schema'
import type { Bird } from './types'

let cache: Bird[] | null = null

export function loadCatalog(): Bird[] {
  if (!cache) cache = parseBirds(raw)
  return cache
}

export function findBird(code: string, birds: Bird[] = loadCatalog()): Bird {
  const b = birds.find(x => x.speciesCode === code)
  if (!b) throw new Error(`Unknown species code: ${code}`)
  return b
}

export type { Bird, Habitat, AudioClip, Photo, Rng } from './types'
export { makeRng, pickOne, shuffle } from './rng'
```

- [ ] **Step 5: Write the failing allow-list test**

`scripts/lib/allowlist.test.ts`:

```ts
import { mergeAllowlist } from './allowlist'
import type { CandidateRecord } from './taxonomy'

const sampled: CandidateRecord[] = [
  { speciesCode: 'mallar3', habitats: ['wetland'], frequency: 0.9, monthly: Array(12).fill(0.9) },
]

describe('mergeAllowlist', () => {
  it('appends species missing from the sample with the allow-listed habitats', () => {
    const out = mergeAllowlist(sampled, { amwpel: ['wetland'] })
    expect(out.map(c => c.speciesCode)).toEqual(['mallar3', 'amwpel'])
    expect(out[1]).toMatchObject({ habitats: ['wetland'], frequency: 0.15 })
    expect(out[1]!.monthly).toHaveLength(12)
  })

  it('adds habitats to a species already in the sample without duplicating it', () => {
    const out = mergeAllowlist(sampled, { mallar3: ['wetland', 'urban'] })
    expect(out).toHaveLength(1)
    expect(out[0]!.habitats).toEqual(['wetland', 'urban'])
    expect(out[0]!.frequency).toBe(0.9)
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run scripts/lib/allowlist.test.ts`
Expected: FAIL, cannot find module `./allowlist`.

- [ ] **Step 7: Implement allowlist**

`scripts/lib/allowlist.ts`:

```ts
import type { CandidateRecord } from './taxonomy'

export type Allowlist = Record<string, string[]>

/** Placeholder frequency for species the sample missed: the harvest's own floor. */
const ALLOWLIST_FREQUENCY = 0.15

export function mergeAllowlist(
  candidates: readonly CandidateRecord[],
  allowlist: Allowlist,
): CandidateRecord[] {
  const out = candidates.map(c => ({ ...c, habitats: [...c.habitats] }))
  for (const [code, habitats] of Object.entries(allowlist)) {
    const existing = out.find(c => c.speciesCode === code)
    if (existing) {
      for (const h of habitats) if (!existing.habitats.includes(h)) existing.habitats.push(h)
    } else {
      out.push({
        speciesCode: code,
        habitats: [...habitats],
        frequency: ALLOWLIST_FREQUENCY,
        monthly: Array(12).fill(ALLOWLIST_FREQUENCY),
      })
    }
  }
  return out
}
```

`data/species-allowlist.json`:

```json
{
  "amwpel": ["wetland"],
  "leasan": ["wetland", "shoreline"],
  "wessan": ["wetland", "shoreline"],
  "greyel": ["wetland", "shoreline"]
}
```

In `scripts/harvest-species.ts`, after `const out = [...]` is computed and before `mkdir`, add:

```ts
import { mergeAllowlist, type Allowlist } from './lib/allowlist'
// ...
const allowlist = JSON.parse(await readFile('data/species-allowlist.json', 'utf8')) as Allowlist
const withAllowlist = mergeAllowlist(out, allowlist)
```

and write `withAllowlist` instead of `out`.

- [ ] **Step 8: Run all tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all copied script tests plus the new one pass; typecheck clean.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: copy bird catalog and harvest pipeline; add species allow-list"
```

**Manual step (not blocking):** with `EBIRD_API_KEY` and `XC_API_KEY` in `.env`, run `npm run harvest:species && npm run harvest:taxonomy && npm run harvest:media && npm run build:birds` to pull the four allow-listed species. Until then the lake cast in Task 3 uses only species already in the catalog; the pelican and sandpiper entries are added to `lake.json` when their media lands.

---

### Task 3: Location schema, loader, and habitat cast check

**Files:**
- Create: `src/location/schema.ts`, `src/location/schema.test.ts`, `src/location/validate.ts`, `src/location/validate.test.ts`, `src/location/index.ts`, `data/locations/lake.json`

**Interfaces:**
- Produces:

```ts
export type Vec2 = [number, number]           // x, z on the ground plane
export type Vec3 = [number, number, number]
export type Behavior = 'swim' | 'wade' | 'probe' | 'perch' | 'flyover' | 'hover'
export type PolygonZone = { kind: 'polygon'; points: Vec2[] }
export type PointZone = { kind: 'point'; position: Vec3 }
export type LaneZone = { kind: 'lane'; from: Vec3; to: Vec3; altitude: [number, number] }
export type Zone = PolygonZone | PointZone | LaneZone
export interface CastEntry { species: string; behavior: Behavior; zone: string; count: number; plumage?: 'male' | 'female' | 'mixed'; everySeconds?: [number, number] }
export interface Location { id: string; name: string; region: string; habitat: Habitat; season: 'spring'|'summer'|'early-autumn'|'autumn'|'winter'; timeOfDay: 'dawn'|'morning'|'midday'|'evening'; vantage: { position: Vec3; heading: number }; wind: { direction: number; strength: number; gustiness: number }; zones: Record<string, Zone>; cast: CastEntry[]; ambience: string[] }
export function parseLocation(data: unknown): Location
export function validateCast(loc: Location, birds: readonly Bird[]): string[]   // [] means valid
export function loadLocation(): Location   // parses and validates lake.json, throws on error
```

- [ ] **Step 1: Write failing schema tests**

`src/location/schema.test.ts`:

```ts
import { parseLocation } from './schema'

const base = {
  id: 'test', name: 'Test', region: 'Nowhere', habitat: 'wetland',
  season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 20 },
  wind: { direction: 240, strength: 0.35, gustiness: 0.5 },
  zones: {
    water: { kind: 'polygon', points: [[-10, -10], [10, -10], [10, 10], [-10, 10]] },
    snag: { kind: 'point', position: [5, 0, -30] },
    sky: { kind: 'lane', from: [-100, 0, -50], to: [100, 0, -50], altitude: [40, 80] },
  },
  cast: [{ species: 'y00475', behavior: 'swim', zone: 'water', count: 3 }],
  ambience: [],
}

describe('parseLocation', () => {
  it('accepts a valid location', () => {
    expect(parseLocation(base).id).toBe('test')
  })
  it('rejects a polygon zone with fewer than three points', () => {
    const bad = { ...base, zones: { ...base.zones, water: { kind: 'polygon', points: [[0, 0], [1, 1]] } } }
    expect(() => parseLocation(bad)).toThrow(/points/)
  })
  it('rejects an unknown behavior', () => {
    const bad = { ...base, cast: [{ ...base.cast[0], behavior: 'dance' }] }
    expect(() => parseLocation(bad)).toThrow()
  })
  it('rejects a count below one', () => {
    const bad = { ...base, cast: [{ ...base.cast[0], count: 0 }] }
    expect(() => parseLocation(bad)).toThrow()
  })
  it('rejects wind strength outside 0..1', () => {
    const bad = { ...base, wind: { ...base.wind, strength: 1.5 } }
    expect(() => parseLocation(bad)).toThrow()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/location/schema.test.ts`
Expected: FAIL, cannot find module `./schema`.

- [ ] **Step 3: Implement the schema**

`src/location/schema.ts`:

```ts
import { z } from 'zod'
import type { Habitat } from '../catalog/types'

const vec2 = z.tuple([z.number(), z.number()])
const vec3 = z.tuple([z.number(), z.number(), z.number()])

const polygonZone = z.object({ kind: z.literal('polygon'), points: z.array(vec2).min(3, 'polygon needs at least 3 points') })
const pointZone = z.object({ kind: z.literal('point'), position: vec3 })
const laneZone = z.object({
  kind: z.literal('lane'), from: vec3, to: vec3,
  altitude: z.tuple([z.number(), z.number()]),
})
const zoneSchema = z.discriminatedUnion('kind', [polygonZone, pointZone, laneZone])

export const behaviorSchema = z.enum(['swim', 'wade', 'probe', 'perch', 'flyover', 'hover'])

const castEntry = z.object({
  species: z.string().min(1),
  behavior: behaviorSchema,
  zone: z.string().min(1),
  count: z.number().int().min(1),
  plumage: z.enum(['male', 'female', 'mixed']).optional(),
  everySeconds: z.tuple([z.number().positive(), z.number().positive()]).optional(),
})

export const locationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string(),
  habitat: z.enum(['wetland', 'forest', 'shoreline', 'urban']),
  season: z.enum(['spring', 'summer', 'early-autumn', 'autumn', 'winter']),
  timeOfDay: z.enum(['dawn', 'morning', 'midday', 'evening']),
  vantage: z.object({ position: vec3, heading: z.number() }),
  wind: z.object({
    direction: z.number().min(0).max(360),
    strength: z.number().min(0).max(1),
    gustiness: z.number().min(0).max(1),
  }),
  zones: z.record(z.string(), zoneSchema),
  cast: z.array(castEntry),
  ambience: z.array(z.string()),
})

export type Vec2 = z.infer<typeof vec2>
export type Vec3 = z.infer<typeof vec3>
export type Zone = z.infer<typeof zoneSchema>
export type PolygonZone = z.infer<typeof polygonZone>
export type PointZone = z.infer<typeof pointZone>
export type LaneZone = z.infer<typeof laneZone>
export type Behavior = z.infer<typeof behaviorSchema>
export type CastEntry = z.infer<typeof castEntry>
export type Location = Omit<z.infer<typeof locationSchema>, 'habitat'> & { habitat: Habitat }

export function parseLocation(data: unknown): Location {
  return locationSchema.parse(data) as Location
}
```

- [ ] **Step 4: Run schema tests**

Run: `npx vitest run src/location/schema.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Write failing validate tests**

`src/location/validate.test.ts`:

```ts
import { validateCast } from './validate'
import type { Location } from './schema'
import type { Bird } from '../catalog/types'

const bird = (code: string, habitats: Bird['habitats']): Bird => ({
  speciesCode: code, commonName: code, scientificName: code, family: 'F', familyCommon: 'F',
  habitats, frequency: 0.5, monthly: Array(12).fill(0.5), audio: [], photo: null,
})

const loc: Location = {
  id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 0 },
  wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
  zones: { water: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] } },
  cast: [{ species: 'y00475', behavior: 'swim', zone: 'water', count: 2 }],
  ambience: [],
}

describe('validateCast', () => {
  it('passes when every species is tagged for the habitat and zones exist', () => {
    expect(validateCast(loc, [bird('y00475', ['wetland'])])).toEqual([])
  })
  it('names a species not in the catalog', () => {
    expect(validateCast(loc, [])).toEqual(['cast[0]: species y00475 is not in the catalog'])
  })
  it('names a species tagged only for another habitat', () => {
    expect(validateCast(loc, [bird('y00475', ['shoreline'])])).toEqual([
      'cast[0]: y00475 is not tagged for habitat wetland (has shoreline)',
    ])
  })
  it('names a missing zone', () => {
    const bad = { ...loc, cast: [{ ...loc.cast[0]!, zone: 'reeds' }] }
    expect(validateCast(bad, [bird('y00475', ['wetland'])])).toEqual(['cast[0]: zone reeds does not exist'])
  })
  it('requires flyover entries to use a lane zone', () => {
    const bad = { ...loc, cast: [{ ...loc.cast[0]!, behavior: 'flyover' as const }] }
    expect(validateCast(bad, [bird('y00475', ['wetland'])])).toEqual(['cast[0]: flyover needs a lane zone, water is polygon'])
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/location/validate.test.ts`
Expected: FAIL, cannot find module `./validate`.

- [ ] **Step 7: Implement validate and index**

`src/location/validate.ts`:

```ts
import type { Location } from './schema'
import type { Bird } from '../catalog/types'

const ZONE_KIND_FOR_BEHAVIOR = {
  swim: 'polygon', wade: 'polygon', probe: 'polygon',
  perch: 'point', hover: 'point', flyover: 'lane',
} as const

export function validateCast(loc: Location, birds: readonly Bird[]): string[] {
  const errors: string[] = []
  const byCode = new Map(birds.map(b => [b.speciesCode, b]))
  loc.cast.forEach((entry, i) => {
    const bird = byCode.get(entry.species)
    if (!bird) {
      errors.push(`cast[${i}]: species ${entry.species} is not in the catalog`)
    } else if (!bird.habitats.includes(loc.habitat)) {
      errors.push(`cast[${i}]: ${entry.species} is not tagged for habitat ${loc.habitat} (has ${bird.habitats.join(', ')})`)
    }
    const zone = loc.zones[entry.zone]
    if (!zone) {
      errors.push(`cast[${i}]: zone ${entry.zone} does not exist`)
      return
    }
    const want = ZONE_KIND_FOR_BEHAVIOR[entry.behavior]
    if (zone.kind !== want) {
      errors.push(`cast[${i}]: ${entry.behavior} needs a ${want} zone, ${entry.zone} is ${zone.kind}`)
    }
  })
  return errors
}
```

`src/location/index.ts`:

```ts
import raw from '../../data/locations/lake.json'
import { parseLocation, type Location } from './schema'
import { validateCast } from './validate'
import { loadCatalog } from '../catalog'

export function loadLocation(): Location {
  const loc = parseLocation(raw)
  const errors = validateCast(loc, loadCatalog())
  if (errors.length > 0) throw new Error(`Invalid location ${loc.id}:\n  ${errors.join('\n  ')}`)
  return loc
}

export * from './schema'
export { validateCast } from './validate'
```

- [ ] **Step 8: Write lake.json**

`data/locations/lake.json`. Coordinates are meters; +x is right of the vantage, -z is forward, y is up. The water surface is y=0. The vantage stands on a bank at y=1.6 looking at heading 20 degrees (slightly right of -z).

```json
{
  "id": "willow-lake",
  "name": "Willow Lake",
  "region": "Willamette Valley, Oregon",
  "habitat": "wetland",
  "season": "early-autumn",
  "timeOfDay": "morning",
  "vantage": { "position": [0, 1.6, 0], "heading": 20 },
  "wind": { "direction": 240, "strength": 0.35, "gustiness": 0.5 },
  "zones": {
    "open-water": { "kind": "polygon", "points": [[-25, -12], [30, -12], [45, -60], [-40, -60]] },
    "near-water": { "kind": "polygon", "points": [[-12, -8], [14, -8], [18, -25], [-16, -25]] },
    "reeds":      { "kind": "polygon", "points": [[-30, -4], [-12, -4], [-14, -18], [-32, -18]] },
    "mudflat":    { "kind": "polygon", "points": [[8, -3], [28, -3], [34, -14], [14, -12]] },
    "far-shore":  { "kind": "polygon", "points": [[-30, -62], [40, -62], [40, -70], [-30, -70]] },
    "snag":       { "kind": "point",   "position": [22, 0, -48] },
    "sky":        { "kind": "lane",    "from": [-160, 0, -90], "to": [160, 0, -60], "altitude": [40, 80] }
  },
  "cast": [
    { "species": "y00475",  "behavior": "swim",  "zone": "near-water", "count": 6 },
    { "species": "mallar3", "behavior": "swim",  "zone": "near-water", "count": 4, "plumage": "mixed" },
    { "species": "gadwal",  "behavior": "swim",  "zone": "open-water", "count": 3, "plumage": "mixed" },
    { "species": "amewig",  "behavior": "swim",  "zone": "open-water", "count": 5, "plumage": "mixed" },
    { "species": "pibgre",  "behavior": "swim",  "zone": "open-water", "count": 2 },
    { "species": "grbher3", "behavior": "wade",  "zone": "far-shore",  "count": 1 },
    { "species": "greegr",  "behavior": "wade",  "zone": "far-shore",  "count": 1 },
    { "species": "killde",  "behavior": "probe", "zone": "mudflat",    "count": 3 }
  ],
  "ambience": ["water-lapping", "wind-reeds", "distant-frogs"]
}
```

Only species already in `data/birds.json` appear here. Milestone 1 builds four species models (coot, mallard, great blue heron, killdeer); the others in the cast are spawned with a generic placeholder in Task 15 until their species files exist in Milestone 2.

- [ ] **Step 9: Add a test that the real lake.json loads**

Append to `src/location/validate.test.ts`:

```ts
import { loadLocation } from './index'

describe('lake.json', () => {
  it('parses and passes the habitat cast check against the real catalog', () => {
    const loc = loadLocation()
    expect(loc.id).toBe('willow-lake')
    expect(loc.cast.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 10: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: location schema, habitat cast check, and Willow Lake data"
```

---
### Task 4: Wind

**Files:**
- Create: `src/world/noise.ts`, `src/world/noise.test.ts`, `src/world/wind.ts`, `src/world/wind.test.ts`

**Interfaces:**
- Produces:

```ts
// noise.ts
export function hash1(x: number, seed: number): number          // 0..1, deterministic
export function valueNoise1(t: number, seed: number): number    // smooth 0..1 over t
// wind.ts
export interface WindConfig { direction: number; strength: number; gustiness: number; seed?: number }
export interface WindState { dir: THREE.Vector2; strength: number; gust: number; time: number }
export function gustAt(t: number, gustiness: number, seed: number): number   // 0..1, pure
export class Wind {
  constructor(cfg: WindConfig)
  readonly state: WindState
  readonly uniforms: { uWindDir: { value: THREE.Vector2 }; uWindStrength: { value: number }; uWindGust: { value: number }; uTime: { value: number } }
  update(dt: number): void
  /** strength * (0.6 + 0.4 * gust): what most consumers want */
  effective(): number
}
```

- [ ] **Step 1: Write failing noise and wind tests**

`src/world/noise.test.ts`:

```ts
import { hash1, valueNoise1 } from './noise'

describe('noise', () => {
  it('hash1 is deterministic and in 0..1', () => {
    expect(hash1(3, 7)).toBe(hash1(3, 7))
    for (let i = 0; i < 50; i++) {
      const v = hash1(i, 11)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('valueNoise1 interpolates between integer lattice values', () => {
    const a = valueNoise1(2, 5)
    const b = valueNoise1(3, 5)
    const mid = valueNoise1(2.5, 5)
    expect(mid).toBeGreaterThanOrEqual(Math.min(a, b) - 1e-9)
    expect(mid).toBeLessThanOrEqual(Math.max(a, b) + 1e-9)
  })
  it('different seeds give different sequences', () => {
    expect(valueNoise1(1.3, 1)).not.toBe(valueNoise1(1.3, 2))
  })
})
```

`src/world/wind.test.ts`:

```ts
import { Wind, gustAt } from './wind'

describe('gustAt', () => {
  it('is deterministic for a seed', () => {
    expect(gustAt(12.5, 0.5, 42)).toBe(gustAt(12.5, 0.5, 42))
  })
  it('stays within 0..1', () => {
    for (let t = 0; t < 100; t += 0.37) {
      const g = gustAt(t, 1, 3)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(1)
    }
  })
  it('is flat when gustiness is zero', () => {
    expect(gustAt(0, 0, 1)).toBe(gustAt(50, 0, 1))
  })
})

describe('Wind', () => {
  it('converts a compass direction into a unit vector on the ground plane', () => {
    // direction 0 = wind blowing toward -z (from the north, toward the far shore); 90 = toward +x
    const w = new Wind({ direction: 90, strength: 0.5, gustiness: 0, seed: 1 })
    expect(w.state.dir.x).toBeCloseTo(1)
    expect(w.state.dir.y).toBeCloseTo(0)
  })
  it('advances time and refreshes uniforms on update', () => {
    const w = new Wind({ direction: 0, strength: 0.5, gustiness: 0.5, seed: 1 })
    w.update(0.5)
    expect(w.state.time).toBeCloseTo(0.5)
    expect(w.uniforms.uTime.value).toBeCloseTo(0.5)
    expect(w.uniforms.uWindGust.value).toBe(w.state.gust)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/world`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement noise and wind**

`src/world/noise.ts`:

```ts
/** Integer-lattice hash, 0..1. Pure and cheap; not cryptographic. */
export function hash1(x: number, seed: number): number {
  let h = (Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(seed | 0, 0x165667b1)) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/** 1D value noise with smoothstep interpolation between lattice points. */
export function valueNoise1(t: number, seed: number): number {
  const i = Math.floor(t)
  const f = smoothstep(t - i)
  return hash1(i, seed) * (1 - f) + hash1(i + 1, seed) * f
}
```

`src/world/wind.ts`:

```ts
import * as THREE from 'three'
import { valueNoise1 } from './noise'

export interface WindConfig {
  /** Compass degrees the wind blows toward: 0 = -z (away from the player), 90 = +x. */
  direction: number
  strength: number
  gustiness: number
  seed?: number
}

export interface WindState {
  dir: THREE.Vector2
  strength: number
  gust: number
  time: number
}

/** Two octaves of value noise, scaled by gustiness, 0..1. */
export function gustAt(t: number, gustiness: number, seed: number): number {
  const slow = valueNoise1(t * 0.08, seed)
  const fast = valueNoise1(t * 0.5, seed + 1)
  const g = 0.7 * slow + 0.3 * fast
  return Math.min(1, Math.max(0, g * gustiness))
}

export class Wind {
  readonly state: WindState
  readonly uniforms: {
    uWindDir: { value: THREE.Vector2 }
    uWindStrength: { value: number }
    uWindGust: { value: number }
    uTime: { value: number }
  }
  private readonly gustiness: number
  private readonly seed: number

  constructor(cfg: WindConfig) {
    const rad = THREE.MathUtils.degToRad(cfg.direction)
    this.state = {
      dir: new THREE.Vector2(Math.sin(rad), -Math.cos(rad)),
      strength: cfg.strength,
      gust: 0,
      time: 0,
    }
    this.gustiness = cfg.gustiness
    this.seed = cfg.seed ?? 1
    this.uniforms = {
      uWindDir: { value: this.state.dir },
      uWindStrength: { value: cfg.strength },
      uWindGust: { value: 0 },
      uTime: { value: 0 },
    }
    this.update(0)
  }

  update(dt: number): void {
    this.state.time += dt
    this.state.gust = gustAt(this.state.time, this.gustiness, this.seed)
    this.uniforms.uWindGust.value = this.state.gust
    this.uniforms.uTime.value = this.state.time
  }

  effective(): number {
    return this.state.strength * (0.6 + 0.4 * this.state.gust)
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/world`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/world
git commit -m "feat: seeded noise and shared wind state"
```

---

### Task 5: Scene bootstrap, sky, lighting, and the frame loop

**Files:**
- Create: `src/world/scene.ts`, `src/world/sky.ts`, `src/world/lighting.ts`, `src/world/palette.ts`, `src/world/palette.test.ts`, `src/hud/devOverlay.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces:

```ts
// palette.ts
export interface ScenePalette { skyTop: string; skyHorizon: string; sun: string; fog: string; ambientSky: string; ambientGround: string; sunElevation: number; sunAzimuth: number }
export function paletteFor(season: Location['season'], timeOfDay: Location['timeOfDay']): ScenePalette
// scene.ts
export interface WorldModule { update(dt: number, wind: Wind): void }
export class World {
  constructor(container: HTMLElement, loc: Location)
  readonly scene: THREE.Scene; readonly camera: THREE.PerspectiveCamera; readonly renderer: THREE.WebGLRenderer
  readonly wind: Wind; readonly palette: ScenePalette
  add(mod: WorldModule & { object?: THREE.Object3D }): void
  start(onFrame?: (dt: number) => void): void
  setPaused(p: boolean): void
}
// sky.ts
export function createSky(palette: ScenePalette, wind: Wind): WorldModule & { object: THREE.Object3D }
// lighting.ts
export function createLighting(palette: ScenePalette): { sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight; object: THREE.Group; update(): void }
```

- [ ] **Step 1: Write the failing palette test**

`src/world/palette.test.ts`:

```ts
import { paletteFor } from './palette'

describe('paletteFor', () => {
  it('gives a low warm sun on an early-autumn morning', () => {
    const p = paletteFor('early-autumn', 'morning')
    expect(p.sunElevation).toBeGreaterThan(10)
    expect(p.sunElevation).toBeLessThan(35)
    expect(p.sun).toMatch(/^#[0-9a-f]{6}$/)
  })
  it('puts the midday sun higher than the morning sun', () => {
    expect(paletteFor('summer', 'midday').sunElevation).toBeGreaterThan(paletteFor('summer', 'morning').sunElevation)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/world/palette.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement palette**

`src/world/palette.ts`:

```ts
import type { Location } from '../location/schema'

export interface ScenePalette {
  skyTop: string
  skyHorizon: string
  sun: string
  fog: string
  ambientSky: string
  ambientGround: string
  /** degrees above the horizon */
  sunElevation: number
  /** compass degrees, 0 = -z, 90 = +x */
  sunAzimuth: number
}

const TIME: Record<Location['timeOfDay'], Pick<ScenePalette, 'sunElevation' | 'sunAzimuth' | 'sun' | 'skyTop' | 'skyHorizon'>> = {
  dawn:    { sunElevation: 6,  sunAzimuth: 100, sun: '#ffb27a', skyTop: '#5d7fb3', skyHorizon: '#f3c9a1' },
  morning: { sunElevation: 24, sunAzimuth: 120, sun: '#ffe2b8', skyTop: '#6f9fd8', skyHorizon: '#dce9f2' },
  midday:  { sunElevation: 58, sunAzimuth: 180, sun: '#fff6e8', skyTop: '#4f8fe0', skyHorizon: '#cfe3f5' },
  evening: { sunElevation: 9,  sunAzimuth: 255, sun: '#ffa15e', skyTop: '#4d6a9e', skyHorizon: '#f7c08a' },
}

const SEASON: Record<Location['season'], Pick<ScenePalette, 'fog' | 'ambientSky' | 'ambientGround'>> = {
  spring:         { fog: '#d6e4ea', ambientSky: '#bcd4e8', ambientGround: '#5e6b4a' },
  summer:         { fog: '#dbe6e4', ambientSky: '#c4dcf0', ambientGround: '#6a6f45' },
  'early-autumn': { fog: '#d9dfd6', ambientSky: '#bfd2e2', ambientGround: '#6f6540' },
  autumn:         { fog: '#d3d3cc', ambientSky: '#b6c6d6', ambientGround: '#6a5a3a' },
  winter:         { fog: '#cfd6dc', ambientSky: '#aebfd0', ambientGround: '#55585a' },
}

export function paletteFor(season: Location['season'], timeOfDay: Location['timeOfDay']): ScenePalette {
  return { ...TIME[timeOfDay], ...SEASON[season] }
}
```

- [ ] **Step 4: Run palette test**

Run: `npx vitest run src/world/palette.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement sky**

`src/world/sky.ts`. A gradient dome drawn inside a large sphere with a sun disc, plus six soft cloud billboards that drift with the wind.

```ts
import * as THREE from 'three'
import type { ScenePalette } from './palette'
import type { Wind } from './wind'
import type { WorldModule } from './scene'

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const skyFrag = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunDir;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uTop, pow(h, 0.55));
  float s = dot(normalize(vDir), uSunDir);
  col += uSun * (smoothstep(0.9985, 0.9995, s) * 1.0 + pow(max(s, 0.0), 24.0) * 0.18);
  gl_FragColor = vec4(col, 1.0);
}`

export function sunDirection(p: ScenePalette): THREE.Vector3 {
  const el = THREE.MathUtils.degToRad(p.sunElevation)
  const az = THREE.MathUtils.degToRad(p.sunAzimuth)
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize()
}

function cloudTexture(): THREE.Texture {
  const size = 128
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function createSky(palette: ScenePalette, wind: Wind): WorldModule & { object: THREE.Object3D } {
  const object = new THREE.Group()
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(900, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color(palette.skyTop) },
        uHorizon: { value: new THREE.Color(palette.skyHorizon) },
        uSun: { value: new THREE.Color(palette.sun) },
        uSunDir: { value: sunDirection(palette) },
      },
      vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false,
    }),
  )
  dome.renderOrder = -10
  object.add(dome)

  const tex = cloudTexture()
  const clouds: THREE.Sprite[] = []
  for (let i = 0; i < 6; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7, depthWrite: false, fog: false })
    const s = new THREE.Sprite(m)
    const scale = 120 + i * 30
    s.scale.set(scale * 1.8, scale * 0.7, 1)
    s.position.set(-300 + i * 120, 140 + (i % 3) * 25, -420 - (i % 2) * 90)
    clouds.push(s)
    object.add(s)
  }

  return {
    object,
    update(dt, w) {
      const v = w.effective() * 2.5 * dt
      for (const c of clouds) {
        c.position.x += w.state.dir.x * v
        c.position.z += w.state.dir.y * v
        if (c.position.x > 450) c.position.x = -450
        if (c.position.x < -450) c.position.x = 450
      }
    },
  }
}
```

- [ ] **Step 6: Implement lighting**

`src/world/lighting.ts`:

```ts
import * as THREE from 'three'
import type { ScenePalette } from './palette'
import { sunDirection } from './sky'

export function createLighting(palette: ScenePalette) {
  const object = new THREE.Group()
  const sun = new THREE.DirectionalLight(new THREE.Color(palette.sun), 2.6)
  sun.position.copy(sunDirection(palette)).multiplyScalar(120)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -60
  sun.shadow.camera.right = 60
  sun.shadow.camera.top = 60
  sun.shadow.camera.bottom = -60
  sun.shadow.camera.near = 10
  sun.shadow.camera.far = 300
  sun.shadow.bias = -0.0005
  sun.shadow.radius = 4
  object.add(sun, sun.target)

  const hemi = new THREE.HemisphereLight(new THREE.Color(palette.ambientSky), new THREE.Color(palette.ambientGround), 0.9)
  object.add(hemi)

  return { sun, hemi, object, update() {} }
}
```

- [ ] **Step 7: Implement the World container**

`src/world/scene.ts`:

```ts
import * as THREE from 'three'
import type { Location } from '../location/schema'
import { Wind } from './wind'
import { paletteFor, type ScenePalette } from './palette'
import { createSky } from './sky'
import { createLighting } from './lighting'

export interface WorldModule {
  update(dt: number, wind: Wind): void
}

export class World {
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly wind: Wind
  readonly palette: ScenePalette
  private modules: WorldModule[] = []
  private paused = false
  private last = 0

  constructor(container: HTMLElement, loc: Location) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)

    this.palette = paletteFor(loc.season, loc.timeOfDay)
    this.scene.fog = new THREE.Fog(new THREE.Color(this.palette.fog), 60, 420)

    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000)
    const [x, y, z] = loc.vantage.position
    this.camera.position.set(x, y, z)

    this.wind = new Wind({ ...loc.wind, seed: 7 })
    this.add(createSky(this.palette, this.wind))
    const lights = createLighting(this.palette)
    this.scene.add(lights.object)

    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(innerWidth, innerHeight)
    })
  }

  add(mod: WorldModule & { object?: THREE.Object3D }): void {
    this.modules.push(mod)
    if (mod.object) this.scene.add(mod.object)
  }

  setPaused(p: boolean): void {
    this.paused = p
  }

  start(onFrame?: (dt: number) => void): void {
    this.last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      if (!this.paused) {
        this.wind.update(dt)
        for (const m of this.modules) m.update(dt, this.wind)
        onFrame?.(dt)
      }
      this.renderer.render(this.scene, this.camera)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
}
```

The vignette from the spec is applied in Task 16 as part of the optics mask overlay, which is cheaper than a post-processing pass.

- [ ] **Step 8: Dev overlay and main**

`src/hud/devOverlay.ts`:

```ts
export interface DevStats { fps: number; birds: number; gust: number; mode: string }

export function createDevOverlay(root: HTMLElement) {
  const el = document.createElement('pre')
  el.style.cssText = 'position:absolute;top:8px;left:8px;margin:0;padding:6px 8px;background:rgba(0,0,0,.5);color:#cfe;font:12px/1.4 monospace;display:none'
  root.appendChild(el)
  let visible = false
  addEventListener('keydown', e => {
    if (e.key === '`') { visible = !visible; el.style.display = visible ? 'block' : 'none' }
  })
  let acc = 0, frames = 0, fps = 0
  return {
    update(dt: number, stats: Omit<DevStats, 'fps'>) {
      acc += dt; frames++
      if (acc >= 0.5) { fps = frames / acc; acc = 0; frames = 0 }
      if (visible) el.textContent = `fps ${fps.toFixed(0)}\nbirds ${stats.birds}\ngust ${stats.gust.toFixed(2)}\nmode ${stats.mode}`
    },
  }
}
```

`src/main.ts`:

```ts
import { loadLocation } from './location'
import { World } from './world/scene'
import { createDevOverlay } from './hud/devOverlay'

const loc = loadLocation()
const world = new World(document.getElementById('app')!, loc)
const dev = createDevOverlay(document.getElementById('hud')!)

world.start(dt => {
  dev.update(dt, { birds: 0, gust: world.wind.state.gust, mode: 'eye' })
})
```

- [ ] **Step 9: Visual check**

Run: `npm run dev`, open the URL. Expected: a sky gradient with a sun glow up-right, six soft clouds drifting slowly to the right-forward, dark empty ground. Press backtick: the overlay shows fps near 60 and a gust value that wanders between 0 and 0.5.

- [ ] **Step 10: Typecheck, test, commit**

Run: `npm run typecheck && npm test`

```bash
git add -A
git commit -m "feat: world container, sky dome, lighting, frame loop, dev overlay"
```

---

### Task 6: Terrain

**Files:**
- Create: `src/world/heightfield.ts`, `src/world/heightfield.test.ts`, `src/world/terrain.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces:

```ts
// heightfield.ts (pure)
export interface Heightfield { sample(x: number, z: number): number }   // world y at ground
export function lakeHeightfield(seed: number): Heightfield
export function terrainColor(y: number, slope: number): [number, number, number]  // 0..1 rgb
// terrain.ts
export function createTerrain(hf: Heightfield): WorldModule & { object: THREE.Mesh }
```

The lake basin is a bowl: the water surface is y=0. Land rises to about y=1.2 at the bank under the player and y=2 on the far shore, and dips to about y=-3 mid-lake. The mudflat (right foreground) sits at about y=0.05, barely above water. Reeds grow where y is between -0.2 and 0.4 on the left.

- [ ] **Step 1: Write the failing heightfield test**

`src/world/heightfield.test.ts`:

```ts
import { lakeHeightfield, terrainColor } from './heightfield'

describe('lakeHeightfield', () => {
  const hf = lakeHeightfield(1)
  it('is above water under the player and below water mid-lake', () => {
    expect(hf.sample(0, 0)).toBeGreaterThan(0.8)
    expect(hf.sample(0, -35)).toBeLessThan(-1)
  })
  it('keeps the mudflat just above water', () => {
    const y = hf.sample(20, -8)
    expect(y).toBeGreaterThan(0)
    expect(y).toBeLessThan(0.4)
  })
  it('rises on the far shore', () => {
    expect(hf.sample(0, -66)).toBeGreaterThan(0.5)
  })
  it('is deterministic', () => {
    expect(lakeHeightfield(3).sample(4.2, -9.1)).toBe(lakeHeightfield(3).sample(4.2, -9.1))
  })
})

describe('terrainColor', () => {
  it('is mud brown at the waterline and green on high flat ground', () => {
    const [r, g, b] = terrainColor(0.05, 0)
    expect(r).toBeGreaterThan(g)
    expect(g).toBeGreaterThan(b)
    const [r2, g2] = terrainColor(1.5, 0)
    expect(g2).toBeGreaterThan(r2)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/world/heightfield.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement heightfield**

`src/world/heightfield.ts`:

```ts
import { hash1 } from './noise'

export interface Heightfield {
  sample(x: number, z: number): number
}

function smooth(t: number) { return t * t * (3 - 2 * t) }

/** 2D value noise, 0..1. */
export function valueNoise2(x: number, z: number, seed: number): number {
  const xi = Math.floor(x), zi = Math.floor(z)
  const fx = smooth(x - xi), fz = smooth(z - zi)
  const h = (a: number, b: number) => hash1(a * 7919 + b, seed)
  const top = h(xi, zi) * (1 - fx) + h(xi + 1, zi) * fx
  const bot = h(xi, zi + 1) * (1 - fx) + h(xi + 1, zi + 1) * fx
  return top * (1 - fz) + bot * fz
}

function fbm(x: number, z: number, seed: number): number {
  return 0.6 * valueNoise2(x, z, seed) + 0.3 * valueNoise2(x * 2.1, z * 2.1, seed + 1) + 0.1 * valueNoise2(x * 4.3, z * 4.3, seed + 2)
}

export function lakeHeightfield(seed: number): Heightfield {
  return {
    sample(x, z) {
      // Basin: an ellipse centred at (2, -36), radii 44 x 32. Inside is below water.
      const ex = (x - 2) / 44, ez = (z + 36) / 32
      const r = Math.sqrt(ex * ex + ez * ez)         // 0 centre .. 1 rim
      let y = r < 1 ? -3.2 * (1 - r * r) : 1.0 + (r - 1) * 2.0
      // Bank under the player: a mound around (0,0)
      const dp = Math.hypot(x, z)
      y += 1.4 * Math.exp(-(dp * dp) / 80)
      // Detail
      y += (fbm(x * 0.15, z * 0.15, seed) - 0.5) * 0.35
      // Mudflat: a flat shelf at +0.08 on the right foreground, blended after the detail so it stays flat
      const mx = (x - 20) / 12, mz = (z + 8) / 6
      const mud = Math.exp(-(mx * mx + mz * mz))
      y = y * (1 - mud) + 0.08 * mud
      // Far shore: rise beyond z = -62
      if (z < -62) y += (-62 - z) * 0.35
      return y
    },
  }
}

/** rgb 0..1 by height and slope: mud at the waterline, gravel where steep, grass above. */
export function terrainColor(y: number, slope: number): [number, number, number] {
  const mud: [number, number, number] = [0.36, 0.28, 0.20]
  const gravel: [number, number, number] = [0.52, 0.50, 0.46]
  const grass: [number, number, number] = [0.33, 0.42, 0.20]
  const dryGrass: [number, number, number] = [0.55, 0.50, 0.28]
  const t = Math.min(1, Math.max(0, (y - 0.15) / 0.9))
  const base = mud.map((m, i) => m * (1 - t) + grass[i]! * t) as [number, number, number]
  const dry = Math.min(1, Math.max(0, (y - 1.2) / 1.0)) * 0.5
  const g = base.map((b, i) => b * (1 - dry) + dryGrass[i]! * dry) as [number, number, number]
  const s = Math.min(1, slope * 2.5)
  return g.map((c, i) => c * (1 - s) + gravel[i]! * s) as [number, number, number]
}
```

- [ ] **Step 4: Run heightfield tests**

Run: `npx vitest run src/world/heightfield.test.ts`
Expected: PASS. If the mudflat or far-shore assertion fails, adjust the constants in `lakeHeightfield` (the numbers above were chosen to satisfy the tests; the tests define the intent).

- [ ] **Step 5: Implement terrain mesh**

`src/world/terrain.ts`:

```ts
import * as THREE from 'three'
import type { Heightfield } from './heightfield'
import { terrainColor } from './heightfield'
import type { WorldModule } from './scene'

const SIZE = 400
const SEGMENTS = 200

export function createTerrain(hf: Heightfield): WorldModule & { object: THREE.Mesh } {
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, -SIZE / 2 + 60)          // player near the front edge, lake ahead
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const step = SIZE / SEGMENTS
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    const y = hf.sample(x, z)
    pos.setY(i, y)
    const dx = (hf.sample(x + step, z) - hf.sample(x - step, z)) / (2 * step)
    const dz = (hf.sample(x, z + step) - hf.sample(x, z - step)) / (2 * step)
    const slope = Math.hypot(dx, dz)
    const [r, g, b] = terrainColor(y, slope)
    colors.set([r, g, b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  return { object: mesh, update() {} }
}
```

- [ ] **Step 6: Wire into main**

In `src/main.ts` after `const world = ...`:

```ts
import { lakeHeightfield } from './world/heightfield'
import { createTerrain } from './world/terrain'
// ...
const heightfield = lakeHeightfield(7)
world.add(createTerrain(heightfield))
```

- [ ] **Step 7: Visual check**

Run: `npm run dev`. Expected: a green-brown bank in front of the camera falling away to a dark basin (no water yet), a lighter flat shelf to the right, ground rising to the far side and fading into fog. Colors read as mud at the bottom and grass higher up.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: lake heightfield and vertex-colored terrain"
```

---

### Task 7: Water

**Files:**
- Create: `src/world/water.ts`, `src/world/ripples.ts`, `src/world/ripples.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces:

```ts
// ripples.ts (pure ring bookkeeping, max 32 live rings)
export interface Ripple { x: number; z: number; age: number }
export class RippleBuffer {
  constructor(max?: number)
  spawn(x: number, z: number): void
  update(dt: number): void            // ages and drops rings older than 2.5 s
  readonly rings: readonly Ripple[]
  /** packed [x, z, age, 0] * max for a uniform array */
  pack(target: Float32Array): void
}
// water.ts
export function createWater(wind: Wind, palette: ScenePalette, ripples: RippleBuffer): WorldModule & { object: THREE.Mesh }
```

- [ ] **Step 1: Write the failing ripple test**

`src/world/ripples.test.ts`:

```ts
import { RippleBuffer } from './ripples'

describe('RippleBuffer', () => {
  it('spawns and ages rings, dropping them after 2.5 s', () => {
    const r = new RippleBuffer(4)
    r.spawn(1, 2)
    r.update(1)
    expect(r.rings).toHaveLength(1)
    expect(r.rings[0]!.age).toBeCloseTo(1)
    r.update(2)
    expect(r.rings).toHaveLength(0)
  })
  it('evicts the oldest ring when full', () => {
    const r = new RippleBuffer(2)
    r.spawn(0, 0); r.update(0.1)
    r.spawn(1, 1); r.update(0.1)
    r.spawn(2, 2)
    expect(r.rings.map(x => x.x)).toEqual([1, 2])
  })
  it('packs into a float array with age and padding', () => {
    const r = new RippleBuffer(2)
    r.spawn(3, 4)
    const out = new Float32Array(8)
    r.pack(out)
    expect(Array.from(out.slice(0, 4))).toEqual([3, 4, 0, 0])
    expect(out[6]).toBe(99)   // empty slot age sentinel: never rendered
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/world/ripples.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement RippleBuffer**

`src/world/ripples.ts`:

```ts
export interface Ripple { x: number; z: number; age: number }

export const RIPPLE_LIFE = 2.5
export const MAX_RIPPLES = 32

export class RippleBuffer {
  private list: Ripple[] = []
  constructor(readonly max: number = MAX_RIPPLES) {}

  get rings(): readonly Ripple[] { return this.list }

  spawn(x: number, z: number): void {
    if (this.list.length >= this.max) this.list.shift()
    this.list.push({ x, z, age: 0 })
  }

  update(dt: number): void {
    for (const r of this.list) r.age += dt
    this.list = this.list.filter(r => r.age < RIPPLE_LIFE)
  }

  pack(target: Float32Array): void {
    for (let i = 0; i < this.max; i++) {
      const r = this.list[i]
      target[i * 4] = r?.x ?? 0
      target[i * 4 + 1] = r?.z ?? 0
      target[i * 4 + 2] = r?.age ?? 99
      target[i * 4 + 3] = 0
    }
  }
}
```

- [ ] **Step 4: Run ripple tests**

Run: `npx vitest run src/world/ripples.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement the water shader**

`src/world/water.ts`. The surface is a flat plane at y=0. The fragment shader fakes a sky reflection from the view direction, perturbs normals with two scrolling noise layers that follow the wind, darkens with depth toward the shore using the terrain height passed as a uniform-free approximation (distance from the basin centre), adds wind streaks during gusts, and draws expanding ripple rings.

```ts
import * as THREE from 'three'
import type { Wind } from './wind'
import type { ScenePalette } from './palette'
import type { WorldModule } from './scene'
import { RippleBuffer, MAX_RIPPLES, RIPPLE_LIFE } from './ripples'

const vert = /* glsl */ `
#include <fog_pars_vertex>
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`

const frag = /* glsl */ `
#include <fog_pars_fragment>
uniform vec2 uWindDir; uniform float uWindStrength; uniform float uWindGust; uniform float uTime;
uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSkyTop; uniform vec3 uSkyHorizon; uniform vec3 uSun; uniform vec3 uSunDir;
uniform vec4 uRipples[${MAX_RIPPLES}];
uniform vec3 uCamera;
varying vec3 vWorld;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

void main() {
  float wind = uWindStrength * (0.6 + 0.4 * uWindGust);
  vec2 p = vWorld.xz;
  // Two ripple layers scrolling downwind
  vec2 flow = uWindDir * uTime * (0.6 + 1.4 * wind);
  float n1 = noise(p * 0.9 + flow);
  float n2 = noise(p * 2.3 - flow * 1.7 + 13.0);
  float h = (n1 * 0.7 + n2 * 0.3);
  // Wind streaks: elongated along the wind during gusts
  vec2 along = vec2(-uWindDir.y, uWindDir.x);
  float streak = noise(vec2(dot(p, uWindDir) * 0.15 + uTime * 0.8, dot(p, along) * 1.6)) * uWindGust * 0.35;
  // Ripple rings from birds
  float ring = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    if (r.z > ${RIPPLE_LIFE.toFixed(1)}) continue;
    float d = distance(p, r.xy);
    float radius = r.z * 1.1;
    float fade = 1.0 - r.z / ${RIPPLE_LIFE.toFixed(1)};
    ring += smoothstep(0.12, 0.0, abs(d - radius)) * fade * 0.6;
  }
  // Perturbed normal from the height field
  float e = 0.15;
  float hx = noise((p + vec2(e, 0)) * 0.9 + flow) * 0.7 + noise((p + vec2(e, 0)) * 2.3 - flow * 1.7 + 13.0) * 0.3;
  float hz = noise((p + vec2(0, e)) * 0.9 + flow) * 0.7 + noise((p + vec2(0, e)) * 2.3 - flow * 1.7 + 13.0) * 0.3;
  float amp = 0.06 + 0.25 * wind;
  vec3 n = normalize(vec3(-(hx - h) * amp / e, 1.0, -(hz - h) * amp / e));
  // Fake sky reflection by the reflected view direction's elevation
  vec3 v = normalize(uCamera - vWorld);
  vec3 refl = reflect(-v, n);
  vec3 sky = mix(uSkyHorizon, uSkyTop, pow(clamp(refl.y, 0.0, 1.0), 0.6));
  float fres = pow(1.0 - max(dot(v, n), 0.0), 3.0);
  // Depth tint: shallow toward the basin rim (ellipse from the heightfield)
  vec2 ep = vec2((p.x - 2.0) / 44.0, (p.y + 36.0) / 32.0);
  float depth = clamp(1.0 - length(ep), 0.0, 1.0);
  vec3 body = mix(uShallow, uDeep, depth);
  vec3 col = mix(body, sky, 0.35 + 0.55 * fres);
  // Sun glitter
  float spec = pow(max(dot(refl, uSunDir), 0.0), 180.0) * (0.4 + wind);
  col += uSun * spec;
  col += vec3(streak) * 0.6;
  col += vec3(ring);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`

export function createWater(wind: Wind, palette: ScenePalette, ripples: RippleBuffer): WorldModule & { object: THREE.Mesh } {
  const packed = new Float32Array(MAX_RIPPLES * 4)
  const rippleUniform = Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, 99, 0))
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      ...wind.uniforms,
      uDeep: { value: new THREE.Color('#1f3a44') },
      uShallow: { value: new THREE.Color('#4f6f5c') },
      uSkyTop: { value: new THREE.Color(palette.skyTop) },
      uSkyHorizon: { value: new THREE.Color(palette.skyHorizon) },
      uSun: { value: new THREE.Color(palette.sun) },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uRipples: { value: rippleUniform },
      uCamera: { value: new THREE.Vector3() },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    },
    vertexShader: vert, fragmentShader: frag, fog: true,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 1, 1).rotateX(-Math.PI / 2), mat)
  mesh.position.set(0, 0, -140)
  mesh.receiveShadow = false
  return {
    object: mesh,
    update(dt) {
      ripples.update(dt)
      ripples.pack(packed)
      for (let i = 0; i < MAX_RIPPLES; i++) rippleUniform[i]!.set(packed[i * 4]!, packed[i * 4 + 1]!, packed[i * 4 + 2]!, 0)
    },
  }
}
```

In `main.ts` (add `import * as THREE from 'three'` at the top):

```ts
import { createWater } from './world/water'
import { RippleBuffer } from './world/ripples'
import { sunDirection } from './world/sky'
// ...
const ripples = new RippleBuffer()
const water = createWater(world.wind, world.palette, ripples)
;(water.object.material as THREE.ShaderMaterial).uniforms.uSunDir!.value.copy(sunDirection(world.palette))
world.add(water)
world.start(dt => {
  ;(water.object.material as THREE.ShaderMaterial).uniforms.uCamera!.value.copy(world.camera.position)
  // ...
})
```

Also apply fog uniforms each frame: the `fog: true` flag on ShaderMaterial makes Three.js fill `fogColor`, `fogNear`, `fogFar` automatically when `uniforms` include the fog block, so nothing else is required.

- [ ] **Step 6: Visual check**

Run: `npm run dev`. Expected: the basin is now a lake whose surface reflects the sky gradient, gets greener toward the edges, shows small moving ripples that drift with the wind, and gets faint streaks when the gust value in the dev overlay climbs. Sun glitter appears toward the sun. To test rings, temporarily call `ripples.spawn(0, -12)` on a key press and confirm an expanding ring fades over 2.5 s. Remove the test hook before committing.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wind-driven water shader with ripple rings"
```

---
### Task 8: Reeds and grass

**Files:**
- Create: `src/world/scatter.ts`, `src/world/scatter.test.ts`, `src/world/vegetation.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces:

```ts
// scatter.ts (pure)
export interface ScatterPoint { x: number; z: number; y: number; scale: number; tint: number; phase: number }
export function scatterInBand(hf: Heightfield, opts: { minY: number; maxY: number; bounds: [number, number, number, number]; count: number; seed: number }): ScatterPoint[]
// vegetation.ts
export function createReeds(points: ScatterPoint[], wind: Wind): WorldModule & { object: THREE.InstancedMesh }
export function createGrass(points: ScatterPoint[], wind: Wind): WorldModule & { object: THREE.InstancedMesh }
```

- [ ] **Step 1: Write the failing scatter test**

`src/world/scatter.test.ts`:

```ts
import { scatterInBand } from './scatter'
import type { Heightfield } from './heightfield'

const flat = (y: number): Heightfield => ({ sample: () => y })
const ramp: Heightfield = { sample: (x) => x / 10 }   // y rises with x

describe('scatterInBand', () => {
  it('returns only points whose ground height is within the band', () => {
    const pts = scatterInBand(ramp, { minY: 0, maxY: 1, bounds: [-20, 20, -20, 20], count: 200, seed: 1 })
    expect(pts.length).toBeGreaterThan(20)
    for (const p of pts) {
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(1)
      expect(p.x).toBeGreaterThanOrEqual(0)
    }
  })
  it('returns nothing when the band is empty', () => {
    expect(scatterInBand(flat(5), { minY: 0, maxY: 1, bounds: [-5, 5, -5, 5], count: 50, seed: 1 })).toEqual([])
  })
  it('is deterministic per seed and varies per point', () => {
    const a = scatterInBand(flat(0.5), { minY: 0, maxY: 1, bounds: [-5, 5, -5, 5], count: 10, seed: 9 })
    const b = scatterInBand(flat(0.5), { minY: 0, maxY: 1, bounds: [-5, 5, -5, 5], count: 10, seed: 9 })
    expect(a).toEqual(b)
    expect(new Set(a.map(p => p.phase)).size).toBeGreaterThan(5)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/world/scatter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement scatter**

`src/world/scatter.ts`:

```ts
import { makeRng } from '../catalog/rng'
import type { Heightfield } from './heightfield'

export interface ScatterPoint { x: number; z: number; y: number; scale: number; tint: number; phase: number }

export interface ScatterOptions {
  minY: number
  maxY: number
  /** [minX, maxX, minZ, maxZ] */
  bounds: [number, number, number, number]
  /** candidate samples; the result has at most this many */
  count: number
  seed: number
}

export function scatterInBand(hf: Heightfield, o: ScatterOptions): ScatterPoint[] {
  const rng = makeRng(o.seed)
  const [x0, x1, z0, z1] = o.bounds
  const out: ScatterPoint[] = []
  for (let i = 0; i < o.count; i++) {
    const x = x0 + rng() * (x1 - x0)
    const z = z0 + rng() * (z1 - z0)
    const y = hf.sample(x, z)
    if (y < o.minY || y > o.maxY) continue
    out.push({ x, z, y, scale: 0.7 + rng() * 0.6, tint: rng(), phase: rng() * Math.PI * 2 })
  }
  return out
}
```

- [ ] **Step 4: Run scatter tests**

Run: `npx vitest run src/world/scatter.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement instanced vegetation with wind sway**

`src/world/vegetation.ts`. Each blade is a thin tapered plane. The vertex shader bends the blade by wind strength, with a gust front that travels downwind so the bed rolls instead of swaying in unison. `MeshStandardMaterial` is extended through `onBeforeCompile` so it still receives lighting, shadows, and fog.

```ts
import * as THREE from 'three'
import type { ScatterPoint } from './scatter'
import type { Wind } from './wind'
import type { WorldModule } from './scene'

const swayChunk = /* glsl */ `
  uniform vec2 uWindDir; uniform float uWindStrength; uniform float uWindGust; uniform float uTime;
  attribute float aPhase;
  attribute float aTint;
  varying float vTint;
`

const swayVertex = /* glsl */ `
  vTint = aTint;
  vec4 worldPos = instanceMatrix * vec4(transformed, 1.0);
  float t = clamp(position.y / 1.0, 0.0, 1.0);           // 0 at root, 1 at tip (blade height is 1 before instance scale)
  float bend = t * t;
  // Gust front travels downwind across the bed
  float along = dot(worldPos.xz, uWindDir);
  float front = 0.5 + 0.5 * sin(along * 0.35 - uTime * 2.2 + aPhase * 0.3);
  float wind = uWindStrength * (0.5 + 0.5 * uWindGust * front);
  float flutter = sin(uTime * 3.0 + aPhase) * 0.05 * (0.3 + wind);
  vec2 lean = uWindDir * (wind * 0.9 * bend) + vec2(flutter * bend);
  transformed.xz += lean;
  transformed.y -= length(lean) * 0.35 * bend;
`

function bladeGeometry(height: number, width: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(width, height, 1, 4)
  g.translate(0, height / 2, 0)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / height
    pos.setX(i, pos.getX(i) * (1 - t * 0.85))   // taper to the tip
  }
  g.computeVertexNormals()
  return g
}

function makeMaterial(wind: Wind, base: THREE.Color, alt: THREE.Color): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.9, side: THREE.DoubleSide })
  mat.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, wind.uniforms, { uAlt: { value: alt } })
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + swayChunk)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + swayVertex)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uAlt; varying float vTint;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( mix(diffuse, uAlt, vTint), opacity );')
  }
  return mat
}

function instanced(points: ScatterPoint[], geo: THREE.BufferGeometry, mat: THREE.Material, heightScale: number): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geo, mat, points.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const s = new THREE.Vector3()
  const p = new THREE.Vector3()
  const phase = new Float32Array(points.length)
  const tint = new Float32Array(points.length)
  points.forEach((pt, i) => {
    p.set(pt.x, pt.y, pt.z)
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), pt.phase)
    s.set(pt.scale, pt.scale * heightScale, pt.scale)
    m.compose(p, q, s)
    mesh.setMatrixAt(i, m)
    phase[i] = pt.phase
    tint[i] = pt.tint
  })
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1))
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  return mesh
}

export function createReeds(points: ScatterPoint[], wind: Wind): WorldModule & { object: THREE.InstancedMesh } {
  const mat = makeMaterial(wind, new THREE.Color('#7f8a3f'), new THREE.Color('#b9a45a'))
  const object = instanced(points, bladeGeometry(1, 0.06), mat, 2.2)
  return { object, update() {} }
}

export function createGrass(points: ScatterPoint[], wind: Wind): WorldModule & { object: THREE.InstancedMesh } {
  const mat = makeMaterial(wind, new THREE.Color('#5f7a2e'), new THREE.Color('#9a9448'))
  const object = instanced(points, bladeGeometry(1, 0.05), mat, 0.5)
  return { object, update() {} }
}
```

- [ ] **Step 6: Wire into main**

```ts
import { scatterInBand } from './world/scatter'
import { createReeds, createGrass } from './world/vegetation'
// ...
world.add(createReeds(scatterInBand(heightfield, { minY: -0.25, maxY: 0.45, bounds: [-34, -10, -20, -2], count: 6000, seed: 11 }), world.wind))
world.add(createGrass(scatterInBand(heightfield, { minY: 0.5, maxY: 3, bounds: [-40, 40, -12, 14], count: 12000, seed: 12 }), world.wind))
```

- [ ] **Step 7: Visual check**

Run: `npm run dev`. Expected: a dense reed bed on the left edge of the water, roughly 2 m tall, in two shades of olive and straw, leaning downwind with visible waves of motion crossing it during gusts. Short grass on the bank around the camera with gentler motion. Frame rate still near 60.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: instanced reeds and grass with wind sway"
```

---

### Task 9: Trees, snag, and far tree line

**Files:**
- Create: `src/world/trees.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces:

```ts
export function createTree(x: number, z: number, hf: Heightfield, seed: number, wind: Wind): WorldModule & { object: THREE.Group }
export function createSnag(position: Vec3): { object: THREE.Group; perchPoint: THREE.Vector3 }
export function createTreeLine(hf: Heightfield, palette: ScenePalette): WorldModule & { object: THREE.Group }
```

- [ ] **Step 1: Implement trees**

`src/world/trees.ts`:

```ts
import * as THREE from 'three'
import type { Heightfield } from './heightfield'
import type { Wind } from './wind'
import type { WorldModule } from './scene'
import type { ScenePalette } from './palette'
import type { Vec3 } from '../location/schema'
import { makeRng } from '../catalog/rng'

const TRUNK = new THREE.MeshStandardMaterial({ color: '#4b3a2a', roughness: 1 })
const CANOPY = ['#4f6a2b', '#5f7a30', '#6d7f2f', '#8a7a2e'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true }))

/** A low-poly deciduous tree: a tapered trunk and 5 to 8 icosahedron canopy blobs. */
export function createTree(x: number, z: number, hf: Heightfield, seed: number, wind: Wind): WorldModule & { object: THREE.Group } {
  const rng = makeRng(seed)
  const group = new THREE.Group()
  const h = 6 + rng() * 5
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.4, h * 0.55, 7), TRUNK)
  trunk.position.y = h * 0.275
  trunk.castShadow = true
  group.add(trunk)
  const canopy = new THREE.Group()
  const blobs = 5 + Math.floor(rng() * 4)
  for (let i = 0; i < blobs; i++) {
    const r = 1.4 + rng() * 1.6
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), CANOPY[Math.floor(rng() * CANOPY.length)]!)
    b.position.set((rng() - 0.5) * 3.2, h * 0.5 + rng() * h * 0.45, (rng() - 0.5) * 3.2)
    b.castShadow = true
    canopy.add(b)
  }
  group.add(canopy)
  group.position.set(x, hf.sample(x, z) - 0.2, z)
  group.rotation.y = rng() * Math.PI * 2
  const phase = rng() * 10
  return {
    object: group,
    update(_dt, w) {
      const sway = w.effective() * 0.025
      canopy.rotation.x = Math.sin(w.state.time * 0.9 + phase) * sway * w.state.dir.y
      canopy.rotation.z = -Math.sin(w.state.time * 0.9 + phase) * sway * w.state.dir.x
    },
  }
}

/** A dead standing tree in the water. `perchPoint` is where a perching bird sits. */
export function createSnag(position: Vec3): { object: THREE.Group; perchPoint: THREE.Vector3 } {
  const group = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: '#8c8478', roughness: 1, flatShading: true })
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 5.5, 6), mat)
  trunk.position.y = 2.75
  trunk.rotation.z = 0.08
  trunk.castShadow = true
  group.add(trunk)
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 2.2, 5), mat)
  branch.position.set(0.9, 3.6, 0)
  branch.rotation.z = -1.1
  branch.castShadow = true
  group.add(branch)
  const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 1.3, 5), mat)
  stub.position.set(-0.5, 4.4, 0.2)
  stub.rotation.z = 0.9
  group.add(stub)
  group.position.set(position[0], position[1], position[2])
  const perchPoint = new THREE.Vector3(position[0] + 1.7, position[1] + 4.25, position[2])
  return { object: group, perchPoint }
}

/** Layered silhouettes on the far shore that fade into the fog. */
export function createTreeLine(hf: Heightfield, palette: ScenePalette): WorldModule & { object: THREE.Group } {
  const group = new THREE.Group()
  const rng = makeRng(31)
  const layers = [
    { z: -74, color: '#3f5a3a', count: 60 },
    { z: -86, color: '#4c6552', count: 50 },
    { z: -100, color: mixHex('#4c6552', palette.fog, 0.5), count: 40 },
  ]
  for (const layer of layers) {
    const mat = new THREE.MeshStandardMaterial({ color: layer.color, roughness: 1, flatShading: true })
    for (let i = 0; i < layer.count; i++) {
      const x = -140 + rng() * 280
      const h = 7 + rng() * 9
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2 + rng() * 2.5, h, 6), mat)
      cone.position.set(x, hf.sample(x, layer.z) + h / 2 - 0.5, layer.z + (rng() - 0.5) * 4)
      group.add(cone)
    }
  }
  return { object: group, update() {} }
}

function mixHex(a: string, b: string, t: number): string {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()
}
```

- [ ] **Step 2: Wire into main**

```ts
import { createTree, createSnag, createTreeLine } from './world/trees'
// ...
world.add(createTreeLine(heightfield, world.palette))
for (const [i, [tx, tz]] of [[-26, 4], [-18, 9], [30, 6], [38, -2], [-44, -30], [48, -34]].entries()) {
  world.add(createTree(tx!, tz!, heightfield, 100 + i, world.wind))
}
const snagZone = loc.zones['snag']
if (snagZone?.kind === 'point') {
  const snag = createSnag(snagZone.position)
  world.scene.add(snag.object)
}
```

- [ ] **Step 3: Visual check**

Run: `npm run dev`. Expected: a few deciduous trees flanking the vantage and along the near shore, canopies barely swaying; a grey dead snag standing in the water on the far right with a branch sticking out; three receding rows of conifer silhouettes on the far shore, the farthest nearly the fog color. Frame rate still near 60. This is the "still scene that already looks right" checkpoint from the spec. Spend time on colors and placement here before moving on, and adjust constants freely; the tests do not pin these numbers.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: trees, snag, and far tree line"
```

---
### Task 10: BirdModel interface, species spec, and the procedural builder (American Coot)

**Files:**
- Create: `src/birds/model.ts`, `src/birds/spec.ts`, `src/birds/spec.test.ts`, `src/birds/paint.ts`, `src/birds/paint.test.ts`, `src/birds/procedural.ts`, `src/birds/procedural.test.ts`, `src/birds/species/index.ts`, `src/birds/species/amecoo.ts`

**Interfaces:**
- Produces:

```ts
// model.ts
export interface PoseState { wingPhase: number; wingSpread: number; headBob: number; neckExtend: number; tailTilt: number; lean: THREE.Vector3 }
export function defaultPose(): PoseState
export interface BirdParts { body: THREE.Object3D; neck: THREE.Object3D; head: THREE.Object3D; bill: THREE.Object3D; wingL: THREE.Object3D; wingR: THREE.Object3D; tail: THREE.Object3D; legs: THREE.Object3D }
export interface BirdModel { group: THREE.Group; parts: BirdParts; pose(s: PoseState): void; dispose(): void; /** metres, for apparent-size math */ radius: number }
// spec.ts
export type MarkKey = 'size' | 'bill' | 'head' | 'body' | 'legs'
export interface Plumage { crown: string; cheek: string; throat: string; breast: string; flank: string; back: string; wing: string; speculum: string | null; rump: string; tail: string; bill: string; legs: string; eye: string }
export interface SpeciesSpec { code: string; commonName: string; length: number; body: {length:number;height:number;width:number}; neck: {length:number;thickness:number;angle:number}; head: {size:number}; bill: {length:number;thickness:number;shape:'pointed'|'flat'|'dagger'|'hooked'}; legs: {length:number;thickness:number}; tail: {length:number;angle:number}; wing: {length:number;width:number}; posture: 'swimming'|'standing'|'perched'; draft: number; plumage: Plumage; variants: Record<string, Partial<Plumage>>; marks: Record<MarkKey, string>; wingbeatHz: number }
export function parseSpeciesSpec(data: unknown): SpeciesSpec
export function resolvePlumage(spec: SpeciesSpec, variant?: string): Plumage
// paint.ts
export function paintByDirection(geo: THREE.BufferGeometry, colors: { top: string; side: string; bottom: string; front?: string; back?: string }): void
// procedural.ts
export function buildBird(spec: SpeciesSpec, variant?: string): BirdModel
// species/index.ts
export const SPECIES: Record<string, SpeciesSpec>
export function getSpec(code: string): SpeciesSpec        // throws on unknown code
export function hasSpec(code: string): boolean
```

Coordinate convention for a bird: +x is forward (bill points +x), +y up, +z to the bird's right. The group origin is at the feet for standing and perched birds, and at the waterline for swimming birds. Callers rotate the group around y to set heading.

- [ ] **Step 1: Write failing spec and paint tests**

`src/birds/spec.test.ts`:

```ts
import { parseSpeciesSpec, resolvePlumage } from './spec'
import { SPEC as coot } from './species/amecoo'

describe('parseSpeciesSpec', () => {
  it('accepts the coot spec', () => {
    expect(parseSpeciesSpec(coot).code).toBe('y00475')
  })
  it('rejects a plumage color that is not hex', () => {
    const bad = { ...coot, plumage: { ...coot.plumage, crown: 'black' } }
    expect(() => parseSpeciesSpec(bad)).toThrow(/crown/)
  })
  it('requires every field mark', () => {
    const { legs: _drop, ...marks } = coot.marks
    expect(() => parseSpeciesSpec({ ...coot, marks })).toThrow(/legs/)
  })
})

describe('resolvePlumage', () => {
  it('overlays a variant onto the base plumage', () => {
    const spec = parseSpeciesSpec({ ...coot, variants: { pale: { crown: '#ffffff' } } })
    expect(resolvePlumage(spec, 'pale').crown).toBe('#ffffff')
    expect(resolvePlumage(spec, 'pale').bill).toBe(coot.plumage.bill)
    expect(resolvePlumage(spec).crown).toBe(coot.plumage.crown)
  })
  it('throws on an unknown variant', () => {
    expect(() => resolvePlumage(parseSpeciesSpec(coot), 'nope')).toThrow(/variant/)
  })
})
```

`src/birds/paint.test.ts`:

```ts
import * as THREE from 'three'
import { paintByDirection } from './paint'

describe('paintByDirection', () => {
  it('colors upward-facing vertices with top and downward with bottom', () => {
    const geo = new THREE.SphereGeometry(1, 8, 8)
    paintByDirection(geo, { top: '#ff0000', side: '#00ff00', bottom: '#0000ff' })
    const col = geo.getAttribute('color') as THREE.BufferAttribute
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    let topIdx = -1, botIdx = -1
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0.99) topIdx = i
      if (pos.getY(i) < -0.99) botIdx = i
    }
    expect(col.getX(topIdx)).toBeCloseTo(1)
    expect(col.getZ(botIdx)).toBeCloseTo(1)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/birds`
Expected: FAIL.

- [ ] **Step 3: Implement model.ts, spec.ts, paint.ts**

`src/birds/model.ts`:

```ts
import * as THREE from 'three'

export interface PoseState {
  /** 0..1 wingbeat cycle; 0 = wings level */
  wingPhase: number
  /** 0 folded .. 1 fully spread */
  wingSpread: number
  /** forward/back head displacement in body lengths, for the coot pump */
  headBob: number
  /** 0 tucked .. 1 stretched */
  neckExtend: number
  /** radians, positive lifts the tail */
  tailTilt: number
  /** body lean; x pitches nose down (tip-up feeding), z rolls */
  lean: THREE.Vector3
}

export function defaultPose(): PoseState {
  return { wingPhase: 0, wingSpread: 0, headBob: 0, neckExtend: 0.5, tailTilt: 0, lean: new THREE.Vector3() }
}

export interface BirdParts {
  body: THREE.Object3D
  neck: THREE.Object3D
  head: THREE.Object3D
  bill: THREE.Object3D
  wingL: THREE.Object3D
  wingR: THREE.Object3D
  tail: THREE.Object3D
  legs: THREE.Object3D
}

export interface BirdModel {
  group: THREE.Group
  parts: BirdParts
  pose(state: PoseState): void
  dispose(): void
  /** bounding radius in metres, for apparent-size math */
  radius: number
}
```

`src/birds/spec.ts`:

```ts
import { z } from 'zod'

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'expected #rrggbb')

export const plumageSchema = z.object({
  crown: hex, cheek: hex, throat: hex, breast: hex, flank: hex, back: hex, wing: hex,
  speculum: hex.nullable(), rump: hex, tail: hex, bill: hex, legs: hex, eye: hex,
})

export const MARK_KEYS = ['size', 'bill', 'head', 'body', 'legs'] as const
export type MarkKey = (typeof MARK_KEYS)[number]

export const speciesSpecSchema = z.object({
  code: z.string().min(1),
  commonName: z.string().min(1),
  /** bill tip to tail tip, metres */
  length: z.number().positive(),
  body: z.object({ length: z.number().positive(), height: z.number().positive(), width: z.number().positive() }),
  neck: z.object({ length: z.number().min(0), thickness: z.number().positive(), angle: z.number() }),
  head: z.object({ size: z.number().positive() }),
  bill: z.object({ length: z.number().positive(), thickness: z.number().positive(), shape: z.enum(['pointed', 'flat', 'dagger', 'hooked']) }),
  legs: z.object({ length: z.number().min(0), thickness: z.number().positive() }),
  tail: z.object({ length: z.number().min(0), angle: z.number() }),
  wing: z.object({ length: z.number().positive(), width: z.number().positive() }),
  posture: z.enum(['swimming', 'standing', 'perched']),
  /** fraction of body height below the waterline when swimming */
  draft: z.number().min(0).max(1),
  plumage: plumageSchema,
  variants: z.record(z.string(), plumageSchema.partial()),
  marks: z.object({ size: z.string(), bill: z.string(), head: z.string(), body: z.string(), legs: z.string() }),
  wingbeatHz: z.number().positive(),
})

export type Plumage = z.infer<typeof plumageSchema>
export type SpeciesSpec = z.infer<typeof speciesSpecSchema>

export function parseSpeciesSpec(data: unknown): SpeciesSpec {
  return speciesSpecSchema.parse(data)
}

export function resolvePlumage(spec: SpeciesSpec, variant?: string): Plumage {
  if (!variant) return spec.plumage
  const v = spec.variants[variant]
  if (!v) throw new Error(`${spec.code}: unknown variant ${variant}`)
  return { ...spec.plumage, ...v }
}
```

`src/birds/paint.ts`:

```ts
import * as THREE from 'three'

export interface DirectionColors { top: string; side: string; bottom: string; front?: string; back?: string }

/**
 * Vertex-colors a geometry by the direction of each vertex from the origin:
 * up -> top, down -> bottom, sideways -> side, with optional front (+x) and
 * back (-x) tints. Smooth blends give the soft-edged plumage blocks the art
 * direction wants without any texture.
 */
export function paintByDirection(geo: THREE.BufferGeometry, c: DirectionColors): void {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const top = new THREE.Color(c.top), side = new THREE.Color(c.side), bottom = new THREE.Color(c.bottom)
  const front = c.front ? new THREE.Color(c.front) : null
  const back = c.back ? new THREE.Color(c.back) : null
  const out = new Float32Array(pos.count * 3)
  const n = new THREE.Vector3()
  const col = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize()
    const up = THREE.MathUtils.smoothstep(n.y, -0.15, 0.55)
    const down = THREE.MathUtils.smoothstep(-n.y, 0.05, 0.6)
    col.copy(side).lerp(top, up).lerp(bottom, down)
    if (front) col.lerp(front, THREE.MathUtils.smoothstep(n.x, 0.55, 0.95))
    if (back) col.lerp(back, THREE.MathUtils.smoothstep(-n.x, 0.55, 0.95))
    out.set([col.r, col.g, col.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(out, 3))
}

export function paintSolid(geo: THREE.BufferGeometry, color: string): void {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const c = new THREE.Color(color)
  const out = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) out.set([c.r, c.g, c.b], i * 3)
  geo.setAttribute('color', new THREE.BufferAttribute(out, 3))
}
```

- [ ] **Step 4: Write the coot spec**

`src/birds/species/amecoo.ts` (file named by common code; the eBird code is `y00475`):

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'y00475',
  commonName: 'American Coot',
  length: 0.39,
  body: { length: 1, height: 0.62, width: 0.55 },
  neck: { length: 0.28, thickness: 0.16, angle: 55 },
  head: { size: 0.3 },
  bill: { length: 0.16, thickness: 0.09, shape: 'pointed' },
  legs: { length: 0.3, thickness: 0.05 },
  tail: { length: 0.12, angle: 10 },
  wing: { length: 0.55, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#141414', cheek: '#1c1c1c', throat: '#222222', breast: '#2a2a2c', flank: '#2e2e30',
    back: '#1e1e20', wing: '#232325', speculum: null, rump: '#1e1e20', tail: '#1a1a1a',
    bill: '#f4f1e6', legs: '#9aa86a', eye: '#c8202a',
  },
  variants: {},
  marks: {
    size: 'chicken-sized, compact and round',
    bill: 'short white bill with a dark band near the tip and a white frontal shield',
    head: 'small dark head that pumps back and forth while swimming',
    body: 'slate black all over',
    legs: 'yellow-green legs with lobed toes',
  },
  wingbeatHz: 5,
}
```

`src/birds/species/index.ts`:

```ts
import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { SPEC as amecoo } from './amecoo'

const ALL: SpeciesSpec[] = [amecoo].map(parseSpeciesSpec)

export const SPECIES: Record<string, SpeciesSpec> = Object.fromEntries(ALL.map(s => [s.code, s]))

export function hasSpec(code: string): boolean {
  return code in SPECIES
}

export function getSpec(code: string): SpeciesSpec {
  const s = SPECIES[code]
  if (!s) throw new Error(`No species spec for ${code}`)
  return s
}
```

- [ ] **Step 5: Run spec and paint tests**

Run: `npx vitest run src/birds`
Expected: spec and paint tests PASS.

- [ ] **Step 6: Write the failing procedural test**

`src/birds/procedural.test.ts`:

```ts
import * as THREE from 'three'
import { buildBird } from './procedural'
import { defaultPose } from './model'
import { getSpec } from './species'

describe('buildBird', () => {
  const coot = getSpec('y00475')
  it('creates every named part under the group', () => {
    const m = buildBird(coot)
    for (const key of ['body', 'neck', 'head', 'bill', 'wingL', 'wingR', 'tail', 'legs'] as const) {
      expect(m.parts[key].name).toBe(key)
      let found = false
      m.group.traverse(o => { if (o === m.parts[key]) found = true })
      expect(found).toBe(true)
    }
  })
  it('scales to the spec length', () => {
    const m = buildBird(coot)
    m.group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(m.group)
    const len = box.max.x - box.min.x
    expect(len).toBeGreaterThan(coot.length * 0.8)
    expect(len).toBeLessThan(coot.length * 1.3)
    expect(m.radius).toBeGreaterThan(0.1)
  })
  it('sits a swimming bird with its body partly below the origin', () => {
    const m = buildBird(coot)
    m.group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(m.parts.body)
    expect(box.min.y).toBeLessThan(0)
    expect(box.max.y).toBeGreaterThan(0)
  })
  it('pose moves the wings and head', () => {
    const m = buildBird(coot)
    const a = m.parts.wingL.rotation.x
    const h = m.parts.head.position.x
    m.pose({ ...defaultPose(), wingPhase: 0.25, wingSpread: 1, headBob: 0.2 })
    expect(m.parts.wingL.rotation.x).not.toBe(a)
    expect(m.parts.head.position.x).not.toBe(h)
  })
})
```

- [ ] **Step 7: Run to verify it fails**

Run: `npx vitest run src/birds/procedural.test.ts`
Expected: FAIL.

- [ ] **Step 8: Implement the procedural builder**

`src/birds/procedural.ts`:

```ts
import * as THREE from 'three'
import type { BirdModel, BirdParts, PoseState } from './model'
import { resolvePlumage, type SpeciesSpec, type Plumage } from './spec'
import { paintByDirection, paintSolid } from './paint'

const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0 })
const MAT_FLAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0, side: THREE.DoubleSide })

function mesh(geo: THREE.BufferGeometry, name: string, mat = MAT): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat)
  m.name = name
  m.castShadow = true
  return m
}

function billGeometry(spec: SpeciesSpec, s: number): THREE.BufferGeometry {
  const { length, thickness, shape } = spec.bill
  const L = length * s, T = thickness * s
  let g: THREE.BufferGeometry
  switch (shape) {
    case 'flat':
      g = new THREE.BoxGeometry(L, T * 0.5, T * 1.4)
      break
    case 'dagger':
      g = new THREE.ConeGeometry(T * 0.5, L, 6).rotateZ(-Math.PI / 2)
      break
    case 'hooked': {
      g = new THREE.ConeGeometry(T * 0.6, L, 6).rotateZ(-Math.PI / 2)
      const pos = g.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) if (pos.getX(i) > L * 0.3) pos.setY(i, pos.getY(i) - (pos.getX(i) - L * 0.3) * 0.5)
      break
    }
    default:
      g = new THREE.ConeGeometry(T * 0.55, L, 6).rotateZ(-Math.PI / 2)
  }
  g.translate(L / 2, 0, 0)
  return g
}

function wingGeometry(spec: SpeciesSpec, s: number, sign: 1 | -1): THREE.BufferGeometry {
  const L = spec.wing.length * s, W = spec.wing.width * s
  // A tapered plane hinged at the shoulder (origin), extending along ±z
  const g = new THREE.PlaneGeometry(W, L, 1, 3).rotateX(-Math.PI / 2)
  g.translate(-W * 0.15, 0, (L / 2) * sign)
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const t = Math.abs(pos.getZ(i)) / L
    pos.setX(i, pos.getX(i) * (1 - t * 0.45) - t * W * 0.25)   // narrows and sweeps back toward the tip
  }
  return g
}

export function buildBird(spec: SpeciesSpec, variant?: string): BirdModel {
  const p: Plumage = resolvePlumage(spec, variant)
  const s = spec.length / (spec.body.length + spec.neck.length * 0.6 + spec.bill.length + spec.tail.length)  // scale so total length matches
  const group = new THREE.Group()
  group.name = `bird:${spec.code}${variant ? ':' + variant : ''}`

  // Body: ellipsoid, +x forward
  const bodyGeo = new THREE.SphereGeometry(0.5, 20, 14).scale(spec.body.length * s, spec.body.height * s, spec.body.width * s)
  paintByDirection(bodyGeo, { top: p.back, side: p.flank, bottom: p.breast, front: p.breast, back: p.rump })
  const body = mesh(bodyGeo, 'body')

  // Legs: two cylinders below the body, hidden inside it when swimming
  const legLen = spec.legs.length * s
  const legs = new THREE.Group()
  legs.name = 'legs'
  for (const z of [-0.18, 0.18]) {
    const lg = new THREE.CylinderGeometry(spec.legs.thickness * s * 0.5, spec.legs.thickness * s * 0.5, legLen, 6)
    paintSolid(lg, p.legs)
    const leg = mesh(lg, 'leg')
    leg.position.set(0.05 * s, -legLen / 2, z * spec.body.width * s)
    legs.add(leg)
    const fg = new THREE.BoxGeometry(spec.legs.thickness * s * 3, spec.legs.thickness * s * 0.4, spec.legs.thickness * s * 2)
    paintSolid(fg, p.legs)
    const foot = mesh(fg, 'foot')
    foot.position.set(0.1 * s, -legLen, z * spec.body.width * s)
    legs.add(foot)
  }

  // Neck: a tapered cylinder from the front-top of the body, angled up; the head hangs at its end
  const neckLen = spec.neck.length * s
  const neckGeo = new THREE.CylinderGeometry(spec.neck.thickness * s * 0.4, spec.neck.thickness * s * 0.55, Math.max(neckLen, 0.01), 8)
  paintByDirection(neckGeo, { top: p.back, side: p.throat, bottom: p.throat })
  neckGeo.translate(0, neckLen / 2, 0)
  const neck = mesh(neckGeo, 'neck')
  neck.position.set(spec.body.length * s * 0.38, spec.body.height * s * 0.2, 0)

  // Head: sphere at the neck tip, bill and eyes attached
  const headR = spec.head.size * s * 0.5
  const headGeo = new THREE.SphereGeometry(headR, 16, 12)
  paintByDirection(headGeo, { top: p.crown, side: p.cheek, bottom: p.throat })
  const head = mesh(headGeo, 'head')
  head.position.set(0, neckLen, 0)
  const bill = mesh(billGeometry(spec, s), 'bill')
  paintSolid(bill.geometry, p.bill)
  bill.position.set(headR * 0.85, -headR * 0.1, 0)
  head.add(bill)
  for (const z of [-1, 1]) {
    const eg = new THREE.SphereGeometry(headR * 0.18, 8, 6)
    paintSolid(eg, p.eye)
    const eye = mesh(eg, 'eye')
    eye.position.set(headR * 0.45, headR * 0.2, z * headR * 0.8)
    head.add(eye)
  }
  neck.add(head)

  // Wings: hinged at the shoulders
  const wingL = mesh(wingGeometry(spec, s, -1), 'wingL', MAT_FLAT)
  const wingR = mesh(wingGeometry(spec, s, 1), 'wingR', MAT_FLAT)
  for (const w of [wingL, wingR]) {
    paintByDirection(w.geometry, { top: p.wing, side: p.wing, bottom: p.flank })
    if (p.speculum) {
      const col = w.geometry.getAttribute('color') as THREE.BufferAttribute
      const pos = w.geometry.getAttribute('position') as THREE.BufferAttribute
      const sc = new THREE.Color(p.speculum)
      for (let i = 0; i < pos.count; i++) {
        const t = Math.abs(pos.getZ(i)) / (spec.wing.length * s)
        if (t > 0.3 && t < 0.7 && pos.getX(i) < 0) col.setXYZ(i, sc.r, sc.g, sc.b)
      }
    }
    w.position.set(spec.body.length * s * 0.05, spec.body.height * s * 0.35, 0)
  }

  // Tail: a flat wedge behind the body
  const tailLen = spec.tail.length * s
  const tailGeo = new THREE.BoxGeometry(Math.max(tailLen, 0.01), spec.body.height * s * 0.08, spec.body.width * s * 0.6)
  paintSolid(tailGeo, p.tail)
  tailGeo.translate(-tailLen / 2, 0, 0)
  const tail = mesh(tailGeo, 'tail')
  tail.position.set(-spec.body.length * s * 0.48, spec.body.height * s * 0.1, 0)
  tail.rotation.z = THREE.MathUtils.degToRad(spec.tail.angle)

  body.add(neck, wingL, wingR, tail, legs)
  group.add(body)

  // Origin: waterline for swimmers (body sits `draft` deep), feet for the rest
  if (spec.posture === 'swimming') {
    body.position.y = spec.body.height * s * (0.5 - spec.draft)
    legs.visible = false
  } else {
    body.position.y = legLen + spec.body.height * s * 0.5
  }

  const restNeck = THREE.MathUtils.degToRad(spec.neck.angle)
  const parts: BirdParts = { body, neck, head, bill, wingL, wingR, tail, legs }
  const radius = Math.max(spec.length * 0.5, (legLen + spec.body.height * s + neckLen) * 0.5)

  function pose(st: PoseState) {
    // Neck: tucked (angle steeper, shorter) .. extended (angle per spec, full length)
    const ext = THREE.MathUtils.clamp(st.neckExtend, 0, 1)
    neck.rotation.z = -(Math.PI / 2 - restNeck) - (1 - ext) * 0.7
    neck.scale.y = 0.55 + 0.45 * ext
    // head stays at y = neckLen in neck space; the neck's y scale carries it
    head.position.x = st.headBob * spec.body.length * s
    head.rotation.z = Math.PI / 2 - restNeck + (1 - ext) * 0.7   // keep the bill level
    // Wings: flap around the body's x axis, fold flat against the body when spread is 0
    const flap = Math.sin(st.wingPhase * Math.PI * 2) * 0.9 * st.wingSpread
    wingL.rotation.x = -flap
    wingR.rotation.x = flap
    wingL.rotation.y = (1 - st.wingSpread) * 0.35
    wingR.rotation.y = -(1 - st.wingSpread) * 0.35
    const fold = 1 - st.wingSpread
    wingL.scale.set(1, 1, 0.55 + 0.45 * (1 - fold * 0.6))
    wingR.scale.copy(wingL.scale)
    tail.rotation.z = THREE.MathUtils.degToRad(spec.tail.angle) + st.tailTilt
    body.rotation.set(st.lean.x, 0, st.lean.z)
  }
  pose({ wingPhase: 0, wingSpread: 0, headBob: 0, neckExtend: 0.5, tailTilt: 0, lean: new THREE.Vector3() })

  return {
    group, parts, radius, pose,
    dispose() {
      group.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose() })
    },
  }
}
```

- [ ] **Step 9: Run tests**

Run: `npx vitest run src/birds && npm run typecheck`
Expected: PASS. If the length test fails, adjust the scale formula `s` rather than the test.

- [ ] **Step 10: Visual check with a debug spawn**

Temporarily in `src/main.ts`:

```ts
import { buildBird } from './birds/procedural'
import { getSpec } from './birds/species'
const dbg = buildBird(getSpec('y00475'))
dbg.group.position.set(0, 0, -6)
dbg.group.rotation.y = Math.PI * 0.6
dbg.group.scale.setScalar(3)
world.scene.add(dbg.group)
```

Run `npm run dev`. Expected: a slate-black, round-bodied bird with a small head, white pointed bill, and red eyes sitting low in the water 6 m ahead. The tail is short. Compare against the coot photo in `public/media/photos/y00475.jpg` and tune the spec numbers (not the builder) until the silhouette reads as a coot. Remove the debug spawn before committing.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: BirdModel interface, species spec schema, procedural bird builder, American Coot"
```

---

### Task 11: Mallard, Great Blue Heron, and Killdeer specs

**Files:**
- Create: `src/birds/species/mallar3.ts`, `src/birds/species/grbher3.ts`, `src/birds/species/killde.ts`, `src/birds/species/species.test.ts`
- Modify: `src/birds/species/index.ts`

**Interfaces:**
- Consumes: `SpeciesSpec`, `parseSpeciesSpec`, `buildBird`.
- Produces: four entries in `SPECIES`; `mallar3` has variants `male` and `female`.

- [ ] **Step 1: Write the failing species test**

`src/birds/species/species.test.ts`:

```ts
import { SPECIES, getSpec, hasSpec } from './index'
import { buildBird } from '../procedural'
import { loadCatalog } from '../../catalog'

describe('species specs', () => {
  it('include the four milestone-1 birds', () => {
    for (const code of ['y00475', 'mallar3', 'grbher3', 'killde']) expect(hasSpec(code)).toBe(true)
  })
  it('every spec code exists in the catalog with the same common name', () => {
    const catalog = loadCatalog()
    for (const spec of Object.values(SPECIES)) {
      const bird = catalog.find(b => b.speciesCode === spec.code)
      expect(bird, spec.code).toBeDefined()
      expect(bird!.commonName).toBe(spec.commonName)
    }
  })
  it('every spec and variant builds without throwing', () => {
    for (const spec of Object.values(SPECIES)) {
      expect(() => buildBird(spec)).not.toThrow()
      for (const v of Object.keys(spec.variants)) expect(() => buildBird(spec, v)).not.toThrow()
    }
  })
  it('mallard has male and female variants', () => {
    expect(Object.keys(getSpec('mallar3').variants).sort()).toEqual(['female', 'male'])
  })
  it('heron stands taller than it is long', () => {
    const h = getSpec('grbher3')
    expect(h.legs.length + h.neck.length).toBeGreaterThan(h.body.length)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/species`
Expected: FAIL on the first test.

- [ ] **Step 3: Write the three specs**

`src/birds/species/mallar3.ts`. The base plumage is the male; `female` overrides to mottled brown; `male` is an empty override so the cast's `plumage: "mixed"` can pick either name.

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'mallar3',
  commonName: 'Mallard',
  length: 0.58,
  body: { length: 1, height: 0.5, width: 0.5 },
  neck: { length: 0.3, thickness: 0.17, angle: 50 },
  head: { size: 0.32 },
  bill: { length: 0.22, thickness: 0.12, shape: 'flat' },
  legs: { length: 0.22, thickness: 0.05 },
  tail: { length: 0.16, angle: 15 },
  wing: { length: 0.6, width: 0.32 },
  posture: 'swimming',
  draft: 0.4,
  plumage: {
    crown: '#1f6b3a', cheek: '#2a7d45', throat: '#f2f2f2', breast: '#5b2f1e', flank: '#b9b3a8',
    back: '#7a6a52', wing: '#8a7d68', speculum: '#2b4fd6', rump: '#2a2a2a', tail: '#3a3a3a',
    bill: '#e2c72e', legs: '#e8722a', eye: '#1a1a1a',
  },
  variants: {
    male: {},
    female: {
      crown: '#5a4a32', cheek: '#b59a6e', throat: '#c9b48c', breast: '#a68b62', flank: '#a68b62',
      back: '#6f5a3c', wing: '#7d684a', rump: '#8a7350', tail: '#c9bb9a', bill: '#d98a2e',
    },
  },
  marks: {
    size: 'large dabbling duck',
    bill: 'broad flat bill, yellow on the male, orange and black on the female',
    head: 'glossy green head with a white neck ring on the male; the female is mottled brown',
    body: 'chestnut breast and pale grey flanks on the male; a blue wing patch edged in white on both',
    legs: 'orange legs and feet',
  },
  wingbeatHz: 6,
}
```

`src/birds/species/grbher3.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'grbher3',
  commonName: 'Great Blue Heron',
  length: 1.2,
  body: { length: 1, height: 0.5, width: 0.42 },
  neck: { length: 0.95, thickness: 0.13, angle: 70 },
  head: { size: 0.22 },
  bill: { length: 0.32, thickness: 0.08, shape: 'dagger' },
  legs: { length: 0.85, thickness: 0.035 },
  tail: { length: 0.12, angle: 0 },
  wing: { length: 0.95, width: 0.42 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#f0efe8', cheek: '#d8d6cc', throat: '#e6e4da', breast: '#8a8e96', flank: '#6f7684',
    back: '#5f6b7c', wing: '#566273', speculum: null, rump: '#5f6b7c', tail: '#4c5563',
    bill: '#d9b23a', legs: '#6b6650', eye: '#e2c229',
  },
  variants: {},
  marks: {
    size: 'very large and tall, standing over a metre',
    bill: 'long heavy yellow dagger bill',
    head: 'white face and crown with a black stripe over the eye',
    body: 'blue-grey body and wings, held still for long stretches',
    legs: 'very long dull legs, wading',
  },
  wingbeatHz: 2.2,
}
```

`src/birds/species/killde.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'killde',
  commonName: 'Killdeer',
  length: 0.25,
  body: { length: 1, height: 0.5, width: 0.45 },
  neck: { length: 0.18, thickness: 0.2, angle: 60 },
  head: { size: 0.34 },
  bill: { length: 0.14, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.38, thickness: 0.03 },
  tail: { length: 0.3, angle: 5 },
  wing: { length: 0.55, width: 0.25 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6b5638', cheek: '#f3efe6', throat: '#1c1c1c', breast: '#f6f3ea', flank: '#efe9dc',
    back: '#7a6444', wing: '#6f5a3c', speculum: null, rump: '#c9782e', tail: '#3a3025',
    bill: '#1a1a1a', legs: '#d9c39a', eye: '#1a1a1a',
  },
  variants: {},
  marks: {
    size: 'robin-sized plover on long legs',
    bill: 'short thin black bill',
    head: 'brown cap, white forehead and collar, with two black bands across the breast',
    body: 'brown back, white belly, rusty orange rump and a long tail',
    legs: 'pale long legs; runs in short bursts and stops',
  },
  wingbeatHz: 7,
}
```

Update `src/birds/species/index.ts`:

```ts
import { SPEC as amecoo } from './amecoo'
import { SPEC as mallar3 } from './mallar3'
import { SPEC as grbher3 } from './grbher3'
import { SPEC as killde } from './killde'

const ALL: SpeciesSpec[] = [amecoo, mallar3, grbher3, killde].map(parseSpeciesSpec)
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/birds && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Visual check**

Debug-spawn all four (as in Task 10 step 10) side by side at z=-6, scale 3, including `buildBird(getSpec('mallar3'), 'female')`. Expected: the mallard shows a green head, white ring, chestnut breast, grey flanks, and a blue patch on the folded wing; the female is brown; the heron is tall and grey-blue with a yellow dagger bill on a long neck; the killdeer is small on long pale legs with a dark throat band and brown back. Tune spec numbers, not the builder. Remove the debug code before committing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Mallard (male/female), Great Blue Heron, and Killdeer specs"
```

---
### Task 12: Zone geometry and the bird registry

**Files:**
- Create: `src/location/zones.ts`, `src/location/zones.test.ts`, `src/birds/registry.ts`, `src/birds/registry.test.ts`

**Interfaces:**
- Produces:

```ts
// zones.ts (pure)
export function pointInPolygon(x: number, z: number, points: readonly Vec2[]): boolean
export function randomPointInPolygon(points: readonly Vec2[], rng: Rng): Vec2      // rejection sampling in the bounding box
export function polygonCentroid(points: readonly Vec2[]): Vec2
export function clampToPolygon(x: number, z: number, points: readonly Vec2[]): Vec2  // nearest inside point (pull toward centroid)
// registry.ts
export interface BirdInstance { id: number; species: string; variant?: string; model: BirdModel; behavior: string; identified: boolean; readonly position: THREE.Vector3 }
export class BirdRegistry {
  add(inst: Omit<BirdInstance, 'id' | 'identified' | 'position'>): BirdInstance
  remove(id: number): void
  get(id: number): BirdInstance | undefined
  all(): readonly BirdInstance[]
  bySpecies(code: string): BirdInstance[]
  readonly size: number
}
```

- [ ] **Step 1: Write failing zone tests**

`src/location/zones.test.ts`:

```ts
import { pointInPolygon, randomPointInPolygon, polygonCentroid, clampToPolygon } from './zones'
import { makeRng } from '../catalog/rng'
import type { Vec2 } from './schema'

const square: Vec2[] = [[0, 0], [10, 0], [10, 10], [0, 10]]
const tri: Vec2[] = [[0, 0], [10, 0], [0, 10]]

describe('pointInPolygon', () => {
  it('detects inside and outside for a square', () => {
    expect(pointInPolygon(5, 5, square)).toBe(true)
    expect(pointInPolygon(-1, 5, square)).toBe(false)
    expect(pointInPolygon(5, 11, square)).toBe(false)
  })
  it('works on a triangle', () => {
    expect(pointInPolygon(2, 2, tri)).toBe(true)
    expect(pointInPolygon(8, 8, tri)).toBe(false)
  })
})

describe('randomPointInPolygon', () => {
  it('always returns a point inside', () => {
    const rng = makeRng(5)
    for (let i = 0; i < 200; i++) {
      const [x, z] = randomPointInPolygon(tri, rng)
      expect(pointInPolygon(x, z, tri)).toBe(true)
    }
  })
  it('is deterministic per seed', () => {
    expect(randomPointInPolygon(square, makeRng(2))).toEqual(randomPointInPolygon(square, makeRng(2)))
  })
})

describe('polygonCentroid and clampToPolygon', () => {
  it('centroid of the square is its centre', () => {
    expect(polygonCentroid(square)).toEqual([5, 5])
  })
  it('leaves inside points alone and pulls outside points in', () => {
    expect(clampToPolygon(3, 3, square)).toEqual([3, 3])
    const [x, z] = clampToPolygon(15, 5, square)
    expect(pointInPolygon(x, z, square)).toBe(true)
    expect(x).toBeGreaterThan(8)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/location/zones.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement zones**

`src/location/zones.ts`:

```ts
import type { Vec2 } from './schema'
import type { Rng } from '../catalog/types'

/** Ray-casting test. Points exactly on an edge may go either way; zones are padded so that never matters. */
export function pointInPolygon(x: number, z: number, points: readonly Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, zi] = points[i]!
    const [xj, zj] = points[j]!
    const crosses = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi
    if (crosses) inside = !inside
  }
  return inside
}

function bounds(points: readonly Vec2[]): [number, number, number, number] {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const [x, z] of points) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z)
  }
  return [x0, x1, z0, z1]
}

export function randomPointInPolygon(points: readonly Vec2[], rng: Rng): Vec2 {
  const [x0, x1, z0, z1] = bounds(points)
  for (let i = 0; i < 1000; i++) {
    const x = x0 + rng() * (x1 - x0)
    const z = z0 + rng() * (z1 - z0)
    if (pointInPolygon(x, z, points)) return [x, z]
  }
  return polygonCentroid(points)
}

export function polygonCentroid(points: readonly Vec2[]): Vec2 {
  let sx = 0, sz = 0
  for (const [x, z] of points) { sx += x; sz += z }
  return [sx / points.length, sz / points.length]
}

/** Walk from the point toward the centroid until inside. Good enough for keeping wanderers in bounds. */
export function clampToPolygon(x: number, z: number, points: readonly Vec2[]): Vec2 {
  if (pointInPolygon(x, z, points)) return [x, z]
  const [cx, cz] = polygonCentroid(points)
  for (let t = 0.05; t <= 1; t += 0.05) {
    const px = x + (cx - x) * t, pz = z + (cz - z) * t
    if (pointInPolygon(px, pz, points)) return [px, pz]
  }
  return [cx, cz]
}
```

- [ ] **Step 4: Run zone tests**

Run: `npx vitest run src/location/zones.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing registry test**

`src/birds/registry.test.ts`:

```ts
import { BirdRegistry } from './registry'
import { buildBird } from './procedural'
import { getSpec } from './species'

describe('BirdRegistry', () => {
  it('assigns ids, exposes position from the model group, and looks up by species', () => {
    const reg = new BirdRegistry()
    const a = reg.add({ species: 'y00475', model: buildBird(getSpec('y00475')), behavior: 'swim' })
    const b = reg.add({ species: 'mallar3', variant: 'female', model: buildBird(getSpec('mallar3'), 'female'), behavior: 'swim' })
    expect(a.id).not.toBe(b.id)
    expect(a.identified).toBe(false)
    a.model.group.position.set(1, 2, 3)
    expect(a.position.x).toBe(1)
    expect(reg.bySpecies('mallar3')).toEqual([b])
    expect(reg.size).toBe(2)
    reg.remove(a.id)
    expect(reg.get(a.id)).toBeUndefined()
    expect(reg.all()).toEqual([b])
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/birds/registry.test.ts`
Expected: FAIL.

- [ ] **Step 7: Implement the registry**

`src/birds/registry.ts`:

```ts
import type * as THREE from 'three'
import type { BirdModel } from './model'

export interface BirdInstance {
  id: number
  species: string
  variant?: string
  model: BirdModel
  behavior: string
  identified: boolean
  readonly position: THREE.Vector3
}

export class BirdRegistry {
  private next = 1
  private map = new Map<number, BirdInstance>()

  add(inst: Omit<BirdInstance, 'id' | 'identified' | 'position'>): BirdInstance {
    const id = this.next++
    const model = inst.model
    const full: BirdInstance = {
      ...inst, id, identified: false,
      get position() { return model.group.position },
    }
    this.map.set(id, full)
    return full
  }

  remove(id: number): void { this.map.delete(id) }
  get(id: number): BirdInstance | undefined { return this.map.get(id) }
  all(): readonly BirdInstance[] { return [...this.map.values()] }
  bySpecies(code: string): BirdInstance[] { return this.all().filter(b => b.species === code) }
  get size(): number { return this.map.size }
}
```

- [ ] **Step 8: Run tests and commit**

Run: `npx vitest run src/location src/birds && npm run typecheck`
Expected: PASS.

```bash
git add -A
git commit -m "feat: polygon zone helpers and bird registry"
```

---

### Task 13: Behaviors: swim, wade, probe

**Files:**
- Create: `src/behavior/types.ts`, `src/behavior/swim.ts`, `src/behavior/swim.test.ts`, `src/behavior/wade.ts`, `src/behavior/wade.test.ts`, `src/behavior/probe.ts`, `src/behavior/probe.test.ts`, `src/behavior/index.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
export interface BehaviorContext {
  zone: PolygonZone
  rng: Rng
  wind: () => { dirX: number; dirZ: number; effective: number }
  ground: (x: number, z: number) => number     // terrain y; swimmers ignore it
  onRipple?: (x: number, z: number) => void
  /** Shared by probe groups so members drift together */
  group?: { targetX: number; targetZ: number; retargetAt: number }
}
export interface BehaviorController {
  readonly name: string
  readonly state: string
  /** world position and heading (radians, 0 = +x) written by update */
  readonly x: number; readonly y: number; readonly z: number; readonly heading: number
  update(dt: number, pose: PoseState): void
}
export type BehaviorFactory = (ctx: BehaviorContext, startX: number, startZ: number) => BehaviorController
// index.ts
export const BEHAVIORS: Record<'swim' | 'wade' | 'probe', BehaviorFactory>
```

Each controller is a small state machine. Time is advanced with a seeded `rng`, so the tests run it forward and assert on states and positions.

- [ ] **Step 1: Write the failing swim test**

`src/behavior/swim.test.ts`:

```ts
import { createSwim } from './swim'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext } from './types'

const zone = { kind: 'polygon' as const, points: [[-10, -10], [10, -10], [10, 10], [-10, 10]] as [number, number][] }
const ctx = (seed: number, ripples: [number, number][] = []): BehaviorContext => ({
  zone, rng: makeRng(seed),
  wind: () => ({ dirX: 1, dirZ: 0, effective: 0.5 }),
  ground: () => -2,
  onRipple: (x, z) => ripples.push([x, z]),
})

function run(c: ReturnType<typeof createSwim>, seconds: number, step = 1 / 30) {
  const pose = defaultPose()
  const states = new Set<string>()
  for (let t = 0; t < seconds; t += step) { c.update(step, pose); states.add(c.state) }
  return { pose, states }
}

describe('swim', () => {
  it('stays inside the zone and on the water surface', () => {
    const c = createSwim(ctx(1), 0, 0)
    for (let i = 0; i < 3000; i++) {
      c.update(1 / 30, defaultPose())
      expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)
      expect(c.y).toBe(0)
    }
  })
  it('cycles through cruise, idle, and dabble over time', () => {
    const { states } = run(createSwim(ctx(2), 0, 0), 120)
    expect(states).toContain('cruise')
    expect(states).toContain('idle')
    expect(states).toContain('dabble')
  })
  it('spawns ripples while cruising', () => {
    const ripples: [number, number][] = []
    run(createSwim(ctx(3, ripples), 0, 0), 20)
    expect(ripples.length).toBeGreaterThan(3)
  })
  it('drifts downwind while idle', () => {
    const c = createSwim(ctx(4), 0, 0)
    // force idle by running until state is idle, then measure
    let guard = 0
    while (c.state !== 'idle' && guard++ < 20000) c.update(1 / 30, defaultPose())
    const x0 = c.x
    for (let i = 0; i < 30 && c.state === 'idle'; i++) c.update(1 / 30, defaultPose())
    expect(c.x).toBeGreaterThan(x0)
  })
  it('tips the body nose-down while dabbling', () => {
    const c = createSwim(ctx(5), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'dabble' && guard++ < 50000) c.update(1 / 30, pose)
    c.update(0.3, pose)
    expect(pose.lean.x).toBeGreaterThan(0.3)
  })
  it('is deterministic per seed', () => {
    const a = createSwim(ctx(9), 1, 1), b = createSwim(ctx(9), 1, 1)
    for (let i = 0; i < 500; i++) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect([a.x, a.z, a.state]).toEqual([b.x, b.z, b.state])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/behavior/swim.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement types and swim**

`src/behavior/types.ts`:

```ts
import type { PolygonZone } from '../location/schema'
import type { Rng } from '../catalog/types'
import type { PoseState } from '../birds/model'

export interface BehaviorContext {
  zone: PolygonZone
  rng: Rng
  wind: () => { dirX: number; dirZ: number; effective: number }
  ground: (x: number, z: number) => number
  onRipple?: (x: number, z: number) => void
  group?: { targetX: number; targetZ: number; retargetAt: number }
}

export interface BehaviorController {
  readonly name: string
  readonly state: string
  readonly x: number
  readonly y: number
  readonly z: number
  /** radians, 0 = +x, counter-clockwise seen from above */
  readonly heading: number
  update(dt: number, pose: PoseState): void
}

export type BehaviorFactory = (ctx: BehaviorContext, startX: number, startZ: number) => BehaviorController

/** Shortest-path turn toward a target heading at a max rate. */
export function turnToward(current: number, target: number, maxDelta: number): number {
  let d = target - current
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return current + Math.max(-maxDelta, Math.min(maxDelta, d))
}

export function approach(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * Math.min(1, rate * dt)
}
```

`src/behavior/swim.ts`:

```ts
import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach } from './types'
import { randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type State = 'cruise' | 'idle' | 'dabble'

const SPEED = 0.45          // m/s
const TURN = 1.2            // rad/s
const RIPPLE_EVERY = 0.9    // s while cruising
const DRIFT = 0.08          // m/s per unit effective wind while idle

export function createSwim(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  let x = startX, z = startZ, heading = ctx.rng() * Math.PI * 2
  let state: State = 'cruise'
  let timer = 2 + ctx.rng() * 6
  let [tx, tz] = randomPointInPolygon(ctx.zone.points, ctx.rng)
  let rippleClock = 0
  let bob = 0

  function next(): void {
    const r = ctx.rng()
    if (state === 'cruise') {
      state = r < 0.6 ? 'idle' : 'dabble'
      timer = state === 'idle' ? 3 + ctx.rng() * 8 : 1.5 + ctx.rng() * 2
    } else {
      state = 'cruise'
      ;[tx, tz] = randomPointInPolygon(ctx.zone.points, ctx.rng)
      timer = 4 + ctx.rng() * 10
    }
  }

  return {
    name: 'swim',
    get state() { return state },
    get x() { return x }, get y() { return 0 }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      timer -= dt
      if (timer <= 0) next()
      const w = ctx.wind()
      if (state === 'cruise') {
        const want = Math.atan2(-(tz - z), tx - x)
        heading = turnToward(heading, want, TURN * dt)
        x += Math.cos(heading) * SPEED * dt
        z -= Math.sin(heading) * SPEED * dt
        if (Math.hypot(tx - x, tz - z) < 0.6) next()
        rippleClock += dt
        if (rippleClock >= RIPPLE_EVERY) { rippleClock = 0; ctx.onRipple?.(x, z) }
        bob += dt * 6
        pose.headBob = Math.sin(bob) * 0.06        // coot-style pump; other species read it faintly
        pose.lean.x = approach(pose.lean.x, 0, 6, dt)
        pose.neckExtend = approach(pose.neckExtend, 0.6, 4, dt)
      } else if (state === 'idle') {
        x += w.dirX * DRIFT * w.effective * dt
        z += w.dirZ * DRIFT * w.effective * dt
        pose.headBob = approach(pose.headBob, 0, 4, dt)
        pose.lean.x = approach(pose.lean.x, 0, 6, dt)
        pose.neckExtend = approach(pose.neckExtend, 0.35, 2, dt)
      } else {
        // dabble: tip-up, tail in the air, head under
        pose.lean.x = approach(pose.lean.x, 0.9, 5, dt)
        pose.tailTilt = approach(pose.tailTilt, 0.4, 5, dt)
        pose.neckExtend = approach(pose.neckExtend, 1, 5, dt)
        if (ctx.rng() < dt * 0.8) ctx.onRipple?.(x, z)
      }
      if (state !== 'dabble') pose.tailTilt = approach(pose.tailTilt, 0, 5, dt)
      ;[x, z] = clampToPolygon(x, z, ctx.zone.points)
    },
  }
}
```

- [ ] **Step 4: Run swim tests**

Run: `npx vitest run src/behavior/swim.test.ts`
Expected: PASS.

- [ ] **Step 5: Write failing wade and probe tests**

`src/behavior/wade.test.ts`:

```ts
import { createWade } from './wade'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext } from './types'

const zone = { kind: 'polygon' as const, points: [[-10, -10], [10, -10], [10, 10], [-10, 10]] as [number, number][] }
const ctx = (seed: number): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => ({ dirX: 0, dirZ: -1, effective: 0.3 }), ground: (x) => 0.1 + x * 0.01,
})

describe('wade', () => {
  it('stands on the ground height and stays in the zone', () => {
    const c = createWade(ctx(1), 2, 2)
    for (let i = 0; i < 2000; i++) {
      c.update(1 / 30, defaultPose())
      expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)
      expect(c.y).toBeCloseTo(0.1 + c.x * 0.01, 5)
    }
  })
  it('spends most of its time still', () => {
    const c = createWade(ctx(2), 0, 0)
    let still = 0, total = 0
    for (let t = 0; t < 180; t += 1 / 30) { c.update(1 / 30, defaultPose()); total++; if (c.state === 'still') still++ }
    expect(still / total).toBeGreaterThan(0.6)
  })
  it('strikes: neck extends fast then returns', () => {
    const c = createWade(ctx(3), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'strike' && guard++ < 100000) c.update(1 / 30, pose)
    expect(c.state).toBe('strike')
    c.update(0.15, pose)
    expect(pose.neckExtend).toBeGreaterThan(0.9)
  })
})
```

`src/behavior/probe.test.ts`:

```ts
import { createProbe } from './probe'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext } from './types'

const zone = { kind: 'polygon' as const, points: [[0, 0], [20, 0], [20, 10], [0, 10]] as [number, number][] }
const group = { targetX: 10, targetZ: 5, retargetAt: 0 }
const ctx = (seed: number): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => ({ dirX: 0, dirZ: 0, effective: 0 }), ground: () => 0.05, group,
})

describe('probe', () => {
  it('alternates run and peck and stays in the zone', () => {
    const c = createProbe(ctx(1), 5, 5)
    const states = new Set<string>()
    for (let t = 0; t < 60; t += 1 / 30) {
      c.update(1 / 30, defaultPose()); states.add(c.state)
      expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)
    }
    expect(states).toContain('run')
    expect(states).toContain('peck')
  })
  it('members of a group converge toward the shared target', () => {
    const a = createProbe(ctx(2), 1, 1), b = createProbe(ctx(3), 19, 9)
    for (let t = 0; t < 40; t += 1 / 30) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    const da = Math.hypot(a.x - group.targetX, a.z - group.targetZ)
    const db = Math.hypot(b.x - group.targetX, b.z - group.targetZ)
    expect(da).toBeLessThan(8)
    expect(db).toBeLessThan(8)
  })
  it('pecking pitches the body nose-down', () => {
    const c = createProbe(ctx(4), 5, 5)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'peck' && guard++ < 10000) c.update(1 / 30, pose)
    c.update(0.2, pose)
    expect(pose.lean.x).toBeGreaterThan(0.2)
  })
})
```

- [ ] **Step 6: Run to verify they fail**

Run: `npx vitest run src/behavior`
Expected: wade and probe FAIL.

- [ ] **Step 7: Implement wade and probe**

`src/behavior/wade.ts`:

```ts
import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach } from './types'
import { randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type State = 'still' | 'step' | 'strike'

const SPEED = 0.35
const TURN = 0.8

export function createWade(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  let x = startX, z = startZ, heading = ctx.rng() * Math.PI * 2
  let state: State = 'still'
  let timer = 6 + ctx.rng() * 14
  let [tx, tz] = [x, z]
  let strikeT = 0

  function next(): void {
    if (state === 'still') {
      if (ctx.rng() < 0.3) { state = 'strike'; strikeT = 0; timer = 1.2 }
      else {
        state = 'step'
        const [px, pz] = randomPointInPolygon(ctx.zone.points, ctx.rng)
        // short steps: move a few metres toward a random point, not all the way
        const d = Math.hypot(px - x, pz - z) || 1
        const len = Math.min(d, 2 + ctx.rng() * 2)
        tx = x + ((px - x) / d) * len
        tz = z + ((pz - z) / d) * len
        timer = 20
      }
    } else {
      state = 'still'
      timer = 8 + ctx.rng() * 20
    }
  }

  return {
    name: 'wade',
    get state() { return state },
    get x() { return x }, get y() { return ctx.ground(x, z) }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      timer -= dt
      if (timer <= 0) next()
      if (state === 'step') {
        const want = Math.atan2(-(tz - z), tx - x)
        heading = turnToward(heading, want, TURN * dt)
        x += Math.cos(heading) * SPEED * dt
        z -= Math.sin(heading) * SPEED * dt
        if (Math.hypot(tx - x, tz - z) < 0.3) next()
        pose.neckExtend = approach(pose.neckExtend, 0.55, 2, dt)
        pose.lean.x = approach(pose.lean.x, 0.15, 3, dt)
      } else if (state === 'strike') {
        strikeT += dt
        // fast extend in the first 0.15 s, then slow recover
        const striking = strikeT <= 0.15
        pose.neckExtend = approach(pose.neckExtend, striking ? 1 : 0.3, striking ? 40 : 3, dt)
        pose.lean.x = approach(pose.lean.x, striking ? 0.5 : 0, striking ? 30 : 3, dt)
      } else {
        pose.neckExtend = approach(pose.neckExtend, 0.3, 1.5, dt)
        pose.lean.x = approach(pose.lean.x, 0, 2, dt)
        // a gust ruffles: tiny roll
        pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
      }
      ;[x, z] = clampToPolygon(x, z, ctx.zone.points)
    },
  }
}
```

`src/behavior/probe.ts`:

```ts
import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach } from './types'
import { randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type State = 'run' | 'peck'

const SPEED = 1.1
const TURN = 6
const GROUP_RADIUS = 3
const GROUP_RETARGET = 45   // seconds

export function createProbe(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  let x = startX, z = startZ, heading = ctx.rng() * Math.PI * 2
  let state: State = 'peck'
  let timer = 0.5 + ctx.rng()
  let tx = x, tz = z
  let clock = 0
  let peckPhase = 0

  function pickTarget(): void {
    const g = ctx.group
    if (g && clock >= g.retargetAt) {
      ;[g.targetX, g.targetZ] = randomPointInPolygon(ctx.zone.points, ctx.rng)
      g.retargetAt = clock + GROUP_RETARGET
    }
    const cx = g ? g.targetX : x, cz = g ? g.targetZ : z
    const a = ctx.rng() * Math.PI * 2, r = ctx.rng() * GROUP_RADIUS
    ;[tx, tz] = clampToPolygon(cx + Math.cos(a) * r, cz + Math.sin(a) * r, ctx.zone.points)
  }

  function next(): void {
    if (state === 'run') { state = 'peck'; timer = 0.8 + ctx.rng() * 2; peckPhase = 0 }
    else { state = 'run'; pickTarget(); timer = 4 }
  }

  return {
    name: 'probe',
    get state() { return state },
    get x() { return x }, get y() { return ctx.ground(x, z) }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      if (timer <= 0) next()
      if (state === 'run') {
        const want = Math.atan2(-(tz - z), tx - x)
        heading = turnToward(heading, want, TURN * dt)
        x += Math.cos(heading) * SPEED * dt
        z -= Math.sin(heading) * SPEED * dt
        if (Math.hypot(tx - x, tz - z) < 0.2) next()
        pose.neckExtend = approach(pose.neckExtend, 0.8, 8, dt)
        pose.lean.x = approach(pose.lean.x, 0, 8, dt)
      } else {
        peckPhase += dt * 9
        const down = Math.max(0, Math.sin(peckPhase))
        pose.lean.x = 0.2 + down * 0.35
        pose.neckExtend = 0.5 + down * 0.4
      }
      ;[x, z] = clampToPolygon(x, z, ctx.zone.points)
    },
  }
}
```

`src/behavior/index.ts`:

```ts
import type { BehaviorFactory } from './types'
import { createSwim } from './swim'
import { createWade } from './wade'
import { createProbe } from './probe'

export const BEHAVIORS: Record<'swim' | 'wade' | 'probe', BehaviorFactory> = {
  swim: createSwim,
  wade: createWade,
  probe: createProbe,
}

export type { BehaviorContext, BehaviorController, BehaviorFactory } from './types'
```

- [ ] **Step 8: Run tests**

Run: `npx vitest run src/behavior && npm run typecheck`
Expected: PASS. If a timing assertion (like the 60% still ratio) fails, tune the timer ranges in the behavior, which is the intended knob, until it passes; the tests encode the feel the spec asks for.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: swim, wade, and probe behaviors with seeded state machines"
```

---

### Task 14: Spawner: cast to living birds

**Files:**
- Create: `src/birds/spawn.ts`, `src/birds/spawn.test.ts`, `src/birds/placeholder.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `Location`, `BEHAVIORS`, `BirdRegistry`, `buildBird`, `getSpec`, `hasSpec`, `RippleBuffer`, `Wind`, `Heightfield`.
- Produces:

```ts
export interface SpawnDeps { registry: BirdRegistry; wind: Wind; ground: (x: number, z: number) => number; ripples: RippleBuffer; seed: number }
export function expandCast(loc: Location, rng: Rng): { species: string; variant?: string; behavior: Behavior; zone: string; groupKey: string }[]
export function spawnCast(loc: Location, deps: SpawnDeps): WorldModule & { object: THREE.Group }
// placeholder.ts
export function buildPlaceholder(code: string): BirdModel     // grey generic bird for species without a spec yet
```

`expandCast` is the pure part: it turns each cast entry into `count` individuals, choosing a variant per bird when `plumage` is `mixed` (from the spec's variant names) or the named variant otherwise. Entries whose behavior is not in `BEHAVIORS` yet (perch, flyover, hover) are skipped in Milestone 1 with a console warning.

- [ ] **Step 1: Write the failing expandCast test**

`src/birds/spawn.test.ts`:

```ts
import { expandCast } from './spawn'
import { makeRng } from '../catalog/rng'
import type { Location } from '../location/schema'

const loc = (cast: Location['cast']): Location => ({
  id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 0 }, wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
  zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] }, sky: { kind: 'lane', from: [0, 0, 0], to: [1, 0, 0], altitude: [1, 2] } },
  cast, ambience: [],
})

describe('expandCast', () => {
  it('expands count into individuals', () => {
    const out = expandCast(loc([{ species: 'y00475', behavior: 'swim', zone: 'w', count: 3 }]), makeRng(1))
    expect(out).toHaveLength(3)
    expect(out.every(b => b.species === 'y00475' && b.variant === undefined)).toBe(true)
  })
  it('assigns male and female variants for mixed plumage', () => {
    const out = expandCast(loc([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 20, plumage: 'mixed' }]), makeRng(2))
    const variants = new Set(out.map(b => b.variant))
    expect(variants).toEqual(new Set(['male', 'female']))
  })
  it('uses the named variant when plumage is not mixed', () => {
    const out = expandCast(loc([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 2, plumage: 'female' }]), makeRng(3))
    expect(out.every(b => b.variant === 'female')).toBe(true)
  })
  it('skips behaviors that are not implemented yet', () => {
    const out = expandCast(loc([{ species: 'y00475', behavior: 'flyover', zone: 'sky', count: 5 }]), makeRng(4))
    expect(out).toEqual([])
  })
  it('gives each probe entry its own group key', () => {
    const out = expandCast(loc([
      { species: 'killde', behavior: 'probe', zone: 'w', count: 2 },
      { species: 'killde', behavior: 'probe', zone: 'w', count: 2 },
    ]), makeRng(5))
    expect(new Set(out.map(b => b.groupKey)).size).toBe(2)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/spawn.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement placeholder and spawn**

`src/birds/placeholder.ts`:

```ts
import { buildBird } from './procedural'
import type { BirdModel } from './model'
import type { SpeciesSpec } from './spec'

const GREY: SpeciesSpec['plumage'] = {
  crown: '#8a8a8a', cheek: '#8f8f8f', throat: '#9a9a9a', breast: '#a0a0a0', flank: '#969696',
  back: '#7c7c7c', wing: '#808080', speculum: null, rump: '#7c7c7c', tail: '#707070',
  bill: '#555555', legs: '#666666', eye: '#222222',
}

/** A neutral duck-shaped stand-in for cast species that have no spec yet. */
export function buildPlaceholder(code: string, posture: SpeciesSpec['posture'] = 'swimming'): BirdModel {
  return buildBird({
    code, commonName: code, length: 0.5,
    body: { length: 1, height: 0.5, width: 0.5 }, neck: { length: 0.3, thickness: 0.17, angle: 50 },
    head: { size: 0.3 }, bill: { length: 0.18, thickness: 0.1, shape: 'pointed' },
    legs: { length: posture === 'swimming' ? 0.2 : 0.5, thickness: 0.04 }, tail: { length: 0.15, angle: 10 },
    wing: { length: 0.55, width: 0.3 }, posture, draft: 0.4, plumage: GREY, variants: {},
    marks: { size: '', bill: '', head: '', body: '', legs: '' }, wingbeatHz: 5,
  })
}
```

`src/birds/spawn.ts`:

```ts
import * as THREE from 'three'
import type { Location, Behavior, PolygonZone } from '../location/schema'
import type { Rng } from '../catalog/types'
import { makeRng } from '../catalog/rng'
import { randomPointInPolygon } from '../location/zones'
import { BEHAVIORS, type BehaviorContext, type BehaviorController } from '../behavior'
import { buildBird } from './procedural'
import { buildPlaceholder } from './placeholder'
import { getSpec, hasSpec } from './species'
import { defaultPose, type PoseState } from './model'
import type { BirdRegistry } from './registry'
import type { Wind } from '../world/wind'
import type { RippleBuffer } from '../world/ripples'
import type { WorldModule } from '../world/scene'

export interface SpawnDeps {
  registry: BirdRegistry
  wind: Wind
  ground: (x: number, z: number) => number
  ripples: RippleBuffer
  seed: number
}

export interface Individual { species: string; variant?: string; behavior: Behavior; zone: string; groupKey: string }

export function expandCast(loc: Location, rng: Rng): Individual[] {
  const out: Individual[] = []
  loc.cast.forEach((entry, i) => {
    if (!(entry.behavior in BEHAVIORS)) {
      console.warn(`cast[${i}] ${entry.species}: behavior ${entry.behavior} is not implemented yet; skipped`)
      return
    }
    const variants = hasSpec(entry.species) ? Object.keys(getSpec(entry.species).variants) : []
    for (let n = 0; n < entry.count; n++) {
      let variant: string | undefined
      if (entry.plumage === 'mixed' && variants.length > 0) variant = variants[Math.floor(rng() * variants.length)]
      else if (entry.plumage && entry.plumage !== 'mixed' && variants.includes(entry.plumage)) variant = entry.plumage
      out.push({ species: entry.species, variant, behavior: entry.behavior, zone: entry.zone, groupKey: `cast${i}` })
    }
  })
  return out
}

const STANDING: Behavior[] = ['wade', 'probe']

export function spawnCast(loc: Location, deps: SpawnDeps): WorldModule & { object: THREE.Group } {
  const object = new THREE.Group()
  const rng = makeRng(deps.seed)
  const groups = new Map<string, NonNullable<BehaviorContext['group']>>()
  const live: { controller: BehaviorController; pose: PoseState; model: ReturnType<typeof buildBird>; wingHz: number; phase: number }[] = []

  for (const ind of expandCast(loc, rng)) {
    const zone = loc.zones[ind.zone] as PolygonZone
    const model = hasSpec(ind.species)
      ? buildBird(getSpec(ind.species), ind.variant)
      : buildPlaceholder(ind.species, STANDING.includes(ind.behavior) ? 'standing' : 'swimming')
    if (!groups.has(ind.groupKey)) groups.set(ind.groupKey, { targetX: 0, targetZ: 0, retargetAt: 0 })
    const ctx: BehaviorContext = {
      zone,
      rng: makeRng(Math.floor(rng() * 1e9)),
      wind: () => ({ dirX: deps.wind.state.dir.x, dirZ: deps.wind.state.dir.y, effective: deps.wind.effective() }),
      ground: deps.ground,
      onRipple: (x, z) => deps.ripples.spawn(x, z),
      group: ind.behavior === 'probe' ? groups.get(ind.groupKey) : undefined,
    }
    const [sx, sz] = randomPointInPolygon(zone.points, rng)
    const controller = BEHAVIORS[ind.behavior as keyof typeof BEHAVIORS](ctx, sx, sz)
    deps.registry.add({ species: ind.species, variant: ind.variant, model, behavior: ind.behavior })
    object.add(model.group)
    live.push({ controller, pose: defaultPose(), model, wingHz: hasSpec(ind.species) ? getSpec(ind.species).wingbeatHz : 5, phase: rng() })
  }

  return {
    object,
    update(dt) {
      for (const b of live) {
        b.controller.update(dt, b.pose)
        b.model.group.position.set(b.controller.x, b.controller.y, b.controller.z)
        b.model.group.rotation.y = b.controller.heading
        b.model.pose(b.pose)
      }
    },
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/birds && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Wire into main**

In `src/main.ts`:

```ts
import { BirdRegistry } from './birds/registry'
import { spawnCast } from './birds/spawn'
// ...
const registry = new BirdRegistry()
world.add(spawnCast(loc, { registry, wind: world.wind, ground: (x, z) => heightfield.sample(x, z), ripples, seed: 42 }))
// in onFrame: dev.update(dt, { birds: registry.size, gust: world.wind.state.gust, mode: 'eye' })
```

- [ ] **Step 6: Visual check**

Run: `npm run dev`. Expected: coots and mallards cruising, pausing, and tipping up on the near water with ripple rings trailing them; grey placeholders for gadwall, wigeon, and grebe further out; a heron and an egret-placeholder standing motionless on the far shore, occasionally stepping or striking; three killdeer running and stopping on the mudflat as a loose group. Birds face their direction of travel. Frame rate near 60 with the dev overlay showing the bird count. If the mudflat killdeer sink into or float above the ground, check that `ground` passes through the same heightfield the terrain used.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: spawn the location cast with behaviors, variants, and ripples"
```

---
### Task 15: Look controls, optics, and the HUD mask

**Files:**
- Create: `src/player/look.ts`, `src/player/look.test.ts`, `src/player/optics.ts`, `src/player/optics.test.ts`, `src/hud/mask.ts`, `src/hud/hud.css`
- Modify: `src/main.ts`, `index.html`

**Interfaces:**
- Produces:

```ts
// look.ts
export interface LookState { yaw: number; pitch: number }       // radians; yaw 0 faces -z, positive turns right
export function applyLookDelta(s: LookState, dx: number, dy: number, sensitivity: number, fovScale: number): LookState   // pure, clamps pitch to ±75°
export class LookControls {
  constructor(canvas: HTMLElement, initialHeadingDeg: number)
  readonly state: LookState
  sensitivity: number                     // default 0.0022 rad per px at fovScale 1
  fovScale: number                        // set by Optics each frame: currentFov / 60
  readonly locked: boolean
  applyTo(camera: THREE.PerspectiveCamera, swayX?: number, swayY?: number): void
}
// optics.ts
export type OpticMode = 'eye' | 'binoculars' | 'telescope'
export interface OpticSpec { fov: number; maskRadius: number; maskSoftness: number; sway: number; panScale: number; raiseSeconds: number }
export const OPTICS: Record<OpticMode, OpticSpec>
export const MODE_ORDER: OpticMode[]           // ['eye', 'binoculars', 'telescope']
export function nextMode(m: OpticMode, dir: 1 | -1): OpticMode   // clamps at the ends, does not wrap
export function swayOffset(t: number, amount: number): { x: number; y: number }   // pure, slow figure-8 in radians
export class Optics {
  mode: OpticMode
  /** 0..1 progress of the raise/lower transition */
  readonly transition: number
  readonly currentFov: number
  readonly focusBlur: number           // 0..1, decays over 0.4 s after a raise
  setMode(m: OpticMode): void
  update(dt: number, camera: THREE.PerspectiveCamera, look: LookControls): void   // sets camera.fov, applies sway, sets look.fovScale
}
// hud/mask.ts
export function createMask(root: HTMLElement): { update(mode: OpticMode, transition: number, focusBlur: number): void }
```

- [ ] **Step 1: Write failing look and optics tests**

`src/player/look.test.ts`:

```ts
import { applyLookDelta } from './look'

describe('applyLookDelta', () => {
  it('turns right for positive dx and clamps pitch', () => {
    const s = applyLookDelta({ yaw: 0, pitch: 0 }, 100, 0, 0.01, 1)
    expect(s.yaw).toBeCloseTo(1)
    const up = applyLookDelta({ yaw: 0, pitch: 0 }, 0, -100000, 0.01, 1)
    expect(up.pitch).toBeCloseTo((75 * Math.PI) / 180)
    const down = applyLookDelta({ yaw: 0, pitch: 0 }, 0, 100000, 0.01, 1)
    expect(down.pitch).toBeCloseTo((-75 * Math.PI) / 180)
  })
  it('scales sensitivity by fovScale so binoculars are not twitchy', () => {
    const a = applyLookDelta({ yaw: 0, pitch: 0 }, 100, 0, 0.01, 1)
    const b = applyLookDelta({ yaw: 0, pitch: 0 }, 100, 0, 0.01, 0.125)
    expect(b.yaw).toBeCloseTo(a.yaw * 0.125)
  })
})
```

`src/player/optics.test.ts`:

```ts
import { OPTICS, nextMode, swayOffset } from './optics'

describe('optics', () => {
  it('binoculars are 8x and the telescope 30x relative to 60°', () => {
    expect(OPTICS.eye.fov).toBe(60)
    expect(OPTICS.binoculars.fov).toBeCloseTo(7.5)
    expect(OPTICS.telescope.fov).toBeCloseTo(2)
  })
  it('the telescope has no hand sway and pans slower', () => {
    expect(OPTICS.telescope.sway).toBe(0)
    expect(OPTICS.binoculars.sway).toBeGreaterThan(0)
    expect(OPTICS.telescope.panScale).toBeLessThan(OPTICS.binoculars.panScale)
  })
  it('nextMode steps through the order and clamps at the ends', () => {
    expect(nextMode('eye', 1)).toBe('binoculars')
    expect(nextMode('binoculars', 1)).toBe('telescope')
    expect(nextMode('telescope', 1)).toBe('telescope')
    expect(nextMode('eye', -1)).toBe('eye')
  })
  it('sway is bounded by its amount and zero when amount is zero', () => {
    for (let t = 0; t < 20; t += 0.1) {
      const s = swayOffset(t, 0.002)
      expect(Math.abs(s.x)).toBeLessThanOrEqual(0.002 + 1e-9)
      expect(Math.abs(s.y)).toBeLessThanOrEqual(0.002 + 1e-9)
    }
    expect(swayOffset(3, 0)).toEqual({ x: 0, y: 0 })
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/player`
Expected: FAIL.

- [ ] **Step 3: Implement look**

`src/player/look.ts`:

```ts
import * as THREE from 'three'

export interface LookState { yaw: number; pitch: number }

const PITCH_LIMIT = (75 * Math.PI) / 180

export function applyLookDelta(s: LookState, dx: number, dy: number, sensitivity: number, fovScale: number): LookState {
  const k = sensitivity * fovScale
  return {
    yaw: s.yaw + dx * k,
    pitch: THREE.MathUtils.clamp(s.pitch - dy * k, -PITCH_LIMIT, PITCH_LIMIT),
  }
}

export class LookControls {
  state: LookState
  sensitivity = 0.0022
  fovScale = 1
  private isLocked = false
  private touchLast: { x: number; y: number } | null = null

  constructor(private canvas: HTMLElement, initialHeadingDeg: number) {
    this.state = { yaw: THREE.MathUtils.degToRad(initialHeadingDeg), pitch: 0 }
    canvas.addEventListener('click', () => { if (!this.isLocked) canvas.requestPointerLock() })
    document.addEventListener('pointerlockchange', () => { this.isLocked = document.pointerLockElement === canvas })
    document.addEventListener('mousemove', e => {
      if (!this.isLocked) return
      this.state = applyLookDelta(this.state, e.movementX, e.movementY, this.sensitivity, this.fovScale)
    })
    canvas.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) this.touchLast = { x: t.clientX, y: t.clientY } }, { passive: true })
    canvas.addEventListener('touchmove', e => {
      const t = e.touches[0]
      if (!t || !this.touchLast) return
      this.state = applyLookDelta(this.state, -(t.clientX - this.touchLast.x) * 2, -(t.clientY - this.touchLast.y) * 2, this.sensitivity, this.fovScale)
      this.touchLast = { x: t.clientX, y: t.clientY }
    }, { passive: true })
    canvas.addEventListener('touchend', () => { this.touchLast = null })
  }

  get locked(): boolean { return this.isLocked }

  applyTo(camera: THREE.PerspectiveCamera, swayX = 0, swayY = 0): void {
    camera.rotation.set(0, 0, 0)
    camera.rotation.order = 'YXZ'
    camera.rotation.y = -this.state.yaw + swayX
    camera.rotation.x = this.state.pitch + swayY
  }
}
```

- [ ] **Step 4: Implement optics**

`src/player/optics.ts`:

```ts
import type * as THREE from 'three'
import type { LookControls } from './look'

export type OpticMode = 'eye' | 'binoculars' | 'telescope'

export interface OpticSpec {
  fov: number
  /** fraction of the shorter viewport side */
  maskRadius: number
  /** edge softness in the same units */
  maskSoftness: number
  /** radians of hand sway amplitude */
  sway: number
  panScale: number
  raiseSeconds: number
}

export const OPTICS: Record<OpticMode, OpticSpec> = {
  eye:        { fov: 60,  maskRadius: 1,    maskSoftness: 0,    sway: 0,      panScale: 1,    raiseSeconds: 0.25 },
  binoculars: { fov: 7.5, maskRadius: 0.46, maskSoftness: 0.05, sway: 0.0016, panScale: 1,    raiseSeconds: 0.35 },
  telescope:  { fov: 2,   maskRadius: 0.40, maskSoftness: 0.012, sway: 0,     panScale: 0.55, raiseSeconds: 0.45 },
}

export const MODE_ORDER: OpticMode[] = ['eye', 'binoculars', 'telescope']

export function nextMode(m: OpticMode, dir: 1 | -1): OpticMode {
  const i = MODE_ORDER.indexOf(m) + dir
  return MODE_ORDER[Math.max(0, Math.min(MODE_ORDER.length - 1, i))]!
}

/** A slow figure-8 with a faster tremor, bounded by `amount`. */
export function swayOffset(t: number, amount: number): { x: number; y: number } {
  if (amount === 0) return { x: 0, y: 0 }
  const x = 0.6 * Math.sin(t * 0.9) + 0.25 * Math.sin(t * 3.7) + 0.15 * Math.sin(t * 11.3)
  const y = 0.6 * Math.sin(t * 1.3 + 1.2) + 0.25 * Math.sin(t * 4.1) + 0.15 * Math.sin(t * 9.7)
  return { x: x * amount, y: y * amount }
}

export class Optics {
  mode: OpticMode = 'eye'
  private from: OpticMode = 'eye'
  private t = 1
  private clock = 0
  private blur = 0

  get transition(): number { return this.t }
  get currentFov(): number {
    const a = OPTICS[this.from].fov, b = OPTICS[this.mode].fov
    const e = this.t * this.t * (3 - 2 * this.t)
    // interpolate in log space so the zoom feels even
    return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * e)
  }
  /** 0..1 focus-pull blur amount, for the mask overlay */
  get focusBlur(): number { return this.blur }

  setMode(m: OpticMode): void {
    if (m === this.mode) return
    this.from = this.mode
    this.mode = m
    this.t = 0
    this.blur = m === 'eye' ? 0 : 1
  }

  update(dt: number, camera: THREE.PerspectiveCamera, look: LookControls): void {
    this.clock += dt
    const spec = OPTICS[this.mode]
    if (this.t < 1) this.t = Math.min(1, this.t + dt / spec.raiseSeconds)
    this.blur = Math.max(0, this.blur - dt / 0.4)
    const fov = this.currentFov
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix() }
    look.fovScale = (fov / 60) * spec.panScale
    const sway = swayOffset(this.clock, spec.sway * this.t)
    look.applyTo(camera, sway.x, sway.y)
  }
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/player && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Implement the mask overlay**

`src/hud/mask.ts`. A full-screen div whose `background` is a radial gradient: transparent inside the circle, black outside, with a soft edge. The vignette for naked-eye mode is the same element with a very wide, very soft radius. A CSS `backdrop-filter: blur()` on the same element during the focus pull gives the blur-to-sharp raise.

```ts
import type { OpticMode } from '../player/optics'
import { OPTICS } from '../player/optics'

export function createMask(root: HTMLElement) {
  const el = document.createElement('div')
  el.className = 'optic-mask'
  root.appendChild(el)
  const ring = document.createElement('div')
  ring.className = 'optic-ring'
  root.appendChild(ring)
  return {
    update(mode: OpticMode, transition: number, focusBlur: number) {
      const s = OPTICS[mode]
      if (mode === 'eye') {
        el.style.background = 'radial-gradient(circle at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)'
        el.style.backdropFilter = ''
        ring.style.opacity = '0'
        return
      }
      const r = s.maskRadius * 100
      const soft = s.maskSoftness * 100
      const inner = Math.max(0, r - soft)
      const grow = 1 - (1 - transition) * 0.35     // circle grows in as the optic is raised
      el.style.background = `radial-gradient(circle at center, rgba(0,0,0,0) ${inner * grow}vmin, rgba(0,0,0,0.92) ${r * grow}vmin, #000 ${(r + 1) * grow}vmin)`
      el.style.backdropFilter = focusBlur > 0.02 ? `blur(${(focusBlur * 6).toFixed(1)}px)` : ''
      ring.style.opacity = String(transition)
      ring.style.width = ring.style.height = `${r * 2 * grow}vmin`
      ring.style.borderWidth = mode === 'telescope' ? '3px' : '1.5px'
      ring.style.borderColor = mode === 'telescope' ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.5)'
    },
  }
}
```

`src/hud/hud.css` (import from `src/styles.css` with `@import './hud/hud.css';`):

```css
.optic-mask { position: absolute; inset: 0; pointer-events: none; }
.optic-ring { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 50%; border: 1.5px solid rgba(0,0,0,.5); box-shadow: inset 0 0 30px rgba(0,0,0,.6); pointer-events: none; opacity: 0; }
.reticle { position: absolute; left: 50%; top: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px; border: 1px solid rgba(255,255,255,.55); border-radius: 50%; pointer-events: none; }
.prompt { position: absolute; left: 50%; bottom: 12vh; transform: translateX(-50%); padding: 6px 12px; background: rgba(0,0,0,.55); border-radius: 6px; font-size: 14px; letter-spacing: .02em; opacity: 0; transition: opacity .15s; pointer-events: none; }
.prompt.show { opacity: 1; }
.mode { position: absolute; right: 16px; bottom: 16px; font: 12px/1 monospace; opacity: .6; pointer-events: none; }
```

- [ ] **Step 7: Wire controls, optics, and mask into main**

In `src/main.ts`:

```ts
import { LookControls } from './player/look'
import { Optics, nextMode } from './player/optics'
import { createMask } from './hud/mask'
// ...
const hud = document.getElementById('hud')!
const look = new LookControls(world.renderer.domElement, loc.vantage.heading)
const optics = new Optics()
const mask = createMask(hud)
const modeEl = document.createElement('div'); modeEl.className = 'mode'; hud.appendChild(modeEl)

addEventListener('wheel', e => optics.setMode(nextMode(optics.mode, e.deltaY < 0 ? 1 : -1)), { passive: true })
addEventListener('keydown', e => {
  if (e.key === 'b' || e.key === 'B') optics.setMode(optics.mode === 'binoculars' ? 'eye' : 'binoculars')
  if (e.key === 't' || e.key === 'T') optics.setMode(optics.mode === 'telescope' ? 'eye' : 'telescope')
  if (e.key === 'Escape') optics.setMode('eye')
})

world.start(dt => {
  optics.update(dt, world.camera, look)
  mask.update(optics.mode, optics.transition, optics.focusBlur)
  modeEl.textContent = optics.mode === 'eye' ? 'scroll / B / T for optics' : optics.mode
  // ... existing per-frame code
  dev.update(dt, { birds: registry.size, gust: world.wind.state.gust, mode: optics.mode })
})
```

- [ ] **Step 8: Visual check**

Run: `npm run dev`. Click to lock the pointer. Expected: mouse look with a 75° pitch clamp; scroll up raises binoculars: the view zooms in over about a third of a second while a circular mask closes in and the image resolves from a blur, then drifts with a slow hand sway; mouse sensitivity feels the same in screen terms as at naked eye. Scroll up again for the telescope: a tighter circle with a hard dark ring, no sway, and noticeably slower panning. Scroll down lowers each in turn. Esc drops to naked eye (pointer lock also releases on Esc; click to re-lock). Naked eye shows a faint vignette.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: pointer-lock look, binoculars and telescope optics, circular mask"
```

---

### Task 16: Store and target selection

**Files:**
- Create: `src/store/store.ts`, `src/store/store.test.ts`, `src/store/game.ts`, `src/player/target.ts`, `src/player/target.test.ts`, `src/hud/prompt.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces:

```ts
// store.ts (generic, tiny)
export interface Store<T> { get(): T; set(patch: Partial<T> | ((s: T) => Partial<T>)): void; subscribe(fn: (s: T) => void): () => void }
export function createStore<T extends object>(initial: T): Store<T>
// game.ts
export interface GameState {
  optic: OpticMode
  target: { id: number; species: string; tooSmall: boolean } | null
  guideOpen: boolean
  identifying: { targetId: number; species: string; misses: number } | null
  card: { kind: 'correct'; species: string } | { kind: 'wrong'; guess: string; hint: string } | { kind: 'revealed'; species: string } | null
  lifeListOpen: boolean
}
export const game: Store<GameState>
// target.ts (pure)
export function apparentSizePx(radiusM: number, distanceM: number, fovDeg: number, viewportHeightPx: number): number
export const MIN_TARGET_PX = 28
export const RETICLE_RADIUS_PX = 60
export interface Candidate { id: number; species: string; position: THREE.Vector3; radius: number }
export interface TargetResult { id: number; species: string; apparentPx: number; tooSmall: boolean }
export function pickTarget(cands: readonly Candidate[], camera: THREE.PerspectiveCamera, viewport: { width: number; height: number }): TargetResult | null
// hud/prompt.ts
export function createPrompt(root: HTMLElement): { set(text: string | null): void }
```

`pickTarget` projects each candidate into normalized device coordinates, keeps those in front of the camera and within `RETICLE_RADIUS_PX` of the center (a bird whose projected center lies exactly on the edge counts), computes apparent size, and returns the largest one. `tooSmall` is true when the largest is below `MIN_TARGET_PX`; a bird exactly at the threshold is not too small.

- [ ] **Step 1: Write failing store and target tests**

`src/store/store.test.ts`:

```ts
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
```

`src/player/target.test.ts`:

```ts
import * as THREE from 'three'
import { apparentSizePx, pickTarget, MIN_TARGET_PX, RETICLE_RADIUS_PX } from './target'

function cam(fov: number) {
  const c = new THREE.PerspectiveCamera(fov, 16 / 9, 0.1, 1000)
  c.position.set(0, 0, 0)
  c.lookAt(0, 0, -1)
  c.updateMatrixWorld(true)
  c.updateProjectionMatrix()
  return c
}
const vp = { width: 1600, height: 900 }

describe('apparentSizePx', () => {
  it('grows with magnification: 8x binoculars make a bird 8x taller on screen', () => {
    const eye = apparentSizePx(0.2, 40, 60, 900)
    const bino = apparentSizePx(0.2, 40, 7.5, 900)
    // tan(30°)/tan(3.75°) is about 8.8; the nominal 8x is the angular ratio
    expect(bino / eye).toBeGreaterThan(8)
    expect(bino / eye).toBeLessThan(9.5)
  })
})

describe('pickTarget', () => {
  it('returns null when nothing is near the reticle', () => {
    expect(pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(30, 0, -20), radius: 0.3 }], cam(60), vp)).toBeNull()
  })
  it('ignores birds behind the camera', () => {
    expect(pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(0, 0, 5), radius: 0.3 }], cam(60), vp)).toBeNull()
  })
  it('picks the largest bird inside the reticle and flags tooSmall below the threshold', () => {
    const far = { id: 1, species: 'far', position: new THREE.Vector3(0, 0, -200), radius: 0.2 }
    const near = { id: 2, species: 'near', position: new THREE.Vector3(0.2, 0, -8), radius: 0.2 }
    const r = pickTarget([far, near], cam(60), vp)!
    expect(r.id).toBe(2)
    expect(r.tooSmall).toBe(false)
    const only = pickTarget([far], cam(60), vp)!
    expect(only.id).toBe(1)
    expect(only.tooSmall).toBe(true)
    expect(pickTarget([far], cam(2), vp)!.tooSmall).toBe(false)
  })
  it('a bird exactly at the size threshold is not too small', () => {
    // solve distance so apparent size equals MIN_TARGET_PX exactly at 60° / 900 px
    const radius = 0.2
    const fovRad = (60 * Math.PI) / 180
    const d = (2 * radius * 900) / (MIN_TARGET_PX * 2 * Math.tan(fovRad / 2))
    const r = pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(0, 0, -d), radius }], cam(60), vp)!
    expect(r.apparentPx).toBeCloseTo(MIN_TARGET_PX, 6)
    expect(r.tooSmall).toBe(false)
  })
  it('a bird exactly on the reticle edge is inside', () => {
    // place a bird whose projected x offset equals RETICLE_RADIUS_PX at 60° / 1600x900
    const c = cam(60)
    const z = -50
    const fovRad = (60 * Math.PI) / 180
    const halfH = Math.tan(fovRad / 2) * -z
    const x = (RETICLE_RADIUS_PX / (900 / 2)) * halfH
    const r = pickTarget([{ id: 1, species: 'a', position: new THREE.Vector3(x, 0, z), radius: 1 }], c, vp)
    expect(r?.id).toBe(1)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/store src/player/target.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement store, game state, target, prompt**

`src/store/store.ts`:

```ts
export interface Store<T> {
  get(): T
  set(patch: Partial<T> | ((s: T) => Partial<T>)): void
  subscribe(fn: (s: T) => void): () => void
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial
  const subs = new Set<(s: T) => void>()
  return {
    get: () => state,
    set(patch) {
      const p = typeof patch === 'function' ? patch(state) : patch
      state = { ...state, ...p }
      for (const fn of subs) fn(state)
    },
    subscribe(fn) {
      subs.add(fn)
      return () => { subs.delete(fn) }
    },
  }
}
```

`src/store/game.ts`:

```ts
import { createStore } from './store'
import type { OpticMode } from '../player/optics'

export interface GameState {
  optic: OpticMode
  target: { id: number; species: string; tooSmall: boolean } | null
  guideOpen: boolean
  identifying: { targetId: number; species: string; misses: number } | null
  card:
    | { kind: 'correct'; species: string }
    | { kind: 'wrong'; guess: string; hint: string }
    | { kind: 'revealed'; species: string }
    | null
  lifeListOpen: boolean
}

export const game = createStore<GameState>({
  optic: 'eye', target: null, guideOpen: false, identifying: null, card: null, lifeListOpen: false,
})

/** True when any overlay owns the input and the world should pause. */
export function isPaused(s: GameState): boolean {
  return s.guideOpen || s.card !== null || s.lifeListOpen
}
```

`src/player/target.ts`:

```ts
import * as THREE from 'three'

export const MIN_TARGET_PX = 28
export const RETICLE_RADIUS_PX = 60

export interface Candidate { id: number; species: string; position: THREE.Vector3; radius: number }
export interface TargetResult { id: number; species: string; apparentPx: number; tooSmall: boolean }

/** Height in pixels of a sphere of `radiusM` at `distanceM` under a vertical fov. */
export function apparentSizePx(radiusM: number, distanceM: number, fovDeg: number, viewportHeightPx: number): number {
  const fovRad = (fovDeg * Math.PI) / 180
  const worldHeightAtD = 2 * Math.tan(fovRad / 2) * distanceM
  return (2 * radiusM / worldHeightAtD) * viewportHeightPx
}

const v = new THREE.Vector3()

export function pickTarget(
  cands: readonly Candidate[],
  camera: THREE.PerspectiveCamera,
  viewport: { width: number; height: number },
): TargetResult | null {
  let best: TargetResult | null = null
  const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld)
  for (const c of cands) {
    v.copy(c.position).project(camera)
    if (v.z > 1 || v.z < -1) continue                          // outside near/far
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    if (new THREE.Vector3().subVectors(c.position, camPos).dot(forward) <= 0) continue   // behind
    const px = (v.x * viewport.width) / 2
    const py = (v.y * viewport.height) / 2
    if (Math.hypot(px, py) > RETICLE_RADIUS_PX + 1e-6) continue
    const dist = c.position.distanceTo(camPos)
    const apparentPx = apparentSizePx(c.radius, dist, camera.fov, viewport.height)
    if (!best || apparentPx > best.apparentPx) {
      best = { id: c.id, species: c.species, apparentPx, tooSmall: apparentPx < MIN_TARGET_PX - 1e-9 }
    }
  }
  return best
}
```

`src/hud/prompt.ts`:

```ts
export function createPrompt(root: HTMLElement) {
  const reticle = document.createElement('div')
  reticle.className = 'reticle'
  root.appendChild(reticle)
  const el = document.createElement('div')
  el.className = 'prompt'
  root.appendChild(el)
  let last: string | null = null
  return {
    set(text: string | null) {
      if (text === last) return
      last = text
      el.textContent = text ?? ''
      el.classList.toggle('show', text !== null)
    },
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/store src/player && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Wire targeting into main**

In `src/main.ts`:

```ts
import { game, isPaused } from './store/game'
import { pickTarget } from './player/target'
import { createPrompt } from './hud/prompt'
import { findBird } from './catalog'
// ...
const prompt = createPrompt(hud)
game.subscribe(s => world.setPaused(isPaused(s)))

world.start(dt => {
  optics.update(dt, world.camera, look)
  game.set({ optic: optics.mode })
  // targeting only with optics raised
  if (optics.mode === 'eye' || optics.transition < 1) {
    game.set({ target: null })
    prompt.set(null)
  } else {
    const cands = registry.all().map(b => ({ id: b.id, species: b.species, position: b.position, radius: b.model.radius }))
    const t = pickTarget(cands, world.camera, { width: innerWidth, height: innerHeight })
    game.set({ target: t ? { id: t.id, species: t.species, tooSmall: t.tooSmall } : null })
    if (!t) prompt.set(null)
    else if (t.tooSmall) prompt.set(optics.mode === 'telescope' ? 'Too far to identify' : 'Too far. Try the telescope')
    else if (registry.get(t.id)?.identified) prompt.set(findBird(t.species).commonName)
    else prompt.set('Identify  [E]')
  }
  // ... rest of frame
})
```

Guard `game.set` calls that would not change anything to avoid notifying subscribers every frame: wrap in `if (game.get().optic !== optics.mode)` and compare target ids before setting.

- [ ] **Step 6: Visual check**

Run: `npm run dev`. Raise binoculars and center a near coot: a small reticle circle sits at center and "Identify [E]" appears at the bottom. Aim at the far heron with binoculars: "Too far. Try the telescope". Switch to the telescope on the heron: "Identify [E]". Lower to naked eye: no prompt.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: game store, reticle target selection, HUD prompt"
```

---
### Task 17: Field guide and the identification flow

**Files:**
- Create: `src/game/identify.ts`, `src/game/identify.test.ts`, `src/game/guideSpecies.ts`, `src/game/guideSpecies.test.ts`, `src/ui/useStore.ts`, `src/ui/App.tsx`, `src/ui/FieldGuide.tsx`, `src/ui/ResultCard.tsx`, `src/ui/ui.css`
- Modify: `src/main.ts`, `src/styles.css`

**Interfaces:**
- Consumes: `game` store, `BirdRegistry`, `loadCatalog`, `SPECIES`, `MarkKey`.
- Produces:

```ts
// game/identify.ts (pure)
export interface IdSession { targetId: number; species: string; misses: number }
export const MAX_MISSES = 3
export type Judgement =
  | { result: 'correct' }
  | { result: 'wrong'; hint: string; session: IdSession }
  | { result: 'revealed'; species: string }
export function judge(session: IdSession, guess: string, specs: Record<string, SpeciesSpec>, names: (code: string) => string): Judgement
export function buildHint(guessName: string, guessMarks: Record<MarkKey, string> | null, truthMarks: Record<MarkKey, string> | null, misses: number): string
export function fieldMarkFor(code: string, specs: Record<string, SpeciesSpec>): string | null   // first mark line for the correct card
// game/guideSpecies.ts (pure)
export function guideSpecies(catalog: readonly Bird[], habitat: Habitat): Bird[]   // habitat-tagged, sorted by family then common name
```

Hint rule: compare the guess's marks to the truth's, key by key in the order `size, bill, head, body, legs`, and use the first key whose text differs, offset by the miss count so a second miss gets a different key. Phrase it as what the guessed species would show, so the true species is never named. If either species has no spec yet (placeholder birds), fall back to "Look again at the bill and the overall shape."

- [ ] **Step 1: Write failing identify and guideSpecies tests**

`src/game/identify.test.ts`:

```ts
import { judge, buildHint, fieldMarkFor, MAX_MISSES } from './identify'
import { SPECIES } from '../birds/species'

const names = (c: string) => ({ y00475: 'American Coot', mallar3: 'Mallard', grbher3: 'Great Blue Heron', gadwal: 'Gadwall' })[c] ?? c

describe('judge', () => {
  it('is correct when the guess matches', () => {
    expect(judge({ targetId: 1, species: 'y00475', misses: 0 }, 'y00475', SPECIES, names)).toEqual({ result: 'correct' })
  })
  it('counts a miss and returns a hint about the guessed species', () => {
    const j = judge({ targetId: 1, species: 'y00475', misses: 0 }, 'mallar3', SPECIES, names)
    expect(j.result).toBe('wrong')
    if (j.result !== 'wrong') return
    expect(j.session.misses).toBe(1)
    expect(j.hint).toContain('Mallard')
    expect(j.hint).not.toContain('Coot')
  })
  it('guessing the same wrong species twice counts two misses', () => {
    let s = { targetId: 1, species: 'y00475', misses: 0 }
    const a = judge(s, 'mallar3', SPECIES, names)
    if (a.result !== 'wrong') throw new Error()
    const b = judge(a.session, 'mallar3', SPECIES, names)
    if (b.result !== 'wrong') throw new Error()
    expect(b.session.misses).toBe(2)
    expect(b.hint).not.toBe(a.hint)
  })
  it('reveals on the third miss regardless of which species were guessed', () => {
    const s = { targetId: 1, species: 'y00475', misses: MAX_MISSES - 1 }
    expect(judge(s, 'grbher3', SPECIES, names)).toEqual({ result: 'revealed', species: 'y00475' })
  })
  it('falls back to a generic hint when a species has no spec', () => {
    const j = judge({ targetId: 1, species: 'gadwal', misses: 0 }, 'mallar3', SPECIES, names)
    if (j.result !== 'wrong') throw new Error()
    expect(j.hint).toMatch(/Look again/)
  })
})

describe('buildHint', () => {
  const coot = SPECIES['y00475']!.marks, mallard = SPECIES['mallar3']!.marks
  it('names the first differing mark, phrased about the guess', () => {
    expect(buildHint('Mallard', mallard, coot, 0)).toBe(`Not a Mallard. Check the size: a Mallard is ${mallard.size}.`)
  })
  it('moves to the next differing mark on later misses', () => {
    expect(buildHint('Mallard', mallard, coot, 1)).toBe(`Not a Mallard. Check the bill: a Mallard has ${mallard.bill}.`)
  })
})

describe('fieldMarkFor', () => {
  it('returns the bill mark for a known species and null otherwise', () => {
    expect(fieldMarkFor('y00475', SPECIES)).toBe(SPECIES['y00475']!.marks.bill)
    expect(fieldMarkFor('gadwal', SPECIES)).toBeNull()
  })
})
```

`src/game/guideSpecies.test.ts`:

```ts
import { guideSpecies } from './guideSpecies'
import { loadCatalog } from '../catalog'

describe('guideSpecies', () => {
  it('lists only wetland-tagged species, sorted by family then name', () => {
    const out = guideSpecies(loadCatalog(), 'wetland')
    expect(out.length).toBeGreaterThan(20)
    expect(out.every(b => b.habitats.includes('wetland'))).toBe(true)
    for (let i = 1; i < out.length; i++) {
      const a = out[i - 1]!, b = out[i]!
      expect(a.familyCommon < b.familyCommon || (a.familyCommon === b.familyCommon && a.commonName <= b.commonName)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/game`
Expected: FAIL.

- [ ] **Step 3: Implement identify and guideSpecies**

`src/game/identify.ts`:

```ts
import type { SpeciesSpec, MarkKey } from '../birds/spec'
import { MARK_KEYS } from '../birds/spec'

export interface IdSession { targetId: number; species: string; misses: number }
export const MAX_MISSES = 3

export type Judgement =
  | { result: 'correct' }
  | { result: 'wrong'; hint: string; session: IdSession }
  | { result: 'revealed'; species: string }

const VERB: Record<MarkKey, string> = { size: 'is', bill: 'has', head: 'has', body: 'has', legs: 'has' }
const GENERIC = 'Look again at the bill and the overall shape.'

export function buildHint(
  guessName: string,
  guessMarks: Record<MarkKey, string> | null,
  truthMarks: Record<MarkKey, string> | null,
  misses: number,
): string {
  if (!guessMarks || !truthMarks) return `Not a ${guessName}. ${GENERIC}`
  const differing = MARK_KEYS.filter(k => guessMarks[k] !== truthMarks[k])
  if (differing.length === 0) return `Not a ${guessName}. ${GENERIC}`
  const key = differing[misses % differing.length]!
  return `Not a ${guessName}. Check the ${key}: a ${guessName} ${VERB[key]} ${guessMarks[key]}.`
}

export function judge(
  session: IdSession,
  guess: string,
  specs: Record<string, SpeciesSpec>,
  names: (code: string) => string,
): Judgement {
  if (guess === session.species) return { result: 'correct' }
  const misses = session.misses + 1
  if (misses >= MAX_MISSES) return { result: 'revealed', species: session.species }
  const hint = buildHint(names(guess), specs[guess]?.marks ?? null, specs[session.species]?.marks ?? null, session.misses)
  return { result: 'wrong', hint, session: { ...session, misses } }
}

export function fieldMarkFor(code: string, specs: Record<string, SpeciesSpec>): string | null {
  return specs[code]?.marks.bill ?? null
}
```

`src/game/guideSpecies.ts`:

```ts
import type { Bird, Habitat } from '../catalog/types'

export function guideSpecies(catalog: readonly Bird[], habitat: Habitat): Bird[] {
  return catalog
    .filter(b => b.habitats.includes(habitat))
    .sort((a, b) => a.familyCommon.localeCompare(b.familyCommon) || a.commonName.localeCompare(b.commonName))
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/game`
Expected: PASS.

- [ ] **Step 5: Preact hook and components**

`src/ui/useStore.ts`:

```ts
import { useEffect, useState } from 'preact/hooks'
import type { Store } from '../store/store'

export function useStore<T extends object>(store: Store<T>): T {
  const [state, setState] = useState(store.get())
  useEffect(() => store.subscribe(setState), [store])
  return state
}
```

`src/ui/FieldGuide.tsx`:

```tsx
import { useMemo, useState } from 'preact/hooks'
import type { Bird } from '../catalog/types'
import type { SpeciesSpec } from '../birds/spec'

export interface SeenState { [code: string]: 'self' | 'revealed' | undefined }

interface Props {
  species: Bird[]
  specs: Record<string, SpeciesSpec>
  seen: SeenState
  /** present when opened to identify a target */
  onConfirm: ((code: string) => void) | null
  onClose: () => void
}

export function FieldGuide({ species, specs, seen, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [playing, setPlaying] = useState<HTMLAudioElement | null>(null)
  const byFamily = useMemo(() => {
    const m = new Map<string, Bird[]>()
    for (const b of species) m.set(b.familyCommon, [...(m.get(b.familyCommon) ?? []), b])
    return [...m.entries()]
  }, [species])
  const bird = species.find(b => b.speciesCode === selected) ?? null

  function play(file: string) {
    playing?.pause()
    const a = new Audio('/' + file)
    a.play().catch(() => {})
    setPlaying(a)
  }

  return (
    <div class="guide">
      <div class="guide-list">
        <header>
          <h2>Field Guide</h2>
          <button onClick={() => { playing?.pause(); onClose() }}>Close</button>
        </header>
        {byFamily.map(([family, birds]) => (
          <section key={family}>
            <h3>{family}</h3>
            {birds.map(b => (
              <button key={b.speciesCode} class={'guide-row' + (b.speciesCode === selected ? ' selected' : '')} onClick={() => setSelected(b.speciesCode)}>
                <span class={'seen seen-' + (seen[b.speciesCode] ?? 'none')} aria-hidden="true" />
                {b.commonName}
              </button>
            ))}
          </section>
        ))}
      </div>
      <div class="guide-detail">
        {bird ? (
          <>
            <h2>{bird.commonName}</h2>
            <p class="sci">{bird.scientificName}</p>
            {bird.photo && <img src={'/' + bird.photo.file} alt={bird.commonName} />}
            {bird.photo && <p class="attr">{bird.photo.attribution}</p>}
            {specs[bird.speciesCode] && (
              <ul class="marks">
                {Object.values(specs[bird.speciesCode]!.marks).map(m => <li key={m}>{m}</li>)}
              </ul>
            )}
            <div class="clips">
              {bird.audio.map(c => (
                <button key={c.xcId} onClick={() => play(c.file)}>▶ {c.type} <small>{c.recordist}, {c.license}</small></button>
              ))}
            </div>
            {onConfirm && <button class="confirm" onClick={() => { playing?.pause(); onConfirm(bird.speciesCode) }}>It's a {bird.commonName}</button>}
          </>
        ) : (
          <p class="empty">Pick a species to see its photo, calls, and field marks.</p>
        )}
      </div>
    </div>
  )
}
```

`src/ui/ResultCard.tsx`:

```tsx
import type { Bird } from '../catalog/types'
import type { GameState } from '../store/game'

interface Props { card: NonNullable<GameState['card']>; birdOf: (code: string) => Bird; fieldMark: (code: string) => string | null; onDismiss: () => void }

export function ResultCard({ card, birdOf, fieldMark, onDismiss }: Props) {
  if (card.kind === 'wrong') {
    return (
      <div class="card wrong">
        <h2>Not quite</h2>
        <p>{card.hint}</p>
        <button onClick={onDismiss}>Look again</button>
      </div>
    )
  }
  const bird = birdOf(card.species)
  const mark = fieldMark(card.species)
  return (
    <div class={'card ' + card.kind}>
      <h2>{card.kind === 'correct' ? 'Correct!' : 'It was a'}</h2>
      <h1>{bird.commonName}</h1>
      <p class="sci">{bird.scientificName}</p>
      {bird.photo && <img src={'/' + bird.photo.file} alt={bird.commonName} />}
      {mark && <p class="mark">{mark}</p>}
      <button onClick={onDismiss}>Continue</button>
    </div>
  )
}
```

`src/ui/App.tsx`:

```tsx
import { useStore } from './useStore'
import { game } from '../store/game'
import { FieldGuide, type SeenState } from './FieldGuide'
import { ResultCard } from './ResultCard'
import type { Bird } from '../catalog/types'
import type { SpeciesSpec } from '../birds/spec'

export interface AppDeps {
  guide: Bird[]
  specs: Record<string, SpeciesSpec>
  birdOf: (code: string) => Bird
  fieldMark: (code: string) => string | null
  seen: () => SeenState
  onGuess: (code: string) => void
  onCloseGuide: () => void
  onDismissCard: () => void
}

export function App(d: AppDeps) {
  const s = useStore(game)
  return (
    <>
      {s.guideOpen && (
        <FieldGuide species={d.guide} specs={d.specs} seen={d.seen()} onConfirm={s.identifying ? d.onGuess : null} onClose={d.onCloseGuide} />
      )}
      {s.card && <ResultCard card={s.card} birdOf={d.birdOf} fieldMark={d.fieldMark} onDismiss={d.onDismissCard} />}
    </>
  )
}
```

`src/ui/ui.css` (add `@import './ui/ui.css';` to `src/styles.css`):

```css
.guide { position: absolute; inset: 4vh 6vw; display: grid; grid-template-columns: 300px 1fr; background: #f4efe3; color: #23201a; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.5); font-family: Georgia, serif; }
.guide-list { overflow-y: auto; border-right: 1px solid #d8d0bd; padding: 12px; }
.guide-list header { display: flex; justify-content: space-between; align-items: center; }
.guide-list h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #7a6f58; margin: 14px 0 4px; }
.guide-row { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 6px 8px; border: 0; background: none; font: inherit; cursor: pointer; border-radius: 6px; }
.guide-row.selected, .guide-row:hover { background: #e6dec9; }
.seen { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid #4c6b3a; display: inline-block; }
.seen-none { border-color: transparent; }
.seen-self { background: #4c6b3a; }
.seen-revealed { background: none; }
.guide-detail { padding: 20px 28px; overflow-y: auto; }
.guide-detail img, .card img { max-width: 100%; max-height: 40vh; border-radius: 8px; }
.sci { font-style: italic; color: #6b6150; margin-top: -8px; }
.attr { font-size: 11px; color: #8a8070; }
.marks { padding-left: 18px; }
.clips button { display: block; margin: 4px 0; font: inherit; }
.clips small { color: #8a8070; margin-left: 6px; }
.confirm { margin-top: 16px; padding: 10px 18px; font: inherit; font-weight: bold; background: #4c6b3a; color: #fff; border: 0; border-radius: 8px; cursor: pointer; }
.card { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(520px, 90vw); padding: 24px 28px; background: #f4efe3; color: #23201a; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,.5); font-family: Georgia, serif; text-align: center; }
.card h1 { margin: 4px 0; }
.card.wrong { border-top: 6px solid #b5533c; }
.card.correct { border-top: 6px solid #4c6b3a; }
.card.revealed { border-top: 6px solid #8a8070; }
.card button { margin-top: 12px; padding: 8px 16px; font: inherit; cursor: pointer; }
```

- [ ] **Step 6: Wire the flow into main**

In `src/main.ts`:

```ts
import { render } from 'preact'
import { App } from './ui/App'
import { judge } from './game/identify'
import { fieldMarkFor } from './game/identify'
import { guideSpecies } from './game/guideSpecies'
import { SPECIES } from './birds/species'
import { loadCatalog, findBird } from './catalog'
// ...
const catalog = loadCatalog()
const guide = guideSpecies(catalog, loc.habitat)

addEventListener('keydown', e => {
  const s = game.get()
  if ((e.key === 'e' || e.key === 'E') && s.target && !s.target.tooSmall && !s.guideOpen && !s.card) {
    const inst = registry.get(s.target.id)
    if (!inst || inst.identified) return
    game.set({ identifying: { targetId: s.target.id, species: s.target.species, misses: 0 }, guideOpen: true })
    document.exitPointerLock()
  }
  if ((e.key === 'g' || e.key === 'G') && !s.card) {
    game.set({ guideOpen: !s.guideOpen, identifying: s.guideOpen ? null : s.identifying })
    if (!s.guideOpen) document.exitPointerLock()
  }
})

render(
  <App
    guide={guide}
    specs={SPECIES}
    birdOf={findBird}
    fieldMark={code => fieldMarkFor(code, SPECIES)}
    seen={() => ({})}
    onGuess={code => {
      const s = game.get()
      if (!s.identifying) return
      const j = judge(s.identifying, code, SPECIES, c => findBird(c).commonName)
      if (j.result === 'correct') {
        const inst = registry.get(s.identifying.targetId)
        if (inst) inst.identified = true
        game.set({ guideOpen: false, identifying: null, card: { kind: 'correct', species: s.identifying.species } })
      } else if (j.result === 'wrong') {
        game.set({ guideOpen: false, identifying: j.session, card: { kind: 'wrong', guess: code, hint: j.hint } })
      } else {
        const inst = registry.get(s.identifying.targetId)
        if (inst) inst.identified = true
        game.set({ guideOpen: false, identifying: null, card: { kind: 'revealed', species: j.species } })
      }
    }}
    onCloseGuide={() => game.set({ guideOpen: false, identifying: null })}
    onDismissCard={() => {
      const s = game.get()
      // after a wrong guess the session continues; pressing E on the same bird resumes it with its miss count
      game.set({ card: null })
      if (s.identifying) game.set({ identifying: s.identifying })
    }}
  />,
  document.getElementById('ui')!,
)
```

Rename `src/main.ts` to `src/main.tsx` and update `index.html` to `/src/main.tsx`. Also change the E-key handler so that if `s.identifying` already exists for the same target id, it reopens the guide with the existing session (preserving misses) instead of resetting to zero:

```ts
const existing = s.identifying && s.identifying.targetId === s.target.id ? s.identifying : null
game.set({ identifying: existing ?? { targetId: s.target.id, species: s.target.species, misses: 0 }, guideOpen: true })
```

The `seen` prop is a stub here and is replaced by the life list in Task 18.

- [ ] **Step 7: Visual check**

Run: `npm run dev`. Raise binoculars on a coot, press E: the guide opens over a paused scene, listing wetland species by family with photos, playable calls, and field marks for the four spec'd species. Choose Mallard: a "Not quite" card with a hint about Mallards, then "Look again" returns to the scene. Press E on the same coot again and choose Gadwall: second miss with a different hint. Third wrong choice: the "It was a ... American Coot" card. On a fresh coot, choose American Coot: "Correct!" with photo and the bill field mark. Aiming at that coot afterwards shows its name in the prompt. Press G at any time to browse the guide without identifying.

- [ ] **Step 8: Typecheck, test, commit**

Run: `npm run typecheck && npm test`

```bash
git add -A
git commit -m "feat: field guide, identification flow with hints and reveal, result cards"
```

---

### Task 18: Life list

**Files:**
- Create: `src/game/lifeList.ts`, `src/game/lifeList.test.ts`, `src/game/lifeListStorage.ts`, `src/game/lifeListStorage.test.ts`, `src/ui/LifeList.tsx`
- Modify: `src/main.tsx`, `src/ui/App.tsx`, `src/ui/ui.css`

**Interfaces:**
- Produces:

```ts
// lifeList.ts (pure)
export interface SpeciesRecord { firstSeenAt: string; firstSeenLocation: string; selfIdentified: number; revealed: number; wrongGuesses: number }
export interface Sighting { species: string; location: string; timeOfDay: string; selfIdentified: boolean; at: string }
export interface LifeListData { version: 1; species: Record<string, SpeciesRecord>; journal: Sighting[] }
export const JOURNAL_LIMIT = 200
export function emptyLifeList(): LifeListData
export function recordSighting(data: LifeListData, s: { species: string; location: string; timeOfDay: string; selfIdentified: boolean; wrongGuesses: number; at: string }): LifeListData   // returns a new object
export function seenState(data: LifeListData): Record<string, 'self' | 'revealed'>
export function summary(data: LifeListData, locationSpecies: readonly string[]): { seen: number; total: number; accuracy: number | null }
// lifeListStorage.ts
export interface LifeListStorage { load(): LifeListData; save(d: LifeListData): boolean; readonly persistent: boolean }
export function createLifeListStorage(storage: Storage | null, key?: string): LifeListStorage
```

- [ ] **Step 1: Write failing life list tests**

`src/game/lifeList.test.ts`:

```ts
import { emptyLifeList, recordSighting, seenState, summary, JOURNAL_LIMIT } from './lifeList'

const base = { location: 'willow-lake', timeOfDay: 'morning', at: '2026-09-22T14:00:00Z' }

describe('recordSighting', () => {
  it('creates a species record on first sighting and does not mutate the input', () => {
    const d0 = emptyLifeList()
    const d1 = recordSighting(d0, { ...base, species: 'y00475', selfIdentified: true, wrongGuesses: 1 })
    expect(d0.species).toEqual({})
    expect(d1.species['y00475']).toEqual({ firstSeenAt: base.at, firstSeenLocation: 'willow-lake', selfIdentified: 1, revealed: 0, wrongGuesses: 1 })
    expect(d1.journal).toHaveLength(1)
  })
  it('accumulates counts and keeps the first-seen date', () => {
    let d = recordSighting(emptyLifeList(), { ...base, species: 'y00475', selfIdentified: false, wrongGuesses: 3 })
    d = recordSighting(d, { ...base, at: '2026-09-23T00:00:00Z', species: 'y00475', selfIdentified: true, wrongGuesses: 0 })
    expect(d.species['y00475']).toMatchObject({ firstSeenAt: base.at, selfIdentified: 1, revealed: 1, wrongGuesses: 3 })
  })
  it('caps the journal at the limit, dropping the oldest', () => {
    let d = emptyLifeList()
    for (let i = 0; i < JOURNAL_LIMIT + 5; i++) d = recordSighting(d, { ...base, at: String(i), species: 'y00475', selfIdentified: true, wrongGuesses: 0 })
    expect(d.journal).toHaveLength(JOURNAL_LIMIT)
    expect(d.journal[0]!.at).toBe('5')
  })
})

describe('seenState and summary', () => {
  it('marks self once any self-identification exists, otherwise revealed', () => {
    let d = recordSighting(emptyLifeList(), { ...base, species: 'a', selfIdentified: false, wrongGuesses: 3 })
    d = recordSighting(d, { ...base, species: 'b', selfIdentified: true, wrongGuesses: 0 })
    d = recordSighting(d, { ...base, species: 'a', selfIdentified: true, wrongGuesses: 0 })
    expect(seenState(d)).toEqual({ a: 'self', b: 'self' })
    const d2 = recordSighting(emptyLifeList(), { ...base, species: 'c', selfIdentified: false, wrongGuesses: 3 })
    expect(seenState(d2)).toEqual({ c: 'revealed' })
  })
  it('summarises seen count against the location list and accuracy', () => {
    let d = recordSighting(emptyLifeList(), { ...base, species: 'a', selfIdentified: true, wrongGuesses: 1 })
    d = recordSighting(d, { ...base, species: 'zz', selfIdentified: true, wrongGuesses: 0 })
    const s = summary(d, ['a', 'b', 'c'])
    expect(s).toEqual({ seen: 1, total: 3, accuracy: 2 / 3 })
    expect(summary(emptyLifeList(), ['a']).accuracy).toBeNull()
  })
})
```

`src/game/lifeListStorage.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/game/lifeList`
Expected: FAIL.

- [ ] **Step 3: Implement lifeList and storage**

`src/game/lifeList.ts`:

```ts
export interface SpeciesRecord {
  firstSeenAt: string
  firstSeenLocation: string
  selfIdentified: number
  revealed: number
  wrongGuesses: number
}

export interface Sighting {
  species: string
  location: string
  timeOfDay: string
  selfIdentified: boolean
  at: string
}

export interface LifeListData {
  version: 1
  species: Record<string, SpeciesRecord>
  journal: Sighting[]
}

export const JOURNAL_LIMIT = 200

export function emptyLifeList(): LifeListData {
  return { version: 1, species: {}, journal: [] }
}

export function recordSighting(
  data: LifeListData,
  s: { species: string; location: string; timeOfDay: string; selfIdentified: boolean; wrongGuesses: number; at: string },
): LifeListData {
  const prev = data.species[s.species]
  const rec: SpeciesRecord = prev
    ? { ...prev }
    : { firstSeenAt: s.at, firstSeenLocation: s.location, selfIdentified: 0, revealed: 0, wrongGuesses: 0 }
  if (s.selfIdentified) rec.selfIdentified += 1
  else rec.revealed += 1
  rec.wrongGuesses += s.wrongGuesses
  const journal = [...data.journal, { species: s.species, location: s.location, timeOfDay: s.timeOfDay, selfIdentified: s.selfIdentified, at: s.at }]
  return {
    version: 1,
    species: { ...data.species, [s.species]: rec },
    journal: journal.slice(Math.max(0, journal.length - JOURNAL_LIMIT)),
  }
}

export function seenState(data: LifeListData): Record<string, 'self' | 'revealed'> {
  const out: Record<string, 'self' | 'revealed'> = {}
  for (const [code, r] of Object.entries(data.species)) out[code] = r.selfIdentified > 0 ? 'self' : 'revealed'
  return out
}

export function summary(data: LifeListData, locationSpecies: readonly string[]): { seen: number; total: number; accuracy: number | null } {
  const seen = locationSpecies.filter(c => c in data.species).length
  let right = 0, attempts = 0
  for (const r of Object.values(data.species)) {
    right += r.selfIdentified
    attempts += r.selfIdentified + r.wrongGuesses
  }
  return { seen, total: locationSpecies.length, accuracy: attempts === 0 ? null : right / attempts }
}
```

`src/game/lifeListStorage.ts`:

```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/game && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Life list screen**

`src/ui/LifeList.tsx`:

```tsx
import type { LifeListData } from '../game/lifeList'
import { summary } from '../game/lifeList'
import type { Bird } from '../catalog/types'

interface Props { data: LifeListData; birdOf: (code: string) => Bird; locationName: string; locationSpecies: string[]; persistent: boolean; onClose: () => void }

export function LifeList({ data, birdOf, locationName, locationSpecies, persistent, onClose }: Props) {
  const s = summary(data, locationSpecies)
  const byFamily = new Map<string, { bird: Bird; rec: LifeListData['species'][string] }[]>()
  for (const [code, rec] of Object.entries(data.species)) {
    const bird = birdOf(code)
    byFamily.set(bird.familyCommon, [...(byFamily.get(bird.familyCommon) ?? []), { bird, rec }])
  }
  return (
    <div class="lifelist">
      <header>
        <h2>Life List</h2>
        <span>{s.seen} of {s.total} species at {locationName}{s.accuracy !== null && ` · ${Math.round(s.accuracy * 100)}% accuracy`}</span>
        <button onClick={onClose}>Close</button>
      </header>
      {!persistent && <p class="warn">Progress is not being saved in this browser.</p>}
      {byFamily.size === 0 && <p class="empty">Nothing yet. Raise the binoculars and press E on a bird.</p>}
      {[...byFamily.entries()].sort().map(([family, rows]) => (
        <section key={family}>
          <h3>{family}</h3>
          {rows.map(({ bird, rec }) => (
            <div class="row" key={bird.speciesCode}>
              <span class={'seen seen-' + (rec.selfIdentified > 0 ? 'self' : 'revealed')} />
              <span class="name">{bird.commonName}</span>
              <span class="meta">first {rec.firstSeenAt.slice(0, 10)} · {rec.selfIdentified} identified · {rec.revealed} revealed</span>
            </div>
          ))}
        </section>
      ))}
      <h3>Journal</h3>
      <ol class="journal">
        {[...data.journal].reverse().slice(0, 50).map((j, i) => (
          <li key={i}>{j.at.slice(0, 16).replace('T', ' ')} · {birdOf(j.species).commonName} · {j.location} · {j.timeOfDay} · {j.selfIdentified ? 'identified' : 'revealed'}</li>
        ))}
      </ol>
    </div>
  )
}
```

Add to `src/ui/ui.css`:

```css
.lifelist { position: absolute; inset: 4vh 10vw; padding: 20px 28px; overflow-y: auto; background: #f4efe3; color: #23201a; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,.5); font-family: Georgia, serif; }
.lifelist header { display: flex; gap: 16px; align-items: baseline; }
.lifelist header span { flex: 1; color: #6b6150; }
.lifelist .row { display: flex; gap: 10px; align-items: center; padding: 4px 0; }
.lifelist .meta { color: #8a8070; font-size: 12px; }
.lifelist .warn { color: #b5533c; }
.journal { font-size: 13px; color: #6b6150; }
```

- [ ] **Step 6: Wire into App and main**

In `src/ui/App.tsx` add props `lifeList: () => LifeListData`, `locationName: string`, `locationSpecies: string[]`, `persistent: () => boolean`, `onCloseLifeList: () => void`, and render:

```tsx
{s.lifeListOpen && (
  <LifeList data={d.lifeList()} birdOf={d.birdOf} locationName={d.locationName} locationSpecies={d.locationSpecies} persistent={d.persistent()} onClose={d.onCloseLifeList} />
)}
```

In `src/main.tsx`:

```ts
import { createLifeListStorage } from './game/lifeListStorage'
import { recordSighting, seenState } from './game/lifeList'
// ...
let ls: Storage | null = null
try { ls = window.localStorage } catch { ls = null }
const lifeStorage = createLifeListStorage(ls)
let lifeList = lifeStorage.load()

function record(species: string, selfIdentified: boolean, wrongGuesses: number) {
  lifeList = recordSighting(lifeList, { species, location: loc.id, timeOfDay: loc.timeOfDay, selfIdentified, wrongGuesses, at: new Date().toISOString() })
  lifeStorage.save(lifeList)
}
```

In `onGuess`: on `correct`, call `record(s.identifying.species, true, s.identifying.misses)`; on `revealed`, call `record(j.species, false, MAX_MISSES)` (import `MAX_MISSES`). Replace `seen={() => ({})}` with `seen={() => seenState(lifeList)}`. Pass `lifeList={() => lifeList}`, `locationName={loc.name}`, `locationSpecies={guide.map(b => b.speciesCode)}`, `persistent={() => lifeStorage.persistent}`, `onCloseLifeList={() => game.set({ lifeListOpen: false })}`.

Add the key handler:

```ts
if ((e.key === 'l' || e.key === 'L') && !s.card && !s.guideOpen) {
  game.set({ lifeListOpen: !s.lifeListOpen })
  if (!s.lifeListOpen) document.exitPointerLock()
}
```

- [ ] **Step 7: Visual check**

Run: `npm run dev`. Identify a coot correctly, press L: the life list shows "1 of N species at Willow Lake", the coot under Rails, Gallinules, and Coots with a full green dot, and a journal line. Reload the page and press L: still there. Open the guide with G: the coot row has a full dot. Get a mallard revealed after three misses: hollow dot in both places, accuracy drops. Open DevTools, set `localStorage.setItem('lakewatch.lifelist', '{bad')`, reload: the game boots with an empty list and no console error.

- [ ] **Step 8: Typecheck, test, commit**

Run: `npm run typecheck && npm test && npm run build`
Expected: all green; `dist/` produced.

```bash
git add -A
git commit -m "feat: persistent life list with journal, seen markers, and summary"
```

---

## Milestone 1 done

At this point the spec's build-order steps 1 to 5 are complete: a wind-driven lake with water, reeds, trees, four procedurally modeled species behaving in their zones, pointer-lock look with binoculars and telescope, guide-based identification with hints and a three-miss reveal, and a persistent life list. Milestone 2 (audio, flyover flocks, kingfisher hover and perch, the remaining species specs, title card, settings, credits, Cloudflare deploy) gets its own plan.
