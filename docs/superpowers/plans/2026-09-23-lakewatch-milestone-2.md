# Lakewatch Milestone 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the spec: positional audio (ambience, bird calls, event sounds), flyover flocks, the kingfisher and the perching birds, every remaining species model, a title card, settings, credits, and a Cloudflare Pages deploy.

**Architecture:** Milestone 1's render loop, `BirdRegistry`, `Wind`, and observable store stay as they are. Audio is a thin `AudioEngine` over Three.js `AudioListener`/`PositionalAudio`, fed by pure, tested pieces: a sample synthesizer for ambience loops and UI sounds, a seeded call scheduler, and a clip picker over the catalog. Flocks are one `InstancedMesh` per body part driven by a pure flyover controller, so a 14-goose V costs a dozen draw calls. New behaviors (`perch`, `hover`, `flyover`) are seeded state machines like the existing three. New overlays (title, settings, credits) are Preact screens gated by new booleans in `GameState`, so `isPaused` keeps pausing the world for every overlay.

**Tech Stack:** Vite 8, TypeScript 7, Vitest 5, Three.js 0.186 (audio via `THREE.AudioListener`, `THREE.PositionalAudio`, `THREE.InstancedMesh`), Preact 10, zod 4, ffmpeg-static (build-time audio processing), wrangler 4 (Cloudflare Pages).

**Spec:** `docs/superpowers/specs/2026-09-22-lakewatch-design.md`

**Milestone split:** Milestone 1 (`docs/superpowers/plans/2026-09-22-lakewatch-milestone-1.md`) shipped spec build-order steps 1 to 5. This plan covers steps 6, 7, and 8: audio, flyovers and the kingfisher, the remaining species, title and settings and credits, and deploy.

**Decisions made while planning (not in the spec):**

- **Ambience and event sounds are synthesized in-game**, not harvested. The spec's harvest pipeline covers bird media only; there is no CC-NC source for lake ambience wired up, and a manually curated one would need attribution the pipeline cannot verify. `data/ambience.json` still exists as the manifest the spec asks for: each layer names a `synth` recipe today and can name a `file` with attribution later without touching code.
- **Flock birds are instanced per body part** from the procedural template, posed each frame by the same `pose()` the single birds use. This is the spec's "instanced, per-bird wingbeat phase" without a second model builder.
- **Flock members join the registry while crossing and leave when the flock exits.** They are identifiable in the air; an identification session on one is cut short if the flock leaves first (the controller already tolerates a missing registry entry).
- **Point-zone behaviors read a `perch` from the spawner**, which resolves the snag's perch point from `createSnag` and every other point zone to its own position.
- **The four allow-listed species are harvested in their own task** (Task 15) because it needs the eBird and xeno-canto keys and the network. Every other task works offline, so the plan still ships if that task is deferred.

## Global Constraints

- Browser target: Chrome, 60 fps on an integrated GPU. Fixed viewpoint, no LOD.
- Non-commercial: all media stays CC-NC with attribution carried in `data/birds.json` and `data/ambience.json`; every clip's attribution appears on its guide entry and on the credits screen.
- Art direction: stylized realism. No photo textures on any mesh. Colors are per-part vertex colors or material colors.
- Every module that animates reads wind from the shared `Wind` object; nothing animates independently.
- Game logic (targeting, identification, life list, the call scheduler) queries the `BirdRegistry`, never the Three.js scene graph.
- Validation failures in location, species, or ambience data are build errors, never runtime fallbacks.
- Both optics use a single circular mask. Optics do not change the sound.
- Audio: Three.js positional audio with the listener on the camera. A cap on simultaneous calls; nearer birds win. One moving source per flyover flock.
- The title card starts the audio context on click. Without a click the game must still run, silently, without errors.
- Persistence is localStorage, keyed by a schema version. Unavailable localStorage means in-memory state and a notice.
- Pure logic is unit-tested with Vitest (`environment: 'node'`, no DOM, no Web Audio). Rendering and sound are checked by ear and eye with the dev overlay.
- `npm run build` runs typecheck and tests before `vite build`. Deploy is `wrangler pages deploy`.
- Every commit leaves `npm test` green. Do not commit `node_modules`, `.env`, `dist`, `data/raw`, or `.wrangler`.

## Review Focus

Inputs the spec implies but no task's tests would otherwise exercise, each pinned to a test in the owning task:

1. **The audio context is never unlocked** (the player skips the title click, or the browser blocks autoplay): the call player must schedule nothing and log nothing, and the game must run silently (Task 6, `callPlayer.test.ts`: a locked engine receives no `load` or `playAt`).
2. **A species with no clip of the preferred type** (Canada Goose has only calls; a schedule that prefers song) must fall back to any clip, and a species with no audio at all must be skipped without an error (Task 4, `clips.test.ts`).
3. **A flock member under identification leaves the registry mid-session**: a correct guess must still record the sighting and close cleanly rather than throw on the missing entry (Task 10, `identifyController.test.ts`).
4. **Settings stored with out-of-range or non-numeric values** (`volume: 5`, `sensitivity: -1`, `NaN`) must be clamped into range, never applied raw to the look controls or the master gain (Task 12, `settings.test.ts`).
5. **A location that names an ambience layer missing from the manifest** must fail the build with a message naming the id, not play silence for that layer (Task 5, `validate.test.ts`).

---

### Task 1: Game-ready audio: loudness, hiss, and fades

**Files:**
- Modify: `scripts/lib/ffmpeg.ts`, `scripts/lib/ffmpeg.test.ts`, `package.json`
- Create: `scripts/process-audio.ts`

**Interfaces:**
- Consumes: `assertFfmpegAvailable`, `probeDurationSeconds` (existing).
- Produces:

```ts
export const GAME_READY_FILTER: string                                   // ffmpeg -af chain
export function clipArgs(input: string, output: string, seconds: number): string[]
export function clipArgsKeepingSilence(input: string, output: string, seconds: number): string[]
export function processArgs(input: string, output: string): string[]     // re-encode an existing clip through GAME_READY_FILTER
export async function processClip(input: string, output: string): Promise<void>
```

The spec's build step "produces game-ready audio: silence trimmed, loudness normalized, short fades, a gentle high-pass to reduce recording hiss." The harvest chain already trims silence; this task adds the rest to every future harvest and re-processes the clips copied from birdsong-quiz once.

- [ ] **Step 1: Update the failing tests**

In `scripts/lib/ffmpeg.test.ts`, replace the `clipArgs` describe block and add `processArgs`:

```ts
import { clipArgs, clipArgsKeepingSilence, processArgs, resizeArgs, assertFfmpegAvailable, clipAndTranscode, GAME_READY_FILTER } from './ffmpeg'

describe('GAME_READY_FILTER', () => {
  it('high-passes, normalises loudness, and fades both ends', () => {
    expect(GAME_READY_FILTER).toContain('highpass=f=250')
    expect(GAME_READY_FILTER).toContain('loudnorm=I=-18')
    // fade in at the head; fade out via reverse/fade/reverse so no duration is needed
    expect(GAME_READY_FILTER).toMatch(/afade=t=in:st=0:d=0\.05,areverse,afade=t=in:st=0:d=0\.25,areverse$/)
  })
})

describe('clipArgs', () => {
  const args = clipArgs('in.mp3', 'out.mp3', 10)
  const filter = args[args.indexOf('-af') + 1]!

  it('reads the input and writes the output', () => {
    expect(args).toContain('in.mp3')
    expect(args[args.length - 1]).toBe('out.mp3')
  })

  it('strips leading silence, then trims to the requested seconds, then applies the game chain', () => {
    expect(filter.startsWith('silenceremove=start_periods=1')).toBe(true)
    expect(filter).toContain(',atrim=0:10,')
    expect(filter.endsWith(GAME_READY_FILTER)).toBe(true)
  })

  it('does not also pass -t (atrim owns the duration so the fade-out lands at the cut)', () => {
    expect(args).not.toContain('-t')
  })

  it('encodes mono 64k at 32kHz', () => {
    expect(args[args.indexOf('-ac') + 1]).toBe('1')
    expect(args[args.indexOf('-b:a') + 1]).toBe('64k')
    expect(args[args.indexOf('-ar') + 1]).toBe('32000')
  })

  it('overwrites without prompting', () => {
    expect(args).toContain('-y')
  })
})

describe('clipArgsKeepingSilence', () => {
  it('drops only the silenceremove stage', () => {
    const filter = clipArgsKeepingSilence('in.mp3', 'out.mp3', 10)
    const f = filter[filter.indexOf('-af') + 1]!
    expect(f).not.toContain('silenceremove')
    expect(f.startsWith('atrim=0:10,')).toBe(true)
    expect(f.endsWith(GAME_READY_FILTER)).toBe(true)
  })
})

describe('processArgs', () => {
  it('re-encodes an existing clip through the game chain with the same codec settings', () => {
    const args = processArgs('a.mp3', 'b.mp3')
    expect(args[args.indexOf('-af') + 1]).toBe(GAME_READY_FILTER)
    expect(args[args.indexOf('-ar') + 1]).toBe('32000')
    expect(args[args.length - 1]).toBe('b.mp3')
  })
})
```

Keep the `resizeArgs`, `assertFfmpegAvailable`, and `clipAndTranscode` blocks as they are. In `clipAndTranscode`'s "still trims leading silence" test the assertion `toBeLessThan(3)` still holds: loudnorm and the fades do not change duration.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run scripts/lib/ffmpeg.test.ts`
Expected: FAIL (`GAME_READY_FILTER`, `processArgs` not exported; `-t` still present).

- [ ] **Step 3: Implement the filter chain**

In `scripts/lib/ffmpeg.ts` replace `clipArgs` and `clipArgsKeepingSilence` and add the new exports:

```ts
/**
 * The chain every clip the game plays goes through: a gentle high-pass to
 * lose recording hiss and handling rumble, EBU R128 loudness to -18 LUFS so a
 * wren and a goose sit at the same level before distance attenuation, and short
 * fades. The fade-out is done by reversing so it needs no duration.
 */
export const GAME_READY_FILTER =
  'highpass=f=250,loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.05,areverse,afade=t=in:st=0:d=0.25,areverse'

const ENCODE = ['-ac', '1', '-b:a', '64k', '-ar', '32000', '-y']

export function clipArgs(input: string, output: string, seconds: number): string[] {
  return [
    '-i', input,
    '-af', `silenceremove=start_periods=1:start_duration=0.1:start_threshold=-50dB,atrim=0:${seconds},${GAME_READY_FILTER}`,
    ...ENCODE,
    output,
  ]
}

/** The same encode without the silence filter, for recordings it would eat whole. */
export function clipArgsKeepingSilence(input: string, output: string, seconds: number): string[] {
  return ['-i', input, '-af', `atrim=0:${seconds},${GAME_READY_FILTER}`, ...ENCODE, output]
}

/** Re-encode a clip that predates the game chain (the media copied from birdsong-quiz). */
export function processArgs(input: string, output: string): string[] {
  return ['-i', input, '-af', GAME_READY_FILTER, ...ENCODE, output]
}

export async function processClip(input: string, output: string): Promise<void> {
  assertFfmpegAvailable()
  await run(ffmpegPath!, processArgs(input, output))
}
```

`resizeArgs`, `clipAndTranscode`, `isUsable`, and `resizeImage` are unchanged.

- [ ] **Step 4: Run tests**

Run: `npx vitest run scripts/lib/ffmpeg.test.ts`
Expected: PASS, including the two real-ffmpeg `clipAndTranscode` cases.

- [ ] **Step 5: Write the one-time processing script**

`scripts/process-audio.ts`:

```ts
import { readdir, rename, unlink } from 'node:fs/promises'
import { processClip } from './lib/ffmpeg'
import { probeDurationSeconds } from './lib/probe'

// Re-encodes every clip under public/media/audio through GAME_READY_FILTER, in
// place. Run once after copying media that predates the chain. Clips the
// harvest writes from now on already come out game-ready, and re-running this
// on them is harmless (loudnorm and the fades are idempotent to the ear).
const DIR = 'public/media/audio'
const files = (await readdir(DIR)).filter(f => f.endsWith('.mp3')).sort()
let done = 0
const failed: string[] = []
for (const f of files) {
  const src = `${DIR}/${f}`
  const tmp = `${DIR}/${f}.processing.mp3`
  try {
    await processClip(src, tmp)
    const seconds = await probeDurationSeconds(tmp)
    if (seconds === null || seconds < 0.5) throw new Error(`output is ${seconds}s`)
    await rename(tmp, src)
    done++
    process.stdout.write('.')
  } catch (err) {
    failed.push(`${f}: ${(err as Error).message}`)
    await unlink(tmp).catch(() => {})
  }
}
console.log(`\nprocessed ${done}/${files.length} clips`)
if (failed.length) {
  console.error(`failed (${failed.length}):`)
  for (const f of failed) console.error(`  ${f}`)
  process.exitCode = 1
}
```

Add to `package.json` scripts: `"audio:process": "tsx scripts/process-audio.ts"`.

- [ ] **Step 6: Process the existing media**

Run: `npm run audio:process`
Expected: `processed 207/207 clips` (a couple of minutes). Spot check by ear: open `public/media/audio/y00475-*.mp3` and `public/media/audio/cangoo-*.mp3` in a browser tab; the coot and the goose should sit at a similar level and neither should start or end with a click.

