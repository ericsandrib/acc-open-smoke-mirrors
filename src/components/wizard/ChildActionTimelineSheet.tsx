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

interface TimelineStage {
  label: string
  description: string
  matchStatuses: string[]
}

const ACCOUNT_OPENING_STAGES: TimelineStage[] = [
  { label: 'Draft', description: 'Capture client & account data, validate, and perform ID verification.', matchStatuses: ['not_started', 'in_progress'] },
  { label: 'Client Signature', description: 'Combined eSign package generated and sent to client for signature.', matchStatuses: [] },
  { label: 'Submitted', description: 'Account application submitted to Home Office for review.', matchStatuses: ['awaiting_review'] },
  { label: 'Document Review', description: 'Document Review Team verifies completeness of all account documents.', matchStatuses: ['doc_review_pending'] },
  { label: 'Principal Review', description: 'Principal Review Team performs final approval and oversight.', matchStatuses: ['principal_review_pending', 'rejected'] },
  { label: 'Pending Release', description: 'Both reviews passed — account approved (IGO). Preparing for release to Pershing.', matchStatuses: [] },
  { label: 'Complete', description: 'Account opened at Pershing. Confirmation sent to client.', matchStatuses: ['complete'] },
]

const KYC_STAGES: TimelineStage[] = [
  { label: 'Draft', description: 'KYC verification initiated. Client data captured.', matchStatuses: ['not_started', 'in_progress'] },
  { label: 'ID Verification', description: 'Identity verification performed by Avantos.', matchStatuses: [] },
  { label: 'Submitted', description: 'ID verification documents submitted for compliance review.', matchStatuses: ['awaiting_review'] },
  { label: 'AML Review', description: 'AML Team reviews watchlist codes against OFAC and KYC platforms.', matchStatuses: ['aml_pending', 'aml_flagged', 'rejected'] },
  { label: 'Document Review', description: 'Review KYC documents and verification data for completeness.', matchStatuses: ['ho_kyc_pending', 'ho_kyc_changes_requested'] },
  { label: 'Complete', description: 'Identity verified. No further KYC action required.', matchStatuses: ['complete'] },
]

const KYC_AML_STAGE_INDEX = KYC_STAGES.findIndex((s) => s.label === 'AML Review')
const ACCOUNT_OPENING_DOC_STAGE_INDEX = ACCOUNT_OPENING_STAGES.findIndex((s) => s.label === 'Document Review')

function getStagesForType(childType: ChildType): TimelineStage[] {
  return childType === 'kyc' ? KYC_STAGES : ACCOUNT_OPENING_STAGES
}

