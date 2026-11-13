import { cn } from '@/lib/cn'

/** The Unpacked mark: an open box. The orange stroke is the lid's open seam. */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M3.5 7.75 12 3.25l8.5 4.5v8.5L12 20.75l-8.5-4.5z"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m3.5 7.75 8.5 4.5 8.5-4.5M12 12.25v8.5"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 3.25v4.5" stroke="var(--warm)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-display text-[17px] font-semibold tracking-tight',
        className,
      )}
    >
      <LogoMark />
      Unpacked
    </span>
  )
}
