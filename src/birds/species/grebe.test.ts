import * as THREE from 'three'
import { SPEC as GREBE } from './pibgre'
import { parseSpeciesSpec } from '../spec'
import { billWidthAt, billDepthAt } from '../detail/measure'
import { eyePlacement } from '../detail/bill'
import { defaultPose } from '../model'
import { AWASH, NECK } from '../../behavior/grebe'
import { built, atlas, within, draftShare } from './swimmer.testkit'

// Bounds from docs/research/2026-09-25-pied-billed-grebe.md, section 10 (Cramp & Simmons in Johnsgard 1987; Baird,
// Brewer & Ridgway 1884; AVONET; photo-measured), in mm, at rest, floating.

const B = built(GREBE, 'basic')

describe('Pied-billed Grebe: structure', () => {
  it('builds both versions, the same bird', () => {
    expect(built(GREBE, 'juvenile').M.length).toBeCloseTo(B.M.length, 6)
  })
  it('a short, deep, chicken-like bill with a small hook', () => {
    within(B.M.culmen, 17, 24)
    within(billDepthAt(B.model, 0) * 1000, 9.5, 13)
    within((billDepthAt(B.model, 0) * 1000) / B.M.culmen, 0.45, 0.65)
    within(billWidthAt(B.model, 0) / billDepthAt(B.model, 0), 0.4, 0.6)
    within(billDepthAt(B.model, 0.5) / billDepthAt(B.model, 0), 0.7, 0.9)
    within(B.M.billTipRise, -3, 0)
  })
  it('no visible tail', () => {
    expect(parseSpeciesSpec(GREBE).detail!.tail.shape).toBe('none')
  })
  it('length at rest, tarsus, wing, and a middle toe at least the tarsus', () => {
    within(B.M.length, 195, 240)
    within(B.M.tarsus, 31, 43)
    within(B.M.wingChord, 115, 135)
    const toe = parseSpeciesSpec(GREBE).detail!.measurements.toe * 1000
    within(toe, 40, 50)
    expect(toe).toBeGreaterThanOrEqual(B.M.tarsus)
  })
  it('rides low: the back just above the water, most of the body under it', () => {
    within(B.M.waterlineLength, 150, 185)
    within(B.M.backAbove, 18, 40)
    within(B.M.tailTipAbove, 0, 20)
    within(B.M.crownAbove, 70, 95)
    within(draftShare(B.M), 0.55, 0.7)
  })
  // Added in review, beyond the brief's file: the grebe style sinks the bird by AWASH to watch (and to start a sink
  // dive), with its neck at the sink state's extension (NECK.sink, in src/behavior/grebe.ts)
  it('at the periscope, the head and upper neck show: the eye and the chin above the water, the back below it', () => {
    const { model: m } = built(GREBE, 'basic')
    const p = defaultPose()
    p.neckExtend = NECK.sink
    m.pose(p)
    // the game lowers the whole bird: the style's y is minus its depth
    m.group.position.y = -AWASH
    m.group.updateMatrixWorld(true)
    const { bones, boneInverses } = m.mesh.skeleton
    const skinning = (name: string) => {
      const k = bones.findIndex(b => b.name === name)
      return { k, M: new THREE.Matrix4().multiplyMatrices(bones[k]!.matrixWorld, boneInverses[k]!) }
    }
    const g = m.mesh.geometry
    const pos = g.getAttribute('position'), index = g.getAttribute('skinIndex'), weight = g.getAttribute('skinWeight')
    /** Where the vertices skinned wholly to one bone are now, in the world (the water at y = 0). */
    const wholly = (name: string) => {
      const { k, M } = skinning(name)
      const out: THREE.Vector3[] = []
      for (let i = 0; i < pos.count; i++) {
        if (index.getX(i) === k && weight.getX(i) > 0.999) out.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(M))
      }
      return out
    }
    // the eye's centre, from the profile frame to the group's frame at rest, then carried by the head
    const end = m.profile.sampleAt(1).point
    const eye = eyePlacement(GREBE.detail!, m.profile).center
      .add(m.anatomy.billBase.clone().sub(new THREE.Vector3(end.x, end.y, 0)))
      .applyMatrix4(skinning('head').M)
    const chin = Math.min(...wholly('head').map(v => v.y))
    const back = Math.max(...wholly('body').map(v => v.y))
    expect(eye.y - GREBE.detail!.eye.radius, 'the whole eye above the water').toBeGreaterThan(0)
    expect(chin, 'the chin above the water').toBeGreaterThan(0)
    expect(back, 'the back below the water').toBeLessThan(0)
  })
})

describe('Pied-billed Grebe: plumage', () => {
  const b = atlas(GREBE, 'basic'), j = atlas(GREBE, 'juvenile')
  const face = (x: typeof b) => x.stats('skin', [x.u('occiput'), x.u('lores')], [0.25, 0.6])

  it('both: a throat paler than the crown, and a near-white stern puff', () => {
    for (const x of [b, j]) {
      expect(x.stats('skin', [x.u('neckMid'), x.u('eye')], [0.75, 1]).mean)
        .toBeGreaterThan(x.stats('skin', [x.u('occiput'), x.u('lores')], [0, 0.15]).mean + 0.15)
      expect(x.share('skin', [x.u('rear'), x.u('rump')], [0.4, 1], c => c.lum > 0.8)).toBeGreaterThan(0.4)
    }
  })
  it("the juvenile's face is striped; the adult's is near-uniform", () => {
    expect(face(j).roughS + face(j).roughT).toBeGreaterThan(face(b).roughS + face(b).roughT + 0.05)
  })
  it('neither version carries a dark ring on its bill', () => {
    for (const x of [b, j]) {
      expect(x.stats('bill', [0.45, 0.7], [0, 1]).mean).toBeGreaterThan(x.stats('bill', [0.1, 0.4], [0, 1]).mean - 0.1)
    }
  })
})
