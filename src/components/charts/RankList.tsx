import type { ReactNode } from 'react'
import { ExternalIcon } from '@/components/icons'
import { cn } from '@/lib/cn'

export interface RankItem {
  key: string
  name: string
  sub?: string | null
  value: number
  display: ReactNode
  /** Secondary figure, e.g. play count. */
  extra?: ReactNode
  href?: string
}

export function RankList({
  items,
  label,
  className,
}: {
  items: RankItem[]
  label: string
  className?: string
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ol aria-label={label} className={cn('flex flex-col', className)}>
      {items.map((item, i) => (
        <li
          key={item.key}
          className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line py-2.5 last:border-b-0"
        >
          <span className="tabular font-mono text-[12px] text-faint">{i + 1}</span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-baseline gap-2">
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex min-w-0 items-center gap-1 truncate text-sm font-medium hover:text-accent"
                >
                  <span className="truncate">{item.name}</span>
                  <ExternalIcon
                    size={12}
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
                  />
                </a>
              ) : (
                <span className="truncate text-sm font-medium">{item.name}</span>
              )}
            </div>
            {item.sub && <div className="truncate text-[12.5px] text-muted">{item.sub}</div>}
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunk">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="tabular text-[13px] font-medium">{item.display}</div>
            {item.extra && <div className="tabular text-[11.5px] text-muted">{item.extra}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
