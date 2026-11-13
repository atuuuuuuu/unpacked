import { expect, test } from '@playwright/test'
import { openSample } from './helpers'

test('share card renders a 1080×1350 PNG and downloads it', async ({ page }) => {
  await openSample(page, 'spotify')
  await page.getByTestId('share-button').click()
  const img = page.getByTestId('share-preview')
  await expect(img).toBeVisible()
  const size = await img.evaluate((el: HTMLImageElement) => [el.naturalWidth, el.naturalHeight])
  expect(size).toEqual([1080, 1350])
  await page.getByRole('radio', { name: 'Light' }).click()
  await expect(img).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByTestId('download-card').click()
  expect((await download).suggestedFilename()).toBe('unpacked-spotify.png')
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

for (const platform of ['instagram', 'youtube'] as const) {
  test(`${platform} share card renders`, async ({ page }) => {
    await openSample(page, platform)
    await page.getByTestId('share-button').click()
    await expect(page.getByTestId('share-preview')).toBeVisible()
  })
}
