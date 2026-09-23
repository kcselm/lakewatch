export function createPrompt(root: HTMLElement) {
  const reticle = document.createElement('div')
  reticle.className = 'reticle'
  root.appendChild(reticle)
  const el = document.createElement('div')
  el.className = 'prompt'
  root.appendChild(el)
  let last: string | null = null
  return {
    set(text: string | null) {
      if (text === last) return
      last = text
      el.textContent = text ?? ''
      el.classList.toggle('show', text !== null)
    },
  }
}
