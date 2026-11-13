import { useSyncExternalStore } from 'react'

/** Minimal external store: state, a setter and a selector hook. Selectors must return stable values. */
export function createStore<T>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()
  const store = {
    get: () => state,
    set(next: T | ((s: T) => T)) {
      state = typeof next === 'function' ? (next as (s: T) => T)(state) : next
      for (const l of listeners) l()
    },
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
  }
  return { ...store, use: <S>(select: (s: T) => S): S => useSelector(store, select, initial) }
}

function useSelector<T, S>(
  store: { subscribe: (fn: () => void) => () => void; get: () => T },
  select: (s: T) => S,
  initial: T,
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => select(initial),
  )
}
