import { paintStats } from '../birds/paint/painter'

export interface DevStats { fps: number; birds: number; gust: number; mode: string; audio: string; calls: number }

export function createDevOverlay(root: HTMLElement, onToggle?: (visible: boolean) => void) {
  const el = document.createElement('pre')
  el.style.cssText = 'position:absolute;top:8px;left:8px;margin:0;padding:6px 8px;background:rgba(0,0,0,.5);color:#cfe;font:12px/1.4 monospace;display:none'
  root.appendChild(el)
  let visible = false
  addEventListener('keydown', e => {
    if (e.key === '`') {
      visible = !visible
      el.style.display = visible ? 'block' : 'none'
      onToggle?.(visible)
    }
  })
  let acc = 0, frames = 0, fps = 0
  return {
    update(dt: number, stats: Omit<DevStats, 'fps'>) {
      acc += dt; frames++
      if (acc >= 0.5) { fps = frames / acc; acc = 0; frames = 0 }
      if (visible) {
        const paint = paintStats.atlases
          ? `\natlases ${paintStats.atlases}: ${(paintStats.ms / paintStats.atlases).toFixed(0)} ms each, ${(paintStats.bytes / 1048576).toFixed(1)} MB`
          : ''
        el.textContent = `fps ${fps.toFixed(0)}\nbirds ${stats.birds}\ngust ${stats.gust.toFixed(2)}\nmode ${stats.mode}\naudio ${stats.audio}\ncalls ${stats.calls}${paint}`
      }
    },
  }
}
