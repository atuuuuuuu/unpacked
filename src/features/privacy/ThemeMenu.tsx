import { DropdownMenu } from 'radix-ui'
import { setTheme, type ThemePref, useTheme } from '@/app/theme'
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from '@/components/icons'
import { IconButton } from '@/components/ui/Button'

const OPTIONS: { value: ThemePref; label: string; Icon: typeof SunIcon }[] = [
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
]

export function ThemeMenu() {
  const { pref, resolved } = useTheme()
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton label={`Theme: ${pref}`} data-testid="theme-menu">
          {resolved === 'dark' ? <MoonIcon /> : <SunIcon />}
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-40 rounded-lg border border-line bg-raised p-1 shadow-pop animate-fade-up"
        >
          <DropdownMenu.RadioGroup value={pref} onValueChange={(v) => setTheme(v as ThemePref)}>
            {OPTIONS.map(({ value, label, Icon }) => (
              <DropdownMenu.RadioItem
                key={value}
                value={value}
                className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[13px] outline-none data-[highlighted]:bg-sunk"
              >
                <Icon size={16} className="text-muted" />
                <span className="flex-1">{label}</span>
                <DropdownMenu.ItemIndicator className="text-accent">
                  <CheckIcon size={14} />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
