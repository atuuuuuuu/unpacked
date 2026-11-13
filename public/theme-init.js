// Runs before first paint so the page never flashes the wrong theme. Kept as a file (not inline)
// because the Content Security Policy forbids inline scripts.
;(() => {
  let pref = 'system'
  try {
    pref = localStorage.getItem('unpacked.theme') || 'system'
  } catch {}
  const dark =
    pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()
