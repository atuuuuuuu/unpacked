import { Popover } from 'radix-ui'
import { useNetwork } from '@/app/network'
import { Link } from '@/app/router'
import { ArrowRightIcon, ShieldIcon } from '@/components/icons'
import { cn } from '@/lib/cn'

/** Always-visible privacy indicator with live numbers from the browser's own network log. */
export function PrivacyBadge({ compact = false }: { compact?: boolean }) {
  const net = useNetwork()
  const clean = net.external.length === 0
  return (
    <Popover.Root>
      <Popover.Trigger
        data-testid="privacy-badge"
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-[11px] font-medium transition-colors',
          clean ? 'bg-accent-soft text-accent-ink hover:brightness-95' : 'bg-warm-soft text-warm',
        )}
      >
        <span className={cn('size-1.5 rounded-full', clean ? 'bg-accent' : 'bg-warm')} />
        {compact ? 'On device' : `On device · ${net.external.length} sent`}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(340px,calc(100vw-24px))] rounded-xl border border-line bg-raised p-4 shadow-pop animate-fade-up"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent">
              <ShieldIcon size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold">Your data stays on this device</p>
              <p className="text-[12.5px] text-muted">Live numbers from your browser</p>
            </div>
          </div>
          <dl className="mt-3 divide-y divide-line text-[13px]">
            <Row
              label="Requests to other websites"
              value={String(net.external.length)}
              good={clean}
              testId="external-count"
            />
            <Row label="Blocked by the security policy" value={String(net.blocked.length)} good />
            <Row label="Uploads" value="None possible" good />
            <Row
              label="Works offline"
              value={net.offlineReady ? 'Yes' : 'After first visit'}
              good={net.offlineReady}
            />
          </dl>
          {!clean && (
            <p className="mt-2 rounded-md bg-warm-soft p-2 text-[12px] text-warm">
              Contacted: {[...new Set(net.external)].join(', ')}. This shouldn’t happen; please
              report it.
            </p>
          )}
          <Popover.Close asChild>
            <Link
              to="/privacy"
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
            >
              How to check this yourself <ArrowRightIcon size={14} />
            </Link>
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function Row({
  label,
  value,
  good,
  testId,
}: {
  label: string
  value: string
  good: boolean
  testId?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd
        data-testid={testId}
        className={cn('tabular font-medium', good ? 'text-fg' : 'text-warm')}
      >
        {value}
      </dd>
    </div>
  )
}
