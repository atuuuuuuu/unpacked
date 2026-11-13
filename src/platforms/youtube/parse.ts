import { ImportError } from '@/core/errors'
import { median, topN } from '@/core/rank'
import { structureReport } from '@/core/structure'
import { emptyWeekHours, hourOf, monthKey, monthRange, weekday, yearOf } from '@/core/time'
import type { PlatformParser } from '@/core/types'
import { watchEntry } from './schema'
import type { ChannelRank, Sitting, YouTubeSummary } from './types'

// shortcut: only the English file name is matched; localized Takeouts may name it differently.
// Upgrade when someone reports their language's file name in a "format changed" issue.
const WATCH_JSON = /(^|\/)watch-history\.json$/i
const WATCH_HTML = /(^|\/)watch-history\.html$/i

/**
 * Takeout has no watch duration. We estimate it from the gap to the next video, capped at
 * SITTING_GAP; a longer gap ends the sitting, and the last video of a sitting counts as the
 * median in-sitting gap.
 */
export const SITTING_GAP = 30 * 60_000
export const BINGE_MS = 2 * 60 * 60_000

export interface Watch {
  ts: number
  videoId: string | null
  title: string
  channel: string | null
  channelUrl?: string
  url?: string
}

export const youtubeParser: PlatformParser<'youtube'> = {
  id: 'youtube',
  select: (paths) => paths.filter((p) => WATCH_JSON.test(p)),
  diagnose(paths) {
    if (paths.some((p) => WATCH_HTML.test(p))) {
      return 'Your YouTube history is in HTML, which is Takeout’s default. Export again and set the history format to JSON (Multiple formats → history → JSON).'
    }
    if (paths.some((p) => /^Takeout\//.test(p))) {
      return 'This Google Takeout doesn’t include YouTube watch history. Export again with “YouTube and YouTube Music” selected and “history” ticked.'
    }
    return null
  },
  parse(files, ctx) {
    const watches: Watch[] = []
    let ads = 0
    let music = 0
    let skipped = 0
    for (const file of files) {
      ctx.progress({ stage: 'parsing', fraction: 0.3, detail: file.path })
      let json: unknown
      try {
        json = JSON.parse(file.text)
      } catch {
        throw new ImportError(
          'format-changed',
          'Your watch history file is not valid JSON. The download may be incomplete; try downloading the export again.',
        )
      }
      if (!Array.isArray(json)) {
        throw new ImportError(
          'format-changed',
          'Your watch history doesn’t look like we expect. YouTube may have changed the format. Please open an issue and paste the format report below.',
          structureReport([{ path: file.path, json }]),
        )
      }
      for (const raw of json) {
        const r = watchEntry.safeParse(raw)
        if (!r.success) {
          skipped++
          continue
        }
        const e = r.data
        const ts = Date.parse(e.time)
        if (Number.isNaN(ts)) {
          skipped++
          continue
        }
        if (e.details?.some((d) => /ads/i.test(d.name))) {
          ads++
          continue
        }
        if (e.header === 'YouTube Music') {
          music++
          continue
        }
        const videoId = e.titleUrl?.match(/[?&]v=([\w-]{6,})/)?.[1] ?? null
        if (e.titleUrl && !videoId) continue // "Visited …" and other non-watch activity
        const ch = e.subtitles?.[0]
        watches.push({
          ts,
          videoId,
          title: videoId ? e.title.replace(/^Watched\s+/, '') : '',
          channel: ch?.name ?? null,
          channelUrl: ch?.url,
          url: e.titleUrl,
        })
      }
    }
    if (!watches.length && !music) {
      throw new ImportError(
        'format-changed',
        'We found your watch history file, but no videos in it. If you paused watch history, it may really be empty. Otherwise, please open an issue and paste the format report below.',
        structureReport(files.map((f) => ({ path: f.path, json: tryJson(f.text) }))),
      )
    }
    if (!watches.length) {
      throw new ImportError(
        'not-recognized',
        'This watch history only has YouTube Music plays. Unpacked shows YouTube videos for now.',
      )
    }
    ctx.progress({ stage: 'summarizing', fraction: 0.9 })
    return { summary: summarize(watches, ads, music), skipped }
  },
}

function tryJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return 'invalid JSON'
  }
}

