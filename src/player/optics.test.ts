import * as THREE from 'three'
import { OPTICS, Optics, nextMode, swayOffset } from './optics'
import type { LookControls } from './look'

describe('optics', () => {
  it('binoculars are 8x and the telescope 30x relative to 60°', () => {
    expect(OPTICS.eye.fov).toBe(60)
    expect(OPTICS.binoculars.fov).toBeCloseTo(7.5)
    expect(OPTICS.telescope.fov).toBeCloseTo(2)
  })
  it('the telescope has no hand sway and pans slower', () => {
    expect(OPTICS.telescope.sway).toBe(0)
    expect(OPTICS.binoculars.sway).toBeGreaterThan(0)
    expect(OPTICS.telescope.panScale).toBeLessThan(OPTICS.binoculars.panScale)
  })
  it('nextMode steps through the order and clamps at the ends', () => {
    expect(nextMode('eye', 1)).toBe('binoculars')
    expect(nextMode('binoculars', 1)).toBe('telescope')
    expect(nextMode('telescope', 1)).toBe('telescope')
    expect(nextMode('eye', -1)).toBe('eye')
  })
  it('sway is bounded by its amount and zero when amount is zero', () => {
    for (let t = 0; t < 20; t += 0.1) {
      const s = swayOffset(t, 0.002)
      expect(Math.abs(s.x)).toBeLessThanOrEqual(0.002 + 1e-9)
      expect(Math.abs(s.y)).toBeLessThanOrEqual(0.002 + 1e-9)
    }
    expect(swayOffset(3, 0)).toEqual({ x: 0, y: 0 })
  })
  it('raises the near plane with the optics, eased along the raise with the fov, and lowers it again with them', () => {
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 2000)
    const look = { fovScale: 1, applyTo() {} } as unknown as LookControls
    const optics = new Optics()
    const run = (frames: number) => Array.from({ length: frames }, () => {
      optics.update(1 / 60, camera, look)
      return { near: camera.near, fov: camera.fov }
    })
    run(5)
    expect(camera.near).toBe(OPTICS.eye.near)
    // how far along the raise, in log space, a value lies between two modes' values
    const along = (v: number, a: number, b: number) => Math.log(v / a) / Math.log(b / a)
    for (const mode of ['binoculars', 'telescope'] as const) {
      const eye = OPTICS.eye, up = OPTICS[mode]
      optics.setMode(mode)
      const raise = run(Math.ceil(up.raiseSeconds * 60) + 2)
      const mid = raise[Math.floor(raise.length / 2)]!
      expect(mid.near).toBeGreaterThan(eye.near)
      expect(mid.near).toBeLessThan(up.near)
      expect(along(mid.near, eye.near, up.near)).toBeCloseTo(along(mid.fov, eye.fov, up.fov), 9)
      for (let i = 1; i < raise.length; i++) expect(raise[i]!.near).toBeGreaterThanOrEqual(raise[i - 1]!.near)
      expect(camera.near).toBe(up.near)
      expect(camera.projectionMatrix.elements).toEqual(new THREE.PerspectiveCamera(up.fov, 16 / 9, up.near, 2000).projectionMatrix.elements)
      // and down again: the eye's near plane back, eased the same way
      optics.setMode('eye')
      const lower = run(Math.ceil(eye.raiseSeconds * 60) + 2)
      for (let i = 1; i < lower.length; i++) expect(lower[i]!.near).toBeLessThanOrEqual(lower[i - 1]!.near)
      expect(camera.near).toBe(eye.near)
      expect(camera.fov).toBe(eye.fov)
    }
  })
})
