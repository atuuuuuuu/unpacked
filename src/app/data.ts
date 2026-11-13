import type { Dataset, DatasetOf, PlatformId } from '@/core/types'
import { createStore } from './createStore'
import { forgetAll, loadSaved, rememberEnabled, saveAll, setRememberFlag } from './persist'

type Source = Dataset['source']

interface DataState {
  datasets: Dataset[]
  /** Which data each dashboard shows when both real and sample data are loaded. */
  view: Partial<Record<PlatformId, Source>>
  remember: boolean
  restored: boolean
}

export const dataStore = createStore<DataState>({
  datasets: [],
  view: {},
  remember: false,
  restored: false,
})

const MAX_INSTAGRAM = 6

/**
 * Adds imported datasets. Sample and real data never replace each other. Within each, Spotify and
 * YouTube keep one export (the newest import wins); Instagram keeps several so they can be
 * compared. The dashboard switches to whatever was added last.
 */
export function addDatasets(incoming: Dataset[]) {
  dataStore.set((s) => {
    let list = [...s.datasets]
    const view = { ...s.view }
    const replaced = new Set<string>()
    for (const d of incoming) {
      const key = `${d.platform}:${d.source}`
      const multi = d.platform === 'instagram' && d.source === 'file'
      if (!multi && !replaced.has(key)) {
        list = list.filter((x) => x.platform !== d.platform || x.source !== d.source)
        replaced.add(key)
      }
      if (multi) {
        list = list.filter(
          (x) =>
            !(
              x.platform === 'instagram' &&
              x.source === 'file' &&
              x.label === d.label &&
              x.exportedAt === d.exportedAt
            ),
        )
      }
      list.push(d)
      view[d.platform] = d.source
    }
    const ig = list
      .filter((x) => x.platform === 'instagram' && x.source === 'file')
      .sort((a, b) => a.exportedAt - b.exportedAt)
    const drop = new Set(ig.slice(0, Math.max(0, ig.length - MAX_INSTAGRAM)))
    return { ...s, view, datasets: list.filter((x) => !drop.has(x)) }
  })
  persist()
}

export function setView(platform: PlatformId, source: Source) {
  dataStore.set((s) => ({ ...s, view: { ...s.view, [platform]: source } }))
}

export function removeDataset(id: string) {
  dataStore.set((s) => ({ ...s, datasets: s.datasets.filter((d) => d.id !== id) }))
  persist()
}

export function clearDatasets() {
  dataStore.set((s) => ({ ...s, datasets: [] }))
  void forgetAll()
}

export async function setRemember(on: boolean) {
  setRememberFlag(on)
  dataStore.set((s) => ({ ...s, remember: on }))
  if (on) persist()
  else await forgetAll()
}

function persist() {
  const s = dataStore.get()
  // Sample data is regenerated on demand, so only real imports are worth keeping.
  if (s.remember) void saveAll(s.datasets.filter((d) => d.source === 'file'))
}

export async function restoreSaved() {
  const remember = rememberEnabled()
  const saved = remember ? await loadSaved() : []
  dataStore.set((s) => ({
    ...s,
    remember,
    restored: true,
    datasets: [...saved, ...s.datasets.filter((d) => !saved.some((x) => x.id === d.id))],
  }))
}

export const useDatasets = () => dataStore.use((s) => s.datasets)
export const useView = () => dataStore.use((s) => s.view)

/** The datasets a dashboard should show, and whether the other source is also available. */
export function pickView<P extends PlatformId>(list: Dataset[], p: P, view: DataState['view']) {
  const all = ofPlatform(list, p)
  const hasFile = all.some((d) => d.source === 'file')
  const hasSample = all.some((d) => d.source === 'sample')
  const source: Source = view[p] ?? (hasFile ? 'file' : 'sample')
  const shown = all.filter((d) => d.source === source).sort((a, b) => a.exportedAt - b.exportedAt)
  return { shown, source, both: hasFile && hasSample }
}

export function ofPlatform<P extends PlatformId>(list: Dataset[], p: P): DatasetOf<P>[] {
  return list.filter((d): d is DatasetOf<P> => d.platform === p)
}
