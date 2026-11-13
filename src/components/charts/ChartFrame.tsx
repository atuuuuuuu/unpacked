import type { ReactNode } from 'react'

export interface TableRow {
  label: string
  value: string
}

/**
 * Wraps a chart in a <figure> with a short spoken summary and the full data as a table that
 * only screen readers see. The table sits in a div because tables ignore sr-only's 1px height.
 */
export function ChartFrame({
  summary,
  rows,
  columns,
  children,
}: {
  summary: string
  rows: TableRow[]
  columns: [string, string]
  children: ReactNode
}) {
  return (
    <figure className="m-0 min-w-0">
      <div aria-hidden="true">{children}</div>
      <figcaption className="sr-only">{summary}</figcaption>
      <div className="sr-only">
        <table>
          <thead>
            <tr>
              <th>{columns[0]}</th>
              <th>{columns[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

export function Tooltip({
  x,
  y,
  width,
  children,
}: {
  x: number
  y: number
  width: number
  children: ReactNode
}) {
  // Keep the tooltip inside the chart on narrow screens.
  const left = Math.min(Math.max(x, 70), width - 70)
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-line bg-raised px-2.5 py-1.5 text-[12px] leading-tight shadow-pop"
      style={{ left, top: y - 8 }}
    >
      {children}
    </div>
  )
}
