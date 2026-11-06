import { test, expect, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
const root = process.env.RUEGG_REWIND_EVIDENCE || 'test-results/rewind-evidence'
const state = (page: Page, mode: string) => expect(page.locator('main')).toHaveAttribute('data-state', mode)
const ready = (page: Page, mode: string) => page.locator(`main[data-state="${mode}"][data-ui-ready="true"][data-visual-ready="true"]`).waitFor()
const click = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).click()
async function seekForward(page: Page, kind: 'master' | 'branch', time: number) {
  const video = page.getByTestId(`${kind}-video`)
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.readyState >= 2)).toBe(true)
  await video.evaluate((v: HTMLVideoElement, time) => { v.currentTime = time }, time)
}
async function welcome(page: Page) {
  await click(page, 'Step Inside'); await seekForward(page, 'master', 9.8); await ready(page, 'WELCOME_PAUSED')
}
async function hallway(page: Page) {
  await welcome(page); await click(page, 'Continue the Journey'); await seekForward(page, 'master', 16.9); await ready(page, 'HALLWAY_PAUSED')
}
async function room(page: Page) {
  await hallway(page); await click(page, 'Explore Room'); await seekForward(page, 'branch', 4.95); await ready(page, 'ROOM_AT_B3')
}
async function invitation(page: Page, focus = true) {
  await ready(page, 'INVITATION')
  if (focus) await expect(page.getByRole('button', { name: 'Step Inside', exact: true })).toBeFocused()
  expect(await page.locator('video').evaluateAll((vs) => vs.every((v) => (v as HTMLVideoElement).paused))).toBe(true)
  await expect(page.locator('video')).toHaveCount(2)
}
async function observe(page: Page) {
  await page.evaluate(() => {
    const samples: { at: number; mode: string; source: string; time: number; rate: number; valid: boolean; playing: number; focal: number }[] = []
    Object.assign(window, { rewindSamples: samples })
    const sample = () => {
      const main = document.querySelector('main')!
      if (!main) return
      const videos = [...document.querySelectorAll('video')]
      const visible = videos.find((v) => getComputedStyle(v).opacity === '1')
      const image = document.querySelector<HTMLImageElement>('img[data-active="true"]')
      samples.push({ at: performance.now(), mode: main.getAttribute('data-state')!, source: visible?.src.split('/').at(-1) || '', time: visible?.currentTime || 0, rate: visible?.playbackRate || 0, valid: Boolean(visible && visible.readyState >= 2 || image?.complete && image.naturalWidth), playing: videos.filter((v) => !v.paused).length, focal: Number((document.querySelector('[data-testid="source-plane"]') as HTMLElement).style.getPropertyValue('--portrait-focal')) })
      if (main.getAttribute('data-state') === 'REWINDING') requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
}
async function verifyRewind(page: Page, start: number, info: string, roomFirst = false) {
  await state(page, 'REWINDING'); await observe(page)
  await expect(page.locator('main section[aria-label="The welcome"], main section[aria-label="The choice"], main section[aria-label="The table"]')).toHaveCount(0)
  await expect.poll(() => page.locator('video').evaluateAll((vs) => vs.some((v) => (v as HTMLVideoElement).src.includes('reverse') && getComputedStyle(v).opacity === '1' && !(v as HTMLVideoElement).paused))).toBe(true)
  await mkdir(root, { recursive: true })
  await page.screenshot({ path: `${root}/${info}-rewinding.png` })
  await invitation(page)
  const samples = await page.evaluate(() => (window as unknown as { rewindSamples: { at: number; mode: string; source: string; time: number; rate: number; valid: boolean; playing: number; focal: number }[] }).rewindSamples)
  expect(samples.every((s) => s.valid && s.playing <= 1)).toBe(true)
  expect(samples.every((s) => ['REWINDING', 'INVITATION'].includes(s.mode))).toBe(true)
  const master = samples.filter((s) => s.source.includes('master-reverse')).map((s) => ({ ...s, time: s.time * (s.source.includes('-5x-') ? 5 : 1) }))
  expect(master.length).toBeGreaterThan(2)
  const plays = await page.evaluate(() => (window as unknown as { rewindPlays: { source: string; time: number; rate: number }[] }).rewindPlays)
  const first = plays.find((p) => p.source.includes('master-reverse'))!
  const initialTime = first.time * (first.source.includes('-5x-') ? 5 : 1)
  expect(initialTime).toBeGreaterThanOrEqual(start - .05)
  expect(initialTime).toBeLessThan(start + .3)
  expect(master.at(-1)!.time).toBeGreaterThan(23)
  if (roomFirst) expect(samples.find((s) => s.source.includes('reverse'))!.source).toContain('room-reverse')
  expect(master.at(-1)!.focal).toBeGreaterThan(.5)
  await writeFile(`${root}/${info}-samples.json`, JSON.stringify(samples, null, 2))
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const plays: { source: string; time: number; rate: number }[] = []
    Object.assign(window, { rewindPlays: plays })
    document.addEventListener('play', (event) => {
      const v = event.target
      if (v instanceof HTMLVideoElement && v.src.includes('reverse')) plays.push({ source: v.src, time: v.currentTime, rate: v.playbackRate })
    }, true)
  })
})

