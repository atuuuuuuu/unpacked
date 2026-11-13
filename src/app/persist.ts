import type { Dataset } from '@/core/types'

/**
 * Opt-in storage of summaries (never raw files) in this browser's IndexedDB. Off by default;
 * turning it off deletes everything that was stored.
 */
const DB = 'unpacked'
const STORE = 'datasets'
const FLAG = 'unpacked.remember'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | undefined,
) {
  const db = await open()
  return new Promise<T | undefined>((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const req = fn(t.objectStore(STORE))
    t.oncomplete = () => {
      db.close()
      resolve(req?.result)
    }
    t.onerror = () => reject(t.error)
  })
}

export function rememberEnabled(): boolean {
  try {
    return localStorage.getItem(FLAG) === '1'
  } catch {
    return false
  }
}

export function setRememberFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(FLAG, '1')
    else localStorage.removeItem(FLAG)
  } catch {
    // Storage blocked (private mode); remembering simply won't work.
  }
}

export async function loadSaved(): Promise<Dataset[]> {
  try {
    return ((await tx('readonly', (s) => s.getAll())) as Dataset[] | undefined) ?? []
  } catch {
    return []
  }
}

export async function saveAll(datasets: Dataset[]) {
  try {
    await tx('readwrite', (s) => {
      s.clear()
      for (const d of datasets) s.put(d)
      return undefined
    })
  } catch {
    // Quota or blocked storage: data stays in memory for this visit.
  }
}

export async function forgetAll() {
  try {
    await tx('readwrite', (s) => s.clear())
  } catch {}
}
