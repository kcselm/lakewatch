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
      <label class="row">
        <span>Water reflections</span>
        <input type="checkbox" checked={local.reflections} onChange={e => update({ ...local, reflections: (e.target as HTMLInputElement).checked })} />
        <span class="val">{local.reflections ? 'On' : 'Off'}</span>
      </label>
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
