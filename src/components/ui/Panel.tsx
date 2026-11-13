import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** A titled section of a dashboard. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  id,
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      aria-label={typeof title === 'string' ? title : undefined}
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5',
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'accent' | 'warm'
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-surface p-4 shadow-card">
      <span className="eyebrow">{label}</span>
      <span
        className={cn(
          'tabular truncate font-display text-[26px] font-semibold leading-tight tracking-tight sm:text-[28px]',
          tone === 'accent' && 'text-accent',
          tone === 'warm' && 'text-warm',
        )}
      >
        {value}
      </span>
      {hint && <span className="text-[12.5px] leading-snug text-muted">{hint}</span>}
    </div>
  )
}

export function Chip({
  children,
  tone = 'accent',
  wrap = false,
  className,
}: {
  children: ReactNode
  tone?: 'accent' | 'warm' | 'muted'
  /** Let long text wrap onto several lines instead of staying on one. */
  wrap?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium',
        wrap ? 'whitespace-normal' : 'whitespace-nowrap',
        tone === 'accent' && 'bg-accent-soft text-accent-ink',
        tone === 'warm' && 'bg-warm-soft text-warm',
        tone === 'muted' && 'bg-sunk text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden="true" />
}

export function EmptyState({
  icon,
  title,
  children,
  actions,
  className,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-10 text-center',
        className,
      )}
    >
      {icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-sunk text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
      {actions && <div className="mt-1 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}
