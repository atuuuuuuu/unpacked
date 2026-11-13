import type { ComponentType } from 'react'
import { MusicIcon, PeopleIcon, PlayIcon } from '@/components/icons'
import type { PlatformId } from '@/core/types'

export interface GuideStep {
  text: string
  link?: { href: string; label: string }
}

export interface PlatformMeta {
  id: PlatformId
  name: string
  Icon: ComponentType<{ size?: number; className?: string }>
  /** One line for cards and the landing page. */
  pitch: string
  shows: string[]
  /** What to request from the platform. */
  request: string
  wait: string
  file: string
  steps: GuideStep[]
  notes: string[]
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    Icon: MusicIcon,
    pitch: 'Your all-time listening, not just this year’s.',
    shows: [
      'Total listening time and plays',
      'Hours per year and every month since you joined',
      'Top artists and tracks, all-time or per year',
      'When you listen, by hour and weekday',
      'What you skip most',
    ],
    request: 'Extended streaming history',
    wait: 'Up to 30 days, often sooner',
    file: 'my_spotify_data.zip',
    steps: [
      {
        text: 'Open Spotify’s privacy settings in a browser and log in.',
        link: {
          href: 'https://www.spotify.com/account/privacy/',
          label: 'spotify.com/account/privacy',
        },
      },
      { text: 'Scroll to “Download your data”.' },
      {
        text: 'Tick “Extended streaming history”. You can untick “Account data” if you only want your history.',
      },
      { text: 'Press “Request data”, then confirm with the link Spotify emails you.' },
      {
        text: 'When the “ready to download” email arrives, download the ZIP. It’s usually called my_spotify_data.zip.',
      },
      {
        text: 'Drop the ZIP into Unpacked. If you already unzipped it, select all the JSON files inside and drop them together.',
      },
    ],
    notes: [
      'The regular “Account data” export works too. It only covers about the last year and has no skip data, but it arrives within about 5 days.',
      'Times are shown in your device’s time zone.',
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    Icon: PeopleIcon,
    pitch: 'Who doesn’t follow you back, without giving anyone your password.',
    shows: [
      'Followers, following and mutuals',
      'Accounts that don’t follow you back',
      'Fans you don’t follow back',
      'Who unfollowed you, by comparing two exports',
      'Follow requests you sent that are still pending',
    ],
    request: 'Followers and following, in JSON format',
    wait: 'Minutes to a few days',
    file: 'instagram-yourname-2026-11-01-….zip',
    steps: [
      {
        text: 'Open Accounts Center. In the app: your profile → menu → Accounts Center.',
        link: {
          href: 'https://accountscenter.instagram.com/info_and_permissions/dyi/',
          label: 'accountscenter.instagram.com',
        },
      },
      {
        text: 'Go to Your information and permissions → Download your information → Download or transfer information.',
      },
      {
        text: 'Pick your Instagram account, choose “Some of your information” and tick “Followers and following”.',
      },
      {
        text: 'Choose “Download to device”. Set the date range to “All time” and the format to JSON.',
      },
      {
        text: 'Press “Create files”. Instagram tells you when the export is ready, then download the ZIP.',
      },
      {
        text: 'Drop the ZIP into Unpacked. To see who unfollowed you, request another export later and drop both.',
      },
    ],
    notes: [
      'HTML exports can’t be read. If you got HTML files, request the export again with JSON selected.',
      'Unpacked never logs in to Instagram. It only reads the file Instagram gave you.',
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    Icon: PlayIcon,
    pitch: 'What you really watch, and the nights you couldn’t stop.',
    shows: [
      'Videos watched and estimated watch time',
      'Top channels, all-time or per year',
      'Activity by month',
      'Viewing patterns by hour and weekday',
      'Your longest sittings',
    ],
    request: 'Google Takeout: YouTube history, in JSON format',
    wait: 'Minutes to a few hours',
    file: 'takeout-2026….zip',
    steps: [
      {
        text: 'Go to Google Takeout and sign in.',
        link: { href: 'https://takeout.google.com/', label: 'takeout.google.com' },
      },
      { text: 'Press “Deselect all”, then tick “YouTube and YouTube Music”.' },
      { text: 'Press “All YouTube data included” and leave only “history” ticked.' },
      {
        text: 'Press “Multiple formats” and set History to JSON. The default is HTML, which Unpacked can’t read.',
      },
      { text: 'Press “Next step”, keep “Export once” and “.zip”, then “Create export”.' },
      { text: 'Download the ZIP from Google’s email and drop it into Unpacked.' },
    ],
    notes: [
      'YouTube’s export doesn’t include how long you watched. Unpacked estimates it from the time between videos (see the YouTube dashboard for how).',
      'If you paused watch history, those periods are missing from the export.',
      'Takeouts in other languages may use a different file name; if yours isn’t recognized, please open an issue.',
    ],
  },
]

export const platformMeta = (id: PlatformId) => PLATFORMS.find((p) => p.id === id)!
