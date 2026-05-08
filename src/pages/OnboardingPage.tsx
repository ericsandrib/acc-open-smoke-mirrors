import { AppShell } from '@/components/layout/AppShell'
import { OnboardingContent } from '@/components/servicing/OnboardingContent'
import { OpenAccountsVariantSwitcher } from '@/components/wizard/OpenAccountsVariantSwitcher'

export function OnboardingPage() {
  return (
    <AppShell>
      <OnboardingContent />
      <OpenAccountsVariantSwitcher />
    </AppShell>
  )
}
