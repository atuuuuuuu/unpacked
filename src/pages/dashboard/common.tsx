import { type ReactNode, useRef } from 'react'
import { setView } from '@/app/data'
import { importFiles, loadSample, useImport } from '@/app/importer'
import { Link } from '@/app/router'
import { BookIcon, UploadIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/controls'
import { Chip, EmptyState, Skeleton } from '@/components/ui/Panel'
import type { PlatformId } from '@/core/types'
import { ACCEPT } from '@/features/import/DropZone'
import { formatDate, formatNumber } from '@/lib/format'
import { platformMeta } from '@/platforms/ui'

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="gutter mx-auto flex max-w-[1200px] flex-col gap-4 py-6 sm:gap-5 lg:py-8">
      {children}
    </div>
  )
}

export function DashboardHeader({
  platform,
  meta,
  actions,
  sample,
  both,
  source,
  skipped,
}: {
  platform: PlatformId
  meta: ReactNode
  actions?: ReactNode
  sample: boolean
  both: boolean
  source: 'file' | 'sample'
  skipped?: number
}) {
  const p = platformMeta(platform)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <p.Icon size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold sm:text-[28px]">{p.name}</h1>
            <p className="truncate text-[13px] text-muted">{meta}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {both && (
            <Segmented
              label="Data source"
              value={source}
              onChange={(v) => setView(platform, v)}
              options={[
                { value: 'file', label: 'My data' },
                { value: 'sample', label: 'Sample' },
              ]}
            />
          )}
          {actions}
        </div>
      </div>
      {sample && (
        <div
          data-testid="sample-banner"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warm/30 bg-warm-soft/60 px-4 py-2.5 text-[13px]"
        >
          <span>
            <span className="font-semibold text-warm">Sample data.</span>{' '}
            <span className="text-muted">Every name and number here is made up.</span>
          </span>
          <Link to={`/guides/${platform}`} className="font-medium text-accent-ink hover:underline">
            Get your own export →
          </Link>
        </div>
      )}
      {!!skipped && (
        <p className="text-[12.5px] text-muted">
          {formatNumber(skipped)} {skipped === 1 ? 'entry' : 'entries'} in this export didn’t match
          the expected format and were left out.
        </p>
      )}
    </div>
  )
}

export function EmptyDashboard({ platform }: { platform: PlatformId }) {
  const p = platformMeta(platform)
  const input = useRef<HTMLInputElement>(null)
  const state = useImport()
  const busy = state.status === 'working'
  return (
    <Page>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <p.Icon size={20} />
        </span>
        <h1 className="text-2xl font-semibold sm:text-[28px]">{p.name}</h1>
      </div>
      <EmptyState
        icon={<p.Icon size={20} />}
        title={`No ${p.name} export yet`}
        actions={
          <>
            <input
              ref={input}
              type="file"
              multiple
              accept={ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const files = [...(e.target.files ?? [])]
                e.target.value = ''
                void importFiles(files)
              }}
            />
            <Button variant="primary" onClick={() => input.current?.click()} disabled={busy}>
              <UploadIcon size={16} /> Open your export
            </Button>
            <Button
              onClick={() => loadSample(platform)}
              disabled={busy}
              data-testid={`sample-${platform}`}
            >
              Try sample data
            </Button>
          </>
        }
      >
        <p>{p.pitch}</p>
        <p className="mt-2">
          You’ll need: <span className="font-medium text-fg">{p.request}</span> · {p.wait}.{' '}
          <Link
            to={`/guides/${platform}`}
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          >
            <BookIcon size={14} /> How to get it
          </Link>
        </p>
      </EmptyState>
    </Page>
  )
}

export function DashboardSkeleton() {
  return (
    <Page>
      <Skeleton className="h-12 w-60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </Page>
  )
}

export const rangeText = (first: number, last: number) =>
  `${formatDate(first)} – ${formatDate(last)}`

export function Footnote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-sunk/60 px-4 py-3 text-[12.5px] leading-relaxed text-muted">
      {children}
    </div>
  )
}

export { Chip }
