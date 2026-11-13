import { expect, test } from '@playwright/test'
import { upload } from './helpers'

test('no request leaves the site and nothing is uploaded', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const requests: { url: string; method: string; body: string | null; type: string }[] = []
  page.on('request', (r) =>
    requests.push({ url: r.url(), method: r.method(), body: r.postData(), type: r.resourceType() }),
  )

  await page.goto('/')
  await page.goto('/app')
  const before = requests.length
  await upload(page, 'my_spotify_data.zip')
  await expect(page.getByRole('heading', { level: 1, name: 'Spotify' })).toBeVisible()
  await page.goto('/app')
  await upload(page, 'instagram-tester-2026-08-02-AbCd.zip', 'instagram-tester-2026-11-01-EfGh.zip')
  await expect(page.getByRole('heading', { level: 1, name: 'Instagram' })).toBeVisible()

  const offsite = requests.filter(
    (r) => !r.url.startsWith(origin) && !r.url.startsWith('data:') && !r.url.startsWith('blob:'),
  )
  expect(offsite, 'requests to other sites').toEqual([])
  expect(
    requests.filter((r) => r.method !== 'GET'),
    'non-GET requests',
  ).toEqual([])
  expect(
    requests.filter((r) => r.body),
    'requests with a body',
  ).toEqual([])
  // Reading an export may load app code (lazy chunks), but nothing else.
  for (const r of requests.slice(before).filter((r) => r.type !== 'document')) {
    expect(r.url).toMatch(/\/(assets\/|sw\.js|workbox|manifest|theme-init\.js|favicon|icon-)/)
  }

  await page.getByTestId('privacy-badge').filter({ visible: true }).click()
  await expect(page.getByTestId('external-count')).toHaveText('0')
})

test('pages ship with a strict Content Security Policy', async ({ page }) => {
  await page.goto('/')
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content')
  expect(csp).toContain("connect-src 'self'")
  expect(csp).toContain("script-src 'self'")
  expect(csp).not.toContain('unsafe-eval')
  // The browser really enforces it: a request to another site is refused.
  const blocked = await page.evaluate(() =>
    fetch('https://example.com/collect', { method: 'POST', body: 'x' }).then(
      () => false,
      () => true,
    ),
  )
  expect(blocked).toBe(true)
})
