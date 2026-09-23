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
