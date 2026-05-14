import {
  useWorkflow,
  useChildActionContext,
  getChildReviewState,
  useAdvisorResubmitEligible,
} from '@/stores/workflowStore'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import {
  getAccountOpeningChildSubmissionIssues,
  getAccountOpeningSubTaskProgress,
} from '@/utils/accountOpeningChildProgress'
import type { LucideIcon } from 'lucide-react'
import {
  ChevronLeft,
  FileText,
  Clock,
  ShieldCheck,
  Wallet,
  ArrowDownToLine,
  Cog,
  ListChecks,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWizardRightPanel } from '@/components/wizard/wizardRightPanelContext'
import { getActiveStageLabel } from '@/components/wizard/ChildActionTimelineSheet'
import { JourneyHeader } from '@/components/wizard/JourneyHeader'
import { computeOverallJourneyProgressPct } from '@/components/wizard/StepSidebar'
import { AssignAllTasksControl } from '@/components/wizard/AssignAllTasksControl'
import { ProgressIcon, pickVariant } from '@/components/wizard/ProgressIcons'
import {
  useOpenAccountsVariant,
  useOpenAccountsVariantControls,
} from '@/components/wizard/openAccountsVariantContext'
import type { TaskStatus } from '@/types/workflow'
import { getAccountOwnersMissingKyc } from '@/utils/accountOpeningOwnerKyc'
import { NigoDialog } from './NigoDialog'
import { getKycValidationErrors, kycChildHasOptionalIdVerification } from './forms/KycChildInfoForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const CHILD_TYPE_ICONS: Record<string, LucideIcon> = {
  'account-opening': Wallet,
  kyc: ShieldCheck,
  'funding-line': ArrowDownToLine,
  'feature-service-line': Cog,
}

const reviewDialogContentClass =
  'data-[state=open]:!animate-none data-[state=closed]:!animate-none !duration-0'

type ReviewReasonOption = { value: string; label: string }

const AML_REJECTION_REASONS: ReviewReasonOption[] = [
  { value: 'sanctions-potential-match', label: 'Potential sanctions or watchlist match' },
  { value: 'pep-adverse-media', label: 'PEP or adverse media concern' },
  { value: 'source-of-funds-unclear', label: 'Source of funds requires clarification' },
  { value: 'high-risk-geography', label: 'High-risk geography or cross-border exposure' },
  { value: 'business-activity-risk', label: 'Occupation, employer, or business activity risk' },
  { value: 'identity-data-inconsistency', label: 'Identity data inconsistency requires review' },
  { value: 'other', label: 'Other AML concern' },
]

const DOCUMENT_REVIEW_REJECTION_REASONS: ReviewReasonOption[] = [
  { value: 'id-missing', label: 'Government-issued ID is missing' },
  { value: 'id-expired-or-illegible', label: 'ID is expired, illegible, or incomplete' },
  { value: 'cip-data-mismatch', label: 'CIP data does not match submitted documentation' },
  { value: 'address-verification-needed', label: 'Address verification is missing or inconsistent' },
  { value: 'entity-documents-needed', label: 'Entity or trust verification documents are missing' },
  { value: 'control-person-needed', label: 'Control person or beneficial owner documentation is incomplete' },
  { value: 'additional-documentation-needed', label: 'Additional documentation is required' },
  { value: 'other', label: 'Other documentation issue' },
]

const CIP_REJECTION_REASONS: ReviewReasonOption[] = [
  { value: 'identity-verification-failed', label: 'Identity verification failed' },
  { value: 'tin-ssn-mismatch', label: 'SSN / TIN could not be verified' },
  { value: 'dob-mismatch', label: 'Date of birth does not match verification data' },
  { value: 'unable-to-verify-subject', label: 'Subject could not be verified' },
  { value: 'suspected-fraud', label: 'Suspected fraud or synthetic identity risk' },
  { value: 'unacceptable-id', label: 'Submitted ID is unacceptable for CIP' },
  { value: 'ineligible-subject', label: 'Subject is ineligible for account opening' },
  { value: 'other', label: 'Other CIP rejection reason' },
]

function formatStructuredReviewText(reason: string, details: string): string {
  const trimmedReason = reason.trim()
  const trimmedDetails = details.trim()
  if (trimmedReason && trimmedDetails) return `${trimmedReason}\n\nAdditional information: ${trimmedDetails}`
  return trimmedReason || trimmedDetails
}

