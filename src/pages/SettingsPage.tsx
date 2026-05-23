import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useWorkflow } from '@/stores/workflowStore'
import { useTheme } from '@/stores/themeStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { kycWorkflowModeLabel, type KycWorkflowMode } from '@/utils/kycWorkflowMode'
import { WORKFLOW_STORAGE_SCHEMA_KEY } from '@/utils/workflowStorageMigration'
import {
  clearDemoAccountNumberOverrides,
  DEMO_ACCOUNT_NUMBER_OVERRIDES_EXAMPLE,
  seedDefaultDemoAccountNumberOverrides,
  exportAccountNumbersSnapshot,
  readDemoAccountNumberOverrides,
  writeDemoAccountNumberOverrides,
  type DemoAccountNumberOverrides,
} from '@/utils/demoAccountNumberOverrides'

const WORKFLOW_STORAGE_KEY = 'demo-workflow-state'
const SAVED_ONBOARDING_JOURNEYS_KEY = 'demo-saved-onboarding-journeys'
const LAST_CREATED_JOURNEY_KEY = 'demo-last-created-journey-id'

export function SettingsPage() {
  const { state } = useWorkflow()
  const {
    colorScheme,
    setColorScheme,
    showNestedGroups,
    setShowNestedGroups,
    kycWorkflowMode,
    setKycWorkflowMode,
  } = useTheme()
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [overridesJson, setOverridesJson] = useState(() => {
    const existing = readDemoAccountNumberOverrides()
    return existing
      ? JSON.stringify(existing, null, 2)
      : JSON.stringify(DEMO_ACCOUNT_NUMBER_OVERRIDES_EXAMPLE, null, 2)
  })

  const handleResetDemo = () => {
    try {
      window.localStorage.removeItem(WORKFLOW_STORAGE_KEY)
      window.localStorage.removeItem(WORKFLOW_STORAGE_SCHEMA_KEY)
      window.localStorage.removeItem(SAVED_ONBOARDING_JOURNEYS_KEY)
      window.localStorage.removeItem(LAST_CREATED_JOURNEY_KEY)
      clearDemoAccountNumberOverrides()
      seedDefaultDemoAccountNumberOverrides()
    } catch {
      // ignore localStorage failures (e.g. Safari private mode) — reload still resets in-memory state.
    }
    window.location.reload()
  }

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
          <h2 className="text-sm font-medium text-foreground">Onboarding workflow</h2>
          <Separator />
          <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm space-y-2">
            <Label htmlFor="kyc-workflow-mode" className="text-foreground">
              KYC orchestration
            </Label>
            <p className="text-xs text-muted-foreground">
              Separate mode uses dedicated KYC and account child workflows in the onboarding Journeys list.
              Single-flow embeds owner KYC, AML, and CIP in the wizard and shows only top-level actions on Journeys.
            </p>
            <Select
              value={kycWorkflowMode}
              onValueChange={(v) => setKycWorkflowMode(v as KycWorkflowMode)}
            >
              <SelectTrigger id="kyc-workflow-mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="separate">{kycWorkflowModeLabel('separate')}</SelectItem>
                <SelectItem value="single-flow">{kycWorkflowModeLabel('single-flow')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

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
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">Demo data</h2>
          <Separator />
          <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm space-y-3">
            <div className="space-y-0.5">
              <Label className="text-foreground">Account number overrides</Label>
              <p className="text-xs text-muted-foreground">
                Pin custodian account numbers for screenshots. Applied on each page load after
                repairs. The first three accounts added on Open Accounts automatically get tails
                …9712, …9714, …9716; overrides fix numbers after recreate or reset.
              </p>
            </div>
            <textarea
              className="min-h-[10rem] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              value={overridesJson}
              onChange={(e) => setOverridesJson(e.target.value)}
              spellCheck={false}
              aria-label="Account number overrides JSON"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const snapshot = exportAccountNumbersSnapshot(state)
                  const text = JSON.stringify(snapshot, null, 2)
                  setOverridesJson(text)
                  void navigator.clipboard.writeText(text)
                  toast.success('Exported current account numbers to clipboard')
                }}
              >
                Export from workflow
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(overridesJson) as DemoAccountNumberOverrides
                    if (parsed.version !== 1) {
                      toast.error('Overrides must include "version": 1')
                      return
                    }
                    writeDemoAccountNumberOverrides(parsed)
                    toast.success('Overrides saved — reload to apply')
                  } catch {
                    toast.error('Invalid JSON')
                  }
                }}
              >
                Save overrides
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearDemoAccountNumberOverrides()
                  setOverridesJson(JSON.stringify(DEMO_ACCOUNT_NUMBER_OVERRIDES_EXAMPLE, null, 2))
                  toast.message('Overrides cleared — reload to stop applying')
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-foreground">Reset demo</Label>
              <p className="text-xs text-muted-foreground">
                Clears the persisted workflow state and reloads the app. Useful for starting the
                demo from a clean John Smith household with no created accounts.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/5"
              onClick={() => setResetConfirmOpen(true)}
            >
              Reset demo
            </Button>
          </div>
        </section>
      </div>

      <Dialog
        open={resetConfirmOpen}
        onOpenChange={(open) => !open && setResetConfirmOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset the demo?</DialogTitle>
            <DialogDescription>
              This clears the persisted workflow state (created accounts, KYC results, review
              dispositions, journey activity) and reloads the app. The seeded John Smith household
              will be restored to its default starting state. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleResetDemo}
            >
              Reset and reload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
