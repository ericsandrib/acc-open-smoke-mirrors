import { AppShell } from '@/components/layout/AppShell'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { OpenAccountsVariantSwitcher } from '@/components/wizard/OpenAccountsVariantSwitcher'

export function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
      <OpenAccountsVariantSwitcher />
    </AppShell>
  )
}
