import * as THREE from 'three'
import { SPEC as MALLARD } from './mallar3'
import { parseSpeciesSpec } from '../spec'
import { billWidthAt, billDepthAt } from '../detail/measure'
import { eyePlacement, billCenter } from '../detail/bill'
import { defaultPose } from '../model'
import { MALLARD as DABBLING } from '../../behavior/dabbler'
import { built, atlas, within, draftShare, hueIn } from './swimmer.testkit'
import { createProfile, sectionOffset } from '../detail/profile'
import { worstFold } from '../detail/loft'
import { tailWidth } from '../detail/tail'
import { REGIONS, ATLAS_SIZE } from '../paint/atlas'

// Bounds from docs/research/2026-09-25-mallard.md, section 10 (Söderquist et al. 2014, Baird et al. 1884, AVONET, the
// NHMO skin, photo-measured), and section 9 for the wingtips and the breast's front, in mm, at rest with the waterline
// at y = 0. One profile, traced at the mean of the sexes, serves all three versions; only the drake's curl and the
// paint differ.
//
// Heights above the water are taken from the midline waterline: the level line through the points where the water
// meets the bird's midline, at the stern and at the breast. The Mallard sits near the low end of the research's
// height bounds (back 70.8 against 70-90, crown 86.0 against 85-115), and its waterline length (252) near the low end
// of 250-335, for two reasons:
// - The research measured its photos from the near-side waterline directly below each point. The photos were taken
//   from a little above (7 degrees for the traced drake, 13 for the relaxed female), so that line dips 7-15 mm below
//   the midline along the flank, and every height read from it comes out higher.
// - The profile is a drake's photo scaled so his culmen is 53 mm, the mean of the sexes. A drake's own culmen is
//   55.1 mm, so every length and height here is 4% under the traced drake's.
// Between them, the traced drake's back, 77 in the research, is 70.8 here, and his crown, 96, is 86.0. Buoyancy agrees
// with the midline: at its 60.6 mm draft the hull displaces 0.93 L, for birds of 1.03-1.26 kg.

const D = parseSpeciesSpec(MALLARD).detail!
const A = built(MALLARD, 'male')
const VERSIONS = ['male', 'maleMoult', 'female'] as const
const bone = (m: typeof A.model, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!
/** the rest-pose places of the vertices painted on a part */
const partAt = (m: typeof A.model, part: keyof typeof REGIONS) => {
  const uv = m.mesh.geometry.getAttribute('uv') as THREE.BufferAttribute, pos = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
  const r = REGIONS[part], out: THREE.Vector3[] = []
  for (let i = 0; i < uv.count; i++) {
    const x = uv.getX(i) * ATLAS_SIZE, y = uv.getY(i) * ATLAS_SIZE
    if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) out.push(new THREE.Vector3().fromBufferAttribute(pos, i))
  }
  return out
}

