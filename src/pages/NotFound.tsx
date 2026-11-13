import { ButtonLink } from '@/components/ui/Button'
import { PageShell } from './Guides'

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex flex-col items-start gap-4 py-10">
        <p className="eyebrow">404</p>
        <h1 className="text-[32px] font-semibold">Nothing to unpack here</h1>
        <p className="text-muted">This page doesn’t exist. Your exports are in the Library.</p>
        <div className="flex gap-2">
          <ButtonLink to="/app" variant="primary">
            Go to Library
          </ButtonLink>
          <ButtonLink to="/">Home</ButtonLink>
        </div>
      </div>
    </PageShell>
  )
}
