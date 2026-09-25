import * as THREE from 'three'
import { defaultPose, type BirdModel, type BirdParts, type PoseState } from './model'
import { resolvePlumage, type SpeciesSpec, type Plumage } from './spec'
import { paintByDirection, paintSolid } from './paint'

const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0 })
const MAT_FLAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0, side: THREE.DoubleSide })

function mesh(geo: THREE.BufferGeometry, name: string, mat = MAT): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat)
  m.name = name
  m.castShadow = true
  return m
}

function billGeometry(spec: SpeciesSpec, s: number): THREE.BufferGeometry {
  const { length, thickness, shape } = spec.bill
  const L = length * s, T = thickness * s
  let g: THREE.BufferGeometry
  switch (shape) {
    case 'flat':
      g = new THREE.BoxGeometry(L, T * 0.5, T * 1.4)
      break
    case 'dagger':
      g = new THREE.ConeGeometry(T * 0.5, L, 6).rotateZ(-Math.PI / 2)
      break
    case 'hooked': {
      g = new THREE.ConeGeometry(T * 0.6, L, 6).rotateZ(-Math.PI / 2)
      const pos = g.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) if (pos.getX(i) > L * 0.3) pos.setY(i, pos.getY(i) - (pos.getX(i) - L * 0.3) * 0.5)
      break
    }
    default:
      g = new THREE.ConeGeometry(T * 0.55, L, 6).rotateZ(-Math.PI / 2)
  }
  g.translate(L / 2, 0, 0)
  return g
}

function wingGeometry(spec: SpeciesSpec, s: number, sign: 1 | -1): THREE.BufferGeometry {
  const L = spec.wing.length * s, W = spec.wing.width * s
  // A tapered plane hinged at the shoulder (origin), extending along ±z
  const g = new THREE.PlaneGeometry(W, L, 1, 3).rotateX(-Math.PI / 2)
  g.translate(-W * 0.15, 0, (L / 2) * sign)
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const t = Math.abs(pos.getZ(i)) / L
    pos.setX(i, pos.getX(i) * (1 - t * 0.45) - t * W * 0.25)   // narrows and sweeps back toward the tip
  }
  return g
}

