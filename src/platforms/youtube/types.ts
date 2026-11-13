export interface ChannelRank {
  name: string
  url?: string
  videos: number
  /** Estimated ms (see estimate notes in parse.ts). */
  estMs: number
}

export interface Sitting {
  start: number
  end: number
  videos: number
  estMs: number
  topChannel: string | null
}

export interface YouTubeSummary {
  first: number
  last: number
  totals: {
    /** Videos watched on YouTube (ads and YouTube Music excluded). */
    videos: number
    uniqueVideos: number
    channels: number
    /** Videos that were later removed or made private; no title or channel is left. */
    removed: number
    /** Ads that YouTube lists in watch history. */
    ads: number
    /** Plays in YouTube Music, listed separately. */
    music: number
    estMs: number
    sittings: number
    binges: number
  }
  months: { key: string; videos: number; estMs: number }[]
  years: { year: number; videos: number }[]
  hours: number[]
  weekHours: number[][]
  top: Record<string, ChannelRank[]>
  rewatched: { title: string; channel: string | null; url: string; count: number }[]
  /** Longest sittings, by estimated time. */
  sittings: Sitting[]
  firstVideo: { ts: number; title: string; channel: string | null }
  /** Typical time per video used for the last video of each sitting. */
  typicalVideoMs: number
}
