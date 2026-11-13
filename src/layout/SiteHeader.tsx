import { Link } from '@/app/router'
import { GitHubIcon } from '@/components/icons'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { ThemeMenu } from '@/features/privacy/ThemeMenu'
import { REPO_URL } from '@/lib/external'

/** Header for the public pages (landing, guides, privacy). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="gutter mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
        <Link to="/" aria-label="Unpacked home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <Link
            to="/#platforms"
            className="hidden rounded-md px-3 py-2 text-sm text-muted hover:text-fg md:block"
          >
            Platforms
          </Link>
          <Link
            to="/privacy"
            className="hidden rounded-md px-3 py-2 text-sm text-muted hover:text-fg md:block"
          >
            Privacy
          </Link>
          <Link
            to="/guides"
            className="hidden rounded-md px-3 py-2 text-sm text-muted hover:text-fg md:block"
          >
            Guides
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Source code on GitHub"
            className="hidden size-10 items-center justify-center rounded-lg text-muted hover:bg-sunk hover:text-fg sm:inline-flex"
          >
            <GitHubIcon />
          </a>
          <ThemeMenu />
          <ButtonLink to="/app" variant="primary" size="sm" className="ml-1">
            Open app
          </ButtonLink>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="gutter mx-auto flex max-w-6xl flex-col gap-6 py-10 text-sm text-muted md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-2">
          <Logo className="text-fg" />
          <p>Your data exports, unpacked. Privately. Open source under the MIT license.</p>
          <p className="text-[12.5px] text-faint">Not affiliated with Spotify, Meta or Google.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
          <Link to="/app" className="hover:text-fg">
            Open app
          </Link>
          <Link to="/guides" className="hover:text-fg">
            Export guides
          </Link>
          <Link to="/privacy" className="hover:text-fg">
            Privacy
          </Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className="hover:text-fg">
            GitHub
          </a>
          <a
            href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-fg"
          >
            Contribute
          </a>
          <a
            href={`${REPO_URL}/blob/main/SECURITY.md`}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-fg"
          >
            Security
          </a>
        </nav>
      </div>
    </footer>
  )
}
