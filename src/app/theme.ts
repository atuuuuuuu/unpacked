import { createStore } from './createStore'

export type ThemePref = 'system' | 'light' | 'dark'
const KEY = 'unpacked.theme'

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

const media =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

export const themeStore = createStore<{ pref: ThemePref; resolved: 'light' | 'dark' }>({
  pref: 'system',
  resolved: 'light',
})

function apply(pref: ThemePref) {
  const resolved = pref === 'dark' || (pref === 'system' && media?.matches) ? 'dark' : 'light'
  document.documentElement.dataset.theme = resolved
  themeStore.set({ pref, resolved })
}

export function initTheme() {
  apply(readPref())
  media?.addEventListener('change', () => {
    if (themeStore.get().pref === 'system') apply('system')
  })
}

export function setTheme(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {}
  apply(pref)
}

export const useTheme = () => themeStore.use((s) => s)
