import { SPEC as HERON } from './grbher3'
import { SPEC as EGRET } from './greegr'
import { built, atlas, within, hueIn } from './swimmer.testkit'
import { crownNow, billAngleNow, billTipNow } from '../detail/measure'
import { posedFold, passThrough, posedRings } from '../detail/neck.testkit'
import { createProfile } from '../detail/profile'
import { RINGS } from '../detail/loft'
import type { DetailedBirdModel } from '../detail/build'
import { defaultPose, type PoseState } from '../model'
import { HERON_WATER, heronFor, type HeronSettings } from '../../behavior/heron'

// Bounds from docs/research/2026-09-27-great-blue-heron.md and docs/research/2026-09-27-great-egret.md, section 10
// (the published tables and the photos of section 6), in mm and degrees. Each bird is built at rest, standing, its feet
// on y = 0; a neck shape's heights are measured with the body tilted as the heron style tilts it in that state.

type Patch = Partial<Omit<PoseState, 'lean'>> & { leanX?: number }
function pose(model: DetailedBirdModel, patch: Patch): void {
  const { leanX = 0, ...rest } = patch
  const p: PoseState = { ...defaultPose(), ...rest }
  p.lean.set(leanX, 0, 0)
  model.pose(p)
}

/** The heron style's poses for a species, at their fullest, from its own settings. */
function shapes(S: HeronSettings): Record<string, Patch> {
  return {
    hunch: { neckExtend: 0, leanX: S.rest.lean },
    trace: { neckExtend: 0.5 },
    erect: { neckExtend: 1, leanX: S.alert.lean },
    swallow: { neckExtend: 1, headPitch: S.swallow.pitch },
    // the bill aimed at the water over a bed 15 cm down, as on the far shallows
    strike: { reach: 1, leanX: S.strike.lean, reachAngle: S.strike.reachAngle, reachDepth: -(0.15 - S.strike.depth), neckExtend: 0.5 },
  }
}

/** The top of the back as posed, mm: the highest skin point from the tail to the neck's base (the rig's `neckBase`). */
function backNow(model: DetailedBirdModel, neckBase: string): number {
  const rings = posedRings(model)
  const last = Math.floor(model.profile!.uOf(neckBase) * (RINGS - 1))
  let top = -Infinity
  for (let i = 0; i <= last; i++) for (const v of rings[i]!) top = Math.max(top, v.y)
  return top * 1000
}

/** The crown above the top of the back, mm, in a pose. */
function crownAboveBack(spec: typeof HERON, model: DetailedBirdModel, patch: Patch): number {
  pose(model, patch)
  return crownNow(model) * 1000 - backNow(model, spec.detail!.rig.neckBase)
}

const deg = (rad: number) => (rad * 180) / Math.PI

/** Where the kink sits: its distance down the chain from the occiput, as a fraction of the neck's length along the spine. */
function kinkShare(spec: typeof HERON): number {
  const d = spec.detail!
  const profile = createProfile(d.profile)
  const [base, , kink] = d.rig.neck!
  const head = d.rig.neck!.at(-1)!
  return (profile.uOf(head) - profile.uOf(kink!)) / (profile.uOf(head) - profile.uOf(base!))
}

describe('Great Blue Heron: structure', () => {
  const A = built(HERON, 'adult'), J = built(HERON, 'juvenile')
  it('builds both versions, the same bird', () => {
    expect(J.M.length).toBeCloseTo(A.M.length, 6)
  })
  it('culmen, bill depth, and the bill against the tarsus', () => {
    within(A.M.culmen, 120, 150, 'culmen')
    within(A.M.billDepth, 24, 31, 'bill depth')
    within(A.M.culmen / A.M.tarsus, 0.72, 0.92, 'culmen / tarsus')
  })
  it('tarsus, bare tibia, wing chord, and length at rest', () => {
    within(A.M.tarsus, 150, 180, 'tarsus')
    within(A.M.tibia, 85, 125, 'bare tibia')
    within(A.M.wingChord, 450, 500, 'wing chord')
    within(A.M.length, 850, 1000, 'length')
  })
  it('stands 0.65-0.85 m tall in its hunting S', () => {
    within(A.M.crownAbove, 650, 850, 'crown above the feet')
  })
})

