import { lakeHeightfield, terrainColor, valueNoise2, wetDarkening, WET, BENCH, SHELF } from './heightfield'

describe('lakeHeightfield', () => {
  const hf = lakeHeightfield(1)
  it('is above water under the player and below water mid-lake', () => {
    expect(hf.sample(0, 0)).toBeGreaterThan(0.8)
    expect(hf.sample(0, -35)).toBeLessThan(-1)
  })
  it('keeps the mudflat just above water', () => {
    const y = hf.sample(20, -8)
    expect(y).toBeGreaterThan(0)
    expect(y).toBeLessThan(0.4)
  })
  it('lays a flat bench under a few centimetres of water just past the shallows, where the dowitchers feed', () => {
    for (let x = BENCH.x[0]; x <= BENCH.x[1]; x += 0.5) {
      for (let z = BENCH.z[0]; z <= BENCH.z[1]; z += 0.25) expect(hf.sample(x, z), `(${x}, ${z})`).toBeCloseTo(-BENCH.depth, 9)
    }
    // it eases back into the lake bed within a metre: 2 m out on every side (the shallows' own grid row, the deep water
    // beyond, and either end) the ground is exactly the lake bed without the bench, while half a metre out it is not
    const bed = lakeHeightfield(1, { bench: false })
    const around: [number, number][] = [[22, BENCH.z[1] + 2], [22, BENCH.z[0] - 2], [BENCH.x[0] - 2, -13], [BENCH.x[1] + 2, -13]]
    for (const [x, z] of around) expect(hf.sample(x, z), `(${x}, ${z})`).toBe(bed.sample(x, z))
    expect(hf.sample(22, BENCH.z[1] + 0.5)).not.toBe(bed.sample(22, BENCH.z[1] + 0.5))
  })
  it('lays a shelf along the far waterline, sloping evenly from ankle-deep at the shore to knee-deep, where the herons wade', () => {
    const plane = (z: number) => -(SHELF.depth[0] + ((SHELF.depth[1] - SHELF.depth[0]) * (z - SHELF.z[0])) / (SHELF.z[1] - SHELF.z[0]))
    for (let x = SHELF.x[0]; x <= SHELF.x[1]; x += 0.5) {
      for (let z = SHELF.z[0]; z <= SHELF.z[1]; z += 0.25) expect(hf.sample(x, z), `(${x}, ${z})`).toBeCloseTo(plane(z), 9)
    }
    // it eases back into the ground within a metre: 2 m out on every side the ground is exactly what it is without the
    // shelf (the far bank behind, the lake bed in front, either end), while half a metre out it is not
    const without = lakeHeightfield(1, { shelf: false })
    const around: [number, number][] = [[2, SHELF.z[0] - 2], [2, SHELF.z[1] + 2], [SHELF.x[0] - 2, -62], [SHELF.x[1] + 2, -62]]
    for (const [x, z] of around) expect(hf.sample(x, z), `(${x}, ${z})`).toBe(without.sample(x, z))
    expect(hf.sample(2, SHELF.z[1] + 0.5)).not.toBe(without.sample(2, SHELF.z[1] + 0.5))
    // the bank still rises behind it
    expect(hf.sample(2, SHELF.z[0] - 2)).toBeGreaterThan(0.5)
  })
  it('rises on the far shore', () => {
    expect(hf.sample(0, -66)).toBeGreaterThan(0.5)
  })
  it('keeps the far ground low enough to sit under the sky', () => {
    expect(hf.sample(0, -300)).toBeLessThan(8)
  })
  it('is deterministic', () => {
    expect(lakeHeightfield(3).sample(4.2, -9.1)).toBe(lakeHeightfield(3).sample(4.2, -9.1))
  })
})

describe('terrainColor', () => {
  it('is mud brown at the waterline and green on high flat ground', () => {
    const [r, g, b] = terrainColor(0.05, 0)
    expect(r).toBeGreaterThan(g)
    expect(g).toBeGreaterThan(b)
    const [r2, g2] = terrainColor(1.5, 0)
    expect(g2).toBeGreaterThan(r2)
  })
  it('shifts toward gravel as slope increases', () => {
    const gravel: [number, number, number] = [0.52, 0.50, 0.46]
    const dist = (c: [number, number, number]) =>
      Math.hypot(c[0] - gravel[0], c[1] - gravel[1], c[2] - gravel[2])
    const y = 1.0
    const flat = terrainColor(y, 0)
    const steep = terrainColor(y, 1.0)
    expect(dist(steep)).toBeLessThan(dist(flat))
    // blue channel rises toward gravel's blue and the green/red gap narrows
    expect(steep[2]).toBeGreaterThan(flat[2])
    expect(Math.abs(steep[1] - steep[0])).toBeLessThan(Math.abs(flat[1] - flat[0]))
  })
})

describe('valueNoise2', () => {
  it('stays within 0..1 over a grid of sample points', () => {
    for (let x = -5; x <= 5; x += 0.37) {
      for (let z = -5; z <= 5; z += 0.53) {
        const v = valueNoise2(x, z, 2)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
      }
    }
  })
  it('at a fractional point lies between the four surrounding lattice values', () => {
    const xi = 3, zi = -2
    const corners = [
      valueNoise2(xi, zi, 5),
      valueNoise2(xi + 1, zi, 5),
      valueNoise2(xi, zi + 1, 5),
      valueNoise2(xi + 1, zi + 1, 5),
    ]
    const lo = Math.min(...corners), hi = Math.max(...corners)
    const v = valueNoise2(xi + 0.5, zi + 0.5, 5)
    expect(v).toBeGreaterThanOrEqual(lo - 1e-9)
    expect(v).toBeLessThanOrEqual(hi + 1e-9)
  })
  it('different seeds give different values at the same point', () => {
    expect(valueNoise2(1.3, 4.2, 1)).not.toBe(valueNoise2(1.3, 4.2, 2))
  })
  it('is deterministic for the same inputs', () => {
    expect(valueNoise2(1.3, 4.2, 1)).toBe(valueNoise2(1.3, 4.2, 1))
  })
})

describe('wetDarkening', () => {
  // the research's thresholds (2026-09-30-lake-water.md section 9)
  it('darkens mud at the waterline to 0.50-0.60 of dry, and leaves it at least 0.97 of dry 0.10 m up', () => {
    expect(wetDarkening(0, 0)).toBeGreaterThanOrEqual(0.5)
    expect(wetDarkening(0, 0)).toBeLessThanOrEqual(0.6)
    expect(wetDarkening(0.0999, 0)).toBeGreaterThanOrEqual(0.97)
  })
  it('darkens gravel at the waterline to 0.65-0.75 of dry, and dries it within 3 cm', () => {
    expect(wetDarkening(0, 1)).toBeGreaterThanOrEqual(0.65)
    expect(wetDarkening(0, 1)).toBeLessThanOrEqual(0.75)
    expect(wetDarkening(WET.gravel.height, 1)).toBe(1)
  })
  it('leaves the ground under the water and above the band unchanged', () => {
    for (const g of [0, 0.5, 1]) {
      expect(wetDarkening(-0.01, g)).toBe(1)
      expect(wetDarkening(WET.mud.height, g)).toBe(1)
      expect(wetDarkening(2, g)).toBe(1)
    }
  })
  it('dries steadily with height', () => {
    for (let h = 0; h < 0.1; h += 0.005) expect(wetDarkening(h + 0.005, 0.3)).toBeGreaterThanOrEqual(wetDarkening(h, 0.3))
  })
})
