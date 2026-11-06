import { test, expect, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
const root = 'docs/evidence/package-04'
const ready = (page: Page, mode?: string) => page.locator(`main[data-ui-ready="true"][data-visual-ready="true"]${mode ? `[data-state="${mode}"]` : ''}`).waitFor()
const click = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).click()
const shot = async (page: Page, name: string) => { await mkdir(root, { recursive: true }); await page.screenshot({ path: `${root}/${name}.png`, fullPage: false }) }
async function invitation(page: Page) {
  await ready(page, 'INVITATION')
  await expect(page.getByRole('button', { name: 'Step Inside', exact: true })).toBeVisible()
  await expect(page.locator('video')).toHaveCount(2)
  expect(await page.locator('video').evaluateAll((vs) => vs.every((v) => (v as HTMLVideoElement).paused))).toBe(true)
  await expect(page.getByRole('button', { name: 'Back to Beginning', exact: true })).toHaveCount(0)
}
// Fault/race setup may seek close to an anchor. The main cinematic suite runs every film at native speed.
async function finishSoon(page: Page, video: 'master' | 'branch', time: number) {
  await expect.poll(() => page.getByTestId(`${video}-video`).evaluate((v: HTMLVideoElement) => !v.paused && v.readyState >= 2)).toBe(true)
  await page.getByTestId(`${video}-video`).evaluate((v: HTMLVideoElement, target) => { v.currentTime = target }, time)
}
async function hallway(page: Page) {
  await click(page, 'Step Inside'); await finishSoon(page, 'master', 9.8); await ready(page, 'WELCOME_PAUSED')
  await click(page, 'Continue the Journey'); await finishSoon(page, 'master', 16.9); await ready(page, 'HALLWAY_PAUSED')
}

test('Back to Beginning cancels master, forward, info-closing, reverse and menu work', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/'); await ready(page)
  await click(page, 'Step Inside'); await finishSoon(page, 'master', 2)
  await shot(page, `${info.project.name}-active-master`)
  await click(page, 'Back to Beginning'); await invitation(page)
  await expect(page.getByRole('button', { name: 'Step Inside', exact: true })).toBeFocused()
  await hallway(page); await click(page, 'Explore Room')
  await expect.poll(() => page.getByTestId('branch-video').evaluate((v: HTMLVideoElement) => v.currentTime > .2 && !v.paused)).toBe(true)
  await shot(page, `${info.project.name}-room-entry`)
  await click(page, 'Back to Beginning'); await invitation(page)
  await hallway(page); await click(page, 'Explore Room'); await finishSoon(page, 'branch', 4.9); await ready(page, 'ROOM_AT_B3')
  await click(page, 'About this Room'); await ready(page, 'ROOM_INFO_OPEN')
  await click(page, 'Back to Hallway')
  await click(page, 'Back to Beginning'); await invitation(page)
  // A cancelled Flip completion must not start reverse later.
  await page.waitForTimeout(1100); await invitation(page)
  await hallway(page); await click(page, 'Explore Room'); await finishSoon(page, 'branch', 4.9); await ready(page, 'ROOM_AT_B3')
  await click(page, 'Back to Hallway')
  await expect.poll(() => page.getByTestId('branch-video').evaluate((v: HTMLVideoElement) => v.currentTime > .2 && !v.paused && v.src.includes('reverse'))).toBe(true)
  await click(page, 'Back to Beginning'); await invitation(page)
  await click(page, 'Step Inside'); await finishSoon(page, 'master', 1)
  await page.getByRole('button', { name: 'Menu', exact: false }).click()
  await expect(page.getByRole('dialog')).toHaveAttribute('data-menu-ready', 'true')
  await shot(page, `${info.project.name}-menu`)
  await page.getByRole('dialog').getByRole('button', { name: 'Back to Beginning', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible(); await invitation(page)
  await shot(page, `${info.project.name}-reset`)
  expect(errors).toEqual([])
})

test('a delayed checkpoint still retains the paused video, then hands off without a seek', async ({ page }, info) => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/posters/reception.v1.webp', async (route) => { await gate; await route.continue() })
  await page.goto('/'); await ready(page)
  await click(page, 'Step Inside'); await finishSoon(page, 'master', 9.8)
  await expect(page.locator('main')).toHaveAttribute('data-media-phase', 'holding')
  const video = page.getByTestId('master-video')
  await expect(video).toHaveCSS('opacity', '1'); await expect(video).toHaveJSProperty('paused', true)
  await expect(video).toHaveJSProperty('seeking', false)
  const time = await video.evaluate((v: HTMLVideoElement) => v.currentTime)
  await page.waitForTimeout(250); await shot(page, `${info.project.name}-delayed-still-held-video`)
  release(); await ready(page, 'WELCOME_PAUSED')
  await expect(video).toHaveCSS('opacity', '0')
  await expect(video).toHaveJSProperty('seeking', false)
  expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBe(time)
  const image = page.locator('main img[data-active="true"]')
  await expect(image).toHaveAttribute('data-poster', 'welcome'); await expect(image).toHaveJSProperty('complete', true)
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
})