function getReasonLabel(options: ReviewReasonOption[], value: string): string {
  return options.find((reason) => reason.value === value)?.label ?? ''
}

function getChildIcon(childType: string): LucideIcon {
  return CHILD_TYPE_ICONS[childType] ?? ListChecks
}

/**
 * Mirrors StepSidebar's TaskProgressIndicator so the sub-task pizza tracker
 * uses the same Figma icon set + tooltip copy as the parent journey.
 */
function SubTaskProgressIndicator({
  subTaskId,
  accountOpeningChildId,
  subTaskSuffix,
}: {
  subTaskId: string
  accountOpeningChildId?: string
  subTaskSuffix?: string
}) {
  const { state } = useWorkflow()
  const hasData = !!state.taskData[subTaskId] && Object.keys(state.taskData[subTaskId]).length > 0
  const isSubmitted = state.submittedTaskIds.includes(subTaskId)

  const accountChild = accountOpeningChildId
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === accountOpeningChildId)
    : undefined
  const lockedComplete =
    accountChild &&
    (accountChild.status === 'awaiting_review' || accountChild.status === 'complete')
  const isCanceled = accountChild?.status === 'canceled'

  let filled = 0
  let total = 1
  if (accountOpeningChildId && subTaskSuffix && !lockedComplete) {
    const progress = getAccountOpeningSubTaskProgress(state, accountOpeningChildId, subTaskSuffix)
    filled = progress.filled
    total = Math.max(progress.total, 1)
  } else if (lockedComplete) {
    filled = 1
  } else {
    filled = isSubmitted || hasData ? 1 : 0
  }
  const pct = Math.min(1, Math.max(0, filled / total))
  const edited = hasData
  const status: TaskStatus = isCanceled
    ? 'canceled'
    : pct >= 1
    ? 'complete'
    : 'in_progress'

  const variant = pickVariant({ pct, total, edited, status })
  const displayPct = Math.max(0, Math.min(100, Math.round(pct * 100)))
  const tooltipText =
    variant === 'canceled'
      ? 'Canceled'
      : variant === 'done'
      ? edited
        ? 'Complete · Edited'
        : 'Complete'
      : variant === 'ambiguous'
      ? 'No progress to report'
      : displayPct === 0
      ? edited
        ? 'Not started · Edited'
        : 'Not started'
      : edited
      ? `${displayPct}% complete · Edited`
      : `${displayPct}% complete`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="shrink-0 inline-flex items-center justify-center h-4 w-4"
          role="img"
          aria-label={tooltipText}
        >
          <ProgressIcon variant={variant} />
          <span className="sr-only">{tooltipText}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

type ReviewerDialog =
  | null
  | 'kyc-submit'
  | 'aml-approve'
  | 'aml-return'
  | 'aml-escalate'
  | 'ho-kyc-approve'
  | 'ho-kyc-request'
  | 'ho-kyc-reject'
  | 'doc-accept'
  | 'doc-request'
  | 'principal-approve'
  | 'principal-request'

function StatusActionButton({
  children,
  tone,
  disabled,
  onClick,
  className,
}: {
  children: ReactNode
  tone: 'primary' | 'accept' | 'reject' | 'secondary'
  disabled?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={tone === 'accept' ? 'default' : 'outline'}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-8 justify-center rounded-md px-2.5 text-xs font-medium active:scale-[0.99] transition-transform',
        tone === 'primary' &&
          'border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background focus-visible:text-background',
        tone === 'accept' && 'border-emerald-700/80 bg-emerald-700 text-white hover:bg-emerald-800',
        tone === 'reject' && 'border-red-700/80 bg-red-700 text-white hover:bg-red-800 hover:text-white',
        tone === 'secondary' && 'border-border bg-background text-foreground hover:bg-muted',
        className,
      )}
    >
      {children}
    </Button>
  )
}

function StatusActionGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-1 px-3 pb-2.5">{children}</div>
}

