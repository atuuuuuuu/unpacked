import { sampleInstagramExports } from '@/platforms/instagram/sample'
import { parsers } from '@/platforms/parsers'
import { SAMPLE_SPOTIFY_NAME, sampleSpotifyFiles } from '@/platforms/spotify/sample'
import { SAMPLE_YOUTUBE_NAME, sampleYouTubeFiles } from '@/platforms/youtube/sample'
import { ImportError } from './errors'
import { openSources, type Source } from './sources'
import type { Dataset, ExportFile, PlatformId, PlatformParser, ProgressFn } from './types'

export interface ImportOutcome {
  datasets: Dataset[]
  /** Problems with some of the dropped files when others worked. Written for people. */
  notes: string[]
}

const uid = () => crypto.randomUUID()

function run<P extends PlatformId>(
  parser: PlatformParser<P>,
  files: ExportFile[],
  meta: { name: string; modified: number; source: 'sample' | 'file' },
  progress: ProgressFn,
): Dataset {
  const { summary, skipped, exportedAt } = parser.parse(files, {
    sourceName: meta.name,
    sourceModified: meta.modified,
    progress,
  })
  return {
    id: uid(),
    platform: parser.id,
    source: meta.source,
    label: meta.name,
    exportedAt: exportedAt ?? meta.modified,
    importedAt: Date.now(),
    summary,
    skipped,
  } as Dataset
}

async function importSource(source: Source, progress: ProgressFn): Promise<Dataset> {
  for (const parser of parsers) {
    const paths = parser.select(source.paths)
    if (!paths.length) continue
    const total = paths.reduce((s, p) => s + source.sizeOf(p), 0) || 1
    let done = 0
    const files: ExportFile[] = []
    for (const path of paths) {
      const text = await source.read(path, (bytes) => {
        done += bytes
        progress({ stage: 'extracting', fraction: Math.min(1, done / total), detail: path })
      })
      files.push({ path, text })
    }
    return run(
      parser as PlatformParser<PlatformId>,
      files,
      { name: source.name, modified: source.lastModified, source: 'file' },
      progress,
    )
  }
  for (const parser of parsers) {
    const why = parser.diagnose?.(source.paths)
    if (why) throw new ImportError('wrong-format', why)
  }
  throw new ImportError(
    'not-recognized',
    `“${source.name}” isn’t a Spotify, Instagram or YouTube export we recognize. Check the export guides for which file to drop.`,
  )
}

/** Reads dropped files and returns one dataset per recognized export. */
export async function importFiles(files: File[], progress: ProgressFn): Promise<ImportOutcome> {
  progress({ stage: 'reading', fraction: 0 })
  const { sources, rejected } = await openSources(files)
  const notes = rejected.map((n) => `“${n}” was skipped: Unpacked reads ZIP and JSON files.`)
  if (!sources.length) {
    throw new ImportError(
      'not-supported',
      rejected.length === 1
        ? `“${rejected[0]}” isn’t a ZIP or JSON file. Drop the ZIP file you downloaded from Spotify, Instagram or Google.`
        : 'None of these files is a ZIP or JSON file. Drop the ZIP file you downloaded from Spotify, Instagram or Google.',
    )
  }
  const datasets: Dataset[] = []
  let firstError: unknown = null
  for (const source of sources) {
    try {
      datasets.push(await importSource(source, progress))
    } catch (e) {
      firstError ??= e
      if (e instanceof ImportError) notes.push(`${source.name}: ${e.message}`)
      else throw e
    } finally {
      await source.close()
    }
  }
  if (!datasets.length) throw firstError
  return { datasets, notes }
}

/** Builds the fictional sample through the same parsers as a real export. */
export function loadSample(platform: PlatformId, progress: ProgressFn): Dataset[] {
  const meta = (name: string, modified: number) => ({ name, modified, source: 'sample' as const })
  progress({ stage: 'parsing', fraction: 0.1 })
  const find = <P extends PlatformId>(id: P) =>
    parsers.find((p) => p.id === id) as unknown as PlatformParser<P>
  switch (platform) {
    case 'spotify':
      return [
        run(
          find('spotify'),
          sampleSpotifyFiles(),
          meta(SAMPLE_SPOTIFY_NAME, new Date(2026, 10, 2).getTime()),
          progress,
        ),
      ]
    case 'youtube':
      return [
        run(
          find('youtube'),
          sampleYouTubeFiles(),
          meta(SAMPLE_YOUTUBE_NAME, new Date(2026, 10, 2).getTime()),
          progress,
        ),
      ]
    case 'instagram':
      return sampleInstagramExports().map((x) =>
        run(find('instagram'), x.files, meta(x.name, x.date.getTime()), progress),
      )
  }
}
