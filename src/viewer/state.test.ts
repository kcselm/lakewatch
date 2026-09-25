import { parseState, stateHash, type ViewerState } from './state'

const DEFAULTS: ViewerState = {
  a: 'greyel', av: '', b: 'lesyel', bv: '', view: 'side', field: '',
  neck: 0.5, lean: 0, spread: 0, phase: 0, walk: false,
  water: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
}

describe('viewer state', () => {
  it('round-trips through the hash', () => {
    const s: ViewerState = { ...DEFAULTS, a: 'mallar3', av: 'female', view: 'top', field: 'scope22', neck: 0.8, walk: true, wire: true }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
  })
  it('keeps the defaults for anything missing or malformed', () => {
    const s = parseState('#view=sideways&field=scope99&neck=abc&spread=7', DEFAULTS)
    expect(s.view).toBe('side')
    expect(s.field).toBe('')
    expect(s.neck).toBe(0.5)
    expect(s.spread).toBe(1)             // clamped
  })
  it('falls back from a species or plumage the catalog lacks', () => {
    const catalog = { has: (c: string) => ['greyel', 'lesyel', 'mallar3'].includes(c), variants: (c: string) => (c === 'mallar3' ? ['male', 'female'] : []) }
    const s = parseState('#a=nosuchbird&b=mallar3&bv=juvenile', DEFAULTS, catalog)
    expect(s.a).toBe('greyel')
    expect(s.b).toBe('mallar3')
    expect(s.bv).toBe('')
    expect(parseState('#b=mallar3&bv=female', DEFAULTS, catalog).bv).toBe('female')
  })
  it('reads an empty hash as the defaults', () => {
    expect(parseState('', DEFAULTS)).toEqual(DEFAULTS)
  })
})
