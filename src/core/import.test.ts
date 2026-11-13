import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js'
import { describe, expect, it } from 'vitest'
import { sampleSpotifyFiles } from '@/platforms/spotify/sample'
import { ImportError } from './errors'
import { importFiles, loadSample } from './import'
import { describeShape } from './structure'

async function zip(name: string, files: Record<string, string>): Promise<File> {
  const writer = new ZipWriter(new BlobWriter('application/zip'))
  for (const [path, text] of Object.entries(files)) await writer.add(path, new TextReader(text))
  return new File([await writer.close()], name, { lastModified: Date.UTC(2026, 0, 2) })
}

const noop = () => {}
const dir = 'connections/followers_and_following'
const igEntry = (u: string) => ({ string_list_data: [{ value: u, href: '', timestamp: 1 }] })

describe('importFiles', () => {
  it('detects Spotify inside a ZIP and reports progress', async () => {
    const files = Object.fromEntries(
      sampleSpotifyFiles()
        .slice(0, 2)
        .map((f) => [f.path, f.text]),
    )
    const stages = new Set<string>()
    const out = await importFiles([await zip('my_spotify_data.zip', files)], (p) =>
      stages.add(p.stage),
    )
    expect(out.datasets).toHaveLength(1)
    expect(out.datasets[0]).toMatchObject({
      platform: 'spotify',
      source: 'file',
      label: 'my_spotify_data.zip',
    })
    expect([...stages]).toEqual(expect.arrayContaining(['reading', 'extracting', 'parsing']))
  })

  it('reads several Instagram exports in one drop', async () => {
    const make = (name: string, followers: string[]) =>
      zip(name, {
        [`${dir}/followers_1.json`]: JSON.stringify(followers.map(igEntry)),
        [`${dir}/following.json`]: JSON.stringify({ relationships_following: [igEntry('a')] }),
        'media/photo.jpg': 'not really a jpg',
      })
    const out = await importFiles(
      [
        await make('instagram-me-2024-01-01-x.zip', ['a']),
        await make('instagram-me-2024-06-01-x.zip', ['a', 'b']),
      ],
      noop,
    )
    expect(out.datasets.map((d) => d.platform)).toEqual(['instagram', 'instagram'])
  })

  it('groups loose JSON files into one export', async () => {
    const files = sampleSpotifyFiles()
      .slice(0, 3)
      .map((f) => new File([f.text], f.path.split('/').pop()!))
    const out = await importFiles(files, noop)
    expect(out.datasets).toHaveLength(1)
    expect(out.datasets[0]!.label).toBe('3 JSON files')
  })

  it('rejects files that are not ZIP or JSON', async () => {
    await expect(importFiles([new File(['hello'], 'notes.txt')], noop)).rejects.toMatchObject({
      code: 'not-supported',
    })
  })

  it('rejects a damaged ZIP', async () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5, 6, 7, 8])
    await expect(importFiles([new File([bytes], 'broken.zip')], noop)).rejects.toMatchObject({
      code: 'corrupt',
    })
  })

  it('explains a ZIP from somewhere else', async () => {
    const f = await zip('photos.zip', { 'IMG_0001.txt': 'x' })
    await expect(importFiles([f], noop)).rejects.toMatchObject({ code: 'not-recognized' })
  })

  it('explains an Instagram export in HTML format', async () => {
    const f = await zip('instagram.zip', {
      [`${dir}/followers_1.html`]: '<html></html>',
      [`${dir}/following.html`]: '',
    })
    const err = await importFiles([f], noop).catch((e) => e)
    expect(err).toBeInstanceOf(ImportError)
    expect(err.code).toBe('wrong-format')
    expect(err.message).toMatch(/JSON/)
  })

  it('keeps the good export and notes the bad one', async () => {
    const good = await zip('ig.zip', {
      [`${dir}/followers_1.json`]: JSON.stringify([igEntry('a')]),
      [`${dir}/following.json`]: JSON.stringify([igEntry('a')]),
    })
    const out = await importFiles([good, new File(['x'], 'readme.txt')], noop)
    expect(out.datasets).toHaveLength(1)
    expect(out.notes[0]).toMatch(/readme\.txt/)
  })
})

describe('loadSample', () => {
  it('builds every platform through the real parsers', () => {
    expect(loadSample('spotify', noop)[0]!.source).toBe('sample')
    expect(loadSample('instagram', noop)).toHaveLength(2)
    expect(loadSample('youtube', noop)[0]!.platform).toBe('youtube')
  })
})

describe('describeShape', () => {
  it('keeps keys and types but no values', () => {
    const shape = JSON.stringify(
      describeShape({ name: 'Secret', list: [{ n: 1 }, { n: 2 }], 'user@mail.com': true }),
    )
    expect(shape).not.toMatch(/Secret|mail/)
    expect(shape).toContain('"name":"string"')
  })
})