/** Splits watches (sorted by time) into sittings and estimates each video's watch time. */
export function estimate(watches: Watch[]): {
  perVideo: number[]
  sittings: Sitting[]
  typical: number
} {
  const gaps: number[] = []
  for (let i = 1; i < watches.length; i++) {
    const g = watches[i]!.ts - watches[i - 1]!.ts
    if (g > 0 && g <= SITTING_GAP) gaps.push(g)
  }
  const typical = median(gaps) || 8 * 60_000
  const perVideo: number[] = []
  const sittings: Sitting[] = []
  let current: { start: number; idx: number[] } | null = null
  const close = (end: number) => {
    if (!current) return
    const channels = new Map<string, number>()
    for (const i of current.idx) {
      const c = watches[i]!.channel
      if (c) channels.set(c, (channels.get(c) ?? 0) + 1)
    }
    const top = topN(channels, 1, (n) => n)[0]
    sittings.push({
      start: current.start,
      end,
      videos: current.idx.length,
      estMs: current.idx.reduce((s, i) => s + perVideo[i]!, 0),
      topChannel: top?.[0] ?? null,
    })
  }
  for (let i = 0; i < watches.length; i++) {
    const w = watches[i]!
    const next = watches[i + 1]
    const gap = next ? next.ts - w.ts : Number.POSITIVE_INFINITY
    if (!current) current = { start: w.ts, idx: [] }
    current.idx.push(i)
    const continues = gap <= SITTING_GAP
    perVideo[i] = continues ? gap : typical
    if (!continues) {
      close(w.ts + perVideo[i]!)
      current = null
    }
  }
  return { perVideo, sittings, typical }
}

export function summarize(unsorted: Watch[], ads: number, music: number): YouTubeSummary {
  const watches = [...unsorted].sort((a, b) => a.ts - b.ts)
  const { perVideo, sittings, typical } = estimate(watches)
  const first = watches[0]!
  const last = watches[watches.length - 1]!

  const channels = new Map<string, { videos: number; estMs: number; url?: string }>()
  const perYear = new Map<number, Map<string, { videos: number; estMs: number; url?: string }>>()
  const months = new Map<string, { videos: number; estMs: number }>()
  const years = new Map<number, number>()
  const videos = new Map<
    string,
    { title: string; channel: string | null; url: string; count: number }
  >()
  const hours = new Array<number>(24).fill(0)
  const weekHours = emptyWeekHours()
  let removed = 0
  let estMs = 0

  watches.forEach((w, i) => {
    const est = perVideo[i]!
    estMs += est
    const y = yearOf(w.ts)
    years.set(y, (years.get(y) ?? 0) + 1)
    const mk = monthKey(w.ts)
    const m = months.get(mk) ?? { videos: 0, estMs: 0 }
    m.videos++
    m.estMs += est
    months.set(mk, m)
    hours[hourOf(w.ts)]!++
    weekHours[weekday(w.ts)]![hourOf(w.ts)]!++
    if (!w.videoId) removed++
    if (w.channel) {
      for (const map of [channels, perYear.get(y) ?? perYear.set(y, new Map()).get(y)!]) {
        const c = map.get(w.channel) ?? { videos: 0, estMs: 0, url: w.channelUrl }
        c.videos++
        c.estMs += est
        map.set(w.channel, c)
      }
    }
    if (w.videoId && w.url) {
      const v = videos.get(w.videoId) ?? {
        title: w.title,
        channel: w.channel,
        url: w.url,
        count: 0,
      }
      v.count++
      videos.set(w.videoId, v)
    }
  })

  const rank = (map: typeof channels, n: number): ChannelRank[] =>
    topN(map, n, (c) => c.videos).map(([name, c]) => ({
      name,
      url: c.url,
      videos: c.videos,
      estMs: c.estMs,
    }))

  const top: YouTubeSummary['top'] = { all: rank(channels, 50) }
  for (const [y, map] of perYear) top[String(y)] = rank(map, 25)

  return {
    first: first.ts,
    last: last.ts,
    totals: {
      videos: watches.length,
      uniqueVideos: videos.size,
      channels: channels.size,
      removed,
      ads,
      music,
      estMs,
      sittings: sittings.length,
      binges: sittings.filter((s) => s.estMs >= BINGE_MS).length,
    },
    months: monthRange(first.ts, last.ts).map((key) => ({
      key,
      ...(months.get(key) ?? { videos: 0, estMs: 0 }),
    })),
    years: [...years.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, n]) => ({ year, videos: n })),
    hours,
    weekHours,
    top,
    rewatched: [...videos.values()]
      .filter((v) => v.count >= 3)
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
      .slice(0, 15),
    sittings: [...sittings].sort((a, b) => b.estMs - a.estMs).slice(0, 10),
    firstVideo: {
      ts: first.ts,
      title: first.title || 'A video that was later removed',
      channel: first.channel,
    },
    typicalVideoMs: typical,
  }
}