test('reset and navigation abort delayed metadata, repeated commands and late events', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/media/master-*.mp4', async (route) => { await gate; await route.continue() })
  await page.goto('/'); await ready(page); await click(page, 'Step Inside')
  await expect(page.locator('main')).toHaveAttribute('data-media-phase', 'loading')
  // Multiple synchronous activations exercise idempotence before React removes the control.
  await page.getByRole('button', { name: 'Back to Beginning', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); button.click() })
  await invitation(page); release()
  await page.locator('video').evaluateAll((videos) => videos.forEach((v) => ['loadeddata', 'seeked', 'timeupdate', 'ended'].forEach((event) => v.dispatchEvent(new Event(event)))))
  await page.waitForTimeout(300); await invitation(page)
  // Route away while a new load is pending; route return is a fresh invitation.
  await page.route('**/media/master-*.mp4', (route) => route.abort())
  await click(page, 'Step Inside'); await page.getByRole('link', { name: 'Book a stay', exact: false }).first().click()
  await expect(page).toHaveURL(/book$/)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  await page.goBack(); await invitation(page); await page.goForward(); await expect(page).toHaveURL(/book$/)
})

test('native-event fallback, orientation, pause/menu and preference changes remain usable', async ({ page }, info) => {
  await page.addInitScript(() => { delete (HTMLVideoElement.prototype as Partial<HTMLVideoElement>).requestVideoFrameCallback; delete (HTMLVideoElement.prototype as Partial<HTMLVideoElement>).cancelVideoFrameCallback })
  await page.goto('/'); await ready(page); await click(page, 'Step Inside')
  await expect.poll(() => page.getByTestId('master-video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(.2)
  const source = await page.getByTestId('master-video').getAttribute('src')
  if (info.project.name.includes('mobile')) await page.setViewportSize({ width: 844, height: 390 })
  await expect(page.getByTestId('master-video')).toHaveAttribute('src', source!)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await click(page, 'Pause film'); await expect(page.locator('main')).toHaveAttribute('data-state', 'USER_PAUSED')
  await page.getByRole('button', { name: 'Menu', exact: false }).click(); await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(page.locator('main')).toHaveAttribute('data-state', 'USER_PAUSED')
  await click(page, 'Resume Journey'); await finishSoon(page, 'master', 9.8); await ready(page, 'WELCOME_PAUSED')
  await click(page, 'Back to Beginning'); await invitation(page)
  await click(page, 'Step Inside'); await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('main')).toHaveAttribute('data-state', 'STATIC_FALLBACK')
  await ready(page, 'STATIC_FALLBACK')
  await expect(page.locator('main')).toHaveAttribute('data-chapter', 'invitation')
  expect(await page.locator('video').evaluateAll((vs) => vs.every((v) => (v as HTMLVideoElement).paused))).toBe(true)
})

test('all required viewport compositions and finale links remain reachable', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one focused viewport matrix')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const rows = []
  for (const [width, height] of [[320, 700], [375, 812], [390, 844], [430, 932], [844, 390], [1024, 600], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height }); await page.goto('/'); await ready(page)
    await shot(page, `${width}x${height}-invitation`)
    await click(page, 'Step Inside'); await ready(page); await shot(page, `${width}x${height}-welcome`)
    await click(page, 'Continue the Journey'); await ready(page); await shot(page, `${width}x${height}-hallway`)
    await click(page, 'Explore Room'); await ready(page); await shot(page, `${width}x${height}-room-info`)
    await click(page, 'Back to Hallway'); await ready(page); await click(page, 'Continue to the Table'); await ready(page)
    await shot(page, `${width}x${height}-finale`)
    for (const name of ['Design Your Alpine Experience', 'Discover RÜEGG Passport', 'Our Local Circle']) {
      const link = page.getByRole('link', { name, exact: true }); await link.scrollIntoViewIfNeeded(); await expect(link).toBeInViewport()
    }
    await shot(page, `${width}x${height}-finale-links`)
    await page.getByRole('button', { name: 'Replay Journey', exact: false }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: 'Replay Journey', exact: false })).toBeInViewport()
    const geometry = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: innerWidth, height: innerHeight, scrollY, stage: document.querySelector('main')!.getBoundingClientRect().height }))
    expect(geometry.scrollWidth).toBe(width); expect(geometry.scrollY).toBe(0); expect(geometry.stage).toBe(height)
    rows.push(geometry)
  }
  await writeFile(`${root}/viewport-matrix.json`, JSON.stringify(rows, null, 2))
})
