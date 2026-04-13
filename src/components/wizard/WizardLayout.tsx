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
import { ChildHoPrincipalKycContent } from './ChildHoPrincipalKycContent'
import { ChildAmlReviewContent } from './ChildAmlReviewContent'
import { HoPrincipalKycFooter } from './HoPrincipalKycFooter'
import { useState } from 'react'
import { Eye, FileSearch, ShieldCheck, ShieldAlert, Building } from 'lucide-react'
import { VerticalNav } from '@/components/navigation/vertical-nav'
import { ComposeDialog } from '@/components/dashboard/ComposeDialog'
import { useWorkflow } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { WizardRightPanelProvider } from '@/components/wizard/wizardRightPanelContext'

export function WizardLayout() {
  const { state, dispatch } = useWorkflow()
  const [composeOpen, setComposeOpen] = useState(false)
  const inChildAction = !!state.activeChildActionId
  const viewMode = state.demoViewMode

  const activeChild = inChildAction
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === state.activeChildActionId)
    : null
  const isKycChild = activeChild?.childType === 'kyc'

  /** Reviewer demo tabs only for this child once it is submitted / in review / complete — not from global `submittedAt` (e.g. after KYC approval elsewhere). */
  const childInReviewerPipeline =
    !!activeChild &&
    (activeChild.status === 'awaiting_review' ||
      activeChild.status === 'complete' ||
      activeChild.status === 'rejected')
  const childSupportsReviewerDemoTabs =
    activeChild?.childType === 'kyc' || activeChild?.childType === 'account-opening'

  const isAdvisorView = viewMode === 'advisor'
  const isHoDocView = viewMode === 'ho-documents'
  const isHoPrincipalView = viewMode === 'ho-principal'
  const isHoKycView = viewMode === 'ho-kyc'
  const isHoPrincipalKycView = viewMode === 'ho-principal-kyc'
  const isAmlView = viewMode === 'aml'
  const isHomeOfficeView = isHoDocView || isHoPrincipalView
  /** Stale `ho-documents` / `ho-principal` after KYC must not put a draft account child into HO reviewer layout. */
  const showHomeOfficeAccountLayout =
    isHomeOfficeView &&
    (activeChild?.childType !== 'account-opening' || childInReviewerPipeline)

  const showViewToggle =
    inChildAction && childSupportsReviewerDemoTabs && childInReviewerPipeline

  return (
    <div className="flex h-screen bg-background">
      <VerticalNav defaultCollapsed onCreateClick={() => setComposeOpen(true)} />
      <WizardRightPanelProvider>
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
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'ho-principal-kyc' })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isHoPrincipalKycView
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Principal
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
            isAmlView && isKycChild ? (
              <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  <ChildActionSidebar />
                  <div className="flex flex-1 min-h-0 overflow-hidden min-w-0">
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                      <ChildAmlReviewContent />
                    </div>
                    <ChildActionRightSidebar />
                  </div>
                </div>
                <AmlReviewFooter />
              </div>
            ) : isHoKycView && isKycChild ? (
              <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  <ChildActionSidebar />
                  <div className="flex flex-1 min-h-0 overflow-hidden min-w-0">
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                      <ChildHoKycViewContent />
                    </div>
                    <ChildActionRightSidebar />
                  </div>
                </div>
                <HoKycReviewFooter />
              </div>
            ) : isHoPrincipalKycView && isKycChild ? (
              <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  <ChildActionSidebar />
                  <div className="flex flex-1 min-h-0 overflow-hidden min-w-0">
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                      <ChildHoPrincipalKycContent />
                    </div>
                    <ChildActionRightSidebar />
                  </div>
                </div>
                <HoPrincipalKycFooter />
              </div>
            ) : showHomeOfficeAccountLayout ? (
              activeChild?.childType === 'account-opening' ? (
                <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                  <div className="flex flex-1 min-h-0 overflow-hidden">
                    <ChildActionSidebar />
                    <div className="flex flex-1 min-h-0 overflow-hidden min-w-0">
                      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        <ChildActionContent />
                      </div>
                      <ChildActionRightSidebar />
                    </div>
                  </div>
                  <HomeOfficeReviewFooter />
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                  <div className="flex flex-1 min-h-0 overflow-hidden">
                    <ChildActionSidebar />
                    <div className="flex flex-1 min-h-0 overflow-hidden min-w-0">
                      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        {isHoDocView ? <ChildHoDocumentViewContent /> : <ChildHoPrincipalViewContent />}
                      </div>
                      <ChildActionRightSidebar />
                    </div>
                  </div>
                  <HomeOfficeReviewFooter />
                </div>
              )
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
      </WizardRightPanelProvider>
      {composeOpen && <ComposeDialog onClose={() => setComposeOpen(false)} />}
    </div>
  )
}
