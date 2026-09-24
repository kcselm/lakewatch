import { useStore } from './useStore'
import { game } from '../store/game'
import { Title } from './Title'
import { FieldGuide, type SeenState } from './FieldGuide'
import { ResultCard } from './ResultCard'
import { LifeList } from './LifeList'
import { SettingsPanel } from './SettingsPanel'
import type { Bird } from '../catalog/types'
import type { SpeciesSpec } from '../birds/spec'
import type { LifeListData } from '../game/lifeList'
import type { Settings } from '../game/settings'

export interface AppDeps {
  guide: Bird[]
  specs: Record<string, SpeciesSpec>
  birdOf: (code: string) => Bird
  fieldMark: (code: string) => string | null
  seen: () => SeenState
  onGuess: (code: string) => void
  onGuideSelect: (code: string) => void
  onCloseGuide: () => void
  onDismissCard: () => void
  lifeList: () => LifeListData
  locationName: string
  locationSpecies: string[]
  persistent: () => boolean
  onCloseLifeList: () => void
  unsupported: string | null
  onBegin: () => void
  onOpenSettings: () => void
  onOpenCredits: () => void
  settings: () => Settings
  settingsPersistent: () => boolean
  onSettingsChange: (s: Settings) => void
  onResetLifeList: () => void
  onCloseSettings: () => void
  clipVolume: () => number
}

export function App(d: AppDeps) {
  const s = useStore(game)
  return (
    <>
      {s.titleOpen && <Title unsupported={d.unsupported} onBegin={d.onBegin} onSettings={d.onOpenSettings} onCredits={d.onOpenCredits} />}
      {s.guideOpen && (
        <FieldGuide species={d.guide} specs={d.specs} seen={d.seen()} onConfirm={s.guideOpen && s.guideMode === 'identify' ? d.onGuess : null} onClose={d.onCloseGuide} onSelect={d.onGuideSelect} clipVolume={d.clipVolume()} />
      )}
      {s.card && <ResultCard card={s.card} birdOf={d.birdOf} fieldMark={d.fieldMark} onDismiss={d.onDismissCard} />}
      {s.lifeListOpen && (
        <LifeList data={d.lifeList()} birdOf={d.birdOf} locationName={d.locationName} locationSpecies={d.locationSpecies} persistent={d.persistent()} onClose={d.onCloseLifeList} />
      )}
      {s.settingsOpen && (
        <SettingsPanel settings={d.settings()} persistent={d.settingsPersistent()} onChange={d.onSettingsChange} onResetLifeList={d.onResetLifeList} onClose={d.onCloseSettings} />
      )}
    </>
  )
}
