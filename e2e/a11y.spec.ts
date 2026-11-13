import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { openSample } from './helpers'

const scan = async (page: import('@playwright/test').Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id}: ${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(', ')}`,
    )
}

for (const theme of ['light', 'dark'] as const) {
  test(`no serious accessibility issues (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/')
    await expect(page.getByLabel('Sample top artists')).toBeVisible()
    expect(await scan(page), 'landing').toEqual([])
    await page.goto('/app')
    expect(await scan(page), 'library').toEqual([])
    for (const p of ['spotify', 'instagram', 'youtube'] as const) {
      await openSample(page, p)
      expect(await scan(page), p).toEqual([])
    }
  })
}
