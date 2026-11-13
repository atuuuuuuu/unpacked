import { BlobReader, configure, type FileEntry, Writer, ZipReader } from '@zip.js/zip.js'
import { ImportError } from './errors'

// We already run inside a worker, and nested blob workers would need a looser CSP.
configure({ useWebWorkers: false })

/** Largest single file we will decompress. Watch history for a heavy user is ~150 MB. */
export const MAX_ENTRY_BYTES = 400 * 1024 * 1024
/** Upper bound on everything we decompress from one export (zip bomb guard). */
export const MAX_TOTAL_BYTES = 1024 * 1024 * 1024

/** A readable export: one ZIP, or a group of loose JSON files that were dropped together. */
export interface Source {
  name: string
  lastModified: number
  paths: string[]
  sizeOf(path: string): number
  read(path: string, onBytes?: (bytes: number) => void): Promise<string>
  close(): Promise<void>
}

/** Collects decompressed bytes and aborts as soon as a limit is crossed, whatever the ZIP claims. */
class CappedTextWriter extends Writer<string> {
  private chunks: Uint8Array[] = []
  private bytes = 0
  constructor(
    private readonly cap: number,
    private readonly onBytes?: (bytes: number) => void,
  ) {
    super()
  }
  override writeUint8Array(array: Uint8Array) {
    this.bytes += array.length
    if (this.bytes > this.cap) throw tooLarge()
    this.chunks.push(array)
    this.onBytes?.(array.length)
  }
  override getData() {
    const decoder = new TextDecoder()
    let out = ''
    for (const c of this.chunks) out += decoder.decode(c, { stream: true })
    return out + decoder.decode()
  }
}

const tooLarge = () =>
  new ImportError(
    'too-large',
    'A file inside this export is too large to read in the browser. Request a smaller export (for example only the history or only followers) and try again.',
  )

const isJunk = (p: string) =>
  p.startsWith('__MACOSX/') ||
  p.endsWith('.DS_Store') ||
  p.split('/').some((s) => s.startsWith('._'))

async function looksLikeZip(file: Blob): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  return head[0] === 0x50 && head[1] === 0x4b && (head[2] === 3 || head[2] === 5) // "PK\3\4" or empty "PK\5\6"
}

async function openZip(file: File): Promise<Source> {
  const reader = new ZipReader(new BlobReader(file))
  let entries: FileEntry[]
  try {
    entries = (await reader.getEntries()).filter((e): e is FileEntry => !e.directory)
  } catch {
    await reader.close().catch(() => {})
    throw new ImportError(
      'corrupt',
      `“${file.name}” looks like a ZIP file but can’t be opened. It may be incomplete; try downloading it again.`,
    )
  }
  const byPath = new Map<string, FileEntry>()
  for (const e of entries) {
    const path = e.filename.replace(/\\/g, '/')
    if (!isJunk(path)) byPath.set(path, e)
  }
  let total = 0
  return {
    name: file.name,
    lastModified: file.lastModified,
    paths: [...byPath.keys()],
    sizeOf: (p) => byPath.get(p)?.uncompressedSize ?? 0,
    async read(path, onBytes) {
      const entry = byPath.get(path)
      if (!entry) throw new Error(`missing entry ${path}`)
      if (entry.encrypted) {
        throw new ImportError(
          'encrypted',
          'This export is password-protected. Unpacked can only read unencrypted exports.',
        )
      }
      if (entry.uncompressedSize > MAX_ENTRY_BYTES) throw tooLarge()
      const remaining = MAX_TOTAL_BYTES - total
      const writer = new CappedTextWriter(Math.min(MAX_ENTRY_BYTES, remaining), onBytes)
      try {
        const text = await entry.getData(writer)
        total += text.length
        return text
      } catch (e) {
        if (e instanceof ImportError) throw e
        throw new ImportError(
          'corrupt',
          `Part of “${file.name}” is damaged and can’t be read. Try downloading the export again.`,
        )
      }
    },
    close: () => reader.close(),
  }
}

function jsonGroup(files: File[]): Source {
  const byPath = new Map(files.map((f) => [f.name, f]))
  return {
    name: files.length === 1 ? files[0]!.name : `${files.length} JSON files`,
    lastModified: Math.max(...files.map((f) => f.lastModified)),
    paths: [...byPath.keys()],
    sizeOf: (p) => byPath.get(p)?.size ?? 0,
    async read(path, onBytes) {
      const f = byPath.get(path)
      if (!f) throw new Error(`missing file ${path}`)
      if (f.size > MAX_ENTRY_BYTES) throw tooLarge()
      const text = await f.text()
      onBytes?.(f.size)
      return text
    },
    close: async () => {},
  }
}

/**
 * Turns dropped files into sources. Each ZIP is its own source; loose JSON files are grouped,
 * because people often unzip a Spotify export and drop all of its JSON files at once.
 */
export async function openSources(
  files: File[],
): Promise<{ sources: Source[]; rejected: string[] }> {
  const sources: Source[] = []
  const loose: File[] = []
  const rejected: string[] = []
  for (const f of files) {
    if (await looksLikeZip(f)) sources.push(await openZip(f))
    else if (/\.json$/i.test(f.name)) loose.push(f)
    else rejected.push(f.name)
  }
  if (loose.length) sources.push(jsonGroup(loose))
  return { sources, rejected }
}
