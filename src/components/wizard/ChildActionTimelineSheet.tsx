import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { ChildTask, ChildType, ChildReviewState } from '@/types/workflow'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkflow } from '@/stores/workflowStore'
import {
  buildTimelineDisplaySteps,
  getActiveDisplayStepIndex,
} from '@/utils/childTimelineVisibility'
import { hasOwnerLevelAmlFlag } from '@/utils/childStatusDisplay'
import { ownersAmlScreeningCleared, ownersPassedOwnerLevelKyc } from '@/utils/ownerKycReview'

interface TimelineStage {
  label: string
  description: string
  matchStatuses: string[]
}

const ACCOUNT_OPENING_STAGES: TimelineStage[] = [
  { label: 'Draft', description: 'Capture client & account data, validate, and perform ID verification.', matchStatuses: ['not_started', 'in_progress'] },
  { label: 'Client Signature', description: 'Combined eSign package generated and sent to client for signature.', matchStatuses: [] },
  { label: 'Awaiting Review', description: 'Account application submitted to Home Office for review.', matchStatuses: ['awaiting_review'] },
  {
    // Off-path: appears between Submitted and the review pipeline when a reviewer sends the
    // application back to the advisor. Filtered out otherwise.
    label: 'Clarification / Document Required',
    description: 'Review team requested clarification or additional documents from the advisor.',
    matchStatuses: ['ao_clarification_required'],
  },
  { label: 'AML Review', description: 'AML compliance team screens each owner against sanctions, PEP, and watchlists.', matchStatuses: ['aml_review_pending'] },
  { label: 'Document Review', description: 'Document Review Team verifies completeness of all account documents.', matchStatuses: ['doc_review_pending'] },
  { label: 'Principal Review', description: 'Principal Review Team performs final approval and oversight.', matchStatuses: ['principal_review_pending'] },
  { label: 'Escalation / Hold', description: 'Account placed on hold for compliance escalation.', matchStatuses: ['escalation_hold'] },
  {
    label: 'Pending Release',
    description: 'Both reviews passed — account approved (IGO). Preparing for release to Pershing.',
    matchStatuses: ['pending_release', 'complete'],
  },
]

const KYC_STAGES: TimelineStage[] = [
  { label: 'Draft', description: 'KYC verification initiated. Client data captured.', matchStatuses: ['not_started', 'in_progress'] },
  { label: 'ID Verification', description: 'Identity verification performed by Avantos.', matchStatuses: [] },
  { label: 'Submitted', description: 'ID verification documents submitted for compliance review.', matchStatuses: ['awaiting_review'] },
  { label: 'AML Review', description: 'AML Team reviews watchlist codes against OFAC and KYC platforms.', matchStatuses: ['aml_pending', 'aml_flagged', 'rejected'] },
  {
    label: 'Clarification / Document Required',
    description: 'Review team requested clarification or additional documents from the advisor.',
    matchStatuses: ['kyc_clarification_required'],
  },
  { label: 'Document Review', description: 'Review KYC documents and verification data for completeness.', matchStatuses: ['ho_kyc_pending'] },
  { label: 'Complete', description: 'Identity verified. No further KYC action required.', matchStatuses: ['complete'] },
]

