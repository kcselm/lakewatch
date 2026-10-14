import * as THREE from 'three'
import { lakeHeightfield } from './heightfield'
import { terrainSurface } from './terrain'
import { Wind } from './wind'
import { createReedBed, layoutLeaves, cattailGeometry, tuleGeometry, LEAVES } from './reedbed'
import { PART, inBand } from './stems'
import { LEAF, leafSway, leafWidthAt } from './vegetation'

const hf = lakeHeightfield(7)
const surface = terrainSurface(hf)
const ground = (x: number, z: number) => surface.sample(x, z)
const sceneWind = () => new Wind({ direction: 240, strength: 0.35, gustiness: 0.5, seed: 7 })
const bed = createReedBed({ heightfield: hf, ground, wind: sceneWind() })
const stems = bed.stems.stems
const leaves = layoutLeaves(stems, { heightfield: hf, ground, seed: 13 })

describe('the leaves', () => {
  it('are 10-23 mm wide at the base, narrowing to a point', () => {
    for (const l of leaves) {
      expect(l.width).toBeGreaterThanOrEqual(0.010)
      expect(l.width).toBeLessThanOrEqual(0.023)
      expect(leafWidthAt(l, 0)).toBe(l.width)
      expect(leafWidthAt(l, 1)).toBeCloseTo(0.15 * l.width, 9)
    }
    // and so the shader draws them: each blade's width at its base from its instance's attribute
    const blade = bed.leaves.geometry.getAttribute('aBlade') as THREE.InstancedBufferAttribute
    expect(blade.count).toBe(bed.leaves.count)
    for (let i = 0; i < blade.count; i++) {
      expect(blade.getX(i)).toBeGreaterThanOrEqual(0.010 - 1e-7)
      expect(blade.getX(i)).toBeLessThanOrEqual(0.023 + 1e-7)
    }
  })

  it('reach about the spikes\' height, 1.8-2.0 m at the tallest, a flowering shoot\'s below its spike\'s top', () => {
    const lengths = leaves.map(l => l.length)
    expect(Math.max(...lengths)).toBeLessThanOrEqual(2.0)
    expect(lengths.filter(v => v >= 1.8).length / lengths.length).toBeGreaterThan(0.25)
    // the first shoots are the flowering stalks' own, in their order
    let i = 0
    for (const s of stems) {
      if (s.kind !== 'cattail') continue
      while (i < leaves.length && Math.hypot(leaves[i]!.x - s.x, leaves[i]!.z - s.z) < 0.03) {
        expect(leaves[i]!.length).toBeLessThan(s.height)
        i++
      }
    }
    expect(i).toBeGreaterThan(stems.filter(s => s.kind === 'cattail').length * 3)
  })

  it('stand in the bed\'s band, each on the ground under it', () => {
    // a shoot's centre is in the band; its leaves spread 1.5 cm round it
    const near = (x: number, z: number) => [[0, 0], [0.015, 0.015], [0.015, -0.015], [-0.015, 0.015], [-0.015, -0.015]].some(([dx, dz]) => inBand(hf, x + dx!, z + dz!))
    for (const l of leaves) {
      expect(near(l.x, l.z)).toBe(true)
      expect(l.y).toBe(ground(l.x, l.z))
    }
  })

  it('are about 8000, three times the old reeds\' 6 cm blades, so the narrower ones still read as a dense bed', () => {
    expect(leaves.length).toBeGreaterThan(6000)
    expect(leaves.length).toBeLessThan(11000)
  })

  it('are yellow-green to tan, a quarter still green', () => {
    const green = new THREE.Color(LEAVES.colors.green), yellow = new THREE.Color(LEAVES.colors.yellow)
    const d = (a: THREE.Color, b: THREE.Color) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b)
    const greens = leaves.filter(l => d(l.color, green) < d(l.color, yellow)).length / leaves.length
    expect(greens).toBeGreaterThan(0.18)
    expect(greens).toBeLessThan(0.32)
  })

  it('twist either way into a loose helix', () => {
    for (const l of leaves) {
      expect(Math.abs(l.twist)).toBeGreaterThanOrEqual(0.4)
      expect(Math.abs(l.twist)).toBeLessThanOrEqual(1.6)
    }
    const right = leaves.filter(l => l.twist > 0).length / leaves.length
    expect(right).toBeGreaterThan(0.4)
    expect(right).toBeLessThan(0.6)
  })

  it('keep the old reeds\' lean: their tips 0.16-0.32 m downwind for a wind of 0.35 from calm to gusting, fluttering', () => {
    const wind = sceneWind()
    const dir = wind.state.dir
    for (const gust of [0, 1]) {
      for (let t = 0; t < 30; t += 0.37) {
        const state = { dir, strength: 0.35, gust, time: t }
        const tip = leafSway(1, 1.9, -10, -7, 0.4, 2.1, state)
        const along = tip.x * dir.x + tip.z * dir.y
        // the flutter is at most 0.05 (0.3 + 0.35) along each of the leaf's own x and z
        const flutter = LEAF.flutter * (0.3 + 0.35) * Math.SQRT2
        expect(along).toBeGreaterThanOrEqual(0.9 * 0.175 - flutter)
        expect(along).toBeLessThanOrEqual(0.9 * 0.35 + flutter)
        expect(tip.y).toBeLessThan(0)
      }
    }
    // nothing at the base
    const base = leafSway(0, 1.9, -10, -7, 0.4, 2.1, { dir, strength: 0.35, gust: 1, time: 3 })
    expect(Math.hypot(base.x, base.y, base.z)).toBe(0)
  })
})

