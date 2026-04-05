import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/stores/themeStore'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export function SettingsPage() {
  const { colorScheme, setColorScheme } = useTheme()

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage appearance and preferences for this demo.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-[var(--text-primary)]">Appearance</h2>
          <Separator />
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-[var(--bg-secondary)]/40 px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode" className="text-[var(--text-primary)]">
                Dark mode
              </Label>
              <p className="text-xs text-[var(--text-secondary)]">
                Turn off to use light theme. Your choice is saved on this device.
              </p>
            </div>
            <Checkbox
              id="dark-mode"
              checked={colorScheme === 'dark'}
              onCheckedChange={(checked) =>
                setColorScheme(checked === true ? 'dark' : 'light')
              }
              aria-label="Dark mode"
            />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