test('on-demand 5x rewind from reception, hallway and genuine finale restores invitation', async ({ page }, info) => {
  const requests: string[] = []; page.on('request', (r) => { if (r.url().includes('.mp4')) requests.push(r.url()) })
  for (const [chapter, start] of [['reception', 13.375], ['hallway', 6.25], ['finale', 0]] as const) {
    await page.goto('/'); await ready(page, 'INVITATION')
    if (chapter === 'reception') { expect(requests).toEqual([]); await welcome(page) }
    else { await hallway(page); if (chapter === 'finale') { await click(page, 'Continue to the Table'); await seekForward(page, 'master', 23.15); await ready(page, 'FINALE') } }
    expect(requests.some((r) => /master-reverse/.test(r))).toBe(chapter !== 'reception') // previous iterations only
    await click(page, 'Back to Beginning')
    await verifyRewind(page, start, `${info.project.name}-${chapter}`)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && scrollY === 0)).toBe(true)
  }
})

test('active master position survives pause and menu before rewind', async ({ page }, info) => {
  await page.goto('/'); await ready(page, 'INVITATION'); await click(page, 'Step Inside')
  await seekForward(page, 'master', 4)
  await click(page, 'Pause film')
  const time = await page.getByTestId('master-video').evaluate((v: HTMLVideoElement) => v.currentTime)
  await page.getByRole('button', { name: 'Menu', exact: false }).click()
  await expect(page.getByRole('dialog')).toHaveAttribute('data-menu-ready', 'true')
  await page.getByRole('dialog').getByRole('button', { name: 'Back to Beginning', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await verifyRewind(page, 23.375 - time, `${info.project.name}-paused-menu`)
})

test('active playback rewinds from its paused clock using native events when frame callbacks are unavailable', async ({ page }, info) => {
  await page.addInitScript(() => {
    delete (HTMLVideoElement.prototype as Partial<HTMLVideoElement>).requestVideoFrameCallback
    delete (HTMLVideoElement.prototype as Partial<HTMLVideoElement>).cancelVideoFrameCallback
  })
  await page.goto('/'); await ready(page, 'INVITATION'); await click(page, 'Step Inside'); await seekForward(page, 'master', 3)
  await click(page, 'Back to Beginning')
  const current = await page.getByTestId('master-video').evaluate((v: HTMLVideoElement) => v.currentTime)
  await verifyRewind(page, 23.375 - current, `${info.project.name}-active-native-events`)
})

test('room information, partial entry and partial exit unwind through existing room reverse first', async ({ page }, info) => {
  for (const source of ['info', 'entry', 'exit'] as const) {
    await page.goto('/'); await ready(page, 'INVITATION')
    if (source === 'entry') { await hallway(page); await click(page, 'Explore Room'); await seekForward(page, 'branch', 2) }
    else { await room(page); if (source === 'info') { await click(page, 'About this Room'); await ready(page, 'ROOM_INFO_OPEN') } else { await click(page, 'Back to Hallway'); await seekForward(page, 'branch', 1) } }
    await click(page, 'Back to Beginning'); await verifyRewind(page, 6.25, `${info.project.name}-room-${source}`, true)
  }
})

test('unsupported 5x uses the encoded 5x edition at 1x', async ({ page }, info) => {
  await page.addInitScript(() => {
    const rate = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate')!
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', { configurable: true, get: rate.get, set(value: number) { if (value > 4) throw new DOMException('Rate unsupported', 'NotSupportedError'); rate.set!.call(this, value) } })
  })
  await page.goto('/'); await ready(page, 'INVITATION'); await hallway(page); await click(page, 'Continue to the Table'); await seekForward(page, 'master', 23.15); await ready(page, 'FINALE')
  await click(page, 'Back to Beginning'); await state(page, 'REWINDING')
  const fast = page.locator('video[src*="master-reverse-5x"]')
  await expect(fast).toHaveCSS('opacity', '1'); await expect(fast).toHaveJSProperty('playbackRate', 1)
  const started = Date.now()
  await mkdir(root, { recursive: true }); await page.screenshot({ path: `${root}/${info.project.name}-encoded-5x.png` })
  await invitation(page)
  expect(Date.now() - started).toBeLessThan(8000)
})

test('silently clamped rates recover at the current reverse position', async ({ page }) => {
  await page.addInitScript(() => {
    const rate = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate')!
    const reported = new WeakMap<HTMLMediaElement, number>()
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
      configurable: true,
      get() { return reported.get(this) ?? rate.get!.call(this) },
      set(value: number) { reported.set(this, value); rate.set!.call(this, Math.min(value, 1)) },
    })
  })
  await page.goto('/'); await ready(page, 'INVITATION'); await welcome(page)
  await click(page, 'Back to Beginning'); await state(page, 'REWINDING')
  const fast = page.locator('video[src*="master-reverse-5x"]')
  await expect(fast).toHaveCSS('opacity', '1'); await expect(fast).toHaveJSProperty('playbackRate', 1)
  await invitation(page)
})

