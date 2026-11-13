import { Select as RSelect, Switch as RSwitch, ToggleGroup } from 'radix-ui'
import type { ReactNode } from 'react'
import { CheckIcon, ChevronDownIcon, SearchIcon } from '@/components/icons'
import { cn } from '@/lib/cn'

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  label: string
  className?: string
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className={cn('inline-flex rounded-lg bg-sunk p-0.5', className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className="h-8 rounded-md px-3 text-[13px] font-medium text-muted transition-colors hover:text-fg data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-card"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
  className?: string
}) {
  return (
    <RSelect.Root value={value} onValueChange={(v) => onChange(v as T)}>
      <RSelect.Trigger
        aria-label={label}
        className={cn(
          'inline-flex h-8 min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-medium shadow-card transition-colors hover:border-line-strong data-[state=open]:border-accent',
          className,
        )}
      >
        <RSelect.Value />
        <RSelect.Icon className="text-muted">
          <ChevronDownIcon size={14} />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-[min(var(--radix-select-content-available-height),340px)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-line bg-raised p-1 shadow-pop animate-fade-up"
        >
          <RSelect.Viewport>
            {options.map((o) => (
              <RSelect.Item
                key={o.value}
                value={o.value}
                className="relative flex h-9 cursor-pointer select-none items-center rounded-md pr-8 pl-3 text-[13px] outline-none data-[highlighted]:bg-sunk data-[state=checked]:font-semibold"
              >
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
                <RSelect.ItemIndicator className="absolute right-2 text-accent">
                  <CheckIcon size={14} />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder,
  id,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  id: string
  className?: string
}) {
  return (
    <label htmlFor={id} className={cn('relative flex min-w-0 items-center', className)}>
      <span className="sr-only">{placeholder}</span>
      <SearchIcon size={16} className="pointer-events-none absolute left-3 text-muted" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="h-10 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm shadow-card outline-none transition-colors placeholder:text-faint focus:border-accent"
      />
    </label>
  )
}

export function Switch({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      <RSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-6 w-10 shrink-0 rounded-full bg-line-strong transition-colors data-[state=checked]:bg-accent"
      >
        <RSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
      </RSwitch.Root>
    </div>
  )
}
