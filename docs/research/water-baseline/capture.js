async (page) => {
  const BASE = '__BASE__', OUT = '__OUT__'
  // [name, dx, dy, optic]: drags from a fresh load (heading 20, pitch 0, the eye 4.13 m above the water) in the eye view; a pixel of drag is 0.0044 rad
  const FRAMES = [
    ['1-eye-heading', 0, 0, null],
    ['2-eye-near-shore', 0, -48, null],
    ['3-binoculars-near-water', 58, -58, 'b'],
    ['4-telescope-far-shallows', 72, -15, 't'],
    ['5-binoculars-bench', -156, -36, 'b'],
    ['6-telescope-snag', -18, -18, 't'],
  ]
  await page.setViewportSize({ width: 1280, height: 720 })
  const shots = []
  for (const [name, dx, dy, optic] of FRAMES) {
    await page.goto(BASE)
    await page.getByText('Begin').first().waitFor({ state: 'visible', timeout: 60000 })
    await page.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Begin')); return b && !b.disabled }, null, { timeout: 60000 })
    await page.waitForTimeout(500)
    await page.getByText('Begin').first().click()
    await page.waitForTimeout(1500)
    await page.evaluate(([dx, dy]) => {
      const c = document.querySelector('#app canvas')
      const t = (x, y) => new Touch({ identifier: 1, target: c, clientX: x, clientY: y })
      c.dispatchEvent(new TouchEvent('touchstart', { touches: [t(600, 400)], bubbles: true }))
      c.dispatchEvent(new TouchEvent('touchmove', { touches: [t(600 + dx, 400 + dy)], bubbles: true }))
      c.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }))
    }, [dx, dy])
    if (optic) await page.keyboard.press(optic)
    await page.waitForTimeout(optic ? 3500 : 1000)
    const path = `${OUT}/${name}.png`
    await page.screenshot({ path })
    shots.push(path)
  }
  return shots
}
