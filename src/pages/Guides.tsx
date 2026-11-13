import { loadSample, useImport } from '@/app/importer'
import { Link } from '@/app/router'
import { ArrowRightIcon, ExternalIcon, UploadIcon } from '@/components/icons'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Panel'
import type { PlatformId } from '@/core/types'
import { SiteFooter, SiteHeader } from '@/layout/SiteHeader'
import { PLATFORMS, platformMeta } from '@/platforms/ui'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main"
        className="gutter mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 py-10 sm:py-14"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

export function GuidesIndex() {
  return (
    <Shell>
      <div className="flex flex-col gap-3">
        <p className="eyebrow">Export guides</p>
        <h1 className="text-[32px] font-semibold sm:text-[40px]">Get your data</h1>
        <p className="text-[16px] text-muted">
          Every platform lets you download what it stores about you. These guides show exactly what
          to request so Unpacked can read it.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {PLATFORMS.map((p) => (
          <li key={p.id}>
            <Link
              to={`/guides/${p.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <p.Icon size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{p.name}</span>
                <span className="block text-sm text-muted">
                  {p.request} · {p.wait.toLowerCase()}
                </span>
              </span>
              <ArrowRightIcon className="text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  )
}

export function GuidePage({ id }: { id: PlatformId }) {
  const p = platformMeta(id)
  const importing = useImport().status === 'working'
  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Link to="/guides" className="text-sm text-muted hover:text-fg">
          ← All guides
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <p.Icon size={21} />
          </span>
          <h1 className="text-[30px] font-semibold sm:text-[36px]">Get your {p.name} data</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip wrap>Request: {p.request}</Chip>
          <Chip tone="muted" wrap>
            Arrives in: {p.wait.toLowerCase()}
          </Chip>
        </div>
      </div>

      <ol className="flex flex-col gap-0">
        {p.steps.map((s, i) => (
          <li key={s.text} className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-4">
            <div className="flex flex-col items-center">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-[13px] font-medium">
                {i + 1}
              </span>
              {i < p.steps.length - 1 && <span className="w-px flex-1 bg-line" />}
            </div>
            <div className="pb-6 pt-1">
              <p className="text-[15px] leading-relaxed">{s.text}</p>
              {s.link && (
                <a
                  href={s.link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  {s.link.label} <ExternalIcon size={13} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 rounded-xl bg-sunk/70 p-4 text-sm text-muted">
        <p className="font-medium text-fg">Good to know</p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {p.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <p className="font-semibold">What you’ll see</p>
        <ul className="grid grid-cols-1 gap-1.5 text-sm text-muted sm:grid-cols-2">
          {p.shows.map((s) => (
            <li key={s} className="flex gap-2">
              <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
              {s}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <ButtonLink to="/app" variant="primary">
            <UploadIcon size={16} /> I have my export
          </ButtonLink>
          <Button onClick={() => loadSample(id)} disabled={importing}>
            Try the sample first
          </Button>
        </div>
      </div>
    </Shell>
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>
}
