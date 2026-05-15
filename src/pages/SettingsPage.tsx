import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/stores/themeStore'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export function SettingsPage() {
  const {
    colorScheme,
    setColorScheme,
    showNestedGroups,
    setShowNestedGroups,
    hideOnboardingJourneyChildWorkflows,
    setHideOnboardingJourneyChildWorkflows,
  } = useTheme()

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage appearance and preferences for this demo.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">Appearance</h2>
          <Separator />
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode" className="text-foreground">
                Dark mode
              </Label>
              <p className="text-xs text-muted-foreground">
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

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">Onboarding table</h2>
          <Separator />
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="show-nested-groups" className="text-foreground">
                Show nested workflow groups
              </Label>
              <p className="text-xs text-muted-foreground">
                Display Funding &amp; Asset Movement and Features &amp; Services groups under each account in the onboarding table.
              </p>
            </div>
            <Checkbox
              id="show-nested-groups"
              checked={showNestedGroups}
              onCheckedChange={(checked) => setShowNestedGroups(checked === true)}
              aria-label="Show nested workflow groups"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="hide-journey-child-workflows" className="text-foreground">
                Hide KYC, Accounts, and child workflows
              </Label>
              <p className="text-xs text-muted-foreground">
                In the Onboarding Journeys tab, show only top-level actions (e.g. Client Setup, Open Accounts) — hide KYC Reviews and Accounts section headers and their child workflow rows.
              </p>
            </div>
            <Checkbox
              id="hide-journey-child-workflows"
              checked={hideOnboardingJourneyChildWorkflows}
              onCheckedChange={(checked) => setHideOnboardingJourneyChildWorkflows(checked === true)}
              aria-label="Hide KYC, Accounts, and child workflows in onboarding journeys"
            />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
