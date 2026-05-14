import { AppShell } from '@/components/layout/AppShell'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { AdvisorReviewerPerspectiveCard } from '@/components/wizard/AdvisorReviewerPerspectiveCard'

export function DashboardPage() {
  return (
    <>
      <AppShell>
        <DashboardContent />
      </AppShell>
      <AdvisorReviewerPerspectiveCard />
    </>
  )
}
