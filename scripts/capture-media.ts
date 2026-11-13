// Captures README screenshots and the demo video from the real app with sample data.
// Usage: npm run build && npx vite preview --port 4173 & npx tsx scripts/capture-media.ts
// Then: ffmpeg converts docs/media/demo.webm to docs/media/demo.gif (see docs/media/README.md).
import { renameSync } from 'node:fs'
import { chromium, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const OUT = 'docs/media'

async function sample(page: Page, platform: string) {
  await page.goto(`${BASE}/app`)
  await page.getByTestId(`library-sample-${platform}`).click()
  await page.getByTestId('sample-banner').waitFor()
  await page.waitForTimeout(600)
}

const browser = await chromium.launch()

for (const theme of ['light', 'dark'] as const) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme,
  })
  const page = await ctx.newPage()
  await page.goto(BASE)
  await page.getByLabel('Sample top artists').waitFor()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/landing-${theme}.png` })
  for (const p of ['spotify', 'instagram', 'youtube']) {
    await sample(page, p)
    await page.screenshot({ path: `${OUT}/${p}-${theme}.png` })
  }
  await ctx.close()
}

const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
  isMobile: true,
  hasTouch: true,
})
const pp = await phone.newPage()
for (const p of ['spotify', 'instagram']) {
  await sample(pp, p)
  await pp.screenshot({ path: `${OUT}/${p}-phone.png` })
}
await phone.close()

// Demo video: landing → sample → scroll → Instagram → share card.
const rec = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  colorScheme: 'dark',
  recordVideo: { dir: `${OUT}/.video`, size: { width: 1280, height: 800 } },
})
const v = await rec.newPage()
await v.goto(BASE)
await v.getByLabel('Sample top artists').waitFor()
await v.waitForTimeout(1200)
await v.getByTestId('hero-sample').click()
await v.getByTestId('sample-banner').waitFor()
await v.waitForTimeout(1200)
for (let i = 0; i < 6; i++) {
  await v.mouse.wheel(0, 260)
  await v.waitForTimeout(260)
}
await v.waitForTimeout(500)
await v.getByRole('link', { name: 'Instagram' }).filter({ visible: true }).first().click()
await v.getByRole('button', { name: 'Try sample data' }).click()
await v.getByTestId('sample-banner').waitFor()
await v.waitForTimeout(1300)
await v.getByTestId('share-button').click()
await v.getByTestId('share-preview').waitFor()
await v.waitForTimeout(1800)
const video = v.video()
await rec.close()
if (video) renameSync(await video.path(), `${OUT}/demo.webm`)
await browser.close()
console.log('media captured')
