import { useMemo, useState } from 'react'
import { pickView, useDatasets, useView } from '@/app/data'
import { AreaChart } from '@/components/charts/AreaChart'
import { BarChart } from '@/components/charts/BarChart'
import { Heatmap } from '@/components/charts/Heatmap'
import { RankList } from '@/components/charts/RankList'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/controls'
import { EmptyState, Panel, Stat } from '@/components/ui/Panel'
import { yearOf } from '@/core/time'
import type { CardSpec } from '@/features/share/card'
import { ShareButton } from '@/features/share/ShareDialog'
import {
  formatDate,
  formatDayKey,
  formatDuration,
  formatHour,
  formatMonthKey,
  formatNumber,
  formatPercent,
  hours,
  plural,
} from '@/lib/format'
import type { SpotifySummary } from '@/platforms/spotify/types'
import { DashboardHeader, EmptyDashboard, Footnote, Page, rangeText } from './common'

const h = (ms: number) => `${formatNumber(hours(ms))} h`

export default function SpotifyPage() {
  const datasets = useDatasets()
  const view = useView()
  const { shown, source, both } = pickView(datasets, 'spotify', view)
  const d = shown[shown.length - 1]
  if (!d) return <EmptyDashboard platform="spotify" />
  return (
    <SpotifyDashboard
      key={d.id}
      s={d.summary}
      label={d.label}
      sample={d.source === 'sample'}
      both={both}
      source={source}
      skipped={d.skipped}
    />
  )
}

