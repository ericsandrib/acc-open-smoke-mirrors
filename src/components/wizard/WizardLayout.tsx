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
import { useEffect, useRef, useState } from 'react'
import { Eye, ShieldCheck, ShieldAlert, Building } from 'lucide-react'
import { VerticalNav } from '@/components/navigation/vertical-nav'
import { ComposeDialog } from '@/components/dashboard/ComposeDialog'
import { useWorkflow } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { WizardRightPanelProvider } from '@/components/wizard/wizardRightPanelContext'
import { getChildTypeConfig, getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { toast } from 'sonner'

export function WizardLayout() {
  const { state, dispatch } = useWorkflow()
  const [composeOpen, setComposeOpen] = useState(false)
  const inChildAction = !!state.activeChildActionId
  const viewMode = state.demoViewMode

  const activeChild = inChildAction
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === state.activeChildActionId)
    : null
  const activeParentTask = activeChild
    ? state.tasks.find((t) => (t.children ?? []).some((c) => c.id === activeChild.id))
    : undefined
  const activeChildConfig = activeChild ? getChildTypeConfig(activeChild.childType) : undefined
  const activeChildSubTask =
    activeChildConfig && state.activeChildSubTaskIndex != null
      ? activeChildConfig.subTasks[state.activeChildSubTaskIndex]
      : undefined
  const activeChildSubTaskTitle =
    activeChild && activeChildSubTask
      ? getSubTaskDisplayTitle(activeChild.childType, activeChildSubTask, viewMode)
      : undefined
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
  const isAmlView = viewMode === 'aml'
  const isHomeOfficeView = isHoDocView || isHoPrincipalView
  /** Stale `ho-documents` / `ho-principal` after KYC must not put a draft account child into HO reviewer layout. */
  const showHomeOfficeAccountLayout =
    isHomeOfficeView &&
    (activeChild?.childType !== 'account-opening' || childInReviewerPipeline)

  const showViewToggle =
    inChildAction && childSupportsReviewerDemoTabs && childInReviewerPipeline
  const getTaskCompletionPct = (taskId: string, formKey: string): number => {
    if (formKey === 'related-parties') {
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const total = members.length * 2
      if (total <= 0) return 0
      let filled = 0
      for (const m of members) {
        if (m.email?.trim()) filled++
        if (m.phone?.trim()) filled++
      }
      return Math.round((filled / total) * 100)
    }
    if (formKey === 'existing-accounts') {
      return state.financialAccounts.length > 0 ? 100 : 0
    }
    if (formKey === 'kyc') {
      const task = state.tasks.find((t) => t.id === taskId)
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const needsKyc = members.filter((m) => m.kycStatus !== 'verified')
      const total = Math.max(needsKyc.length, 1)
      const filled = Math.min(
        (task?.children ?? []).filter((c) => c.status === 'complete').length,
        total,
      )
      return Math.round((filled / total) * 100)
    }
    if (formKey === 'open-accounts' || formKey === 'open-accounts-with-annuity') {
      const task = state.tasks.find((t) => t.id === taskId)
      const children = (task?.children ?? []).filter(
        (c) => c.childType === 'account-opening',
      )
      const taskData = (state.taskData[taskId] as Record<string, unknown> | undefined) ?? {}

      // Section 1: Accounts to Be Opened
      const accountsPct =
        children.length === 0
          ? 0
          : Math.round(
              (children.filter((c) => c.status === 'complete' || c.status === 'canceled').length /
                children.length) *
                100,
            ) || 35 // credit meaningful progress once accounts are added even before completion

      // Section 2: Required Documents (doc-instances-* rows with uploads)
      const docInstanceKeys = Object.keys(taskData).filter((k) => k.startsWith('doc-instances-'))
      let docRowsTotal = 0
      let docRowsUploaded = 0
      for (const key of docInstanceKeys) {
        const rows = (taskData[key] as Array<{ fileName?: string }> | undefined) ?? []
        docRowsTotal += rows.length
        docRowsUploaded += rows.filter((r) => Boolean(r?.fileName)).length
      }
      const documentsPct =
        docRowsTotal > 0
          ? Math.round((docRowsUploaded / docRowsTotal) * 100)
          : children.length > 0
            ? 10 // slight lift once accounts exist and docs section is in play
            : 0

      // Section 3: KYC Verification
      const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
      const kycChildren = (kycTask?.children ?? []).filter((c) => c.childType === 'kyc')
      const kycPct =
        kycChildren.length > 0
          ? Math.round((kycChildren.filter((c) => c.status === 'complete').length / kycChildren.length) * 100)
          : 0

      // Section 4: Envelopes
      const envelopes = (taskData.esignEnvelopes as Array<unknown> | undefined) ?? []
      const esignPct = envelopes.length > 0 ? 100 : 0

      // Weighted blend mirrors section importance in Open Accounts.
      return Math.round(accountsPct * 0.4 + documentsPct * 0.3 + kycPct * 0.15 + esignPct * 0.15)
    }
    return 0
  }
  const activeParentActionId = state.tasks.find((t) => t.id === state.activeTaskId)?.actionId
  const currentTopLevelActionId = inChildAction ? activeParentTask?.actionId : activeParentActionId
  const actionProgress = state.actions
    .filter((action) => action.id !== 'kyc')
    .sort((a, b) => a.order - b.order)
    .map((action) => {
      const tasks = state.tasks.filter(
        (t) => t.actionId === action.id && t.formKey !== 'kyc' && t.id !== 'kyc-review',
      )
      const total = tasks.length
      const pct = total > 0
        ? Math.round(tasks.reduce((sum, t) => sum + getTaskCompletionPct(t.id, t.formKey), 0) / total)
        : 0
      return { id: action.id, title: action.title, pct }
    })
  const navigateToParentAction = (actionId: string) => {
    const firstTask = state.tasks
      .filter((t) => t.actionId === actionId && t.formKey !== 'kyc' && t.id !== 'kyc-review')
      .sort((a, b) => a.order - b.order)[0]
    if (!firstTask) return
    if (inChildAction) {
      dispatch({ type: 'EXIT_CHILD_ACTION' })
    }
    dispatch({ type: 'SET_ACTIVE_TASK', taskId: firstTask.id })
  }
  const navigateToParentTaskSection = (sectionId: string) => {
    if (!activeParentTask) return
    if (inChildAction) {
      dispatch({ type: 'EXIT_CHILD_ACTION' })
    }
    dispatch({ type: 'SET_ACTIVE_TASK', taskId: activeParentTask.id })

    const attemptScroll = (triesLeft: number) => {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      if (triesLeft <= 0) return
      window.setTimeout(() => attemptScroll(triesLeft - 1), 50)
    }
    window.setTimeout(() => attemptScroll(8), 0)
  }

  const childBreadcrumbRow =
    inChildAction && !state.childActionResume && activeChild ? (
      <header className="border-b border-border py-2 shrink-0">
        <div className="relative flex items-center min-h-8">
          {(() => {
            const isKycChildBreadcrumb = activeChild.childType === 'kyc'
            const isAccountOpeningChildBreadcrumb = activeChild.childType === 'account-opening'
            const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
            const childSecondSegment = isKycChildBreadcrumb
              ? (kycTask?.title ?? 'KYC Verification')
              : isAccountOpeningChildBreadcrumb
                ? 'Accounts to Be Opened'
                : activeChild.name
            const childThirdSegment =
              isKycChildBreadcrumb || isAccountOpeningChildBreadcrumb ? null : activeChildSubTaskTitle
            return (
          <div className="overflow-x-auto min-w-0 pl-5 pr-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap min-w-max">
              <button
                type="button"
                className="hover:text-foreground transition-colors shrink-0"
                onClick={() => dispatch({ type: 'EXIT_CHILD_ACTION' })}
                title={activeParentTask?.title ?? 'Task'}
              >
                {activeParentTask?.title ?? 'Task'}
              </button>
              <span className="shrink-0">/</span>
              <button
                type="button"
                className="hover:text-foreground transition-colors shrink-0"
                onClick={() => {
                  if (isKycChildBreadcrumb) {
                    navigateToParentTaskSection('oa-kyc')
                    return
                  }
                  if (isAccountOpeningChildBreadcrumb) {
                    navigateToParentTaskSection('oa-accounts')
                    return
                  }
                  dispatch({ type: 'SET_CHILD_SUB_TASK', index: 0 })
                }}
                title={childSecondSegment}
              >
                {childSecondSegment}
              </button>
              {childThirdSegment ? (
                <>
                  <span className="shrink-0">/</span>
                  <span className="text-foreground font-medium shrink-0" title={childThirdSegment}>
                    {childThirdSegment}
                  </span>
                </>
              ) : null}
            </div>
          </div>
            )
          })()}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center w-full max-w-2xl">
            <div className="pointer-events-auto flex items-center gap-3 w-full min-w-0">
              {actionProgress.map((action) => {
                const isActive = currentTopLevelActionId === action.id
                return (
                  <div key={action.id} className="min-w-0 flex-1" title={`${action.title}: ${action.pct}% complete`}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className={cn(
                          'text-[11px] truncate text-left hover:text-foreground transition-colors',
                          isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
                        )}
                        onClick={() => navigateToParentAction(action.id)}
                      >
                        {action.title}
                      </button>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', isActive ? 'bg-primary' : 'bg-foreground/70')}
                        style={{ width: `${action.pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </header>
    ) : null

  const lastChildIdRef = useRef<string | undefined>(state.activeChildActionId)
  useEffect(() => {
    const previousChildId = lastChildIdRef.current
    const nextChildId = state.activeChildActionId
    if (!previousChildId && nextChildId) {
      const nextChild = state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === nextChildId)
      const nextParent = state.tasks.find((t) => (t.children ?? []).some((c) => c.id === nextChildId))
      toast(`Entered child action: ${nextChild?.name ?? 'Child action'}`, {
        description: `Parent task: ${nextParent?.title ?? 'Current task'}`,
      })
    } else if (previousChildId && !nextChildId) {
      const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
      toast(`Returned to parent task: ${activeTask?.title ?? 'Task'}`)
    }
    lastChildIdRef.current = nextChildId
  }, [state.activeChildActionId, state.activeTaskId, state.tasks])

  return (
    <div className="flex h-screen bg-background">
      <VerticalNav defaultCollapsed onCreateClick={() => setComposeOpen(true)} />
      <WizardRightPanelProvider>
      <div className="flex flex-col flex-1 min-w-0">
        {!inChildAction && (
          <header className="border-b border-border py-2 shrink-0">
            <div className="relative flex items-center min-h-8">
              <div className="overflow-x-auto min-w-0 pl-5 pr-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap min-w-max">
                  <span className="shrink-0">Onboarding</span>
                  <span className="shrink-0">/</span>
                  <span className="text-foreground font-medium shrink-0">
                    {state.journeyName ?? 'Client Onboarding'}
                  </span>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center w-full max-w-2xl">
                <div className="pointer-events-auto flex items-center gap-3 w-full min-w-0">
                  {actionProgress.map((action) => {
                    const isActive = activeParentActionId === action.id
                    return (
                      <div key={action.id} className="min-w-0 flex-1" title={`${action.title}: ${action.pct}% complete`}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className={cn(
                              'text-[11px] truncate text-left hover:text-foreground transition-colors',
                              isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
                            )}
                            onClick={() => navigateToParentAction(action.id)}
                          >
                            {action.title}
                          </button>
                        </div>
                        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', isActive ? 'bg-primary' : 'bg-foreground/70')}
                            style={{ width: `${action.pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </header>
        )}
        {childBreadcrumbRow}
        {showViewToggle && (
          <header className="border-b border-border px-8 py-2 flex items-center justify-end shrink-0">
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
                    Document Review
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
                    <Building className="h-3.5 w-3.5" />
                    Document Review
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
                    Principal Review
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