describe('Great Blue Heron: the neck', () => {
  const S = heronFor('grbher3')
  const { model } = built(HERON, 'adult')
  it('is a chain of six joints, with the kink about a third of the neck down from the head', () => {
    expect(HERON.detail!.rig.neck).toHaveLength(6)
    within(kinkShare(HERON), 0.25, 0.45, 'kink')
  })
  it('lifts the crown above the back as the photos do: hunched, hunting, erect', () => {
    within(crownAboveBack(HERON, model, shapes(S).hunch!), 0, 80, 'hunch')
    within(crownAboveBack(HERON, model, shapes(S).trace!), 170, 280, 'trace')
    within(crownAboveBack(HERON, model, shapes(S).erect!), 350, 520, 'erect')
  })
  it('points the bill as the photos do: down hunting, up swallowing, steeply down at the bottom of a strike', () => {
    pose(model, shapes(S).trace!)
    within(-deg(billAngleNow(model)), 10, 30, 'trace, below level')
    pose(model, shapes(S).swallow!)
    within(deg(billAngleNow(model)), 20, 50, 'swallow, above level')
    pose(model, shapes(S).strike!)
    within(-deg(billAngleNow(model)), 60, 90, 'strike, below level')
  })
  it('strikes where its ring starts: the bill goes in S.strike.ahead in front of the feet, to 5 cm', () => {
    pose(model, shapes(S).strike!)
    expect(Math.abs(billTipNow(model).x - S.strike.ahead)).toBeLessThan(0.05)
  })
  it('folds no ring and passes no skin through skin in any of its shapes', () => {
    for (const [name, patch] of Object.entries(shapes(S))) {
      pose(model, patch)
      expect(posedFold(model, 0.3) * 1000, name).toBeLessThan(0.1)
      expect(passThrough(model, 0.3).depth * 1000, name).toBeLessThan(3)
    }
  })
  it('wades no deeper than leaves 25 mm of its bare tibia above the water', () => {
    const m = HERON.detail!.measurements
    expect(HERON_WATER[1]).toBeLessThanOrEqual(m.tarsus + m.tibia - 0.025)
  })
})

describe('Great Blue Heron: plumage', () => {
  const a = atlas(HERON, 'adult'), j = atlas(HERON, 'juvenile')
  const crown = (x: typeof a): [number, number] => [x.u('occiput'), x.u('eye')]
  it('the adult: a light crown between dark stripes; the juvenile: the whole crown dark', () => {
    const centre = a.stats('skin', crown(a), [0, 0.06]).mean, sides = a.stats('skin', crown(a), [0.14, 0.3]).mean
    expect(centre).toBeGreaterThan(0.7)
    expect(sides).toBeLessThan(0.25)
    expect(j.stats('skin', crown(j), [0, 0.3]).mean).toBeLessThan(0.3)
  })
  it('the plumes on the adult only, about 100 mm long', () => {
    const adult = built(HERON, 'adult').model, juvenile = built(HERON, 'juvenile').model
    const plume = HERON.detail!.parts?.find(p => p.kind === 'plume')
    expect(plume && plume.kind === 'plume' ? plume.length * 1000 : 0).toBeGreaterThanOrEqual(80)
    expect(plume && plume.kind === 'plume' ? plume.length * 1000 : 0).toBeLessThanOrEqual(130)
    expect(adult.anatomy.parts.find(p => p.kind === 'plume')?.shown).toBe(true)
    expect(juvenile.anatomy.parts.find(p => p.kind === 'plume')?.shown).toBe(false)
  })
  it('rufous thighs in both versions, and the adult\'s dark shoulder', () => {
    for (const x of [a, j]) {
      const c = x.colour('skin', [x.u('hip') - 0.02, x.u('hip') + 0.02], [0.85, 1])
      expect(hueIn(c.hue, 5, 40), 'thigh hue').toBe(true)
      expect(c.sat).toBeGreaterThan(0.2)
    }
    const shoulder = (x: typeof a) => x.stats('skin', [x.u('breast'), x.u('neckBase')], [0.35, 0.55]).mean
    expect(shoulder(a)).toBeLessThan(shoulder(j) - 0.05)
  })
  it('the bill dusky above and yellow below, darker on the juvenile', () => {
    const top = a.stats('bill', [0.1, 0.9], [0, 0.15]).mean
    const below = a.colour('bill', [0.1, 0.9], [0.8, 1])
    expect(hueIn(below.hue, 35, 60)).toBe(true)
    expect(top).toBeLessThan(below.lum - 0.15)
    expect(j.stats('bill', [0.1, 0.9], [0, 1]).mean).toBeLessThan(a.stats('bill', [0.1, 0.9], [0, 1]).mean)
  })
})

