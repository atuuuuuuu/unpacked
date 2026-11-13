import { describe, expect, it } from 'vitest'
import { estimate, SITTING_GAP, type Watch, youtubeParser } from './parse'
import { sampleYouTubeFiles } from './sample'

const ctx = { sourceName: 'takeout.zip', sourceModified: 0, progress: () => {} }
const path = 'Takeout/YouTube and YouTube Music/history/watch-history.json'
const watch = (time: string, id: string, channel = 'Chan') => ({
  header: 'YouTube',
  title: `Watched Video ${id}`,
  titleUrl: `https://www.youtube.com/watch?v=${id}`,
  subtitles: [{ name: channel, url: 'https://www.youtube.com/channel/UC1' }],
  time,
  products: ['YouTube'],
})

describe('youtube select and diagnose', () => {
  it('finds watch-history.json', () => {
    expect(
      youtubeParser.select([path, 'Takeout/YouTube and YouTube Music/history/search-history.json']),
    ).toEqual([path])
  })
  it('explains the HTML default', () => {
    expect(
      youtubeParser.diagnose?.(['Takeout/YouTube and YouTube Music/history/watch-history.html']),
    ).toMatch(/JSON/)
  })
  it('explains a Takeout without YouTube', () => {
    expect(youtubeParser.diagnose?.(['Takeout/Drive/file.txt'])).toMatch(
      /YouTube and YouTube Music/,
    )
  })
})

describe('watch time estimate', () => {
  const w = (min: number): Watch => ({ ts: min * 60_000, videoId: 'v', title: '', channel: 'c' })
  it('uses the gap to the next video and closes sittings after a long gap', () => {
    const { perVideo, sittings, typical } = estimate([w(0), w(10), w(30), w(200)])
    expect(typical).toBe(15 * 60_000) // median of 10 and 20 minutes
    expect(perVideo).toEqual([10, 20, 15, 15].map((m) => m * 60_000))
    expect(sittings.map((s) => s.videos)).toEqual([3, 1])
    expect(SITTING_GAP).toBe(30 * 60_000)
  })
})

describe('youtube parse', () => {
  const entries = [
    watch('2024-05-01T20:00:00.000Z', 'aaaaaaaaaaa', 'Alpha'),
    watch('2024-05-01T20:12:00.000Z', 'bbbbbbbbbbb', 'Beta'),
    watch('2024-05-01T20:20:00.000Z', 'aaaaaaaaaaa', 'Alpha'),
    {
      header: 'YouTube',
      title: 'Watched a video that has been removed',
      time: '2024-05-02T08:00:00.000Z',
    },
    { ...watch('2024-05-02T09:00:00.000Z', 'adadadadada'), details: [{ name: 'From Google Ads' }] },
    { ...watch('2024-05-02T09:30:00.000Z', 'mmmmmmmmmmm'), header: 'YouTube Music' },
    {
      header: 'YouTube',
      title: 'Visited YouTube Music',
      titleUrl: 'https://music.youtube.com/',
      time: '2024-05-02T09:40:00.000Z',
    },
    { broken: true },
  ]
  const { summary: s, skipped } = youtubeParser.parse(
    [{ path, text: JSON.stringify(entries) }],
    ctx,
  )
  it('counts videos, removed videos, ads and music separately', () => {
    expect(s.totals).toMatchObject({
      videos: 4,
      removed: 1,
      ads: 1,
      music: 1,
      channels: 2,
      uniqueVideos: 2,
    })
    expect(skipped).toBe(1)
  })
  it('ranks channels and strips the "Watched" prefix', () => {
    expect(s.top.all![0]).toMatchObject({ name: 'Alpha', videos: 2 })
    expect(s.firstVideo.title).toBe('Video aaaaaaaaaaa')
  })
})

describe('youtube sample', () => {
  it('parses with sittings and binges', () => {
    const { summary, skipped } = youtubeParser.parse(sampleYouTubeFiles(), ctx)
    expect(skipped).toBe(0)
    expect(summary.totals.videos).toBeGreaterThan(5000)
    expect(summary.totals.binges).toBeGreaterThan(10)
    expect(summary.rewatched.length).toBeGreaterThan(0)
  })
})
