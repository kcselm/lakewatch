import { applyLookDelta, shouldHandleInput, LookControls } from './look'

describe('shouldHandleInput', () => {
  it('mirrors the enabled callback', () => {
    expect(shouldHandleInput(() => true)).toBe(true)
    expect(shouldHandleInput(() => false)).toBe(false)
  })
})

describe('LookControls pause gating', () => {
  it('does not request pointer lock on click while enabled() is false', () => {
    const listeners = new Map<string, (e: unknown) => void>()
    let lockRequested = false
    const fakeCanvas = {
      addEventListener(type: string, fn: (e: unknown) => void) { listeners.set(type, fn) },
      requestPointerLock() { lockRequested = true },
    } as unknown as HTMLElement
    new LookControls(fakeCanvas, 0, () => false)
    listeners.get('click')?.({})
    expect(lockRequested).toBe(false)
  })
})

describe('applyLookDelta', () => {
  it('turns right for positive dx and clamps pitch', () => {
    const s = applyLookDelta({ yaw: 0, pitch: 0 }, 100, 0, 0.01, 1)
    expect(s.yaw).toBeCloseTo(1)
    const up = applyLookDelta({ yaw: 0, pitch: 0 }, 0, -100000, 0.01, 1)
    expect(up.pitch).toBeCloseTo((75 * Math.PI) / 180)
    const down = applyLookDelta({ yaw: 0, pitch: 0 }, 0, 100000, 0.01, 1)
    expect(down.pitch).toBeCloseTo((-75 * Math.PI) / 180)
  })
  it('scales sensitivity by fovScale so binoculars are not twitchy', () => {
    const a = applyLookDelta({ yaw: 0, pitch: 0 }, 100, 0, 0.01, 1)
    const b = applyLookDelta({ yaw: 0, pitch: 0 }, 100, 0, 0.01, 0.125)
    expect(b.yaw).toBeCloseTo(a.yaw * 0.125)
  })
})