function deriveEffectiveStatus(
  rawStatus: string,
  childType: ChildType,
  reviewState?: ChildReviewState,
): string {
  if (rawStatus === 'complete') {
    if (
      childType === 'account-opening' ||
      childType === 'funding-line' ||
      childType === 'feature-service-line'
    ) {
      return 'pending_release'
    }
    return 'complete'
  }

  if (childType === 'kyc') {
    const amlStatus = reviewState?.amlReview?.status
    const hoKycStatus = reviewState?.hoKycReview?.status

    if (
      (rawStatus === 'in_progress' || rawStatus === 'not_started' || rawStatus === 'rejected') &&
      (amlStatus === 'flagged' ||
        amlStatus === 'info_requested' ||
        hoKycStatus === 'changes_requested')
    ) {
      return 'kyc_clarification_required'
    }

    if (rawStatus === 'rejected') {
      if (amlStatus === 'escalated') return 'rejected'
      return 'rejected'
    }

    if (rawStatus === 'awaiting_review' || rawStatus === 'complete') {
      if (amlStatus === 'pending') return 'aml_pending'
      if (amlStatus === 'flagged') return 'aml_flagged'
      if (amlStatus === 'cleared' && hoKycStatus === 'pending') return 'ho_kyc_pending'
      if (hoKycStatus === 'approved') return 'complete'
      return rawStatus
    }

    return rawStatus
  }

  if (childType !== 'account-opening' && childType !== 'funding-line' && childType !== 'feature-service-line') {
    return rawStatus
  }

  // Single-flow account-opening: phase + disposition status together drive the active queue.
  if (childType === 'account-opening' && reviewState?.accountWorkflowPhase) {
    const phase = reviewState.accountWorkflowPhase
    const docStatus = reviewState.documentReview?.status
    const principalStatus = reviewState.principalReview?.status
    if (phase === 'aml_review') {
      return hasOwnerLevelAmlFlag(reviewState) ? 'escalation_hold' : 'aml_review_pending'
    }
    if (phase === 'document_review') {
      if (docStatus === 'igo') return 'principal_review_pending'
      if (ownersAmlScreeningCleared(reviewState) || ownersPassedOwnerLevelKyc(reviewState)) {
        return 'awaiting_review'
      }
      return 'doc_review_pending'
    }
    if (phase === 'principal_review') {
      if (reviewState.documentReview?.status !== 'igo' && ownersPassedOwnerLevelKyc(reviewState)) {
        return 'awaiting_review'
      }
      if (principalStatus === 'igo') return 'pending_release'
      return 'principal_review_pending'
    }
    if (phase === 'pending_release' || phase === 'complete') return 'pending_release'
    if (phase === 'escalation_hold') {
      if (ownersAmlScreeningCleared(reviewState) && !hasOwnerLevelAmlFlag(reviewState)) {
        return 'awaiting_review'
      }
      return 'escalation_hold'
    }
    if (phase === 'draft') {
      // Clarification: an owner has open info-requested / changes-requested state after a reviewer sent it back.
      const ownerReviews = reviewState.ownerReviews ?? {}
      const hasOpenClarification = Object.values(ownerReviews).some(
        (o) =>
          o.amlReview?.status === 'info_requested' ||
          o.hoKycReview?.status === 'changes_requested',
      )
      if (hasOpenClarification) return 'ao_clarification_required'
    }
  }

  if (rawStatus !== 'awaiting_review' && rawStatus !== 'rejected' && rawStatus !== 'in_progress' && rawStatus !== 'not_started') {
    return rawStatus
  }

  const amlStatus = reviewState?.amlReview?.status
  const docStatus = reviewState?.documentReview?.status
  const principalStatus = reviewState?.principalReview?.status

  if (
    (rawStatus === 'in_progress' || rawStatus === 'not_started' || rawStatus === 'rejected') &&
    (docStatus === 'nigo' || principalStatus === 'nigo')
  ) {
    return 'ao_clarification_required'
  }

  if (rawStatus === 'rejected') {
    if (amlStatus === 'flagged' || amlStatus === 'escalated') return 'rejected'
    return 'rejected'
  }

  // Account opening: advisor draft stays on Draft until submit; HO pipeline only after awaiting_review.
  if (childType === 'account-opening') {
    if (rawStatus === 'in_progress' || rawStatus === 'not_started') {
      return rawStatus
    }
    if (docStatus === 'igo' && principalStatus === 'igo') return 'pending_release'
    if (docStatus === 'igo') return 'principal_review_pending'
    if (ownersAmlScreeningCleared(reviewState) || ownersPassedOwnerLevelKyc(reviewState)) {
      return 'awaiting_review'
    }
    return 'doc_review_pending'
  }

  if (amlStatus === 'pending') return 'aml_pending'
  if (amlStatus === 'flagged') return 'aml_flagged'

  if (docStatus === 'igo' && principalStatus === 'igo') return 'pending_release'
  if (docStatus === 'igo') return 'principal_review_pending'
  return 'doc_review_pending'
}

/**
 * Returns the label of the currently active timeline stage for a child.
 * Used by the sidebar badge so it stays in sync with the right-side timeline.
 */
