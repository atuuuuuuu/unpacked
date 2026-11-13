import { useState } from 'react'
import { formatHour, WEEKDAYS } from '@/lib/format'
import { ChartFrame } from './ChartFrame'

/** Weekday × hour grid. Cell color mixes the accent into the surface by share of the maximum. */
export function Heatmap({
  grid,
  format,
  summary,
}: {
  grid: number[][]
  format: (v: number) => string
  summary: string
}) {
  const [active, setActive] = useState<{ d: number; h: number } | null>(null)
  const max = Math.max(1, ...grid.flat())
  const rows = grid.flatMap((row, d) =>
    row.map((v, h) => ({ label: `${WEEKDAYS[d]} ${formatHour(h)}`, value: format(v) })),
  )
  const cell = active ? grid[active.d]![active.h]! : 0
  return (
    <ChartFrame summary={summary} columns={['Time', 'Amount']} rows={rows}>
      <div className="flex flex-col gap-2" onPointerLeave={() => setActive(null)}>
        <div className="grid grid-cols-[30px_1fr] items-center gap-x-2 gap-y-[3px]">
          {grid.map((row, d) => (
            <div key={WEEKDAYS[d]} className="contents">
              <span className="font-mono text-[10.5px] text-muted">{WEEKDAYS[d]}</span>
              <div className="grid grid-cols-24 gap-[2px] sm:gap-[3px]">
                {row.map((v, h) => {
                  const share = v / max
                  return (
                    <div
                      key={formatHour(h)}
                      onPointerEnter={() => setActive({ d, h })}
                      className="aspect-square rounded-[3px] transition-transform duration-100 hover:scale-125"
                      style={{
                        background:
                          v === 0
                            ? 'var(--sunk)'
                            : `color-mix(in oklab, var(--accent) ${Math.round(12 + share * 88)}%, var(--sunk))`,
                        outline:
                          active?.d === d && active.h === h ? '2px solid var(--fg)' : undefined,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
          <span />
          <div className="grid grid-cols-4 font-mono text-[10.5px] text-muted">
            {[0, 6, 12, 18].map((h) => (
              <span key={h}>{formatHour(h)}</span>
            ))}
          </div>
        </div>
        <p className="tabular min-h-[1.5em] text-[12.5px] text-muted">
          {active ? (
            <>
              <span className="font-medium text-fg">
                {WEEKDAYS[active.d]} {formatHour(active.h)}
              </span>{' '}
              · {format(cell)}
            </>
          ) : (
            'Hover or touch a square for details. Times are in your device’s time zone.'
          )}
        </p>
      </div>
    </ChartFrame>
  )
}