test('repeated commands, interruption, late media and reverse errors cannot restart forward playback', async ({ page }) => {
  await page.goto('/'); await ready(page, 'INVITATION'); await welcome(page)
  await page.route('**/media/master-reverse-*.mp4', async (route) => { await new Promise((resolve) => setTimeout(resolve, 600)); await route.continue() })
  await page.getByRole('button', { name: 'Back to Beginning', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); b.click() })
  await state(page, 'REWINDING'); await click(page, 'Finish rewind'); await invitation(page)
  await page.locator('video').evaluateAll((vs) => vs.forEach((v) => ['loadeddata', 'seeked', 'timeupdate', 'ended'].forEach((e) => v.dispatchEvent(new Event(e)))))
  await page.waitForTimeout(700); await invitation(page)
  await page.unrouteAll({ behavior: 'wait' }); await welcome(page)
  await page.route('**/media/master-reverse-*.mp4', (route) => route.abort())
  // Force an actual reload instead of reusing a previously buffered source.
  await page.locator('video[src*="master-reverse"]').evaluateAll((vs) => vs.forEach((v) => { v.removeAttribute('src'); (v as HTMLVideoElement).load() }))
  await click(page, 'Back to Beginning'); await invitation(page)
  await page.unrouteAll({ behavior: 'wait' })
  await welcome(page); await click(page, 'Back to Beginning'); await state(page, 'REWINDING'); await page.keyboard.press('Escape'); await invitation(page)
  await welcome(page); await click(page, 'Back to Beginning'); await state(page, 'REWINDING')
  await page.getByRole('link', { name: 'Book a stay', exact: false }).first().click(); await expect(page).toHaveURL(/book$/)
  await page.goBack(); await invitation(page, false)
})

test('reduced motion keeps the instant, still-only reset', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await ready(page, 'STATIC_FALLBACK')
  await click(page, 'Step Inside'); await ready(page, 'STATIC_FALLBACK'); await click(page, 'Back to Beginning')
  await ready(page, 'STATIC_FALLBACK'); await expect(page.locator('main')).toHaveAttribute('data-chapter', 'invitation')
  expect(await page.locator('video').evaluateAll((vs) => vs.every((v) => !v.hasAttribute('src') && (v as HTMLVideoElement).paused))).toBe(true)
})
