import { type AnchorHTMLAttributes, type MouseEvent, useSyncExternalStore } from 'react'

/**
 * A tiny history router. The app has a handful of flat routes, so a dependency would be overkill.
 * Paths are app-relative ("/app/spotify"); the deploy base (e.g. "/unpacked/") is added here.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

const listeners = new Set<() => void>()
const emit = () => {
  for (const l of listeners) l()
}
if (typeof window !== 'undefined') window.addEventListener('popstate', emit)

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const current = () => {
  const p = window.location.pathname
  return (p.startsWith(BASE) ? p.slice(BASE.length) : p) || '/'
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, current, () => '/')
}

export const href = (path: string) => `${BASE}${path}`

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  const [pathname, hash] = path.split('#')
  if (current() === pathname && !hash) return
  const url = href(path)
  if (opts.replace) history.replaceState(null, '', url)
  else history.pushState(null, '', url)
  emit()
  if (hash)
    requestAnimationFrame(() =>
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }),
    )
  else window.scrollTo({ top: 0 })
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

export function Link({ to, onClick, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return
    e.preventDefault()
    navigate(to)
  }
  return <a href={href(to)} onClick={handle} {...rest} />
}
