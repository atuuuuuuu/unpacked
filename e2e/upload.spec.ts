import { expect, test } from '@playwright/test'
import { goLibrary, upload, watchErrors } from './helpers'

test('a Spotify ZIP is detected, parsed and shown', async ({ page }) => {
  const noErrors = watchErrors(page)
  await page.goto('/app')
  await upload(page, 'my_spotify_data.zip')
  await expect(page).toHaveURL(/\/app\/spotify$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Spotify' })).toBeVisible()
  await expect(page.getByTestId('sample-banner')).toHaveCount(0)
  await expect(page.getByText('my_spotify_data.zip')).toBeVisible()
  await expect(page.getByLabel('Top artists').first()).toContainText('Lumen Field')
  // Year filter changes the lists.
  await page.getByRole('combobox', { name: 'Time range for top lists' }).click()
  await page.getByRole('option', { name: '2019' }).click()
  await expect(page.getByText('2019, by listening time').first()).toBeVisible()
  noErrors()
})

test('two Instagram exports can be compared and searched', async ({ page }) => {
  await page.goto('/app')
  await upload(page, 'instagram-tester-2026-08-02-AbCd.zip', 'instagram-tester-2026-11-01-EfGh.zip')
  await expect(page).toHaveURL(/\/app\/instagram$/)
  await expect(page.getByText('From 2 Aug 2026 to 1 Nov 2026')).toBeVisible()
  await expect(page.getByRole('tab', { name: /Unfollowed you/ })).toBeVisible()
  await page.getByRole('tab', { name: /Fans/ }).click()
  const list = page.getByTestId('account-list').first()
  const first = ((await list.locator('li span.truncate').first().textContent()) ?? '').replace(
    '@',
    '',
  )
  await page.getByLabel('Search usernames').fill(first.slice(0, 5))
  await expect(list.locator('li').first()).toContainText(first.slice(0, 5))
  await page.getByLabel('Search usernames').fill('zzzz-nobody')
  await expect(page.getByText('No usernames match')).toBeVisible()
})

test('a YouTube Takeout is detected', async ({ page }) => {
  await page.goto('/app')
  await upload(page, 'takeout-20261102T101010Z-001.zip')
  await expect(page).toHaveURL(/\/app\/youtube$/)
  await expect(page.getByText('Longest sittings')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Top channels' })).toContainText(
    'Field Notes Kitchen',
  )
})

test('helpful errors for files that are not exports', async ({ page }) => {
  await page.goto('/app')
  await upload(page, 'notes.txt')
  await expect(page.getByRole('alert')).toContainText('That’s not an export file')
  await page.getByRole('button', { name: 'Dismiss' }).click()

  await upload(page, 'instagram-html.zip')
  await expect(page.getByRole('alert')).toContainText('choose JSON')

  await page.getByRole('button', { name: 'Dismiss' }).click()
  await upload(page, 'holiday-photos.zip')
  await expect(page.getByRole('alert')).toContainText('We don’t recognize this export')
  await expect(page).toHaveURL(/\/app$/)
})

test('loaded exports appear in the library and can be removed', async ({ page }) => {
  await page.goto('/app')
  await upload(page, 'takeout-20261102T101010Z-001.zip')
  await expect(page).toHaveURL(/\/app\/youtube$/)
  await goLibrary(page)
  const list = page.getByTestId('loaded-list')
  await expect(list).toContainText('takeout-20261102T101010Z-001.zip')
  await page.getByRole('button', { name: /Remove takeout/ }).click()
  await expect(page.getByTestId('loaded-list')).toHaveCount(0)
})
