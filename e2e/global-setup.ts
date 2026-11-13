import { mkdirSync, writeFileSync } from 'node:fs'
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js'
import { sampleInstagramExports } from '../src/platforms/instagram/sample'
import { sampleSpotifyFiles } from '../src/platforms/spotify/sample'
import { sampleYouTubeFiles } from '../src/platforms/youtube/sample'

export const FIXTURES = 'e2e/.fixtures'

async function zip(name: string, files: { path: string; text: string }[]) {
  const writer = new ZipWriter(new BlobWriter('application/zip'))
  for (const f of files) await writer.add(f.path, new TextReader(f.text))
  const blob = await writer.close()
  writeFileSync(`${FIXTURES}/${name}`, Buffer.from(await blob.arrayBuffer()))
}

/** Builds realistic export ZIPs (with fictional data) so tests exercise the real upload path. */
export default async function globalSetup() {
  mkdirSync(FIXTURES, { recursive: true })
  await zip('my_spotify_data.zip', [
    ...sampleSpotifyFiles(),
    {
      path: 'Spotify Extended Streaming History/ReadMeFirst_ExtendedStreamingHistory.pdf',
      text: '%PDF-1.4',
    },
  ])
  const [a, b] = sampleInstagramExports()
  await zip('instagram-tester-2026-08-02-AbCd.zip', [
    ...a!.files,
    { path: 'media/posts/1.jpg', text: 'jpg' },
  ])
  await zip('instagram-tester-2026-11-01-EfGh.zip', b!.files)
  await zip('takeout-20261102T101010Z-001.zip', sampleYouTubeFiles())
  await zip('instagram-html.zip', [
    { path: 'connections/followers_and_following/followers_1.html', text: '<html></html>' },
    { path: 'connections/followers_and_following/following.html', text: '<html></html>' },
  ])
  await zip('holiday-photos.zip', [{ path: 'IMG_0001.txt', text: 'not an export' }])
  writeFileSync(`${FIXTURES}/notes.txt`, 'hello')
}
