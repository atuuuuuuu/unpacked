import { useEffect, useState } from 'react'
import { loadSample, previewSample, useImport } from '@/app/importer'
import { useNetwork } from '@/app/network'
import { Link } from '@/app/router'
import { BarChart } from '@/components/charts/BarChart'
import { RankList } from '@/components/charts/RankList'
import {
  ArrowRightIcon,
  BookIcon,
  CodeIcon,
  GitHubIcon,
  ShieldIcon,
  UploadIcon,
  WifiOffIcon,
} from '@/components/icons'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Chip, Skeleton } from '@/components/ui/Panel'
import type { DatasetOf } from '@/core/types'
import { SiteFooter, SiteHeader } from '@/layout/SiteHeader'
import { REPO_URL } from '@/lib/external'
import { formatNumber, hours } from '@/lib/format'
import { PLATFORMS } from '@/platforms/ui'

export default function Landing() {
  const importing = useImport().status === 'working'
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="gutter mx-auto grid max-w-6xl items-center gap-12 pt-12 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:pt-20 lg:pb-24">
          <div className="flex flex-col items-start gap-6 animate-fade-up">
            <Chip>
              <span className="size-1.5 rounded-full bg-accent" /> Open source · runs on your device
            </Chip>
            <h1 className="text-[40px] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-[56px] lg:text-[64px]">
              Your data, unpacked.
              <br />
              <span className="text-accent">Privately.</span>
            </h1>
            <p className="max-w-[34rem] text-[17px] leading-relaxed text-muted">
              Drop the ZIP that Spotify, Instagram or YouTube gives you. Unpacked turns it into
              clear charts and lists right in your browser. No account, no upload, no tracking.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                onClick={() => loadSample('spotify')}
                disabled={importing}
                data-testid="hero-sample"
              >
                Try sample data <ArrowRightIcon size={17} />
              </Button>
              <ButtonLink to="/app" size="lg">
                <UploadIcon size={17} /> Open your export
              </ButtonLink>
            </div>
            <p className="font-mono text-[12px] text-faint">
              0 servers · 0 trackers · 0 accounts · works offline
            </p>
          </div>
          <HeroPreview />
        </section>

        {/* Platforms */}
        <section id="platforms" className="scroll-mt-20 border-t border-line bg-surface/60">
          <div className="gutter mx-auto flex max-w-6xl flex-col gap-10 py-16 sm:py-20">
            <SectionTitle
              eyebrow="Supported exports"
              title="Three platforms today, more from the community"
            >
              Each platform has its own reader and dashboard. Try any of them with fictional sample
              data first.
            </SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PLATFORMS.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <p.Icon size={20} />
                    </span>
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                  </div>
                  <p className="text-[15px] font-medium leading-snug">{p.pitch}</p>
                  <ul className="flex flex-1 flex-col gap-1.5 text-sm text-muted">
                    {p.shows.slice(0, 4).map((s) => (
                      <li key={s} className="flex gap-2">
                        <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <p className="rounded-lg bg-sunk px-3 py-2 text-[12.5px] text-muted">
                    You’ll request: <span className="font-medium text-fg">{p.request}</span>
                    <br />
                    Arrives in: {p.wait.toLowerCase()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => loadSample(p.id)}
                      disabled={importing}
                    >
                      Explore sample
                    </Button>
                    <ButtonLink to={`/guides/${p.id}`} size="sm" variant="ghost">
                      <BookIcon size={15} /> Export guide
                    </ButtonLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="gutter mx-auto flex max-w-6xl flex-col gap-10 py-16 sm:py-20">
          <SectionTitle eyebrow="How it works" title="From ZIP file to insight in three steps" />
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: 'Request your export',
                text: 'Every platform lets you download your data. Our guides show exactly which boxes to tick.',
                tech: 'Spotify, Instagram, Google Takeout',
              },
              {
                title: 'Drop the ZIP here',
                text: 'Unpacked finds the right files inside and reads only those, even from multi-gigabyte exports.',
                tech: 'Unzipped in a Web Worker, on your device',
              },
              {
                title: 'Explore and share',
                text: 'Charts, rankings and lists you can search. Make a share card if you want to show it off.',
                tech: 'Images drawn locally on a canvas',
              },
            ].map((s, i) => (
              <li key={s.title} className="flex flex-col gap-3 rounded-2xl border border-line p-5">
                <span className="flex size-8 items-center justify-center rounded-full border border-line-strong font-mono text-[13px] font-medium">
                  {i + 1}
                </span>
                <h3 className="text-[17px] font-semibold">{s.title}</h3>
                <p className="flex-1 text-sm text-muted">{s.text}</p>
                <p className="font-mono text-[11.5px] text-accent">{s.tech}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Privacy */}
        <section id="privacy" className="border-y border-line bg-[var(--fg)] text-[var(--bg)]">
          <div className="gutter mx-auto grid max-w-6xl gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col items-start gap-5">
              <p className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase opacity-60">
                Privacy
              </p>
              <h2 className="text-[32px] font-semibold sm:text-[40px]">
                Don’t take our word for it. Check.
              </h2>
              <p className="max-w-md text-[16px] leading-relaxed opacity-75">
                “We don’t look at your data” is a promise. Unpacked is built so it can’t: there is
                no server to send to, and the browser itself blocks every other destination.
              </p>
              <Link
                to="/privacy"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg)] px-4 py-2.5 text-sm font-medium text-[var(--fg)] hover:opacity-90"
              >
                How to verify it yourself <ArrowRightIcon size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  Icon: ShieldIcon,
                  title: 'Blocked by the browser',
                  text: 'A strict Content Security Policy only allows connections to this site. Anything else fails before it starts.',
                },
                {
                  Icon: CodeIcon,
                  title: 'No server, no database',
                  text: 'Unpacked is a set of static files. Your export is read in a worker on your device and only summaries are kept in memory.',
                },
                {
                  Icon: WifiOffIcon,
                  title: 'Works in airplane mode',
                  text: 'Install it or visit once, then turn off your network. Everything still works, because nothing needed the network.',
                },
                {
                  Icon: GitHubIcon,
                  title: 'Open source and tested',
                  text: 'An automated test fails the build if the app contacts any other site while reading an export.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-2 rounded-xl border border-[color-mix(in_oklab,var(--bg)_14%,transparent)] p-4"
                >
                  <f.Icon size={20} className="text-accent" />
                  <h3 className="text-[15px] font-semibold">{f.title}</h3>
                  <p className="text-[13.5px] leading-relaxed opacity-70">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="gutter mx-auto flex max-w-3xl flex-col gap-8 py-16 sm:py-20">
          <SectionTitle eyebrow="Questions" title="Good to know" />
          <div className="flex flex-col divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex list-none items-center justify-between gap-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    className="text-muted transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="gutter mx-auto mb-16 max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">See what your apps know about you.</h2>
              <p className="mt-1 text-muted">
                Start with sample data, then request your own export.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                onClick={() => loadSample('instagram')}
                disabled={importing}
              >
                Try the Instagram sample
              </Button>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line px-5 text-[15px] font-medium hover:bg-sunk"
              >
                <GitHubIcon /> Star on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

const FAQ = [
  {
    q: 'Why does my export take so long to arrive?',
    a: 'The platforms prepare exports on their side. Instagram and Google are usually quick; Spotify’s extended history can take up to 30 days. Request it now and come back later. The sample data shows you what you’ll get.',
  },
  {
    q: 'Is my data stored anywhere?',
    a: 'Only in this browser tab’s memory, and only as summaries; the raw files are never kept. Close the tab and it’s gone. If you turn on “Remember on this device” in the Library, summaries are saved in your browser’s own storage until you turn it off.',
  },
  {
    q: 'Which file formats work?',
    a: 'The ZIP files exactly as the platforms send them, or the JSON files inside. Instagram and YouTube must be exported as JSON, not HTML; the guides show where to choose that.',
  },
  {
    q: 'Can you add TikTok, Netflix or Discord?',
    a: 'Each platform is a small, self-contained reader. The contributing guide explains how to add one, and new platforms are tracked on GitHub.',
  },
  {
    q: 'Is Unpacked affiliated with Spotify, Instagram or YouTube?',
    a: 'No. It’s an independent open-source project that reads the exports these companies give you.',
  },
]

function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="text-[28px] font-semibold sm:text-[36px]">{title}</h2>
      {children && <p className="text-[16px] text-muted">{children}</p>}
    </div>
  )
}

