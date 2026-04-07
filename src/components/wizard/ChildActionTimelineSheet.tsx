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
  { label: 'AML Review', description: 'AML Team reviews watchlist codes against OFAC and KYC platforms.', matchStatuses: ['rejected'] },
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
  if (childType !== 'account-opening' && childType !== 'funding-line' && childType !== 'feature-service-line') {
    return rawStatus
  }

  if (rawStatus !== 'awaiting_review' && rawStatus !== 'rejected' && rawStatus !== 'complete') {
    return rawStatus
  }

  if (rawStatus === 'complete') return 'complete'

  const docStatus = reviewState?.documentReview?.status
  const principalStatus = reviewState?.principalReview?.status

  if (rawStatus === 'rejected') {
    if (principalStatus === 'nigo') return 'rejected'
    if (docStatus === 'nigo') return 'rejected'
    return 'rejected'
  }

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

  return (
    <div className="relative">
      {stages.map((stage, i) => {
        const isActive = i === activeIndex
        const isComplete = i < activeIndex
        const isPending = i > activeIndex
        const isLast = i === stages.length - 1

        let stageAnnotation: string | null = null
        if (stage.label === 'Document Review' && docReview) {
          if (docReview.status === 'igo') stageAnnotation = `IGO at ${docReview.decidedAt}`
          else if (docReview.status === 'nigo') stageAnnotation = `NIGO at ${docReview.decidedAt}`
        }
        if (stage.label === 'Principal Review' && principalReview) {
          if (principalReview.status === 'igo') stageAnnotation = `Approved at ${principalReview.decidedAt}`
          else if (principalReview.status === 'nigo') stageAnnotation = `Rejected at ${principalReview.decidedAt}`
        }

        const isNigoStage =
          (stage.label === 'Document Review' && docReview?.status === 'nigo') ||
          (stage.label === 'Principal Review' && principalReview?.status === 'nigo')

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
                  {formatTimestamp()} by <span className="underline">{isRejected ? 'Home Office' : 'Jane Advisor'}</span>
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
