import { useEffect } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { formComponents, taskSections } from './formRegistry'
import { parseChildSubTaskId, getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOpenAccountsVariant, useOpenAccountsVariantControls } from './openAccountsVariantContext'
import {
  isOpenAccountsFormKey,
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import { OpenAccountsV6InstructionsForm } from './forms/OpenAccountsV6InstructionsForm'

function ReviewBanner() {
  const { state } = useWorkflow()
  const review = state.reviewState

  if (!review) return null

  if (review.reviewStatus === 'pending') {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 mb-6">
        <div className="flex items-start gap-2.5">
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-yellow-800">Awaiting Home Office Review</p>
            <p className="text-xs text-yellow-700">
              Assigned to {review.assignedTo}. All tasks are read-only until the review is complete.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (review.reviewStatus === 'rejected') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-6">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-red-800">Submission Rejected</p>
            {review.rejectionReason && (
              <p className="text-xs text-red-700">
                <span className="font-medium">Reason:</span> {review.rejectionReason}
              </p>
            )}
            {review.rejectionFeedback && (
              <p className="text-xs text-red-700">
                <span className="font-medium">Feedback:</span> {review.rejectionFeedback}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function TaskContent() {
  const { state, dispatch } = useWorkflow()
  const variant = useOpenAccountsVariant()
  const { variant: selectedVariant } = useOpenAccountsVariantControls()

  const activeTask = state.tasks.find((t) => t.id === state.activeTaskId)
  const activeChild = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === state.activeTaskId)

  const parsed = parseChildSubTaskId(state.activeTaskId)
  const subTaskChild = parsed
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === parsed.childId)
    : null
  const subTaskDef = parsed
    ? parsed.config.subTasks.find((s) => s.suffix === parsed.suffix)
    : null
  const parentTaskForChild =
    activeChild
      ? state.tasks.find((t) => (t.children ?? []).some((c) => c.id === activeChild.id))
      : subTaskChild
        ? state.tasks.find((t) => (t.children ?? []).some((c) => c.id === subTaskChild.id))
        : null

  const formKey = activeTask?.formKey ?? activeChild?.formKey ?? subTaskDef?.formKey

  const isSplitJourney =
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY) &&
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)
  const showCombinedOpenAccounts = false

  const splitV1Title =
    variant !== 'v5' && isSplitJourney && activeTask
      ? activeTask.formKey === OPEN_ACCOUNTS_FORM_KEY
        ? 'Accounts without Annuities'
        : activeTask.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
          ? 'Accounts with Annuities'
          : null
      : null

  const v5NoAnnuityTaskTitle =
    variant === 'v5' && activeTask?.formKey === OPEN_ACCOUNTS_FORM_KEY
      ? state.v5NoAnnuityOpenAccountsPage === 'instructions'
        ? 'Account Instructions'
        : state.v5NoAnnuityOpenAccountsPage === 'kyc'
          ? 'KYC Verification'
          : state.v5NoAnnuityOpenAccountsPage === 'documents'
            ? 'Supporting Documents'
            : state.v5NoAnnuityOpenAccountsPage === 'envelopes'
              ? 'Envelopes'
              : null
      : null
  const v5WithAnnuityTaskTitle =
    variant === 'v5' && activeTask?.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
      ? 'Account Instructions'
      : null
  const v5NoAnnuityTaskDescription =
    variant === 'v5' && activeTask?.formKey === OPEN_ACCOUNTS_FORM_KEY
      ? state.v5NoAnnuityOpenAccountsPage === 'kyc'
        ? 'Complete identity verification (KYC/KYB) before accounts can be opened. For trust accounts, include trustees and beneficial owners.'
        : state.v5NoAnnuityOpenAccountsPage === 'documents'
          ? 'Upload client-provided documents that may support account opening, identity verification, or custodian review. Documents are optional unless requested during review. Firm and custodian-generated forms are handled in Envelopes.'
        : state.v5NoAnnuityOpenAccountsPage === 'envelopes'
          ? 'Create eSignature envelopes for client signatures. Firm and custodian forms are automatically grouped by account. For in-person or mail delivery, signed documents can be uploaded manually instead of using eSignature.'
          : null
      : null

  const title = showCombinedOpenAccounts
    ? 'Open Accounts'
    : v5WithAnnuityTaskTitle
      ?? v5NoAnnuityTaskTitle
      ?? splitV1Title
      ?? activeTask?.title
      ?? (subTaskChild && subTaskDef && parsed
        ? `${subTaskChild.name} — ${getSubTaskDisplayTitle(parsed.config.childType, subTaskDef, state.demoViewMode)}`
        : null)
      ?? activeChild?.name
      ?? ''
  const contextTask = activeTask ?? parentTaskForChild ?? null
  const actionName = contextTask
    ? state.actions.find((a) => a.id === contextTask.actionId)?.title ?? null
    : null
  const sectionName = contextTask
    ? selectedVariant === 'v6'
      ? null
      : isSplitJourney && contextTask.formKey === OPEN_ACCOUNTS_FORM_KEY
      ? 'Accounts without Annuities'
      : isSplitJourney && contextTask.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
          ? 'Accounts with Annuities'
          : contextTask.title
    : null
  const showSectionContext = Boolean(sectionName && sectionName !== title)
  const contextLine =
    actionName && showSectionContext
      ? `${actionName} \u00b7 ${sectionName}`
      : actionName ?? (showSectionContext ? sectionName : null)
  const hideHeaderDividerInCardVariants =
    variant === 'v2' || variant === 'v3' || variant === 'v4' || variant === 'v5'

  const FormComponent = formKey ? formComponents[formKey] : null
  const hasExplicitSections = Boolean(formKey && taskSections[formKey]?.length)
  const isV5NoAnnuityPagedMain =
    variant === 'v5' &&
    activeTask?.formKey === OPEN_ACCOUNTS_FORM_KEY &&
    state.v5NoAnnuityOpenAccountsPage != null
  const showV6CombinedInstructions =
    selectedVariant === 'v6' &&
    isSplitJourney &&
    activeTask?.formKey === OPEN_ACCOUNTS_FORM_KEY &&
    state.v5NoAnnuityOpenAccountsPage === 'instructions'

  useEffect(() => {
    if (isV5NoAnnuityPagedMain && state.parentSectionFocusId) {
      dispatch({ type: 'CLEAR_PARENT_SECTION_FOCUS' })
      return
    }
    const targetSectionId = state.parentSectionFocusId
    if (!targetSectionId) return
    if (targetSectionId === '__top__') {
      const main = document.querySelector('main')
      if (main instanceof HTMLElement) {
        main.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      dispatch({ type: 'CLEAR_PARENT_SECTION_FOCUS' })
      return
    }
    const el = document.getElementById(targetSectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    dispatch({ type: 'CLEAR_PARENT_SECTION_FOCUS' })
  }, [state.parentSectionFocusId, dispatch, isV5NoAnnuityPagedMain])

  return (
    <main className={cn('flex-1 overflow-y-auto p-8 2xl:pr-[20rem]', variant === 'v4' && 'bg-[#fafafa]')}>
      <div className="max-w-[52.5rem] mx-auto">
        <ReviewBanner />
        {contextLine ? (
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {contextLine}
          </p>
        ) : null}
        <h1
          className={
            hideHeaderDividerInCardVariants
              ? 'text-4xl font-semibold text-foreground mb-8'
              : 'text-4xl font-semibold text-foreground pb-6 mb-6 border-b border-border'
          }
        >
          {title}
        </h1>
        {v5NoAnnuityTaskDescription ? (
          <p className="text-[14px] text-muted-foreground leading-normal -mt-6 mb-6">
            {v5NoAnnuityTaskDescription}
          </p>
        ) : null}
        {showCombinedOpenAccounts ? null : isV5NoAnnuityPagedMain ? null : !hasExplicitSections &&
          !isOpenAccountsFormKey(formKey) ? (
          <section id="__top__" className="space-y-1.5 scroll-mt-16 mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overview</h3>
          </section>
        ) : null}
        {showV6CombinedInstructions ? (
          <OpenAccountsV6InstructionsForm />
        ) : FormComponent ? (
          <FormComponent />
        ) : (
          <p className="text-muted-foreground">No form available.</p>
        )}
      </div>
    </main>
  )
}
