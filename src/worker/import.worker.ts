import * as Comlink from 'comlink'
import { serializeError } from '@/core/errors'
import { importFiles, loadSample } from '@/core/import'
import type { ImportProgress, PlatformId } from '@/core/types'

/**
 * Everything heavy happens here: unzipping, JSON parsing and aggregation. The main thread only
 * receives the finished summaries. Errors are returned as values because Comlink can't carry
 * custom error classes across the boundary.
 */
const api = {
  async importFiles(files: File[], onProgress: (p: ImportProgress) => void) {
    try {
      return { ok: true as const, value: await importFiles(files, onProgress) }
    } catch (e) {
      return { ok: false as const, error: serializeError(e) }
    }
  },
  async loadSample(platform: PlatformId, onProgress: (p: ImportProgress) => void) {
    try {
      return { ok: true as const, value: { datasets: loadSample(platform, onProgress), notes: [] } }
    } catch (e) {
      return { ok: false as const, error: serializeError(e) }
    }
  },
}

export type ImportApi = typeof api
Comlink.expose(api)
