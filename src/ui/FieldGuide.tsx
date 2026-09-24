import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
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
  onSelect?: (code: string) => void
  clipVolume?: number
}

export function FieldGuide({ species, specs, seen, onConfirm, onClose, onSelect, clipVolume }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [playing, setPlaying] = useState<HTMLAudioElement | null>(null)
  const playingRef = useRef<HTMLAudioElement | null>(null)
  const byFamily = useMemo(() => {
    const m = new Map<string, Bird[]>()
    for (const b of species) m.set(b.familyCommon, [...(m.get(b.familyCommon) ?? []), b])
    return [...m.entries()]
  }, [species])
  const bird = species.find(b => b.speciesCode === selected) ?? null

  // stop any playing clip if the guide unmounts (e.g. the G key closes it directly)
  useEffect(() => () => { playingRef.current?.pause() }, [])

  function play(file: string) {
    playing?.pause()
    const a = new Audio('/' + file)
    a.volume = clipVolume ?? 1
    a.play().catch(() => {})
    setPlaying(a)
    playingRef.current = a
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
              <button key={b.speciesCode} class={'guide-row' + (b.speciesCode === selected ? ' selected' : '')} onClick={() => { setSelected(b.speciesCode); onSelect?.(b.speciesCode) }}>
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
