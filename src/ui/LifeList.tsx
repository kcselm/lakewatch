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
