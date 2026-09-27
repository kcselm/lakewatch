import * as THREE from 'three'
import { buildBird } from './procedural'
import { defaultPose } from './model'
import { parseSpeciesSpec } from './spec'
import { getSpec } from './species'
import { birdModelContract } from './contract.testkit'

/** The bounding box of an object's own geometry only, excluding its children (unlike Box3.setFromObject). */
function ownBox(o: THREE.Object3D): THREE.Box3 {
  const geo = (o as THREE.Mesh).geometry
  geo.computeBoundingBox()
  return geo.boundingBox!.clone().applyMatrix4(o.matrixWorld)
}

const standingCoot = () => parseSpeciesSpec({ ...getSpec('y00475'), posture: 'standing', legs: { length: 0.4, thickness: 0.05 } })
birdModelContract('block builder', () => buildBird(standingCoot()))

describe('buildBird', () => {
  const coot = getSpec('y00475')
  it('scales to the spec length', () => {
    const m = buildBird(coot)
    m.group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(m.group)
    const len = box.max.x - box.min.x
    expect(len).toBeGreaterThan(coot.length * 0.8)
    expect(len).toBeLessThan(coot.length * 1.3)
    expect(m.radius).toBeGreaterThan(0.1)
  })
  it('sits a swimming bird with its body partly below the origin', () => {
    const m = buildBird(coot)
    m.group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(m.parts.body)
    expect(box.min.y).toBeLessThan(0)
    expect(box.max.y).toBeGreaterThan(0)
  })
  it("sits a standing bird's body on its legs", () => {
    const standing = standingCoot()
    const m = buildBird(standing)
    m.group.updateMatrixWorld(true)
    // The body mesh's own geometry (not its subtree, which includes the legs down at y=0)
    // should sit with its underside at y = legLen, clear of the ground.
    const s = standing.length / (standing.body.length + standing.neck.length * 0.6 + standing.bill.length + standing.tail.length)
    const legLen = standing.legs.length * s
    expect(ownBox(m.parts.body).min.y).toBeCloseTo(legLen, 2)
  })
  it('folded wings hang down along the flanks', () => {
    const m = buildBird(coot)
    m.pose({ ...defaultPose(), wingSpread: 0 })
    m.group.updateMatrixWorld(true)
    // Use the body mesh's own geometry box, not Box3.setFromObject(body): the wings are
    // children of body, so a subtree box would trivially always contain the wing box.
    const bodyBox = ownBox(m.parts.body)
    const wingBox = new THREE.Box3().setFromObject(m.parts.wingL)
    expect(wingBox.max.y).toBeLessThanOrEqual(bodyBox.max.y + 0.01)
    const bodyCenterY = (bodyBox.min.y + bodyBox.max.y) / 2
    expect(wingBox.min.y).toBeLessThan(bodyCenterY)

    m.pose({ ...defaultPose(), wingSpread: 1, wingPhase: 0.25 })
    m.group.updateMatrixWorld(true)
    const bodyBox2 = ownBox(m.parts.body)
    const wingBox2 = new THREE.Box3().setFromObject(m.parts.wingL)
    expect(wingBox2.max.y).toBeGreaterThan(bodyBox2.max.y)
  })
  it('lifts the tail for a positive tailTilt, as PoseState says, and lowers it for a negative one', () => {
    const m = buildBird(coot)
    const geo = (m.parts.tail as THREE.Mesh).geometry
    geo.computeBoundingBox()
    /** the tail's tip, where its box ends behind the hinge, in the world */
    const tip = (tailTilt: number) => {
      m.pose({ ...defaultPose(), tailTilt })
      m.group.updateMatrixWorld(true)
      return new THREE.Vector3(geo.boundingBox!.min.x, 0, 0).applyMatrix4(m.parts.tail.matrixWorld).y
    }
    expect(tip(0.3)).toBeGreaterThan(tip(0) + 0.005)
    expect(tip(-0.3)).toBeLessThan(tip(0) - 0.005)
  })
  it("a standing bird's body centre sits well above its feet", () => {
    const heron = getSpec('grbher3')
    const m = buildBird(heron)
    expect(m.center.y).toBeGreaterThan(0.4)
  })
})
