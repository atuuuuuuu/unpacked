export type ImportErrorCode =
  | 'not-supported' // not a ZIP or JSON file
  | 'not-recognized' // ZIP opened, but no known export inside
  | 'wrong-format' // recognized platform, but an unsupported variant (e.g. HTML instead of JSON)
  | 'format-changed' // files found, but their structure is not what we expect
  | 'corrupt' // ZIP could not be read
  | 'encrypted'
  | 'too-large'

/** An error the user can act on. `message` is shown as-is, so write it for people. */
export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    message: string,
    /** Anonymized file structure (keys and types only) for bug reports. Never contains values. */
    readonly report?: string,
  ) {
    super(message)
    this.name = 'ImportError'
  }
}

export interface SerializedImportError {
  code: ImportErrorCode | 'unknown'
  message: string
  report?: string
}

export function serializeError(e: unknown): SerializedImportError {
  if (e instanceof ImportError) return { code: e.code, message: e.message, report: e.report }
  return {
    code: 'unknown',
    message: 'Something went wrong while reading this file. Try again, or open an issue on GitHub.',
  }
}