function SpotifyDashboard({
  s,
  label,
  sample,
  both,
  source,
  skipped,
}: {
  s: SpotifySummary
  label: string
  sample: boolean
  both: boolean
  source: 'file' | 'sample'
  skipped: number
}) {
  const [scope, setScope] = useState('all')
  const [expanded, setExpanded] = useState(false)
  const lastYear = yearOf(s.last)
  const scopes = [
    { value: 'all', label: 'All time' },
    ...[...s.years].reverse().map((y) => ({ value: String(y.year), label: String(y.year) })),
  ]
  const top = s.top[scope] ?? s.top.all!
  const limit = expanded ? 50 : 10

  const card = useMemo<CardSpec>(() => {
    const artists = s.top.all!.artists.slice(0, 5)
    const max = artists[0]?.ms ?? 1
    return {
      platform: 'Spotify',
      eyebrow: `All-time listening · ${yearOf(s.first)}–${yearOf(s.last)}`,
      big: formatNumber(hours(s.totals.ms)),
      bigLabel: 'hours of music',
      stats: [
        { label: 'Plays', value: formatNumber(s.totals.plays) },
        { label: 'Artists', value: formatNumber(s.totals.artists) },
        { label: 'Top hour', value: formatHour(s.hours.indexOf(Math.max(...s.hours))) },
      ],
      list: {
        title: 'Top artists',
        items: artists.map((a) => ({ name: a.name, value: h(a.ms), share: a.ms / max })),
      },
      sample,
    }
  }, [s, sample])

  const peakHour = s.hours.indexOf(Math.max(...s.hours))

  return (
    <Page>
      <DashboardHeader
        platform="spotify"
        meta={`${rangeText(s.first, s.last)} · ${label}`}
        sample={sample}
        both={both}
        source={source}
        skipped={skipped}
        actions={<ShareButton spec={card} fileName="unpacked-spotify.png" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Listening time"
          value={h(s.totals.ms)}
          hint={`About ${formatNumber(s.totals.ms / 86_400_000)} days of music`}
          tone="accent"
        />
        <Stat
          label="Plays"
          value={formatNumber(s.totals.plays)}
          hint="Tracks played for 30 s or more"
        />
        <Stat
          label="Artists"
          value={formatNumber(s.totals.artists)}
          hint={plural(s.totals.tracks, 'different track')}
        />
        <Stat
          label="Days listened"
          value={formatNumber(s.totals.activeDays)}
          hint={`Longest streak: ${plural(s.highlights.longestStreak.days, 'day')}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Hours per year"
          description={`Your biggest year is highlighted${yearOf(s.last) === new Date().getFullYear() ? '; this year is still in progress' : ''}.`}
          className="lg:col-span-2"
        >
          <BarChart
            data={s.years.map((y, i) => ({
              key: String(y.year),
              label: String(y.year),
              value: hours(y.ms),
              partial: i === s.years.length - 1 && lastYear === new Date().getFullYear(),
            }))}
            format={(v) => `${formatNumber(v)} h`}
            summary={`Listening hours per year from ${s.years[0]?.year} to ${lastYear}.`}
            columns={['Year', 'Hours']}
            height={250}
          />
        </Panel>
        <Panel title="Highlights">
          <dl className="flex flex-col divide-y divide-line text-sm">
            <Highlight
              label="Busiest day"
              value={formatDayKey(s.highlights.busiestDay.day)}
              sub={formatDuration(s.highlights.busiestDay.ms, 'long')}
            />
            <Highlight
              label="Longest streak"
              value={plural(s.highlights.longestStreak.days, 'day')}
              sub={`${formatDayKey(s.highlights.longestStreak.from)} – ${formatDayKey(s.highlights.longestStreak.to)}`}
            />
            <Highlight
              label="Favourite hour"
              value={formatHour(peakHour)}
              sub={`${h(s.hours[peakHour]!)} in total`}
            />
            <Highlight
              label="First play in this export"
              value={s.highlights.firstPlay.track}
              sub={`${s.highlights.firstPlay.artist} · ${formatDate(s.highlights.firstPlay.ts)}`}
            />
          </dl>
        </Panel>
      </div>

      <Panel title="Listening history" description="Hours of music per month">
        <AreaChart
          data={s.months.map((m) => ({
            key: m.key,
            label: formatMonthKey(m.key),
            value: hours(m.ms),
          }))}
          format={(v) => `${formatNumber(v)} h`}
          summary={`Monthly listening hours from ${formatMonthKey(s.months[0]!.key)} to ${formatMonthKey(s.months[s.months.length - 1]!.key)}.`}
          columns={['Month', 'Hours']}
          isTick={(p, i) => p.key.endsWith('-01') || i === 0}
          tickLabel={(p) => p.key.slice(0, 4)}
        />
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="text-lg font-semibold">Top artists and tracks</h2>
        <Select
          label="Time range for top lists"
          value={scope}
          onChange={setScope}
          options={scopes}
          className="w-36"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Top artists"
          description={
            scope === 'all' ? 'All time, by listening time' : `${scope}, by listening time`
          }
        >
          <RankList
            label="Top artists"
            items={top.artists.slice(0, limit).map((a) => ({
              key: a.name,
              name: a.name,
              value: a.ms,
              display: h(a.ms),
              extra: plural(a.plays, 'play'),
            }))}
          />
        </Panel>
        <Panel
          title="Top tracks"
          description={
            scope === 'all' ? 'All time, by listening time' : `${scope}, by listening time`
          }
        >
          <RankList
            label="Top tracks"
            items={top.tracks.slice(0, limit).map((t) => ({
              key: `${t.name}-${t.sub}`,
              name: t.name,
              sub: t.sub,
              value: t.ms,
              display: h(t.ms),
              extra: plural(t.plays, 'play'),
            }))}
          />
        </Panel>
      </div>
      {top.artists.length > 10 && (
        <Button variant="ghost" className="self-center" onClick={() => setExpanded((v) => !v)}>
          {expanded
            ? 'Show top 10'
            : `Show top ${Math.min(50, Math.max(top.artists.length, top.tracks.length))}`}
        </Button>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Time of day" description="Hours of music by the hour you started listening">
          <BarChart
            data={s.hours.map((ms, hr) => ({
              key: String(hr),
              label: String(hr).padStart(2, '0'),
              value: hours(ms),
            }))}
            format={(v) => `${formatNumber(v)} h`}
            summary={`Listening by hour of day; most at ${formatHour(peakHour)}.`}
            columns={['Hour', 'Hours']}
            tick={(_, i) => i % 6 === 0}
            tooltipLabel={(b) => `${b.label}:00 – ${b.label}:59`}
          />
        </Panel>
        <Panel title="Your week" description="When you listen, by weekday and hour">
          <Heatmap
            grid={s.weekHours}
            format={(ms) => formatDuration(ms, 'long')}
            summary="Listening time by weekday and hour."
          />
        </Panel>
      </div>

      <Panel
        title="Skips"
        description="Tracks Spotify marked as skipped, or that you left with the next button"
      >
        {s.skips ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="tabular font-display text-4xl font-semibold text-warm">
                  {formatPercent(s.skips.rate)}
                </p>
                <p className="text-sm text-muted">
                  of {formatNumber(s.totals.records)} track starts were skipped
                </p>
              </div>
              <BarChart
                data={s.skips.byYear.map((y) => ({
                  key: String(y.year),
                  label: String(y.year).slice(2),
                  value: y.rate * 100,
                }))}
                format={(v) => `${Math.round(v)}%`}
                summary="Share of tracks skipped per year."
                columns={['Year', 'Skipped']}
                height={150}
                highlightMax={false}
                tooltipLabel={(b) => `20${b.label}`}
              />
            </div>
            <div>
              <p className="eyebrow mb-1">Most skipped</p>
              {s.skips.tracks.length ? (
                <RankList
                  label="Most skipped tracks"
                  items={s.skips.tracks.slice(0, 8).map((t) => ({
                    key: `${t.name}-${t.artist}`,
                    name: t.name,
                    sub: t.artist,
                    value: t.skips,
                    display: plural(t.skips, 'skip'),
                    extra: `of ${formatNumber(t.records)}`,
                  }))}
                />
              ) : (
                <p className="text-sm text-muted">
                  No track was skipped often enough to stand out.
                </p>
              )}
            </div>
          </div>
        ) : (
          <EmptyState title="No skip data in this export" className="py-6">
            Spotify only records skips in the Extended streaming history. Request that export to see
            what you skip.
          </EmptyState>
        )}
      </Panel>

      {s.podcasts && (
        <Panel
          title="Podcasts"
          description={`${h(s.podcasts.ms)} across ${plural(s.podcasts.episodes, 'episode')}`}
        >
          <RankList
            label="Top podcasts"
            items={s.podcasts.shows.map((p) => ({
              key: p.name,
              name: p.name,
              value: p.ms,
              display: formatDuration(p.ms, 'long'),
            }))}
          />
        </Panel>
      )}

      <Footnote>
        <strong className="font-semibold text-fg">How we count.</strong> Listening time adds up
        every second Spotify logged for music; podcasts are counted separately. A play is a track
        you listened to for at least 30 seconds, the same rule Spotify uses for streams. Times are
        in your device’s time zone.{' '}
        {s.format === 'account' &&
          'This is the Account data export, which only covers about the last year. Request the Extended streaming history for everything.'}
      </Footnote>
    </Page>
  )
}

function Highlight({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
      <dd className="truncate text-[12.5px] text-muted">{sub}</dd>
    </div>
  )
}
