export interface Tally {
  ms: number
  plays: number
}

export function bump(map: Map<string, Tally>, key: string, ms: number, play: boolean) {
  const t = map.get(key)
  if (t) {
    t.ms += ms
    if (play) t.plays++
  } else map.set(key, { ms, plays: play ? 1 : 0 })
}

/** Top `n` entries by `by`, ties broken by name so results are stable. */
export function topN<T>(map: Map<string, T>, n: number, by: (t: T) => number): [string, T][] {
  return [...map.entries()]
    .sort((a, b) => by(b[1]) - by(a[1]) || a[0].localeCompare(b[0]))
    .slice(0, n)
}

export function median(values: number[]): number {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}
