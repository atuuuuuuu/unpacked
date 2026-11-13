import { type Rng, rng, zipfWeights } from '@/core/random'
import type { ExportFile } from '@/core/types'

/**
 * A fictional Extended streaming history: invented artists and tracks, generated with a fixed
 * seed so every visitor sees the same numbers. Rows use Spotify's real field names, so the
 * sample goes through exactly the same parser as a real export.
 */
export const SAMPLE_SPOTIFY_NAME = 'sample_spotify_extended_history.zip'

const ARTISTS = [
  'Lumen Field',
  'Marrow & Vine',
  'Night Ferry',
  'Sora Kintsugi',
  'Okra Static',
  'Juniper Atlas',
  'Ines Moreau',
  'Kaito & the Tidelines',
  'Saltwater Choir',
  'Glass Orchard',
  'Fennel Park',
  'Mira Solenne',
  'Low Orbit Club',
  'Pale Cartographer',
  'Wren Okafor',
  'Static Bloom',
  'Harbor Lights Ensemble',
  'Teodora Vale',
  'The Quiet Engines',
  'Cinder & Sage',
  'Amaru Delgado',
  'Polaroid Summer',
  'Hollow Coast',
  'Yuki Arden',
  'Velour Machines',
  'Brass Lanterns',
  'Odette Rain',
  'Mountain Radio Hour',
]
const WORDS_A = [
  'Copper',
  'Slow',
  'Paper',
  'Silver',
  'Neon',
  'Quiet',
  'Golden',
  'Hollow',
  'Velvet',
  'Late',
  'Northern',
  'Electric',
  'Borrowed',
  'Glass',
  'Second',
  'Wild',
  'Distant',
  'Soft',
  'Last',
  'Blue',
]
const WORDS_B = [
  'Satellites',
  'Tide',
  'Kites',
  'Morning',
  'Rooms',
  'Hearts',
  'Signals',
  'Weather',
  'Rivers',
  'Summer',
  'Static',
  'Lights',
  'Letters',
  'Gardens',
  'Engines',
  'Avenue',
  'Echoes',
  'Harbor',
  'Feathers',
  'Hours',
]
const SHOWS = [
  { show: 'The Slow Week', length: 42 },
  { show: 'Signal & Noise Hour', length: 58 },
]

interface Track {
  name: string
  album: string
  artist: string
  seconds: number
  skipBias: number
}

function catalog(r: Rng): Track[][] {
  return ARTISTS.map((artist) => {
    const album = `${r.pick(WORDS_A)} ${r.pick(WORDS_B)}`
    const used = new Set<string>()
    return Array.from({ length: r.int(6, 13) }, () => {
      let name = `${r.pick(WORDS_A)} ${r.pick(WORDS_B)}`
      while (used.has(name)) name = `${r.pick(WORDS_A)} ${r.pick(WORDS_B)}`
      used.add(name)
      return {
        name,
        album,
        artist,
        seconds: r.int(150, 320),
        skipBias: r.chance(0.12) ? 0.55 : r.next() * 0.18,
      }
    })
  })
}

const SESSION_HOURS = [7, 8, 8, 12, 13, 17, 18, 19, 20, 21, 21, 22, 22, 23, 23, 0]

export function sampleSpotifyRows(seed = 7): Record<string, unknown>[] {
  const r = rng(seed)
  const artists = catalog(r)
  const rows: Record<string, unknown>[] = []
  const start = new Date(2017, 2, 14)
  const end = new Date(2026, 9, 31)
  const base = zipfWeights(artists.length)
  let eraWeights = base
  let eraYear = -1

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const year = d.getFullYear()
    if (year !== eraYear) {
      // Each year a few artists become "your" artists, so the yearly top lists differ.
      eraYear = year
      const favourites = new Set(Array.from({ length: 4 }, () => r.int(0, artists.length - 1)))
      eraWeights = base.map((w, i) => (favourites.has(i) ? w + 0.45 : w))
    }
    const growth = Math.min(1, 0.45 + (year - 2017) * 0.09)
    const weekend = d.getDay() === 0 || d.getDay() === 6
    if (r.chance(0.12)) continue // quiet days happen
    const sessions = r.weighted(weekend ? [1, 3, 3, 2] : [1, 4, 3, 1]) + (r.chance(growth) ? 1 : 0)
    for (let s = 0; s < sessions; s++) {
      const t = new Date(
        year,
        d.getMonth(),
        d.getDate(),
        r.pick(SESSION_HOURS),
        r.int(-50, 110),
        r.int(0, 59),
      )
      const length = Math.max(2, Math.round(r.normal(weekend ? 14 : 10, 5)))
      let artistIdx = r.weighted(eraWeights)
      for (let i = 0; i < length; i++) {
        if (r.chance(0.3)) artistIdx = r.weighted(eraWeights)
        const track = r.pick(artists[artistIdx]!)
        const skip = r.chance(0.08 + track.skipBias)
        const ms = skip ? r.int(3, 40) * 1000 : track.seconds * 1000 - r.int(0, 1500)
        rows.push(row(t, ms, track, skip))
        t.setTime(t.getTime() + ms + r.int(0, 3) * 1000)
      }
    }
    if (year >= 2020 && (d.getDay() === 1 || d.getDay() === 4) && r.chance(0.7)) {
      const show = r.pick(SHOWS)
      const t = new Date(year, d.getMonth(), d.getDate(), 8, r.int(0, 40))
      rows.push(episode(t, show.show, r.int(show.length * 0.5, show.length) * 60_000, r))
    }
  }
  return rows
}

function row(t: Date, ms: number, track: Track, skipped: boolean) {
  return {
    ts: t.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    platform: 'sample',
    ms_played: ms,
    conn_country: 'ZZ',
    master_metadata_track_name: track.name,
    master_metadata_album_artist_name: track.artist,
    master_metadata_album_album_name: track.album,
    spotify_track_uri: null,
    episode_name: null,
    episode_show_name: null,
    spotify_episode_uri: null,
    reason_start: 'trackdone',
    reason_end: skipped ? 'fwdbtn' : 'trackdone',
    shuffle: false,
    skipped,
    offline: false,
    incognito_mode: false,
  }
}

function episode(t: Date, show: string, ms: number, r: Rng) {
  return {
    ts: t.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    platform: 'sample',
    ms_played: ms,
    conn_country: 'ZZ',
    master_metadata_track_name: null,
    master_metadata_album_artist_name: null,
    master_metadata_album_album_name: null,
    spotify_track_uri: null,
    episode_name: `Episode ${r.int(10, 240)}: ${r.pick(WORDS_A)} ${r.pick(WORDS_B)}`,
    episode_show_name: show,
    spotify_episode_uri: null,
    reason_start: 'clickrow',
    reason_end: 'trackdone',
    shuffle: false,
    skipped: false,
    offline: false,
    incognito_mode: false,
  }
}

/** The sample as export files, one per year like Spotify's own split. */
export function sampleSpotifyFiles(seed = 7): ExportFile[] {
  const byYear = new Map<string, unknown[]>()
  for (const r of sampleSpotifyRows(seed)) {
    const y = String(r.ts).slice(0, 4)
    const list = byYear.get(y) ?? []
    list.push(r)
    byYear.set(y, list)
  }
  return [...byYear.entries()].map(([y, list]) => ({
    path: `Spotify Extended Streaming History/Streaming_History_Audio_${y}.json`,
    text: JSON.stringify(list),
  }))
}
