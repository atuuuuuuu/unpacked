const num = new Intl.NumberFormat('en-GB')
const pct = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 })
const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' })
const shortMonth = new Intl.DateTimeFormat('en-GB', { month: 'short' })
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const weekdayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

export const formatNumber = (n: number) => num.format(Math.round(n))
export const formatPercent = (n: number) => pct.format(n)
export const formatDate = (ts: number) => dateFmt.format(ts)
export const formatMonth = (ts: number) => monthFmt.format(ts)
export const formatTime = (ts: number) => timeFmt.format(ts)
export const formatWeekday = (ts: number) => weekdayFmt.format(ts)

export const hours = (ms: number) => ms / 3_600_000

/** "6,412 h", "42 min" or "3 h 20 min" depending on size. */
export function formatDuration(ms: number, style: 'short' | 'long' = 'short'): string {
  const totalMin = Math.round(ms / 60_000)
  if (totalMin < 60) return `${totalMin} min`
  const h = Math.floor(totalMin / 60)
  if (style === 'short' || h >= 100) return `${formatNumber(ms / 3_600_000)} h`
  const m = totalMin % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/** "2024-03" → "Mar 2024" */
export function formatMonthKey(key: string, style: 'long' | 'short' = 'long'): string {
  const [y, m] = key.split('-').map(Number) as [number, number]
  const d = new Date(y, m - 1, 1)
  return style === 'long' ? monthFmt.format(d) : shortMonth.format(d)
}

/** "2024-03-07" → "7 Mar 2024" */
export function formatDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return dateFmt.format(new Date(y, m - 1, d))
}

export const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00`

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${formatNumber(n)} ${n === 1 ? one : many}`
