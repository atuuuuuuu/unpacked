import { scaleLinear } from 'd3-scale'
import { area, curveMonotoneX, line } from 'd3-shape'
import { useId, useState } from 'react'
import { ChartFrame, Tooltip } from './ChartFrame'
import { useWidth } from './useWidth'

export interface Point {
  key: string
  label: string
  value: number
}

export function AreaChart({
  data,
  format,
  height = 200,
  summary,
  columns,
  isTick,
  tickLabel,
}: {
  data: Point[]
  format: (v: number) => string
  height?: number
  summary: string
  columns: [string, string]
  isTick: (d: Point, i: number) => boolean
  tickLabel: (d: Point) => string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const gid = useId().replace(/:/g, '')
  const pad = { top: 14, bottom: 22, x: 4 }
  const max = Math.max(1, ...data.map((d) => d.value))
  const x = scaleLinear()
    .domain([0, Math.max(1, data.length - 1)])
    .range([pad.x, width - pad.x])
  const y = scaleLinear()
    .domain([0, max])
    .nice(3)
    .range([height - pad.bottom, pad.top])
  const ticks = y.ticks(3).filter((t) => t > 0)
  const areaPath = area<Point>()
    .x((_, i) => x(i))
    .y0(height - pad.bottom)
    .y1((d) => y(d.value))
    .curve(curveMonotoneX)(data)
  const linePath = line<Point>()
    .x((_, i) => x(i))
    .y((d) => y(d.value))
    .curve(curveMonotoneX)(data)
  // Skip year labels that would collide on small screens.
  const tickIdx = data.map((d, i) => (isTick(d, i) ? i : -1)).filter((i) => i >= 0)
  const every = Math.max(1, Math.ceil((tickIdx.length * 44) / Math.max(1, width)))
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
          const rect = e.currentTarget.getBoundingClientRect()
          const i = Math.round(x.invert(e.clientX - rect.left))
          setActive(Math.max(0, Math.min(data.length - 1, i)))
        }}
      >
        <svg width={width} height={height} className="block overflow-visible">
          <title>{summary}</title>
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1={0} x2={width} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
          ))}
          <line
            x1={0}
            x2={width}
            y1={height - pad.bottom}
            y2={height - pad.bottom}
            stroke="var(--line)"
          />
          {areaPath && <path d={areaPath} fill={`url(#${gid})`} />}
          {linePath && <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={1.75} />}
          {tickIdx
            .filter((_, n) => n % every === 0)
            .map((i) => (
              <text
                key={i}
                x={x(i)}
                y={height - 6}
                textAnchor="middle"
                fontSize={10.5}
                fill="var(--muted)"
                className="font-mono"
              >
                {tickLabel(data[i]!)}
              </text>
            ))}
          {a && active !== null && (
            <g>
              <line
                x1={x(active)}
                x2={x(active)}
                y1={pad.top}
                y2={height - pad.bottom}
                stroke="var(--line-strong)"
              />
              <circle
                cx={x(active)}
                cy={y(a.value)}
                r={4}
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth={2}
              />
            </g>
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
        {a && active !== null && (
          <Tooltip x={x(active)} y={y(a.value)} width={width}>
            <div className="text-muted">{a.label}</div>
            <div className="tabular font-semibold">{format(a.value)}</div>
          </Tooltip>
        )}
      </div>
    </ChartFrame>
  )
}