describe('Mallard: structure', () => {
  it('builds every version as the same bird', () => {
    for (const v of ['maleMoult', 'female']) expect(built(MALLARD, v).M.length).toBeCloseTo(A.M.length, 6)
  })
  it('a long, flat bill: culmen, and width and depth at the base', () => {
    within(A.M.culmen, 48, 60, 'culmen')
    within(billWidthAt(A.model, 0) * 1000, 19, 24, 'bill width at the base')
    within(billDepthAt(A.model, 0) * 1000, 15.5, 21, 'bill depth at the base')
    within((billWidthAt(A.model, 0) * 1000) / A.M.culmen, 0.36, 0.46, 'bill width / culmen')
  })
  it('nearly parallel-sided: narrowest a fifth of the way out, widest 55-80% out at 1.02-1.10 times the base', () => {
    expect(billWidthAt(A.model, 0.2)).toBeLessThan(billWidthAt(A.model, 0))
    within(A.M.billWidestAt, 0.55, 0.8, 'widest point, fraction of the bill out')
    within(A.M.billWidestRatio, 1.02, 1.1, 'widest / base width')
  })
  it('deep at the base and a third to a half as deep at 80%, the culmen straight to the nail', () => {
    within(billDepthAt(A.model, 0.8) / billDepthAt(A.model, 0), 0.3, 0.55, 'depth at 80% / at the base')
    within(A.M.billTipRise, -1.5, 1.5, 'tip against the base line')
  })
  it('tarsus, middle toe, wing chord, tail, and length at rest', () => {
    within(A.M.tarsus, 36, 48, 'tarsus')
    within(D.measurements.toe * 1000, 45, 57, 'middle toe')
    within(A.M.wingChord, 250, 305, 'wing chord')
    within(A.M.tail, 75, 105, 'tail')
    within(A.M.length, 320, 400, 'length')
  })
  it('the eye 68-84 mm from the bill tip', () => {
    const eye = eyePlacement(D, A.model.profile!).center, tip = billCenter(D, A.model.profile!, 1).p
    within(Math.hypot(eye.x - tip.x, eye.y - tip.y) * 1000, 68, 84, 'eye centre to bill tip')
  })
  it('floats at its measured heights, with 0.35-0.48 of its depth under the water', () => {
    within(A.M.backAbove, 70, 90, 'back above the water')
    within(A.M.crownAbove, 85, 115, 'crown above the water')
    within(A.M.tailTipAbove, 20, 50, 'tail tip above the water')
    within(A.M.wingTipAbove, 42, 64, 'wingtips above the water')
    within(A.M.breastFrontAbove, 0, 16, 'breast front above the water')
    within(-A.M.projection, 0, 35, 'tail past the wingtips')
    within(A.M.waterlineLength, 250, 335, 'waterline length')
    within(A.M.draft, 40, 70, 'draft')
    within(draftShare(A.M), 0.35, 0.48, 'draft / body depth')
  })
  it("in its own full tip-up the stern stands 0.10-0.15 m out of the water, and the feet paddle above it", () => {
    const m = built(MALLARD, 'female').model
    const p = defaultPose()
    p.lean.x = DABBLING.tipUp.lean; p.tailTilt = DABBLING.tipUp.tail; p.neckExtend = 1; p.paddle = 1
    m.pose(p)
    m.group.updateMatrixWorld(true)
    // the body bone sits on the pivot at the origin, unturned at rest, so it carries group-space points
    const stern = new THREE.Vector3(m.anatomy.waterline.back, 0, 0).applyMatrix4(bone(m, 'body').matrixWorld)
    within(stern.y * 1000, 100, 150, 'stern above the water in the tip-up')
    for (const toes of ['toesR', 'toesL']) expect(bone(m, toes).getWorldPosition(new THREE.Vector3()).y, toes).toBeGreaterThan(0)
  })
  it('lofts its head and neck without a crease: no ring folds back over the one before at 64 to 160 rings', () => {
    const profile = createProfile(D.profile)
    for (const rings of [64, 96, 128, 160]) expect(worstFold(profile, D.rig, rings), `${rings} rings`).toBe(0)
  })
  it('a round head: from the nape to the lores the skin nowhere dips more than a millimetre between its neighbours', () => {
    // the first fit dipped 4 mm under the eye and at the gape, pits that showed dark; the head's rings now fan round the
    // throat, and it dips 0.4 mm at most
    const profile = createProfile(D.profile)
    const at = (u: number, t: number) => {
      const s = profile.sampleAt(u), o = sectionOffset(t * Math.PI, s.up, s.down, s.halfWidth)
      return new THREE.Vector3(s.point.x + s.axis.x * o.n, s.point.y + s.axis.y * o.n, o.z)
    }
    const h = 0.003 / profile.length
    let deepest = 0
    for (let u = profile.uOf('nape'); u <= profile.uOf('lores'); u += 0.0005) {
      const s = profile.sampleAt(u)
      for (let k = 0; k <= 16; k++) {
        const t = (0.8 * k) / 16, p = at(u, t)
        const out = p.clone().sub(new THREE.Vector3(s.point.x, s.point.y, 0)).normalize()
        deepest = Math.max(deepest, -p.clone().sub(at(u - h, t).add(at(u + h, t)).multiplyScalar(0.5)).dot(out))
      }
    }
    expect(deepest * 1000).toBeLessThan(1)
  })
  it('a closed tail: narrowing to its tip, its outer feathers folded down below the middle ones', () => {
    const profile = createProfile(D.profile)
    within(tailWidth(D, profile, 1) / tailWidth(D, profile, 0), 0.4, 0.7, 'tip width / root width')
    within(tailWidth(D, profile, 1) * 1000, 20, 40, 'tail width at the tip')
    // seen from behind, the white outer feathers hang below the grey middle ones
    const tail = partAt(A.model, 'tail'), back = Math.min(...tail.map(v => v.x))
    const tip = tail.filter(v => v.x < back + 0.012)
    const edge = tip.reduce((a, b) => (Math.abs(b.z) > Math.abs(a.z) ? b : a)), middle = tip.reduce((a, b) => (Math.abs(b.z) < Math.abs(a.z) ? b : a))
    expect(middle.y - edge.y).toBeGreaterThan(0.004)
  })
  it('the curl: two loops, one ahead of the other along the back, not side by side', () => {
    const curl = partAt(A.model, 'curl')
    const xs = curl.map(v => v.x), zs = curl.map(v => v.z)
    // one loop is about its height across; two side by side are no longer, two staggered are half again as long
    const loop = A.model.anatomy.parts[0]!.top.distanceTo(A.model.anatomy.parts[0]!.base)
    within((Math.max(...xs) - Math.min(...xs)) / loop, 1.2, 1.6, 'curl length / one loop')
    within((Math.max(...zs) - Math.min(...zs)) * 1000, 4, 8, 'curl width across the back')
  })
  it('the curl: loops about 20 mm high on the rump, their top 45-65 mm above the water, on the male only', () => {
    for (const v of VERSIONS) {
      const m = built(MALLARD, v).model
      expect(m.anatomy.parts.map(p => [p.kind, p.shown]), v).toEqual([['curl', v === 'male']])
      expect(bone(m, 'curl').scale.x, v).toBeCloseTo(v === 'male' ? 1 : 1e-4, 9)
    }
    const curl = A.model.anatomy.parts[0]!
    within((curl.top.y - curl.base.y) * 1000, 15, 25, 'curl height')
    within(curl.top.y * 1000, 45, 65, 'curl top above the water')
  })
})