- [ ] **Step 7: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: game-ready audio chain (high-pass, loudnorm, fades) and a one-time processor"
```

---

### Task 2: Title card, overlay flags, and the no-WebGL path

**Files:**
- Modify: `src/store/game.ts`, `src/game/identifyController.ts`, `src/game/identifyController.test.ts`, `src/ui/App.tsx`, `src/ui/ui.css`, `src/main.tsx`
- Create: `src/ui/Title.tsx`

**Interfaces:**
- Consumes: `createStore`, `isPaused`, `createIdentifyController` (existing).
- Produces:

```ts
// store/game.ts additions
titleOpen: boolean; settingsOpen: boolean; creditsOpen: boolean   // on GameState; initial true/false/false
// identifyController.ts additions
toggleSettings(): void
toggleCredits(): void
// ui/Title.tsx
export interface TitleProps { unsupported: string | null; onBegin: () => void; onSettings: () => void; onCredits: () => void }
export function Title(p: TitleProps): JSX.Element
```

The title card is the spec's audio gate ("click to begin unlocks audio") and its WebGL fallback ("the title card explains and links the credits"). This task adds the card and the flags; Task 4 makes the click unlock audio, Tasks 12 and 13 fill in settings and credits.

- [ ] **Step 1: Write the failing controller tests**

In `src/game/identifyController.test.ts`, extend `makeStore` with the three new flags and add tests:

```ts
function makeStore(patch: Partial<GameState> = {}) {
  return createStore<GameState>({
    optic: 'eye', target: null, guideOpen: false, guideMode: 'browse', identifying: null, card: null, lifeListOpen: false,
    titleOpen: false, settingsOpen: false, creditsOpen: false,
    ...patch,
  })
}
```

```ts
  it('ignores every key while the title card is up', () => {
    const store = makeStore({ target: TARGET, titleOpen: true })
    const registry = makeRegistry({ 1: { species: 'y00475', identified: false } })
    const { controller } = makeController(store, registry)

    controller.pressIdentify()
    controller.toggleGuide()
    controller.toggleLifeList()
    controller.toggleSettings()
    controller.toggleCredits()
    controller.closeOverlay()

    expect(store.get()).toMatchObject({ titleOpen: true, guideOpen: false, lifeListOpen: false, settingsOpen: false, creditsOpen: false, identifying: null })
  })

  it('toggles settings and credits, each exclusive with the other overlays', () => {
    const store = makeStore()
    const { controller } = makeController(store, makeRegistry({}))

    controller.toggleSettings()
    expect(store.get().settingsOpen).toBe(true)
    controller.toggleCredits()                       // blocked while settings is open
    expect(store.get().creditsOpen).toBe(false)
    controller.toggleGuide()                         // also blocked
    expect(store.get().guideOpen).toBe(false)
    controller.toggleSettings()
    expect(store.get().settingsOpen).toBe(false)

    controller.toggleCredits()
    expect(store.get().creditsOpen).toBe(true)
    controller.closeOverlay()
    expect(store.get().creditsOpen).toBe(false)
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/game/identifyController.test.ts`
Expected: FAIL (`toggleSettings` is not a function; the title test fails because `pressIdentify` opens the guide).

- [ ] **Step 3: Extend the store**

`src/store/game.ts`:

```ts
import { createStore } from './store'
import type { OpticMode } from '../player/optics'

export interface GameState {
  optic: OpticMode
  target: { id: number; species: string; tooSmall: boolean } | null
  guideOpen: boolean
  /** what the field guide is for: free browsing, or confirming a guess against `identifying` */
  guideMode: 'browse' | 'identify'
  identifying: { targetId: number; species: string; misses: number } | null
  card:
    | { kind: 'correct'; species: string }
    | { kind: 'wrong'; guess: string; hint: string }
    | { kind: 'revealed'; species: string }
    | null
  lifeListOpen: boolean
  /** the title card; true until the player clicks Begin (which also unlocks audio) */
  titleOpen: boolean
  settingsOpen: boolean
  creditsOpen: boolean
}

export const game = createStore<GameState>({
  optic: 'eye', target: null, guideOpen: false, guideMode: 'browse', identifying: null, card: null, lifeListOpen: false,
  titleOpen: true, settingsOpen: false, creditsOpen: false,
})

/** True when any overlay owns the input and the world should pause. */
export function isPaused(s: GameState): boolean {
  return s.titleOpen || s.guideOpen || s.card !== null || s.lifeListOpen || s.settingsOpen || s.creditsOpen
}
```

- [ ] **Step 4: Extend the controller**

In `src/game/identifyController.ts`:

```ts
import { isPaused } from '../store/game'
```

Delete the local `anyOverlayOpen` and use `isPaused` in its place. Add the two toggles and widen the interface and `closeOverlay`:

```ts
export interface IdentifyController {
  pressIdentify(): void
  toggleGuide(): void
  toggleLifeList(): void
  toggleSettings(): void
  toggleCredits(): void
  closeOverlay(): void
  guess(code: string): void
  closeGuide(): void
  dismissCard(): void
}
```

```ts
  function pressIdentify(): void {
    const s = store.get()
    if (isPaused(s)) return
    // ... unchanged from here
  }

  /** Opens `flag` unless another overlay is already up; closes it if it is the one that is up. */
  function toggle(flag: 'guideOpen' | 'lifeListOpen' | 'settingsOpen' | 'creditsOpen', patchOnOpen: Partial<GameState> = {}): void {
    const s = store.get()
    if (isPaused(s) && !s[flag]) return
    const opening = !s[flag]
    const patch: Partial<GameState> = opening ? { ...patchOnOpen } : {}
    patch[flag] = opening
    store.set(patch)
    if (opening) exitPointerLock()
  }

  function toggleGuide(): void { toggle('guideOpen', { guideMode: 'browse' }) }
  function toggleLifeList(): void { toggle('lifeListOpen') }
  function toggleSettings(): void { toggle('settingsOpen') }
  function toggleCredits(): void { toggle('creditsOpen') }

  function closeOverlay(): void {
    const s = store.get()
    if (s.titleOpen) return
    if (s.card !== null) dismissCard()
    else if (s.guideOpen) closeGuide()
    else if (s.lifeListOpen) store.set({ lifeListOpen: false })
    else if (s.settingsOpen) store.set({ settingsOpen: false })
    else if (s.creditsOpen) store.set({ creditsOpen: false })
  }
```

Return `{ pressIdentify, toggleGuide, toggleLifeList, toggleSettings, toggleCredits, closeOverlay, guess, closeGuide, dismissCard }`.

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/game src/store`
Expected: PASS, including the six existing controller tests.

- [ ] **Step 6: The title card**

`src/ui/Title.tsx`:

```tsx
export interface TitleProps {
  /** a message when the scene cannot render (no WebGL); the Begin button is hidden */
  unsupported: string | null
  onBegin: () => void
  onSettings: () => void
  onCredits: () => void
}

export function Title({ unsupported, onBegin, onSettings, onCredits }: TitleProps) {
  return (
    <div class="title">
      <div class="title-card">
        <h1>Lakewatch</h1>
        <p class="tag">An early-autumn morning on Willow Lake, Willamette Valley.</p>
        {unsupported ? (
          <p class="warn">{unsupported}</p>
        ) : (
          <button class="begin" onClick={onBegin}>Begin</button>
        )}
        <div class="title-links">
          <button onClick={onSettings}>Settings</button>
          <button onClick={onCredits}>Credits</button>
        </div>
        <dl class="keys">
          <dt>Click</dt><dd>look around (Esc releases the mouse)</dd>
          <dt>Scroll · B · T</dt><dd>binoculars and telescope</dd>
          <dt>E</dt><dd>identify the bird in the reticle</dd>
          <dt>G · L</dt><dd>field guide · life list</dd>
          <dt>O · C</dt><dd>settings · credits</dd>
        </dl>
        <p class="fine">Bird photos and recordings are Creative Commons non-commercial; see Credits.</p>
      </div>
    </div>
  )
}
```

Add to `src/ui/ui.css`:

```css
.title { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(8, 14, 20, .55); }
.title-card { width: min(520px, 90vw); padding: 32px 36px; background: #f4efe3; color: #23201a; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,.5); font-family: Georgia, serif; text-align: center; }
.title-card h1 { margin: 0; font-size: 40px; letter-spacing: .04em; }
.title-card .tag { color: #6b6150; margin-top: 4px; }
.title-card .begin { margin: 18px 0 8px; padding: 12px 36px; font: inherit; font-size: 18px; font-weight: bold; background: #4c6b3a; color: #fff; border: 0; border-radius: 8px; cursor: pointer; }
.title-card .begin:hover { background: #5a7e45; }
.title-links { display: flex; gap: 12px; justify-content: center; }
.title-links button { font: inherit; background: none; border: 0; color: #4c6b3a; text-decoration: underline; cursor: pointer; }
.title-card .keys { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; text-align: left; font-size: 13px; color: #6b6150; margin: 18px auto 0; max-width: 380px; }
.title-card .keys dt { font-family: monospace; color: #23201a; }
.title-card .keys dd { margin: 0; }
.title-card .fine { font-size: 11px; color: #8a8070; margin-top: 16px; }
.title-card .warn { color: #b5533c; margin: 16px 0; }
```

- [ ] **Step 7: Render it from App**

In `src/ui/App.tsx` add to `AppDeps`:

```ts
  unsupported: string | null
  onBegin: () => void
  onOpenSettings: () => void
  onOpenCredits: () => void
```

and render it first inside the fragment:

```tsx
      {s.titleOpen && <Title unsupported={d.unsupported} onBegin={d.onBegin} onSettings={d.onOpenSettings} onCredits={d.onOpenCredits} />}
```

with `import { Title } from './Title'`.

- [ ] **Step 8: Boot order in main**

`src/main.tsx` currently builds the world at the top level. Reorder it so everything that does not need WebGL is created first, then the world inside a `try`. The shape after this step (only the changed parts are shown; the rest of the file keeps its current code in the same order):

```tsx
const loc = loadLocation()
const catalog = loadCatalog()
const guide = guideSpecies(catalog, loc.habitat)

let ls: Storage | null = null
try { ls = window.localStorage } catch { ls = null }
const lifeStorage = createLifeListStorage(ls)
let lifeList = lifeStorage.load()

function record(species: string, selfIdentified: boolean, wrongGuesses: number) { /* unchanged */ }

const registry = new BirdRegistry()
const identifyController = createIdentifyController({ /* unchanged */ })

function renderApp(unsupported: string | null) {
  render(
    <App
      /* every existing prop unchanged */
      unsupported={unsupported}
      onBegin={() => game.set({ titleOpen: false })}
      onOpenSettings={() => identifyController.toggleSettings()}
      onOpenCredits={() => identifyController.toggleCredits()}
    />,
    document.getElementById('ui')!,
  )
}

let world: World
try {
  world = new World(document.getElementById('app')!, loc)
} catch (err) {
  console.error(err)
  renderApp('This browser could not start WebGL, so the lake cannot be drawn. The credits still work.')
  throw err
}
// ... heightfield, terrain, camera, look, optics, mask, prompt, water, reeds, trees, snag, spawnCast, all unchanged ...
renderApp(null)

addEventListener('keydown', e => {
  if ((e.key === 'e' || e.key === 'E') && !e.repeat) identifyController.pressIdentify()
  if ((e.key === 'g' || e.key === 'G') && !e.repeat) identifyController.toggleGuide()
  if ((e.key === 'l' || e.key === 'L') && !e.repeat) identifyController.toggleLifeList()
  if ((e.key === 'o' || e.key === 'O') && !e.repeat) identifyController.toggleSettings()
  if ((e.key === 'c' || e.key === 'C') && !e.repeat) identifyController.toggleCredits()
  if (e.key === 'Escape') identifyController.closeOverlay()
})

world.start(dt => { /* unchanged */ })
```

Note the `throw err` after rendering the fallback: nothing after it may run without a renderer, and the error still reaches the console.

- [ ] **Step 9: Visual check**

Run: `npm run dev`. Expected: the title card over a dimmed, frozen lake (the world is paused while `titleOpen`). Keys do nothing. Click Begin: the card goes, the birds move, click the scene to capture the mouse. Press O and C: nothing yet (the flags flip but no overlay renders until Tasks 12 and 13); Esc clears them. To see the fallback, in DevTools run `HTMLCanvasElement.prototype.getContext = () => null` before reload (use a snippet or the Overrides panel): the title explains the WebGL failure and has no Begin button.

- [ ] **Step 10: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: title card, settings/credits flags, and a no-WebGL fallback"
```

---
### Task 3: Synth: rendering ambience loops and UI sounds as samples

**Files:**
- Create: `src/audio/synth.ts`, `src/audio/synth.test.ts`

**Interfaces:**
- Consumes: `makeRng` from `src/catalog/rng.ts`.
- Produces:

```ts
export const SAMPLE_RATE = 44100
export function renderNoise(seconds: number, seed: number, sampleRate?: number): Float32Array          // white noise in [-1, 1)
export function lowpass(samples: Float32Array, cutoffHz: number, sampleRate?: number): Float32Array     // one-pole
export function tone(startHz: number, endHz: number, seconds: number, sampleRate?: number): Float32Array // sine, exponential sweep
export function envelope(n: number, attackSec: number, releaseSec: number, sampleRate?: number): Float32Array  // 0 at both ends
export function mul(a: Float32Array, b: Float32Array): Float32Array
export interface MixPart { samples: Float32Array; gain?: number; at?: number }                          // at: seconds
export function mix(parts: MixPart[], sampleRate?: number): Float32Array
export function normalize(samples: Float32Array, peak?: number): Float32Array
export type EffectKind = 'raise' | 'lower' | 'guide-open' | 'page' | 'correct' | 'wrong' | 'reveal' | 'splash' | 'flap'
export const EFFECT_KINDS: readonly EffectKind[]
export function renderEffect(kind: EffectKind, sampleRate?: number): Float32Array
export function renderFrogLoop(seconds: number, seed: number, sampleRate?: number): Float32Array
```

Everything here is pure arithmetic on `Float32Array`s, so it runs in Vitest's node environment. Task 4 turns these samples into `AudioBuffer`s in the browser.

- [ ] **Step 1: Write the failing tests**

`src/audio/synth.test.ts`:

```ts
import { renderNoise, lowpass, tone, envelope, mix, normalize, renderEffect, renderFrogLoop, EFFECT_KINDS, SAMPLE_RATE } from './synth'

function peak(s: Float32Array): number { let m = 0; for (const v of s) m = Math.max(m, Math.abs(v)); return m }
function rms(s: Float32Array): number { let a = 0; for (const v of s) a += v * v; return Math.sqrt(a / s.length) }

describe('renderNoise', () => {
  it('has the requested length and stays within [-1, 1)', () => {
    const n = renderNoise(0.5, 1)
    expect(n.length).toBe(Math.round(0.5 * SAMPLE_RATE))
    expect(peak(n)).toBeLessThanOrEqual(1)
    expect(rms(n)).toBeGreaterThan(0.4)
  })
  it('is deterministic per seed and differs across seeds', () => {
    expect(renderNoise(0.1, 7)).toEqual(renderNoise(0.1, 7))
    expect(renderNoise(0.1, 7)).not.toEqual(renderNoise(0.1, 8))
  })
})

describe('lowpass', () => {
  it('removes most of the energy of white noise at a low cutoff', () => {
    const n = renderNoise(1, 2)
    expect(rms(lowpass(n, 200))).toBeLessThan(rms(n) * 0.5)
  })
})

describe('tone', () => {
  it('crosses zero twice per cycle at a constant frequency', () => {
    const t = tone(440, 440, 1)
    let crossings = 0
    for (let i = 1; i < t.length; i++) if ((t[i - 1]! < 0) !== (t[i]! < 0)) crossings++
    expect(crossings).toBeGreaterThanOrEqual(877)
    expect(crossings).toBeLessThanOrEqual(883)
  })
})

describe('envelope', () => {
  it('starts at zero, reaches one, and ends at zero', () => {
    const e = envelope(4410, 0.01, 0.05)
    expect(e[0]).toBe(0)
    expect(Math.max(...e)).toBeCloseTo(1, 6)
    expect(e[e.length - 1]).toBe(0)
  })
})

describe('mix and normalize', () => {
  it('places parts at their offsets and scales to the requested peak', () => {
    const a = new Float32Array([1, 1, 1, 1])
    const m = mix([{ samples: a }, { samples: a, at: 2 / SAMPLE_RATE, gain: 0.5 }])
    expect(Array.from(m)).toEqual([1, 1, 1.5, 1.5, 0.5, 0.5])
    expect(peak(normalize(m, 0.8))).toBeCloseTo(0.8, 6)
    expect(peak(normalize(new Float32Array(4), 0.8))).toBe(0)
  })
})

describe('renderEffect', () => {
  for (const kind of EFFECT_KINDS) {
    it(`${kind} is short, click-free, and peaks at 0.8`, () => {
      const s = renderEffect(kind)
      expect(s.length / SAMPLE_RATE).toBeGreaterThan(0.05)
      expect(s.length / SAMPLE_RATE).toBeLessThan(1.5)
      expect(peak(s)).toBeCloseTo(0.8, 5)
      expect(Math.abs(s[0]!)).toBeLessThan(0.05)
      expect(Math.abs(s[s.length - 1]!)).toBeLessThan(0.05)
    })
  }
  it('is deterministic', () => {
    expect(renderEffect('splash')).toEqual(renderEffect('splash'))
  })
})

describe('renderFrogLoop', () => {
  it('fills exactly the requested loop length with sparse chirps', () => {
    const s = renderFrogLoop(8, 3)
    expect(s.length).toBe(8 * SAMPLE_RATE)
    expect(peak(s)).toBeCloseTo(0.5, 5)
    // sparse: most samples are near-silent between bouts
    let quiet = 0
    for (const v of s) if (Math.abs(v) < 0.01) quiet++
    expect(quiet / s.length).toBeGreaterThan(0.5)
  })
  it('is deterministic per seed', () => {
    expect(renderFrogLoop(2, 4)).toEqual(renderFrogLoop(2, 4))
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/audio/synth.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the synth**

`src/audio/synth.ts`:

```ts
import { makeRng } from '../catalog/rng'

export const SAMPLE_RATE = 44100

export function renderNoise(seconds: number, seed: number, sampleRate = SAMPLE_RATE): Float32Array {
  const rng = makeRng(seed)
  const out = new Float32Array(Math.round(seconds * sampleRate))
  for (let i = 0; i < out.length; i++) out[i] = rng() * 2 - 1
  return out
}

/** One-pole low-pass. */
export function lowpass(samples: Float32Array, cutoffHz: number, sampleRate = SAMPLE_RATE): Float32Array {
  const out = new Float32Array(samples.length)
  const a = 1 - Math.exp((-2 * Math.PI * cutoffHz) / sampleRate)
  let y = 0
  for (let i = 0; i < samples.length; i++) {
    y += a * (samples[i]! - y)
    out[i] = y
  }
  return out
}

/** Sine that sweeps exponentially from startHz to endHz. */
export function tone(startHz: number, endHz: number, seconds: number, sampleRate = SAMPLE_RATE): Float32Array {
  const n = Math.round(seconds * sampleRate)
  const out = new Float32Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const hz = startHz * Math.pow(endHz / startHz, i / n)
    phase += (2 * Math.PI * hz) / sampleRate
    out[i] = Math.sin(phase)
  }
  return out
}

/** Linear attack to 1, hold, squared release to 0 over the last `releaseSec`. First and last samples are 0. */
export function envelope(n: number, attackSec: number, releaseSec: number, sampleRate = SAMPLE_RATE): Float32Array {
  const out = new Float32Array(n)
  const a = Math.max(1, Math.round(attackSec * sampleRate))
  const r = Math.max(1, Math.round(releaseSec * sampleRate))
  for (let i = 0; i < n; i++) {
    const att = Math.min(1, i / a)
    const remaining = n - 1 - i
    const rel = remaining < r ? remaining / r : 1
    out[i] = att * rel * rel
  }
  if (n > 0) out[n - 1] = 0
  return out
}

export function mul(a: Float32Array, b: Float32Array): Float32Array {
  const n = Math.min(a.length, b.length)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = a[i]! * b[i]!
  return out
}

export interface MixPart { samples: Float32Array; gain?: number; at?: number }

/** Sums parts at their offsets (seconds). The result is as long as the latest-ending part. */
export function mix(parts: MixPart[], sampleRate = SAMPLE_RATE): Float32Array {
  let n = 0
  for (const p of parts) n = Math.max(n, Math.round((p.at ?? 0) * sampleRate) + p.samples.length)
  const out = new Float32Array(n)
  for (const p of parts) {
    const off = Math.round((p.at ?? 0) * sampleRate)
    const g = p.gain ?? 1
    for (let i = 0; i < p.samples.length; i++) out[off + i] = (out[off + i] ?? 0) + p.samples[i]! * g
  }
  return out
}

export function normalize(samples: Float32Array, peak = 0.8): Float32Array {
  let max = 0
  for (const s of samples) max = Math.max(max, Math.abs(s))
  const out = new Float32Array(samples.length)
  if (max === 0) return out
  const k = peak / max
  for (let i = 0; i < samples.length; i++) out[i] = samples[i]! * k
  return out
}

function shaped(samples: Float32Array, attack: number, release: number, sampleRate: number): Float32Array {
  return mul(samples, envelope(samples.length, attack, release, sampleRate))
}

export type EffectKind = 'raise' | 'lower' | 'guide-open' | 'page' | 'correct' | 'wrong' | 'reveal' | 'splash' | 'flap'
export const EFFECT_KINDS: readonly EffectKind[] = ['raise', 'lower', 'guide-open', 'page', 'correct', 'wrong', 'reveal', 'splash', 'flap']

/**
 * Short UI and world sounds, rendered from noise and sine primitives. Seeds
 * are fixed so a sound is the same on every run.
 */
export function renderEffect(kind: EffectKind, sampleRate = SAMPLE_RATE): Float32Array {
  const sr = sampleRate
  const noise = (sec: number, hz: number, seed: number) => lowpass(renderNoise(sec, seed, sr), hz, sr)
  let out: Float32Array
  switch (kind) {
    case 'raise':     // a soft swoosh rising in pitch: optics coming up to the eyes
      out = mix([
        { samples: shaped(noise(0.25, 1800, 11), 0.05, 0.15, sr), gain: 0.5 },
        { samples: shaped(tone(300, 600, 0.2, sr), 0.02, 0.15, sr), gain: 0.15 },
      ], sr)
      break
    case 'lower':
      out = mix([
        { samples: shaped(noise(0.25, 900, 12), 0.05, 0.15, sr), gain: 0.5 },
        { samples: shaped(tone(600, 300, 0.2, sr), 0.02, 0.15, sr), gain: 0.15 },
      ], sr)
      break
    case 'guide-open':  // paper
      out = shaped(noise(0.3, 2500, 13), 0.02, 0.25, sr)
      break
    case 'page':
      out = shaped(noise(0.12, 3000, 14), 0.01, 0.1, sr)
      break
    case 'correct':     // two rising notes
      out = mix([
        { samples: shaped(tone(660, 660, 0.18, sr), 0.01, 0.15, sr) },
        { samples: shaped(tone(880, 880, 0.35, sr), 0.01, 0.3, sr), at: 0.15 },
      ], sr)
      break
    case 'wrong':       // a dull low thud
      out = mix([
        { samples: shaped(tone(220, 180, 0.35, sr), 0.01, 0.3, sr) },
        { samples: shaped(noise(0.2, 400, 15), 0.01, 0.15, sr), gain: 0.3 },
      ], sr)
      break
    case 'reveal':      // a falling note
      out = shaped(tone(440, 330, 0.5, sr), 0.02, 0.45, sr)
      break
    case 'splash':      // a bright hit with a low body
      out = mix([
        { samples: shaped(noise(0.6, 1500, 16), 0.005, 0.5, sr) },
        { samples: shaped(noise(0.6, 400, 17), 0.02, 0.55, sr), gain: 0.8 },
      ], sr)
      break
    case 'flap':        // four quick beats
      out = mix([0, 0.13, 0.26, 0.39].map((at, i) => ({ samples: shaped(noise(0.08, 1200, 20 + i), 0.01, 0.06, sr), at })), sr)
      break
    default:
      throw new Error(`unknown effect ${String(kind)}`)
  }
  return normalize(out, 0.8)
}

/**
 * A Pacific tree frog chorus at a distance: bouts of two to five pulsed
 * two-part chirps, spaced at random, sized to loop at exactly `seconds`.
 */
export function renderFrogLoop(seconds: number, seed: number, sampleRate = SAMPLE_RATE): Float32Array {
  const sr = sampleRate
  const rng = makeRng(seed)
  const sweep = tone(2200, 2600, 0.09, sr)
  const pulsed = new Float32Array(sweep.length)
  for (let i = 0; i < sweep.length; i++) pulsed[i] = sweep[i]! * (Math.sin((2 * Math.PI * 40 * i) / sr) > 0 ? 1 : 0.15)
  const chirp = mix([
    { samples: shaped(pulsed, 0.005, 0.07, sr) },
    { samples: shaped(tone(2900, 2900, 0.05, sr), 0.005, 0.04, sr), at: 0.1, gain: 0.7 },
  ], sr)
  const chirpSec = chirp.length / sr
  const parts: MixPart[] = []
  let t = rng() * 2
  while (t < seconds) {
    const n = 2 + Math.floor(rng() * 4)
    for (let k = 0; k < n; k++) {
      const at = t + k * 0.35
      if (at + chirpSec < seconds) parts.push({ samples: chirp, at, gain: 0.6 + rng() * 0.4 })
    }
    t += 1.5 + rng() * 2.5
  }
  const out = new Float32Array(Math.round(seconds * sr))
  if (parts.length > 0) {
    const body = mix(parts, sr)
    out.set(body.subarray(0, out.length))
  }
  return normalize(out, 0.5)
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/audio/synth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio/synth.ts src/audio/synth.test.ts
git commit -m "feat: sample synthesizer for ambience loops and UI sounds"
```

---

### Task 4: Audio engine and the clip picker

**Files:**
- Create: `src/audio/engine.ts`, `src/audio/clips.ts`, `src/audio/clips.test.ts`
- Modify: `src/main.tsx`, `src/hud/devOverlay.ts`

**Interfaces:**
- Consumes: `THREE.AudioListener`, `THREE.PositionalAudio`, `THREE.Audio`, `THREE.AudioLoader`; `AudioClip`, `Rng` from the catalog.
- Produces:

```ts
// engine.ts
export type AudioLayer = 'ambience' | 'calls' | 'effects'
export interface Voice { readonly playing: boolean; stop(): void; setVolume(v: number): void; follow(p: THREE.Vector3): void }
export interface PlayOptions { volume?: number; loop?: boolean }
export interface PlayAtOptions extends PlayOptions { refDistance?: number; maxDistance?: number; rolloff?: number }
export class AudioEngine {
  readonly listener: THREE.AudioListener
  constructor(scene: THREE.Scene, camera: THREE.Object3D)
  get context(): AudioContext
  get unlocked(): boolean
  unlock(): Promise<boolean>
  setMasterVolume(v: number): void
  setLayerVolume(layer: AudioLayer, v: number): void
  layerVolume(layer: AudioLayer): number
  load(url: string): Promise<AudioBuffer>
  bufferFrom(samples: Float32Array, sampleRate: number): AudioBuffer
  play(buffer: AudioBuffer, layer: AudioLayer, o?: PlayOptions): Voice
  playAt(buffer: AudioBuffer, position: THREE.Vector3, layer: AudioLayer, o?: PlayAtOptions): Voice
  count(layer: AudioLayer): number
}
// clips.ts
export type ClipPreference = 'call' | 'song' | 'any'
export function pickClip(bird: { audio: readonly AudioClip[] }, prefer: ClipPreference, rng: Rng): AudioClip | null
```

The engine needs a real `AudioContext`, so it has no unit test; it is kept thin and every decision that can be pure lives next door (`clips.ts` here, the scheduler in Task 6, the effects table in Task 7).

- [ ] **Step 1: Write the failing clip-picker test**

`src/audio/clips.test.ts`:

```ts
import { pickClip } from './clips'
import { findBird } from '../catalog'
import { makeRng } from '../catalog/rng'

describe('pickClip', () => {
  it('prefers the requested type when the species has one', () => {
    const coot = findBird('y00475')
    for (let seed = 0; seed < 10; seed++) expect(pickClip(coot, 'call', makeRng(seed))?.type).toBe('call')
  })
  it('falls back to any clip when the preferred type is missing', () => {
    // Canada Goose has calls only
    const goose = findBird('cangoo')
    expect(goose.audio.every(c => c.type === 'call')).toBe(true)
    expect(pickClip(goose, 'song', makeRng(1))).not.toBeNull()
  })
  it('returns null for a species with no audio', () => {
    expect(pickClip({ audio: [] }, 'any', makeRng(1))).toBeNull()
  })
  it('is deterministic per seed', () => {
    const b = findBird('mallar3')
    expect(pickClip(b, 'any', makeRng(3))).toEqual(pickClip(b, 'any', makeRng(3)))
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/audio/clips.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the clip picker**

`src/audio/clips.ts`:

```ts
import type { AudioClip, Rng } from '../catalog/types'

export type ClipPreference = 'call' | 'song' | 'any'

/** A clip of the preferred type when the species has one, else any clip, else null. */
export function pickClip(bird: { audio: readonly AudioClip[] }, prefer: ClipPreference, rng: Rng): AudioClip | null {
  if (bird.audio.length === 0) return null
  const preferred = prefer === 'any' ? [] : bird.audio.filter(c => c.type === prefer)
  const pool = preferred.length > 0 ? preferred : bird.audio
  return pool[Math.floor(rng() * pool.length)] ?? null
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/audio/clips.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement the engine**

`src/audio/engine.ts`:

```ts
import * as THREE from 'three'

export type AudioLayer = 'ambience' | 'calls' | 'effects'

export interface Voice {
  readonly playing: boolean
  stop(): void
  setVolume(v: number): void
  /** move a positional voice; a no-op for 2D voices */
  follow(p: THREE.Vector3): void
}

export interface PlayOptions { volume?: number; loop?: boolean }
export interface PlayAtOptions extends PlayOptions { refDistance?: number; maxDistance?: number; rolloff?: number }

class VoiceImpl implements Voice {
  constructor(
    readonly node: THREE.Audio | THREE.PositionalAudio,
    readonly layer: AudioLayer,
    private base: number,
    private layerGain: () => number,
    private onEnd: (v: VoiceImpl) => void,
  ) {
    this.refresh()
    // Audio.play() binds this.onEnded at play time, so an instance property set beforehand wins over the prototype's
    node.onEnded = () => { node.isPlaying = false; onEnd(this) }
  }
  get playing(): boolean { return this.node.isPlaying }
  refresh(): void { this.node.setVolume(this.base * this.layerGain()) }
  setVolume(v: number): void { this.base = v; this.refresh() }
  stop(): void {
    if (this.node.isPlaying) this.node.stop()     // stop() nulls source.onended, so onEnd runs exactly once
    this.onEnd(this)
  }
  follow(p: THREE.Vector3): void { this.node.position.copy(p) }
}

/**
 * Three.js audio with the listener on the camera. Layers (ambience, calls,
 * effects) each have a volume that multiplies every voice in the layer, so
 * settings can move one slider without touching the voices. Everything that
 * decides WHAT to play is pure and lives elsewhere; this only plays.
 */
export class AudioEngine {
  readonly listener = new THREE.AudioListener()
  private layers: Record<AudioLayer, number> = { ambience: 1, calls: 1, effects: 1 }
  private buffers = new Map<string, Promise<AudioBuffer>>()
  private voices = new Set<VoiceImpl>()
  private loader = new THREE.AudioLoader()

  constructor(private scene: THREE.Scene, camera: THREE.Object3D) {
    camera.add(this.listener)
  }

  get context(): AudioContext { return this.listener.context }
  get unlocked(): boolean { return this.context.state === 'running' }

  /** Resume the context from a user gesture. A rejection (no gesture, autoplay policy) leaves the game silent, not broken. */
  async unlock(): Promise<boolean> {
    try {
      if (this.context.state !== 'running') await this.context.resume()
    } catch { /* stays locked */ }
    return this.unlocked
  }

  setMasterVolume(v: number): void { this.listener.setMasterVolume(v) }
  setLayerVolume(layer: AudioLayer, v: number): void {
    this.layers[layer] = v
    for (const voice of this.voices) if (voice.layer === layer) voice.refresh()
  }
  layerVolume(layer: AudioLayer): number { return this.layers[layer] }

  /** Decoded and cached per URL. A failed load is forgotten so a retry can succeed. */
  load(url: string): Promise<AudioBuffer> {
    let p = this.buffers.get(url)
    if (!p) {
      p = this.loader.loadAsync(url)
      this.buffers.set(url, p)
      p.catch(() => this.buffers.delete(url))
    }
    return p
  }

  bufferFrom(samples: Float32Array, sampleRate: number): AudioBuffer {
    const b = this.context.createBuffer(1, samples.length, sampleRate)
    b.copyToChannel(samples, 0)
    return b
  }

  play(buffer: AudioBuffer, layer: AudioLayer, o: PlayOptions = {}): Voice {
    return this.start(new THREE.Audio(this.listener), layer, buffer, o)
  }

  playAt(buffer: AudioBuffer, position: THREE.Vector3, layer: AudioLayer, o: PlayAtOptions = {}): Voice {
    const node = new THREE.PositionalAudio(this.listener)
    node.setRefDistance(o.refDistance ?? 8)
    node.setMaxDistance(o.maxDistance ?? 500)
    node.setRolloffFactor(o.rolloff ?? 1)
    node.position.copy(position)
    this.scene.add(node)         // the renderer's scene.updateMatrixWorld() feeds the panner each frame
    return this.start(node, layer, buffer, o)
  }

  /** Voices currently sounding in a layer. */
  count(layer: AudioLayer): number {
    let n = 0
    for (const v of this.voices) if (v.layer === layer && v.playing) n++
    return n
  }

  private start(node: THREE.Audio | THREE.PositionalAudio, layer: AudioLayer, buffer: AudioBuffer, o: PlayOptions): Voice {
    node.setBuffer(buffer)
    node.setLoop(o.loop ?? false)
    const voice = new VoiceImpl(node, layer, o.volume ?? 1, () => this.layers[layer], v => this.release(v))
    this.voices.add(voice)
    node.play()
    return voice
  }

  private release(v: VoiceImpl): void {
    this.voices.delete(v)
    v.node.parent?.remove(v.node)
    v.node.disconnect()
  }
}
```

- [ ] **Step 6: Wire into main and the dev overlay**

In `src/hud/devOverlay.ts` add `audio: string` to `DevStats` and to the printed lines:

```ts
export interface DevStats { fps: number; birds: number; gust: number; mode: string; audio: string }
// ...
if (visible) el.textContent = `fps ${fps.toFixed(0)}\nbirds ${stats.birds}\ngust ${stats.gust.toFixed(2)}\nmode ${stats.mode}\naudio ${stats.audio}`
```

In `src/main.tsx`:

```ts
import { AudioEngine } from './audio/engine'
// before renderApp is defined:
let audio: AudioEngine | null = null
// in renderApp's <App>:
onBegin={() => { void audio?.unlock(); game.set({ titleOpen: false }) }}
// right after the world is created (inside the success path):
audio = new AudioEngine(world.scene, world.camera)
// in the frame callback:
dev.update(dt, { birds: registry.size, gust: world.wind.state.gust, mode: optics.mode, audio: audio.unlocked ? 'running' : 'locked' })
```

Since `audio` is assigned inside the `try`'s success path, TypeScript will complain it may be null at the frame callback; narrow with a local `const engine = audio` right after construction and use `engine` from then on.

- [ ] **Step 7: Check by ear**

Run: `npm run dev`. Press backtick before clicking Begin: `audio locked`. Click Begin: `audio running`. In the console, nothing is logged. (There is nothing to hear until Task 5.)

- [ ] **Step 8: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: audio engine over Three.js positional audio, clip picker, title unlocks the context"
```

---

### Task 5: Ambience manifest and mixer

**Files:**
- Create: `data/ambience.json`, `src/audio/ambienceManifest.ts`, `src/audio/ambienceManifest.test.ts`, `src/audio/ambience.ts`, `src/audio/ambience.test.ts`
- Modify: `src/location/validate.ts`, `src/location/validate.test.ts`, `src/location/index.ts`, `src/main.tsx`

**Interfaces:**
- Consumes: `AudioEngine`, `renderNoise`, `renderFrogLoop`, `SAMPLE_RATE`, `valueNoise1`, `Wind`, `WorldModule`.
- Produces:

```ts
// ambienceManifest.ts
export type AmbienceLayer = { id: string; source: { kind: 'synth'; recipe: 'wind' | 'lapping' | 'frogs' } | { kind: 'file'; file: string; license: string; sourceUrl: string }; gain: number; followsWind: boolean; attribution: string }
export function parseAmbience(data: unknown): AmbienceLayer[]
export function loadAmbience(): AmbienceLayer[]
// validate.ts
export function validateAmbience(loc: Pick<Location, 'ambience'>, layers: readonly { id: string }[]): string[]
// ambience.ts
export function windLayerGain(strength: number, gust: number): number     // 0.25..1
export function windFilterHz(gust: number): number                        // 500..1400
export function lappingGain(t: number, seed: number): number              // 0.4..1
export function createAmbience(engine: AudioEngine, layers: readonly AmbienceLayer[], ids: readonly string[]): WorldModule & { dispose(): void }
```

- [ ] **Step 1: Write the failing tests**

`src/audio/ambienceManifest.test.ts`:

```ts
import { parseAmbience, loadAmbience } from './ambienceManifest'

const synth = { id: 'wind-reeds', source: { kind: 'synth', recipe: 'wind' }, gain: 0.5, followsWind: true, attribution: 'Synthesized in-game' }

describe('parseAmbience', () => {
  it('accepts synth and file layers, defaulting followsWind to false', () => {
    const file = { id: 'loons', source: { kind: 'file', file: 'media/ambience/loons.mp3', license: 'CC BY-NC 4.0', sourceUrl: 'https://example.org/loons' }, gain: 0.3, attribution: 'Someone, CC BY-NC 4.0' }
    const layers = parseAmbience({ layers: [synth, file] })
    expect(layers[1]!.followsWind).toBe(false)
    expect(layers[0]!.followsWind).toBe(true)
  })
  it('rejects an unknown recipe, a missing attribution, and a gain above 1', () => {
    expect(() => parseAmbience({ layers: [{ ...synth, source: { kind: 'synth', recipe: 'thunder' } }] })).toThrow()
    expect(() => parseAmbience({ layers: [{ ...synth, attribution: '' }] })).toThrow()
    expect(() => parseAmbience({ layers: [{ ...synth, gain: 1.5 }] })).toThrow()
  })
  it('rejects duplicate ids', () => {
    expect(() => parseAmbience({ layers: [synth, synth] })).toThrow(/duplicate layer id wind-reeds/)
  })
  it('the committed manifest parses', () => {
    expect(loadAmbience().map(l => l.id)).toEqual(['water-lapping', 'wind-reeds', 'distant-frogs'])
  })
})
```

`src/audio/ambience.test.ts`:

```ts
import { windLayerGain, windFilterHz, lappingGain } from './ambience'

describe('windLayerGain', () => {
  it('never falls silent and rises with the gust', () => {
    expect(windLayerGain(0, 0)).toBeCloseTo(0.25, 6)
    expect(windLayerGain(1, 1)).toBeCloseTo(1, 6)
    expect(windLayerGain(0.35, 0.9)).toBeGreaterThan(windLayerGain(0.35, 0.1))
  })
})

describe('windFilterHz', () => {
  it('sweeps between 500 and 1400 Hz and clamps outside 0..1', () => {
    expect(windFilterHz(0)).toBe(500)
    expect(windFilterHz(1)).toBe(1400)
    expect(windFilterHz(3)).toBe(1400)
  })
})

describe('lappingGain', () => {
  it('stays within 0.4..1 and is deterministic per seed', () => {
    for (let t = 0; t < 100; t += 0.7) {
      const g = lappingGain(t, 5)
      expect(g).toBeGreaterThanOrEqual(0.4)
      expect(g).toBeLessThanOrEqual(1)
    }
    expect(lappingGain(12.5, 5)).toBe(lappingGain(12.5, 5))
    expect(lappingGain(12.5, 5)).not.toBe(lappingGain(12.5, 6))
  })
})
```

Append to `src/location/validate.test.ts`:

```ts
import { validateAmbience } from './validate'
import { parseLocation } from './schema'
import { loadAmbience } from '../audio/ambienceManifest'
import lakeRaw from '../../data/locations/lake.json'

describe('validateAmbience', () => {
  const layers = [{ id: 'wind-reeds' }, { id: 'water-lapping' }]
  it('passes when every id is in the manifest', () => {
    expect(validateAmbience({ ambience: ['wind-reeds'] }, layers)).toEqual([])
  })
  it('names an id the manifest does not define', () => {
    expect(validateAmbience({ ambience: ['wind-reeds', 'thunder'] }, layers)).toEqual(['ambience[1]: layer thunder is not in data/ambience.json'])
  })
  it('rejects a layer listed twice', () => {
    expect(validateAmbience({ ambience: ['wind-reeds', 'wind-reeds'] }, layers)).toEqual(['ambience[1]: layer wind-reeds is listed twice'])
  })
  it('the lake only names layers the committed manifest defines', () => {
    expect(validateAmbience(parseLocation(lakeRaw), loadAmbience())).toEqual([])
  })
})
```

(If `validate.test.ts` already imports any of these names, merge the imports rather than duplicating them.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/audio src/location/validate.test.ts`
Expected: FAIL (modules not found; `validateAmbience` not exported).

- [ ] **Step 3: The manifest**

`data/ambience.json`:

```json
{
  "layers": [
    { "id": "water-lapping", "source": { "kind": "synth", "recipe": "lapping" }, "gain": 0.35, "attribution": "Synthesized in-game: low-passed noise swelling with seeded value noise" },
    { "id": "wind-reeds",    "source": { "kind": "synth", "recipe": "wind" },    "gain": 0.5, "followsWind": true, "attribution": "Synthesized in-game: band-passed noise following the wind gust curve" },
    { "id": "distant-frogs", "source": { "kind": "synth", "recipe": "frogs" },   "gain": 0.18, "attribution": "Synthesized in-game: pulsed two-part chirps in random bouts" }
  ]
}
```

`src/audio/ambienceManifest.ts`:

```ts
import { z } from 'zod'
import raw from '../../data/ambience.json'

const synthSource = z.object({ kind: z.literal('synth'), recipe: z.enum(['wind', 'lapping', 'frogs']) })
const fileSource = z.object({ kind: z.literal('file'), file: z.string().min(1), license: z.string().min(1), sourceUrl: z.string().url() })

export const ambienceLayerSchema = z.object({
  id: z.string().min(1),
  source: z.discriminatedUnion('kind', [synthSource, fileSource]),
  gain: z.number().min(0).max(1),
  /** gain follows the wind gust curve (wind-in-reeds) */
  followsWind: z.boolean().default(false),
  attribution: z.string().min(1),
})
export const ambienceManifestSchema = z.object({ layers: z.array(ambienceLayerSchema) })

export type AmbienceLayer = z.infer<typeof ambienceLayerSchema>

export function parseAmbience(data: unknown): AmbienceLayer[] {
  const m = ambienceManifestSchema.parse(data)
  const ids = new Set<string>()
  for (const l of m.layers) {
    if (ids.has(l.id)) throw new Error(`ambience: duplicate layer id ${l.id}`)
    ids.add(l.id)
  }
  return m.layers
}

let cache: AmbienceLayer[] | null = null
export function loadAmbience(): AmbienceLayer[] {
  if (!cache) cache = parseAmbience(raw)
  return cache
}
```

- [ ] **Step 4: Validate the location against it**

Append to `src/location/validate.ts`:

```ts
/** Every ambience id the location names must be a layer in the manifest, once. */
export function validateAmbience(loc: Pick<Location, 'ambience'>, layers: readonly { id: string }[]): string[] {
  const known = new Set(layers.map(l => l.id))
  const errors: string[] = []
  const seen = new Set<string>()
  loc.ambience.forEach((id, i) => {
    if (!known.has(id)) errors.push(`ambience[${i}]: layer ${id} is not in data/ambience.json`)
    if (seen.has(id)) errors.push(`ambience[${i}]: layer ${id} is listed twice`)
    seen.add(id)
  })
  return errors
}
```

In `src/location/index.ts`:

```ts
import { validateCast, validateAmbience } from './validate'
import { loadAmbience } from '../audio/ambienceManifest'

export function loadLocation(): Location {
  const loc = parseLocation(raw)
  const errors = [...validateCast(loc, loadCatalog()), ...validateAmbience(loc, loadAmbience())]
  if (errors.length > 0) throw new Error(`Invalid location ${loc.id}:\n  ${errors.join('\n  ')}`)
  return loc
}
```

and export `validateAmbience` alongside `validateCast`.

- [ ] **Step 5: The mixer**

`src/audio/ambience.ts`:

```ts
import { valueNoise1 } from '../world/noise'
import type { WorldModule } from '../world/scene'
import type { AudioEngine } from './engine'
import type { AmbienceLayer } from './ambienceManifest'
import { renderNoise, renderFrogLoop, SAMPLE_RATE } from './synth'

/** Wind-in-reeds level: a floor so the bed never goes dead silent, rising with the gust. */
export function windLayerGain(strength: number, gust: number): number {
  const w = Math.min(1, Math.max(0, strength * (0.5 + 0.5 * gust)))
  return 0.25 + 0.75 * w
}

/** Band-pass centre for the wind noise: gusts hiss higher. */
export function windFilterHz(gust: number): number {
  return 500 + 900 * Math.min(1, Math.max(0, gust))
}

/** Slow swell of water against the bank, 0.4..1, seeded noise so it never repeats. */
export function lappingGain(t: number, seed: number): number {
  return 0.4 + 0.6 * valueNoise1(t * 0.35, seed)
}

type Recipe = 'wind' | 'lapping' | 'frogs' | 'file'

interface Layer {
  recipe: Recipe
  base: number
  followsWind: boolean
  gain: GainNode
  filter: BiquadFilterNode | null
  buffer: AudioBuffer | null
  file: string | null
  source: AudioBufferSourceNode | null
}

/**
 * Looping ambience layers mixed straight into the listener. Sources start
 * on the first update after the context is unlocked, so nothing is scheduled
 * against a suspended context.
 */
export function createAmbience(engine: AudioEngine, layers: readonly AmbienceLayer[], ids: readonly string[]): WorldModule & { dispose(): void } {
  const ctx = engine.context
  const out = engine.listener.getInput()
  const built: Layer[] = []
  let started = false
  let disposed = false
  let time = 0

  for (const id of ids) {
    const layer = layers.find(l => l.id === id)
    if (!layer) throw new Error(`ambience layer ${id} is not in the manifest`)
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(out)
    let filter: BiquadFilterNode | null = null
    let buffer: AudioBuffer | null = null
    let file: string | null = null
    let recipe: Recipe
    if (layer.source.kind === 'synth') {
      recipe = layer.source.recipe
      filter = ctx.createBiquadFilter()
      if (recipe === 'wind') {
        buffer = engine.bufferFrom(renderNoise(4, 1), SAMPLE_RATE)
        filter.type = 'bandpass'; filter.Q.value = 0.7; filter.frequency.value = windFilterHz(0)
      } else if (recipe === 'lapping') {
        buffer = engine.bufferFrom(renderNoise(6, 2), SAMPLE_RATE)
        filter.type = 'lowpass'; filter.frequency.value = 350
      } else {
        buffer = engine.bufferFrom(renderFrogLoop(24, 3), SAMPLE_RATE)
        filter.type = 'lowpass'; filter.frequency.value = 1800      // distance
      }
      filter.connect(gain)
    } else {
      recipe = 'file'
      file = layer.source.file
    }
    built.push({ recipe, base: layer.gain, followsWind: layer.followsWind, gain, filter, buffer, file, source: null })
  }

  function startLayer(l: Layer, buffer: AudioBuffer): void {
    if (disposed) return
    const s = ctx.createBufferSource()
    s.buffer = buffer
    s.loop = true
    s.connect(l.filter ?? l.gain)
    s.start()
    l.source = s
  }

  function startAll(): void {
    for (const l of built) {
      if (l.buffer) startLayer(l, l.buffer)
      else if (l.file) void engine.load('/' + l.file).then(b => startLayer(l, b)).catch(err => console.warn(`ambience ${l.file}: ${String(err)}`))
    }
  }

  return {
    update(dt, wind) {
      time += dt
      if (!started && engine.unlocked) { started = true; startAll() }
      const vol = engine.layerVolume('ambience')
      const now = ctx.currentTime
      for (const l of built) {
        let g = l.base * vol
        if (l.recipe === 'wind' || l.followsWind) g *= windLayerGain(wind.state.strength, wind.state.gust)
        if (l.recipe === 'lapping') g *= lappingGain(time, 5) * (0.6 + 0.4 * wind.effective())
        l.gain.gain.setTargetAtTime(g, now, 0.1)
        if (l.recipe === 'wind' && l.filter) l.filter.frequency.setTargetAtTime(windFilterHz(wind.state.gust), now, 0.2)
      }
    },
    dispose() {
      disposed = true
      for (const l of built) { l.source?.stop(); l.gain.disconnect() }
    },
  }
}
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/audio src/location`
Expected: PASS.

- [ ] **Step 7: Wire into main**

In `src/main.tsx`, after the engine is created:

```ts
import { createAmbience } from './audio/ambience'
import { loadAmbience } from './audio/ambienceManifest'
// ...
world.add(createAmbience(engine, loadAmbience(), loc.ambience))
```

- [ ] **Step 8: Check by ear**

Run: `npm run dev`, click Begin. Expected: a low wash of water against the bank that swells and eases; a hiss of wind in the reeds that rises and brightens on gusts (watch `gust` in the dev overlay climb with it); every few seconds a faint, muffled frog chorus. Turning does not change the ambience (it is not positional). If a layer is too loud or too quiet, adjust `gain` in `data/ambience.json`, not the code.

- [ ] **Step 9: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: ambience manifest, validation, and a wind-following synth mixer"
```

---
### Task 6: Call scheduler and the positional call player

**Files:**
- Create: `src/audio/calls.ts`, `src/audio/calls.test.ts`, `src/audio/callPlayer.ts`, `src/audio/callPlayer.test.ts`
- Modify: `src/main.tsx`, `src/hud/devOverlay.ts`

**Interfaces:**
- Consumes: `Rng`, `BirdRegistry` (`all`, `get`), `Bird.audio`, `pickClip`, `Voice`, `PlayAtOptions`.
- Produces:

```ts
// calls.ts
export interface CallSchedule { every: [number, number]; prefer: 'call' | 'song' | 'any' }
export const DEFAULT_SCHEDULE: CallSchedule
export const CALL_SCHEDULES: Record<string, CallSchedule>
export const MAX_SIMULTANEOUS_CALLS = 3
export interface CallCandidate { id: number; species: string; distance: number }
export interface CallRequest { id: number; species: string; prefer: CallSchedule['prefer'] }
export interface CallScheduler { tick(now: number, birds: readonly CallCandidate[], active: number): CallRequest[] }
export function createCallScheduler(rng: Rng, opts?: { max?: number; schedules?: Record<string, CallSchedule> }): CallScheduler
// callPlayer.ts
export interface CallEngine { readonly unlocked: boolean; load(url: string): Promise<AudioBuffer>; playAt(buffer: AudioBuffer, position: THREE.Vector3, layer: 'calls', o?: PlayAtOptions): Voice }
export interface CallBird { id: number; species: string; behavior: string; model: { group: THREE.Object3D; center: THREE.Vector3 } }   // BirdRegistry entries satisfy this
export interface CallRegistry { all(): readonly CallBird[]; get(id: number): CallBird | undefined }
export interface CallPlayerDeps { engine: CallEngine; registry: CallRegistry; birdOf: (code: string) => Pick<Bird, 'audio'>; listenerPosition: () => THREE.Vector3; rng: Rng; scheduler?: CallScheduler }
export interface CallPlayer { update(dt: number): void; readonly active: number }
export function createCallPlayer(deps: CallPlayerDeps): CallPlayer
```

The scheduler is the spec's "each species has a call schedule (interval range, call versus song preference)... a cap on simultaneous calls, nearer birds win." It is pure and seeded. The player binds it to the registry and the engine, follows moving birds, and does nothing while the context is locked (Review Focus 1).

- [ ] **Step 1: Write the failing scheduler tests**

`src/audio/calls.test.ts`:

```ts
import { createCallScheduler, CALL_SCHEDULES, MAX_SIMULTANEOUS_CALLS } from './calls'
import { makeRng } from '../catalog/rng'

const bird = (id: number, species: string, distance: number) => ({ id, species, distance })

describe('createCallScheduler', () => {
  it('respects a species\' minimum interval', () => {
    const s = createCallScheduler(makeRng(1))
    const heron = [bird(1, 'grbher3', 60)]
    const times: number[] = []
    for (let now = 0; now < 1200; now += 1) if (s.tick(now, heron, 0).length) times.push(now)
    expect(times.length).toBeGreaterThan(2)
    for (let i = 1; i < times.length; i++) expect(times[i]! - times[i - 1]!).toBeGreaterThanOrEqual(CALL_SCHEDULES['grbher3']!.every[0])
  })

  it('caps simultaneous calls and lets the nearest birds win', () => {
    const s = createCallScheduler(makeRng(2))
    const coots = [bird(1, 'y00475', 40), bird(2, 'y00475', 5), bird(3, 'y00475', 12), bird(4, 'y00475', 80), bird(5, 'y00475', 9)]
    s.tick(0, coots, 0)                    // first tick only staggers the schedule
    const out = s.tick(1e6, coots, 1)      // everything is overdue; one slot is taken
    expect(out).toHaveLength(MAX_SIMULTANEOUS_CALLS - 1)
    expect(out.map(r => r.id)).toEqual([2, 5])
  })

  it('a bird crowded out retries within a few seconds, not a full interval', () => {
    const s = createCallScheduler(makeRng(3), { max: 1 })
    const pair = [bird(1, 'y00475', 5), bird(2, 'y00475', 20)]
    s.tick(0, pair, 0)
    expect(s.tick(1e6, pair, 0).map(r => r.id)).toEqual([1])
    const retry: number[] = []
    for (let t = 1; t <= 8; t++) retry.push(...s.tick(1e6 + t, pair, 0).map(r => r.id))
    expect(retry).toContain(2)
  })

  it('carries the species preference and defaults unknown species', () => {
    const s = createCallScheduler(makeRng(4))
    const birds = [bird(1, 'rewbla', 5), bird(2, 'zzz', 6)]
    s.tick(0, birds, 0)
    const out = s.tick(1e6, birds, 0)
    expect(out.find(r => r.id === 1)?.prefer).toBe('song')
    expect(out.find(r => r.id === 2)?.prefer).toBe('any')
  })

  it('is deterministic per seed', () => {
    const run = (seed: number) => {
      const s = createCallScheduler(makeRng(seed))
      const birds = [bird(1, 'killde', 10), bird(2, 'mallar3', 20)]
      const log: string[] = []
      for (let now = 0; now < 300; now += 0.5) for (const r of s.tick(now, birds, 0)) log.push(`${now}:${r.id}`)
      return log
    }
    expect(run(9)).toEqual(run(9))
    expect(run(9)).not.toEqual(run(10))
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/audio/calls.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the scheduler**

`src/audio/calls.ts`:

```ts
import type { Rng } from '../catalog/types'

export interface CallSchedule {
  /** seconds between one bird's calls, [min, max] */
  every: [number, number]
  prefer: 'call' | 'song' | 'any'
}

export const DEFAULT_SCHEDULE: CallSchedule = { every: [30, 90], prefer: 'any' }

/** Per-species cadence. Herons and egrets are nearly silent; wrens and blackbirds never stop. */
export const CALL_SCHEDULES: Record<string, CallSchedule> = {
  y00475:  { every: [15, 50], prefer: 'call' },
  mallar3: { every: [20, 70], prefer: 'call' },
  gadwal:  { every: [40, 120], prefer: 'call' },
  amewig:  { every: [20, 60], prefer: 'call' },
  norsho:  { every: [60, 180], prefer: 'call' },
  pibgre:  { every: [45, 150], prefer: 'song' },
  grbher3: { every: [120, 300], prefer: 'call' },
  greegr:  { every: [120, 300], prefer: 'call' },
  killde:  { every: [12, 40], prefer: 'call' },
  rewbla:  { every: [8, 25], prefer: 'song' },
  marwre:  { every: [10, 30], prefer: 'song' },
  belkin1: { every: [40, 120], prefer: 'call' },
  cangoo:  { every: [15, 45], prefer: 'call' },
  leasan:  { every: [20, 60], prefer: 'call' },
  greyel:  { every: [30, 90], prefer: 'call' },
  amwpel:  { every: [200, 600], prefer: 'call' },
}

export const MAX_SIMULTANEOUS_CALLS = 3

export interface CallCandidate { id: number; species: string; distance: number }
export interface CallRequest { id: number; species: string; prefer: CallSchedule['prefer'] }

export interface CallScheduler {
  /** Birds due to call now, nearest first, at most (max - active) of them. */
  tick(now: number, birds: readonly CallCandidate[], active: number): CallRequest[]
}

export function createCallScheduler(rng: Rng, opts: { max?: number; schedules?: Record<string, CallSchedule> } = {}): CallScheduler {
  const max = opts.max ?? MAX_SIMULTANEOUS_CALLS
  const schedules = opts.schedules ?? CALL_SCHEDULES
  const nextAt = new Map<number, number>()
  const scheduleFor = (species: string) => schedules[species] ?? DEFAULT_SCHEDULE
  const between = ([lo, hi]: [number, number]) => lo + rng() * (hi - lo)

  return {
    tick(now, birds, active) {
      const due: CallCandidate[] = []
      const present = new Set<number>()
      for (const b of birds) {
        present.add(b.id)
        let t = nextAt.get(b.id)
        if (t === undefined) {
          t = now + between(scheduleFor(b.species).every) * rng()     // stagger first calls
          nextAt.set(b.id, t)
        }
        if (t <= now) due.push(b)
      }
      for (const id of [...nextAt.keys()]) if (!present.has(id)) nextAt.delete(id)   // birds that left (flocks)
      due.sort((a, b) => a.distance - b.distance)
      const slots = Math.max(0, max - active)
      const out: CallRequest[] = []
      due.forEach((b, i) => {
        if (i < slots) {
          out.push({ id: b.id, species: b.species, prefer: scheduleFor(b.species).prefer })
          nextAt.set(b.id, now + between(scheduleFor(b.species).every))
        } else {
          nextAt.set(b.id, now + 2 + rng() * 4)      // crowded out: try again soon
        }
      })
      return out
    },
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/audio/calls.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing call-player tests**

`src/audio/callPlayer.test.ts`:

```ts
import * as THREE from 'three'
import { createCallPlayer, type CallEngine, type CallBird } from './callPlayer'
import type { CallScheduler, CallRequest } from './calls'
import type { Voice } from './engine'
import { makeRng } from '../catalog/rng'

function fakeEngine(unlocked: boolean) {
  const voices: { voice: Voice & { follow: ReturnType<typeof vi.fn> }; position: THREE.Vector3 }[] = []
  const engine: CallEngine & { loads: string[]; voices: typeof voices } = {
    unlocked,
    loads: [],
    voices,
    load: vi.fn(async (url: string) => { engine.loads.push(url); return {} as AudioBuffer }),
    playAt: vi.fn((_b: AudioBuffer, position: THREE.Vector3) => {
      const voice = { playing: true, stop() { voice.playing = false }, setVolume() {}, follow: vi.fn() }
      voices.push({ voice, position: position.clone() })
      return voice
    }),
  }
  return engine
}

function fakeRegistry(birds: { id: number; species: string; at: [number, number, number]; behavior?: string }[]) {
  const map = new Map<number, CallBird>(birds.map(b => {
    const group = new THREE.Group()
    group.position.set(...b.at)
    group.updateMatrixWorld()
    return [b.id, { id: b.id, species: b.species, behavior: b.behavior ?? 'swim', model: { group, center: new THREE.Vector3() } }]
  }))
  return { all: () => [...map.values()], get: (id: number) => map.get(id), remove: (id: number) => { map.delete(id) } }
}

/** A scheduler that emits `queue` on its first tick and records what it was offered. */
function fakeScheduler(queue: CallRequest[]) {
  const offered: { id: number; species: string; distance: number }[][] = []
  const s: CallScheduler & { offered: typeof offered } = {
    offered,
    tick(_now, birds) { offered.push([...birds]); const out = queue; queue = []; return out },
  }
  return s
}

const coot = { audio: [{ file: 'media/audio/coot-1.mp3', type: 'call' as const, xcId: 'XC1', recordist: 'r', license: 'l', sourceUrl: 'https://x.org/1' }] }
const flush = () => new Promise(r => setTimeout(r, 0))

describe('createCallPlayer', () => {
  it('schedules nothing while the audio context is locked', () => {
    const engine = fakeEngine(false)
    const scheduler = fakeScheduler([{ id: 1, species: 'y00475', prefer: 'call' }])
    const p = createCallPlayer({ engine, registry: fakeRegistry([{ id: 1, species: 'y00475', at: [0, 0, -10] }]), birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler })
    for (let i = 0; i < 10; i++) p.update(1)
    expect(scheduler.offered).toHaveLength(0)
    expect(engine.load).not.toHaveBeenCalled()
  })

  it('loads the chosen clip and plays it at the bird, counting it as active meanwhile', async () => {
    const engine = fakeEngine(true)
    const scheduler = fakeScheduler([{ id: 1, species: 'y00475', prefer: 'call' }])
    const p = createCallPlayer({ engine, registry: fakeRegistry([{ id: 1, species: 'y00475', at: [3, 0, -10] }]), birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler })
    p.update(1)
    expect(engine.loads).toEqual(['/media/audio/coot-1.mp3'])
    expect(p.active).toBe(1)                 // pending load holds a slot
    await flush()
    expect(engine.playAt).toHaveBeenCalledTimes(1)
    expect(engine.voices[0]!.position.toArray()).toEqual([3, 0, -10])
    expect(p.active).toBe(1)
  })

  it('follows a bird that moves and frees the slot when the voice ends', async () => {
    const engine = fakeEngine(true)
    const registry = fakeRegistry([{ id: 1, species: 'y00475', at: [0, 0, -10] }])
    const p = createCallPlayer({ engine, registry, birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler: fakeScheduler([{ id: 1, species: 'y00475', prefer: 'call' }]) })
    p.update(1)
    await flush()
    const inst = registry.get(1)!
    inst.model.group.position.set(5, 0, -12)
    inst.model.group.updateMatrixWorld()
    p.update(1)
    const follow = engine.voices[0]!.voice.follow
    expect(follow).toHaveBeenCalled()
    expect((follow.mock.calls.at(-1)![0] as THREE.Vector3).toArray()).toEqual([5, 0, -12])
    engine.voices[0]!.voice.stop()
    p.update(1)
    expect(p.active).toBe(0)
  })

  it('offers the scheduler distances from the listener and leaves flock members out', () => {
    const engine = fakeEngine(true)
    const scheduler = fakeScheduler([])
    const registry = fakeRegistry([{ id: 1, species: 'y00475', at: [0, 0, -10] }, { id: 2, species: 'cangoo', at: [0, 50, 0], behavior: 'flyover' }])
    const p = createCallPlayer({ engine, registry, birdOf: () => coot, listenerPosition: () => new THREE.Vector3(0, 0, 0), rng: makeRng(1), scheduler })
    p.update(1)
    expect(scheduler.offered[0]).toEqual([{ id: 1, species: 'y00475', distance: 10 }])
  })

  it('does not play for a bird that left the registry while its clip loaded', async () => {
    const engine = fakeEngine(true)
    const registry = fakeRegistry([{ id: 1, species: 'y00475', at: [0, 0, -10] }])
    const p = createCallPlayer({ engine, registry, birdOf: () => coot, listenerPosition: () => new THREE.Vector3(), rng: makeRng(1), scheduler: fakeScheduler([{ id: 1, species: 'y00475', prefer: 'call' }]) })
    p.update(1)
    registry.remove(1)
    await flush()
    expect(engine.playAt).not.toHaveBeenCalled()
    expect(p.active).toBe(0)
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npx vitest run src/audio/callPlayer.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 7: Implement the call player**

`src/audio/callPlayer.ts`:

```ts
import * as THREE from 'three'
import type { Bird, Rng } from '../catalog/types'
import type { Voice, PlayAtOptions } from './engine'
import { createCallScheduler, type CallScheduler } from './calls'
import { pickClip } from './clips'

/** The slice of AudioEngine the player needs; tests pass a fake. */
export interface CallEngine {
  readonly unlocked: boolean
  load(url: string): Promise<AudioBuffer>
  playAt(buffer: AudioBuffer, position: THREE.Vector3, layer: 'calls', o?: PlayAtOptions): Voice
}

/** What the player reads from a registered bird. A BirdRegistry entry satisfies this. */
export interface CallBird {
  id: number
  species: string
  behavior: string
  model: { group: THREE.Object3D; center: THREE.Vector3 }
}

export interface CallRegistry {
  all(): readonly CallBird[]
  get(id: number): CallBird | undefined
}

export interface CallPlayerDeps {
  engine: CallEngine
  registry: CallRegistry
  birdOf: (code: string) => Pick<Bird, 'audio'>
  listenerPosition: () => THREE.Vector3
  rng: Rng
  scheduler?: CallScheduler
}

export interface CallPlayer {
  update(dt: number): void
  /** voices sounding plus clips still loading */
  readonly active: number
}

const REF_DISTANCE = 8
const MAX_DISTANCE = 500

function worldPos(inst: CallBird): THREE.Vector3 {
  return inst.model.group.localToWorld(inst.model.center.clone())
}

/**
 * Binds the pure scheduler to the registry and the engine: asks it who calls,
 * picks a clip, loads it, plays it at the bird, and keeps the voice on the
 * bird while it moves. Flock members are left out; a flock has one source
 * of its own (Task 10).
 */
export function createCallPlayer(deps: CallPlayerDeps): CallPlayer {
  const scheduler = deps.scheduler ?? createCallScheduler(deps.rng)
  const live: { voice: Voice; id: number }[] = []
  let pending = 0
  let now = 0

  return {
    get active() { return live.length + pending },
    update(dt) {
      now += dt
      for (let i = live.length - 1; i >= 0; i--) {
        const v = live[i]!
        if (!v.voice.playing) { live.splice(i, 1); continue }
        const inst = deps.registry.get(v.id)
        if (inst) v.voice.follow(worldPos(inst))
      }
      if (!deps.engine.unlocked) return
      const listener = deps.listenerPosition()
      const cands = deps.registry.all()
        .filter(b => b.behavior !== 'flyover')
        .map(b => ({ id: b.id, species: b.species, distance: worldPos(b).distanceTo(listener) }))
      for (const req of scheduler.tick(now, cands, live.length + pending)) {
        const clip = pickClip(deps.birdOf(req.species), req.prefer, deps.rng)
        if (!clip) continue
        pending++
        deps.engine.load('/' + clip.file)
          .then(buffer => {
            const inst = deps.registry.get(req.id)
            if (!inst) return
            live.push({ id: req.id, voice: deps.engine.playAt(buffer, worldPos(inst), 'calls', { refDistance: REF_DISTANCE, maxDistance: MAX_DISTANCE }) })
          })
          .catch(err => console.warn(`call ${clip.file}: ${String(err)}`))
          .finally(() => { pending-- })
      }
    },
  }
}
```

- [ ] **Step 8: Run tests**

Run: `npx vitest run src/audio`
Expected: PASS.

- [ ] **Step 9: Wire into main and the overlay**

In `src/hud/devOverlay.ts` add `calls: number` to `DevStats` and a `calls ${stats.calls}` line.

In `src/main.tsx`, after the spawner and the engine exist:

```ts
import { createCallPlayer } from './audio/callPlayer'
import { makeRng } from './catalog/rng'
// ...
const calls = createCallPlayer({
  engine, registry, birdOf: findBird,
  listenerPosition: () => world.camera.position,
  rng: makeRng(1234),
})
// in the frame callback, before dev.update:
calls.update(dt)
dev.update(dt, { birds: registry.size, gust: world.wind.state.gust, mode: optics.mode, audio: engine.unlocked ? 'running' : 'locked', calls: calls.active })
```

- [ ] **Step 10: Check by ear**

Run: `npm run dev`, click Begin, click the scene. Expected within a minute: coot grunts and killdeer calls from the near water and the mudflat, panning as you turn; a mallard quack now and then; at most three at once (`calls` in the overlay never exceeds 3); the heron is silent for minutes. Look away from a calling coot and it moves to the side you turned from. No console warnings. If a clip fails to load, a `call media/audio/...` warning names it and the game carries on.

- [ ] **Step 11: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: seeded call scheduler with a simultaneous cap, positional call player"
```

---

### Task 7: Event sounds

**Files:**
- Create: `src/audio/effects.ts`, `src/audio/effects.test.ts`
- Modify: `src/main.tsx`, `src/ui/FieldGuide.tsx`, `src/ui/App.tsx`

**Interfaces:**
- Consumes: `renderEffect`, `EffectKind`, `SAMPLE_RATE`, `AudioEngine` (`bufferFrom`, `play`, `playAt`, `unlocked`), `OpticMode`, `GameState`.
- Produces:

```ts
export function opticEvent(prev: OpticMode, next: OpticMode): 'raise' | 'lower' | null
export function overlayEvents(prev: GameState, next: GameState): EffectKind[]
export interface Effects { play(kind: EffectKind, volume?: number): void; playAt(kind: EffectKind, position: THREE.Vector3, volume?: number): void }
export function createEffects(engine: Pick<AudioEngine, 'bufferFrom' | 'play' | 'playAt' | 'unlocked'>): Effects
```

The spec's event sounds: optics raise and lower, guide open and page turn, correct and incorrect. The kingfisher splash and wing flaps use `playAt` from Task 11.

- [ ] **Step 1: Write the failing tests**

`src/audio/effects.test.ts`:

```ts
import * as THREE from 'three'
import { opticEvent, overlayEvents, createEffects } from './effects'
import type { GameState } from '../store/game'

const base: GameState = {
  optic: 'eye', target: null, guideOpen: false, guideMode: 'browse', identifying: null, card: null, lifeListOpen: false,
  titleOpen: false, settingsOpen: false, creditsOpen: false,
}

describe('opticEvent', () => {
  it('raises going up from the eye, lowers coming back, raises between optics, nothing when unchanged', () => {
    expect(opticEvent('eye', 'binoculars')).toBe('raise')
    expect(opticEvent('binoculars', 'eye')).toBe('lower')
    expect(opticEvent('binoculars', 'telescope')).toBe('raise')
    expect(opticEvent('telescope', 'telescope')).toBeNull()
  })
})

describe('overlayEvents', () => {
  it('sounds the guide opening and each card as it appears', () => {
    expect(overlayEvents(base, { ...base, guideOpen: true })).toEqual(['guide-open'])
    expect(overlayEvents({ ...base, guideOpen: true }, { ...base, guideOpen: true })).toEqual([])
    const wrong = { kind: 'wrong' as const, guess: 'mallar3', hint: 'h' }
    expect(overlayEvents(base, { ...base, card: wrong })).toEqual(['wrong'])
    expect(overlayEvents({ ...base, card: wrong }, { ...base, card: wrong })).toEqual([])
    expect(overlayEvents({ ...base, card: wrong }, { ...base, card: { kind: 'correct', species: 'y00475' } })).toEqual(['correct'])
    expect(overlayEvents(base, { ...base, card: { kind: 'revealed', species: 'y00475' } })).toEqual(['reveal'])
  })
})

describe('createEffects', () => {
  function fakeEngine(unlocked: boolean) {
    return {
      unlocked,
      bufferFrom: vi.fn((s: Float32Array) => ({ length: s.length }) as unknown as AudioBuffer),
      play: vi.fn(() => ({ playing: true, stop() {}, setVolume() {}, follow() {} })),
      playAt: vi.fn(() => ({ playing: true, stop() {}, setVolume() {}, follow() {} })),
    }
  }
  it('renders each sound once and reuses the buffer', () => {
    const engine = fakeEngine(true)
    const fx = createEffects(engine)
    fx.play('page'); fx.play('page'); fx.playAt('splash', new THREE.Vector3(1, 0, 1)); fx.playAt('splash', new THREE.Vector3(2, 0, 2))
    expect(engine.bufferFrom).toHaveBeenCalledTimes(2)
    expect(engine.play).toHaveBeenCalledTimes(2)
    expect(engine.playAt).toHaveBeenCalledTimes(2)
  })
  it('stays quiet while the context is locked', () => {
    const engine = fakeEngine(false)
    createEffects(engine).play('correct')
    expect(engine.play).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/audio/effects.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/audio/effects.ts`:

```ts
import type * as THREE from 'three'
import type { OpticMode } from '../player/optics'
import type { GameState } from '../store/game'
import type { AudioEngine } from './engine'
import { renderEffect, SAMPLE_RATE, type EffectKind } from './synth'

export function opticEvent(prev: OpticMode, next: OpticMode): 'raise' | 'lower' | null {
  if (prev === next) return null
  return next === 'eye' ? 'lower' : 'raise'
}

/** Sounds owed to a store transition: the guide opening, a card appearing or changing. */
export function overlayEvents(prev: GameState, next: GameState): EffectKind[] {
  const out: EffectKind[] = []
  if (!prev.guideOpen && next.guideOpen) out.push('guide-open')
  if (next.card && next.card !== prev.card) {
    out.push(next.card.kind === 'correct' ? 'correct' : next.card.kind === 'wrong' ? 'wrong' : 'reveal')
  }
  return out
}

export interface Effects {
  play(kind: EffectKind, volume?: number): void
  playAt(kind: EffectKind, position: THREE.Vector3, volume?: number): void
}

/** Renders each effect once, on first use, into an AudioBuffer and plays it on the effects layer. */
export function createEffects(engine: Pick<AudioEngine, 'bufferFrom' | 'play' | 'playAt' | 'unlocked'>): Effects {
  const cache = new Map<EffectKind, AudioBuffer>()
  function buffer(kind: EffectKind): AudioBuffer {
    let b = cache.get(kind)
    if (!b) { b = engine.bufferFrom(renderEffect(kind), SAMPLE_RATE); cache.set(kind, b) }
    return b
  }
  return {
    play(kind, volume = 1) {
      if (!engine.unlocked) return
      engine.play(buffer(kind), 'effects', { volume })
    },
    playAt(kind, position, volume = 1) {
      if (!engine.unlocked) return
      engine.playAt(buffer(kind), position, 'effects', { volume, refDistance: 10 })
    },
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/audio/effects.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the UI sounds**

In `src/ui/FieldGuide.tsx` add an optional `onSelect?: (code: string) => void` prop and call it where a row is clicked:

```tsx
onClick={() => { setSelected(b.speciesCode); onSelect?.(b.speciesCode) }}
```

In `src/ui/App.tsx` add `onGuideSelect: (code: string) => void` to `AppDeps` and pass `onSelect={d.onGuideSelect}` to `FieldGuide`.

In `src/main.tsx`:

```ts
import { createEffects, opticEvent, overlayEvents } from './audio/effects'
import type { OpticMode } from './player/optics'
// after the engine:
const effects = createEffects(engine)
function setOptic(m: OpticMode) {
  const ev = opticEvent(optics.mode, m)
  optics.setMode(m)
  if (ev) effects.play(ev, 0.6)
}
```

Replace the three `optics.setMode(...)` calls in the wheel and key handlers with `setOptic(...)`. Add a store subscription next to the pause one:

```ts
let prevState = game.get()
game.subscribe(s => {
  for (const ev of overlayEvents(prevState, s)) effects.play(ev)
  prevState = s
})
```

Pass `onGuideSelect={() => effects.play('page', 0.5)}` in `renderApp`. `effects` is created after the world, so like `audio` declare `let effects: Effects | null = null` above `renderApp` and use `effects?.play(...)` there.

- [ ] **Step 6: Check by ear**

Run: `npm run dev`, Begin, scroll up: a soft rising swoosh; scroll down: falling. G: paper; click species rows: page flicks. Identify a coot correctly: two rising notes; wrongly: a low thud; after three misses: a falling note. Sounds still work with the pointer released and the guide open (the effects are not positional).

- [ ] **Step 7: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: synthesized event sounds for optics, guide, and result cards"
```

---
### Task 8: Species specs for the catalogued remainder

**Files:**
- Create: `src/birds/species/gadwal.ts`, `amewig.ts`, `norsho.ts`, `pibgre.ts`, `greegr.ts`, `cangoo.ts`, `belkin1.ts`, `rewbla.ts`, `marwre.ts` (all under `src/birds/species/`)
- Modify: `src/birds/species/index.ts`, `src/birds/species/species.test.ts`, `data/locations/lake.json`

**Interfaces:**
- Consumes: `SpeciesSpec` (shape unchanged from Milestone 1: `code, commonName, length, body, neck, head, bill, legs, tail, wing, posture, draft, plumage, variants, marks, wingbeatHz`).
- Produces: nine more entries in `SPECIES`; `hasSpec` true for every species the lake casts today plus the goose, kingfisher, blackbird, and wren that Tasks 10 and 11 cast.

The four Milestone 1 specs are the style reference (`amecoo.ts`, `mallar3.ts`, `grbher3.ts`, `killde.ts`). Proportions are in "body lengths" scaled by `length` (bill tip to tail tip, metres). Colors are the plumage blocks the art direction wants: a birder should know the species from shape and blocks alone. Marks are the five hint sentences the identification flow contrasts, so each must say something true and distinctive.

- [ ] **Step 1: Update the failing test**

In `src/birds/species/species.test.ts` replace the first test and add two:

```ts
import { loadLocation } from '../../location'

  it('has a spec for every species the lake casts', () => {
    for (const entry of loadLocation().cast) expect(hasSpec(entry.species), entry.species).toBe(true)
  })
  it('has specs for the birds that arrive with flyover, perch, and hover', () => {
    for (const code of ['cangoo', 'belkin1', 'rewbla', 'marwre']) expect(hasSpec(code), code).toBe(true)
  })
  it('every mark is a non-empty sentence fragment', () => {
    for (const spec of Object.values(SPECIES)) for (const [k, m] of Object.entries(spec.marks)) expect(m.length, `${spec.code}.${k}`).toBeGreaterThan(8)
  })
```

Keep the other four tests. Add a shoveler to the lake cast in `data/locations/lake.json`, after the wigeon line:

```json
    { "species": "norsho",  "behavior": "swim",  "zone": "open-water", "count": 3, "plumage": "mixed" },
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/species`
Expected: FAIL: no spec for `gadwal`, `amewig`, `norsho`, `pibgre`, `greegr`.

- [ ] **Step 3: Write the nine specs**

`src/birds/species/gadwal.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'gadwal',
  commonName: 'Gadwall',
  length: 0.51,
  body: { length: 1, height: 0.55, width: 0.5 },
  neck: { length: 0.3, thickness: 0.16, angle: 50 },
  head: { size: 0.3 },
  bill: { length: 0.17, thickness: 0.09, shape: 'flat' },
  legs: { length: 0.25, thickness: 0.045 },
  tail: { length: 0.15, angle: 10 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#4a3f35', cheek: '#6b5f52', throat: '#7a6d5e', breast: '#6e6258', flank: '#7d746a',
    back: '#5e564d', wing: '#6a625a', speculum: '#f2f2ee', rump: '#1a1a1a', tail: '#2a2825',
    bill: '#2b2b2b', legs: '#e0a13a', eye: '#1a1a1a',
  },
  variants: {
    male: {},
    female: {
      crown: '#5a4a36', cheek: '#a08a6a', throat: '#b8a888', breast: '#a4906f', flank: '#9c8767',
      back: '#6e5a42', wing: '#7a6650', rump: '#7a6650', tail: '#6b5a45', bill: '#c9862d',
    },
  },
  marks: {
    size: 'a medium dabbling duck, a little smaller than a Mallard',
    bill: 'a dark grey bill (male) or an orange-edged bill (female), shorter than a Mallard\'s',
    head: 'a plain grey-brown head with a steep forehead',
    body: 'a subtle grey body with a crisp black rear end and a white patch in the wing',
    legs: 'orange-yellow legs',
  },
  wingbeatHz: 5,
}
```

`src/birds/species/amewig.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'amewig',
  commonName: 'American Wigeon',
  length: 0.5,
  body: { length: 1, height: 0.56, width: 0.5 },
  neck: { length: 0.28, thickness: 0.16, angle: 55 },
  head: { size: 0.3 },
  bill: { length: 0.14, thickness: 0.09, shape: 'flat' },
  legs: { length: 0.24, thickness: 0.045 },
  tail: { length: 0.16, angle: 12 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#f1ead6', cheek: '#7f8a80', throat: '#8a8d86', breast: '#b48a7a', flank: '#b58c78',
    back: '#8e7f6a', wing: '#8a8073', speculum: '#2f7a55', rump: '#1e1e1e', tail: '#1a1a1a',
    bill: '#a9c5d1', legs: '#6b6b6b', eye: '#1a1a1a',
  },
  variants: {
    male: {},
    female: {
      crown: '#8a7d6c', cheek: '#8d8578', throat: '#9a9286', breast: '#a98a76', flank: '#a98a76',
      back: '#7a6a58', wing: '#7f7466', speculum: null, rump: '#6f6252', tail: '#6f6252',
    },
  },
  marks: {
    size: 'a compact medium duck with a round head',
    bill: 'a small pale blue-grey bill with a black tip',
    head: 'a cream crown with a green patch behind the eye (male) or a plain grey head (female)',
    body: 'a pinkish-brown body with a white flank patch before the black rear',
    legs: 'dark grey legs',
  },
  wingbeatHz: 5.5,
}
```

`src/birds/species/norsho.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'norsho',
  commonName: 'Northern Shoveler',
  length: 0.48,
  body: { length: 1, height: 0.52, width: 0.5 },
  neck: { length: 0.25, thickness: 0.16, angle: 45 },
  head: { size: 0.3 },
  bill: { length: 0.26, thickness: 0.12, shape: 'flat' },
  legs: { length: 0.24, thickness: 0.045 },
  tail: { length: 0.14, angle: 8 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#1f4a35', cheek: '#27563d', throat: '#2b5a41', breast: '#f0eee6', flank: '#a85a2a',
    back: '#2a2a2a', wing: '#3f4a55', speculum: '#2f7a45', rump: '#1a1a1a', tail: '#3a3a3a',
    bill: '#1e1e1e', legs: '#f08a2a', eye: '#e8c22a',
  },
  variants: {
    male: {},
    female: {
      crown: '#6a5a42', cheek: '#a8957a', throat: '#b8a68a', breast: '#b09472', flank: '#a88c6a',
      back: '#6e5a44', wing: '#7a6a56', rump: '#6e5a44', tail: '#6e5a44', bill: '#c48a3a', eye: '#2a2a2a',
    },
  },
  marks: {
    size: 'a medium duck that sits low and front-heavy',
    bill: 'a huge spoon-shaped bill, longer than the head',
    head: 'a dark green head (male) or a plain brown head (female) on a short neck',
    body: 'a white breast and rusty flanks (male) or mottled brown all over (female)',
    legs: 'bright orange legs',
  },
  wingbeatHz: 5.5,
}
```

`src/birds/species/pibgre.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'pibgre',
  commonName: 'Pied-billed Grebe',
  length: 0.33,
  body: { length: 1, height: 0.62, width: 0.5 },
  neck: { length: 0.32, thickness: 0.15, angle: 60 },
  head: { size: 0.3 },
  bill: { length: 0.1, thickness: 0.11, shape: 'pointed' },
  legs: { length: 0.15, thickness: 0.04 },
  tail: { length: 0.03, angle: 20 },
  wing: { length: 0.45, width: 0.25 },
  posture: 'swimming',
  draft: 0.5,
  plumage: {
    crown: '#4a3f33', cheek: '#7a6a56', throat: '#8c7c68', breast: '#a89684', flank: '#8b7a66',
    back: '#5a4d3f', wing: '#5f5245', speculum: null, rump: '#c8c0b0', tail: '#c8c0b0',
    bill: '#d8d0b8', legs: '#5a5a4a', eye: '#2a2a2a',
  },
  variants: {},
  marks: {
    size: 'small and stocky, smaller than a coot',
    bill: 'a short thick pale bill, chicken-like',
    head: 'a rounded brown head that dives without warning',
    body: 'a brown body with a fluffy pale rear and no visible tail',
    legs: 'legs set far back, never seen out of the water',
  },
  wingbeatHz: 7,
}
```

`src/birds/species/greegr.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'greegr',
  commonName: 'Great Egret',
  length: 1.0,
  body: { length: 1, height: 0.48, width: 0.4 },
  neck: { length: 0.95, thickness: 0.12, angle: 72 },
  head: { size: 0.2 },
  bill: { length: 0.3, thickness: 0.07, shape: 'dagger' },
  legs: { length: 0.85, thickness: 0.03 },
  tail: { length: 0.1, angle: 0 },
  wing: { length: 0.9, width: 0.4 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#fbfaf5', cheek: '#fbfaf5', throat: '#f8f7f1', breast: '#f6f4ec', flank: '#f4f2e9',
    back: '#f7f5ee', wing: '#f4f2ea', speculum: null, rump: '#f4f2ea', tail: '#f2f0e7',
    bill: '#e9b93a', legs: '#2a2a2a', eye: '#e8d24a',
  },
  variants: {},
  marks: {
    size: 'very large and tall, nearly heron-sized',
    bill: 'a long yellow dagger bill',
    head: 'a white head with a yellow bill and a dark line through the eye',
    body: 'pure white all over, held tall and slim',
    legs: 'long black legs and black feet',
  },
  wingbeatHz: 2.4,
}
```

`src/birds/species/cangoo.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'cangoo',
  commonName: 'Canada Goose',
  length: 0.95,
  body: { length: 1, height: 0.55, width: 0.55 },
  neck: { length: 0.55, thickness: 0.16, angle: 65 },
  head: { size: 0.28 },
  bill: { length: 0.16, thickness: 0.1, shape: 'flat' },
  legs: { length: 0.3, thickness: 0.05 },
  tail: { length: 0.16, angle: 6 },
  wing: { length: 0.85, width: 0.4 },
  posture: 'swimming',
  draft: 0.4,
  plumage: {
    crown: '#141414', cheek: '#f2f0ea', throat: '#f2f0ea', breast: '#c9c0ad', flank: '#8b7f6a',
    back: '#6b6152', wing: '#6a5f50', speculum: null, rump: '#f1efe9', tail: '#1a1a1a',
    bill: '#111111', legs: '#1a1a1a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a very large, long-necked waterfowl',
    bill: 'a short black bill',
    head: 'a black head and neck with a white chinstrap',
    body: 'a brown body with a pale breast and a white rump, flying in a V',
    legs: 'black legs',
  },
  wingbeatHz: 2.6,
}
```

`src/birds/species/belkin1.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'belkin1',
  commonName: 'Belted Kingfisher',
  length: 0.32,
  body: { length: 1, height: 0.6, width: 0.5 },
  neck: { length: 0.12, thickness: 0.2, angle: 40 },
  head: { size: 0.42 },
  bill: { length: 0.24, thickness: 0.1, shape: 'dagger' },
  legs: { length: 0.08, thickness: 0.03 },
  tail: { length: 0.2, angle: 5 },
  wing: { length: 0.5, width: 0.25 },
  posture: 'perched',
  draft: 0,
  plumage: {
    crown: '#3f6f8a', cheek: '#3f6f8a', throat: '#f4f2ec', breast: '#f2f0ea', flank: '#f0eee8',
    back: '#3f6f8a', wing: '#3a667f', speculum: null, rump: '#3f6f8a', tail: '#355d73',
    bill: '#1f1f1f', legs: '#3a3a3a', eye: '#111111',
  },
  variants: {
    male: {},
    female: { flank: '#b8683a', breast: '#e8e0d4' },
  },
  marks: {
    size: 'a stocky pigeon-sized bird with an oversized head',
    bill: 'a long, heavy, dagger-shaped bill',
    head: 'a shaggy blue-grey crest on a big head',
    body: 'blue-grey above with a white collar and a blue breast band (females add a rusty band)',
    legs: 'tiny dark legs, perched over water',
  },
  wingbeatHz: 6,
}
```

`src/birds/species/rewbla.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'rewbla',
  commonName: 'Red-winged Blackbird',
  length: 0.22,
  body: { length: 1, height: 0.55, width: 0.45 },
  neck: { length: 0.1, thickness: 0.18, angle: 45 },
  head: { size: 0.32 },
  bill: { length: 0.14, thickness: 0.08, shape: 'pointed' },
  legs: { length: 0.28, thickness: 0.025 },
  tail: { length: 0.35, angle: 5 },
  wing: { length: 0.42, width: 0.22 },
  posture: 'perched',
  draft: 0,
  plumage: {
    crown: '#111111', cheek: '#141414', throat: '#151515', breast: '#171717', flank: '#181818',
    back: '#141414', wing: '#161616', speculum: '#d8261f', rump: '#141414', tail: '#111111',
    bill: '#1a1a1a', legs: '#222222', eye: '#111111',
  },
  variants: {
    male: {},
    female: {
      crown: '#5a4a38', cheek: '#a08a6a', throat: '#d8c8a8', breast: '#b8a888', flank: '#9a8666',
      back: '#5e4c3a', wing: '#665442', speculum: null, rump: '#5e4c3a', tail: '#4e4032', bill: '#3a3028',
    },
  },
  marks: {
    size: 'a robin-sized songbird',
    bill: 'a sharp pointed black bill',
    head: 'a plain black head (male) or a streaked brown head with a pale eyebrow (female)',
    body: 'glossy black with a red-and-yellow shoulder patch (male) or heavily streaked brown (female)',
    legs: 'thin dark legs gripping a reed',
  },
  wingbeatHz: 7,
}
```

`src/birds/species/marwre.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'marwre',
  commonName: 'Marsh Wren',
  length: 0.125,
  body: { length: 1, height: 0.6, width: 0.5 },
  neck: { length: 0.06, thickness: 0.2, angle: 40 },
  head: { size: 0.36 },
  bill: { length: 0.14, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.28, thickness: 0.02 },
  tail: { length: 0.35, angle: 45 },
  wing: { length: 0.35, width: 0.2 },
  posture: 'perched',
  draft: 0,
  plumage: {
    crown: '#4a3a2a', cheek: '#a88a68', throat: '#f0e8d8', breast: '#e8dcc4', flank: '#c9a878',
    back: '#5a4030', wing: '#7a5a40', speculum: null, rump: '#a06a40', tail: '#6a4a34',
    bill: '#4a3a2a', legs: '#8a7a68', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'tiny, smaller than a sparrow',
    bill: 'a thin, slightly curved bill',
    head: 'a dark cap with a bold white eyebrow',
    body: 'rusty brown with a striped back and a cocked tail',
    legs: 'thin pale legs clinging to reed stems',
  },
  wingbeatHz: 12,
}
```

- [ ] **Step 4: Register them**

`src/birds/species/index.ts`:

```ts
import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { SPEC as amecoo } from './amecoo'
import { SPEC as mallar3 } from './mallar3'
import { SPEC as grbher3 } from './grbher3'
import { SPEC as killde } from './killde'
import { SPEC as gadwal } from './gadwal'
import { SPEC as amewig } from './amewig'
import { SPEC as norsho } from './norsho'
import { SPEC as pibgre } from './pibgre'
import { SPEC as greegr } from './greegr'
import { SPEC as cangoo } from './cangoo'
import { SPEC as belkin1 } from './belkin1'
import { SPEC as rewbla } from './rewbla'
import { SPEC as marwre } from './marwre'

const ALL: SpeciesSpec[] = [amecoo, mallar3, grbher3, killde, gadwal, amewig, norsho, pibgre, greegr, cangoo, belkin1, rewbla, marwre].map(parseSpeciesSpec)

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

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/birds src/location`
Expected: PASS. The "every spec code exists in the catalog with the same common name" test guards the names above against `data/birds.json`; if one fails, fix the spec's `commonName` to match the catalog, never the catalog.

- [ ] **Step 6: Visual check**

Run: `npm run dev`, Begin. Expected: no grey placeholders left. On the far water: gadwall (grey with black rears), wigeon (cream crowns), shovelers (green heads, huge bills, orange legs), two grebes (small, tail-less, pale rear). On the far shore, the egret is white and slim beside the heron. Raise the telescope on each and confirm the guide photo matches the model's blocks. If a swimmer floats too high or low, adjust its `draft`; if a standing bird's feet sink, its `legs.length`.

- [ ] **Step 7: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: nine more species specs; shovelers join the lake cast"
```

---

### Task 9: Flock formation math and the flyover controller

**Files:**
- Create: `src/behavior/flyover.ts`, `src/behavior/flyover.test.ts`

**Interfaces:**
- Consumes: `LaneZone`, `Vec3` from `src/location/schema.ts`; `Rng`.
- Produces:

```ts
export type Formation = 'line' | 'vee'
export interface FormationOffset { forward: number; lateral: number; up: number }
export function formationOffsets(kind: Formation, n: number, spacing: number): FormationOffset[]
export interface Crossing { start: Vec3; end: Vec3; heading: number; length: number }
export function laneCrossing(lane: LaneZone, rng: Rng): Crossing
export interface FlyoverOptions { count: number; formation: Formation; everySeconds: [number, number]; wingbeatHz: number; speed?: number; spacing?: number }
export interface FlyoverMember { x: number; y: number; z: number; heading: number; wingPhase: number }
export interface FlyoverController { readonly state: 'waiting' | 'crossing'; readonly x: number; readonly y: number; readonly z: number; readonly heading: number; readonly members: readonly FlyoverMember[]; update(dt: number): void }
export function createFlyover(lane: LaneZone, rng: Rng, opts: FlyoverOptions): FlyoverController
```

Heading convention matches the other behaviors: radians, `0 = +x`, counter-clockwise seen from above, so forward is `(cos h, -sin h)` in `(x, z)` and lateral-right is `(sin h, cos h)`. The controller is not a `BehaviorController` (it moves a flock, not a bird); Task 10 drives the instanced model from `members`.

- [ ] **Step 1: Write the failing tests**

`src/behavior/flyover.test.ts`:

```ts
import { formationOffsets, laneCrossing, createFlyover } from './flyover'
import { makeRng } from '../catalog/rng'
import type { LaneZone } from '../location/schema'

const lane: LaneZone = { kind: 'lane', from: [-160, 0, -90], to: [160, 0, -60], altitude: [40, 80] }

describe('formationOffsets', () => {
  it('line: the leader at the origin, each bird behind and beside the last', () => {
    const o = formationOffsets('line', 5, 2)
    expect(o[0]).toEqual({ forward: 0, lateral: 0, up: 0 })
    for (let i = 1; i < o.length; i++) {
      expect(o[i]!.forward).toBeLessThan(o[i - 1]!.forward)
      expect(o[i]!.lateral).toBeGreaterThan(o[i - 1]!.lateral)
    }
  })
  it('vee: the leader at the point, arms alternating left and right, symmetric', () => {
    const o = formationOffsets('vee', 7, 2)
    expect(o[0]).toEqual({ forward: 0, lateral: 0, up: 0 })
    expect(o.reduce((s, x) => s + x.lateral, 0)).toBeCloseTo(0, 9)
    expect(o[1]!.lateral).toBeCloseTo(-o[2]!.lateral, 9)
    expect(o[1]!.forward).toBe(o[2]!.forward)
    expect(o[3]!.forward).toBeLessThan(o[1]!.forward)
    expect(o.slice(1).every(x => x.forward < 0)).toBe(true)
  })
})

describe('laneCrossing', () => {
  it('runs from one end of the lane to the other at an altitude inside the band', () => {
    const ends = new Set<string>()
    for (let seed = 0; seed < 20; seed++) {
      const c = laneCrossing(lane, makeRng(seed))
      expect(c.start[1]).toBeGreaterThanOrEqual(40)
      expect(c.start[1]).toBeLessThanOrEqual(80)
      expect(c.end[1]).toBe(c.start[1])
      const pair = [c.start[0], c.end[0]].join(',')
      expect(['-160,160', '160,-160']).toContain(pair)
      ends.add(pair)
      expect(Math.sign(Math.cos(c.heading))).toBe(Math.sign(c.end[0] - c.start[0]))
      expect(c.length).toBeCloseTo(Math.hypot(320, 30), 6)
    }
    expect(ends.size).toBe(2)
  })
})

describe('createFlyover', () => {
  const opts = { count: 9, formation: 'vee' as const, everySeconds: [10, 20] as [number, number], wingbeatHz: 2.6 }

  function run(seed: number, seconds: number, dt = 0.1) {
    const c = createFlyover(lane, makeRng(seed), opts)
    const log: { t: number; state: string }[] = []
    for (let t = 0; t < seconds; t += dt) {
      c.update(dt)
      log.push({ t, state: c.state })
      if (c.state === 'crossing') {
        for (const m of c.members) {
          expect(m.y).toBeGreaterThanOrEqual(39)
          expect(m.y).toBeLessThanOrEqual(81)
          expect(Math.abs(m.x)).toBeLessThan(160 + 40)
          expect(m.wingPhase).toBeGreaterThanOrEqual(0)
          expect(m.wingPhase).toBeLessThan(1)
          expect(m.heading).toBe(c.heading)
        }
      }
    }
    return { c, log }
  }

  it('waits, crosses, and waits again within the configured interval', () => {
    const { log } = run(1, 200)
    const starts = log.filter((e, i) => e.state === 'crossing' && log[i - 1]?.state === 'waiting').map(e => e.t)
    const ends = log.filter((e, i) => e.state === 'waiting' && log[i - 1]?.state === 'crossing').map(e => e.t)
    expect(starts.length).toBeGreaterThanOrEqual(2)
    expect(ends.length).toBeGreaterThanOrEqual(1)
    const gap = starts[1]! - ends[0]!
    expect(gap).toBeGreaterThanOrEqual(10 - 0.2)
    expect(gap).toBeLessThanOrEqual(20 + 0.2)
  })

  it('members flap out of phase with each other and the flock advances along the lane', () => {
    const c = createFlyover(lane, makeRng(2), opts)
    let guard = 0
    while (c.state !== 'crossing' && guard++ < 10000) c.update(0.1)
    const x0 = c.x
    c.update(0.5)
    expect(Math.abs(c.x - x0)).toBeGreaterThan(5)
    expect(new Set(c.members.map(m => m.wingPhase.toFixed(3))).size).toBeGreaterThan(3)
  })

  it('is deterministic per seed', () => {
    const a = run(5, 60).log, b = run(5, 60).log
    expect(a).toEqual(b)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/behavior/flyover.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/behavior/flyover.ts`:

```ts
import type { LaneZone, Vec3 } from '../location/schema'
import type { Rng } from '../catalog/types'

export type Formation = 'line' | 'vee'
export interface FormationOffset { forward: number; lateral: number; up: number }

/** Flock-local offsets: forward along the heading, lateral to the right, up. The leader is bird 0 at the origin. */
export function formationOffsets(kind: Formation, n: number, spacing: number): FormationOffset[] {
  const out: FormationOffset[] = []
  for (let i = 0; i < n; i++) {
    if (kind === 'line') {
      // an echelon: each bird a little behind and beside the one ahead (pelicans)
      out.push({ forward: -i * spacing * 0.9, lateral: i * spacing * 0.35, up: 0 })
    } else {
      // arms alternate right, left, right... each pair one step further back (geese)
      const k = Math.ceil(i / 2)
      const side = i % 2 === 1 ? 1 : -1
      out.push({ forward: -k * spacing * 0.8, lateral: i === 0 ? 0 : side * k * spacing * 0.6, up: 0 })
    }
  }
  return out
}

export interface Crossing { start: Vec3; end: Vec3; heading: number; length: number }

/** One pass along the lane in either direction at a random altitude inside the band. */
export function laneCrossing(lane: LaneZone, rng: Rng): Crossing {
  const forward = rng() < 0.5
  const a = forward ? lane.from : lane.to
  const b = forward ? lane.to : lane.from
  const y = lane.altitude[0] + rng() * (lane.altitude[1] - lane.altitude[0])
  const start: Vec3 = [a[0], y, a[2]]
  const end: Vec3 = [b[0], y, b[2]]
  return {
    start, end,
    heading: Math.atan2(-(end[2] - start[2]), end[0] - start[0]),
    length: Math.hypot(end[0] - start[0], end[2] - start[2]),
  }
}

export interface FlyoverOptions {
  count: number
  formation: Formation
  everySeconds: [number, number]
  wingbeatHz: number
  /** m/s, default 14 */
  speed?: number
  /** m between birds, default 2.5 */
  spacing?: number
}

export interface FlyoverMember { x: number; y: number; z: number; heading: number; wingPhase: number }

export interface FlyoverController {
  readonly state: 'waiting' | 'crossing'
  /** flock centre (the leader's position) */
  readonly x: number
  readonly y: number
  readonly z: number
  readonly heading: number
  /** per-bird world positions, valid while crossing */
  readonly members: readonly FlyoverMember[]
  update(dt: number): void
}

/**
 * A flock that waits a random interval, enters at one end of the lane, crosses
 * in formation, exits past the other end, and waits again. Seeded and pure.
 */
export function createFlyover(lane: LaneZone, rng: Rng, opts: FlyoverOptions): FlyoverController {
  const speed = opts.speed ?? 14
  const spacing = opts.spacing ?? 2.5
  const offsets = formationOffsets(opts.formation, opts.count, spacing)
  const phases = offsets.map(() => rng())
  const members: FlyoverMember[] = offsets.map(() => ({ x: 0, y: 0, z: 0, heading: 0, wingPhase: 0 }))
  // how far behind the centre the last bird flies, plus a margin, so the crossing ends once it is clear
  const tail = spacing - Math.min(...offsets.map(o => o.forward))
  const between = ([lo, hi]: [number, number]) => lo + rng() * (hi - lo)

  let state: 'waiting' | 'crossing' = 'waiting'
  let timer = between(opts.everySeconds) * rng()      // the first flock may come early
  let crossing: Crossing | null = null
  let travelled = 0
  let t = 0
  let cx = 0, cy = 0, cz = 0, heading = 0

  function place(): void {
    const c = crossing!
    heading = c.heading
    cx = c.start[0] + Math.cos(heading) * travelled
    cy = c.start[1]
    cz = c.start[2] - Math.sin(heading) * travelled
    const fx = Math.cos(heading), fz = -Math.sin(heading)     // forward
    const lx = Math.sin(heading), lz = Math.cos(heading)      // lateral, to the right
    offsets.forEach((o, i) => {
      const m = members[i]!
      m.x = cx + fx * o.forward + lx * o.lateral
      m.z = cz + fz * o.forward + lz * o.lateral
      m.y = cy + o.up + Math.sin(t * 0.6 + phases[i]! * Math.PI * 2) * 0.4
      m.heading = heading
      m.wingPhase = (t * opts.wingbeatHz + phases[i]!) % 1
    })
  }

  return {
    get state() { return state },
    get x() { return cx }, get y() { return cy }, get z() { return cz }, get heading() { return heading },
    members,
    update(dt) {
      if (state === 'waiting') {
        timer -= dt
        if (timer > 0) return
        state = 'crossing'
        crossing = laneCrossing(lane, rng)
        travelled = 0
        t = 0
        place()
        return
      }
      travelled += speed * dt
      t += dt
      place()
      if (travelled >= crossing!.length + tail) {
        state = 'waiting'
        timer = between(opts.everySeconds)
      }
    },
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/behavior/flyover.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/behavior/flyover.ts src/behavior/flyover.test.ts
git commit -m "feat: flock formation math and a seeded flyover controller"
```

---
### Task 10: Instanced flock model, flocks in the spawner, flock audio

**Files:**
- Create: `src/birds/flock.ts`, `src/birds/flock.test.ts`
- Modify: `src/birds/registry.ts`, `src/birds/spawn.ts`, `src/birds/spawn.test.ts`, `src/location/schema.ts`, `src/game/identifyController.test.ts`, `data/locations/lake.json`, `src/main.tsx`

**Interfaces:**
- Consumes: `buildBird`, `PoseState`, `SpeciesSpec`, `createFlyover`, `Formation`, `LaneZone`, `BirdRegistry`, `pickClip`, `AudioEngine`.
- Produces:

```ts
// flock.ts
export interface FlockModel { object: THREE.Group; count: number; radius: number; setMember(i: number, x: number, y: number, z: number, heading: number, pose: PoseState): void; commit(): void; dispose(): void }
export function buildFlockModel(spec: SpeciesSpec, count: number, variant?: string): FlockModel
// registry.ts
export interface TargetModel { group: THREE.Object3D; center: THREE.Vector3; radius: number }   // BirdInstance.model is now this (BirdModel satisfies it)
// schema.ts: castEntry gains  formation: z.enum(['line', 'vee']).optional()
// spawn.ts
export interface SpawnEvents { flockStart?(key: string, species: string): void; flockMove?(key: string, x: number, y: number, z: number): void; flockEnd?(key: string): void; effect?(name: 'splash' | 'flap', x: number, y: number, z: number): void }
export interface SpawnDeps { registry: BirdRegistry; wind: Wind; ground: (x: number, z: number) => number; ripples: RippleBuffer; seed: number; events?: SpawnEvents }
export interface FlockEntry { species: string; variant?: string; zone: string; count: number; everySeconds: [number, number]; formation: Formation; groupKey: string }
export const DEFAULT_FLOCK_EVERY: [number, number]
export function expandCast(loc: Location, rng: Rng): Individual[]         // no longer includes flyover entries
export function flockEntries(loc: Location, rng: Rng): FlockEntry[]
```

- [ ] **Step 1: Write the failing flock-model tests**

`src/birds/flock.test.ts`:

```ts
import * as THREE from 'three'
import { buildFlockModel } from './flock'
import { getSpec } from './species'
import { defaultPose } from './model'

const instanced = (f: ReturnType<typeof buildFlockModel>) =>
  f.object.children.filter((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh)

describe('buildFlockModel', () => {
  it('makes one instanced mesh per visible part with the flock count, and no legs', () => {
    const f = buildFlockModel(getSpec('cangoo'), 3)
    const inst = instanced(f)
    expect(inst.length).toBeGreaterThanOrEqual(8)
    expect(inst.every(m => m.count === 3)).toBe(true)
    expect(inst.map(m => m.name)).not.toContain('leg')
    expect(inst.map(m => m.name)).not.toContain('foot')
    expect(f.count).toBe(3)
    expect(f.radius).toBeGreaterThan(0.3)
  })

  it('places a member where it is told', () => {
    const f = buildFlockModel(getSpec('cangoo'), 2)
    f.setMember(1, 10, 20, 30, 0, defaultPose())
    f.commit()
    const body = instanced(f).find(m => m.name === 'body')!
    const m = new THREE.Matrix4()
    body.getMatrixAt(1, m)
    const p = new THREE.Vector3().setFromMatrixPosition(m)
    expect(p.x).toBeCloseTo(10, 5)
    expect(p.z).toBeCloseTo(30, 5)
    expect(Math.abs(p.y - 20)).toBeLessThan(1)
  })

  it('gives members different wing angles for different phases', () => {
    const f = buildFlockModel(getSpec('cangoo'), 2)
    const pose = defaultPose()
    pose.wingSpread = 1
    pose.wingPhase = 0.25
    f.setMember(0, 0, 0, 0, 0, pose)
    pose.wingPhase = 0.75
    f.setMember(1, 0, 0, 0, 0, pose)
    const wing = instanced(f).find(m => m.name === 'wingL')!
    const a = new THREE.Matrix4(), b = new THREE.Matrix4()
    wing.getMatrixAt(0, a)
    wing.getMatrixAt(1, b)
    expect(a.equals(b)).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/flock.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the flock model**

`src/birds/flock.ts`:

```ts
import * as THREE from 'three'
import { buildBird } from './procedural'
import type { PoseState } from './model'
import type { SpeciesSpec } from './spec'

export interface FlockModel {
  object: THREE.Group
  count: number
  /** bounding radius of one member, for apparent-size math */
  radius: number
  /** pose the template as member i and copy its part matrices into the instances */
  setMember(i: number, x: number, y: number, z: number, heading: number, pose: PoseState): void
  /** flag the instance buffers for upload; call once per frame after the last setMember */
  commit(): void
  dispose(): void
}

/**
 * One InstancedMesh per body part, posed through the procedural template so
 * every member gets exactly the pose() a single bird would, with its own
 * wingbeat phase. Legs are left out: these birds are in the air.
 */
export function buildFlockModel(spec: SpeciesSpec, count: number, variant?: string): FlockModel {
  const template = buildBird(spec, variant)
  template.parts.legs.visible = false
  const object = new THREE.Group()
  object.name = `flock:${spec.code}`
  const pairs: { mesh: THREE.Mesh; inst: THREE.InstancedMesh }[] = []
  const underLegs = (o: THREE.Object3D): boolean => {
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === template.parts.legs) return true
    return false
  }
  template.group.traverse(o => {
    if (!(o instanceof THREE.Mesh) || underLegs(o)) return
    const inst = new THREE.InstancedMesh(o.geometry, o.material, count)
    inst.name = o.name
    inst.castShadow = true
    inst.frustumCulled = false     // members span the sky; the geometry's own bounds would cull them wrongly
    object.add(inst)
    pairs.push({ mesh: o, inst })
  })

  return {
    object, count, radius: template.radius,
    setMember(i, x, y, z, heading, pose) {
      template.pose(pose)
      template.group.position.set(x, y, z)
      template.group.rotation.y = heading
      template.group.updateMatrixWorld(true)     // no parent, so matrixWorld is the flock-local transform we want
      for (const { mesh, inst } of pairs) inst.setMatrixAt(i, mesh.matrixWorld)
    },
    commit() {
      for (const { inst } of pairs) inst.instanceMatrix.needsUpdate = true
    },
    dispose() {
      template.dispose()
      for (const { inst } of pairs) inst.dispose()
    },
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/birds/flock.test.ts`
Expected: PASS.

- [ ] **Step 5: Loosen the registry's model type and add `formation` to the schema**

In `src/birds/registry.ts`:

```ts
import type * as THREE from 'three'
import type { BirdModel } from './model'

/** What targeting needs from a registered bird. A BirdModel satisfies it; flock members use a proxy. */
export interface TargetModel { group: THREE.Object3D; center: THREE.Vector3; radius: number }

export interface BirdInstance {
  id: number
  species: string
  variant?: string
  model: TargetModel
  behavior: string
  identified: boolean
  readonly position: THREE.Vector3
}
```

The rest of the file is unchanged (`BirdModel` import can go if nothing else uses it; keep the class as is). In `src/location/schema.ts` add to `castEntry`:

```ts
  /** flyover only: pelicans fly a line, geese a V. Default line. */
  formation: z.enum(['line', 'vee']).optional(),
```

- [ ] **Step 6: Update the failing spawner tests**

In `src/birds/spawn.test.ts` replace the "skips behaviors that are not implemented yet" test and add a `flockEntries` block:

```ts
import { expandCast, flockEntries, DEFAULT_FLOCK_EVERY } from './spawn'

  it('leaves flyover entries to flockEntries', () => {
    const l = loc([{ species: 'cangoo', behavior: 'flyover', zone: 'sky', count: 5 }])
    expect(expandCast(l, makeRng(4))).toEqual([])
    expect(flockEntries(l, makeRng(4))).toHaveLength(1)
  })

describe('flockEntries', () => {
  it('returns one record per flyover entry with defaults filled in', () => {
    const out = flockEntries(loc([
      { species: 'cangoo', behavior: 'flyover', zone: 'sky', count: 14, everySeconds: [150, 360], formation: 'vee' },
      { species: 'mallar3', behavior: 'flyover', zone: 'sky', count: 6, plumage: 'female' },
      { species: 'y00475', behavior: 'swim', zone: 'w', count: 2 },
    ]), makeRng(1))
    expect(out).toEqual([
      { species: 'cangoo', variant: undefined, zone: 'sky', count: 14, everySeconds: [150, 360], formation: 'vee', groupKey: 'cast0' },
      { species: 'mallar3', variant: 'female', zone: 'sky', count: 6, everySeconds: DEFAULT_FLOCK_EVERY, formation: 'line', groupKey: 'cast1' },
    ])
  })
})
```

Add the Review Focus 3 test to `src/game/identifyController.test.ts` (it should pass without controller changes; it pins the behavior a flock relies on):

```ts
  it('records a correct guess even if the bird left the registry mid-session (a flock that flew on)', () => {
    const store = makeStore({ target: TARGET })
    const entries: Record<number, { species: string; identified: boolean }> = { 1: { species: 'y00475', identified: false } }
    const { controller, recordCalls } = makeController(store, { get: (id: number) => entries[id] })

    controller.pressIdentify()
    delete entries[1]
    expect(() => controller.guess('y00475')).not.toThrow()
    expect(recordCalls).toEqual([{ species: 'y00475', selfIdentified: true, wrongGuesses: 0 }])
    expect(store.get().card).toEqual({ kind: 'correct', species: 'y00475' })
    expect(store.get().identifying).toBeNull()
  })
```

- [ ] **Step 7: Run to verify it fails**

Run: `npx vitest run src/birds/spawn.test.ts src/game`
Expected: spawn FAILs (`flockEntries` not exported); the controller test PASSES.

- [ ] **Step 8: Rewrite the spawner**

`src/birds/spawn.ts`:

```ts
import * as THREE from 'three'
import type { Location, Behavior, PolygonZone, LaneZone } from '../location/schema'
import type { Rng } from '../catalog/types'
import { makeRng } from '../catalog/rng'
import { randomPointInPolygon } from '../location/zones'
import { BEHAVIORS, type BehaviorContext, type BehaviorController } from '../behavior'
import { createFlyover, type Formation, type FlyoverController } from '../behavior/flyover'
import { buildBird } from './procedural'
import { buildPlaceholder } from './placeholder'
import { buildFlockModel, type FlockModel } from './flock'
import { getSpec, hasSpec } from './species'
import { defaultPose, type PoseState, type BirdModel } from './model'
import type { BirdRegistry } from './registry'
import type { Wind } from '../world/wind'
import type { RippleBuffer } from '../world/ripples'
import type { WorldModule } from '../world/scene'

/** Things the spawner reports outward (audio hooks); every callback is optional. */
export interface SpawnEvents {
  flockStart?(key: string, species: string): void
  flockMove?(key: string, x: number, y: number, z: number): void
  flockEnd?(key: string): void
  effect?(name: 'splash' | 'flap', x: number, y: number, z: number): void
}

export interface SpawnDeps {
  registry: BirdRegistry
  wind: Wind
  ground: (x: number, z: number) => number
  ripples: RippleBuffer
  seed: number
  events?: SpawnEvents
}

export interface Individual { species: string; variant?: string; behavior: Behavior; zone: string; groupKey: string }
export interface FlockEntry { species: string; variant?: string; zone: string; count: number; everySeconds: [number, number]; formation: Formation; groupKey: string }

export const DEFAULT_FLOCK_EVERY: [number, number] = [120, 300]

function pickVariant(species: string, plumage: string | undefined, rng: Rng): string | undefined {
  const variants = hasSpec(species) ? Object.keys(getSpec(species).variants) : []
  if (plumage === 'mixed' && variants.length > 0) return variants[Math.floor(rng() * variants.length)]
  if (plumage && plumage !== 'mixed' && variants.includes(plumage)) return plumage
  return undefined
}

/** Per-bird behaviors, one record per individual. Flyovers are flocks: see flockEntries. */
export function expandCast(loc: Location, rng: Rng): Individual[] {
  const out: Individual[] = []
  loc.cast.forEach((entry, i) => {
    if (entry.behavior === 'flyover') return
    if (!(entry.behavior in BEHAVIORS)) {
      console.warn(`cast[${i}] ${entry.species}: behavior ${entry.behavior} is not implemented yet; skipped`)
      return
    }
    for (let n = 0; n < entry.count; n++) {
      out.push({ species: entry.species, variant: pickVariant(entry.species, entry.plumage, rng), behavior: entry.behavior, zone: entry.zone, groupKey: `cast${i}` })
    }
  })
  return out
}

/** Flyover entries, one record per flock. */
export function flockEntries(loc: Location, rng: Rng): FlockEntry[] {
  const out: FlockEntry[] = []
  loc.cast.forEach((entry, i) => {
    if (entry.behavior !== 'flyover') return
    out.push({
      species: entry.species, variant: pickVariant(entry.species, entry.plumage, rng), zone: entry.zone, count: entry.count,
      everySeconds: entry.everySeconds ?? DEFAULT_FLOCK_EVERY, formation: entry.formation ?? 'line', groupKey: `cast${i}`,
    })
  })
  return out
}

const STANDING: Behavior[] = ['wade', 'probe']

interface LiveBird { controller: BehaviorController; pose: PoseState; model: BirdModel }
interface LiveFlock {
  key: string; species: string; variant?: string
  model: FlockModel; controller: FlyoverController; pose: PoseState
  /** registry ids and targeting proxies, present only while crossing */
  ids: number[]; proxies: THREE.Group[]
}

export function spawnCast(loc: Location, deps: SpawnDeps): WorldModule & { object: THREE.Group } {
  const object = new THREE.Group()
  const rng = makeRng(deps.seed)
  const groups = new Map<string, NonNullable<BehaviorContext['group']>>()
  const birds: LiveBird[] = []
  const flocks: LiveFlock[] = []

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
    birds.push({ controller, pose: defaultPose(), model })
  }

  for (const fe of flockEntries(loc, rng)) {
    const lane = loc.zones[fe.zone] as LaneZone
    if (!hasSpec(fe.species)) { console.warn(`flock ${fe.species}: no species spec; skipped`); continue }
    const spec = getSpec(fe.species)
    const model = buildFlockModel(spec, fe.count, fe.variant)
    model.object.visible = false
    object.add(model.object)
    const controller = createFlyover(lane, makeRng(Math.floor(rng() * 1e9)), {
      count: fe.count, formation: fe.formation, everySeconds: fe.everySeconds, wingbeatHz: spec.wingbeatHz,
    })
    flocks.push({ key: fe.groupKey, species: fe.species, variant: fe.variant, model, controller, pose: defaultPose(), ids: [], proxies: [] })
  }

  function enter(f: LiveFlock): void {
    f.model.object.visible = true
    for (let i = 0; i < f.model.count; i++) {
      const proxy = new THREE.Group()
      const inst = deps.registry.add({
        species: f.species, variant: f.variant, behavior: 'flyover',
        model: { group: proxy, center: new THREE.Vector3(), radius: f.model.radius },
      })
      f.ids.push(inst.id)
      f.proxies.push(proxy)
    }
    deps.events?.flockStart?.(f.key, f.species)
  }

  function exit(f: LiveFlock): void {
    f.model.object.visible = false
    for (const id of f.ids) deps.registry.remove(id)
    f.ids = []
    f.proxies = []
    deps.events?.flockEnd?.(f.key)
  }

  return {
    object,
    update(dt) {
      for (const b of birds) {
        b.controller.update(dt, b.pose)
        b.model.group.position.set(b.controller.x, b.controller.y, b.controller.z)
        b.model.group.rotation.y = b.controller.heading
        b.model.pose(b.pose)
      }
      for (const f of flocks) {
        const was = f.controller.state
        f.controller.update(dt)
        if (f.controller.state === 'crossing') {
          if (was === 'waiting') enter(f)
          f.pose.wingSpread = 1
          f.pose.neckExtend = 1
          f.pose.lean.set(0, 0, 0)
          f.controller.members.forEach((m, i) => {
            f.pose.wingPhase = m.wingPhase
            f.model.setMember(i, m.x, m.y, m.z, m.heading, f.pose)
            const p = f.proxies[i]!
            p.position.set(m.x, m.y, m.z)
            p.updateMatrixWorld()
          })
          f.model.commit()
          deps.events?.flockMove?.(f.key, f.controller.x, f.controller.y, f.controller.z)
        } else if (was === 'crossing') {
          exit(f)
        }
      }
    },
  }
}
```

- [ ] **Step 9: Run tests**

Run: `npx vitest run src/birds src/game src/location && npm run typecheck`
Expected: PASS. If typecheck complains that `main.tsx`'s targeting uses `b.model.center`/`radius`/`group`, those exist on `TargetModel`; nothing else in main reads the model.

- [ ] **Step 10: Cast the geese and wire flock audio**

In `data/locations/lake.json`, append to `cast`:

```json
    { "species": "cangoo",  "behavior": "flyover", "zone": "sky", "count": 14, "everySeconds": [150, 360], "formation": "vee" }
```

In `src/main.tsx`, before `spawnCast` (the engine and effects already exist by then):

```ts
import type { SpawnEvents } from './birds/spawn'
import type { Voice } from './audio/engine'
import { pickClip } from './audio/clips'
// ...
const flockRng = makeRng(77)
const flockVoices = new Map<string, Voice>()
const flockPositions = new Map<string, THREE.Vector3>()
const spawnEvents: SpawnEvents = {
  flockStart(key, species) {
    const clip = pickClip(findBird(species), 'call', flockRng)
    if (!clip || !engine.unlocked) return
    engine.load('/' + clip.file).then(buffer => {
      const at = flockPositions.get(key)
      if (!at) return                                   // the flock already left
      flockVoices.get(key)?.stop()
      flockVoices.set(key, engine.playAt(buffer, at, 'calls', { loop: true, refDistance: 40, maxDistance: 900, volume: 0.8 }))
    }).catch(err => console.warn(`flock ${species}: ${String(err)}`))
  },
  flockMove(key, x, y, z) {
    let p = flockPositions.get(key)
    if (!p) { p = new THREE.Vector3(); flockPositions.set(key, p) }
    p.set(x, y, z)
    flockVoices.get(key)?.follow(p)
  },
  flockEnd(key) {
    flockVoices.get(key)?.stop()
    flockVoices.delete(key)
    flockPositions.delete(key)
  },
  effect: (name, x, y, z) => effects.playAt(name, new THREE.Vector3(x, y, z)),
}
world.add(spawnCast(loc, { registry, wind: world.wind, ground: (x, z) => heightfield.sample(x, z), ripples, seed: 42, events: spawnEvents }))
```

- [ ] **Step 11: Visual and aural check**

Run: `npm run dev`, Begin. The first V may come within a minute or two (the interval is randomised; to hurry it, temporarily set `everySeconds` to `[5, 10]` and put it back). Expected: fourteen geese in a V, 40 to 80 m up, crossing the far sky right to left or left to right, wings beating out of step, a slow rise and fall in each bird, honking that pans across and fades as they go. The dev overlay's `birds` count rises by 14 while they cross and drops back. Binoculars on the leader: a target with "Identify"; a correct guess records a Canada Goose. Frame rate unchanged (about a dozen extra draw calls).

- [ ] **Step 12: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: instanced flyover flocks with formation, registry membership, and a moving call source"
```

---

### Task 11: Perch and hover behaviors; the kingfisher, the blackbird, and the wren

**Files:**
- Create: `src/behavior/perch.ts`, `src/behavior/perch.test.ts`, `src/behavior/hover.ts`, `src/behavior/hover.test.ts`
- Modify: `src/behavior/types.ts`, `src/behavior/index.ts`, `src/behavior/swim.ts`, `src/behavior/wade.ts`, `src/behavior/probe.ts`, `src/birds/spawn.ts`, `src/birds/spawn.test.ts`, `data/locations/lake.json`, `src/main.tsx`

**Interfaces:**
- Consumes: `BehaviorContext` (extended below), `turnToward`, `approach`, `PoseState`, `PointZone`, `Vec3`.
- Produces:

```ts
// types.ts
export interface BehaviorContext {
  zone: Zone                                   // was PolygonZone
  rng: Rng
  wind: () => { dirX: number; dirZ: number; effective: number }
  ground: (x: number, z: number) => number
  onRipple?: (x: number, z: number) => void
  group?: { targetX: number; targetZ: number; retargetAt: number }
  perch?: Vec3                                 // world-space perch for perch and hover
  wingbeatHz?: number                          // default 5
  onEvent?: (name: 'splash' | 'flap', x: number, y: number, z: number) => void
}
export function polygonOf(ctx: BehaviorContext): PolygonZone   // throws if the zone is not a polygon
export function perchOf(ctx: BehaviorContext): Vec3            // throws if no perch was given
// perch.ts
export const LOOP_SECONDS = 6
export function createPerch(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController   // states: sit | shuffle | stretch | loop
// hover.ts
export const WATER_Y = 0
export function createHover(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController   // states: perch | flyout | hover | dive | surface | return
// index.ts: BEHAVIORS gains perch and hover
// spawn.ts: SpawnDeps gains  perches?: Record<string, Vec3>
```

- [ ] **Step 1: Write the failing tests**

`src/behavior/perch.test.ts`:

```ts
import { createPerch, LOOP_SECONDS } from './perch'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import type { BehaviorContext } from './types'

const PERCH: [number, number, number] = [6.7, 7.25, -7]
const ctx = (seed: number, events: string[] = []): BehaviorContext => ({
  zone: { kind: 'point', position: [5, 3, -7] }, perch: PERCH, rng: makeRng(seed), wingbeatHz: 7,
  wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: () => 0,
  onEvent: name => events.push(name),
})

describe('perch', () => {
  it('sits exactly on the perch to begin with', () => {
    const c = createPerch(ctx(1), 0, 0)
    c.update(1 / 30, defaultPose())
    expect([c.x, c.y, c.z]).toEqual(PERCH)
    expect(c.state).toBe('sit')
  })
  it('visits every state over a long enough watch', () => {
    const c = createPerch(ctx(2), 0, 0)
    const states = new Set<string>()
    for (let t = 0; t < 900; t += 1 / 30) { c.update(1 / 30, defaultPose()); states.add(c.state) }
    expect(states).toEqual(new Set(['sit', 'shuffle', 'stretch', 'loop']))
  })
  it('a loop flight lifts off with wings spread, flaps, and lands back on the perch', () => {
    const events: string[] = []
    const c = createPerch(ctx(3, events), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'loop' && guard++ < 100000) c.update(1 / 30, pose)
    expect(c.state).toBe('loop')
    let maxY = -Infinity, maxSpread = 0, far = 0
    const phases = new Set<number>()
    while (c.state === 'loop') {
      c.update(1 / 30, pose)
      maxY = Math.max(maxY, c.y); maxSpread = Math.max(maxSpread, pose.wingSpread)
      far = Math.max(far, Math.hypot(c.x - PERCH[0], c.z - PERCH[2]))
      phases.add(Math.round(pose.wingPhase * 10))
    }
    expect(maxY).toBeGreaterThan(PERCH[1] + 1.5)
    expect(maxSpread).toBeGreaterThan(0.95)
    expect(far).toBeGreaterThan(6)
    expect(phases.size).toBeGreaterThan(5)
    expect(c.state).toBe('sit')
    expect(c.x).toBeCloseTo(PERCH[0], 6)
    expect(c.y).toBeCloseTo(PERCH[1], 6)
    expect(c.z).toBeCloseTo(PERCH[2], 6)
    expect(events).toEqual(['flap'])
  })
  it('never leaves the perch while sitting, shuffling, or stretching', () => {
    const c = createPerch(ctx(4), 0, 0)
    for (let t = 0; t < 300; t += 1 / 30) {
      c.update(1 / 30, defaultPose())
      if (c.state !== 'loop') expect([c.x, c.y, c.z]).toEqual(PERCH)
    }
  })
  it('throws without a perch', () => {
    expect(() => createPerch({ ...ctx(5), perch: undefined }, 0, 0)).toThrow(/perch/)
  })
  it('is deterministic per seed', () => {
    const a = createPerch(ctx(6), 0, 0), b = createPerch(ctx(6), 0, 0)
    for (let i = 0; i < 3000; i++) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect([a.x, a.y, a.z, a.state]).toEqual([b.x, b.y, b.z, b.state])
  })
})

describe('LOOP_SECONDS', () => {
  it('is a few seconds', () => { expect(LOOP_SECONDS).toBeGreaterThan(3) })
})
```

`src/behavior/hover.test.ts`:

```ts
import { createHover, WATER_Y } from './hover'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import type { BehaviorContext } from './types'

const PERCH: [number, number, number] = [23.7, 4.25, -48]
const ctx = (seed: number, events: string[] = [], ripples: number[] = []): BehaviorContext => ({
  zone: { kind: 'point', position: [22, 0, -48] }, perch: PERCH, rng: makeRng(seed), wingbeatHz: 6,
  wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: () => -2,
  onEvent: name => events.push(name), onRipple: () => ripples.push(1),
})

describe('hover', () => {
  it('starts on the perch and cycles through every state', () => {
    const c = createHover(ctx(1), 0, 0)
    c.update(1 / 30, defaultPose())
    expect([c.x, c.y, c.z]).toEqual(PERCH)
    const states = new Set<string>()
    for (let t = 0; t < 900; t += 1 / 30) { c.update(1 / 30, defaultPose()); states.add(c.state) }
    expect(states).toEqual(new Set(['perch', 'flyout', 'hover', 'dive', 'surface', 'return']))
  })
  it('hovers within reach of the perch at a sensible height, then dives to the water', () => {
    const events: string[] = [], ripples: number[] = []
    const c = createHover(ctx(2, events, ripples), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'hover' && guard++ < 100000) c.update(1 / 30, pose)
    const d = Math.hypot(c.x - PERCH[0], c.z - PERCH[2])
    expect(d).toBeGreaterThanOrEqual(5.5)
    expect(d).toBeLessThanOrEqual(12.5)
    expect(c.y).toBeGreaterThan(WATER_Y + 5.5)
    expect(c.y).toBeLessThan(WATER_Y + 9.5)
    expect(pose.wingSpread).toBeGreaterThan(0.95)
    const hx = c.x, hz = c.z
    let minY = Infinity
    while (c.state !== 'return' && guard++ < 100000) { c.update(1 / 30, pose); minY = Math.min(minY, c.y) }
    expect(minY).toBeCloseTo(WATER_Y, 6)
    expect(Math.hypot(c.x - hx, c.z - hz)).toBeLessThan(0.5)     // dives straight down
    expect(events).toEqual(['splash'])
    expect(ripples).toHaveLength(1)
  })
  it('returns to the exact perch point and sits again', () => {
    const c = createHover(ctx(3), 0, 0)
    let guard = 0
    while (c.state !== 'return' && guard++ < 100000) c.update(1 / 30, defaultPose())
    while (c.state === 'return' && guard++ < 100000) c.update(1 / 30, defaultPose())
    expect(c.state).toBe('perch')
    expect(c.x).toBeCloseTo(PERCH[0], 6)
    expect(c.y).toBeCloseTo(PERCH[1], 6)
    expect(c.z).toBeCloseTo(PERCH[2], 6)
  })
  it('never goes below the water', () => {
    const c = createHover(ctx(4), 0, 0)
    for (let t = 0; t < 600; t += 1 / 30) { c.update(1 / 30, defaultPose()); expect(c.y).toBeGreaterThanOrEqual(WATER_Y) }
  })
  it('throws without a perch', () => {
    expect(() => createHover({ ...ctx(5), perch: undefined }, 0, 0)).toThrow(/perch/)
  })
  it('is deterministic per seed', () => {
    const a = createHover(ctx(6), 0, 0), b = createHover(ctx(6), 0, 0)
    for (let i = 0; i < 6000; i++) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect([a.x, a.y, a.z, a.state]).toEqual([b.x, b.y, b.z, b.state])
  })
})
```

Add to `src/birds/spawn.test.ts`: give the `loc` helper a point zone and test that perch and hover expand:

```ts
  zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] }, snag: { kind: 'point', position: [1, 2, 3] }, sky: { kind: 'lane', from: [0, 0, 0], to: [1, 0, 0], altitude: [1, 2] } },
```

```ts
  it('expands perch and hover entries like any other individual', () => {
    const out = expandCast(loc([
      { species: 'belkin1', behavior: 'hover', zone: 'snag', count: 1, plumage: 'female' },
      { species: 'rewbla', behavior: 'perch', zone: 'snag', count: 2, plumage: 'male' },
    ]), makeRng(6))
    expect(out.map(b => [b.behavior, b.variant])).toEqual([['hover', 'female'], ['perch', 'male'], ['perch', 'male']])
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/behavior src/birds/spawn.test.ts`
Expected: FAIL (modules not found; the spawn test's `loc` change compiles but the new test fails since perch is not in `BEHAVIORS`).

- [ ] **Step 3: Extend the context and make the polygon behaviors explicit**

`src/behavior/types.ts`:

```ts
import type { Zone, PolygonZone, Vec3 } from '../location/schema'
import type { Rng } from '../catalog/types'
import type { PoseState } from '../birds/model'

export interface BehaviorContext {
  zone: Zone
  rng: Rng
  wind: () => { dirX: number; dirZ: number; effective: number }
  ground: (x: number, z: number) => number
  onRipple?: (x: number, z: number) => void
  group?: { targetX: number; targetZ: number; retargetAt: number }
  /** world-space perch point for perch and hover; the spawner resolves it from the point zone */
  perch?: Vec3
  /** for behaviors that flap; default 5 */
  wingbeatHz?: number
  onEvent?: (name: 'splash' | 'flap', x: number, y: number, z: number) => void
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

export function polygonOf(ctx: BehaviorContext): PolygonZone {
  if (ctx.zone.kind !== 'polygon') throw new Error(`behavior needs a polygon zone, got ${ctx.zone.kind}`)
  return ctx.zone
}

export function perchOf(ctx: BehaviorContext): Vec3 {
  if (!ctx.perch) throw new Error('behavior needs a perch point')
  return ctx.perch
}

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

In each of `swim.ts`, `wade.ts`, `probe.ts`: import `polygonOf` from `./types`, add `const zone = polygonOf(ctx)` as the first line of the factory, and replace every `ctx.zone.points` with `zone.points` (swim has 4 uses, wade 2, probe 3). Their tests need no change: a `{ kind: 'polygon' as const, points }` literal is a `Zone`.

`src/behavior/index.ts`:

```ts
import type { BehaviorFactory } from './types'
import { createSwim } from './swim'
import { createWade } from './wade'
import { createProbe } from './probe'
import { createPerch } from './perch'
import { createHover } from './hover'

export const BEHAVIORS: Record<'swim' | 'wade' | 'probe' | 'perch' | 'hover', BehaviorFactory> = {
  swim: createSwim,
  wade: createWade,
  probe: createProbe,
  perch: createPerch,
  hover: createHover,
}

export type { BehaviorContext, BehaviorController, BehaviorFactory } from './types'
export { turnToward, approach, polygonOf, perchOf } from './types'
```

- [ ] **Step 4: Perch**

`src/behavior/perch.ts`:

```ts
import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach, perchOf } from './types'
import type { PoseState } from '../birds/model'

type State = 'sit' | 'shuffle' | 'stretch' | 'loop'

export const LOOP_SECONDS = 6
const LOOP_RISE = 2.5
const TWO_PI = Math.PI * 2

/** Sit on a perch; shuffle, stretch, and now and then fly a short loop and land back on it. */
export function createPerch(ctx: BehaviorContext, _startX: number, _startZ: number): BehaviorController {
  const [px, py, pz] = perchOf(ctx)
  const hz = ctx.wingbeatHz ?? 5
  let x = px, y = py, z = pz, heading = ctx.rng() * TWO_PI
  let state: State = 'sit'
  let timer = 8 + ctx.rng() * 30
  let targetHeading = heading
  let loopT = 0, loopR = 5, loopDir: 1 | -1 = 1, cx = 0, cz = 0, a0 = 0

  function next(): void {
    if (state !== 'sit') {
      state = 'sit'; timer = 10 + ctx.rng() * 30
      x = px; y = py; z = pz
      return
    }
    const r = ctx.rng()
    if (r < 0.5) { state = 'shuffle'; timer = 1.5; targetHeading = heading + (ctx.rng() - 0.5) * 1.2 }
    else if (r < 0.8) { state = 'stretch'; timer = 2 }
    else {
      state = 'loop'; timer = LOOP_SECONDS; loopT = 0
      loopR = 4 + ctx.rng() * 4
      loopDir = ctx.rng() < 0.5 ? 1 : -1
      // the circle's centre sits off to one side, so the path starts and ends at the perch
      // and its first tangent points along the bird's heading
      cx = px + Math.sin(heading) * loopR * loopDir
      cz = pz + Math.cos(heading) * loopR * loopDir
      a0 = Math.atan2(pz - cz, px - cx)
      ctx.onEvent?.('flap', px, py, pz)
    }
  }

  return {
    name: 'perch',
    get state() { return state },
    get x() { return x }, get y() { return y }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      timer -= dt
      if (timer <= 0) next()
      if (state === 'loop') {
        loopT += dt
        const u = Math.min(1, loopT / LOOP_SECONDS)
        const a = a0 + loopDir * u * TWO_PI
        const nx = cx + Math.cos(a) * loopR, nz = cz + Math.sin(a) * loopR
        if (Math.hypot(nx - x, nz - z) > 1e-6) heading = Math.atan2(-(nz - z), nx - x)
        x = nx; z = nz
        y = py + Math.sin(u * Math.PI) * LOOP_RISE
        pose.wingSpread = approach(pose.wingSpread, 1, 10, dt)
        pose.wingPhase = (pose.wingPhase + dt * hz) % 1
        pose.neckExtend = approach(pose.neckExtend, 0.9, 6, dt)
        pose.lean.x = approach(pose.lean.x, 0, 6, dt)
        pose.tailTilt = approach(pose.tailTilt, 0, 6, dt)
        return
      }
      x = px; y = py; z = pz
      pose.wingPhase = 0
      if (state === 'shuffle') {
        heading = turnToward(heading, targetHeading, 2 * dt)
        pose.tailTilt = Math.sin(timer * 12) * 0.2
        pose.wingSpread = approach(pose.wingSpread, 0, 8, dt)
      } else if (state === 'stretch') {
        pose.wingSpread = approach(pose.wingSpread, timer > 1 ? 0.7 : 0, 6, dt)
        pose.tailTilt = approach(pose.tailTilt, 0, 6, dt)
      } else {
        pose.wingSpread = approach(pose.wingSpread, 0, 8, dt)
        pose.tailTilt = approach(pose.tailTilt, 0, 6, dt)
      }
      pose.neckExtend = approach(pose.neckExtend, 0.4, 2, dt)
      pose.lean.x = approach(pose.lean.x, 0, 3, dt)
      pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
    },
  }
}
```

- [ ] **Step 5: Hover**

`src/behavior/hover.ts`:

```ts
import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach, perchOf } from './types'
import type { PoseState } from '../birds/model'

type State = 'perch' | 'flyout' | 'hover' | 'dive' | 'surface' | 'return'

/** the lake surface; the water mesh sits at y = 0 */
export const WATER_Y = 0
const HOVER_RADIUS: [number, number] = [6, 12]
const HOVER_ALT: [number, number] = [6, 9]
const FLY_SPEED = 7
const DIVE_SPEED = 14
const TWO_PI = Math.PI * 2

/** The kingfisher: perch, fly out over the water, hover, plunge, surface, and fly back to the perch. */
export function createHover(ctx: BehaviorContext, _startX: number, _startZ: number): BehaviorController {
  const [px, py, pz] = perchOf(ctx)
  const hz = ctx.wingbeatHz ?? 6
  let x = px, y = py, z = pz, heading = ctx.rng() * TWO_PI
  let state: State = 'perch'
  let timer = 20 + ctx.rng() * 50
  let tx = 0, ty = 0, tz = 0, bob = 0
  const between = ([lo, hi]: [number, number]) => lo + ctx.rng() * (hi - lo)

  /** Straight-line flight toward a point; true on arrival. */
  function flyToward(dt: number, gx: number, gy: number, gz: number, speed: number): boolean {
    const dx = gx - x, dy = gy - y, dz = gz - z
    const d = Math.hypot(dx, dy, dz)
    if (d < 0.3 || d <= speed * dt) { x = gx; y = gy; z = gz; return true }
    const k = (speed * dt) / d
    x += dx * k; y += dy * k; z += dz * k
    if (Math.hypot(dx, dz) > 1e-3) heading = turnToward(heading, Math.atan2(-dz, dx), 4 * dt)
    return false
  }

  function flapping(pose: PoseState, dt: number, rate = 1): void {
    pose.wingSpread = approach(pose.wingSpread, 1, 10, dt)
    pose.wingPhase = (pose.wingPhase + dt * hz * rate) % 1
  }

  return {
    name: 'hover',
    get state() { return state },
    get x() { return x }, get y() { return y }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      switch (state) {
        case 'perch': {
          timer -= dt
          x = px; y = py; z = pz
          pose.wingSpread = approach(pose.wingSpread, 0, 8, dt)
          pose.wingPhase = 0
          pose.neckExtend = approach(pose.neckExtend, 0.3, 2, dt)
          pose.lean.x = approach(pose.lean.x, 0, 3, dt)
          pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
          if (timer <= 0) {
            const a = ctx.rng() * TWO_PI, r = between(HOVER_RADIUS)
            tx = px + Math.cos(a) * r
            tz = pz + Math.sin(a) * r
            ty = WATER_Y + between(HOVER_ALT)
            state = 'flyout'
          }
          return
        }
        case 'flyout':
          flapping(pose, dt)
          pose.neckExtend = approach(pose.neckExtend, 0.8, 6, dt)
          pose.lean.x = approach(pose.lean.x, 0, 4, dt)
          if (flyToward(dt, tx, ty, tz, FLY_SPEED)) { state = 'hover'; timer = 2 + ctx.rng() * 3; bob = 0 }
          return
        case 'hover':
          timer -= dt
          bob += dt
          y = ty + Math.sin(bob * 3) * 0.15
          flapping(pose, dt, 1.6)
          pose.neckExtend = approach(pose.neckExtend, 0.8, 6, dt)
          pose.lean.x = approach(pose.lean.x, 0.35, 4, dt)       // looking down
          if (timer <= 0) state = 'dive'
          return
        case 'dive':
          pose.wingSpread = approach(pose.wingSpread, 0, 12, dt)
          pose.wingPhase = 0
          pose.lean.x = approach(pose.lean.x, 1.3, 10, dt)       // head first
          pose.neckExtend = approach(pose.neckExtend, 1, 10, dt)
          y -= DIVE_SPEED * dt
          if (y <= WATER_Y) {
            y = WATER_Y
            ctx.onEvent?.('splash', x, WATER_Y, z)
            ctx.onRipple?.(x, z)
            state = 'surface'
            timer = 0.5
          }
          return
        case 'surface':
          timer -= dt
          y = WATER_Y
          pose.lean.x = approach(pose.lean.x, 0, 6, dt)
          flapping(pose, dt)
          if (timer <= 0) state = 'return'
          return
        case 'return':
          flapping(pose, dt)
          pose.neckExtend = approach(pose.neckExtend, 0.6, 4, dt)
          pose.lean.x = approach(pose.lean.x, -0.2, 4, dt)        // climbing
          if (flyToward(dt, px, py, pz, FLY_SPEED)) {
            state = 'perch'
            timer = 20 + ctx.rng() * 50
            heading = ctx.rng() * TWO_PI
          }
      }
    },
  }
}
```

- [ ] **Step 6: Run the behavior tests**

Run: `npx vitest run src/behavior`
Expected: PASS (perch, hover, and the three unchanged suites).

- [ ] **Step 7: Point zones in the spawner**

In `src/birds/spawn.ts`:

```ts
import type { Location, Behavior, LaneZone, Vec3 } from '../location/schema'
// SpawnDeps gains:
  /** world-space perch points by zone name; point zones not listed here perch at their own position */
  perches?: Record<string, Vec3>
```

Replace the per-individual loop body's first lines:

```ts
  for (const ind of expandCast(loc, rng)) {
    const zone = loc.zones[ind.zone]!
    const point = zone.kind === 'point'
    const perch: Vec3 | undefined = point ? (deps.perches?.[ind.zone] ?? zone.position) : undefined
    const model = hasSpec(ind.species)
      ? buildBird(getSpec(ind.species), ind.variant)
      : buildPlaceholder(ind.species, STANDING.includes(ind.behavior) ? 'standing' : point ? 'perched' : 'swimming')
    if (!groups.has(ind.groupKey)) groups.set(ind.groupKey, { targetX: 0, targetZ: 0, retargetAt: 0 })
    const ctx: BehaviorContext = {
      zone,
      rng: makeRng(Math.floor(rng() * 1e9)),
      wind: () => ({ dirX: deps.wind.state.dir.x, dirZ: deps.wind.state.dir.y, effective: deps.wind.effective() }),
      ground: deps.ground,
      onRipple: (x, z) => deps.ripples.spawn(x, z),
      group: ind.behavior === 'probe' ? groups.get(ind.groupKey) : undefined,
      perch,
      wingbeatHz: hasSpec(ind.species) ? getSpec(ind.species).wingbeatHz : 5,
      onEvent: (name, x, y, z) => deps.events?.effect?.(name, x, y, z),
    }
    const [sx, sz] = zone.kind === 'polygon' ? randomPointInPolygon(zone.points, rng) : [perch![0], perch![2]]
    // ... controller, registry.add, object.add, birds.push unchanged
```

Drop the now-unused `PolygonZone` import.

- [ ] **Step 8: Cast the kingfisher, the blackbird, and the wren**

In `data/locations/lake.json` add two point zones after `"snag"`:

```json
    "reed-perch":   { "kind": "point",   "position": [-8, 1.9, -5] },
    "reed-perch-2": { "kind": "point",   "position": [-13, 1.8, -9] },
```

and three cast entries after the killdeer:

```json
    { "species": "belkin1", "behavior": "hover", "zone": "snag",         "count": 1, "plumage": "female" },
    { "species": "rewbla",  "behavior": "perch", "zone": "reed-perch",   "count": 1, "plumage": "male" },
    { "species": "marwre",  "behavior": "perch", "zone": "reed-perch-2", "count": 1 },
```

In `src/main.tsx` collect the snag's perch and pass it through:

```ts
import type { Vec3 } from './location'
// replace the snag block:
const perches: Record<string, Vec3> = {}
const snagZone = loc.zones['snag']
if (snagZone?.kind === 'point') {
  const snag = createSnag(snagZone.position)
  world.scene.add(snag.object)
  perches['snag'] = [snag.perchPoint.x, snag.perchPoint.y, snag.perchPoint.z]
}
// and in the spawnCast call add:  perches
```

- [ ] **Step 9: Run tests**

Run: `npx vitest run src/birds src/behavior src/location && npm run typecheck`
Expected: PASS.

- [ ] **Step 10: Visual and aural check**

Run: `npm run dev`, Begin. Telescope on the snag: a kingfisher sits on the branch. Within a minute or so it flies out over the water, hangs beating fast with its head down, folds and drops, a splash sound from that spot with a ripple ring, then climbs back to the branch. Binoculars on the reed bed to the left: a black bird with a red shoulder on one reed top, a tiny brown wren with a cocked tail on another; both shuffle and stretch; occasionally one loops out and back with a flutter of wing-flap sound. If a reed perch floats above or sinks into the reeds, adjust its `position[1]` in `lake.json`.

- [ ] **Step 11: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: perch and hover behaviors; kingfisher on the snag, blackbird and wren in the reeds"
```

---
### Task 12: Settings

**Files:**
- Create: `src/game/settings.ts`, `src/game/settings.test.ts`, `src/ui/SettingsPanel.tsx`
- Modify: `src/ui/App.tsx`, `src/ui/FieldGuide.tsx`, `src/ui/ui.css`, `src/main.tsx`

**Interfaces:**
- Consumes: `LookControls.sensitivity` (public field, default `0.0022`), `AudioEngine.setMasterVolume`/`setLayerVolume`, `emptyLifeList`, `LifeListStorage`.
- Produces:

```ts
export interface Settings { version: 1; sensitivity: number; volumes: { master: number; ambience: number; calls: number; effects: number } }
export const DEFAULT_SETTINGS: Settings
export const SENSITIVITY_RANGE: [number, number]        // [0.3, 3], a multiplier on the base
export const BASE_SENSITIVITY = 0.0022
export function sanitizeSettings(x: unknown): Settings
export interface SettingsStorage { load(): Settings; save(s: Settings): boolean }
export function createSettingsStorage(storage: Storage | null, key?: string): SettingsStorage
export interface SettingsTargets { look: { sensitivity: number }; engine: { setMasterVolume(v: number): void; setLayerVolume(layer: 'ambience' | 'calls' | 'effects', v: number): void } }
export function applySettings(s: Settings, t: SettingsTargets): void
// SettingsPanel.tsx
export function SettingsPanel(p: { settings: Settings; persistent: boolean; onChange: (s: Settings) => void; onResetLifeList: () => void; onClose: () => void }): JSX.Element
```

The spec's settings: mouse sensitivity, volume per layer, reset life list. Stored like the life list, keyed by a schema version, sanitized on load (Review Focus 4).

- [ ] **Step 1: Write the failing tests**

`src/game/settings.test.ts`:

```ts
import { sanitizeSettings, DEFAULT_SETTINGS, createSettingsStorage, applySettings, BASE_SENSITIVITY } from './settings'

function fakeStorage(initial: Record<string, string> = {}, opts: { throwOnSet?: boolean } = {}): Storage {
  const m = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { if (opts.throwOnSet) throw new Error('quota'); m.set(k, v) },
    removeItem: (k: string) => { m.delete(k) },
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size },
  } as Storage
}

describe('sanitizeSettings', () => {
  it('returns defaults for nothing, garbage, or an unknown version', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('nope')).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings({ version: 2, sensitivity: 2 })).toEqual(DEFAULT_SETTINGS)
  })
  it('clamps out-of-range values and replaces non-numbers with defaults', () => {
    const s = sanitizeSettings({ version: 1, sensitivity: -1, volumes: { master: 5, ambience: 'loud', calls: NaN, effects: 0.5 } })
    expect(s.sensitivity).toBe(0.3)
    expect(s.volumes).toEqual({ master: 1, ambience: DEFAULT_SETTINGS.volumes.ambience, calls: DEFAULT_SETTINGS.volumes.calls, effects: 0.5 })
  })
  it('keeps values already in range', () => {
    const s = sanitizeSettings({ version: 1, sensitivity: 1.5, volumes: { master: 0.2, ambience: 0.3, calls: 0.4, effects: 0.6 } })
    expect(s).toEqual({ version: 1, sensitivity: 1.5, volumes: { master: 0.2, ambience: 0.3, calls: 0.4, effects: 0.6 } })
  })
})

describe('createSettingsStorage', () => {
  it('round-trips through storage', () => {
    const st = createSettingsStorage(fakeStorage())
    const s = { ...DEFAULT_SETTINGS, sensitivity: 2 }
    expect(st.save(s)).toBe(true)
    expect(st.load()).toEqual(s)
  })
  it('loads defaults from corrupt JSON and without storage, and reports a failed save', () => {
    expect(createSettingsStorage(fakeStorage({ 'lakewatch.settings': '{bad' })).load()).toEqual(DEFAULT_SETTINGS)
    expect(createSettingsStorage(null).load()).toEqual(DEFAULT_SETTINGS)
    expect(createSettingsStorage(null).save(DEFAULT_SETTINGS)).toBe(false)
    expect(createSettingsStorage(fakeStorage({}, { throwOnSet: true })).save(DEFAULT_SETTINGS)).toBe(false)
  })
})

describe('applySettings', () => {
  it('scales the look sensitivity and pushes every volume to the engine', () => {
    const look = { sensitivity: 0 }
    const calls: [string, number][] = []
    const engine = { setMasterVolume: (v: number) => calls.push(['master', v]), setLayerVolume: (l: string, v: number) => calls.push([l, v]) }
    applySettings({ version: 1, sensitivity: 2, volumes: { master: 0.5, ambience: 0.1, calls: 0.2, effects: 0.3 } }, { look, engine })
    expect(look.sensitivity).toBeCloseTo(BASE_SENSITIVITY * 2, 10)
    expect(calls).toEqual([['master', 0.5], ['ambience', 0.1], ['calls', 0.2], ['effects', 0.3]])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/game/settings.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/game/settings.ts`:

```ts
export interface Settings {
  version: 1
  /** multiplier on BASE_SENSITIVITY */
  sensitivity: number
  volumes: { master: number; ambience: number; calls: number; effects: number }
}

export const DEFAULT_SETTINGS: Settings = { version: 1, sensitivity: 1, volumes: { master: 0.8, ambience: 0.8, calls: 1, effects: 0.8 } }
export const SENSITIVITY_RANGE: [number, number] = [0.3, 3]
export const BASE_SENSITIVITY = 0.0022

function num(x: unknown, fallback: number, lo: number, hi: number): number {
  return typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback
}

/** Whatever was stored, clamped into range, with defaults for anything missing or malformed. */
export function sanitizeSettings(x: unknown): Settings {
  const o = (typeof x === 'object' && x !== null ? x : {}) as { version?: unknown; sensitivity?: unknown; volumes?: unknown }
  if (o.version !== 1) return { ...DEFAULT_SETTINGS, volumes: { ...DEFAULT_SETTINGS.volumes } }
  const v = (typeof o.volumes === 'object' && o.volumes !== null ? o.volumes : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS.volumes
  return {
    version: 1,
    sensitivity: num(o.sensitivity, DEFAULT_SETTINGS.sensitivity, SENSITIVITY_RANGE[0], SENSITIVITY_RANGE[1]),
    volumes: {
      master: num(v['master'], d.master, 0, 1),
      ambience: num(v['ambience'], d.ambience, 0, 1),
      calls: num(v['calls'], d.calls, 0, 1),
      effects: num(v['effects'], d.effects, 0, 1),
    },
  }
}

export interface SettingsStorage {
  load(): Settings
  /** true when written to persistent storage */
  save(s: Settings): boolean
}

const DEFAULT_KEY = 'lakewatch.settings'

export function createSettingsStorage(storage: Storage | null, key = DEFAULT_KEY): SettingsStorage {
  return {
    load() {
      if (!storage) return sanitizeSettings(null)
      try {
        const raw = storage.getItem(key)
        return sanitizeSettings(raw ? JSON.parse(raw) : null)
      } catch {
        return sanitizeSettings(null)
      }
    },
    save(s) {
      if (!storage) return false
      try {
        storage.setItem(key, JSON.stringify(s))
        return true
      } catch {
        return false
      }
    },
  }
}

export interface SettingsTargets {
  look: { sensitivity: number }
  engine: { setMasterVolume(v: number): void; setLayerVolume(layer: 'ambience' | 'calls' | 'effects', v: number): void }
}

export function applySettings(s: Settings, t: SettingsTargets): void {
  t.look.sensitivity = BASE_SENSITIVITY * s.sensitivity
  t.engine.setMasterVolume(s.volumes.master)
  t.engine.setLayerVolume('ambience', s.volumes.ambience)
  t.engine.setLayerVolume('calls', s.volumes.calls)
  t.engine.setLayerVolume('effects', s.volumes.effects)
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/game/settings.test.ts`
Expected: PASS.

- [ ] **Step 5: The panel**

`src/ui/SettingsPanel.tsx` (the component keeps a local copy so sliders follow the pointer; every change is also pushed up through `onChange`):

```tsx
import { useState } from 'preact/hooks'
import type { Settings } from '../game/settings'
import { SENSITIVITY_RANGE } from '../game/settings'

interface Props {
  settings: Settings
  persistent: boolean
  onChange: (s: Settings) => void
  onResetLifeList: () => void
  onClose: () => void
}

export function SettingsPanel({ settings, persistent, onChange, onResetLifeList, onClose }: Props) {
  const [local, setLocal] = useState(settings)
  const [confirmReset, setConfirmReset] = useState(false)
  const update = (next: Settings) => { setLocal(next); onChange(next) }
  const value = (e: Event) => Number((e.target as HTMLInputElement).value)

  const volume = (key: keyof Settings['volumes'], label: string) => (
    <label class="row">
      <span>{label}</span>
      <input type="range" min="0" max="1" step="0.05" value={local.volumes[key]} onInput={e => update({ ...local, volumes: { ...local.volumes, [key]: value(e) } })} />
      <span class="val">{Math.round(local.volumes[key] * 100)}%</span>
    </label>
  )

  return (
    <div class="settings">
      <header>
        <h2>Settings</h2>
        <button onClick={onClose}>Close</button>
      </header>
      {!persistent && <p class="warn">Settings are not being saved in this browser.</p>}
      <label class="row">
        <span>Mouse sensitivity</span>
        <input type="range" min={SENSITIVITY_RANGE[0]} max={SENSITIVITY_RANGE[1]} step="0.1" value={local.sensitivity} onInput={e => update({ ...local, sensitivity: value(e) })} />
        <span class="val">{local.sensitivity.toFixed(1)}×</span>
      </label>
      {volume('master', 'Master volume')}
      {volume('ambience', 'Ambience')}
      {volume('calls', 'Bird calls')}
      {volume('effects', 'Effects')}
      <h3>Life list</h3>
      {confirmReset ? (
        <p class="reset">
          Erase every sighting?{' '}
          <button class="danger" onClick={() => { onResetLifeList(); setConfirmReset(false) }}>Yes, erase it</button>{' '}
          <button onClick={() => setConfirmReset(false)}>Keep it</button>
        </p>
      ) : (
        <button onClick={() => setConfirmReset(true)}>Reset life list…</button>
      )}
    </div>
  )
}
```

Add to `src/ui/ui.css`:

```css
.settings { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(460px, 90vw); padding: 20px 28px; background: #f4efe3; color: #23201a; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,.5); font-family: Georgia, serif; }
.settings header { display: flex; justify-content: space-between; align-items: center; }
.settings .row { display: grid; grid-template-columns: 1fr 180px 48px; gap: 10px; align-items: center; padding: 6px 0; }
.settings .val { text-align: right; color: #6b6150; font-size: 13px; }
.settings h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #7a6f58; margin: 18px 0 6px; }
.settings button { font: inherit; cursor: pointer; }
.settings .danger { background: #b5533c; color: #fff; border: 0; border-radius: 6px; padding: 4px 10px; }
.settings .warn { color: #b5533c; }
```

- [ ] **Step 6: Wire it up**

In `src/ui/FieldGuide.tsx` add `clipVolume?: number` to `Props` and set it on the element in `play`: `a.volume = clipVolume ?? 1`.

In `src/ui/App.tsx` import `{ SettingsPanel } from './SettingsPanel'` and `type { Settings } from '../game/settings'`, then add to `AppDeps`:

```ts
  settings: () => Settings
  settingsPersistent: () => boolean
  onSettingsChange: (s: Settings) => void
  onResetLifeList: () => void
  onCloseSettings: () => void
  clipVolume: () => number
```

pass `clipVolume={d.clipVolume()}` to `FieldGuide`, and render:

```tsx
      {s.settingsOpen && (
        <SettingsPanel settings={d.settings()} persistent={d.settingsPersistent()} onChange={d.onSettingsChange} onResetLifeList={d.onResetLifeList} onClose={d.onCloseSettings} />
      )}
```

In `src/main.tsx`:

```ts
import { createSettingsStorage, applySettings, type Settings } from './game/settings'
import { emptyLifeList } from './game/lifeList'
// next to the life list storage:
const settingsStorage = createSettingsStorage(ls)
let settings = settingsStorage.load()
let settingsPersistent = ls !== null
// in renderApp's <App>:
settings={() => settings}
settingsPersistent={() => settingsPersistent}
onSettingsChange={s => {
  settings = s
  if (!settingsStorage.save(s)) settingsPersistent = false
  if (!unsupported) applySettings(s, { look, engine })
}}
onResetLifeList={() => { lifeList = emptyLifeList(); lifeStorage.save(lifeList) }}
onCloseSettings={() => game.set({ settingsOpen: false })}
clipVolume={() => settings.volumes.master * settings.volumes.calls}
// after look and engine both exist:
applySettings(settings, { look, engine })
```

`look` and `engine` are module-level consts created after `renderApp` is defined but before any handler can run, so referencing them inside the handler compiles and is safe; the `unsupported` guard covers the no-WebGL render where they never exist.

- [ ] **Step 7: Visual check**

Run: `npm run dev`, Begin, press O. Drag Master to 0: silence; back up: sound. Drag Ambience down: the wash goes, calls stay. Sensitivity 3×: the view whips; 0.3×: sluggish. Close, reload, press O: the sliders remember. Reset life list: the first click asks, "Keep it" backs out, "Yes, erase it" empties L. Open the guide and play a clip with Master at 20%: the clip is quiet too.

- [ ] **Step 8: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: settings with sensitivity, per-layer volume, and a guarded life list reset"
```

---

### Task 13: Credits screen

**Files:**
- Create: `src/game/credits.ts`, `src/game/credits.test.ts`, `src/ui/Credits.tsx` (the pure module lives under `game/` so it never shares a base name with the component on a case-insensitive filesystem)
- Modify: `src/ui/App.tsx`, `src/ui/ui.css`, `src/main.tsx`

**Interfaces:**
- Consumes: `Bird`, `AmbienceLayer`, `guideSpecies` output, `loadAmbience`.
- Produces:

```ts
export interface SpeciesCredit { code: string; name: string; photo: { attribution: string; license: string; sourceUrl: string } | null; clips: { xcId: string; type: string; recordist: string; license: string; sourceUrl: string }[] }
export interface AmbienceCredit { id: string; attribution: string; sourceUrl: string | null }
export interface Credits { species: SpeciesCredit[]; ambience: AmbienceCredit[] }
export function creditsFor(guide: readonly Bird[], ambience: readonly AmbienceLayer[]): Credits
export function CreditsScreen(p: { credits: Credits; onClose: () => void }): JSX.Element
```

The spec: "Attribution for every clip appears on the guide entry and a credits screen." The guide already carries it per species; this is the screen, reachable from the title card and with C in play.

- [ ] **Step 1: Write the failing test**

`src/game/credits.test.ts`:

```ts
import { creditsFor } from './credits'
import { loadAmbience } from '../audio/ambienceManifest'
import type { Bird } from '../catalog/types'

const bird = (code: string, photo: Bird['photo'], audio: Bird['audio']): Bird => ({
  speciesCode: code, commonName: code.toUpperCase(), scientificName: 's', family: 'f', familyCommon: 'F', habitats: ['wetland'], frequency: 1, monthly: Array(12).fill(1), audio, photo,
})
const clip = (xcId: string) => ({ file: `media/audio/${xcId}.mp3`, type: 'call' as const, xcId, recordist: 'R', license: 'CC BY-NC-SA 4.0', sourceUrl: `https://xeno-canto.org/${xcId}` })

describe('creditsFor', () => {
  it('lists every clip and photo per species, null for a missing photo', () => {
    const c = creditsFor([
      bird('aaa', { file: 'media/photos/aaa.jpg', attribution: '(c) P', license: 'cc-by-nc', sourceUrl: 'https://inat.org/1' }, [clip('XC1'), clip('XC2')]),
      bird('bbb', null, [clip('XC3')]),
    ], [])
    expect(c.species).toEqual([
      { code: 'aaa', name: 'AAA', photo: { attribution: '(c) P', license: 'cc-by-nc', sourceUrl: 'https://inat.org/1' }, clips: [
        { xcId: 'XC1', type: 'call', recordist: 'R', license: 'CC BY-NC-SA 4.0', sourceUrl: 'https://xeno-canto.org/XC1' },
        { xcId: 'XC2', type: 'call', recordist: 'R', license: 'CC BY-NC-SA 4.0', sourceUrl: 'https://xeno-canto.org/XC2' },
      ] },
      { code: 'bbb', name: 'BBB', photo: null, clips: [{ xcId: 'XC3', type: 'call', recordist: 'R', license: 'CC BY-NC-SA 4.0', sourceUrl: 'https://xeno-canto.org/XC3' }] },
    ])
  })
  it('credits synth ambience without a source link and file ambience with one', () => {
    const c = creditsFor([], [
      ...loadAmbience(),
      { id: 'loons', source: { kind: 'file', file: 'media/ambience/loons.mp3', license: 'CC BY-NC 4.0', sourceUrl: 'https://example.org/loons' }, gain: 0.3, followsWind: false, attribution: 'Someone' },
    ])
    expect(c.ambience.map(a => a.sourceUrl)).toEqual([null, null, null, 'https://example.org/loons'])
    expect(c.ambience[0]!.attribution).toContain('Synthesized')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/game/credits.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/game/credits.ts`:

```ts
import type { Bird } from '../catalog/types'
import type { AmbienceLayer } from '../audio/ambienceManifest'

export interface SpeciesCredit {
  code: string
  name: string
  photo: { attribution: string; license: string; sourceUrl: string } | null
  clips: { xcId: string; type: string; recordist: string; license: string; sourceUrl: string }[]
}
export interface AmbienceCredit { id: string; attribution: string; sourceUrl: string | null }
export interface Credits { species: SpeciesCredit[]; ambience: AmbienceCredit[] }

/** Every attribution the game owes, in guide order. */
export function creditsFor(guide: readonly Bird[], ambience: readonly AmbienceLayer[]): Credits {
  return {
    species: guide.map(b => ({
      code: b.speciesCode,
      name: b.commonName,
      photo: b.photo ? { attribution: b.photo.attribution, license: b.photo.license, sourceUrl: b.photo.sourceUrl } : null,
      clips: b.audio.map(c => ({ xcId: c.xcId, type: c.type, recordist: c.recordist, license: c.license, sourceUrl: c.sourceUrl })),
    })),
    ambience: ambience.map(l => ({ id: l.id, attribution: l.attribution, sourceUrl: l.source.kind === 'file' ? l.source.sourceUrl : null })),
  }
}
```

`src/ui/Credits.tsx`:

```tsx
import type { Credits } from '../game/credits'

interface Props { credits: Credits; onClose: () => void }

export function CreditsScreen({ credits, onClose }: Props) {
  return (
    <div class="credits">
      <header>
        <h2>Credits</h2>
        <button onClick={onClose}>Close</button>
      </header>
      <p>
        Lakewatch is a non-commercial portfolio piece. Bird photos and recordings are used under Creative Commons
        non-commercial licences; each is credited below and on its field guide entry.
      </p>
      <h3>Data</h3>
      <ul>
        <li>Species presence from <a href="https://ebird.org" target="_blank" rel="noreferrer">eBird</a> (Cornell Lab of Ornithology)</li>
        <li>Recordings from <a href="https://xeno-canto.org" target="_blank" rel="noreferrer">xeno-canto</a></li>
        <li>Photos from <a href="https://www.inaturalist.org" target="_blank" rel="noreferrer">iNaturalist</a></li>
      </ul>
      <h3>Ambience</h3>
      <ul>
        {credits.ambience.map(a => (
          <li key={a.id}>{a.id}: {a.sourceUrl ? <a href={a.sourceUrl} target="_blank" rel="noreferrer">{a.attribution}</a> : a.attribution}</li>
        ))}
      </ul>
      <h3>Birds</h3>
      {credits.species.map(s => (
        <section key={s.code}>
          <h4>{s.name}</h4>
          <ul>
            {s.photo && <li>Photo: <a href={s.photo.sourceUrl} target="_blank" rel="noreferrer">{s.photo.attribution}</a> ({s.photo.license})</li>}
            {s.clips.map(c => (
              <li key={c.xcId}>{c.type}: <a href={c.sourceUrl} target="_blank" rel="noreferrer">{c.xcId}</a> by {c.recordist}, {c.license}</li>
            ))}
          </ul>
        </section>
      ))}
      <h3>Made with</h3>
      <ul>
        <li>Three.js, Preact, Vite, zod, ffmpeg</li>
      </ul>
    </div>
  )
}
```

Add to `src/ui/ui.css`:

```css
.credits { position: absolute; inset: 4vh 12vw; padding: 20px 28px; overflow-y: auto; background: #f4efe3; color: #23201a; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,.5); font-family: Georgia, serif; font-size: 14px; }
.credits header { display: flex; justify-content: space-between; align-items: center; }
.credits h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #7a6f58; margin: 18px 0 6px; }
.credits h4 { margin: 10px 0 2px; }
.credits ul { margin: 0; padding-left: 18px; }
.credits a { color: #4c6b3a; }
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/game/credits.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it up**

In `src/ui/App.tsx` import `{ CreditsScreen } from './Credits'` and `type { Credits } from '../game/credits'`, add `credits: Credits` and `onCloseCredits: () => void` to `AppDeps`, and render:

```tsx
      {s.creditsOpen && <CreditsScreen credits={d.credits} onClose={d.onCloseCredits} />}
```

In `src/main.tsx`:

```ts
import { creditsFor } from './game/credits'
// before renderApp:
const credits = creditsFor(guide, loadAmbience())
// in <App>:
credits={credits}
onCloseCredits={() => game.set({ creditsOpen: false })}
```

Note the credits render on the no-WebGL path too (the title's Credits button works there), since `creditsFor` needs only the catalog.

- [ ] **Step 6: Visual check**

Run: `npm run dev`. On the title card, Credits opens the screen over the card; Close returns to it. Begin, press C: the screen; Esc closes. Every guide species appears with its photo credit and three clip lines; the ambience lines say "Synthesized in-game". Links open in a new tab.

- [ ] **Step 7: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: credits screen with every photo, recording, and ambience attribution"
```

---

### Task 14: Dev overlay: zone outlines and flock stats

**Files:**
- Create: `src/hud/zoneOutlines.ts`, `src/hud/zoneOutlines.test.ts`
- Modify: `src/hud/devOverlay.ts`, `src/main.tsx`

**Interfaces:**
- Consumes: `Location`, `Zone`, `Vec3`, `Heightfield.sample`.
- Produces:

```ts
export type Segment = [Vec3, Vec3]
export function zoneSegments(zone: Zone, ground: (x: number, z: number) => number): Segment[]
export function createZoneOutlines(loc: Location, ground: (x: number, z: number) => number): { object: THREE.Group; setVisible(v: boolean): void }
// devOverlay.ts
export function createDevOverlay(root: HTMLElement, onToggle?: (visible: boolean) => void)
```

The spec's dev overlay shows "frame time, bird count, wind state, zone outlines." The first three exist; this adds the outlines, toggled with the overlay.

- [ ] **Step 1: Write the failing tests**

`src/hud/zoneOutlines.test.ts`:

```ts
import * as THREE from 'three'
import { zoneSegments, createZoneOutlines } from './zoneOutlines'
import type { Location } from '../location/schema'

const ground = (x: number, _z: number) => (x < 0 ? -2 : 1)

describe('zoneSegments', () => {
  it('traces a polygon edge by edge, closed, just above the ground or the water', () => {
    const s = zoneSegments({ kind: 'polygon', points: [[-5, 0], [5, 0], [5, 5], [-5, 5]] }, ground)
    expect(s).toHaveLength(4)
    expect(s[3]![1]).toEqual(s[0]![0])                       // closes
    expect(s[0]![0]).toEqual([-5, 0.05, 0])                  // under water: 0.05 above the surface
    expect(s[0]![1]).toEqual([5, 1.05, 0])                   // on land: 0.05 above the ground
  })
  it('marks a point with a three-axis cross', () => {
    const s = zoneSegments({ kind: 'point', position: [1, 2, 3] }, ground)
    expect(s).toHaveLength(3)
    expect(s[0]).toEqual([[0.5, 2, 3], [1.5, 2, 3]])
    expect(s[2]).toEqual([[1, 1.5, 3], [1, 2.5, 3]])
  })
  it('draws a lane as its altitude band', () => {
    const s = zoneSegments({ kind: 'lane', from: [-10, 0, -20], to: [10, 0, -20], altitude: [40, 80] }, ground)
    expect(s).toHaveLength(4)
    expect(s[0]).toEqual([[-10, 40, -20], [10, 40, -20]])
    expect(s[1]).toEqual([[-10, 80, -20], [10, 80, -20]])
  })
})

describe('createZoneOutlines', () => {
  it('builds one hidden LineSegments per zone, named after it', () => {
    const loc = {
      zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] }, snag: { kind: 'point', position: [1, 2, 3] } },
    } as unknown as Location
    const o = createZoneOutlines(loc, ground)
    expect(o.object.visible).toBe(false)
    expect(o.object.children.map(c => c.name).sort()).toEqual(['zone:snag', 'zone:w'])
    expect(o.object.children.every(c => c instanceof THREE.LineSegments)).toBe(true)
    o.setVisible(true)
    expect(o.object.visible).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/hud/zoneOutlines.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/hud/zoneOutlines.ts`:

```ts
import * as THREE from 'three'
import type { Location, Zone, Vec3 } from '../location/schema'

export type Segment = [Vec3, Vec3]

/** Line segments that trace a zone: a polygon's edges on the ground, a cross at a point, a lane's altitude band. */
export function zoneSegments(zone: Zone, ground: (x: number, z: number) => number): Segment[] {
  const lift = (x: number, z: number): Vec3 => [x, Math.max(ground(x, z), 0) + 0.05, z]
  if (zone.kind === 'polygon') {
    return zone.points.map((p, i) => {
      const q = zone.points[(i + 1) % zone.points.length]!
      return [lift(p[0], p[1]), lift(q[0], q[1])] as Segment
    })
  }
  if (zone.kind === 'point') {
    const [x, y, z] = zone.position
    return [
      [[x - 0.5, y, z], [x + 0.5, y, z]],
      [[x, y, z - 0.5], [x, y, z + 0.5]],
      [[x, y - 0.5, z], [x, y + 0.5, z]],
    ]
  }
  const [lo, hi] = zone.altitude
  const at = (p: Vec3, y: number): Vec3 => [p[0], y, p[2]]
  return [
    [at(zone.from, lo), at(zone.to, lo)],
    [at(zone.from, hi), at(zone.to, hi)],
    [at(zone.from, lo), at(zone.from, hi)],
    [at(zone.to, lo), at(zone.to, hi)],
  ]
}

/** Yellow outlines of every zone, hidden until the dev overlay shows them. Drawn over everything. */
export function createZoneOutlines(loc: Location, ground: (x: number, z: number) => number): { object: THREE.Group; setVisible(v: boolean): void } {
  const object = new THREE.Group()
  object.visible = false
  const mat = new THREE.LineBasicMaterial({ color: '#ffdd55', depthTest: false })
  for (const [name, zone] of Object.entries(loc.zones)) {
    const pts: number[] = []
    for (const [a, b] of zoneSegments(zone, ground)) pts.push(...a, ...b)
    const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const lines = new THREE.LineSegments(geo, mat)
    lines.name = `zone:${name}`
    lines.renderOrder = 100
    object.add(lines)
  }
  return { object, setVisible(v) { object.visible = v } }
}
```

`src/hud/devOverlay.ts`:

```ts
export interface DevStats { fps: number; birds: number; gust: number; mode: string; audio: string; calls: number }

export function createDevOverlay(root: HTMLElement, onToggle?: (visible: boolean) => void) {
  const el = document.createElement('pre')
  el.style.cssText = 'position:absolute;top:8px;left:8px;margin:0;padding:6px 8px;background:rgba(0,0,0,.5);color:#cfe;font:12px/1.4 monospace;display:none'
  root.appendChild(el)
  let visible = false
  addEventListener('keydown', e => {
    if (e.key === '`') {
      visible = !visible
      el.style.display = visible ? 'block' : 'none'
      onToggle?.(visible)
    }
  })
  let acc = 0, frames = 0, fps = 0
  return {
    update(dt: number, stats: Omit<DevStats, 'fps'>) {
      acc += dt; frames++
      if (acc >= 0.5) { fps = frames / acc; acc = 0; frames = 0 }
      if (visible) el.textContent = `fps ${fps.toFixed(0)}\nbirds ${stats.birds}\ngust ${stats.gust.toFixed(2)}\nmode ${stats.mode}\naudio ${stats.audio}\ncalls ${stats.calls}`
    },
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/hud`
Expected: PASS.

- [ ] **Step 5: Wire into main**

In `src/main.tsx`, before the dev overlay is created (the heightfield already exists there):

```ts
import { createZoneOutlines } from './hud/zoneOutlines'
// ...
const outlines = createZoneOutlines(loc, (x, z) => heightfield.sample(x, z))
world.scene.add(outlines.object)
const dev = createDevOverlay(document.getElementById('hud')!, v => outlines.setVisible(v))
```

- [ ] **Step 6: Visual check**

Run: `npm run dev`, Begin, press backtick. Yellow outlines: the near-water and open-water rectangles on the lake, the reed bed, the mudflat, the far-shore strip, crosses at the snag base and the two reed perches, and the sky lane's two long lines high across the far sky with verticals at each end. Birds stay inside their outlines. Backtick again hides them.

- [ ] **Step 7: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: PASS.

```bash
git add -A
git commit -m "feat: dev overlay toggles zone outlines and shows audio state"
```

---
### Task 15: Harvest the allow-listed species; pelican, sandpiper, and yellowlegs

**Files:**
- Create: `scripts/apply-allowlist.ts`, `src/birds/species/amwpel.ts`, `src/birds/species/leasan.ts`, `src/birds/species/greyel.ts`
- Modify: `package.json`, `data/birds.json` (by the build), `public/media/**` (by the harvest), `src/birds/species/index.ts`, `data/locations/lake.json`, `.gitignore` (confirm `data/raw` and `.env` are ignored; they are)

**Interfaces:**
- Consumes: `mergeAllowlist` (`scripts/lib/allowlist.ts`, tested), `harvest:taxonomy`, `harvest:media`, `build:birds` (existing scripts), the game-ready chain from Task 1.
- Produces: `data/birds.json` with `amwpel`, `leasan`, `wessan`, `greyel`; specs and cast entries for three of them.

**This task needs the network and two API keys** (`EBIRD_API_KEY`, `XC_API_KEY`). The sibling project `../birdsong-quiz/.env` has them, as does its `data/raw/` cache, which makes the media step incremental (only the four new species download). If the keys are not available or a harvest step fails, stop this task, leave the cast as it is, and report it; nothing later depends on it.

- [ ] **Step 1: Keys and the raw cache**

```bash
cp ../birdsong-quiz/.env .env                      # or: cp .env.example .env and fill both keys in
mkdir -p data/raw
cp ../birdsong-quiz/data/raw/candidates.json ../birdsong-quiz/data/raw/enriched.json ../birdsong-quiz/data/raw/media.json data/raw/
git status --short                                 # expected: nothing (both paths are ignored)
```

- [ ] **Step 2: Merge the allow-list without re-sampling eBird**

`harvest:species` merges the allow-list but costs ~300 eBird calls to re-sample the hotspots. This script does only the merge, against the copied candidates.

`scripts/apply-allowlist.ts`:

```ts
import { readFile, writeFile } from 'node:fs/promises'
import { mergeAllowlist, type Allowlist } from './lib/allowlist'
import type { CandidateRecord } from './lib/taxonomy'

// Folds data/species-allowlist.json into an existing data/raw/candidates.json
// so the taxonomy and media harvests pick the extra species up without
// re-sampling every hotspot (harvest:species does the same merge, at ~300 calls).
const candidates = JSON.parse(await readFile('data/raw/candidates.json', 'utf8')) as CandidateRecord[]
const allowlist = JSON.parse(await readFile('data/species-allowlist.json', 'utf8')) as Allowlist
const merged = mergeAllowlist(candidates, allowlist)
await writeFile('data/raw/candidates.json', JSON.stringify(merged, null, 2))
console.log(`${merged.length} candidates (${merged.length - candidates.length} added from the allow-list)`)
```

Add to `package.json` scripts: `"harvest:allowlist": "tsx scripts/apply-allowlist.ts"`.

Run: `npm run harvest:allowlist`
Expected: `74 candidates (4 added from the allow-list)`.

- [ ] **Step 3: Taxonomy, media, build**

```bash
npm run harvest:taxonomy      # one eBird taxonomy call; expected "Wrote 74 species"
npm run harvest:media         # cached species print "(cached)"; four download 3 clips and a photo each
npm run build:birds           # probes every clip; expected "Wrote 74 birds to data/birds.json"
```

Then confirm:

```bash
node -e 'const b=require("./data/birds.json");for(const c of ["amwpel","leasan","wessan","greyel"]){const x=b.find(s=>s.speciesCode===c);console.log(c,x?x.commonName+" audio:"+x.audio.length+" photo:"+(x.photo?"y":"n"):"MISSING")}'
```

Expected: all four present with audio. If one is `MISSING` (xeno-canto returned nothing and there is no photo, so `dropEmpty` dropped it), leave that species out of Step 5's cast and say so in the commit message; the guide will still list the ones that made it.

New clips come out of `clipAndTranscode` already game-ready (Task 1), so `audio:process` is not needed. `git status` should show only `data/birds.json` and new files under `public/media/`.

- [ ] **Step 4: Species specs**

`src/birds/species/amwpel.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'amwpel',
  commonName: 'American White Pelican',
  length: 1.5,
  body: { length: 1, height: 0.5, width: 0.5 },
  neck: { length: 0.6, thickness: 0.18, angle: 60 },
  head: { size: 0.32 },
  bill: { length: 0.7, thickness: 0.14, shape: 'flat' },
  legs: { length: 0.25, thickness: 0.06 },
  tail: { length: 0.15, angle: 5 },
  wing: { length: 1.4, width: 0.45 },
  posture: 'swimming',
  draft: 0.35,
  plumage: {
    crown: '#fbfaf4', cheek: '#f9f8f2', throat: '#f6f4ec', breast: '#f7f5ee', flank: '#f6f4ec',
    back: '#f7f5ee', wing: '#f4f2ea', speculum: '#1a1a1a', rump: '#f6f4ec', tail: '#f0eee6',
    bill: '#f2a03a', legs: '#f2a03a', eye: '#2a2a2a',
  },
  variants: {},
  marks: {
    size: 'huge, one of the largest birds in North America',
    bill: 'an enormous orange bill with a pouch',
    head: 'a white head on a long neck folded back in flight',
    body: 'all white with black wingtips, gliding in lines',
    legs: 'short orange legs',
  },
  wingbeatHz: 1.6,
}
```

`src/birds/species/leasan.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'leasan',
  commonName: 'Least Sandpiper',
  length: 0.15,
  body: { length: 1, height: 0.55, width: 0.45 },
  neck: { length: 0.12, thickness: 0.16, angle: 45 },
  head: { size: 0.3 },
  bill: { length: 0.16, thickness: 0.05, shape: 'pointed' },
  legs: { length: 0.28, thickness: 0.02 },
  tail: { length: 0.15, angle: 0 },
  wing: { length: 0.4, width: 0.2 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6e5a3a', cheek: '#a89070', throat: '#f0ece0', breast: '#c9b89a', flank: '#f0ece2',
    back: '#6a5636', wing: '#7a6440', speculum: null, rump: '#6a5636', tail: '#5a4830',
    bill: '#1f1f1f', legs: '#b8b03a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'the smallest sandpiper, sparrow-sized',
    bill: 'a short thin bill with a slight droop',
    head: 'a brown head with a faint pale eyebrow',
    body: 'brown above with a streaked breast, crouched low',
    legs: 'yellow-green legs (the other small sandpipers have black legs)',
  },
  wingbeatHz: 9,
}
```

`src/birds/species/greyel.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'greyel',
  commonName: 'Greater Yellowlegs',
  length: 0.33,
  body: { length: 1, height: 0.5, width: 0.42 },
  neck: { length: 0.32, thickness: 0.12, angle: 65 },
  head: { size: 0.26 },
  bill: { length: 0.36, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.75, thickness: 0.025 },
  tail: { length: 0.12, angle: 0 },
  wing: { length: 0.6, width: 0.28 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6a6252', cheek: '#a8a292', throat: '#f2f0ea', breast: '#d8d2c4', flank: '#eeeae0',
    back: '#6a6454', wing: '#736c5c', speculum: null, rump: '#f2f0ea', tail: '#c8c2b2',
    bill: '#2a2a2a', legs: '#e8c22a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a tall slim shorebird, larger than a killdeer',
    bill: 'a long, slightly upturned dark bill, longer than the head',
    head: 'a grey streaked head with a white eye ring',
    body: 'grey-brown speckled above, white below, with a white rump in flight',
    legs: 'long bright yellow legs',
  },
  wingbeatHz: 5,
}
```

Register them in `src/birds/species/index.ts` (import each `SPEC` as `amwpel`, `leasan`, `greyel` and append to `ALL`). The catalog-name test guards the three `commonName`s against eBird's names; fix the spec if it disagrees.

- [ ] **Step 5: Cast them**

In `data/locations/lake.json` append to `cast` (drop any species Step 3 reported missing):

```json
    { "species": "leasan",  "behavior": "probe",   "zone": "mudflat",   "count": 5 },
    { "species": "greyel",  "behavior": "wade",    "zone": "far-shore", "count": 1 },
    { "species": "amwpel",  "behavior": "flyover", "zone": "sky",       "count": 9, "everySeconds": [200, 480], "formation": "line" }
```

- [ ] **Step 6: Run tests**

Run: `npm run typecheck && npm test`
Expected: PASS. The location test suite now proves the habitat cast check accepts the allow-listed birds (their habitats came from `data/species-allowlist.json`).

- [ ] **Step 7: Visual check**

Run: `npm run dev`, Begin. Binoculars on the mudflat: five tiny sandpipers running and pecking among the three killdeer, yellow-green legs. Telescope on the far shore: the yellowlegs wading tall on yellow legs beside the heron and egret. Eventually nine white pelicans in a long slanting line, slow wingbeats, black wingtips. G: the guide lists American White Pelican, Least Sandpiper, Western Sandpiper, and Greater Yellowlegs under their families with photos and calls.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: harvest the allow-listed species; pelicans, least sandpipers, and a yellowlegs join the cast"
```

---

### Task 16: Cloudflare Pages deploy and the README

**Files:**
- Create: `wrangler.jsonc`, `README.md`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: `npm run build` (typecheck, tests, `vite build` to `dist/`).
- Produces: `npm run deploy`.

- [ ] **Step 1: Install wrangler and configure**

```bash
npm install -D wrangler@^4
```

`wrangler.jsonc`:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "lakewatch",
  "pages_build_output_dir": "./dist",
  "compatibility_date": "2026-09-01"
}
```

In `package.json` scripts add:

```json
    "deploy": "npm run build && wrangler pages deploy --commit-dirty=true"
```

Append `.wrangler` to `.gitignore`.

- [ ] **Step 2: README**

`README.md`:

```markdown
# Lakewatch

A first-person bird watching game for the browser: stand on the bank of a
Willamette Valley lake on an early-autumn morning, look around, raise
binoculars or a telescope, identify what you see from the field guide, and
build a life list. Non-commercial portfolio piece; every bird photo and
recording is Creative Commons non-commercial and credited in-game.

Vite + TypeScript, Three.js for the world and birds (procedural models),
Preact for the guide and life list, zod-validated data files, Vitest for
the pure logic. Design spec: `docs/superpowers/specs/2026-09-22-lakewatch-design.md`.

## Run

    npm install
    npm run dev        # http://localhost:5173
    npm test
    npm run build      # typecheck + tests + vite build -> dist/

Keys: click to look (Esc releases the mouse), scroll or B/T for optics,
E identify, G guide, L life list, O settings, C credits, backtick dev overlay.

## Data

`data/locations/lake.json` is the scene: zones, cast, wind, ambience.
`data/birds.json` is the catalog (species, media, attribution), built by the
harvest scripts. `data/ambience.json` is the ambience manifest.
`src/birds/species/*.ts` are the procedural bird models.

### Harvest

Needs `EBIRD_API_KEY` and `XC_API_KEY` in `.env` (copy `.env.example`).
Keys are read only by `scripts/` and never reach the browser.

    npm run harvest:all              # hotspots -> species -> taxonomy -> media -> build:birds
    npm run harvest:allowlist        # fold data/species-allowlist.json into an existing data/raw/candidates.json
    npm run build:birds              # rebuild data/birds.json from data/raw (probes every clip with ffmpeg)
    npm run audio:process            # one-time: re-encode legacy clips through the game-ready chain

Clips the harvest writes are already game-ready (high-pass, loudness
normalised, faded). `audio:process` exists for media copied from elsewhere.

## Deploy

Cloudflare Pages via wrangler:

    npx wrangler login               # once
    npm run deploy

Media under `public/media` ships with the site (about 19 MB).
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: typecheck and tests green, `dist/` produced with `dist/media/audio` and `dist/media/photos` copied from `public/`. Serve it once to be sure the built bundle boots: `npx vite preview`, open the URL, Begin, hear ambience, see birds.

- [ ] **Step 4: Deploy, or hand it over**

Run: `npx wrangler whoami`

- If it prints a logged-in account: `npm run deploy`. Expected: a `https://lakewatch.pages.dev` (or `https://<hash>.lakewatch.pages.dev`) URL. Open it, Begin, identify a bird, reload: the life list persists. Add the URL under "Deploy" in the README.
- If it says you are not logged in: stop here. Logging in opens a browser OAuth flow that only the account owner can complete. The user runs `npx wrangler login && npm run deploy`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: Cloudflare Pages deploy config and README"
```

---

## Milestone 2 done

Every build-order step in the spec is now implemented: the lake sounds like a lake and its birds call from where they are; geese and pelicans cross the sky in formation; the kingfisher fishes from the snag and the blackbird and wren hold the reeds; every cast species has a model; the game starts from a title card that unlocks audio, has settings and credits, survives a browser without WebGL or localStorage, and deploys to Cloudflare Pages with one command. The spec's "future ideas" (identification by ear, more vantage points, a second location, time of day, seasonal casts, Blender models) remain out of scope.
