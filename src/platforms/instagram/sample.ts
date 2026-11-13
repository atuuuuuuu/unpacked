import { type Rng, rng } from '@/core/random'
import type { ExportFile } from '@/core/types'

/**
 * Two fictional Instagram exports, three months apart, so the comparison view has something to
 * show. Usernames are invented; the sample dashboards never link them to real profiles.
 */
export const SAMPLE_INSTAGRAM = [
  { name: 'instagram-sample-2026-08-02.zip', date: new Date(2026, 7, 2) },
  { name: 'instagram-sample-2026-11-01.zip', date: new Date(2026, 10, 1) },
] as const

const FIRST = [
  'jules',
  'mika',
  'noor',
  'ari',
  'theo',
  'lena',
  'kai',
  'iris',
  'omar',
  'sana',
  'felix',
  'yara',
  'milo',
  'ines',
  'ravi',
  'zoe',
  'hugo',
  'ada',
  'leo',
  'nia',
  'eli',
  'maya',
  'ivo',
  'tess',
  'remy',
  'luca',
  'nora',
  'sami',
  'cleo',
  'otto',
]
const WORDS = [
  'on.film',
  'runs',
  'studio',
  'and.grain',
  'audio',
  'draws',
  'cooks',
  'travels',
  'shoots',
  'climbs',
  'reads',
  'makes',
  'outdoors',
  'archive',
  'daily',
  'in.color',
  'by.the.sea',
  'ceramics',
  'plants',
  'sketches',
  'bakes',
  'photo',
  'notes',
  'skates',
  'garden',
]
const BRANDS = [
  'tidepool.studio',
  'basil.and.grain',
  'northbound.audio',
  'copper.kettle.cafe',
  'lowlight.books',
  'fieldnotes.press',
  'paper.plane.lab',
  'quiet.trails.club',
  'saltwater.surfco',
  'atlas.ceramics',
  'neon.market.food',
  'harbor.cycle.co',
  'oak.and.ink',
  'velvet.records',
  'small.batch.bakery',
]

function usernames(r: Rng, n: number): string[] {
  const out = new Set<string>(BRANDS)
  while (out.size < n) {
    const style = r.int(0, 3)
    const first = r.pick(FIRST)
    const word = r.pick(WORDS)
    out.add(
      style === 0
        ? `${first}.${word}`
        : style === 1
          ? `${first}_${word.replace(/\./g, '_')}`
          : style === 2
            ? `${first}${r.int(2, 99)}`
            : `${word.replace(/\./g, '')}.${first}`,
    )
  }
  return [...out]
}

const entry = (username: string, ts: number) => ({
  title: '',
  media_list_data: [],
  string_list_data: [
    {
      href: `https://www.instagram.com/${username}`,
      value: username,
      timestamp: Math.floor(ts / 1000),
    },
  ],
})

// Newer exports use this shape for following.json: username in `title`, no `value`.
const newStyleEntry = (username: string, ts: number) => ({
  title: username,
  string_list_data: [
    { href: `https://www.instagram.com/_u/${username}`, timestamp: Math.floor(ts / 1000) },
  ],
})

export function sampleInstagramExports(
  seed = 11,
): { name: string; date: Date; files: ExportFile[] }[] {
  const r = rng(seed)
  const pool = usernames(r, 900)
  const start = new Date(2015, 5, 1).getTime()
  const firstDate = SAMPLE_INSTAGRAM[0].date.getTime()
  const since = new Map(pool.map((u) => [u, start + r.next() ** 0.6 * (firstDate - start)]))

  // Snapshot 1
  const followers1 = pool.filter(() => r.chance(0.48))
  const followingBase = new Set(followers1.filter(() => r.chance(0.82)))
  for (const u of pool) if (!followingBase.has(u) && r.chance(0.13)) followingBase.add(u)
  for (const b of BRANDS) followingBase.add(b)
  const following1 = [...followingBase]

  // Snapshot 2: a few people leave, a few arrive, and you clean up who you follow.
  const lost = new Set(followers1.filter(() => r.chance(0.035)))
  const later = (u: string) => {
    const t = firstDate + r.next() * (SAMPLE_INSTAGRAM[1].date.getTime() - firstDate)
    since.set(u, t)
    return u
  }
  const gained = pool.filter((u) => !followers1.includes(u) && r.chance(0.04)).map(later)
  const followers2 = [...followers1.filter((u) => !lost.has(u)), ...gained]
  const unfollowed = new Set(following1.filter((u) => !followers1.includes(u) && r.chance(0.18)))
  const started = pool.filter((u) => !followingBase.has(u) && r.chance(0.02)).map(later)
  const following2 = [...following1.filter((u) => !unfollowed.has(u)), ...started]
  const pending = pool.filter((u) => !followingBase.has(u) && r.chance(0.008))

  const snap = (followers: string[], following: string[], date: Date, withExtras: boolean) => {
    const at = (u: string) => Math.min(since.get(u) ?? start, date.getTime())
    const dir = 'connections/followers_and_following'
    const files: ExportFile[] = [
      {
        path: `${dir}/followers_1.json`,
        text: JSON.stringify(followers.map((u) => entry(u, at(u)))),
      },
      {
        path: `${dir}/following.json`,
        text: JSON.stringify({
          relationships_following: following.map((u) => newStyleEntry(u, at(u))),
        }),
      },
    ]
    if (withExtras) {
      files.push({
        path: `${dir}/pending_follow_requests.json`,
        text: JSON.stringify({
          relationships_follow_requests_sent: pending.map((u) =>
            entry(u, date.getTime() - 86_400_000 * r.int(2, 60)),
          ),
        }),
      })
      files.push({
        path: `${dir}/recently_unfollowed_profiles.json`,
        text: JSON.stringify({
          relationships_unfollowed_users: [...unfollowed].map((u) =>
            entry(u, date.getTime() - 86_400_000 * r.int(1, 80)),
          ),
        }),
      })
    }
    return files
  }

  return [
    {
      ...SAMPLE_INSTAGRAM[0],
      files: snap(followers1, following1, SAMPLE_INSTAGRAM[0].date, false),
    },
    { ...SAMPLE_INSTAGRAM[1], files: snap(followers2, following2, SAMPLE_INSTAGRAM[1].date, true) },
  ]
}