describe('the stems\' geometry', () => {
  it('builds a cattail of stalk, spike and bare axis, every vertex tagged with its part', () => {
    const g = cattailGeometry()
    const part = g.getAttribute('aPart'), pos = g.getAttribute('position')
    const parts = new Set<number>()
    for (let i = 0; i < part.count; i++) {
      parts.add(part.getX(i))
      expect(pos.getY(i)).toBeGreaterThanOrEqual(0)
      expect(pos.getY(i)).toBeLessThanOrEqual(1)
    }
    expect([...parts].sort()).toEqual([PART.stalk, PART.spike, PART.axis])
    const index = g.getIndex()!
    for (let i = 0; i < index.count; i++) expect(index.getX(i)).toBeLessThan(pos.count)
    expect(pos.count).toBeLessThan(200)
  })

  it('builds a tule of its culm and a spikelet cluster about 5 cm across', () => {
    const g = tuleGeometry()
    const part = g.getAttribute('aPart'), pos = g.getAttribute('position')
    let reach = 0
    for (let i = 0; i < part.count; i++) {
      if (part.getX(i) === PART.cluster) reach = Math.max(reach, Math.hypot(pos.getX(i), pos.getY(i), pos.getZ(i)))
    }
    expect(reach).toBeGreaterThan(0.025)
    expect(reach).toBeLessThan(0.045)
    expect(pos.count).toBeLessThan(120)
  })

  it('winds its faces outward', () => {
    for (const g of [cattailGeometry(), tuleGeometry()]) {
      const pos = g.getAttribute('position'), nrm = g.getAttribute('normal'), index = g.getIndex()!
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3()
      let outward = 0, faces = 0
      for (let i = 0; i < index.count; i += 3) {
        a.fromBufferAttribute(pos, index.getX(i)); b.fromBufferAttribute(pos, index.getX(i + 1)); c.fromBufferAttribute(pos, index.getX(i + 2))
        const face = b.clone().sub(a).cross(c.clone().sub(a))
        if (face.lengthSq() < 1e-14) continue
        n.fromBufferAttribute(nrm, index.getX(i))
        faces++
        if (face.dot(n) > 0) outward++
      }
      expect(outward / faces).toBeGreaterThan(0.95)
    }
  })
})

