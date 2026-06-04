import { useEffect } from 'react'
import type { ChildReviewState } from '@/types/workflow'
import { useWorkflow, useChildActionContext, useAdvisorFormsEditable, getChildReviewState, getChildReviewDecision } from '@/stores/workflowStore'
import { getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY } from '@/utils/openAccountsTaskContext'
import { useOpenAccountsVariant } from './openAccountsVariantContext'
import { formComponents, taskDescriptions } from './formRegistry'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  isAccountOpeningAwaitingClarification,
  isChildAwaitingAdvisorClarification,
  isKycAwaitingAdvisorClarification,
} from '@/utils/childStatusDisplay'

/** Red feedback banner when a child workflow is returned; in-review state lives in the sidebar status card. */
function AdvisorViewBanner() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const childId = ctx?.child.id
  const decision = getChildReviewDecision(state, childId)
  const reviewState = getChildReviewState(state, childId)
  const docReview = reviewState?.documentReview
  const principalReview = reviewState?.principalReview
  const amlReview = reviewState?.amlReview
  const isKyc = ctx?.child.childType === 'kyc'

  const hoKycReview = reviewState?.hoKycReview

  if (!ctx) return null
  const { child } = ctx
  // Returned to advisor for clarification — persist on every sub-task until resubmitted.
  if (isKyc && isKycAwaitingAdvisorClarification(reviewState)) {
    const hoChangesRequested = hoKycReview?.status === 'changes_requested'
    const teamLabel = hoChangesRequested ? 'Document Review' : 'Compliance review'
    const isInfoRequested = amlReview?.status === 'info_requested'
    const detail = hoChangesRequested
      ? 'Document Review has requested changes to this submission. Please review the feedback and resubmit.'
      : isInfoRequested
        ? 'Additional information was requested before this submission can continue. Please respond and resubmit.'
        : 'This submission was flagged during compliance screening. Please review the notes and resubmit when ready.'
    const feedbackBlock = hoChangesRequested ? (
      hoKycReview?.comments ? (
        <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2">
          <p className="text-xs text-red-900 dark:text-red-100">
            <span className="font-semibold">Feedback:</span> {hoKycReview.comments}
          </p>
        </div>
      ) : null
    ) : isInfoRequested ? (
      amlReview?.infoRequestComments ? (
        <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2">
          <p className="text-xs text-red-900 dark:text-red-100">
            <span className="font-semibold">Request:</span> {amlReview.infoRequestComments}
          </p>
        </div>
      ) : null
    ) : amlReview?.findings ? (
      <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2">
        <p className="text-xs text-red-900 dark:text-red-100">
          <span className="font-semibold">Findings:</span> {amlReview.findings}
        </p>
      </div>
    ) : null
    const decidedAt =
      hoKycReview?.decidedAt ?? amlReview?.decidedAt ?? decision?.decidedAt

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Returned by {teamLabel}</p>
            <p className="text-xs text-red-800/80 dark:text-red-200/70">{detail}</p>
            {feedbackBlock}
            {decidedAt ? (
              <p className="text-xs text-red-700/70 dark:text-red-300/60 mt-1">at {decidedAt}</p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (!isKyc && isAccountOpeningAwaitingClarification(reviewState, child.status)) {
    const rejectedByPrincipal = principalReview?.status === 'nigo'
    const teamLabel = rejectedByPrincipal ? 'Principal Review' : 'Document Review'
    const nigoData = rejectedByPrincipal ? principalReview : docReview
    const feedbackBlock =
      nigoData?.nigoReason || nigoData?.nigoFeedback ? (
        <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2 space-y-1">
          {nigoData?.nigoReason ? (
            <p className="text-xs text-red-900 dark:text-red-100">
              <span className="font-semibold">Reason:</span> {nigoData.nigoReason}
            </p>
          ) : null}
          {nigoData?.nigoFeedback ? (
            <p className="text-xs text-red-800/90 dark:text-red-200/80">
              <span className="font-semibold">Feedback:</span> {nigoData.nigoFeedback}
            </p>
          ) : null}
        </div>
      ) : null
    const decidedAt = nigoData?.decidedAt ?? decision?.decidedAt

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Returned by {teamLabel}</p>
            <p className="text-xs text-red-800/80 dark:text-red-200/70">
              Review feedback, update the application, and submit for review.
            </p>
            {feedbackBlock}
            {decidedAt ? (
              <p className="text-xs text-red-700/70 dark:text-red-300/60 mt-1">at {decidedAt}</p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (child.status === 'in_progress' || child.status === 'not_started') {
    return null
  }

  if (decision?.outcome === 'rejected') {
    let teamLabel = 'Home Office'
    let detail = 'Your submission has been returned for corrections. Please review the feedback and resubmit.'
    let feedbackBlock: React.ReactNode = null

    if (!isKyc && !isAccountOpeningAwaitingClarification(reviewState, child.status)) {
      const rejectedByDoc = docReview?.status === 'nigo'
      const rejectedByPrincipal = principalReview?.status === 'nigo'
      teamLabel = rejectedByPrincipal ? 'Principal Review Team' : rejectedByDoc ? 'Document Review Team' : 'Home Office'
      const nigoData = rejectedByPrincipal ? principalReview : rejectedByDoc ? docReview : null
      if (nigoData?.nigoReason) {
        feedbackBlock = (
          <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2 space-y-1">
            <p className="text-xs text-red-900 dark:text-red-100">
              <span className="font-semibold">Reason:</span> {nigoData.nigoReason}
            </p>
            {nigoData.nigoFeedback && (
              <p className="text-xs text-red-800/90 dark:text-red-200/80">
                <span className="font-semibold">Feedback:</span> {nigoData.nigoFeedback}
              </p>
            )}
          </div>
        )
      }
    }

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Returned by {teamLabel}
            </p>
            <p className="text-xs text-red-800/80 dark:text-red-200/70">{detail}</p>
            {feedbackBlock}
            <p className="text-xs text-red-700/70 dark:text-red-300/60 mt-1">
              at {decision.decidedAt}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function ChildActionContent() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const variant = useOpenAccountsVariant()
  const isAdvisorView = state.demoViewMode === 'advisor'
  const advisorFormsEditable = useAdvisorFormsEditable()
  const visitSubTaskIndex = ctx?.subTaskIndex
  const visitChildId = ctx?.child.id
  const scrollFormKey = ctx?.currentSubTask.formKey
  const scrollSubTaskId = ctx?.subTaskId

  useEffect(() => {
    document.getElementById('wizard-form-scroll-area')?.scrollTo({ top: 0 })
  }, [scrollFormKey, scrollSubTaskId])

  useEffect(() => {
    if (visitSubTaskIndex == null || !visitChildId) return
    dispatch({ type: 'MARK_CHILD_SUB_TASK_VISITED', index: visitSubTaskIndex })
  }, [visitSubTaskIndex, visitChildId, dispatch])

  if (!ctx) return null

  const { child, currentSubTask, subTaskId } = ctx
  const isAmlKycWorkspace = state.demoViewMode === 'aml' && child.childType === 'kyc'
  const formKey = currentSubTask.formKey
  const FormComponent = formComponents[formKey] ?? null
  const description = taskDescriptions[currentSubTask.formKey]
  const inReview = child.status === 'awaiting_review'
  const advisorDisabled = isAdvisorView && !advisorFormsEditable
  const childInReviewerPipeline =
    child.status === 'awaiting_review' ||
    child.status === 'complete' ||
    child.status === 'rejected'
  const isHoDocAccountOpening =
    state.demoViewMode === 'ho-documents' &&
    child.childType === 'account-opening' &&
    childInReviewerPipeline
  const isHoPrincipalAccountOpening =
    state.demoViewMode === 'ho-principal' &&
    child.childType === 'account-opening' &&
    childInReviewerPipeline
  const isHoTeamAccountOpening = isHoDocAccountOpening || isHoPrincipalAccountOpening
  const reviewState = getChildReviewState(state, child.id)
  const amlFlagged = reviewState?.amlFlagged
  const amlNotes = reviewState?.amlNotes
  const inKycAmlReview =
    child.childType === 'kyc' &&
    currentSubTask.formKey === 'kyc-child-info' &&
    child.status === 'awaiting_review' &&
    reviewState?.amlReview?.status === 'pending'
  /**
   * Single-flow account-opening CIP / AML review tasks are interactive for the matching team
   * (re-run screening, edit owner fields, etc.). Don't blanket-lock them as read-only.
   */
  const isSingleFlowReviewSubTask =
    child.childType === 'account-opening' &&
    (currentSubTask.formKey === 'acct-child-cip-review' ||
      currentSubTask.formKey === 'acct-child-aml-review')
  const formReadOnly =
    !isAmlKycWorkspace &&
    !isSingleFlowReviewSubTask &&
    (advisorDisabled || isHoTeamAccountOpening || inKycAmlReview)
  const hideHeaderDividerInV2 = variant === 'v2' || variant === 'v5'
  const useIncreasedHeaderSpacing =
    variant === 'v2' || variant === 'v3' || variant === 'v4' || variant === 'v5'

  useEffect(() => {
    const targetSectionId = state.parentSectionFocusId
    if (!targetSectionId) return
    if (targetSectionId === '__top__') {
      const scrollContainer =
        document.getElementById('wizard-form-scroll-area') ??
        document.querySelector('main')
      if (scrollContainer instanceof HTMLElement) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
      }
      dispatch({ type: 'CLEAR_PARENT_SECTION_FOCUS' })
      return
    }
    const el = document.getElementById(targetSectionId)
    if (el) {
      const scrollContainer =
        document.getElementById('wizard-form-scroll-area') ??
        (el.closest('main') instanceof HTMLElement ? el.closest('main') : null)
      if (scrollContainer instanceof HTMLElement) {
        const top =
          el.getBoundingClientRect().top -
          scrollContainer.getBoundingClientRect().top +
          scrollContainer.scrollTop -
          16
        scrollContainer.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      }
    }
    dispatch({ type: 'CLEAR_PARENT_SECTION_FOCUS' })
  }, [state.parentSectionFocusId, dispatch])

  return (
    <main className={variant === 'v4' ? 'p-8 bg-[#fafafa]' : 'p-8'}>
      <div className="max-w-[52.5rem] mx-auto">
        {/* "Home Office Review" violet banner removed — the Application Status card conveys the in-review state. */}
        {isAdvisorView && <AdvisorViewBanner />}
        {/* Per-team Document Review / Principal Review status banners removed —
            the Application Status card and Activity timeline convey the state. */}
        {isHoTeamAccountOpening && amlFlagged && amlNotes && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3 mb-6">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">Advisor Notes</p>
                <p className="text-sm text-amber-800/90 dark:text-amber-200/80">{amlNotes}</p>
              </div>
            </div>
          </div>
        )}
        {isHoTeamAccountOpening && amlFlagged && (
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 dark:text-red-200 dark:border-red-800 dark:bg-red-950/40 text-[10px]">
              Advisor Flagged
            </Badge>
          </div>
        )}
        <h1
          className={
            hideHeaderDividerInV2
              ? cn('text-4xl font-semibold text-foreground', useIncreasedHeaderSpacing ? 'mb-8' : 'mb-6')
              : cn(
                  'text-4xl font-semibold text-foreground pb-6 border-b border-border',
                  useIncreasedHeaderSpacing ? 'mb-8' : 'mb-6',
                )
          }
        >
          {getSubTaskDisplayTitle(child.childType, currentSubTask, state.demoViewMode)}
        </h1>
        {description && (
          <p
            className={cn(
              'text-[14px] text-muted-foreground leading-normal mb-6',
              hideHeaderDividerInV2 && useIncreasedHeaderSpacing && '-mt-6',
            )}
          >
            {description}
          </p>
        )}
        <div
          className={
            formReadOnly
              ? 'pointer-events-none opacity-75 select-none [&_[data-readonly-interactive]]:pointer-events-auto'
              : ''
          }
        >
          {FormComponent ? (
            <FormComponent key={formKey} />
          ) : (
            <p className="text-muted-foreground">No form available.</p>
          )}
        </div>
      </div>
    </main>
  )
}
