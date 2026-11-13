import { Dialog } from 'radix-ui'
import { useEffect, useState } from 'react'
import { CloseIcon, DownloadIcon, ShareIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/controls'
import { Skeleton } from '@/components/ui/Panel'
import { type CardSpec, type CardTheme, renderCard } from './card'

export function ShareButton({ spec, fileName }: { spec: CardSpec; fileName: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm" data-testid="share-button">
          <ShareIcon size={15} /> Share card
        </Button>
      </Dialog.Trigger>
      {open && <ShareDialog spec={spec} fileName={fileName} />}
    </Dialog.Root>
  )
}

function ShareDialog({ spec, fileName }: { spec: CardSpec; fileName: string }) {
  const [theme, setTheme] = useState<CardTheme>('dark')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let made: string | null = null
    setBlob(null)
    setError(null)
    renderCard(spec, theme)
      .then((b) => {
        if (cancelled) return
        made = URL.createObjectURL(b)
        setBlob(b)
        setUrl(made)
      })
      .catch(
        () => !cancelled && setError('Your browser couldn’t draw the card. Try another browser.'),
      )
    return () => {
      cancelled = true
      if (made) URL.revokeObjectURL(made)
    }
  }, [spec, theme])

  const file = blob ? new File([blob], fileName, { type: 'image/png' }) : null
  const canShare =
    !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

  const download = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    setMessage('Saved to your downloads.')
  }
  const share = async () => {
    if (!file) return
    try {
      await navigator.share({ files: [file], title: 'My data, unpacked' })
    } catch (e) {
      if ((e as Error).name !== 'AbortError')
        setMessage('Sharing didn’t work here. Use Download instead.')
    }
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-[fade-up_.2s_ease]" />
      <Dialog.Content
        aria-describedby={undefined}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] flex-col gap-4 overflow-y-auto rounded-t-2xl border border-line bg-raised p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] shadow-pop animate-fade-up sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(560px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <Dialog.Title className="font-display text-lg font-semibold">Share card</Dialog.Title>
            <p className="text-[13px] text-muted">
              Made on your device. It only leaves when you share it.
            </p>
          </div>
          <Dialog.Close asChild>
            <IconButton label="Close" className="-mt-1 -mr-2">
              <CloseIcon />
            </IconButton>
          </Dialog.Close>
        </div>
        <Segmented
          label="Card style"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
          className="self-start"
        />
        <div className="mx-auto aspect-[4/5] w-full max-w-[340px] overflow-hidden rounded-xl border border-line bg-sunk">
          {error ? (
            <p className="p-6 text-sm text-danger">{error}</p>
          ) : url && blob ? (
            <img
              src={url}
              alt={`Share card: ${spec.big} ${spec.bigLabel}`}
              data-testid="share-preview"
              className="size-full object-cover"
            />
          ) : (
            <Skeleton className="size-full rounded-none" />
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {canShare && (
            <Button variant="secondary" onClick={share}>
              <ShareIcon size={16} /> Share
            </Button>
          )}
          <Button variant="primary" onClick={download} disabled={!url} data-testid="download-card">
            <DownloadIcon size={16} /> Download PNG
          </Button>
        </div>
        {message && (
          <p role="status" className="text-center text-[13px] text-muted">
            {message}
          </p>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  )
}
