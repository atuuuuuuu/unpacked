import type { Account, InstagramSnapshot } from './types'

export interface Relations {
  followers: Account[]
  following: Account[]
  /** You follow them, they don't follow you. */
  notFollowingBack: Account[]
  /** They follow you, you don't follow them. */
  fans: Account[]
  mutuals: Account[]
}

const names = (list: Account[]) => new Set(list.map((a) => a.username))

export function relations(s: InstagramSnapshot): Relations {
  const followers = names(s.followers)
  const following = names(s.following)
  return {
    followers: s.followers,
    following: s.following,
    notFollowingBack: s.following.filter((a) => !followers.has(a.username)),
    fans: s.followers.filter((a) => !following.has(a.username)),
    mutuals: s.following.filter((a) => followers.has(a.username)),
  }
}

export interface Comparison {
  newFollowers: Account[]
  lostFollowers: Account[]
  startedFollowing: Account[]
  stoppedFollowing: Account[]
}

/** What changed from an older export to a newer one. */
export function compare(older: InstagramSnapshot, newer: InstagramSnapshot): Comparison {
  const diff = (a: Account[], b: Account[]) => {
    const keep = names(b)
    return a.filter((x) => !keep.has(x.username))
  }
  return {
    newFollowers: diff(newer.followers, older.followers),
    lostFollowers: diff(older.followers, newer.followers),
    startedFollowing: diff(newer.following, older.following),
    stoppedFollowing: diff(older.following, newer.following),
  }
}

/** Accounts gained per year, from the date each relationship started. */
export function perYear(list: Account[]): { year: number; count: number }[] {
  const counts = new Map<number, number>()
  for (const a of list) {
    if (a.ts === null) continue
    const y = new Date(a.ts).getFullYear()
    counts.set(y, (counts.get(y) ?? 0) + 1)
  }
  const years = [...counts.keys()]
  if (!years.length) return []
  const out = []
  for (let y = Math.min(...years); y <= Math.max(...years); y++) {
    out.push({ year: y, count: counts.get(y) ?? 0 })
  }
  return out
}
