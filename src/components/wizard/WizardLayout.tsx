import { StepSidebar } from './StepSidebar'
import { TaskContent } from './TaskContent'
import { DetailSidebar } from './DetailSidebar'
import { WizardFooter } from './WizardFooter'
import { HomeOfficeReviewFooter } from './HomeOfficeReviewFooter'
import { ChildActionSidebar } from './ChildActionSidebar'
import { ChildActionContent } from './ChildActionContent'
import { ChildActionFooter } from './ChildActionFooter'
import { ChildActionRightSidebar } from './ChildActionRightSidebar'
import { ChildHomeOfficeViewContent } from './ChildHomeOfficeViewContent'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { GitBranch, Eye } from 'lucide-react'
import { VerticalNav } from '@/components/navigation/vertical-nav'
import { useWorkflow } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'

export function WizardLayout() {
  const navigate = useNavigate()
  const { state, dispatch } = useWorkflow()
  const inChildAction = !!state.activeChildActionId
  const viewMode = state.demoViewMode
  const isSubmitted = !!state.submittedAt

  const isAdvisorView = viewMode === 'advisor'
  const isHomeOfficeView = viewMode === 'home-office'

  const showViewToggle = inChildAction && isSubmitted

  return (
    <div className="flex h-screen bg-background">
      <VerticalNav defaultCollapsed />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
          <h1 className="text-sm font-semibold text-foreground">Account Opening</h1>
          <div className="flex items-center gap-2">
            {showViewToggle && (
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'advisor' })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    isAdvisorView
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Advisor View
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'home-office' })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    isHomeOfficeView
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Home Office View
                </button>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate('/workflow')}>
              <GitBranch className="h-4 w-4 mr-1" />
              View Workflow
            </Button>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          {inChildAction ? (
            isHomeOfficeView ? (
              <>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ChildHomeOfficeViewContent />
                  <HomeOfficeReviewFooter />
                </div>
                <ChildActionRightSidebar />
              </>
            ) : (
              <>
                <ChildActionSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ChildActionContent />
                  <ChildActionFooter />
                </div>
                <ChildActionRightSidebar />
              </>
            )
          ) : (
            <>
              <StepSidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <TaskContent />
                <WizardFooter />
              </div>
              <DetailSidebar />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
