import { StepSidebar } from './StepSidebar'
import { TaskContent } from './TaskContent'
import { DetailSidebar } from './DetailSidebar'
import { WizardFooter } from './WizardFooter'
import { HomeOfficeReviewFooter } from './HomeOfficeReviewFooter'
import { ChildActionSidebar } from './ChildActionSidebar'
import { ChildActionContent } from './ChildActionContent'
import { ChildActionFooter } from './ChildActionFooter'
import { ChildActionDetailSidebar } from './ChildActionDetailSidebar'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { GitBranch } from 'lucide-react'
import { VerticalNav } from '@/components/navigation/vertical-nav'
import { useWorkflow } from '@/stores/workflowStore'

export function WizardLayout() {
  const navigate = useNavigate()
  const { state } = useWorkflow()
  const inChildAction = !!state.activeChildActionId
  const inReview = state.reviewState?.reviewStatus === 'pending'

  return (
    <div className="flex h-screen bg-background">
      <VerticalNav defaultCollapsed />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
          <h1 className="text-sm font-semibold text-foreground">Account Opening</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/workflow')}>
            <GitBranch className="h-4 w-4 mr-1" />
            View Workflow
          </Button>
        </header>
        <div className="flex flex-1 overflow-hidden">
          {inChildAction ? <ChildActionSidebar /> : <StepSidebar />}
          <div className="flex-1 flex flex-col overflow-hidden">
            {inChildAction ? <ChildActionContent /> : <TaskContent />}
            {inChildAction ? <ChildActionFooter /> : inReview ? <HomeOfficeReviewFooter /> : <WizardFooter />}
          </div>
          {inChildAction ? <ChildActionDetailSidebar /> : <DetailSidebar />}
        </div>
      </div>
    </div>
  )
}
