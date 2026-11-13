import { expect, test } from '@playwright/test'
import { watchErrors } from './helpers'

test('landing explains the product and opens sample data', async ({ page }) => {
  const noErrors = watchErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your data, unpacked.')
  await expect(
    page.getByRole('heading', { name: 'Three platforms today, more from the community' }),
  ).toBeVisible()
  // The hero preview is real sample data parsed in the worker.
  await expect(page.getByLabel('Sample top artists')).toContainText('Lumen Field')
  await page.getByTestId('hero-sample').click()
  await expect(page).toHaveURL(/\/app\/spotify$/)
  await expect(page.getByTestId('sample-banner')).toContainText('made up')
  noErrors()
})

test('theme can be switched and is remembered', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByTestId('theme-menu').first().click()
  await page.getByRole('menuitemradio', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByTestId('theme-menu').first().click()
  await page.getByRole('menuitemradio', { name: 'System' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('guides, privacy page and 404 render', async ({ page }) => {
  await page.goto('/guides/youtube')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Get your YouTube data')
  await expect(page.getByText('set History to JSON')).toBeVisible()
  await page.goto('/privacy')
  await expect(page.getByTestId('privacy-external')).toHaveText('0')
  await page.goto('/does-not-exist')
  await expect(page.getByRole('heading', { name: 'Nothing to unpack here' })).toBeVisible()
})

test('keyboard users can start the sample from the hero', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard flow is a desktop concern')
  await page.goto('/')
  await page.getByTestId('hero-sample').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/app\/spotify$/)
})
