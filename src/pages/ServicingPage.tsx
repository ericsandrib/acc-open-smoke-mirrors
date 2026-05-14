import { AppShell } from '@/components/layout/AppShell'
import { ServicingContent } from '@/components/servicing/ServicingContent'
import { AdvisorReviewerPerspectiveCard } from '@/components/wizard/AdvisorReviewerPerspectiveCard'

export function ServicingPage() {
  return (
    <>
      <AppShell>
        <ServicingContent />
      </AppShell>
      <AdvisorReviewerPerspectiveCard />
    </>
  )
}
