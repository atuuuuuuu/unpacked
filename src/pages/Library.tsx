import { useState } from 'react'
import { clearDatasets, dataStore, removeDataset, setRemember, useDatasets } from '@/app/data'
import { loadSample, useImport } from '@/app/importer'
import { Link } from '@/app/router'
import { ArrowRightIcon, TrashIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/Button'
import { Switch } from '@/components/ui/controls'
import { Chip, Panel } from '@/components/ui/Panel'
import { DropZone } from '@/features/import/DropZone'
import { formatDate } from '@/lib/format'
import { PLATFORMS, platformMeta } from '@/platforms/ui'
import { Page } from './dashboard/common'

export default function Library() {
  const datasets = useDatasets()
  const remember = dataStore.use((s) => s.remember)
  const importing = useImport().status === 'working'
  const [confirming, setConfirming] = useState(false)
  const sorted = [...datasets].sort(
    (a, b) => a.platform.localeCompare(b.platform) || b.exportedAt - a.exportedAt,
  )

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold sm:text-[28px]">Library</h1>
        <p className="text-[14px] text-muted">
          Open an export to explore it. Everything is read on this device.
        </p>
      </div>

      <DropZone />

      {sorted.length > 0 && (
        <Panel title="Your exports" description="Only summaries are kept, never the raw files">
          <ul className="flex flex-col" data-testid="loaded-list">
            {sorted.map((d) => {
              const p = platformMeta(d.platform)
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <p.Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      {d.source === 'sample' && <Chip tone="warm">Sample</Chip>}
                    </div>
                    <p className="truncate text-[12.5px] text-muted">
                      {d.label} · exported {formatDate(d.exportedAt)}
                    </p>
                  </div>
                  <Link
                    to={`/app/${d.platform}`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-[13px] font-medium text-accent hover:bg-accent-soft"
                  >
                    Open <ArrowRightIcon size={14} />
                  </Link>
                  <IconButton
                    label={`Remove ${d.label}`}
                    onClick={() => removeDataset(d.id)}
                    className="size-8"
                  >
                    <TrashIcon size={16} />
                  </IconButton>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      <Panel
        title="No export yet?"
        description="Explore every dashboard with fictional sample data"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLATFORMS.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-line p-4">
              <div className="flex items-center gap-2.5">
                <p.Icon size={18} className="text-accent" />
                <span className="font-medium">{p.name}</span>
              </div>
              <p className="flex-1 text-[13px] text-muted">{p.pitch}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => loadSample(p.id)}
                  disabled={importing}
                  data-testid={`library-sample-${p.id}`}
                >
                  Try sample
                </Button>
                <Link
                  to={`/guides/${p.id}`}
                  className="inline-flex h-8 items-center px-2 text-[13px] font-medium text-accent hover:underline"
                >
                  Export guide
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="On this device">
        <Switch
          id="remember"
          checked={remember}
          onChange={(v) => void setRemember(v)}
          label="Remember my exports on this device"
          description="Off by default. When on, summaries of your real exports (not the raw files) are saved in this browser’s storage so you don’t have to drop them again. Turning it off deletes them."
        />
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {confirming ? (
            <>
              <span className="text-sm">
                Remove all exports from this page{remember ? ' and this device' : ''}?
              </span>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  clearDatasets()
                  setConfirming(false)
                }}
              >
                Yes, forget everything
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setConfirming(true)}
              disabled={!datasets.length}
            >
              <TrashIcon size={15} /> Forget everything
            </Button>
          )}
        </div>
      </Panel>
    </Page>
  )
}
