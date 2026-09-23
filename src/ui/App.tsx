import { useStore } from './useStore'
import { game } from '../store/game'
import { FieldGuide, type SeenState } from './FieldGuide'
import { ResultCard } from './ResultCard'
import { LifeList } from './LifeList'
import type { Bird } from '../catalog/types'
import type { SpeciesSpec } from '../birds/spec'
import type { LifeListData } from '../game/lifeList'

export interface AppDeps {
  guide: Bird[]
  specs: Record<string, SpeciesSpec>
  birdOf: (code: string) => Bird
  fieldMark: (code: string) => string | null
  seen: () => SeenState
  onGuess: (code: string) => void
  onCloseGuide: () => void
  onDismissCard: () => void
  lifeList: () => LifeListData
  locationName: string
  locationSpecies: string[]
  persistent: () => boolean
  onCloseLifeList: () => void
}

export function App(d: AppDeps) {
  const s = useStore(game)
  return (
    <>
      {s.guideOpen && (
        <FieldGuide species={d.guide} specs={d.specs} seen={d.seen()} onConfirm={s.guideOpen && s.guideMode === 'identify' ? d.onGuess : null} onClose={d.onCloseGuide} />
      )}
      {s.card && <ResultCard card={s.card} birdOf={d.birdOf} fieldMark={d.fieldMark} onDismiss={d.onDismissCard} />}
      {s.lifeListOpen && (
        <LifeList data={d.lifeList()} birdOf={d.birdOf} locationName={d.locationName} locationSpecies={d.locationSpecies} persistent={d.persistent()} onClose={d.onCloseLifeList} />
      )}
    </>
  )
}
