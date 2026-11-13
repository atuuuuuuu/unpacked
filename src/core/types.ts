import type { InstagramSnapshot } from '@/platforms/instagram/types'
import type { SpotifySummary } from '@/platforms/spotify/types'
import type { YouTubeSummary } from '@/platforms/youtube/types'

export type PlatformId = 'spotify' | 'instagram' | 'youtube'

export interface SummaryByPlatform {
  spotify: SpotifySummary
  instagram: InstagramSnapshot
  youtube: YouTubeSummary
}

/** One imported export, already reduced to what the dashboards need. Raw files are never kept. */
export type Dataset = {
  [P in PlatformId]: {
    id: string
    platform: P
    source: 'sample' | 'file'
    /** File name shown in the UI, e.g. "my_spotify_data.zip". */
    label: string
    /** When the export was made (best guess), epoch ms. */
    exportedAt: number
    importedAt: number
    summary: SummaryByPlatform[P]
    /** Records skipped because they did not match the expected format. */
    skipped: number
  }
}[PlatformId]

export type DatasetOf<P extends PlatformId> = Extract<Dataset, { platform: P }>

/** A file from inside an export, read as text. */
export interface ExportFile {
  path: string
  text: string
}

export interface ImportProgress {
  stage: 'reading' | 'extracting' | 'parsing' | 'summarizing'
  /** 0..1 */
  fraction: number
  detail?: string
}

export type ProgressFn = (p: ImportProgress) => void

/** Everything a platform plugin needs to provide to the import pipeline. Runs inside the worker. */
export interface PlatformParser<P extends PlatformId> {
  id: P
  /** Pick the files this platform needs from the paths inside an export. Empty = not this platform. */
  select(paths: string[]): string[]
  /** Explain why an export looks like this platform but can't be read (e.g. HTML format). */
  diagnose?(paths: string[]): string | null
  parse(
    files: ExportFile[],
    ctx: ParseContext,
  ): { summary: SummaryByPlatform[P]; skipped: number; exportedAt?: number }
}

export interface ParseContext {
  /** File name of the export, used to guess the export date. */
  sourceName: string
  /** Last-modified time of the export file. */
  sourceModified: number
  progress: ProgressFn
}
