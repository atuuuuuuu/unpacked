import { expect, test } from '@playwright/test'
import { goLibrary, openSample, watchErrors } from './helpers'

test('Spotify sample dashboard', async ({ page }) => {
  const noErrors = watchErrors(page)
  await openSample(page, 'spotify')
  for (const label of ['Listening time', 'Plays', 'Artists', 'Days listened']) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
  }
  for (const panel of [
    'Hours per year',
    'Listening history',
    'Time of day',
    'Your week',
    'Skips',
    'Podcasts',
  ]) {
    await expect(page.getByRole('region', { name: panel })).toBeVisible()
  }
  await page.getByRole('button', { name: /Show top/ }).click()
  await expect(page.getByLabel('Top artists').locator('li')).toHaveCount(28)
  noErrors()
})

test('Instagram sample dashboard', async ({ page }) => {
  await openSample(page, 'instagram')
  await expect(page.getByRole('region', { name: 'What changed' })).toBeVisible()
  await expect(page.getByRole('tab', { name: /Pending requests/ })).toBeVisible()
  // Sample usernames are fictional and never link to real profiles.
  await expect(page.getByTestId('account-list').first().locator('a')).toHaveCount(0)
  await page.getByRole('tab', { name: /^Followers/ }).click()
  await expect(page.getByText(/Showing 60 of/)).toBeVisible()
  await page.getByRole('button', { name: 'Show more' }).click()
  await expect(page.getByText(/Showing 180 of/)).toBeVisible()
})

test('YouTube sample dashboard', async ({ page }) => {
  await openSample(page, 'youtube')
  await expect(page.getByText('How watch time is estimated.')).toBeVisible()
  await page.getByRole('radio', { name: 'Hours' }).click()
  await expect(page.getByRole('region', { name: 'Activity by month' })).toContainText(
    'Estimated hours per month',
  )
})

test('sample and real data are kept apart', async ({ page }) => {
  await openSample(page, 'spotify')
  await goLibrary(page)
  await page.getByTestId('file-input').setInputFiles('e2e/.fixtures/my_spotify_data.zip')
  await expect(page).toHaveURL(/\/app\/spotify$/)
  await expect(page.getByTestId('sample-banner')).toHaveCount(0)
  await page.getByRole('radio', { name: 'Sample' }).click()
  await expect(page.getByTestId('sample-banner')).toBeVisible()
})
