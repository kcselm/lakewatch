import { fresnelExact, fresnelSchlick, reflectionOffset, REFLECT } from './fresnel'

const deg = (d: number) => d * Math.PI / 180

describe('fresnel', () => {
  it('matches the research\'s exact table', () => {
    const table: [number, number][] = [[1, 0.896], [1.4, 0.858], [3, 0.722], [6, 0.525], [9, 0.385], [30, 0.060], [90, 0.020]]
    for (const [g, r] of table) expect(fresnelExact(deg(g))).toBeCloseTo(r, 2)
  })
  it('is followed by Schlick within 0.06 from 1 to 90 degrees, 0.02 head-on, and at least 0.85 at 1.4 degrees', () => {
    for (let g = 1; g <= 90; g += 0.5) expect(Math.abs(fresnelSchlick(deg(g)) - fresnelExact(deg(g)))).toBeLessThanOrEqual(0.06)
    expect(fresnelSchlick(deg(90))).toBeCloseTo(0.02, 6)
    expect(fresnelSchlick(deg(1.4))).toBeGreaterThanOrEqual(0.85)
    expect(REFLECT.cap).toBe(0.85)
  })
})

describe('reflectionOffset', () => {
  const eye = [deg(60), deg(60) * 16 / 9] as const, telescope = [deg(2), deg(2) * 16 / 9] as const
  it('never shifts a reflection more than 0.15 UV, whatever the slope and view', () => {
    for (const [v, h] of [eye, telescope]) for (const s of [-1, -0.07, 0.07, 1]) for (const g of [1.4, 9]) {
      for (const o of reflectionOffset(s, s, deg(g), v, h)) expect(Math.abs(o)).toBeLessThanOrEqual(REFLECT.clampUV)
    }
  })
  it('barely moves it on glassy water: a slope of 0.001 shifts it under 0.003 UV to the eye', () => {
    const [x, y] = reflectionOffset(0.001, 0.001, deg(5), ...eye)
    expect(Math.abs(x)).toBeLessThan(0.003)
    expect(Math.abs(y)).toBeLessThan(0.003)
  })
  it('smears it into a column: along the line of sight 1/sin(grazing) times more than across', () => {
    const [x, y] = reflectionOffset(0.01, 0.01, deg(3), deg(60), deg(60))
    expect(y / x).toBeCloseTo(1 / Math.sin(deg(3)), 3)
  })
})
