import type { VNode } from 'preact'
import { Title, type TitleProps } from './Title'

/** Every element in a rendered tree, depth first; Title is a plain function of its props, so no DOM is needed. */
function elements(node: unknown): VNode<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object' || !('props' in node)) return []
  const v = node as VNode<Record<string, unknown>>
  return [v, ...elements(v.props.children)]
}
const text = (v: VNode<Record<string, unknown>>): string => {
  const c = v.props.children
  return (Array.isArray(c) ? c : [c]).join('')
}

const props = (painting: TitleProps['painting'], unsupported: string | null = null): TitleProps => ({
  unsupported, painting, onBegin: () => {}, onSettings: () => {}, onCredits: () => {},
})
const begin = (p: TitleProps) => elements(Title(p)).find(v => v.props.class === 'begin')
const status = (p: TitleProps) => elements(Title(p)).find(v => v.props.role === 'status')

describe('Title', () => {
  it('keeps Begin disabled while the birds are painting, and says how far along it is', () => {
    const p = props({ done: 7, total: 20, ready: false })
    expect(begin(p)!.props.disabled).toBe(true)
    expect(status(p)!.props.class).toBe('painting')
    expect(text(status(p)!)).toBe('Painting the birds… 7 of 20')
  })
  it('enables Begin once every atlas is ready, and hides the progress line but keeps its place, so Begin stays put', () => {
    const p = props({ done: 20, total: 20, ready: true })
    expect(begin(p)!.props.disabled).toBe(false)
    expect(status(p)!.props.class).toBe('painting ready')
  })
  it('shows neither Begin nor progress when the scene cannot render', () => {
    const p = props({ done: 0, total: 20, ready: false }, 'no WebGL')
    expect(begin(p)).toBeUndefined()
    expect(status(p)).toBeUndefined()
  })
})
