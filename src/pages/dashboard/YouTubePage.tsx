import { useMemo, useState } from 'react'
import { pickView, useDatasets, useView } from '@/app/data'
import { AreaChart } from '@/components/charts/AreaChart'
import { BarChart } from '@/components/charts/BarChart'
import { Heatmap } from '@/components/charts/Heatmap'
import { RankList } from '@/components/charts/RankList'
import { Button } from '@/components/ui/Button'
import { Segmented, Select } from '@/components/ui/controls'
import { Chip, Panel, Stat } from '@/components/ui/Panel'
import { yearOf } from '@/core/time'
import type { CardSpec } from '@/features/share/card'
import { ShareButton } from '@/features/share/ShareDialog'
import {
  formatDate,
  formatDuration,
  formatHour,
  formatMonthKey,
  formatNumber,
  formatTime,
  formatWeekday,
  hours,
  plural,
} from '@/lib/format'
import type { YouTubeSummary } from '@/platforms/youtube/types'
import { DashboardHeader, EmptyDashboard, Footnote, Page, rangeText } from './common'

export default function YouTubePage() {
  const datasets = useDatasets()
  const view = useView()
  const { shown, source, both } = pickView(datasets, 'youtube', view)
  const d = shown[shown.length - 1]
  if (!d) return <EmptyDashboard platform="youtube" />
  return (
    <YouTubeDashboard
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

function YouTubeDashboard({
  s,
  label,
  sample,
  both,
  source,
  skipped,
}: {
  s: YouTubeSummary
  label: string
  sample: boolean
  both: boolean
  source: 'file' | 'sample'
  skipped: number
}) {
  const [scope, setScope] = useState('all')
  const [metric, setMetric] = useState<'videos' | 'time'>('videos')
  const [expanded, setExpanded] = useState(false)
  const scopes = [
    { value: 'all', label: 'All time' },
    ...[...s.years].reverse().map((y) => ({ value: String(y.year), label: String(y.year) })),
  ]
  const channels = s.top[scope] ?? s.top.all!
  const peakHour = s.hours.indexOf(Math.max(...s.hours))
  const linkable = !sample

  const card = useMemo<CardSpec>(() => {
    const top = s.top.all!.slice(0, 5)
    const max = top[0]?.videos ?? 1
    return {
      platform: 'YouTube',
      eyebrow: `What I watched · ${yearOf(s.first)}–${yearOf(s.last)}`,
      big: formatNumber(s.totals.videos),
      bigLabel: 'videos watched',
      stats: [
        { label: 'Est. hours', value: `~${formatNumber(hours(s.totals.estMs))}` },
        { label: 'Channels', value: formatNumber(s.totals.channels) },
        { label: 'Binges', value: formatNumber(s.totals.binges) },
      ],
      list: {
        title: 'Top channels',
        items: top.map((c) => ({
          name: c.name,
          value: formatNumber(c.videos),
          share: c.videos / max,
        })),
      },
      sample,
    }
  }, [s, sample])

  return (
    <Page>
      <DashboardHeader
        platform="youtube"
        meta={`${rangeText(s.first, s.last)} · ${label}`}
        sample={sample}
        both={both}
        source={source}
        skipped={skipped}
        actions={<ShareButton spec={card} fileName="unpacked-youtube.png" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Videos watched"
          value={formatNumber(s.totals.videos)}
          hint={plural(s.totals.uniqueVideos, 'different video')}
          tone="accent"
        />
        <Stat
          label="Watch time (est.)"
          value={`~${formatNumber(hours(s.totals.estMs))} h`}
          hint="Estimated from the gaps between videos"
        />
        <Stat
          label="Channels"
          value={formatNumber(s.totals.channels)}
          hint={`Top: ${s.top.all![0]?.name ?? '–'}`}
        />
        <Stat
          label="Binge sittings"
          value={formatNumber(s.totals.binges)}
          hint="Sittings of 2 hours or more"
          tone="warm"
        />
      </div>

      <Panel
        title="Activity by month"
        description={metric === 'videos' ? 'Videos watched per month' : 'Estimated hours per month'}
        actions={
          <Segmented
            label="Monthly metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'videos', label: 'Videos' },
              { value: 'time', label: 'Hours' },
            ]}
          />
        }
      >
        <AreaChart
          data={s.months.map((m) => ({
            key: m.key,
            label: formatMonthKey(m.key),
            value: metric === 'videos' ? m.videos : hours(m.estMs),
          }))}
          format={(v) => (metric === 'videos' ? formatNumber(v) : `${formatNumber(v)} h`)}
          summary={`${metric === 'videos' ? 'Videos' : 'Estimated hours'} per month from ${formatMonthKey(s.months[0]!.key)} to ${formatMonthKey(s.months[s.months.length - 1]!.key)}.`}
          columns={['Month', metric === 'videos' ? 'Videos' : 'Hours']}
          isTick={(p, i) => p.key.endsWith('-01') || i === 0}
          tickLabel={(p) => p.key.slice(0, 4)}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Top channels"
          description="By videos watched"
          actions={
            <Select
              label="Time range for top channels"
              value={scope}
              onChange={setScope}
              options={scopes}
              className="w-32"
            />
          }
        >
          <RankList
            label="Top channels"
            items={channels.slice(0, expanded ? 25 : 10).map((c) => ({
              key: c.name,
              name: c.name,
              value: c.videos,
              display: plural(c.videos, 'video'),
              extra: `~${formatDuration(c.estMs)}`,
              href: linkable ? c.url : undefined,
            }))}
          />
          {channels.length > 10 && (
            <Button
              variant="ghost"
              size="sm"
              className="self-center"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Show top 10' : `Show top ${Math.min(25, channels.length)}`}
            </Button>
          )}
        </Panel>
        <Panel title="Watched again and again" description="Videos you watched three times or more">
          {s.rewatched.length ? (
            <RankList
              label="Rewatched videos"
              items={s.rewatched.slice(0, 10).map((v) => ({
                key: v.url,
                name: v.title,
                sub: v.channel,
                value: v.count,
                display: `${v.count}×`,
                href: linkable ? v.url : undefined,
              }))}
            />
          ) : (
            <p className="text-sm text-muted">No video was watched three times or more.</p>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Time of day"
          description={`Videos started each hour; busiest at ${formatHour(peakHour)}`}
        >
          <BarChart
            data={s.hours.map((n, hr) => ({
              key: String(hr),
              label: String(hr).padStart(2, '0'),
              value: n,
            }))}
            format={(v) => formatNumber(v)}
            summary={`Videos by hour of day; most at ${formatHour(peakHour)}.`}
            columns={['Hour', 'Videos']}
            tick={(_, i) => i % 6 === 0}
            tooltipLabel={(b) => `${b.label}:00 – ${b.label}:59`}
          />
        </Panel>
        <Panel title="Your week" description="Videos by weekday and hour">
          <Heatmap
            grid={s.weekHours}
            format={(n) => plural(n, 'video')}
            summary="Videos watched by weekday and hour."
          />
        </Panel>
      </div>

      <Panel
        title="Longest sittings"
        description="Back-to-back videos with less than 30 minutes between them"
      >
        <ol className="flex flex-col" aria-label="Longest sittings">
          {s.sittings.map((t, i) => (
            <li
              key={t.start}
              className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line py-3 last:border-b-0"
            >
              <span className="tabular font-mono text-[12px] text-faint">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {formatWeekday(t.start)} {formatDate(t.start)}
                  <span className="text-muted">
                    {' '}
                    · {formatTime(t.start)}–{formatTime(t.end)}
                  </span>
                </p>
                <p className="truncate text-[12.5px] text-muted">
                  {plural(t.videos, 'video')}
                  {t.topChannel ? ` · mostly ${t.topChannel}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {t.estMs >= 2 * 3_600_000 && <Chip tone="warm">Binge</Chip>}
                <span className="tabular text-[13px] font-medium">
                  ~{formatDuration(t.estMs, 'long')}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Ads in history"
          value={formatNumber(s.totals.ads)}
          hint="Listed by YouTube, left out of every number above"
        />
        <Stat
          label="YouTube Music"
          value={formatNumber(s.totals.music)}
          hint="Plays in YouTube Music, also left out"
        />
        <Stat
          label="Removed videos"
          value={formatNumber(s.totals.removed)}
          hint="Videos deleted or made private since; counted, but with no title"
        />
      </div>

      <Footnote>
        <strong className="font-semibold text-fg">How watch time is estimated.</strong> Google’s
        export lists when you started each video, not how long you watched. Unpacked counts the time
        until your next video, up to 30 minutes. A longer gap ends the sitting, and the last video
        of a sitting counts as your typical gap ({formatDuration(s.typicalVideoMs, 'long')}). Treat
        the hours as a rough guide. Times are in your device’s time zone.
      </Footnote>
    </Page>
  )
}
