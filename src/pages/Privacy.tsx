import { useNetwork } from '@/app/network'
import { Link } from '@/app/router'
import { REPO_URL } from '@/lib/external'
import { PageShell } from './Guides'

const POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "connect-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "form-action 'none'",
]

export default function Privacy() {
  const net = useNetwork()
  return (
    <PageShell>
      <div className="flex flex-col gap-3">
        <p className="eyebrow">Privacy</p>
        <h1 className="text-[32px] font-semibold sm:text-[40px]">
          How Unpacked keeps your data on your device
        </h1>
        <p className="text-[16px] text-muted">
          Unpacked has no server that could receive your data. Here’s exactly what happens, and how
          to check it yourself instead of trusting us.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Live network numbers">
        <Live
          label="Other websites contacted"
          value={net.external.length}
          testId="privacy-external"
        />
        <Live label="Blocked by policy" value={net.blocked.length} />
        <Live label="App files loaded" value={net.local} />
        <Live label="Ready offline" value={net.offlineReady ? 'Yes' : 'Not yet'} />
      </section>

      <Section title="What happens to an export">
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>Your browser hands the file to a Web Worker, a background thread on your device.</li>
          <li>
            The worker reads only the files it needs from inside the ZIP. Photos and other large
            files are never opened.
          </li>
          <li>
            It checks every record against the expected format and adds them up: totals, rankings,
            charts.
          </li>
          <li>
            Only those summaries go back to the page. Fields such as IP addresses in Spotify exports
            are dropped.
          </li>
          <li>
            Close the tab and everything is gone, unless you turned on “Remember on this device”.
          </li>
        </ol>
      </Section>

      <Section title="Check it yourself">
        <ul className="flex flex-col gap-3">
          <li>
            <strong className="font-semibold text-fg">Watch the network.</strong> Open your
            browser’s developer tools, go to the Network tab, then drop an export. No request
            carries your data, and none goes to another site.
          </li>
          <li>
            <strong className="font-semibold text-fg">Pull the plug.</strong> Load Unpacked once,
            turn on airplane mode, and drop an export. It works the same, because it never needed
            the network.
          </li>
          <li>
            <strong className="font-semibold text-fg">Read the policy.</strong> Every page ships
            with this Content Security Policy. With{' '}
            <code className="font-mono text-[13px]">connect-src 'self'</code>, the browser refuses
            to send anything to any other site:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-sunk p-3 font-mono text-[12px] leading-relaxed text-fg">
              {POLICY.join(';\n')}
            </pre>
          </li>
          <li>
            <strong className="font-semibold text-fg">Read the code.</strong> It’s all{' '}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-accent hover:underline"
            >
              on GitHub
            </a>
            , including the automated test that fails if the app contacts another site while reading
            an export.
          </li>
        </ul>
      </Section>

      <Section title="What is stored">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Your theme choice (light, dark or system), in this browser’s local storage.</li>
          <li>
            Nothing else, unless you turn on “Remember my exports on this device” in the{' '}
            <Link to="/app" className="font-medium text-accent hover:underline">
              Library
            </Link>
            . Then summaries of your real exports are kept in this browser’s IndexedDB until you
            turn it off.
          </li>
          <li>
            No cookies, no analytics, no fonts or scripts from other sites. Everything is served
            from this site.
          </li>
        </ul>
      </Section>

      <Section title="Links that leave Unpacked">
        <p>
          Some things are links: export guides point to Spotify, Instagram and Google; dashboards
          link to Instagram profiles and YouTube channels from your own export. They only open when
          you click them, in a new tab, and Unpacked sends no referrer. Sample data never links
          anywhere.
        </p>
      </Section>
    </PageShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-[15px] leading-relaxed text-muted">
      <h2 className="text-xl font-semibold text-fg">{title}</h2>
      {children}
    </section>
  )
}

function Live({
  label,
  value,
  testId,
}: {
  label: string
  value: number | string
  testId?: string
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-card">
      <p data-testid={testId} className="tabular font-display text-2xl font-semibold">
        {value}
      </p>
      <p className="text-[12px] leading-snug text-muted">{label}</p>
    </div>
  )
}
