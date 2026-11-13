import { describe, expect, it } from 'vitest'
import { ImportError } from '@/core/errors'
import type { ExportFile } from '@/core/types'
import { spotifyParser, streak } from './parse'
import { sampleSpotifyFiles } from './sample'

const ctx = { sourceName: 'my_spotify_data.zip', sourceModified: 0, progress: () => {} }
const ext = (rows: object[]): ExportFile => ({
  path: 'Spotify Extended Streaming History/Streaming_History_Audio_2024.json',
  text: JSON.stringify(rows),
})
const play = (ts: string, track: string, artist: string, ms: number, extra: object = {}) => ({
  ts,
  ms_played: ms,
  ip_addr: '203.0.113.9',
  master_metadata_track_name: track,
  master_metadata_album_artist_name: artist,
  master_metadata_album_album_name: 'Album',
  reason_end: 'trackdone',
  skipped: false,
  ...extra,
})

describe('spotify select', () => {
  it('prefers extended history over account data', () => {
    const paths = [
      'Spotify Account Data/StreamingHistory_music_0.json',
      'Spotify Extended Streaming History/Streaming_History_Audio_2019-2021_0.json',
      'Spotify Extended Streaming History/Streaming_History_Video_2019-2024.json',
      'Spotify Extended Streaming History/ReadMeFirst_ExtendedStreamingHistory.pdf',
    ]
    expect(spotifyParser.select(paths)).toEqual(paths.slice(1, 3))
  })
  it('falls back to account data', () => {
    expect(
      spotifyParser.select([
        'Spotify Account Data/StreamingHistory_music_0.json',
        'Spotify Account Data/Userdata.json',
      ]),
    ).toEqual(['Spotify Account Data/StreamingHistory_music_0.json'])
  })
  it('explains an export without history', () => {
    expect(spotifyParser.diagnose?.(['Spotify Account Data/Userdata.json'])).toMatch(
      /Extended streaming history/,
    )
  })
})

describe('spotify parse (extended)', () => {
  const rows = [
    play('2023-12-31T23:00:00Z', 'Song A', 'Artist 1', 200_000),
    play('2024-01-01T10:00:00Z', 'Song A', 'Artist 1', 180_000),
    play('2024-01-01T10:04:00Z', 'Song B', 'Artist 2', 10_000, {
      skipped: true,
      reason_end: 'fwdbtn',
    }),
    play('2024-01-02T22:30:00Z', 'Song C', 'Artist 2', 240_000),
    play('2024-01-03T22:30:00Z', 'Song B', 'Artist 2', 5_000, {
      skipped: null,
      reason_end: 'fwdbtn',
    }),
    {
      ts: '2024-01-03T08:00:00Z',
      ms_played: 1_800_000,
      episode_name: 'Ep 1',
      episode_show_name: 'Show',
    },
    { nonsense: true },
  ]
  const { summary: s, skipped } = spotifyParser.parse([ext(rows)], ctx)

  it('counts time, plays (30s+) and records', () => {
    expect(s.format).toBe('extended')
    expect(s.totals.ms).toBe(635_000)
    expect(s.totals.plays).toBe(3)
    expect(s.totals.records).toBe(5)
    expect(s.totals.artists).toBe(2)
    expect(s.totals.tracks).toBe(3)
    expect(skipped).toBe(1)
  })
  it('splits years and fills months', () => {
    expect(s.years).toEqual([
      { year: 2023, ms: 200_000, plays: 1 },
      { year: 2024, ms: 435_000, plays: 2 },
    ])
    expect(s.months.map((m) => m.key)).toEqual(['2023-12', '2024-01'])
  })
  it('ranks artists by time, overall and per year', () => {
    expect(s.top.all!.artists[0]).toEqual({ name: 'Artist 1', ms: 380_000, plays: 2 })
    expect(s.top['2024']!.artists[0]!.name).toBe('Artist 2')
    expect(s.top.all!.tracks[0]).toMatchObject({ name: 'Song A', sub: 'Artist 1' })
  })
  it('counts skips from the flag and the forward button', () => {
    expect(s.skips?.count).toBe(2)
    expect(s.skips?.rate).toBeCloseTo(2 / 5)
  })
  it('keeps podcasts separate', () => {
    expect(s.podcasts).toEqual({
      ms: 1_800_000,
      episodes: 1,
      shows: [{ name: 'Show', ms: 1_800_000, plays: 1 }],
    })
  })
  it('finds highlights', () => {
    expect(s.highlights.firstPlay).toMatchObject({ track: 'Song A', artist: 'Artist 1' })
    expect(s.highlights.longestStreak.days).toBe(4)
    expect(s.hours[22]).toBe(240_000 + 5_000)
  })
  it('drops fields it does not need, such as IP addresses', () => {
    expect(JSON.stringify(s)).not.toContain('203.0.113.9')
  })
})

describe('spotify parse (account data)', () => {
  it('reads StreamingHistory_music files and has no skip data', () => {
    const file = {
      path: 'Spotify Account Data/StreamingHistory_music_0.json',
      text: JSON.stringify([
        { endTime: '2024-03-01 21:14', artistName: 'X', trackName: 'Y', msPlayed: 60_000 },
        { endTime: '2024-03-01 21:20', artistName: 'X', trackName: 'Z', msPlayed: 20_000 },
      ]),
    }
    const { summary } = spotifyParser.parse([file], ctx)
    expect(summary.format).toBe('account')
    expect(summary.totals.plays).toBe(1)
    expect(summary.skips).toBeNull()
    expect(new Date(summary.first).toISOString()).toBe('2024-03-01T21:13:00.000Z')
  })
})

describe('spotify format errors', () => {
  it('reports a changed format with a value-free structure report', () => {
    const file = ext([{ when: '2024-01-01', song: 'Secret Song Title', played: 1 }])
    try {
      spotifyParser.parse([file], ctx)
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(ImportError)
      const err = e as ImportError
      expect(err.code).toBe('format-changed')
      expect(err.report).toContain('"song": "string"')
      expect(err.report).not.toContain('Secret Song Title')
    }
  })
  it('rejects a file that is not a list', () => {
    expect(() => spotifyParser.parse([ext({} as never)], ctx)).toThrow(ImportError)
  })
})

describe('streak', () => {
  it('finds the longest run of consecutive days', () => {
    expect(streak(['2024-01-01', '2024-01-02', '2024-01-05', '2024-01-06', '2024-01-07'])).toEqual({
      days: 3,
      from: '2024-01-05',
      to: '2024-01-07',
    })
  })
})

describe('spotify sample', () => {
  it('is fictional, deterministic and fully parseable', () => {
    const a = spotifyParser.parse(sampleSpotifyFiles(), ctx)
    const b = spotifyParser.parse(sampleSpotifyFiles(), ctx)
    expect(a.summary.totals).toEqual(b.summary.totals)
    expect(a.skipped).toBe(0)
    expect(a.summary.totals.records).toBeGreaterThan(20_000)
    expect(a.summary.years.length).toBe(10)
    expect(a.summary.podcasts?.shows.length).toBe(2)
  })
})
