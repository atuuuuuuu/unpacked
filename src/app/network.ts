import { createStore } from './createStore'

/**
 * Watches what the page loads, using the browser's own Resource Timing and CSP violation
 * events. Anything fetched from another origin, or blocked by the Content Security Policy,
 * shows up in the privacy panel.
 */
export interface NetworkState {
  /** Requests to origins other than this site since the page opened. */
  external: string[]
  /** Requests the Content Security Policy blocked. */
  blocked: string[]
  /** Same-origin requests (app files) since the page opened. */
  local: number
  offlineReady: boolean
}

export const networkStore = createStore<NetworkState>({
  external: [],
  blocked: [],
  local: 0,
  offlineReady: false,
})

export function startNetworkMonitor() {
  if (typeof PerformanceObserver === 'undefined') return
  const record = (list: PerformanceEntryList) => {
    const external: string[] = []
    let local = 0
    for (const e of list) {
      let origin = ''
      try {
        origin = new URL(e.name).origin
      } catch {
        continue
      }
      if (origin === location.origin || e.name.startsWith('data:') || e.name.startsWith('blob:'))
        local++
      else external.push(origin)
    }
    if (external.length || local) {
      networkStore.set((s) => ({
        ...s,
        external: [...s.external, ...external],
        local: s.local + local,
      }))
    }
  }
  try {
    const obs = new PerformanceObserver((l) => record(l.getEntries()))
    obs.observe({ type: 'resource', buffered: true })
  } catch {}
  document.addEventListener('securitypolicyviolation', (e) => {
    networkStore.set((s) => ({
      ...s,
      blocked: [...s.blocked, e.blockedURI || e.violatedDirective],
    }))
  })
}

export const markOfflineReady = () => networkStore.set((s) => ({ ...s, offlineReady: true }))
export const useNetwork = () => networkStore.use((s) => s)
