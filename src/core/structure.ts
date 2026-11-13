/**
 * Describes the shape of parsed JSON without any of its values, so people can paste it into a
 * "format changed" issue without leaking their data. Strings become "string", arrays show the
 * shape of their first item and their length is rounded.
 */
export function describeShape(value: unknown, depth = 0): unknown {
  if (depth > 6) return '…'
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    if (value.length === 0) return []
    return [describeShape(value[0], depth + 1), `…${roughCount(value.length)} items`]
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[safeKey(k)] = describeShape(v, depth + 1)
    }
    return out
  }
  return typeof value
}

export function structureReport(files: { path: string; json: unknown }[]): string {
  return files
    .map((f) => `${anonymizePath(f.path)}\n${JSON.stringify(describeShape(f.json), null, 2)}`)
    .join('\n\n')
}

/** Paths can contain a username (e.g. "instagram-jane.doe-2024-…"); keep only the last two parts. */
export function anonymizePath(path: string): string {
  return path.split('/').slice(-2).join('/')
}

// Some exports use usernames or ids as object keys; keep keys short and generic when they look like data.
function safeKey(k: string): string {
  return /^[a-z_][a-z0-9_]{0,40}$/i.test(k) ? k : '<key>'
}

function roughCount(n: number): string {
  if (n < 10) return String(n)
  const p = 10 ** Math.floor(Math.log10(n))
  return `~${Math.round(n / p) * p}`
}
