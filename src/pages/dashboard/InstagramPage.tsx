import { Tabs } from 'radix-ui'
import { useMemo, useRef, useState } from 'react'
import { pickView, useDatasets, useView } from '@/app/data'
import { importFiles } from '@/app/importer'
import { BarChart } from '@/components/charts/BarChart'
import { ExternalIcon, UploadIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SearchField, Segmented, Select } from '@/components/ui/controls'
import { EmptyState, Panel, Stat } from '@/components/ui/Panel'
import type { DatasetOf } from '@/core/types'
import { ACCEPT } from '@/features/import/DropZone'
import type { CardSpec } from '@/features/share/card'
import { ShareButton } from '@/features/share/ShareDialog'
import { cn } from '@/lib/cn'
import { formatDate, formatMonth, formatNumber, plural } from '@/lib/format'
import { compare, perYear, relations } from '@/platforms/instagram/insights'
import type { Account } from '@/platforms/instagram/types'
import { DashboardHeader, EmptyDashboard, Footnote, Page } from './common'

type Snap = DatasetOf<'instagram'>

export default function InstagramPage() {
  const datasets = useDatasets()
  const view = useView()
  const { shown, source, both } = pickView(datasets, 'instagram', view)
  if (!shown.length) return <EmptyDashboard platform="instagram" />
  return (
    <InstagramDashboard
      key={shown.map((s) => s.id).join()}
      snaps={shown}
      both={both}
      source={source}
    />
  )
}

const exportLabel = (s: Snap) => `Export from ${formatDate(s.exportedAt)}`