describe('Mallard: plumage', () => {
  const m = atlas(MALLARD, 'male'), mm = atlas(MALLARD, 'maleMoult'), f = atlas(MALLARD, 'female')
  type Atlas = typeof m
  const green = (c: { hue: number; sat: number }) => hueIn(c.hue, 70, 170) && c.sat > 0.25
  const white = (c: { sat: number; lum: number }) => c.lum > 0.8 && c.sat < 0.25
  const head = (a: Atlas, t: [number, number]) => a.share('skin', [a.u('nape'), a.u('lores')], t, green)
  // the ring runs obliquely across the neck's skin, from the side of the neck behind to the throat
  const ring = (a: Atlas) => a.share('skin', [a.u('breast'), a.u('neckMid')], [0.3, 0.95], white)
  const flank = (a: Atlas) => a.stats('skin', [a.u('hip'), a.u('flank')], [0.42, 0.58])

  it('male: a green head over a narrow white ring', () => {
    expect(head(m, [0, 0.85])).toBeGreaterThan(0.6)
    within(ring(m), 0.02, 0.3, "ring's share of the neck")
  })
  it('male: dark at both ends and light in the middle: chestnut breast, pale grey flank, black stern', () => {
    const breast = m.colour('skin', [m.u('breast'), m.u('neckBase')], [0.6, 0.95])
    expect(hueIn(breast.hue, 0, 30)).toBe(true)
    expect(breast.sat).toBeGreaterThan(0.25)
    const side = m.colour('skin', [m.u('hip'), m.u('flank')], [0.42, 0.58])
    expect(side.sat).toBeLessThan(0.15)
    expect(side.lum).toBeGreaterThan(0.55)
    const stern = m.stats('skin', [m.u('rear'), m.u('rump')], [0.75, 1]).mean
    expect(stern).toBeLessThan(0.12)
    expect(side.lum).toBeGreaterThanOrEqual(2 * breast.lum)
    expect(side.lum).toBeGreaterThanOrEqual(2 * stern)
  })
  it("the drakes' bills are yellow; the female's orange, with a dark saddle on the upper third from about 30 to 50% out", () => {
    for (const a of [m, mm]) expect(hueIn(a.colour('bill', [0.2, 0.8], [0.6, 1]).hue, 42, 70)).toBe(true)
    const lower = (s: [number, number]) => f.stats('bill', s, [0.67, 1]).mean
    const upper = (s: [number, number]) => f.stats('bill', s, [0, 0.33]).mean
    const orange = f.colour('bill', [0.3, 0.5], [0.67, 1])
    expect(hueIn(orange.hue, 15, 40)).toBe(true)
    expect(orange.sat).toBeGreaterThan(0.5)
    expect(upper([0.3, 0.5])).toBeLessThan(lower([0.3, 0.5]) - 0.2)
    for (const s of [[0, 0.05], [0.85, 0.95]] as [number, number][]) expect(upper(s), `${s}`).toBeGreaterThan(lower(s) - 0.05)
  })
  it('female: contrasty flanks, dark-centred feathers with buff edges', () => {
    expect(flank(f).std).toBeGreaterThan(0.1)
    expect(flank(f).std).toBeGreaterThan(flank(m).std + 0.05)
  })
  it('the moulting drake: green only on the crown and nape, over a grey-brown face; no ring', () => {
    expect(head(mm, [0, 0.2])).toBeGreaterThan(0.4)
    expect(head(mm, [0.4, 0.85])).toBeLessThan(0.05)
    expect(ring(mm)).toBeLessThan(0.01)
    expect(ring(f)).toBeLessThan(0.01)
  })
  it("the moulting drake's flank is between the male's pale grey and the female's brown", () => {
    expect(flank(mm).mean).toBeLessThan(flank(m).mean)
    expect(flank(mm).mean).toBeGreaterThan(flank(f).mean)
  })
})
