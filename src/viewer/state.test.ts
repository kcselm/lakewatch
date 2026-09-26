import { parseState, stateHash, type ViewerState } from './state'

const DEFAULTS: ViewerState = {
  a: 'greyel', av: '', b: 'lesyel', bv: '', view: 'side', field: '',
  neck: 0.5, lean: 0, spread: 0, phase: 0, reach: 0, walk: false, speed: 0.35,
  water: 0, wire: false, skel: false, uv: false, atlas: false, stations: false,
}

describe('viewer state', () => {
  it('round-trips through the hash', () => {
    const s: ViewerState = { ...DEFAULTS, a: 'mallar3', av: 'female', view: 'top', field: 'scope22', neck: 0.8, reach: 0.6, walk: true, speed: 1.2, water: 0.045, wire: true }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
  })
  it('keeps the defaults for anything missing or malformed', () => {
    const s = parseState('#view=sideways&field=scope99&neck=abc&spread=7', DEFAULTS)
    expect(s.view).toBe('side')
    expect(s.field).toBe('')
    expect(s.neck).toBe(0.5)
    expect(s.spread).toBe(1)             // clamped
  })
  it('clamps the walking speed to its own range, not 0..1', () => {
    expect(parseState('#speed=1.5', DEFAULTS).speed).toBe(1.5)
    expect(parseState('#speed=9', DEFAULTS).speed).toBe(2)
    expect(parseState('#speed=0', DEFAULTS).speed).toBe(0.05)
  })
  it('reads the water as a depth in metres, 0 to 10 cm, and an old on-off link as the 3 cm it used to show', () => {
    expect(parseState('#water=0.055', DEFAULTS).water).toBe(0.055)
    expect(parseState('#water=0.5', DEFAULTS).water).toBe(0.1)
    expect(parseState('#water=-1', DEFAULTS).water).toBe(0)
    expect(parseState('#water=1', DEFAULTS).water).toBe(0.03)
    expect(parseState('#water=0', DEFAULTS).water).toBe(0)
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
