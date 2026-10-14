import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { Bird } from '../catalog/types'
import { MARK_KEYS, isDetailed, type SpeciesSpec } from '../birds/spec'
import { StudyStage } from '../study/stage'
import { posesFor, versionsFor, type StudyPose } from '../study/study'
import type { SeenState } from './FieldGuide'
import type { PaintProgress } from './Title'

export interface StudyProps {
  /** the species with models, in the guide's order (study/study.ts: studySpecies) */
  species: Bird[]
  specs: Record<string, SpeciesSpec>
  /** where a species is on the lake, a sentence for each place */
  habits: (code: string) => string[]
  locationName: string
  seen: SeenState
  clipVolume: number
  painting: PaintProgress
  onBegin: () => void
  onBack: () => void
}

const MARK_LABELS: Record<(typeof MARK_KEYS)[number], string> = { size: 'Size and shape', bill: 'Bill', head: 'Head', body: 'Body', legs: 'Legs' }

/**
 * Study the birds before going to the lake: every species with a model, turned on a stage in its plumages and poses,
 * with its photo, calls, field marks, and where it is on the lake. Opened from the title card.
 */
export function Study({ species, specs, habits, locationName, seen, clipVolume, painting, onBegin, onBack }: StudyProps) {
  const [code, setCode] = useState(species[0]?.speciesCode ?? '')
  const spec = specs[code]
  const versions = useMemo(() => (spec ? versionsFor(spec) : []), [spec])
  const poses = useMemo(() => (spec ? posesFor(spec) : []), [spec])
  const [version, setVersion] = useState<string | undefined>(versions[0]?.id)
  const [pose, setPose] = useState<StudyPose>('rest')
  const [playing, setPlaying] = useState<HTMLAudioElement | null>(null)
  const playingRef = useRef<HTMLAudioElement | null>(null)
  const bird = species.find(b => b.speciesCode === code) ?? null
  const byFamily = useMemo(() => {
    const m = new Map<string, Bird[]>()
    for (const b of species) m.set(b.familyCommon, [...(m.get(b.familyCommon) ?? []), b])
    return [...m.entries()]
  }, [species])

  // stop any playing clip when the study closes
  useEffect(() => () => { playingRef.current?.pause() }, [])

  function stop() {
    playingRef.current?.pause()
    playingRef.current = null
    setPlaying(null)
  }
  function choose(next: string) {
    if (next === code) return
    stop()
    setCode(next)
    setVersion(specs[next] ? versionsFor(specs[next]!)[0]?.id : undefined)
    setPose('rest')
  }
  function play(file: string) {
    playingRef.current?.pause()
    const a = new Audio('/' + file)
    a.volume = clipVolume
    a.onended = () => { if (playingRef.current === a) stop() }
    a.play().catch(() => {})
    playingRef.current = a
    setPlaying(a)
  }

  return (
    <div class="study">
      <header class="study-bar">
        <button class="study-back" onClick={() => { stop(); onBack() }}>← Back</button>
        <h1>Study the birds</h1>
        <span class="study-ready" role="status">{painting.ready ? `${locationName} is ready` : `Getting the birds ready… ${painting.done} of ${painting.total}`}</span>
        <button class="begin" disabled={!painting.ready} onClick={() => { stop(); onBegin() }}>Go to the lake</button>
      </header>
      <nav class="study-list">
        {byFamily.map(([family, birds]) => (
          <section key={family}>
            <h3>{family}</h3>
            {birds.map(b => (
              <button key={b.speciesCode} class={'guide-row' + (b.speciesCode === code ? ' selected' : '')} onClick={() => choose(b.speciesCode)}>
                <span class={'seen seen-' + (seen[b.speciesCode] ?? 'none')} title={seen[b.speciesCode] ? 'On your life list' : undefined} />
                {b.commonName}
              </button>
            ))}
          </section>
        ))}
      </nav>
      <div class="study-stage">
        {spec && <Stage spec={spec} version={version} pose={pose} />}
        <div class="study-controls">
          {versions.length > 0 && (
            <div class="chips" role="group" aria-label="Plumage">
              {versions.map(v => <button key={v.id} class={v.id === version ? 'on' : ''} aria-pressed={v.id === version} onClick={() => setVersion(v.id)}>{v.label}</button>)}
            </div>
          )}
          {poses.length > 1 && (
            <div class="chips" role="group" aria-label="Pose">
              {poses.map(p => <button key={p.id} class={p.id === pose ? 'on' : ''} aria-pressed={p.id === pose} onClick={() => setPose(p.id)}>{p.label}</button>)}
            </div>
          )}
        </div>
      </div>
      <article class="study-info">
        {bird && spec && (
          <>
            <h2>{bird.commonName}</h2>
            <p class="sci">{bird.scientificName}</p>
            <p class="study-meta">{bird.familyCommon} · {Math.round(spec.length * 100)} cm long</p>
            {!isDetailed(spec) && <p class="study-simple">A simple stand-in model, still to be detailed.</p>}
            {habits(code).length > 0 && (
              <>
                <h3>On {locationName}</h3>
                <ul class="study-habits">{habits(code).map(h => <li key={h}>{h}</li>)}</ul>
              </>
            )}
            <h3>Field marks</h3>
            <dl class="study-marks">
              {MARK_KEYS.map(k => [<dt key={k + 't'}>{MARK_LABELS[k]}</dt>, <dd key={k + 'd'}>{spec.marks[k]}</dd>])}
            </dl>
            {bird.photo && (
              <figure class="study-photo">
                <img src={'/' + bird.photo.file} alt={bird.commonName} />
                <figcaption class="attr">{bird.photo.attribution}</figcaption>
              </figure>
            )}
            {bird.audio.length > 0 && (
              <>
                <h3>Calls</h3>
                <div class="clips">
                  {bird.audio.map(c => {
                    const on = playing !== null && playing.src.endsWith('/' + c.file)
                    return (
                      <button key={c.xcId} class={on ? 'on' : ''} onClick={() => (on ? stop() : play(c.file))}>
                        {on ? '■' : '▶'} {c.type} <small>{c.recordist}, {c.license}</small>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </article>
    </div>
  )
}

/** The 3D stage: one StudyStage for as long as the study is open, showing whichever bird, plumage, and pose is chosen. */
function Stage({ spec, version, pose }: { spec: SpeciesSpec; version: string | undefined; pose: StudyPose }) {
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<StudyStage | null>(null)
  const poseRef = useRef(pose)
  poseRef.current = pose
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      stage.current = new StudyStage(host.current!, { onBusy: setBusy, onError: err => { console.error(err); setError('This bird could not be shown.') } })
    } catch (err) {
      console.error(err)
      setError('This browser could not start WebGL, so the birds cannot be drawn.')
    }
    return () => { stage.current?.dispose(); stage.current = null }
  }, [])
  useEffect(() => {
    setError(null)
    void stage.current?.show(spec, version, poseRef.current)
  }, [spec, version])
  useEffect(() => { stage.current?.setPose(pose) }, [pose])

  return (
    <div class="study-canvas">
      <div class="study-gl" ref={host} />
      {busy && <p class="study-busy">Preparing the {spec.commonName}…</p>}
      {error && <p class="study-busy warn">{error}</p>}
      <p class="study-hint">Drag to turn · scroll to zoom</p>
    </div>
  )
}
