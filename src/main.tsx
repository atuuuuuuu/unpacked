import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { restoreSaved } from './app/data'
import { markOfflineReady, startNetworkMonitor } from './app/network'
import { initTheme } from './app/theme'

startNetworkMonitor()
initTheme()
void restoreSaved()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onOfflineReady: markOfflineReady,
    onRegisteredSW: (_, reg) => reg?.active && markOfflineReady(),
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