export function buildBird(spec: SpeciesSpec, variant?: string): BirdModel {
  const p: Plumage = resolvePlumage(spec, variant)
  const s = spec.length / (spec.body.length + spec.neck.length * 0.6 + spec.bill.length + spec.tail.length)  // scale so total length matches
  const group = new THREE.Group()
  group.name = `bird:${spec.code}${variant ? ':' + variant : ''}`

  // Body: ellipsoid, +x forward
  const bodyGeo = new THREE.SphereGeometry(0.5, 20, 14).scale(spec.body.length * s, spec.body.height * s, spec.body.width * s)
  paintByDirection(bodyGeo, { top: p.back, side: p.flank, bottom: p.breast, front: p.breast, back: p.rump })
  const body = mesh(bodyGeo, 'body')

  // Legs: two cylinders below the body, hidden inside it when swimming
  const legLen = spec.legs.length * s
  const legs = new THREE.Group()
  legs.name = 'legs'
  for (const z of [-0.18, 0.18]) {
    const lg = new THREE.CylinderGeometry(spec.legs.thickness * s * 0.5, spec.legs.thickness * s * 0.5, legLen, 6)
    paintSolid(lg, p.legs)
    const leg = mesh(lg, 'leg')
    leg.position.set(0.05 * s, -legLen / 2, z * spec.body.width * s)
    legs.add(leg)
    const fg = new THREE.BoxGeometry(spec.legs.thickness * s * 3, spec.legs.thickness * s * 0.4, spec.legs.thickness * s * 2)
    paintSolid(fg, p.legs)
    const foot = mesh(fg, 'foot')
    foot.position.set(0.1 * s, -legLen, z * spec.body.width * s)
    legs.add(foot)
  }

  // Neck: a tapered cylinder from the front-top of the body, angled up; the head hangs at its end.
  // The cylinder is a mesh nested inside a pivot group named 'neck' (parts.neck): the pivot carries
  // rotation, the mesh carries the tuck scale, and the head is a sibling of the mesh under the pivot
  // so it inherits rotation but never the mesh's non-uniform scale (see pose()).
  const neckLen = spec.neck.length * s
  const neckGeo = new THREE.CylinderGeometry(spec.neck.thickness * s * 0.4, spec.neck.thickness * s * 0.55, Math.max(neckLen, 0.01), 8)
  paintByDirection(neckGeo, { top: p.back, side: p.throat, bottom: p.throat })
  neckGeo.translate(0, neckLen / 2, 0)
  const neckMesh = mesh(neckGeo, 'neckMesh')
  const neck = new THREE.Group()
  neck.name = 'neck'
  neck.position.set(spec.body.length * s * 0.38, spec.body.height * s * 0.2, 0)
  neck.add(neckMesh)

  // Head: sphere at the neck tip, bill and eyes attached
  const headR = spec.head.size * s * 0.5
  const headGeo = new THREE.SphereGeometry(headR, 16, 12)
  paintByDirection(headGeo, { top: p.crown, side: p.cheek, bottom: p.throat })
  const head = mesh(headGeo, 'head')
  head.position.set(0, neckLen, 0)
  const bill = mesh(billGeometry(spec, s), 'bill')
  paintSolid(bill.geometry, p.bill)
  bill.position.set(headR * 0.85, -headR * 0.1, 0)
  head.add(bill)
  for (const z of [-1, 1]) {
    const eg = new THREE.SphereGeometry(headR * 0.18, 8, 6)
    paintSolid(eg, p.eye)
    const eye = mesh(eg, 'eye')
    eye.position.set(headR * 0.45, headR * 0.2, z * headR * 0.8)
    head.add(eye)
  }
  neck.add(head)

  // Wings: hinged at the shoulders
  const wingL = mesh(wingGeometry(spec, s, -1), 'wingL', MAT_FLAT)
  const wingR = mesh(wingGeometry(spec, s, 1), 'wingR', MAT_FLAT)
  for (const w of [wingL, wingR]) {
    paintByDirection(w.geometry, { top: p.wing, side: p.wing, bottom: p.flank })
    if (p.speculum) {
      const col = w.geometry.getAttribute('color') as THREE.BufferAttribute
      const pos = w.geometry.getAttribute('position') as THREE.BufferAttribute
      const sc = new THREE.Color(p.speculum)
      for (let i = 0; i < pos.count; i++) {
        const t = Math.abs(pos.getZ(i)) / (spec.wing.length * s)
        if (t > 0.3 && t < 0.7 && pos.getX(i) < 0) col.setXYZ(i, sc.r, sc.g, sc.b)
      }
    }
    w.position.set(spec.body.length * s * 0.05, spec.body.height * s * 0.35, 0)
  }

  // Tail: a flat wedge behind the body
  const tailLen = spec.tail.length * s
  const tailGeo = new THREE.BoxGeometry(Math.max(tailLen, 0.01), spec.body.height * s * 0.08, spec.body.width * s * 0.6)
  paintSolid(tailGeo, p.tail)
  tailGeo.translate(-tailLen / 2, 0, 0)
  const tail = mesh(tailGeo, 'tail')
  tail.position.set(-spec.body.length * s * 0.48, spec.body.height * s * 0.1, 0)
  tail.rotation.z = THREE.MathUtils.degToRad(spec.tail.angle)

  body.add(neck, wingL, wingR, tail, legs)
  group.add(body)

  // Origin: waterline for swimmers (body sits `draft` deep), feet for the rest
  if (spec.posture === 'swimming') {
    body.position.y = spec.body.height * s * (0.5 - spec.draft)
    legs.visible = false
  } else {
    body.position.y = legLen + spec.body.height * s * 0.5
    // legs hangs from the body's underside (not its center), so the feet land at group y = 0
    legs.position.y = -spec.body.height * s * 0.5
  }

  const restNeck = THREE.MathUtils.degToRad(spec.neck.angle)
  const parts: BirdParts = { body, neck, head, bill, wingL, wingR, tail, legs }
  const radius = Math.max(spec.length * 0.5, (legLen + spec.body.height * s + neckLen) * 0.5)

  function pose(st: PoseState) {
    // Neck: tucked (angle steeper, shorter) .. extended (angle per spec, full length)
    const ext = THREE.MathUtils.clamp(st.neckExtend, 0, 1)
    const stretch = 0.55 + 0.45 * ext
    neck.rotation.z = -(Math.PI / 2 - restNeck) - (1 - ext) * 0.7
    neckMesh.scale.y = stretch
    // head is a sibling of the neck mesh under the pivot, so it never inherits the mesh's
    // non-uniform scale; track the shortened tip explicitly instead
    head.position.set(st.headBob * spec.body.length * s, neckLen * stretch, 0)
    head.rotation.z = Math.PI / 2 - restNeck + (1 - ext) * 0.7   // keep the bill level
    // Wings: hang down along the flanks when spread is 0, blending into the flap as spread rises to 1.
    // wing geometry extends along -z (left) / +z (right) from the shoulder hinge (see wingGeometry());
    // rotating about x by a NEGATIVE angle maps -z toward -y (down), dropping the left wing tip down
    // along the left flank, and a POSITIVE angle drops the right wing's +z tip down the same way
    // (verified numerically: Rx(-0.5) sends local (0,0,-1) to y=-0.48, Rx(+0.5) sends (0,0,1) to y=-0.48).
    const spread = THREE.MathUtils.clamp(st.wingSpread, 0, 1)
    const flap = Math.sin(st.wingPhase * Math.PI * 2) * 0.9 * spread
    const FOLD = 1.25   // radians: wing plane swung down along the flank
    wingL.rotation.x = -(1 - spread) * FOLD + flap
    wingR.rotation.x = (1 - spread) * FOLD - flap
    wingL.rotation.y = (1 - spread) * 0.15
    wingR.rotation.y = -(1 - spread) * 0.15
    const zScale = 0.45 + 0.55 * spread     // folded wings are shorter along their own axis
    wingL.scale.set(1, 1, zScale)
    wingR.scale.copy(wingL.scale)
    tail.rotation.z = THREE.MathUtils.degToRad(spec.tail.angle) + st.tailTilt
    body.rotation.set(st.lean.x, 0, st.lean.z)
  }
  pose(defaultPose())

  // Box3.setFromObject updates the group's own world matrices as needed; the group has no
  // parent yet (or sits at its parent's origin), so this box is effectively local-space.
  const center = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3())

  return {
    group, parts, radius, pose, center,
    dispose() {
      group.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose() })
    },
  }
}
