// All bucketing uses the device's local time zone, so "busiest hour" means the user's own clock.

const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function monthKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** 0 = Monday … 6 = Sunday */
export function weekday(ts: number): number {
  return (new Date(ts).getDay() + 6) % 7
}

export const hourOf = (ts: number) => new Date(ts).getHours()
export const yearOf = (ts: number) => new Date(ts).getFullYear()

/** Day number for a YYYY-MM-DD key, for streak math without DST surprises. */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return Date.UTC(y, m - 1, d) / 86_400_000
}

/** Every month key from `first` to `last` inclusive. */
export function monthRange(first: number, last: number): string[] {
  const out: string[] = []
  const d = new Date(first)
  const end = monthKey(last)
  for (let i = 0; i < 1200; i++) {
    const k = monthKey(new Date(d.getFullYear(), d.getMonth() + i, 1).getTime())
    out.push(k)
    if (k === end) break
  }
  return out
}

export const emptyWeekHours = () => Array.from({ length: 7 }, () => new Array<number>(24).fill(0))

/** Finds a YYYY-MM-DD date in a file name, e.g. "instagram-jane-2024-08-02-abc.zip". */
export function dateFromName(name: string): number | null {
  const m = name.match(/(20\d{2})-(\d{2})-(\d{2})/)
  if (!m) return null
  const t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime()
  return Number.isNaN(t) ? null : t
}
