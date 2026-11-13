import { z } from 'zod'

const text = z.string().nullish()

/**
 * One row of "Extended streaming history" (Streaming_History_Audio_*.json). Only `ts` and
 * `ms_played` are required; everything else is optional because Spotify has added and removed
 * fields over the years. Unknown fields such as ip_addr are dropped by Zod and never kept.
 */
export const extendedRow = z.object({
  ts: z.string(),
  ms_played: z.number().nonnegative(),
  master_metadata_track_name: text,
  master_metadata_album_artist_name: text,
  master_metadata_album_album_name: text,
  episode_name: text,
  episode_show_name: text,
  reason_end: z.unknown().optional(),
  skipped: z.unknown().optional(),
})

/** One row of StreamingHistory_music_*.json (Account data, last ~12 months). Times are UTC. */
export const accountMusicRow = z.object({
  endTime: z.string(),
  artistName: z.string(),
  trackName: z.string(),
  msPlayed: z.number().nonnegative(),
})

/** One row of StreamingHistory_podcast_*.json. */
export const accountPodcastRow = z.object({
  endTime: z.string(),
  podcastName: z.string(),
  episodeName: z.string(),
  msPlayed: z.number().nonnegative(),
})

export type ExtendedRow = z.infer<typeof extendedRow>
