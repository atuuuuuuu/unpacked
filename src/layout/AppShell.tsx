import { type ReactNode, useEffect, useState } from 'react'
import { ofPlatform, useDatasets } from '@/app/data'
import { importFiles } from '@/app/importer'
import { Link, usePath } from '@/app/router'
import { BookIcon, GridIcon, ShieldIcon, UploadIcon } from '@/components/icons'
import { Logo } from '@/components/ui/Logo'
import type { Dataset, PlatformId } from '@/core/types'
import { ImportToast } from '@/features/import/ImportToast'
import { PrivacyBadge } from '@/features/privacy/PrivacyBadge'
import { ThemeMenu } from '@/features/privacy/ThemeMenu'
import { cn } from '@/lib/cn'
import { PLATFORMS } from '@/platforms/ui'

function status(list: Dataset[], id: PlatformId): 'file' | 'sample' | null {
  const own = ofPlatform(list, id)
  if (own.some((d) => d.source === 'file')) return 'file'
  return own.length ? 'sample' : null
}

const NAV = [
  { to: '/app', label: 'Library', Icon: GridIcon },
  ...PLATFORMS.map((p) => ({ to: `/app/${p.id}`, label: p.name, Icon: p.Icon, id: p.id })),
]

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePath()
  const datasets = useDatasets()
  const dragging = useWindowDrop()

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/" aria-label="Unpacked home">
            <Logo />
          </Link>
        </div>
        <nav aria-label="App" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
          <div className="flex flex-col gap-0.5">
            <p className="eyebrow px-2.5 pb-1.5">Your data</p>
            {NAV.map((item) => {
              const s = 'id' in item ? status(datasets, item.id as PlatformId) : null
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={path === item.to ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
                    path === item.to
                      ? 'bg-sunk font-medium text-fg'
                      : 'text-muted hover:bg-sunk/60 hover:text-fg',
                  )}
                >
                  <item.Icon size={17} />
                  <span className="flex-1">{item.label}</span>
                  {s === 'file' && (
                    <span className="size-1.5 rounded-full bg-accent">
                      <span className="sr-only">Loaded</span>
                    </span>
                  )}
                  {s === 'sample' && (
                    <span className="rounded bg-sunk px-1.5 font-mono text-[10px] text-muted">
                      sample
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="eyebrow px-2.5 pb-1.5">Help</p>
            <Link
              to="/guides"
              className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted hover:bg-sunk/60 hover:text-fg"
            >
              <BookIcon size={17} /> Export guides
            </Link>
            <Link
              to="/privacy"
              className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted hover:bg-sunk/60 hover:text-fg"
            >
              <ShieldIcon size={17} /> How privacy works
            </Link>
          </div>
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-line p-3">
          <PrivacyBadge />
          <ThemeMenu />
        </div>
      </aside>

      {/* Phone and tablet top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md lg:hidden">
        <div className="gutter flex h-14 items-center justify-between gap-2">
          <Link to="/" aria-label="Unpacked home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <PrivacyBadge compact />
            <ThemeMenu />
          </div>
        </div>
      </header>

      <main id="main" className="min-w-0 pb-28 lg:pb-12">
        {children}
      </main>

      {/* Phone and tablet tab bar */}
      <nav
        aria-label="App"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 px-2">
          {NAV.map((item) => {
            const active = path === item.to
            const s = 'id' in item ? status(datasets, item.id as PlatformId) : null
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  active ? 'text-accent' : 'text-muted',
                )}
              >
                <item.Icon size={21} />
                {item.label}
                {s && (
                  <span
                    className={cn(
                      'absolute top-3 right-[calc(50%-16px)] size-1.5 rounded-full',
                      s === 'file' ? 'bg-accent' : 'bg-faint',
                    )}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      <ImportToast />
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-accent bg-surface px-10 py-12 text-center shadow-pop">
            <UploadIcon size={28} className="text-accent" />
            <p className="font-display text-xl font-semibold">Drop to unpack</p>
            <p className="text-sm text-muted">Read on this device. Nothing is uploaded.</p>
          </div>
        </div>
      )}
    </div>
  )
}

/** Lets people drop an export anywhere in the app, not only on the drop zone. */
function useWindowDrop() {
  const [dragging, setDragging] = useState(false)
  useEffect(() => {
    let depth = 0
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files')
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth++
      setDragging(true)
    }
    const leave = () => {
      depth = Math.max(0, depth - 1)
      if (!depth) setDragging(false)
    }
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault()
    }
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth = 0
      setDragging(false)
      void importFiles([...(e.dataTransfer?.files ?? [])])
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
    }
  }, [])
  return dragging
}