function SecondaryActionRow({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>
}

function ReviewTextDialog({
  open,
  title,
  description,
  reasonLabel,
  reasonPlaceholder = 'Select a reason...',
  reasonOptions,
  reasonValue,
  onReasonChange,
  label,
  placeholder,
  value,
  confirmLabel,
  confirmTone = 'default',
  onChange,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: ReactNode
  reasonLabel?: string
  reasonPlaceholder?: string
  reasonOptions?: ReviewReasonOption[]
  reasonValue?: string
  onReasonChange?: (value: string) => void
  label: string
  placeholder: string
  value: string
  confirmLabel: string
  confirmTone?: 'default' | 'destructive'
  onChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className={cn('max-w-md', reviewDialogContentClass)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {reasonOptions && reasonOptions.length > 0 && onReasonChange ? (
          <div className="space-y-2">
            <Label className="text-sm">{reasonLabel ?? 'Reason'}</Label>
            <Select value={reasonValue ?? ''} onValueChange={onReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder={reasonPlaceholder} />
              </SelectTrigger>
              <SelectContent className="z-[70]">
                {reasonOptions.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label className="text-sm">{label}</Label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[88px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmTone}
            onClick={onConfirm}
            disabled={Boolean(reasonOptions?.length) && !reasonValue}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReviewConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmClassName,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  confirmClassName?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className={cn('max-w-sm', reviewDialogContentClass)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" className={confirmClassName} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ChildReviewStatusActions() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const advisorResubmitEligible = useAdvisorResubmitEligible()
  const [dialog, setDialog] = useState<ReviewerDialog>(null)
  const [showNigoModal, setShowNigoModal] = useState<'document' | 'principal' | null>(null)
  const [comments, setComments] = useState('')
  const [selectedReason, setSelectedReason] = useState('')

  if (!ctx) return null

  const { child } = ctx
  const reviewState = getChildReviewState(state, child.id)
  const amlReview = reviewState?.amlReview
  const docReview = reviewState?.documentReview
  const principalReview = reviewState?.principalReview
  const hoKycReview = reviewState?.hoKycReview
  const childMeta = (state.taskData[child.id] as Record<string, unknown> | undefined) ?? {}
  const subjectLabel = childMeta.kycSubjectType === 'entity' ? 'legal entity' : 'individual'
  const mode = state.demoViewMode
  const kycParty =
    child.childType === 'kyc'
      ? state.relatedParties.find((p) => p.id === (childMeta.kycSubjectPartyId as string | undefined)) ??
        state.relatedParties.find((p) => p.name === child.name)
      : null
  const kycSubjectType: 'individual' | 'entity' =
    childMeta.kycSubjectType === 'entity' || kycParty?.type === 'related_organization'
      ? 'entity'
      : 'individual'

  const closeDialog = () => {
    setDialog(null)
    setComments('')
    setSelectedReason('')
  }

  const openKycSubmitDialog = () => {
    const infoTaskId = `${child.id}-info`
    const infoData = state.taskData[infoTaskId] ?? {}
    const errors = getKycValidationErrors(infoData, {
      optionalIdVerification: kycChildHasOptionalIdVerification(child),
      subjectType: kycSubjectType,
    })

    if (errors.length > 0) {
      toast.error('Please fix validation errors before submitting', {
        description: `${errors.length} required field${errors.length === 1 ? '' : 's'} need attention. Review the summary at the top of the form.`,
      })
      dispatch({
        type: 'SET_TASK_DATA',
        taskId: infoTaskId,
        fields: { _submitAttempted: true, _validationScrollNonce: Date.now() },
      })
      dispatch({ type: 'SET_CHILD_SUB_TASK', index: 0 })
      return
    }

    setDialog('kyc-submit')
  }

  const hasReviewerActions =
    mode === 'aml' ||
    mode === 'ho-documents' ||
    mode === 'ho-principal' ||
    mode === 'ho-kyc'
  const showAdvisorKycSubmit =
    mode === 'advisor' &&
    child.childType === 'kyc' &&
    (child.status === 'not_started' ||
      child.status === 'in_progress' ||
      advisorResubmitEligible)

  if (!hasReviewerActions && !showAdvisorKycSubmit) return null

  let actions: ReactNode = null
  let helper: ReactNode = null

  if (showAdvisorKycSubmit) {
    actions = (
      <StatusActionGroup>
        <StatusActionButton tone="primary" className="w-full" onClick={openKycSubmitDialog}>
          Submit for Review
        </StatusActionButton>
      </StatusActionGroup>
    )
  } else if (mode === 'aml') {
    const terminal = amlReview?.status && amlReview.status !== 'pending'
    if (!terminal) {
      actions = (
        <StatusActionGroup>
          <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('aml-approve')}>
            Approve
          </StatusActionButton>
          <SecondaryActionRow>
            <StatusActionButton tone="reject" className="w-full" onClick={() => setDialog('aml-escalate')}>
              Escalate
            </StatusActionButton>
            <StatusActionButton tone="secondary" className="w-full" onClick={() => setDialog('aml-return')}>
              Request Information
            </StatusActionButton>
          </SecondaryActionRow>
        </StatusActionGroup>
      )
    }
  } else if (mode === 'ho-kyc') {
    const amlBlocked =
      amlReview?.status === 'pending' ||
      amlReview?.status === 'flagged' ||
      amlReview?.status === 'info_requested'
    const amlEscalated = amlReview?.status === 'escalated'
    const terminal = hoKycReview?.status === 'approved' || amlEscalated

    if (amlEscalated) {
      helper = <p className="text-xs text-red-700">SAR escalated. KYC cannot be approved.</p>
    }

    if (!terminal) {
      actions = (
        <StatusActionGroup>
          {!amlBlocked ? (
            <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('ho-kyc-approve')}>
              Approve
            </StatusActionButton>
          ) : null}
          <SecondaryActionRow>
            {!amlBlocked ? (
              <StatusActionButton tone="reject" className="w-full" onClick={() => setDialog('ho-kyc-reject')}>
                Reject
              </StatusActionButton>
            ) : null}
            <StatusActionButton tone="secondary" className="w-full" onClick={() => setDialog('ho-kyc-request')}>
              Request Information
            </StatusActionButton>
          </SecondaryActionRow>
        </StatusActionGroup>
      )
    }
  } else if (mode === 'ho-documents') {
    const amlEscalated = amlReview?.status === 'escalated'
    const amlBlocked = amlReview?.status === 'pending' || amlReview?.status === 'flagged'
    const terminal = docReview?.status === 'igo' || docReview?.status === 'nigo' || amlEscalated

    if (amlEscalated) {
      helper = <p className="text-xs text-red-700">SAR escalated. Document review cannot be accepted.</p>
    }

    if (!terminal) {
      actions = (
        <StatusActionGroup>
          {!amlBlocked ? (
            <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('doc-accept')}>
              Accept
            </StatusActionButton>
          ) : null}
          <SecondaryActionRow>
            {!amlBlocked ? (
              <StatusActionButton tone="reject" className="w-full" onClick={() => setShowNigoModal('document')}>
                Reject
              </StatusActionButton>
            ) : null}
            <StatusActionButton tone="secondary" className="w-full" onClick={() => setDialog('doc-request')}>
              Request Information
            </StatusActionButton>
          </SecondaryActionRow>
        </StatusActionGroup>
      )
    }
  } else if (mode === 'ho-principal') {
    const docIgo = docReview?.status === 'igo'
    const amlGateApplies = amlReview != null
    const amlCleared = amlReview?.status === 'cleared'
    const amlEscalated = amlReview?.status === 'escalated'
    const kycBlockedOwners =
      child.childType === 'account-opening' ? getAccountOwnersMissingKyc(state, child.id).names : []
    const blocked = !docIgo || (amlGateApplies && !amlCleared) || kycBlockedOwners.length > 0
    const terminal = principalReview?.status === 'igo' || principalReview?.status === 'nigo' || amlEscalated

    if (amlEscalated) {
      helper = <p className="text-xs text-red-700">SAR escalated. Principal review cannot approve.</p>
    }

    if (!terminal) {
      actions = (
        !blocked ? (
          <StatusActionGroup>
            <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('principal-approve')}>
              Approve
            </StatusActionButton>
            <SecondaryActionRow>
              <StatusActionButton tone="reject" className="w-full" onClick={() => setShowNigoModal('principal')}>
                Reject
              </StatusActionButton>
              <StatusActionButton tone="secondary" className="w-full" onClick={() => setDialog('principal-request')}>
                Request Information
              </StatusActionButton>
            </SecondaryActionRow>
          </StatusActionGroup>
        ) : null
      )
    }
  }

  if (!actions && !helper) return null

  return (
    <>
      <div className={helper ? 'space-y-1.5' : undefined}>
        {helper ? <div className="px-3.5 pb-1">{helper}</div> : null}
        {actions}
      </div>

      <ReviewConfirmDialog
        open={dialog === 'kyc-submit'}
        title="Submit for Review"
        description={(
          <>
            You are about to submit <span className="font-medium text-foreground">{child.name}</span> for
            compliance verification. Once submitted, the information will be locked and forwarded for review.
          </>
        )}
        confirmLabel="Submit for Review"
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
          dispatch({ type: 'SET_DEMO_VIEW', mode: 'advisor' })
          closeDialog()
        }}
      />

      <ReviewConfirmDialog
        open={dialog === 'aml-approve'}
        title="Approve AML Review"
        description={(
          <>
            Confirm approval for <span className="font-medium text-foreground">{child.name}</span> after
            AML/sanctions screening review is complete.
          </>
        )}
        confirmLabel="Confirm Approval"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({ type: 'AML_REVIEW_CLEAR' })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'aml-return'}
        title="Request Information"
        description={(
          <>
            Request additional information from the advisor for{' '}
            <span className="font-medium text-foreground">{child.name}</span>.
          </>
        )}
        reasonLabel="Documentation reason"
        reasonOptions={DOCUMENT_REVIEW_REJECTION_REASONS}
        reasonValue={selectedReason}
        onReasonChange={setSelectedReason}
        label="Additional information"
        placeholder="Describe the AML concerns, potential matches, or corrections needed..."
        value={comments}
        confirmLabel="Send Request"
        confirmTone="destructive"
        onChange={setComments}
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({
            type: 'AML_REVIEW_FLAG',
            findings: formatStructuredReviewText(getReasonLabel(DOCUMENT_REVIEW_REJECTION_REASONS, selectedReason), comments) || undefined,
          })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'aml-escalate'}
        title="Escalate for Suspicious Activity"
        description={(
          <>
            Escalate <span className="font-medium text-foreground">{child.name}</span> for suspicious activity handling.
          </>
        )}
        reasonLabel="AML reason"
        reasonOptions={AML_REJECTION_REASONS}
        reasonValue={selectedReason}
        onReasonChange={setSelectedReason}
        label="Additional information"
        placeholder="Describe the reason for the escalation..."
        value={comments}
        confirmLabel="Confirm Escalation"
        confirmTone="destructive"
        onChange={setComments}
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({
            type: 'AML_ESCALATE_SAR',
            reason: formatStructuredReviewText(getReasonLabel(AML_REJECTION_REASONS, selectedReason), comments) || undefined,
          })
          closeDialog()
        }}
      />

      <ReviewConfirmDialog
        open={dialog === 'ho-kyc-approve'}
        title="Approve KYC"
        description={(
          <>
            Confirm that this <span className="font-medium text-foreground">{subjectLabel}</span> (
            <span className="font-medium text-foreground">{child.name}</span>) has completed KYC verification
            and all data has been reviewed.
          </>
        )}
        confirmLabel="Confirm Approval"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({ type: 'HO_KYC_APPROVE' })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'ho-kyc-request'}
        title="Request Information"
        description={(
          <>
            Request additional details for this <span className="font-medium text-foreground">{subjectLabel}</span> (
            <span className="font-medium text-foreground">{child.name}</span>) before final review.
          </>
        )}
        reasonLabel="Documentation reason"
        reasonOptions={DOCUMENT_REVIEW_REJECTION_REASONS}
        reasonValue={selectedReason}
        onReasonChange={setSelectedReason}
        label="Additional information"
        placeholder="Describe what additional information is needed..."
        value={comments}
        confirmLabel="Send Request"
        onChange={setComments}
        onCancel={closeDialog}
        onConfirm={() => {
          const feedback =
            formatStructuredReviewText(getReasonLabel(DOCUMENT_REVIEW_REJECTION_REASONS, selectedReason), comments) ||
            'Please provide additional information.'
          dispatch({ type: 'HO_KYC_REQUEST_CHANGES', comments: feedback })
          toast('Document Review requested information', {
            description: feedback,
            icon: <MessageSquare className="h-4 w-4 text-amber-600" />,
            duration: 6000,
          })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'ho-kyc-reject'}
        title="Reject"
        description="Reject this submission and return it to advisor with rationale."
        reasonLabel="Rejection reason"
        reasonOptions={CIP_REJECTION_REASONS}
        reasonValue={selectedReason}
        onReasonChange={setSelectedReason}
        label="Additional information"
        placeholder="Describe the reason for rejection..."
        value={comments}
        confirmLabel="Confirm Reject"
        confirmTone="destructive"
        onChange={setComments}
        onCancel={closeDialog}
        onConfirm={() => {
          const feedback =
            formatStructuredReviewText(getReasonLabel(CIP_REJECTION_REASONS, selectedReason), comments) ||
            'Rejected by Document Review.'
          dispatch({ type: 'HO_KYC_REQUEST_CHANGES', comments: feedback })
          closeDialog()
        }}
      />

      <ReviewConfirmDialog
        open={dialog === 'doc-accept'}
        title="Accept document review"
        description={(
          <>
            All documents for <span className="font-medium text-foreground">{child.name}</span> have been verified.
            This will pass the submission to the Principal Review team.
          </>
        )}
        confirmLabel="Confirm accept"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({ type: 'DOCUMENT_REVIEW_IGO' })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'doc-request'}
        title="Request Information"
        description={(
          <>
            Request additional information from the advisor for{' '}
            <span className="font-medium text-foreground">{child.name}</span>.
          </>
        )}
        reasonLabel="Documentation reason"
        reasonOptions={DOCUMENT_REVIEW_REJECTION_REASONS}
        reasonValue={selectedReason}
        onReasonChange={setSelectedReason}
        label="Additional information"
        placeholder="Describe what additional documentation or corrections are needed..."
        value={comments}
        confirmLabel="Send Request"
        onChange={setComments}
        onCancel={closeDialog}
        onConfirm={() => {
          const reason = getReasonLabel(DOCUMENT_REVIEW_REJECTION_REASONS, selectedReason)
          dispatch({
            type: 'DOCUMENT_REVIEW_NIGO',
            reason,
            feedback: comments.trim() || undefined,
          })
          closeDialog()
        }}
      />

      <ReviewConfirmDialog
        open={dialog === 'principal-approve'}
        title="Approve Account Opening"
        description={(
          <>
            Are you sure you want to approve <span className="font-medium text-foreground">{child.name}</span>?
            This will finalize the account and clear it for processing at Pershing.
          </>
        )}
        confirmLabel="Confirm Approval"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({ type: 'PRINCIPAL_REVIEW_IGO' })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'principal-request'}
        title="Request Information"
        description={(
          <>
            Request additional information from the advisor for{' '}
            <span className="font-medium text-foreground">{child.name}</span>.
          </>
        )}
        reasonLabel="Documentation reason"
        reasonOptions={DOCUMENT_REVIEW_REJECTION_REASONS}
        reasonValue={selectedReason}
        onReasonChange={setSelectedReason}
        label="Additional information"
        placeholder="Describe what additional information or corrections are needed before principal approval..."
        value={comments}
        confirmLabel="Send Request"
        onChange={setComments}
        onCancel={closeDialog}
        onConfirm={() => {
          const reason = getReasonLabel(DOCUMENT_REVIEW_REJECTION_REASONS, selectedReason)
          dispatch({
            type: 'PRINCIPAL_REVIEW_NIGO',
            reason,
            feedback: comments.trim() || undefined,
          })
          closeDialog()
        }}
      />

      <NigoDialog
        open={showNigoModal === 'document'}
        onClose={() => setShowNigoModal(null)}
        teamLabel="Document Review Team"
        variant="reject"
        reasonLabel="Documentation reason"
        reasonOptions={DOCUMENT_REVIEW_REJECTION_REASONS}
        onSubmit={(reason, feedback) => {
          dispatch({ type: 'DOCUMENT_REVIEW_NIGO', reason, feedback: feedback || undefined })
          setShowNigoModal(null)
        }}
      />

      <NigoDialog
        open={showNigoModal === 'principal'}
        onClose={() => setShowNigoModal(null)}
        teamLabel="Principal Review Team"
        onSubmit={(reason, feedback) => {
          dispatch({ type: 'PRINCIPAL_REVIEW_NIGO', reason, feedback: feedback || undefined })
          setShowNigoModal(null)
        }}
      />
    </>
  )
}

