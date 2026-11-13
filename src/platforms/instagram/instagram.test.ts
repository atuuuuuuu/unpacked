import { describe, expect, it } from 'vitest'
import { compare, perYear, relations } from './insights'
import { instagramParser, toAccount } from './parse'
import { sampleInstagramExports } from './sample'

const ctx = {
  sourceName: 'instagram-someone-2024-08-02-AbCd.zip',
  sourceModified: 5,
  progress: () => {},
}
const dir = 'connections/followers_and_following'
const old = (u: string, t = 1_600_000_000) => ({
  title: '',
  media_list_data: [],
  string_list_data: [{ href: `https://www.instagram.com/${u}`, value: u, timestamp: t }],
})

describe('instagram accounts', () => {
  it('reads the classic shape', () => {
    expect(toAccount(old('Jane.Doe'))).toEqual({ username: 'jane.doe', ts: 1_600_000_000_000 })
  })
  it('reads the 2024+ shape with the username in title', () => {
    expect(
      toAccount({
        title: 'sam_k',
        string_list_data: [{ href: 'https://www.instagram.com/_u/sam_k', timestamp: 1 }],
      }),
    ).toEqual({ username: 'sam_k', ts: 1000 })
  })
  it('falls back to the profile link', () => {
    expect(
      toAccount({ string_list_data: [{ href: 'https://www.instagram.com/_u/from.href' }] }),
    ).toEqual({
      username: 'from.href',
      ts: null,
    })
  })
  it('rejects things that are not usernames', () => {
    expect(toAccount({ title: '<script>' })).toBeNull()
    expect(toAccount('nope')).toBeNull()
  })
})

describe('instagram select and diagnose', () => {
  it('needs both followers and following', () => {
    expect(instagramParser.select([`${dir}/followers_1.json`])).toEqual([])
    expect(
      instagramParser.select([`${dir}/followers_1.json`, `${dir}/following.json`, 'media/x.jpg']),
    ).toEqual([`${dir}/followers_1.json`, `${dir}/following.json`])
  })
  it('also finds the pre-2024 folder layout', () => {
    expect(
      instagramParser.select([
        'followers_and_following/followers.json',
        'followers_and_following/following.json',
      ]),
    ).toHaveLength(2)
  })
  it('explains HTML exports', () => {
    expect(instagramParser.diagnose?.([`${dir}/followers_1.html`])).toMatch(/JSON/)
  })
})

describe('instagram parse and insights', () => {
  const files = [
    { path: `${dir}/followers_1.json`, text: JSON.stringify([old('a'), old('b'), old('c')]) },
    { path: `${dir}/followers_2.json`, text: JSON.stringify([old('d'), old('a')]) },
    {
      path: `${dir}/following.json`,
      text: JSON.stringify({ relationships_following: [old('a'), old('x'), old('d')] }),
    },
  ]
  const { summary, exportedAt } = instagramParser.parse(files, ctx)

  it('merges follower pages and dedupes', () => {
    expect(summary.followers.map((a) => a.username)).toEqual(['a', 'b', 'c', 'd'])
    expect(summary.pending).toBeNull()
  })
  it('takes the export date from the file name', () => {
    expect(new Date(exportedAt!).getFullYear()).toBe(2024)
  })
  it('splits relations', () => {
    const r = relations(summary)
    expect(r.notFollowingBack.map((a) => a.username)).toEqual(['x'])
    expect(r.fans.map((a) => a.username)).toEqual(['b', 'c'])
    expect(r.mutuals.map((a) => a.username)).toEqual(['a', 'd'])
  })
  it('compares two exports', () => {
    const newer = {
      ...summary,
      followers: [
        { username: 'a', ts: null },
        { username: 'z', ts: null },
      ],
      following: [{ username: 'a', ts: null }],
    }
    const c = compare(summary, newer)
    expect(c.newFollowers.map((a) => a.username)).toEqual(['z'])
    expect(c.lostFollowers.map((a) => a.username)).toEqual(['b', 'c', 'd'])
    expect(c.stoppedFollowing.map((a) => a.username)).toEqual(['x', 'd'])
    expect(c.startedFollowing).toEqual([])
  })
  it('counts relationships per year without gaps', () => {
    const list = [
      { username: 'a', ts: Date.UTC(2019, 1) },
      { username: 'b', ts: Date.UTC(2021, 1) },
      { username: 'c', ts: null },
    ]
    expect(perYear(list)).toEqual([
      { year: 2019, count: 1 },
      { year: 2020, count: 0 },
      { year: 2021, count: 1 },
    ])
  })
})

describe('instagram sample', () => {
  it('has two snapshots with real differences', () => {
    const [a, b] = sampleInstagramExports().map(
      (x) => instagramParser.parse(x.files, { ...ctx, sourceName: x.name }).summary,
    )
    const c = compare(a!, b!)
    expect(a!.followers.length).toBeGreaterThan(300)
    expect(c.lostFollowers.length).toBeGreaterThan(0)
    expect(c.newFollowers.length).toBeGreaterThan(0)
    expect(c.stoppedFollowing.length).toBeGreaterThan(0)
    expect(b!.pending?.length).toBeGreaterThan(0)
  })
})
