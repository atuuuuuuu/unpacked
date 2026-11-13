import { resetImport, useImport } from '@/app/importer'
import { navigate, usePath } from '@/app/router'
import { AlertIcon, CloseIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/Button'
import { ImportProgress } from './ImportStatus'

/** Floating status for imports started outside the Library page (window drop, empty states). */
export function ImportToast() {
  const state = useImport()
  const path = usePath()
  const onLibrary = path === '/app'
  const show =
    (state.status === 'working' && !onLibrary) ||
    (state.status === 'error' && !onLibrary) ||
    (state.status === 'done' && state.notes.length > 0)
  if (!show) return null
  return (
    <div className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-md animate-fade-up rounded-xl border border-line bg-raised p-4 shadow-pop lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96">
      {state.status === 'working' && (
        <ImportProgress label={state.label} progress={state.progress} />
      )}
      {state.status === 'error' && (
        <div className="flex items-start gap-3" role="alert">
          <AlertIcon size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Couldn’t read {state.label}</p>
            <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{state.error.message}</p>
            <Button size="sm" className="mt-2" onClick={() => navigate('/app')}>
              See details
            </Button>
          </div>
          <IconButton label="Dismiss" onClick={resetImport} className="-mt-2 -mr-2 size-8">
            <CloseIcon size={16} />
          </IconButton>
        </div>
      )}
      {state.status === 'done' && (
        <div className="flex items-start gap-3" role="status">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Imported, with a few skipped files</p>
            <ul className="mt-1 list-disc pl-4 text-[13px] text-muted">
              {state.notes.slice(0, 3).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <IconButton label="Dismiss" onClick={resetImport} className="-mt-2 -mr-2 size-8">
            <CloseIcon size={16} />
          </IconButton>
        </div>
      )}
    </div>
  )
}
