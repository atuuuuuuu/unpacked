import { lazy, Suspense, useEffect } from 'react'
import { usePath } from '@/app/router'
import type { PlatformId } from '@/core/types'
import { AppShell } from '@/layout/AppShell'
import { DashboardSkeleton } from '@/pages/dashboard/common'
import { GuidePage, GuidesIndex } from '@/pages/Guides'
import Landing from '@/pages/Landing'
import Library from '@/pages/Library'
import NotFound from '@/pages/NotFound'
import Privacy from '@/pages/Privacy'

const SpotifyPage = lazy(() => import('@/pages/dashboard/SpotifyPage'))
const InstagramPage = lazy(() => import('@/pages/dashboard/InstagramPage'))
const YouTubePage = lazy(() => import('@/pages/dashboard/YouTubePage'))

const DASHBOARDS: Record<PlatformId, React.ComponentType> = {
  spotify: SpotifyPage,
  instagram: InstagramPage,
  youtube: YouTubePage,
}

const TITLES: Record<string, string> = {
  '/': 'Unpacked · Your data exports, privately',
  '/app': 'Library · Unpacked',
  '/app/spotify': 'Spotify · Unpacked',
  '/app/instagram': 'Instagram · Unpacked',
  '/app/youtube': 'YouTube · Unpacked',
  '/guides': 'Export guides · Unpacked',
  '/privacy': 'Privacy · Unpacked',
}

export function App() {
  const path = usePath().replace(/\/+$/, '') || '/'
  useEffect(() => {
    const guide = path.match(/^\/guides\/(\w+)$/)?.[1]
    document.title =
      TITLES[path] ??
      (guide ? `${guide[0]!.toUpperCase()}${guide.slice(1)} guide · Unpacked` : 'Unpacked')
  }, [path])

  if (path === '/') return <Landing />
  if (path === '/privacy') return <Privacy />
  if (path === '/guides') return <GuidesIndex />
  const guide = path.match(/^\/guides\/(spotify|instagram|youtube)$/)?.[1] as PlatformId | undefined
  if (guide) return <GuidePage id={guide} />
  if (path === '/app') {
    return (
      <AppShell>
        <Library />
      </AppShell>
    )
  }
  const dash = path.match(/^\/app\/(spotify|instagram|youtube)$/)?.[1] as PlatformId | undefined
  if (dash) {
    const Dashboard = DASHBOARDS[dash]
    return (
      <AppShell>
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </AppShell>
    )
  }
  return <NotFound />
}