export function getActiveStageLabel(
  rawStatus: string,
  childType: ChildType,
  reviewState?: ChildReviewState,
): string {
  const effectiveStatus = deriveEffectiveStatus(rawStatus, childType, reviewState)
  const steps = buildTimelineDisplaySteps(childType, rawStatus, effectiveStatus, reviewState)
  const idx = getActiveDisplayStepIndex(steps, effectiveStatus)
  return steps[idx]?.label ?? 'Draft'
}

export function ChildActionTimeline({
  childType,
  status,
  compact = false,
  reviewState,
}: {
  childType: ChildType
  status: string
  compact?: boolean
  reviewState?: ChildReviewState
}) {
  const effectiveStatus = deriveEffectiveStatus(status, childType, reviewState)
  const steps = buildTimelineDisplaySteps(childType, status, effectiveStatus, reviewState)
  const activeIndex = getActiveDisplayStepIndex(steps, effectiveStatus)
  const isRejected = effectiveStatus === 'rejected'
  const isWorkflowComplete =
    effectiveStatus === 'complete' || effectiveStatus === 'pending_release'

  return (
    <div className="relative">
      {steps.map((step, i) => {
        const isActive = i === activeIndex
        const isComplete = i < activeIndex
        const isPending = i > activeIndex
        const isLast = i === steps.length - 1
        const isTerminalCompleteChecked = isWorkflowComplete && step.label === 'Pending Release'

        const timelineDetail = step.atLabel ?? null

        const isClarificationActive =
          step.isClarification &&
          isActive &&
          (effectiveStatus === 'ao_clarification_required' ||
            effectiveStatus === 'kyc_clarification_required')
        const isNigoStage = isClarificationActive
        const showReviewerMessages =
          step.messages.length > 0 && (isActive || isComplete || isTerminalCompleteChecked)

        return (
          <div key={step.id} className="relative flex gap-3">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[11px] top-[24px] w-[2px] bottom-0',
                  isComplete || isTerminalCompleteChecked ? 'bg-foreground' : 'bg-border',
                )}
              />
            )}

            <div className="relative z-10 shrink-0 mt-0.5">
              {(isRejected && isActive) || isNigoStage ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                  <XCircle className="h-4 w-4" />
                </div>
              ) : isComplete || isTerminalCompleteChecked ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-background" />
              )}
            </div>

            <div className={cn(compact ? 'pb-4' : 'pb-6', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium leading-6',
                  isPending && 'text-muted-foreground/50',
                  (isRejected && isActive) && 'text-destructive',
                  isNigoStage && 'text-destructive',
                )}
              >
                {step.label}
                {steps.filter((s) => s.label === step.label).length > 1 && step.isHistorical ? (
                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground tabular-nums">
                    ({steps.slice(0, i + 1).filter((s) => s.label === step.label).length})
                  </span>
                ) : null}
              </p>
              {!compact && (
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    isPending ? 'text-muted-foreground/40' : 'text-muted-foreground',
                  )}
                >
                  {step.description}
                </p>
              )}
              {timelineDetail && (
                <p className={cn('text-xs mt-0.5', isNigoStage ? 'text-destructive/80' : 'text-muted-foreground')}>
                  {timelineDetail}
                </p>
              )}
              {showReviewerMessages && (
                <div className="mt-2 space-y-1.5">
                  {step.messages.map((msg) => (
                    <p
                      key={`${step.id}-${msg}`}
                      className={cn(
                        'rounded-md border px-2.5 py-2 text-xs leading-relaxed',
                        step.isClarification
                          ? 'border-destructive/20 bg-destructive/5 text-destructive/90'
                          : step.label === 'AML Review'
                            ? 'border-green-200/60 bg-green-50/40 text-green-900 dark:text-green-100'
                            : 'border-border/80 bg-muted/30 text-foreground/85',
                      )}
                    >
                      {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ChildActionTimelineSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  child: ChildTask | null
}

export function ChildActionTimelineSheet({ open, onOpenChange, child }: ChildActionTimelineSheetProps) {
  const { state } = useWorkflow()

  if (!child) return null

  const reviewState = state.childReviewsByChildId?.[child.id]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[480px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-lg">{child.name}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="rounded-xl bg-muted/30 border border-border p-5">
            <h3 className="text-sm font-semibold mb-5">Application activity</h3>
            <ChildActionTimeline
              childType={child.childType}
              status={child.status}
              reviewState={reviewState}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
