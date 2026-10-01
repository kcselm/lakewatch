import { lakeHeightfield, terrainColor, valueNoise2, wetDarkening, flatShoreDistance, WET, BENCH, SHELF, FLAT } from './heightfield'

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
  it('lays a grassy flat on the right shore past the mudflat: its top a few tens of centimetres up, gently uneven', () => {
    const top: number[] = []
    for (let x = FLAT.x[0]; x <= FLAT.x[1]; x += 0.5) {
      for (let z = FLAT.z[0]; z <= FLAT.z[1]; z += 0.5) {
        if (flatShoreDistance(x, z) * FLAT.slope >= FLAT.top + FLAT.rough) top.push(hf.sample(x, z))
      }
    }
    expect(top.length).toBeGreaterThan(400)
    expect(Math.min(...top)).toBeGreaterThanOrEqual(FLAT.top - FLAT.rough / 2)
    expect(Math.max(...top)).toBeLessThanOrEqual(FLAT.top + FLAT.rough / 2)
    expect(Math.max(...top) - Math.min(...top)).toBeGreaterThan(FLAT.rough / 4)
  })
  it('slopes the flat into the water at 1 in 4 square to its shore, where the old bank stood a metre high', () => {
    const without = lakeHeightfield(1, { flat: false })
    let ramp = 0
    for (let x = FLAT.x[0]; x <= FLAT.x[1]; x += 0.25) {
      for (let z = FLAT.z[0]; z <= FLAT.z[1]; z += 0.25) {
        const s = flatShoreDistance(x, z)
        // on the slope: below the top, above the lake bed it meets
        if (s * FLAT.slope > Math.min(without.sample(x, z), 0) && s * FLAT.slope < FLAT.top - FLAT.rough / 2) {
          ramp++
          expect(hf.sample(x, z), `(${x}, ${z})`).toBeCloseTo(s * FLAT.slope, 9)
        }
      }
    }
    expect(ramp).toBeGreaterThan(300)
    // the old bank: a metre's step at the basin's rim, now gone
    expect(without.sample(38, -16) - without.sample(36, -18)).toBeGreaterThan(0.8)
  })
  it('eases the flat back into the ground within a metre on its lake sides and a gentler slope on its land sides, and leaves the mudflat, the bench, and the shallows as they were', () => {
    const without = lakeHeightfield(1, { flat: false })
    const around: [number, number][] = [[FLAT.x[0] - 2, -16], [FLAT.x[1] + FLAT.back + 1, -16], [37, FLAT.z[0] - 2], [37, FLAT.z[1] + FLAT.back + 1]]
    for (const [x, z] of around) expect(hf.sample(x, z), `(${x}, ${z})`).toBe(without.sample(x, z))
    expect(hf.sample(FLAT.x[1] + 0.5, -14)).not.toBe(without.sample(FLAT.x[1] + 0.5, -14))
    // behind it, the ground rises back to the old bank's height no steeper than 1 in 2
    for (let x = FLAT.x[1]; x < FLAT.x[1] + FLAT.back + 1; x += 0.25) expect(Math.abs(hf.sample(x + 0.25, -14) - hf.sample(x, -14)), `x ${x}`).toBeLessThan(0.125)
    for (let x = 16; x <= 28; x += 0.5) for (let z = -16; z <= -5; z += 0.5) expect(hf.sample(x, z), `(${x}, ${z})`).toBe(without.sample(x, z))
  })
  it('makes the flat\'s dry ground lawn, and nowhere else', () => {
    expect(hf.lawn!(38, -12)).toBe(1)
    expect(hf.lawn!(30, -20)).toBe(0)                      // out in the lake
    expect(hf.lawn!(0, 0)).toBe(0)                         // the near bank: grass by its height, not lawn
    expect(lakeHeightfield(1, { flat: false }).lawn!(38, -12)).toBe(0)
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
  it('is grass on a lawn, however low it lies', () => {
    const [r, g] = terrainColor(0.3, 0)
    expect(r).toBeGreaterThan(g)
    const [lr, lg, lb] = terrainColor(0.3, 0, 1)
    expect(lg).toBeGreaterThan(lr)
    expect(lg).toBeGreaterThan(lb)
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
