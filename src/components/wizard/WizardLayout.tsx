import { StepSidebar } from './StepSidebar'
import { TaskContent } from './TaskContent'
import { DetailSidebar } from './DetailSidebar'
import { WizardFooter } from './WizardFooter'
import { HomeOfficeReviewFooter } from './HomeOfficeReviewFooter'
import { AmlReviewFooter } from './AmlReviewFooter'
import { HoKycReviewFooter } from './HoKycReviewFooter'
import { ChildActionSidebar } from './ChildActionSidebar'
import { ChildActionContent } from './ChildActionContent'
import { ChildActionFooter } from './ChildActionFooter'
import { ChildActionRightSidebar } from './ChildActionRightSidebar'
import { ChildHoDocumentViewContent } from './ChildHoDocumentViewContent'
import { ChildHoPrincipalViewContent } from './ChildHoPrincipalViewContent'
import { ChildHoKycViewContent } from './ChildHoKycViewContent'
import { ChildAmlReviewContent } from './ChildAmlReviewContent'
import { Eye, FileSearch, ShieldCheck, ShieldAlert, Building } from 'lucide-react'
import { VerticalNav } from '@/components/navigation/vertical-nav'
import { useWorkflow } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'

export function WizardLayout() {
  const { state, dispatch } = useWorkflow()
  const inChildAction = !!state.activeChildActionId
  const viewMode = state.demoViewMode
  const isSubmitted = !!state.submittedAt

  const isAdvisorView = viewMode === 'advisor'
  const isHoDocView = viewMode === 'ho-documents'
  const isHoPrincipalView = viewMode === 'ho-principal'
  const isHoKycView = viewMode === 'ho-kyc'
  const isAmlView = viewMode === 'aml'
  const isHomeOfficeView = isHoDocView || isHoPrincipalView

  const showViewToggle = inChildAction && isSubmitted

  const activeChild = inChildAction
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === state.activeChildActionId)
    : null
  const isKycChild = activeChild?.childType === 'kyc'

  return (
    <div className="flex h-screen bg-background">
      <VerticalNav defaultCollapsed />
      <div className="flex flex-col flex-1 min-w-0">
        {showViewToggle && (
          <header className="border-b border-border px-4 py-2 flex items-center justify-end shrink-0">
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
                Advisor
              </button>

              {isKycChild ? (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'aml' })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isAmlView
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    AML Team
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'ho-kyc' })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isHoKycView
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <Building className="h-3.5 w-3.5" />
                    Home Office
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'ho-documents' })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isHoDocView
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <FileSearch className="h-3.5 w-3.5" />
                    HO Document Team
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'ho-principal' })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isHoPrincipalView
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    HO Principal Team
                  </button>
                </>
              )}
            </div>
          </header>
        )}
        <div className="flex flex-1 overflow-hidden">
          {inChildAction ? (
            isAmlView ? (
              <>
                <ChildActionSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ChildAmlReviewContent />
                  <AmlReviewFooter />
                </div>
                <ChildActionRightSidebar />
              </>
            ) : isHoKycView ? (
              <>
                <ChildActionSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ChildHoKycViewContent />
                  <HoKycReviewFooter />
                </div>
                <ChildActionRightSidebar />
              </>
            ) : isHomeOfficeView ? (
              <>
                <ChildActionSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  {isHoDocView ? <ChildHoDocumentViewContent /> : <ChildHoPrincipalViewContent />}
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
