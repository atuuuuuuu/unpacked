import { ImportError } from '@/core/errors'
import { structureReport } from '@/core/structure'
import { dateFromName } from '@/core/time'
import type { ExportFile, PlatformParser } from '@/core/types'
import { type RelationEntry, relationEntry } from './schema'
import type { Account, InstagramSnapshot } from './types'

const DIR = /(^|\/)followers_and_following\//
const FOLLOWERS = /followers(_\d+)?\.json$/i
const FOLLOWING = /following\.json$/i
const PENDING = /pending_follow_requests\.json$/i
const UNFOLLOWED = /recently_unfollowed_(profiles|accounts)\.json$/i

export const instagramParser: PlatformParser<'instagram'> = {
  id: 'instagram',
  select(paths) {
    const rel = paths.filter((p) => DIR.test(p))
    if (!rel.some((p) => FOLLOWERS.test(p)) || !rel.some((p) => FOLLOWING.test(p))) return []
    return rel.filter((p) => [FOLLOWERS, FOLLOWING, PENDING, UNFOLLOWED].some((re) => re.test(p)))
  },
  diagnose(paths) {
    if (paths.some((p) => DIR.test(p) && /\.html$/i.test(p))) {
      return 'This Instagram export is in HTML format. Request a new one and choose JSON as the format (Download your information → Format: JSON).'
    }
    if (paths.some((p) => /(^|\/)(your_instagram_activity|personal_information)\//.test(p))) {
      return 'This Instagram export doesn’t include your followers. Request a new one and tick “Followers and following”.'
    }
    return null
  },
  parse(files, ctx) {
    const pick = (re: RegExp) => files.filter((f) => re.test(f.path))
    let skipped = 0
    const read = (list: ExportFile[]) => {
      const out = new Map<string, Account>()
      for (const f of list) {
        for (const entry of entries(f)) {
          const acc = toAccount(entry)
          if (acc) out.set(acc.username, acc)
          else skipped++
        }
      }
      return [...out.values()]
    }
    ctx.progress({ stage: 'parsing', fraction: 0.2 })
    const followers = read(pick(FOLLOWERS))
    const following = read(pick(FOLLOWING))
    const pendingFiles = pick(PENDING)
    const unfollowedFiles = pick(UNFOLLOWED)
    if (!followers.length && !following.length) {
      throw new ImportError(
        'format-changed',
        'We found Instagram follower files, but couldn’t read any accounts from them. Instagram may have changed the format. Please open an issue and paste the format report below.',
        structureReport(files.slice(0, 2).map((f) => ({ path: f.path, json: tryJson(f.text) }))),
      )
    }
    return {
      summary: {
        followers,
        following,
        pending: pendingFiles.length ? read(pendingFiles) : null,
        recentlyUnfollowed: unfollowedFiles.length ? read(unfollowedFiles) : null,
      } satisfies InstagramSnapshot,
      skipped,
      exportedAt: dateFromName(ctx.sourceName) ?? ctx.sourceModified,
    }
  },
}

function tryJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return 'invalid JSON'
  }
}

/** Files are either a bare array or {"relationships_following": [...]}-style objects. */
function entries(file: ExportFile): unknown[] {
  const json = tryJson(file.text)
  if (Array.isArray(json)) return json
  if (json && typeof json === 'object') {
    const list = Object.values(json).find(Array.isArray)
    if (list) return list
  }
  throw new ImportError(
    'format-changed',
    `“${file.path.split('/').pop()}” doesn’t look like an Instagram account list. Instagram may have changed the format. Please open an issue and paste the format report below.`,
    structureReport([{ path: file.path, json }]),
  )
}

export function toAccount(raw: unknown): Account | null {
  const r = relationEntry.safeParse(raw)
  if (!r.success) return null
  const e: RelationEntry = r.data
  const s = e.string_list_data?.[0]
  const fromHref = s?.href?.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/i)?.[1]
  const username = (s?.value || e.title || fromHref || '').trim().toLowerCase()
  if (!/^[a-z0-9._]{1,30}$/.test(username)) return null
  return { username, ts: s?.timestamp ? s.timestamp * 1000 : null }
}
