/**
 * Draws a 1080×1350 share card (4:5, the portrait size Instagram and most feeds accept) on a
 * canvas. Everything is drawn locally; the PNG never leaves the device unless the user shares it.
 */
export interface CardSpec {
  platform: string
  eyebrow: string
  big: string
  bigLabel: string
  stats: { label: string; value: string }[]
  list?: { title: string; items: { name: string; value: string; share: number }[] }
  sample: boolean
}

export type CardTheme = 'dark' | 'light'

const PALETTES = {
  dark: {
    bg: '#0f1216',
    panel: '#171b21',
    fg: '#e8ebf0',
    muted: '#9aa3b2',
    line: '#2a303a',
    accent: '#3cc2b9',
    warm: '#f08a52',
    track: '#1e232b',
  },
  light: {
    bg: '#f5f6f8',
    panel: '#ffffff',
    fg: '#151821',
    muted: '#5a6172',
    line: '#dde1e8',
    accent: '#0b7a75',
    warm: '#c8612b',
    track: '#eceef2',
  },
}

const DISPLAY = '"Space Grotesk Variable", "Inter Variable", system-ui, sans-serif'
const SANS = '"Inter Variable", system-ui, sans-serif'
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace'

export const CARD_W = 1080
export const CARD_H = 1350

async function fontsReady() {
  if (!('fonts' in document)) return
  await Promise.all([
    document.fonts.load(`600 120px ${DISPLAY}`),
    document.fonts.load(`500 32px ${SANS}`),
    document.fonts.load(`500 24px ${MONO}`),
  ]).catch(() => {})
}

function clip(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t}…`
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  accent: string,
  warm: string,
) {
  const p = (px: number, py: number) => [x + (px / 24) * s, y + (py / 24) * s] as const
  ctx.lineWidth = (2 / 24) * s
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = accent
  ctx.beginPath()
  for (const [i, pt] of [
    p(3.5, 7.75),
    p(12, 3.25),
    p(20.5, 7.75),
    p(20.5, 16.25),
    p(12, 20.75),
    p(3.5, 16.25),
  ].entries()) {
    if (i) ctx.lineTo(...pt)
    else ctx.moveTo(...pt)
  }
  ctx.closePath()
  ctx.moveTo(...p(3.5, 7.75))
  ctx.lineTo(...p(12, 12.25))
  ctx.lineTo(...p(20.5, 7.75))
  ctx.moveTo(...p(12, 12.25))
  ctx.lineTo(...p(12, 20.75))
  ctx.stroke()
  ctx.strokeStyle = warm
  ctx.beginPath()
  ctx.moveTo(...p(12, 3.25))
  ctx.lineTo(...p(12, 7.75))
  ctx.stroke()
}

export async function renderCard(spec: CardSpec, theme: CardTheme): Promise<Blob> {
  await fontsReady()
  const c = PALETTES[theme]
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  const M = 88
  const W = CARD_W - M * 2

  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  // A quiet accent glow in one corner gives depth without decoration.
  const glow = ctx.createRadialGradient(CARD_W, 0, 0, CARD_W, 0, 900)
  glow.addColorStop(0, `${c.accent}2e`)
  glow.addColorStop(1, `${c.accent}00`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // Header
  drawMark(ctx, M, 80, 44, c.accent, c.warm)
  ctx.fillStyle = c.fg
  ctx.font = `600 34px ${DISPLAY}`
  ctx.textBaseline = 'middle'
  ctx.fillText('Unpacked', M + 60, 103)
  ctx.font = `500 24px ${MONO}`
  ctx.fillStyle = c.muted
  ctx.textAlign = 'right'
  ctx.fillText(spec.platform.toUpperCase(), CARD_W - M, 103)
  ctx.textAlign = 'left'

  // Eyebrow + big number
  let y = 250
  ctx.textBaseline = 'alphabetic'
  ctx.font = `500 26px ${MONO}`
  ctx.fillStyle = c.accent
  ctx.fillText(clip(ctx, spec.eyebrow.toUpperCase(), W), M, y)
  y += 190
  ctx.fillStyle = c.fg
  let size = 210
  ctx.font = `600 ${size}px ${DISPLAY}`
  while (ctx.measureText(spec.big).width > W && size > 100) {
    size -= 10
    ctx.font = `600 ${size}px ${DISPLAY}`
  }
  ctx.fillText(spec.big, M - 6, y)
  y += 64
  ctx.font = `500 38px ${SANS}`
  ctx.fillStyle = c.muted
  ctx.fillText(clip(ctx, spec.bigLabel, W), M, y)

  // Stats row
  y += 60
  const colW = W / spec.stats.length
  ctx.strokeStyle = c.line
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(M, y)
  ctx.lineTo(CARD_W - M, y)
  ctx.stroke()
  spec.stats.forEach((s, i) => {
    const x = M + i * colW
    ctx.font = `600 52px ${DISPLAY}`
    ctx.fillStyle = c.fg
    ctx.fillText(clip(ctx, s.value, colW - 24), x, y + 82)
    ctx.font = `500 22px ${MONO}`
    ctx.fillStyle = c.muted
    ctx.fillText(clip(ctx, s.label.toUpperCase(), colW - 24), x, y + 120)
  })
  y += 168

  // Ranked list
  if (spec.list) {
    roundRect(ctx, M, y, W, CARD_H - y - 170, 28)
    ctx.fillStyle = c.panel
    ctx.fill()
    ctx.strokeStyle = c.line
    ctx.stroke()
    const px = M + 36
    const inner = W - 72
    let ly = y + 62
    ctx.font = `500 22px ${MONO}`
    ctx.fillStyle = c.muted
    ctx.fillText(spec.list.title.toUpperCase(), px, ly)
    ly += 30
    const rows = spec.list.items.slice(0, 5)
    const rowH = Math.min(76, (CARD_H - 170 - 30 - ly) / Math.max(1, rows.length))
    rows.forEach((item, i) => {
      const top = ly + i * rowH
      ctx.font = `500 22px ${MONO}`
      ctx.fillStyle = c.muted
      ctx.fillText(String(i + 1), px, top + 36)
      ctx.font = `600 31px ${SANS}`
      ctx.fillStyle = c.fg
      ctx.textAlign = 'right'
      const valueW = ctx.measureText(item.value).width
      ctx.fillText(item.value, px + inner, top + 36)
      ctx.textAlign = 'left'
      ctx.fillText(clip(ctx, item.name, inner - 60 - valueW - 24), px + 48, top + 36)
      roundRect(ctx, px + 48, top + 52, inner - 48, 8, 4)
      ctx.fillStyle = c.track
      ctx.fill()
      roundRect(ctx, px + 48, top + 52, Math.max(8, (inner - 48) * item.share), 8, 4)
      ctx.fillStyle = i === 0 ? c.warm : c.accent
      ctx.fill()
    })
  }

  // Footer
  ctx.font = `500 24px ${MONO}`
  ctx.fillStyle = c.muted
  ctx.fillText('Made on my device with Unpacked', M, CARD_H - 92)
  if (spec.sample) {
    const label = 'SAMPLE DATA · FICTIONAL'
    ctx.font = `600 22px ${MONO}`
    const w = ctx.measureText(label).width + 36
    roundRect(ctx, CARD_W - M - w, CARD_H - 124, w, 48, 24)
    ctx.fillStyle = c.warm
    ctx.fill()
    ctx.fillStyle = c.bg
    ctx.textAlign = 'center'
    ctx.fillText(label, CARD_W - M - w / 2, CARD_H - 92)
    ctx.textAlign = 'left'
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not create the image'))),
      'image/png',
    ),
  )
}
