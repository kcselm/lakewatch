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
