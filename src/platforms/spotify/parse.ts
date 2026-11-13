import { ImportError } from '@/core/errors'
import { bump, type Tally, topN } from '@/core/rank'
import { structureReport } from '@/core/structure'
import {
  dayKey,
  dayNumber,
  emptyWeekHours,
  hourOf,
  monthKey,
  monthRange,
  weekday,
  yearOf,
} from '@/core/time'
import type { ExportFile, PlatformParser } from '@/core/types'
import { accountMusicRow, accountPodcastRow, extendedRow } from './schema'
import type { Ranked, SpotifySummary } from './types'

const EXTENDED = /(^|\/)Streaming_History_(Audio|Video)_[^/]*\.json$/i
const ACCOUNT = /(^|\/)StreamingHistory(_music|_podcast)?_?\d*\.json$/i
const PLAY_MS = 30_000
const SEP = '\u0000'

/** A normalized listen, whatever file it came from. */
interface Listen {
  ts: number
  ms: number
  track?: string
  artist?: string
  episode?: string
  show?: string
  skipped: boolean | null
}

export const spotifyParser: PlatformParser<'spotify'> = {
  id: 'spotify',
  select(paths) {
    const extended = paths.filter((p) => EXTENDED.test(p))
    return extended.length ? extended : paths.filter((p) => ACCOUNT.test(p))
  },
  diagnose(paths) {
    const isSpotify = paths.some((p) => /(^|\/)(Userdata|YourLibrary|Identity)\.json$/i.test(p))
    return isSpotify
      ? 'This Spotify export has no listening history in it. On Spotify’s privacy page, request “Extended streaming history” and drop that ZIP here instead.'
      : null
  },
  parse(files, ctx) {
    const extended = files.some((f) => EXTENDED.test(f.path))
    const listens: Listen[] = []
    let skipped = 0
    files.forEach((file, i) => {
      ctx.progress({ stage: 'parsing', fraction: i / files.length, detail: file.path })
      const rows = parseArray(file)
      for (const row of rows) {
        const listen = extended ? fromExtended(row) : fromAccount(row)
        if (listen) listens.push(listen)
        else skipped++
      }
    })
    if (!listens.some((l) => l.track)) {
      throw new ImportError(
        'format-changed',
        'We found Spotify history files, but their contents don’t look like we expect. Spotify may have changed the format. Please open an issue and paste the format report below (it contains no personal data).',
        structureReport(files.slice(0, 2).map((f) => ({ path: f.path, json: safeJson(f.text) }))),
      )
    }
    ctx.progress({ stage: 'summarizing', fraction: 1 })
    return { summary: summarize(listens, extended ? 'extended' : 'account'), skipped }
  },
}

function parseArray(file: ExportFile): unknown[] {
  const json = safeJson(file.text)
  if (!Array.isArray(json)) {
    throw new ImportError(
      'format-changed',
      `“${file.path.split('/').pop()}” is not a list of plays. Spotify may have changed the format. Please open an issue and paste the format report below.`,
      structureReport([{ path: file.path, json }]),
    )
  }
  return json
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new ImportError(
      'format-changed',
      'A Spotify history file is not valid JSON. The download may be incomplete; try downloading the export again.',
    )
  }
}

function fromExtended(row: unknown): Listen | null {
  const r = extendedRow.safeParse(row)
  if (!r.success) return null
  const d = r.data
  const ts = Date.parse(d.ts)
  if (Number.isNaN(ts)) return null
  const skippedFlag = d.skipped === true || d.reason_end === 'fwdbtn'
  return {
    ts,
    ms: d.ms_played,
    track: d.master_metadata_track_name ?? undefined,
    artist: d.master_metadata_album_artist_name ?? undefined,
    episode: d.episode_name ?? undefined,
    show: d.episode_show_name ?? undefined,
    skipped: skippedFlag,
  }
}

function fromAccount(row: unknown): Listen | null {
  const music = accountMusicRow.safeParse(row)
  if (music.success) {
    const ts = accountTime(music.data.endTime, music.data.msPlayed)
    if (ts === null) return null
    const d = music.data
    return { ts, ms: d.msPlayed, track: d.trackName, artist: d.artistName, skipped: null }
  }
  const pod = accountPodcastRow.safeParse(row)
  if (pod.success) {
    const ts = accountTime(pod.data.endTime, pod.data.msPlayed)
    if (ts === null) return null
    const d = pod.data
    return { ts, ms: d.msPlayed, episode: d.episodeName, show: d.podcastName, skipped: null }
  }
  return null
}

/** Account data stores the UTC end time as "2024-03-01 21:14"; we want the start. */
function accountTime(endTime: string, ms: number): number | null {
  const end = Date.parse(`${endTime.replace(' ', 'T')}:00Z`)
  return Number.isNaN(end) ? null : end - ms
}

const ranked = (entries: [string, Tally][], withSub: boolean): Ranked[] =>
  entries.map(([key, t]) => {
    const [name, sub] = key.split(SEP) as [string, string | undefined]
    return withSub ? { name, sub, ms: t.ms, plays: t.plays } : { name, ms: t.ms, plays: t.plays }
  })

