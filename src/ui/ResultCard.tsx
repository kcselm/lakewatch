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
