import { expect, type Page } from '@playwright/test'

export const fixture = (name: string) => `e2e/.fixtures/${name}`

/** Fails the test on console errors and uncaught exceptions. */
export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  return () => expect(errors, 'console errors').toEqual([])
}

export async function upload(page: Page, ...names: string[]) {
  await page.getByTestId('file-input').setInputFiles(names.map(fixture))
}

export async function openSample(page: Page, platform: 'spotify' | 'instagram' | 'youtube') {
  await page.goto('/app')
  await page.getByTestId(`library-sample-${platform}`).click()
  await expect(page).toHaveURL(new RegExp(`/app/${platform}$`))
  await expect(page.getByTestId('sample-banner')).toBeVisible()
}

/** Client-side navigation; a full page load would (correctly) forget everything in memory. */
export async function goLibrary(page: Page) {
  await page.getByRole('link', { name: 'Library' }).filter({ visible: true }).first().click()
  await expect(page).toHaveURL(/\/app$/)
}