function InstagramDashboard({
  snaps,
  both,
  source,
}: {
  snaps: Snap[]
  both: boolean
  source: 'file' | 'sample'
}) {
  const [currentId, setCurrentId] = useState(snaps[snaps.length - 1]!.id)
  const current = snaps.find((s) => s.id === currentId) ?? snaps[snaps.length - 1]!
  const sample = current.source === 'sample'
  const r = useMemo(() => relations(current.summary), [current])

  const card = useMemo<CardSpec>(() => {
    // The export just before this one, if any, so the card can show what changed.
    const previous = snaps.filter((x) => x.exportedAt < current.exportedAt).at(-1)
    const change = previous ? compare(previous.summary, current.summary) : null
    const rows = [
      { name: 'Mutuals', n: r.mutuals.length },
      { name: 'Fans I don’t follow back', n: r.fans.length },
      { name: 'Don’t follow me back', n: r.notFollowingBack.length },
      ...(change
        ? [
            {
              name: `New followers since ${formatDate(previous!.exportedAt)}`,
              n: change.newFollowers.length,
            },
            {
              name: `Unfollowed me since ${formatDate(previous!.exportedAt)}`,
              n: change.lostFollowers.length,
            },
          ]
        : []),
    ]
    const max = Math.max(1, ...rows.map((x) => x.n))
    return {
      platform: 'Instagram',
      eyebrow: `My Instagram · ${formatDate(current.exportedAt)}`,
      big: formatNumber(r.notFollowingBack.length),
      bigLabel: 'accounts I follow don’t follow me back',
      stats: [
        { label: 'Followers', value: formatNumber(r.followers.length) },
        { label: 'Following', value: formatNumber(r.following.length) },
        { label: 'Mutuals', value: formatNumber(r.mutuals.length) },
      ],
      list: {
        title: 'Breakdown',
        items: rows.map((x) => ({ name: x.name, value: formatNumber(x.n), share: x.n / max })),
      },
      sample,
    }
  }, [current, r, sample, snaps])

  return (
    <Page>
      <DashboardHeader
        platform="instagram"
        meta={`${exportLabel(current)} · ${current.label}`}
        sample={sample}
        both={both}
        source={source}
        skipped={current.skipped}
        actions={
          <>
            {snaps.length > 1 && (
              <Select
                label="Which export to show"
                value={current.id}
                onChange={setCurrentId}
                options={[...snaps]
                  .reverse()
                  .map((s) => ({ value: s.id, label: formatDate(s.exportedAt) }))}
                className="w-36"
              />
            )}
            <ShareButton spec={card} fileName="unpacked-instagram.png" />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Followers" value={formatNumber(r.followers.length)} />
        <Stat label="Following" value={formatNumber(r.following.length)} />
        <Stat
          label="Mutuals"
          value={formatNumber(r.mutuals.length)}
          hint="You follow each other"
          tone="accent"
        />
        <Stat
          label="Don’t follow back"
          value={formatNumber(r.notFollowingBack.length)}
          hint="You follow them, they don’t follow you"
          tone="warm"
        />
        <div className="col-span-2 lg:col-span-1">
          <Stat
            label="Fans"
            value={formatNumber(r.fans.length)}
            hint="They follow you, you don’t follow them"
          />
        </div>
      </div>

      <AccountLists current={current} />

      <ComparePanel snaps={snaps} />

      <GrowthPanel followers={r.followers} following={r.following} />

      <Footnote>
        <strong className="font-semibold text-fg">Good to know.</strong> Instagram leaves accounts
        out of exports when they are deactivated, deleted or have blocked you, so “unfollowed you”
        can also mean the account is gone. Dates are when the follow started, as Instagram recorded
        it.
      </Footnote>
    </Page>
  )
}

type ListKey =
  | 'notFollowingBack'
  | 'fans'
  | 'mutuals'
  | 'followers'
  | 'following'
  | 'pending'
  | 'recentlyUnfollowed'
type Sort = 'recent' | 'oldest' | 'az'

function AccountLists({ current }: { current: Snap }) {
  const r = useMemo(() => relations(current.summary), [current])
  const lists: { key: ListKey; label: string; items: Account[]; empty: string }[] = [
    {
      key: 'notFollowingBack',
      label: 'Don’t follow back',
      items: r.notFollowingBack,
      empty: 'Everyone you follow follows you back.',
    },
    { key: 'fans', label: 'Fans', items: r.fans, empty: 'You follow everyone who follows you.' },
    { key: 'mutuals', label: 'Mutuals', items: r.mutuals, empty: 'No mutual follows yet.' },
    {
      key: 'followers',
      label: 'Followers',
      items: r.followers,
      empty: 'No followers in this export.',
    },
    {
      key: 'following',
      label: 'Following',
      items: r.following,
      empty: 'You don’t follow anyone in this export.',
    },
  ]
  if (current.summary.pending) {
    lists.push({
      key: 'pending',
      label: 'Pending requests',
      items: current.summary.pending,
      empty: 'No pending follow requests.',
    })
  }
  if (current.summary.recentlyUnfollowed) {
    lists.push({
      key: 'recentlyUnfollowed',
      label: 'You unfollowed',
      items: current.summary.recentlyUnfollowed,
      empty: 'Instagram lists no recent unfollows.',
    })
  }
  const [tab, setTab] = useState<ListKey>('notFollowingBack')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('recent')

  return (
    <Panel title="Accounts" description="Search and sort any list">
      <Tabs.Root
        value={tab}
        onValueChange={(v) => setTab(v as ListKey)}
        className="flex flex-col gap-4"
      >
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]">
          <Tabs.List
            aria-label="Account lists"
            className="flex w-max gap-1 rounded-lg bg-sunk p-0.5"
          >
            {lists.map((l) => (
              <Tabs.Trigger
                key={l.key}
                value={l.key}
                className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium text-muted transition-colors hover:text-fg data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-card"
              >
                {l.label}
                <span className="tabular font-mono text-[11px] text-muted">
                  {formatNumber(l.items.length)}
                </span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchField
            id="account-search"
            value={query}
            onChange={setQuery}
            placeholder="Search usernames"
            className="flex-1"
          />
          <Select
            label="Sort accounts"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'recent', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'az', label: 'A to Z' },
            ]}
            className="h-10 sm:w-40"
          />
        </div>
        {lists.map((l) => (
          <Tabs.Content key={l.key} value={l.key} className="outline-none">
            <AccountList
              items={l.items}
              query={query}
              sort={sort}
              empty={l.empty}
              sample={current.source === 'sample'}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Panel>
  )
}

const PAGE = 60

function sortAccounts(items: Account[], sort: Sort) {
  const list = [...items]
  if (sort === 'az') return list.sort((a, b) => a.username.localeCompare(b.username))
  const dir = sort === 'recent' ? -1 : 1
  return list.sort(
    (a, b) => dir * ((a.ts ?? 0) - (b.ts ?? 0)) || a.username.localeCompare(b.username),
  )
}

function AccountList({
  items,
  query,
  sort,
  empty,
  sample,
}: {
  items: Account[]
  query: string
  sort: Sort
  empty: string
  sample: boolean
}) {
  const [limit, setLimit] = useState(PAGE)
  const q = query.trim().toLowerCase().replace(/^@/, '')
  const filtered = useMemo(
    () => sortAccounts(q ? items.filter((a) => a.username.includes(q)) : items, sort),
    [items, q, sort],
  )
  if (!items.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>
  if (!filtered.length)
    return <p className="py-6 text-center text-sm text-muted">No usernames match “{query}”.</p>
  return (
    <div className="flex flex-col gap-3">
      <ul
        className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 xl:grid-cols-3"
        data-testid="account-list"
      >
        {filtered.slice(0, limit).map((a) => (
          <AccountRow key={a.username} account={a} sample={sample} />
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
        <span className="tabular">
          Showing {formatNumber(Math.min(limit, filtered.length))} of{' '}
          {formatNumber(filtered.length)}
        </span>
        {filtered.length > limit && (
          <Button size="sm" onClick={() => setLimit((l) => l + PAGE * 2)}>
            Show more
          </Button>
        )}
      </div>
    </div>
  )
}

function AccountRow({ account, sample }: { account: Account; sample: boolean }) {
  const initials =
    account.username
      .replace(/[._\d]/g, '')
      .slice(0, 2)
      .toUpperCase() || '@'
  const body = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[11px] font-semibold text-accent-ink">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">@{account.username}</span>
        <span className="block text-[12px] text-muted">
          {account.ts ? `Since ${formatMonth(account.ts)}` : 'Date unknown'}
        </span>
      </span>
    </>
  )
  return (
    <li className="border-b border-line">
      {sample ? (
        <div className="flex items-center gap-3 py-2.5">{body}</div>
      ) : (
        <a
          href={`https://www.instagram.com/${account.username}/`}
          target="_blank"
          rel="noreferrer noopener"
          className="group flex items-center gap-3 py-2.5"
        >
          {body}
          <ExternalIcon
            size={14}
            className="text-faint opacity-0 transition-opacity group-hover:opacity-100"
          />
        </a>
      )}
    </li>
  )
}

function ComparePanel({ snaps }: { snaps: Snap[] }) {
  const input = useRef<HTMLInputElement>(null)
  const [fromId, setFromId] = useState(snaps[snaps.length - 2]?.id ?? '')
  const [toId, setToId] = useState(snaps[snaps.length - 1]!.id)
  const [tab, setTab] = useState<
    'lostFollowers' | 'newFollowers' | 'startedFollowing' | 'stoppedFollowing'
  >('lostFollowers')
  const from = snaps.find((s) => s.id === fromId)
  const to = snaps.find((s) => s.id === toId)

  if (snaps.length < 2 || !from || !to) {
    return (
      <Panel title="What changed" description="Compare two exports to see who unfollowed you">
        <EmptyState
          title="Add a second export to compare"
          className="py-8"
          actions={
            <>
              <input
                ref={input}
                type="file"
                multiple
                accept={ACCEPT}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])]
                  e.target.value = ''
                  void importFiles(files)
                }}
              />
              <Button onClick={() => input.current?.click()}>
                <UploadIcon size={16} /> Add another export
              </Button>
            </>
          }
        >
          Instagram doesn’t tell you who unfollowed you. Request a new export every few weeks and
          drop them all here; Unpacked compares any two.
        </EmptyState>
      </Panel>
    )
  }

  const [older, newer] = from.exportedAt <= to.exportedAt ? [from, to] : [to, from]
  const c = compare(older.summary, newer.summary)
  const sections = [
    { key: 'lostFollowers', label: 'Unfollowed you', items: c.lostFollowers, tone: 'warm' },
    { key: 'newFollowers', label: 'New followers', items: c.newFollowers, tone: 'accent' },
    { key: 'startedFollowing', label: 'You followed', items: c.startedFollowing, tone: 'default' },
    {
      key: 'stoppedFollowing',
      label: 'You unfollowed',
      items: c.stoppedFollowing,
      tone: 'default',
    },
  ] as const
  const options = snaps.map((s) => ({ value: s.id, label: formatDate(s.exportedAt) }))
  const active = sections.find((s) => s.key === tab)!

  return (
    <Panel
      title="What changed"
      description={`From ${formatDate(older.exportedAt)} to ${formatDate(newer.exportedAt)}`}
      actions={
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <Select
            label="Older export"
            value={fromId}
            onChange={setFromId}
            options={options}
            className="w-32"
          />
          <span aria-hidden="true">→</span>
          <Select
            label="Newer export"
            value={toId}
            onChange={setToId}
            options={options}
            className="w-32"
          />
        </div>
      }
    >
      {older.id === newer.id ? (
        <p className="text-sm text-muted">Pick two different exports to compare.</p>
      ) : (
        <>
          <div
            className="grid grid-cols-2 gap-2 lg:grid-cols-4"
            role="tablist"
            aria-label="Changes"
          >
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={tab === s.key}
                onClick={() => setTab(s.key)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors',
                  tab === s.key
                    ? 'border-accent bg-accent-soft/50'
                    : 'border-line hover:border-line-strong',
                )}
              >
                <span className="eyebrow">{s.label}</span>
                <span
                  className={cn(
                    'tabular font-display text-2xl font-semibold',
                    s.tone === 'warm' && 'text-warm',
                    s.tone === 'accent' && 'text-accent',
                  )}
                >
                  {formatNumber(s.items.length)}
                </span>
              </button>
            ))}
          </div>
          <div role="tabpanel" aria-label={active.label}>
            {active.items.length ? (
              <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
                {active.items.map((a) => (
                  <AccountRow key={a.username} account={a} sample={newer.source === 'sample'} />
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-muted">
                Nobody in this list between these two exports.
              </p>
            )}
          </div>
        </>
      )}
    </Panel>
  )
}

function GrowthPanel({ followers, following }: { followers: Account[]; following: Account[] }) {
  const [which, setWhich] = useState<'followers' | 'following'>('followers')
  const data = perYear(which === 'followers' ? followers : following)
  if (!data.length) return null
  return (
    <Panel
      title="When they started following"
      description={
        which === 'followers'
          ? 'Current followers, by the year they followed you'
          : 'Accounts you follow, by the year you followed them'
      }
      actions={
        <Segmented
          label="List to chart"
          value={which}
          onChange={setWhich}
          options={[
            { value: 'followers', label: 'Followers' },
            { value: 'following', label: 'Following' },
          ]}
        />
      }
    >
      <BarChart
        data={data.map((d) => ({ key: String(d.year), label: String(d.year), value: d.count }))}
        format={(v) => formatNumber(v)}
        summary={`${which === 'followers' ? 'Followers' : 'Following'} by year: ${plural(
          data.reduce((s, d) => s + d.count, 0),
          'account',
        )}.`}
        columns={['Year', 'Accounts']}
        tooltipLabel={(b) => `Started in ${b.label}`}
      />
    </Panel>
  )
}
