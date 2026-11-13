import { rng, zipfWeights } from '@/core/random'
import type { ExportFile } from '@/core/types'

/** A fictional Takeout watch history with invented channels, in Takeout's real JSON shape. */
export const SAMPLE_YOUTUBE_NAME = 'takeout-sample-youtube.zip'

const CHANNELS = [
  'Field Notes Kitchen',
  'Orbital Mechanics Club',
  'Tiny Workshop',
  'Daily Stretch with Noor',
  'Retro Circuit',
  'Quiet Trails',
  'Byte-Sized Physics',
  'Paper Plane Lab',
  'Late Night Chess',
  'Urban Sketch Diary',
  'The Long Commute',
  'Garden in a Box',
  'Synth Basement',
  'Pocket History',
  'Two Pans One Stove',
  'Signal Path Audio',
  'Map Room',
  'Weekend Woodshop',
  'Code at Dawn',
  'Slow Travel Japan',
  'Deep Sea Notes',
  'Film Grain Club',
  'Bike Repair Basics',
  'Mini Golf Physics',
]
const TOPICS = [
  'a budget 3-course dinner',
  'why orbits are ellipses',
  'restoring a 1970s radio',
  'the 10-minute morning routine',
  'building a tiny loom',
  'every opening trap in 12 minutes',
  'sketching rainy streets',
  'sourdough without a scale',
  'how modular synths work',
  'the history of street maps',
  'fixing a slipping chain',
  'a week of slow travel',
  'deep sea creatures explained',
  'shooting on expired film',
  'refactoring a messy function',
  'growing herbs indoors',
]
const FORMATS = [
  'I tried',
  'How to',
  'Explained:',
  'The truth about',
  'Beginner’s guide to',
  'Watch me try',
  'A quiet hour of',
]

const id = (n: number) => `smp${n.toString(36).padStart(8, '0')}`

export function sampleYouTubeEntries(seed = 23): Record<string, unknown>[] {
  const r = rng(seed)
  const weights = zipfWeights(CHANNELS.length, 0.9)
  const videosByChannel = CHANNELS.map((_, c) => {
    const titles = new Set<string>()
    while (titles.size < r.int(20, 60)) titles.add(`${r.pick(FORMATS)} ${r.pick(TOPICS)}`)
    return [...titles].map((title, v) => ({
      id: id(c * 1000 + v),
      title,
      minutes: Math.max(1, Math.round(r.normal(14, 9))),
    }))
  })
  const out: Record<string, unknown>[] = []
  const start = new Date(2023, 0, 9)
  const end = new Date(2026, 9, 30)
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const weekend = d.getDay() === 0 || d.getDay() === 6
    if (r.chance(weekend ? 0.1 : 0.25)) continue
    const sittings = r.weighted(weekend ? [1, 3, 2, 1] : [3, 3, 1])
    for (let s = 0; s < sittings; s++) {
      const hour = r.pick(
        weekend ? [10, 11, 14, 16, 20, 21, 22, 23] : [7, 12, 19, 20, 21, 22, 22, 23, 0],
      )
      const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, r.int(-40, 100))
      const binge = r.chance(weekend ? 0.18 : 0.06)
      const count = binge ? r.int(10, 24) : Math.max(1, Math.round(r.normal(4, 2.5)))
      let c = r.weighted(weights)
      for (let i = 0; i < count; i++) {
        if (r.chance(0.35)) c = r.weighted(weights)
        // A few favourites get rewatched; most videos are watched once or twice.
        const v = r.pick(videosByChannel[c]!.slice(0, r.chance(0.05) ? 3 : undefined))
        if (r.chance(0.04)) out.push(adEntry(t))
        const removed = r.chance(0.015)
        out.push(
          removed
            ? {
                header: 'YouTube',
                title: 'Watched a video that has been removed',
                time: t.toISOString(),
                products: ['YouTube'],
                activityControls: ['YouTube watch history'],
              }
            : {
                header: 'YouTube',
                title: `Watched ${v.title}`,
                titleUrl: `https://www.youtube.com/watch?v=${v.id}`,
                subtitles: [
                  { name: CHANNELS[c], url: `https://www.youtube.com/channel/UCsample${c}` },
                ],
                time: t.toISOString(),
                products: ['YouTube'],
                activityControls: ['YouTube watch history'],
              },
        )
        t.setTime(t.getTime() + Math.round(v.minutes * (0.6 + r.next() * 0.5)) * 60_000)
      }
    }
    if (r.chance(0.3)) {
      out.push({
        header: 'YouTube Music',
        title: `Watched ${r.pick(TOPICS)} (live session)`,
        titleUrl: `https://music.youtube.com/watch?v=${id(99_000 + r.int(0, 50))}`,
        time: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9).toISOString(),
        products: ['YouTube'],
        activityControls: ['YouTube watch history'],
      })
    }
  }
  // Takeout lists newest first.
  return out.reverse()
}

const adEntry = (t: Date) => ({
  header: 'YouTube',
  title: 'Watched Sample sponsor spot',
  titleUrl: 'https://www.youtube.com/watch?v=smpadvert0',
  time: t.toISOString(),
  products: ['YouTube'],
  details: [{ name: 'From Google Ads' }],
  activityControls: ['Web & App Activity', 'YouTube watch history', 'YouTube search history'],
})

export function sampleYouTubeFiles(seed = 23): ExportFile[] {
  return [
    {
      path: 'Takeout/YouTube and YouTube Music/history/watch-history.json',
      text: JSON.stringify(sampleYouTubeEntries(seed)),
    },
  ]
}
