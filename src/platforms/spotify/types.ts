export interface Ranked {
  name: string
  /** Artist for a track, show for an episode. */
  sub?: string
  ms: number
  plays: number
}

export interface SpotifySummary {
  /** "extended" = Extended streaming history; "account" = the yearly history in Account data. */
  format: 'extended' | 'account'
  first: number
  last: number
  totals: {
    /** Music listening time in ms (podcasts are counted separately). */
    ms: number
    /** Tracks played for 30 seconds or more, the threshold Spotify uses for a stream. */
    plays: number
    /** Every music record, including very short ones. */
    records: number
    tracks: number
    artists: number
    activeDays: number
  }
  years: { year: number; ms: number; plays: number }[]
  months: { key: string; ms: number }[]
  /** Music ms per local hour of day. */
  hours: number[]
  /** Music ms per [weekday Mon..Sun][hour]. */
  weekHours: number[][]
  /** Keyed by "all" and by year ("2024"). */
  top: Record<string, { artists: Ranked[]; tracks: Ranked[] }>
  /** Only the extended history records skips. */
  skips: {
    count: number
    rate: number
    byYear: { year: number; rate: number }[]
    tracks: { name: string; artist: string; records: number; skips: number }[]
  } | null
  podcasts: { ms: number; episodes: number; shows: Ranked[] } | null
  highlights: {
    busiestDay: { day: string; ms: number }
    longestStreak: { days: number; from: string; to: string }
    firstPlay: { ts: number; track: string; artist: string }
  }
}
