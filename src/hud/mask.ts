import type { OpticMode } from '../player/optics'
import { OPTICS } from '../player/optics'

export function createMask(root: HTMLElement) {
  const el = document.createElement('div')
  el.className = 'optic-mask'
  root.appendChild(el)
  const ring = document.createElement('div')
  ring.className = 'optic-ring'
  root.appendChild(ring)
  return {
    update(mode: OpticMode, transition: number, focusBlur: number) {
      const s = OPTICS[mode]
      if (mode === 'eye') {
        el.style.background = 'radial-gradient(circle at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)'
        el.style.backdropFilter = ''
        ring.style.opacity = '0'
        return
      }
      const r = s.maskRadius * 100
      const soft = s.maskSoftness * 100
      const inner = Math.max(0, r - soft)
      const grow = 1 - (1 - transition) * 0.35     // circle grows in as the optic is raised
      el.style.background = `radial-gradient(circle at center, rgba(0,0,0,0) ${inner * grow}vmin, rgba(0,0,0,0.92) ${r * grow}vmin, #000 ${(r + 1) * grow}vmin)`
      el.style.backdropFilter = focusBlur > 0.02 ? `blur(${(focusBlur * 6).toFixed(1)}px)` : ''
      ring.style.opacity = String(transition)
      ring.style.width = ring.style.height = `${r * 2 * grow}vmin`
      ring.style.borderWidth = mode === 'telescope' ? '3px' : '1.5px'
      ring.style.borderColor = mode === 'telescope' ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.5)'
    },
  }
}
