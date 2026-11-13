export interface Account {
  /** Lowercase Instagram username. */
  username: string
  /** When the relationship started (epoch ms), if the export says. */
  ts: number | null
}

/** The relationship lists from one Instagram export. */
export interface InstagramSnapshot {
  followers: Account[]
  following: Account[]
  /** Follow requests you sent that are still pending. Null when the export doesn't include them. */
  pending: Account[] | null
  /** Accounts you unfollowed recently, as listed by Instagram. Null when not included. */
  recentlyUnfollowed: Account[] | null
}
