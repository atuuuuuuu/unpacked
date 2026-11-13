// Renders the logo mark to the PNG sizes the PWA manifest and iOS need. Run: npx tsx scripts/make-icons.ts
import { chromium } from '@playwright/test'

const mark = (stroke: number) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none">
  <path d="M3.5 7.75 12 3.25l8.5 4.5v8.5L12 20.75l-8.5-4.5z" stroke="#3cc2b9" stroke-width="${stroke}" stroke-linejoin="round"/>
  <path d="m3.5 7.75 8.5 4.5 8.5-4.5M12 12.25v8.5" stroke="#3cc2b9" stroke-width="${stroke}" stroke-linejoin="round"/>
  <path d="M12 3.25v4.5" stroke="#f08a52" stroke-width="${stroke}" stroke-linecap="round"/>
</svg>`

const page = (
  size: number,
  inset: number,
  radius: number,
) => `<!doctype html><html><body style="margin:0">
<div style="width:${size}px;height:${size}px;background:#0f1216;border-radius:${radius}px;display:flex;align-items:center;justify-content:center">
<div style="width:${size - inset * 2}px;height:${size - inset * 2}px">${mark(1.9)}</div></div></body></html>`

const targets = [
  { file: 'public/icon-192.png', size: 192, inset: 36, radius: 0 },
  { file: 'public/icon-512.png', size: 512, inset: 96, radius: 0 },
  { file: 'public/icon-maskable-512.png', size: 512, inset: 140, radius: 0 },
  { file: 'public/apple-touch-icon.png', size: 180, inset: 34, radius: 0 },
]

const browser = await chromium.launch()
for (const t of targets) {
  const p = await browser.newPage({ viewport: { width: t.size, height: t.size } })
  await p.setContent(page(t.size, t.inset, t.radius))
  await p.screenshot({ path: t.file, omitBackground: false })
  await p.close()
}
await browser.close()
console.log('icons written')