function deriveEffectiveStatus(
  rawStatus: string,
  childType: ChildType,
  reviewState?: ChildReviewState,
): string {
  if (rawStatus === 'complete') return 'complete'

  if (childType === 'kyc') {
    const amlStatus = reviewState?.amlReview?.status
    const hoKycStatus = reviewState?.hoKycReview?.status

    if (rawStatus === 'rejected') {
      if (amlStatus === 'flagged' || amlStatus === 'escalated') return 'rejected'
      if (hoKycStatus === 'changes_requested') return 'ho_kyc_changes_requested'
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

  if (rawStatus !== 'awaiting_review' && rawStatus !== 'rejected') {
    return rawStatus
  }

  const amlStatus = reviewState?.amlReview?.status
  const docStatus = reviewState?.documentReview?.status
  const principalStatus = reviewState?.principalReview?.status

  if (rawStatus === 'rejected') {
    if (amlStatus === 'flagged' || amlStatus === 'escalated') return 'rejected'
    if (principalStatus === 'nigo') return 'rejected'
    if (docStatus === 'nigo') return 'rejected'
    return 'rejected'
  }

  // Account opening: home office review starts at Document Review (AML is KYC-only in this demo).
  if (childType === 'account-opening') {
    if (docStatus === 'igo' && principalStatus === 'igo') return 'complete'
    if (docStatus === 'igo') return 'principal_review_pending'
    return 'doc_review_pending'
  }

  if (amlStatus === 'pending') return 'aml_pending'
  if (amlStatus === 'flagged') return 'aml_flagged'

  if (docStatus === 'igo' && principalStatus === 'igo') return 'complete'
  if (docStatus === 'igo') return 'principal_review_pending'
  return 'doc_review_pending'
}

function getActiveStageIndex(stages: TimelineStage[], status: string): number {
  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i].matchStatuses.includes(status)) return i
  }
  return 0
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
  const stages = getStagesForType(childType)
  const idx = getActiveStageIndex(stages, effectiveStatus)
  return stages[idx].label
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
  const stages = getStagesForType(childType)
  const activeIndex = getActiveStageIndex(stages, effectiveStatus)
  const isRejected = effectiveStatus === 'rejected'
  const isWorkflowComplete = effectiveStatus === 'complete'

  const docReview = reviewState?.documentReview
  const principalReview = reviewState?.principalReview
  const amlReview = reviewState?.amlReview

  return (
    <div className="relative">
      {stages.map((stage, i) => {
        const isActive = i === activeIndex
        const isComplete = i < activeIndex
        const isPending = i > activeIndex
        const isLast = i === stages.length - 1
        const isTerminalCompleteChecked = isWorkflowComplete && stage.label === 'Complete'

        const hoKycReview = reviewState?.hoKycReview

        let stageAnnotation: string | null = null
        if (stage.label === 'Document Review') {
          if (childType === 'kyc' && hoKycReview) {
            if (hoKycReview.status === 'approved') stageAnnotation = `Approved at ${hoKycReview.decidedAt}`
            else if (hoKycReview.status === 'changes_requested') stageAnnotation = `Changes requested at ${hoKycReview.decidedAt}`
          } else if (docReview) {
            if (docReview.status === 'igo') stageAnnotation = `Accepted at ${docReview.decidedAt}`
            else if (docReview.status === 'nigo') stageAnnotation = `Rejected at ${docReview.decidedAt}`
          }
        }
        if (stage.label === 'Principal Review' && principalReview) {
          if (principalReview.status === 'igo') stageAnnotation = `Approved at ${principalReview.decidedAt}`
          else if (principalReview.status === 'nigo') stageAnnotation = `Rejected at ${principalReview.decidedAt}`
        }
        if (stage.label === 'AML Review' && amlReview) {
          if (amlReview.status === 'cleared') stageAnnotation = `Cleared at ${amlReview.decidedAt}`
          else if (amlReview.status === 'flagged') stageAnnotation = `Flagged at ${amlReview.decidedAt}`
          else if (amlReview.status === 'escalated') stageAnnotation = `Rejected at ${amlReview.decidedAt}`
          else if (amlReview.status === 'info_requested' && amlReview.decidedAt) {
            stageAnnotation = `Info requested at ${amlReview.decidedAt}`
          }
        }
        if (
          childType !== 'kyc' &&
          stage.label === 'Pending Release' &&
          isComplete &&
          principalReview?.status === 'igo' &&
          principalReview.decidedAt
        ) {
          stageAnnotation = `Approved for release at ${principalReview.decidedAt}`
        }
        if (
          childType !== 'kyc' &&
          stage.label === 'Complete' &&
          isWorkflowComplete &&
          principalReview?.status === 'igo' &&
          principalReview.decidedAt
        ) {
          stageAnnotation = `Completed at ${principalReview.decidedAt}`
        }
        if (
          childType === 'kyc' &&
          stage.label === 'Complete' &&
          isWorkflowComplete &&
          hoKycReview?.status === 'approved' &&
          hoKycReview.decidedAt
        ) {
          stageAnnotation = `Completed at ${hoKycReview.decidedAt}`
        }

        const preAml = reviewState?.kycPreAmlTimeline
        let kycPreAmlAnnotation: string | null = null
        if (
          childType === 'kyc' &&
          preAml &&
          KYC_AML_STAGE_INDEX >= 0 &&
          i < KYC_AML_STAGE_INDEX &&
          isComplete
        ) {
          if (stage.label === 'Draft') kycPreAmlAnnotation = `Completed at ${preAml.draftAt} by Jane Advisor`
          else if (stage.label === 'ID Verification') kycPreAmlAnnotation = `Completed at ${preAml.idVerificationAt} by Jane Advisor`
          else if (stage.label === 'Submitted') kycPreAmlAnnotation = `Submitted for review at ${preAml.submittedForReviewAt} by Jane Advisor`
        }

        const aoPre = reviewState?.accountOpeningPreReviewTimeline
        let accountOpeningPreAnnotation: string | null = null
        if (
          childType !== 'kyc' &&
          aoPre &&
          ACCOUNT_OPENING_DOC_STAGE_INDEX >= 0 &&
          i < ACCOUNT_OPENING_DOC_STAGE_INDEX &&
          isComplete
        ) {
          if (stage.label === 'Draft') {
            accountOpeningPreAnnotation = `Completed at ${aoPre.draftAt} by Jane Advisor`
          } else if (stage.label === 'Client Signature') {
            accountOpeningPreAnnotation = `Completed at ${aoPre.clientSignatureAt} by Jane Advisor`
          } else if (stage.label === 'Submitted') {
            accountOpeningPreAnnotation = `Submitted for review at ${aoPre.submittedForReviewAt} by Jane Advisor`
          }
        }

        let timelineDetail = stageAnnotation ?? kycPreAmlAnnotation ?? accountOpeningPreAnnotation

        const documentReviewStillPending =
          stage.label === 'Document Review' &&
          (childType === 'kyc'
            ? !hoKycReview || hoKycReview.status === 'pending'
            : !docReview || docReview.status === 'pending')

        const amlReviewStillPending =
          stage.label === 'AML Review' && (!amlReview || amlReview.status === 'pending')

        const principalReviewStillPending =
          stage.label === 'Principal Review' &&
          (!principalReview || principalReview.status === 'pending')

        if (!timelineDetail && (isComplete || isTerminalCompleteChecked)) {
          const ts =
            (stage.label === 'AML Review' &&
              !amlReviewStillPending &&
              amlReview?.decidedAt) ||
            (stage.label === 'Document Review' &&
              !documentReviewStillPending &&
              (childType === 'kyc' ? hoKycReview?.decidedAt : docReview?.decidedAt)) ||
            (stage.label === 'Principal Review' &&
              !principalReviewStillPending &&
              principalReview?.decidedAt) ||
            (stage.label === 'Pending Release' && principalReview?.decidedAt) ||
            (stage.label === 'Complete' &&
              (childType === 'kyc' ? hoKycReview?.decidedAt : principalReview?.decidedAt))
          if (ts) timelineDetail = `Recorded at ${ts}`
        }

        const isNigoStage =
          (stage.label === 'Document Review' &&
            ((childType === 'kyc' && hoKycReview?.status === 'changes_requested') ||
              docReview?.status === 'nigo')) ||
          (stage.label === 'Principal Review' && principalReview?.status === 'nigo') ||
          (stage.label === 'AML Review' && (amlReview?.status === 'flagged' || amlReview?.status === 'escalated'))

        return (
          <div key={stage.label} className="relative flex gap-3">
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
                {stage.label}
              </p>
              {!compact && (
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    isPending ? 'text-muted-foreground/40' : 'text-muted-foreground',
                  )}
                >
                  {stage.description}
                </p>
              )}
              {timelineDetail && (
                <p className={cn('text-xs mt-0.5', isNigoStage ? 'text-destructive/80' : 'text-muted-foreground')}>
                  {timelineDetail}
                </p>
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[480px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-lg">{child.name}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="rounded-xl bg-muted/30 border border-border p-5">
            <h3 className="text-sm font-semibold mb-5">Summary</h3>
            <ChildActionTimeline
              childType={child.childType}
              status={child.status}
              reviewState={state.childReviewsByChildId?.[child.id]}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