describe('Great Egret: structure', () => {
  const E = built(EGRET), H = built(HERON, 'adult')
  it('culmen, bill depth, tarsus, bare tibia, wing chord, and length at rest', () => {
    within(E.M.culmen, 100, 120, 'culmen')
    within(E.M.billDepth, 16, 22, 'bill depth')
    within(E.M.tarsus, 135, 165, 'tarsus')
    within(E.M.tibia, 80, 115, 'bare tibia')
    within(E.M.wingChord, 360, 405, 'wing chord')
    within(E.M.length, 700, 820, 'length')
  })
  it('stands 0.52-0.68 m tall in its hunting S', () => {
    within(E.M.crownAbove, 520, 680, 'crown above the feet')
  })
  it('against the Great Blue Heron: a shorter bill and a smaller bird', () => {
    within(E.M.culmen / H.M.culmen, 0.75, 0.88, 'culmen')
    within(E.M.crownAbove / H.M.crownAbove, 0.7, 0.9, 'standing height')
  })
})

describe('Great Egret: the neck', () => {
  const S = heronFor('greegr')
  const { model } = built(EGRET)
  it('is a chain of six joints, with the kink about a third of the neck down from the head', () => {
    expect(EGRET.detail!.rig.neck).toHaveLength(6)
    within(kinkShare(EGRET), 0.25, 0.45, 'kink')
  })
  it('lifts the crown above the back as the photos do: hunched, hunting, erect', () => {
    within(crownAboveBack(EGRET, model, shapes(S).hunch!), 0, 60, 'hunch')
    within(crownAboveBack(EGRET, model, shapes(S).trace!), 80, 160, 'trace')
    within(crownAboveBack(EGRET, model, shapes(S).erect!), 300, 420, 'erect')
  })
  it('points the bill as the photos do: down hunting, up swallowing, steeply down at the bottom of a strike', () => {
    pose(model, shapes(S).trace!)
    within(-deg(billAngleNow(model)), 5, 25, 'trace, below level')
    pose(model, shapes(S).swallow!)
    within(deg(billAngleNow(model)), 15, 45, 'swallow, above level')
    pose(model, shapes(S).strike!)
    within(-deg(billAngleNow(model)), 45, 85, 'strike, below level')
  })
  it('strikes where its ring starts: the bill goes in S.strike.ahead in front of the feet, to 5 cm', () => {
    pose(model, shapes(S).strike!)
    expect(Math.abs(billTipNow(model).x - S.strike.ahead)).toBeLessThan(0.05)
  })
  it('folds no ring and passes no skin through skin in any of its shapes', () => {
    for (const [name, patch] of Object.entries(shapes(S))) {
      pose(model, patch)
      expect(posedFold(model, 0.3) * 1000, name).toBeLessThan(0.1)
      expect(passThrough(model, 0.3).depth * 1000, name).toBeLessThan(3)
    }
  })
  it('wades no deeper than leaves 25 mm of its bare tibia above the water: the style\'s band is set by this bird', () => {
    const m = EGRET.detail!.measurements
    expect(HERON_WATER[1]).toBeLessThanOrEqual(m.tarsus + m.tibia - 0.025)
  })
})

describe('Great Egret: plumage', () => {
  const e = atlas(EGRET)
  it('white all over the skin and the folded wing', () => {
    expect(e.stats('skin', [0, 1], [0, 1]).mean).toBeGreaterThan(0.8)
    expect(e.stats('wingFold', [0, 1], [0, 1]).mean).toBeGreaterThan(0.8)
  })
  it('a yellow-orange bill and black legs', () => {
    const bill = e.colour('bill', [0.1, 0.8], [0.3, 1])
    expect(hueIn(bill.hue, 30, 55)).toBe(true)
    expect(bill.sat).toBeGreaterThan(0.5)
    expect(e.stats('legs', [0, 1], [0, 1]).mean).toBeLessThan(0.12)
  })
  it('yellow lores and gape reaching back past the eye', () => {
    // the gape ends about 9 mm behind the eye's centre and 10 mm below it (research section 5.1): the skin 4-12 mm
    // behind the eye, from the eye's height down a fifth of the way round the head, is yellow
    const d = EGRET.detail!, length = createProfile(d.profile).length * 1000
    const behind = e.colour('skin', [e.u('eye') - 12 / length, e.u('eye') - 4 / length], [d.eye.t, d.eye.t + 0.2])
    expect(hueIn(behind.hue, 35, 70)).toBe(true)
    expect(behind.sat).toBeGreaterThan(0.35)
  })
})
