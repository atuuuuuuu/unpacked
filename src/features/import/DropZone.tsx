import { useRef, useState } from 'react'
import { importFiles, useImport } from '@/app/importer'
import { UploadIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { ImportErrorPanel, ImportProgress } from './ImportStatus'

export const ACCEPT = '.zip,.json,application/zip,application/x-zip-compressed,application/json'

/** The main way in: drop or pick ZIP/JSON files. Works with keyboard, mouse and touch. */
export function DropZone({ compact = false }: { compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const state = useImport()
  const [over, setOver] = useState(false)
  const pick = () => input.current?.click()

  return (
    <section
      data-testid="dropzone"
      aria-label="Drop your export here"
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={() => {
        // The window-level handler in AppShell does the import; this only resets the highlight.
        setOver(false)
      }}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-5 text-center transition-colors',
        compact ? 'py-8' : 'py-10 sm:py-14',
        over ? 'border-accent bg-accent-soft/50' : 'border-line-strong bg-surface',
      )}
    >
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="file-input"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          e.target.value = ''
          void importFiles(files)
        }}
      />
      {state.status === 'working' ? (
        <div className="w-full max-w-sm">
          <ImportProgress label={state.label} progress={state.progress} />
        </div>
      ) : state.status === 'error' ? (
        <div className="w-full max-w-xl">
          <ImportErrorPanel state={state} onRetry={pick} />
        </div>
      ) : (
        <>
          <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <UploadIcon size={22} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-display text-lg font-semibold">
              <span className="hidden sm:inline">Drop your export here</span>
              <span className="sm:hidden">Open your export</span>
            </p>
            <p className="text-sm text-muted">
              The ZIP from Spotify, Instagram or Google Takeout. Several files at once is fine.
            </p>
          </div>
          <Button variant="primary" onClick={pick}>
            Choose files
          </Button>
          <p className="font-mono text-[11px] text-faint">Read on this device · never uploaded</p>
        </>
      )}
    </section>
  )
}
