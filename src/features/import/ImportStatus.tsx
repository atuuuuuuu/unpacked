import { useState } from 'react'
import { type ImportState, resetImport } from '@/app/importer'
import { AlertIcon, CheckIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import type { ImportProgress as Progress } from '@/core/types'
import { newIssueUrl } from '@/lib/external'

const STAGES: Record<Progress['stage'], string> = {
  reading: 'Opening the file',
  extracting: 'Unzipping on your device',
  parsing: 'Reading your history',
  summarizing: 'Adding it all up',
}

export function ImportProgress({ label, progress }: { label: string; progress: Progress }) {
  const pct = Math.round(progress.fraction * 100)
  return (
    <div className="flex w-full flex-col gap-2.5" role="status" aria-live="polite">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{STAGES[progress.stage]}…</span>
        {progress.stage === 'extracting' && (
          <span className="tabular font-mono text-[12px] text-muted">{pct}%</span>
        )}
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-sunk"
        role="progressbar"
        aria-label="Import progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200"
          style={{
            width: `${progress.stage === 'reading' ? 4 : progress.stage === 'extracting' ? 4 + pct * 0.7 : progress.stage === 'parsing' ? 80 : 95}%`,
          }}
        />
      </div>
      <p className="truncate font-mono text-[11.5px] text-faint">
        {progress.detail?.split('/').pop() ?? label}
      </p>
    </div>
  )
}

const TITLES: Record<string, string> = {
  'not-supported': 'That’s not an export file',
  'not-recognized': 'We don’t recognize this export',
  'wrong-format': 'This export needs a different format',
  'format-changed': 'The export format has changed',
  corrupt: 'This ZIP can’t be opened',
  encrypted: 'This export is password-protected',
  'too-large': 'This export is too large',
  unknown: 'Something went wrong',
}

export function ImportErrorPanel({
  state,
  onRetry,
}: {
  state: Extract<ImportState, { status: 'error' }>
  onRetry?: () => void
}) {
  const { error } = state
  const [copied, setCopied] = useState(false)
  return (
    <div
      role="alert"
      className="flex w-full flex-col gap-3 rounded-xl border border-danger/40 bg-danger-soft/60 p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <AlertIcon size={20} className="mt-0.5 shrink-0 text-danger" />
        <div className="min-w-0">
          <p className="font-semibold">{TITLES[error.code] ?? TITLES.unknown}</p>
          <p className="mt-1 text-sm text-muted">{error.message}</p>
          <p className="mt-1 truncate font-mono text-[11.5px] text-faint">{state.label}</p>
        </div>
      </div>
      {error.report && (
        <details className="rounded-lg border border-line bg-surface p-3 text-sm">
          <summary className="font-medium">Format report (no personal data)</summary>
          <pre className="mt-2 max-h-56 overflow-auto rounded bg-sunk p-2 font-mono text-[11.5px] leading-relaxed">
            {error.report}
          </pre>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(error.report ?? '')
                  setCopied(true)
                } catch {
                  setCopied(false)
                }
              }}
            >
              {copied ? <CheckIcon size={14} /> : null}
              {copied ? 'Copied' : 'Copy report'}
            </Button>
            <a
              href={newIssueUrl('format-changed.yml', 'Export format changed')}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-accent hover:underline"
            >
              Open an issue on GitHub
            </a>
          </div>
        </details>
      )}
      <div className="flex flex-wrap gap-2">
        {onRetry && (
          <Button size="sm" variant="primary" onClick={onRetry}>
            Choose another file
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={resetImport}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
