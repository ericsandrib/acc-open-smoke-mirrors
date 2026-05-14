import { AppShell } from '@/components/layout/AppShell'
import { OnboardingContent } from '@/components/servicing/OnboardingContent'
import { AdvisorReviewerPerspectiveCard } from '@/components/wizard/AdvisorReviewerPerspectiveCard'

export function OnboardingPage() {
  return (
    <>
      <AppShell>
        <OnboardingContent />
      </AppShell>
      <AdvisorReviewerPerspectiveCard />
    </>
  )
}