/** A real slice of the dashboard, computed from the sample through the same parser as your data. */
function HeroPreview() {
  const net = useNetwork()
  const [data, setData] = useState<DatasetOf<'spotify'> | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    previewSample('spotify')
      .then((d) => alive && setData((d[0] as DatasetOf<'spotify'>) ?? null))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])
  const s = data?.summary
  return (
    <div
      className="relative min-w-0"
      aria-label="Preview of the Spotify dashboard with sample data"
      role="img"
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-sunk/60 px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
          </div>
          <Chip>
            <span className="size-1.5 rounded-full bg-accent" /> On device · {net.external.length}{' '}
            sent
          </Chip>
        </div>
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-lg font-semibold">Spotify</p>
            <p className="font-mono text-[11px] text-faint">sample data · fictional</p>
          </div>
          {s ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Hours" value={formatNumber(hours(s.totals.ms))} />
                <MiniStat label="Plays" value={formatNumber(s.totals.plays)} />
                <MiniStat label="Artists" value={formatNumber(s.totals.artists)} />
              </div>
              <BarChart
                data={s.years.map((y, i) => ({
                  key: String(y.year),
                  label: `’${String(y.year).slice(2)}`,
                  value: hours(y.ms),
                  partial: i === s.years.length - 1,
                }))}
                format={(v) => `${formatNumber(v)} h`}
                summary="Sample listening hours per year"
                columns={['Year', 'Hours']}
                height={150}
              />
              <RankList
                label="Sample top artists"
                items={s.top.all!.artists.slice(0, 3).map((a) => ({
                  key: a.name,
                  name: a.name,
                  value: a.ms,
                  display: `${formatNumber(hours(a.ms))} h`,
                }))}
              />
            </>
          ) : failed ? (
            <p className="py-16 text-center text-sm text-muted">
              Preview unavailable. Try the sample data instead.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
              <Skeleton className="h-[150px]" />
              <Skeleton className="h-36" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sunk px-3 py-2">
      <p className="tabular font-display text-lg font-semibold sm:text-xl">{value}</p>
      <p className="eyebrow !text-[10px]">{label}</p>
    </div>
  )
}
