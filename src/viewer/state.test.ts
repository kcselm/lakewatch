import { parseState, stateHash, type ViewerState } from './state'

const DEFAULTS: ViewerState = {
  a: 'greyel', av: '', b: 'lesyel', bv: '', view: 'side', field: '',
  neck: 0.5, lean: 0, spread: 0, phase: 0, reach: 0, depth: 0, angle: Math.PI / 2, paddle: 0, sink: 0, bob: 0, tail: 0, pitch: 0,
  pouch: 0, glide: 0, raise: 0, flap: false, afloat: 1, dry: 0, prop: 0, stroke: 0, fan: 0, yaw: 0, crest: 0, fish: 0, turn: 0, legs: 0,
  walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
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
  it('reads the water as a depth in metres, 0 to 40 cm (a heron wades to about 30), and an old on-off link as the 3 cm it used to show', () => {
    expect(parseState('#water=0.055', DEFAULTS).water).toBe(0.055)
    expect(parseState('#water=0.25', DEFAULTS).water).toBe(0.25)
    expect(parseState('#water=0.5', DEFAULTS).water).toBe(0.4)
    expect(parseState('#water=-1', DEFAULTS).water).toBe(0)
    expect(parseState('#water=1', DEFAULTS).water).toBe(0.03)
    expect(parseState('#water=0', DEFAULTS).water).toBe(0)
  })
  it('round-trips the pelican controls: a full pouch, a glide, the birds raised as high as a flock flies, flapping, seen from below', () => {
    const s: ViewerState = { ...DEFAULTS, a: 'amwpel', view: 'below', field: 'bino120', spread: 1, pouch: 0.7, glide: 0.4, raise: 60, flap: true }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
    expect(parseState('#pouch=3&glide=-1&raise=500', DEFAULTS)).toMatchObject({ pouch: 1, glide: 0, raise: 80 })
  })
  it('round-trips the cormorant controls: on its feet, the body raised, the wings held out to dry, the tail propped', () => {
    const s: ViewerState = { ...DEFAULTS, a: 'doccor', afloat: 0, lean: -0.7, dry: 1, prop: 1 }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
    expect(parseState('#lean=-2&dry=4&prop=-1', DEFAULTS)).toMatchObject({ lean: -1, dry: 1, prop: 0 })
  })
  it('round-trips the kingfisher controls: a hover, the tail fanned, the head turned, the crest up, a fish turned to swallow, the legs tucked', () => {
    const s: ViewerState = {
      ...DEFAULTS, a: 'testflier', b: 'testpercher', spread: 1, stroke: 0.8, flap: true, glide: 0.3, lean: -0.17,
      fan: 0.7, yaw: -0.6, crest: 1, fish: 1, turn: 0.4, legs: 1,
    }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
  })
  it('clamps the kingfisher controls: the head turned no further than 1.6 rad either way, the body leaned back no further than 1 rad', () => {
    const s = parseState('#stroke=2&fan=-1&yaw=-3&crest=9&fish=2&turn=-1&legs=5&lean=-2', DEFAULTS)
    expect([s.stroke, s.fan, s.yaw, s.crest, s.fish, s.turn, s.legs, s.lean]).toEqual([1, 0, -1.6, 1, 1, 0, 1, -1])
    expect(parseState('#yaw=3', DEFAULTS).yaw).toBe(1.6)
  })
  it('reads a link from the pelican round exactly as it read then, the kingfisher controls at rest', () => {
    const old = '#a=amwpel&av=&b=lesyel&bv=&view=below&field=bino120&neck=0&lean=0.2&spread=1&phase=0.3&reach=0&depth=0&angle=1.5707963267948966'
      + '&paddle=0&sink=0&bob=0&tail=0&pitch=0&pouch=0.7&glide=0.4&raise=60&speed=0.35&water=0&walk=0&flap=1&float=0&see=0&wire=0&skel=0&uv=0&atlas=0&stations=0'
    expect(parseState(old, DEFAULTS)).toEqual({
      ...DEFAULTS, a: 'amwpel', view: 'below', field: 'bino120', neck: 0, lean: 0.2, spread: 1, phase: 0.3, pouch: 0.7, glide: 0.4, raise: 60, flap: true,
    })
  })
  it('falls back from a species or plumage the catalog lacks', () => {
    const catalog = { has: (c: string) => ['greyel', 'lesyel', 'mallar3'].includes(c), variants: (c: string) => (c === 'mallar3' ? ['male', 'female'] : []) }
    const s = parseState('#a=nosuchbird&b=mallar3&bv=juvenile', DEFAULTS, catalog)
    expect(s.a).toBe('greyel')
    expect(s.b).toBe('mallar3')
    expect(s.bv).toBe('')
    expect(parseState('#b=mallar3&bv=female', DEFAULTS, catalog).bv).toBe('female')
  })
  it('round-trips the swimming controls: float, see-through, a tip-up, a head-dip, paddling, sinking', () => {
    const s: ViewerState = {
      ...DEFAULTS, a: 'mallar3', av: 'female', b: 'gadwal', bv: 'female', field: 'bino15', float: true, see: true,
      lean: 1.5, tail: 0.4, reach: 1, depth: 0.12, angle: 0.45, paddle: 1, sink: 0.045, bob: -0.06,
    }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
  })
  it('clamps the swimming controls to their ranges: a tip-up to 1.6 rad, the bill no steeper than straight down', () => {
    const s = parseState('#lean=3&angle=2&depth=1&sink=1&paddle=2&bob=0.5&tail=-2', DEFAULTS)
    expect([s.lean, s.angle, s.depth, s.sink, s.paddle, s.bob, s.tail]).toEqual([1.6, Math.PI / 2, 0.3, 0.15, 1, 0.2, -0.5])
  })
  it('round-trips the heron controls: the head pitched up, a strike aimed into the water over the bed, deep water', () => {
    const s: ViewerState = { ...DEFAULTS, a: 'grbher3', b: 'greegr', field: 'scope65', neck: 1, pitch: 0.9, reach: 1, depth: -0.15, water: 0.25 }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
    const wild = parseState('#pitch=3&depth=-2', DEFAULTS)
    expect([wild.pitch, wild.depth]).toEqual([1.4, -0.4])
  })
  it('round-trips the goose controls: half afloat, walking, through the binoculars at the flat; afloat held to 0..1', () => {
    const s: ViewerState = { ...DEFAULTS, a: 'cangoo', b: 'mallar3', field: 'bino35', afloat: 0.3, walk: true, speed: 0.4, reach: 1, depth: 0.25 }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
    expect(parseState('#afloat=2', DEFAULTS).afloat).toBe(1)
    expect(parseState('#afloat=-1', DEFAULTS).afloat).toBe(0)
  })
  it('reads a hand-kept link from before the swimmers exactly as it read then, the new controls at rest', () => {
    const old = '#a=greyel&av=&b=lesyel&bv=&view=three&field=scope22&neck=0.8&lean=0.8&spread=0&phase=0&reach=1&speed=0.35&water=0.045&walk=0&wire=1&skel=0&uv=0&atlas=0&stations=1'
    expect(parseState(old, DEFAULTS)).toEqual({
      ...DEFAULTS, view: 'three', field: 'scope22', neck: 0.8, lean: 0.8, reach: 1, water: 0.045, wire: true, stations: true,
    })
    expect(parseState('#water=1', DEFAULTS).float).toBe(false)
  })
  it('reads an empty hash as the defaults', () => {
    expect(parseState('', DEFAULTS)).toEqual(DEFAULTS)
  })
})
