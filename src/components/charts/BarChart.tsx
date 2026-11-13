import { scaleBand, scaleLinear } from 'd3-scale'
import { useState } from 'react'
import { ChartFrame, Tooltip } from './ChartFrame'
import { useWidth } from './useWidth'

export interface Bar {
  key: string
  label: string
  value: number
  /** Marks an incomplete period, drawn hatched. */
  partial?: boolean
}

export function BarChart({
  data,
  format,
  height = 180,
  summary,
  columns,
  tick = (_, i, n) => n <= 14 || i % Math.ceil(n / 12) === 0,
  tooltipLabel = (d) => d.label,
  highlightMax = true,
}: {
  data: Bar[]
  format: (v: number) => string
  height?: number
  summary: string
  columns: [string, string]
  tick?: (d: Bar, i: number, n: number) => boolean
  tooltipLabel?: (d: Bar) => string
  highlightMax?: boolean
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const pad = { top: 12, bottom: 22 }
  const max = Math.max(1, ...data.map((d) => d.value))
  const maxIdx = data.findIndex((d) => d.value === max)
  const x = scaleBand<string>()
    .domain(data.map((d) => d.key))
    .range([0, width])
    .paddingInner(data.length > 30 ? 0.18 : 0.28)
    .paddingOuter(0.05)
  const y = scaleLinear()
    .domain([0, max])
    .nice(3)
    .range([height - pad.bottom, pad.top])
  const ticks = y.ticks(3).filter((t) => t > 0)
  const a = active !== null ? data[active] : null

  return (
    <ChartFrame
      summary={summary}
      columns={columns}
      rows={data.map((d) => ({ label: d.label, value: format(d.value) }))}
    >
      <div
        ref={ref}
        className="relative w-full touch-pan-y"
        onPointerLeave={() => setActive(null)}
        onPointerMove={(e) => {
          const px = e.clientX - e.currentTarget.getBoundingClientRect().left
          const i = Math.round((px - (x(data[0]?.key ?? '') ?? 0) - x.bandwidth() / 2) / x.step())
          setActive(Math.max(0, Math.min(data.length - 1, i)))
        }}
      >
        <svg width={width} height={height} className="block overflow-visible">
          <title>{summary}</title>
          {ticks.map((t) => (
            <line key={t} x1={0} x2={width} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
          ))}
          <defs>
            <pattern
              id="hatch"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="5" height="5" fill="var(--accent-soft)" />
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--accent)" strokeWidth="2" />
            </pattern>
          </defs>
          {data.map((d, i) => {
            const bx = x(d.key) ?? 0
            const by = y(d.value)
            const h = Math.max(d.value > 0 ? 2 : 0, height - pad.bottom - by)
            const fill = d.partial
              ? 'url(#hatch)'
              : highlightMax && i === maxIdx
                ? 'var(--warm)'
                : 'var(--accent)'
            return (
              <rect
                key={d.key}
                x={bx}
                y={height - pad.bottom - h}
                width={x.bandwidth()}
                height={h}
                rx={Math.min(3, x.bandwidth() / 3)}
                fill={fill}
                opacity={active === null || active === i ? 1 : 0.45}
                style={{ transition: 'opacity 150ms' }}
              />
            )
          })}
          {data.map((d, i) =>
            tick(d, i, data.length) ? (
              <text
                key={d.key}
                x={(x(d.key) ?? 0) + x.bandwidth() / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize={10.5}
                fill="var(--muted)"
                className="font-mono"
              >
                {d.label}
              </text>
            ) : null,
          )}
          {ticks.map((t) => (
            <text
              key={t}
              stroke="var(--surface)"
              strokeWidth={3}
              paintOrder="stroke"
              x={0}
              y={y(t) - 4}
              fontSize={10}
              fill="var(--faint)"
              className="font-mono"
            >
              {format(t)}
            </text>
          ))}
        </svg>
        {a && (
          <Tooltip x={(x(a.key) ?? 0) + x.bandwidth() / 2} y={y(a.value)} width={width}>
            <div className="text-muted">{tooltipLabel(a)}</div>
            <div className="tabular font-semibold">
              {format(a.value)}
              {a.partial ? ' so far' : ''}
            </div>
          </Tooltip>
        )}
      </div>
    </ChartFrame>
  )
}
