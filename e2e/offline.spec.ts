import { expect, test } from '@playwright/test'
import { goLibrary } from './helpers'

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  // Lazy dashboard chunks are precached too, so warm nothing else by hand.
  await context.setOffline(true)
  await page.goto('/app')
  await page.getByTestId('library-sample-youtube').click()
  await expect(page).toHaveURL(/\/app\/youtube$/)
  await expect(page.getByText('Longest sittings')).toBeVisible()
  await goLibrary(page)
  await page.getByTestId('file-input').setInputFiles('e2e/.fixtures/my_spotify_data.zip')
  await expect(page.getByRole('heading', { level: 1, name: 'Spotify' })).toBeVisible()
  await context.setOffline(false)
})
