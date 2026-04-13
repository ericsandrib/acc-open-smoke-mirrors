import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { ChildTask, ChildType, WorkflowState } from '@/types/workflow'
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
  { label: 'Pending Client Signature', description: 'Combined eSign package generated and sent to client for signature.', matchStatuses: [] },
  { label: 'Pending Advisor Signature', description: 'Awaiting advisor counter-signature on the application.', matchStatuses: [] },
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
  { label: 'Home Office Review', description: 'Home Office KYC Team reviews the complete submission.', matchStatuses: ['ho_kyc_pending', 'ho_kyc_changes_requested'] },
  { label: 'Principal Sign-Off', description: 'Principal performs final sign-off on the KYC package.', matchStatuses: ['principal_kyc_pending', 'principal_kyc_rejected'] },
  { label: 'Complete', description: 'Identity verified. No further KYC action required.', matchStatuses: ['complete'] },
]

function getStagesForType(childType: ChildType): TimelineStage[] {
  return childType === 'kyc' ? KYC_STAGES : ACCOUNT_OPENING_STAGES
}

function deriveEffectiveStatus(
  rawStatus: string,
  childType: ChildType,
  reviewState?: WorkflowState['childReviewState'],
): string {
  if (rawStatus === 'complete') return 'complete'

  if (childType === 'kyc') {
    const amlStatus = reviewState?.amlReview?.status
    const hoKycStatus = reviewState?.hoKycReview?.status
    const principalKycStatus = reviewState?.principalKycReview?.status

    if (rawStatus === 'rejected') {
      if (amlStatus === 'flagged' || amlStatus === 'escalated') return 'rejected'
      if (principalKycStatus === 'rejected') return 'principal_kyc_rejected'
      if (hoKycStatus === 'changes_requested') return 'ho_kyc_changes_requested'
      return 'rejected'
    }

    if (rawStatus === 'awaiting_review' || rawStatus === 'complete') {
      if (amlStatus === 'pending') return 'aml_pending'
      if (amlStatus === 'flagged') return 'aml_flagged'
      if (amlStatus === 'cleared' && hoKycStatus === 'pending') return 'ho_kyc_pending'
      if (hoKycStatus === 'approved') return 'principal_kyc_pending'
      if (principalKycStatus === 'pending') return 'principal_kyc_pending'
      if (principalKycStatus === 'approved') return 'complete'
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
  reviewState?: WorkflowState['childReviewState'],
): string {
  const effectiveStatus = deriveEffectiveStatus(rawStatus, childType, reviewState)
  const stages = getStagesForType(childType)
  const idx = getActiveStageIndex(stages, effectiveStatus)
  return stages[idx].label
}

function formatTimestamp() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ', ' + new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
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
  reviewState?: WorkflowState['childReviewState']
}) {
  const effectiveStatus = deriveEffectiveStatus(status, childType, reviewState)
  const stages = getStagesForType(childType)
  const activeIndex = getActiveStageIndex(stages, effectiveStatus)
  const isRejected = effectiveStatus === 'rejected'

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

        const hoKycReview = reviewState?.hoKycReview
        const principalKycReview = reviewState?.principalKycReview

        let stageAnnotation: string | null = null
        if (stage.label === 'Document Review' && docReview) {
          if (docReview.status === 'igo') stageAnnotation = `Accepted at ${docReview.decidedAt}`
          else if (docReview.status === 'nigo') stageAnnotation = `Rejected at ${docReview.decidedAt}`
        }
        if (stage.label === 'Principal Review' && principalReview) {
          if (principalReview.status === 'igo') stageAnnotation = `Approved at ${principalReview.decidedAt}`
          else if (principalReview.status === 'nigo') stageAnnotation = `Rejected at ${principalReview.decidedAt}`
        }
        if (stage.label === 'AML Review' && amlReview) {
          if (amlReview.status === 'cleared') stageAnnotation = `Cleared at ${amlReview.decidedAt}`
          else if (amlReview.status === 'flagged') stageAnnotation = `Flagged at ${amlReview.decidedAt}`
          else if (amlReview.status === 'escalated') stageAnnotation = `Rejected at ${amlReview.decidedAt}`
        }
        if (stage.label === 'Home Office Review' && hoKycReview) {
          if (hoKycReview.status === 'approved') stageAnnotation = `Approved at ${hoKycReview.decidedAt}`
          else if (hoKycReview.status === 'changes_requested') stageAnnotation = `Changes requested at ${hoKycReview.decidedAt}`
        }
        if (stage.label === 'Principal Sign-Off' && principalKycReview) {
          if (principalKycReview.status === 'approved') stageAnnotation = `Signed off at ${principalKycReview.decidedAt}`
          else if (principalKycReview.status === 'rejected') stageAnnotation = `Rejected at ${principalKycReview.decidedAt}`
        }

        const isNigoStage =
          (stage.label === 'Document Review' && docReview?.status === 'nigo') ||
          (stage.label === 'Principal Review' && principalReview?.status === 'nigo') ||
          (stage.label === 'AML Review' && (amlReview?.status === 'flagged' || amlReview?.status === 'escalated')) ||
          (stage.label === 'Home Office Review' && hoKycReview?.status === 'changes_requested') ||
          (stage.label === 'Principal Sign-Off' && principalKycReview?.status === 'rejected')

        return (
          <div key={stage.label} className="relative flex gap-3">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[11px] top-[24px] w-[2px] bottom-0',
                  isComplete ? 'bg-foreground' : 'bg-border',
                )}
              />
            )}

            <div className="relative z-10 shrink-0 mt-0.5">
              {(isRejected && isActive) || isNigoStage ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                  <XCircle className="h-4 w-4" />
                </div>
              ) : isComplete || isActive ? (
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
              {stageAnnotation && (
                <p className={cn('text-xs mt-0.5', isNigoStage ? 'text-destructive/80' : 'text-muted-foreground')}>
                  {stageAnnotation}
                </p>
              )}
              {isActive && !stageAnnotation && (
                <p className={cn('text-xs mt-0.5', isRejected ? 'text-destructive/80' : 'text-muted-foreground')}>
                  {formatTimestamp()} by <span className="underline">{isRejected ? (childType === 'kyc' ? 'AML Team' : 'Home Office') : 'Jane Advisor'}</span>
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
              reviewState={state.childReviewState}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
