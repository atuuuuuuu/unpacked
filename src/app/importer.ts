import * as Comlink from 'comlink'
import type { SerializedImportError } from '@/core/errors'
import type { Dataset, ImportProgress, PlatformId } from '@/core/types'
import type { ImportApi } from '@/worker/import.worker'
import { createStore } from './createStore'
import { addDatasets } from './data'
import { navigate } from './router'

export type ImportState =
  | { status: 'idle' }
  | { status: 'working'; label: string; progress: ImportProgress }
  | { status: 'error'; label: string; error: SerializedImportError }
  | { status: 'done'; notes: string[] }

export const importStore = createStore<ImportState>({ status: 'idle' })

let api: Comlink.Remote<ImportApi> | null = null
function worker() {
  api ??= Comlink.wrap<ImportApi>(
    new Worker(new URL('../worker/import.worker.ts', import.meta.url), {
      type: 'module',
      name: 'unpacked-import',
    }),
  )
  return api
}

type Result = Awaited<ReturnType<ImportApi['importFiles']>>

async function runImport(
  label: string,
  call: (onProgress: (p: ImportProgress) => void) => Promise<Result>,
) {
  importStore.set({ status: 'working', label, progress: { stage: 'reading', fraction: 0 } })
  let last = 0
  const onProgress = Comlink.proxy((p: ImportProgress) => {
    // Progress can arrive thousands of times a second; repainting ~30 times is plenty.
    const now = performance.now()
    if (now - last < 32 && p.fraction < 1) return
    last = now
    importStore.set({ status: 'working', label, progress: p })
  })
  let result: Result
  try {
    result = await call(onProgress)
  } catch {
    result = {
      ok: false,
      error: {
        code: 'unknown',
        message: 'The file reader stopped unexpectedly. Reload the page and try again.',
      },
    }
  }
  if (!result.ok) {
    importStore.set({ status: 'error', label, error: result.error })
    return null
  }
  addDatasets(result.value.datasets)
  importStore.set({ status: 'done', notes: result.value.notes })
  return result.value.datasets
}

const routeFor = (d: Dataset) => `/app/${d.platform}`

export async function importFiles(files: File[]) {
  if (!files.length) return
  const label = files.length === 1 ? files[0]!.name : `${files.length} files`
  const datasets = await runImport(label, (p) => worker().importFiles(files, p))
  if (datasets?.[0]) navigate(routeFor(datasets[0]))
}

export async function loadSample(platform: PlatformId, opts: { go?: boolean } = { go: true }) {
  const datasets = await runImport('Sample data', (p) => worker().loadSample(platform, p))
  if (datasets?.[0] && opts.go) navigate(routeFor(datasets[0]))
}

/** Parses a sample without adding it to the user's data (used by the landing page preview). */
export async function previewSample(platform: PlatformId): Promise<Dataset[]> {
  const r = await worker().loadSample(
    platform,
    Comlink.proxy(() => {}),
  )
  return r.ok ? r.value.datasets : []
}

export const resetImport = () => importStore.set({ status: 'idle' })
export const useImport = () => importStore.use((s) => s)