export function summarize(listens: Listen[], format: SpotifySummary['format']): SpotifySummary {
  const music = listens.filter((l) => l.track && l.artist).sort((a, b) => a.ts - b.ts)
  const episodes = listens.filter((l) => !l.track && l.episode)

  const artists = new Map<string, Tally>()
  const tracks = new Map<string, Tally>()
  const perYear = new Map<number, { artists: Map<string, Tally>; tracks: Map<string, Tally> }>()
  const years = new Map<number, { ms: number; plays: number }>()
  const months = new Map<string, number>()
  const days = new Map<string, number>()
  const hours = new Array<number>(24).fill(0)
  const weekHours = emptyWeekHours()
  const skipTracks = new Map<string, { records: number; skips: number }>()
  const skipYears = new Map<number, { records: number; skips: number }>()
  let ms = 0
  let plays = 0
  let skips = 0

  for (const l of music) {
    const play = l.ms >= PLAY_MS
    const trackKey = `${l.track}${SEP}${l.artist}`
    const year = yearOf(l.ts)
    ms += l.ms
    if (play) plays++
    bump(artists, l.artist!, l.ms, play)
    bump(tracks, trackKey, l.ms, play)
    const y = perYear.get(year) ?? {
      artists: new Map<string, Tally>(),
      tracks: new Map<string, Tally>(),
    }
    perYear.set(year, y)
    bump(y.artists, l.artist!, l.ms, play)
    bump(y.tracks, trackKey, l.ms, play)
    const yt = years.get(year) ?? { ms: 0, plays: 0 }
    yt.ms += l.ms
    if (play) yt.plays++
    years.set(year, yt)
    const mk = monthKey(l.ts)
    months.set(mk, (months.get(mk) ?? 0) + l.ms)
    const dk = dayKey(l.ts)
    days.set(dk, (days.get(dk) ?? 0) + l.ms)
    hours[hourOf(l.ts)]! += l.ms
    weekHours[weekday(l.ts)]![hourOf(l.ts)]! += l.ms
    if (format === 'extended') {
      const st = skipTracks.get(trackKey) ?? { records: 0, skips: 0 }
      const sy = skipYears.get(year) ?? { records: 0, skips: 0 }
      st.records++
      sy.records++
      if (l.skipped) {
        st.skips++
        sy.skips++
        skips++
      }
      skipTracks.set(trackKey, st)
      skipYears.set(year, sy)
    }
  }

  const first = music[0]!
  const last = music[music.length - 1]!
  const top: SpotifySummary['top'] = {
    all: {
      artists: ranked(
        topN(artists, 50, (t) => t.ms),
        false,
      ),
      tracks: ranked(
        topN(tracks, 50, (t) => t.ms),
        true,
      ),
    },
  }
  for (const [year, y] of perYear) {
    top[String(year)] = {
      artists: ranked(
        topN(y.artists, 25, (t) => t.ms),
        false,
      ),
      tracks: ranked(
        topN(y.tracks, 25, (t) => t.ms),
        true,
      ),
    }
  }

  const shows = new Map<string, Tally>()
  let podcastMs = 0
  for (const e of episodes) {
    podcastMs += e.ms
    bump(shows, e.show ?? 'Unknown show', e.ms, e.ms >= PLAY_MS)
  }

  return {
    format,
    first: first.ts,
    last: last.ts,
    totals: {
      ms,
      plays,
      records: music.length,
      tracks: tracks.size,
      artists: artists.size,
      activeDays: days.size,
    },
    years: [...years.entries()].sort((a, b) => a[0] - b[0]).map(([year, t]) => ({ year, ...t })),
    months: monthRange(first.ts, last.ts).map((key) => ({ key, ms: months.get(key) ?? 0 })),
    hours,
    weekHours,
    top,
    skips:
      format === 'extended'
        ? {
            count: skips,
            rate: music.length ? skips / music.length : 0,
            byYear: [...skipYears.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([year, s]) => ({ year, rate: s.records ? s.skips / s.records : 0 })),
            tracks: [...skipTracks.entries()]
              .filter(([, s]) => s.records >= 5 && s.skips > 0)
              .sort((a, b) => b[1].skips - a[1].skips || b[1].records - a[1].records)
              .slice(0, 20)
              .map(([key, s]) => {
                const [name, artist] = key.split(SEP) as [string, string]
                return { name, artist, ...s }
              }),
          }
        : null,
    podcasts: episodes.length
      ? {
          ms: podcastMs,
          episodes: episodes.length,
          shows: ranked(
            topN(shows, 10, (t) => t.ms),
            false,
          ),
        }
      : null,
    highlights: {
      busiestDay: busiest(days),
      longestStreak: streak([...days.keys()]),
      firstPlay: { ts: first.ts, track: first.track!, artist: first.artist! },
    },
  }
}

function busiest(days: Map<string, number>) {
  let best = { day: '', ms: 0 }
  for (const [day, ms] of days) if (ms > best.ms) best = { day, ms }
  return best
}

export function streak(dayKeys: string[]) {
  const sorted = [...dayKeys].sort()
  let best = { days: 0, from: '', to: '' }
  let run = 0
  let start = ''
  let prev = Number.NaN
  for (const k of sorted) {
    const n = dayNumber(k)
    if (n === prev + 1) run++
    else {
      run = 1
      start = k
    }
    if (run > best.days) best = { days: run, from: start, to: k }
    prev = n
  }
  return best
}