export function ChildActionSidebar() {
  const { state, dispatch } = useWorkflow()
  const navigate = useNavigate()
  const ctx = useChildActionContext()
  const { setCollapsed: setRightPanelCollapsed, setActiveTab: setRightPanelTab } = useWizardRightPanel()
  const variant = useOpenAccountsVariant()
  const { variant: selectedVariant } = useOpenAccountsVariantControls()
  const journeyProgressPct = useMemo(
    () => computeOverallJourneyProgressPct(state, selectedVariant),
    [state, selectedVariant],
  )
  const [exitToOnboardingOpen, setExitToOnboardingOpen] = useState(false)
  const [resubmitOpen, setResubmitOpen] = useState(false)
  const advisorResubmitEligible = useAdvisorResubmitEligible()

  if (!ctx) return null

  const { child, config, subTaskIndex } = ctx
  /** Match top-level nav style: no numeric prefixes for drill-in child flows. */
  const showSubTaskNumbers =
    child.childType !== 'account-opening' &&
    child.childType !== 'kyc' &&
    child.childType !== 'funding-line' &&
    child.childType !== 'feature-service-line'
  const viewMode = state.demoViewMode

  const parentTask = state.tasks.find((t) =>
    (t.children ?? []).some((c) => c.id === child.id),
  )
  const parentAction = parentTask
    ? state.actions.find((a) => a.id === parentTask.actionId)
    : undefined
  const breadcrumbLabel = parentAction?.title ?? parentTask?.title ?? 'Back'
  const v5OpenAccountsLabel = parentAction?.title ?? parentTask?.title ?? 'Open Accounts'
  const ChildIcon = getChildIcon(child.childType)
  const parentSectionId =
    child.childType === 'account-opening'
      ? 'oa-accounts'
      : child.childType === 'kyc' && parentTask?.formKey === 'open-accounts'
        ? 'oa-kyc'
        : undefined
  const exitToParentAction = () => {
    if (!parentTask) {
      dispatch({ type: 'EXIT_CHILD_ACTION' })
      navigate(`/servicing/${state.journeyId}`, { replace: true })
      return
    }

    const params = new URLSearchParams({ taskId: parentTask.id })
    if (parentSectionId) params.set('sectionId', parentSectionId)

    dispatch({ type: 'GO_TO_TASK', taskId: parentTask.id })
    if (parentSectionId) {
      dispatch({ type: 'FOCUS_PARENT_TASK_SECTION', sectionId: parentSectionId })
    }
    navigate(`/servicing/${state.journeyId}?${params.toString()}`, { replace: true })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="w-[330px] shrink-0 border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground flex flex-col min-h-0 self-stretch h-full">
        <JourneyHeader
          showChevron={variant !== 'v5'}
          onChevronBack={() => navigate(-1)}
          metaDateLabel={state.journeyDateLabel}
          metaAssigneeLabel={state.assignedTo}
          metaProgressPct={journeyProgressPct}
          breadcrumbItems={
            variant === 'v5'
              ? [
                  { label: 'Home', onClick: () => setExitToOnboardingOpen(true) },
                  { label: v5OpenAccountsLabel, onClick: exitToParentAction },
                ]
              : undefined
          }
        />
        {variant !== 'v5' && (
          <div className="flex h-9 items-center gap-1 px-2 border-b border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={exitToParentAction}
              aria-label={`Back to ${breadcrumbLabel}`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <span className="text-xs text-muted-foreground truncate">
              {breadcrumbLabel}
            </span>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto px-1 pt-2">
          <div className="flex gap-2 px-3 mb-5">
            {/* Match StepSidebar spine: line z-0, opaque icon z-10, flex-1 filler; keep this column above the task column if layers overlap at the gutter. */}
            <div className="relative z-20 flex w-7 shrink-0 flex-col items-center self-stretch">
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-0 w-px -translate-x-1/2 bg-sidebar-border"
              />
              <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ChildIcon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-h-0 w-full flex-1 shrink" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex h-9 min-h-9 items-center">
                <h2 className="text-sm font-semibold text-foreground truncate">{child.name}</h2>
              </div>

              <ul className="space-y-1">
                {config.subTasks.map((subTask, idx) => {
                  const subTaskId = `${child.id}-${subTask.suffix}`
                  return (
                    <li key={subTask.suffix}>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'SET_CHILD_SUB_TASK', index: idx })}
                        aria-current={idx === subTaskIndex ? 'page' : undefined}
                        className={cn(
                          'w-full text-left pl-0 pr-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between gap-2 transition-colors',
                          idx === subTaskIndex
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'flex items-center gap-2 truncate min-w-0',
                            idx === subTaskIndex ? 'font-semibold' : '',
                          )}
                        >
                          {showSubTaskNumbers && (
                            <span className="text-[11px] text-muted-foreground w-4 shrink-0">
                              {idx + 1}.
                            </span>
                          )}
                          {getSubTaskDisplayTitle(child.childType, subTask, viewMode)}
                        </span>
                        <SubTaskProgressIndicator
                          subTaskId={subTaskId}
                          accountOpeningChildId={child.childType === 'account-opening' ? child.id : undefined}
                          subTaskSuffix={child.childType === 'account-opening' ? subTask.suffix : undefined}
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>

        {(child.childType === 'account-opening' || child.childType === 'kyc') && (() => {
          const reviewState = getChildReviewState(state, child.id)
          const docIsNigo = reviewState?.documentReview?.status === 'nigo'
          const stageLabel = docIsNigo
            ? 'NIGO'
            : getActiveStageLabel(child.status, child.childType, reviewState ?? undefined)
          const statusSentence = docIsNigo
            ? 'Review feedback and resubmit for document review.'
            : stageLabel === 'Draft'
              ? 'Application is in progress.'
              : `Application is in ${stageLabel.toLowerCase()}.`
          const detailSentence =
            docIsNigo ? null : stageLabel === 'Draft'
              ? 'Complete all sections to submit.'
              : 'Check the activity timeline for details.'
          const showResubmit = state.demoViewMode === 'advisor' && docIsNigo && advisorResubmitEligible
          return (
            <div className="shrink-0 p-2 border-t border-border">
              <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
                <div className="px-3 pb-2 pt-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-foreground/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground leading-none">Application Status</p>
                    <p className="text-[17px] font-semibold leading-[1.15] truncate">{stageLabel}</p>
                  </div>
                </div>
                <div className="px-3 pb-2.5 space-y-3">
                  {docIsNigo ? (
                    <p className="text-sm text-foreground leading-snug">{statusSentence}</p>
                  ) : (
                    <p className="text-[12.5px] font-normal text-muted-foreground/85 leading-snug">
                      {statusSentence}
                      {detailSentence ? (
                        <>
                          <br />
                          {detailSentence}
                        </>
                      ) : null}
                    </p>
                  )}
                  {showResubmit ? (
                    <Button type="button" className="w-full" onClick={() => setResubmitOpen(true)}>
                      Resubmit for Review
                    </Button>
                  ) : null}
                </div>
                <ChildReviewStatusActions />
                <div className="border-t border-border/60 bg-muted/35 px-3 flex items-center" style={{ minHeight: '44px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRightPanelTab('activity')
                      setRightPanelCollapsed(false)
                    }}
                    className="flex h-7 items-center gap-1.5 rounded-md bg-muted px-2.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-muted/80 hover:text-foreground active:scale-[0.99]"
                  >
                    Activity
                    <Clock className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        <AssignAllTasksControl />
      </nav>
      <Dialog open={resubmitOpen} onOpenChange={setResubmitOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resubmit for review?</DialogTitle>
            <DialogDescription>
              This will resubmit the application to the Document Review Team. Advisor edits will lock until review
              completes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResubmitOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (child.childType === 'account-opening') {
                  const issues = getAccountOpeningChildSubmissionIssues(state, child.id)
                  if (issues.length > 0) {
                    toast.error('Cannot submit yet', {
                      description: `Resolve ${issues.length} issue${issues.length === 1 ? '' : 's'} before resubmitting.`,
                    })
                    setResubmitOpen(false)
                    return
                  }
                }
                dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
                dispatch({ type: 'SET_DEMO_VIEW', mode: child.childType === 'account-opening' ? 'ho-documents' : 'advisor' })
                setResubmitOpen(false)
              }}
            >
              Resubmit for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={exitToOnboardingOpen} onOpenChange={setExitToOnboardingOpen}>
        <DialogContent className="max-w-md !data-[state=closed]:zoom-out-100 !data-[state=open]:zoom-in-100 !data-[state=closed]:slide-out-to-left-0 !data-[state=open]:slide-in-from-left-0 !data-[state=closed]:slide-out-to-top-[50%] !data-[state=open]:slide-in-from-top-[50%]">
          <DialogHeader>
            <DialogTitle>Exit current workflow?</DialogTitle>
            <DialogDescription>
              This takes you out of the current workflow and back to the home page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExitToOnboardingOpen(false)}>
              Continue workflow
            </Button>
            <Button
              type="button"
              style={{ backgroundColor: '#000000', color: '#ffffff' }}
              className="hover:opacity-90"
              onClick={() => {
                setExitToOnboardingOpen(false)
                navigate('/')
              }}
            >
              Exit workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
