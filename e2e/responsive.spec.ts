import { expect, test } from '@playwright/test'

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1440]

for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'viewport set explicitly')
    await page.setViewportSize({ width, height: 900 })
    const check = async (where: string) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `overflow on ${where}`).toBeLessThanOrEqual(0)
    }
    for (const path of ['/', '/guides', '/guides/instagram', '/privacy', '/app']) {
      await page.goto(path)
      await check(path)
    }
    for (const p of ['spotify', 'instagram', 'youtube']) {
      await page.goto('/app')
      await page.getByTestId(`library-sample-${p}`).click()
      await expect(page.getByTestId('sample-banner')).toBeVisible()
      await check(p)
    }
    // Navigation is reachable at every size: sidebar on desktop, tab bar on phones.
    await expect(
      page.getByRole('navigation', { name: 'App' }).filter({ visible: true }),
    ).toHaveCount(1)
  })
}