describe('the bed', () => {
  it('draws each kind of stem in one instanced draw, every stem in it, with the leaves', () => {
    const nc = stems.filter(s => s.kind === 'cattail').length
    expect(bed.cattails.count).toBe(nc)
    expect(bed.tules.count).toBe(stems.length - nc)
    expect(bed.leaves.count).toBe(leaves.length)
    expect(bed.object.children).toEqual([bed.leaves, bed.cattails, bed.tules])
    const m = new THREE.Matrix4(), p = new THREE.Vector3()
    stems.forEach((s, i) => {
      const mesh = i < nc ? bed.cattails : bed.tules
      mesh.getMatrixAt(i < nc ? i : i - nc, m)
      p.setFromMatrixPosition(m)
      expect(p.toArray()).toEqual([s.x, s.base, s.z].map(v => Math.fround(v)))
    })
  })

  it('casts and receives shadows that bend with it: every mesh has a depth material of its own', () => {
    for (const mesh of [bed.leaves, bed.cattails, bed.tules]) {
      expect(mesh.castShadow).toBe(true)
      expect(mesh.receiveShadow).toBe(true)
      expect(mesh.customDepthMaterial).toBeInstanceOf(THREE.MeshDepthMaterial)
    }
  })

  it('writes every stem\'s top displacement into its instanced attribute each frame', () => {
    const wind = sceneWind()
    const tops = (mesh: THREE.InstancedMesh) => mesh.geometry.getAttribute('aTop') as THREE.InstancedBufferAttribute
    const v0 = tops(bed.cattails).version, v1 = tops(bed.tules).version
    for (let i = 0; i < 90; i++) { wind.update(1 / 60); bed.update(1 / 60, wind) }
    expect(tops(bed.cattails).version).toBeGreaterThan(v0)
    expect(tops(bed.tules).version).toBeGreaterThan(v1)
    const nc = bed.cattails.count
    stems.forEach((s, i) => {
      const a = i < nc ? tops(bed.cattails) : tops(bed.tules), j = i < nc ? i : i - nc
      const d = bed.stems.displacement(s)
      expect(a.getX(j)).toBeCloseTo(d.x, 6)
      expect(a.getY(j)).toBeCloseTo(d.z, 6)
    })
  })

  it('bends in its shaders: each replacement meets three.js\'s own chunks, and each program is its own', () => {
    const keys = new Set<string>()
    for (const mesh of [bed.leaves, bed.cattails, bed.tules]) {
      for (const [mat, lib] of [[mesh.material as THREE.Material, THREE.ShaderLib.standard], [mesh.customDepthMaterial!, THREE.ShaderLib.depth]] as const) {
        const shader = { uniforms: {}, vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader }
        mat.onBeforeCompile(shader as never, undefined as never)
        expect(shader.vertexShader).not.toContain('#include <begin_vertex>')
        expect(shader.vertexShader).toMatch(/vec3 transformed = (leafPos|stemP \+ stemUpTo\(stemT, stemOff\));/)
        if (lib === THREE.ShaderLib.standard) {
          expect(shader.vertexShader).not.toContain('#include <beginnormal_vertex>')
          expect(shader.vertexShader).toMatch(/(leafBend|stemBend)\(\);\nvec3 objectNormal/)
          expect(shader.fragmentShader).toMatch(/vLeafT|vStemColor, opacity/)
        }
        keys.add(mat.customProgramCacheKey())
      }
    }
    expect(keys.size).toBe(6)
  })

  it('carries its birds: the field it steps is the one it exposes', () => {
    const wind = sceneWind()
    const s = stems[0]!
    const before = bed.stems.displacement(s)
    bed.stems.hold(s, 0.065, s.height, 0.4, 0)
    for (let i = 0; i < 60; i++) { wind.update(1 / 60); bed.update(1 / 60, wind) }
    const after = bed.stems.displacement(s)
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(0.02)
  })
})
