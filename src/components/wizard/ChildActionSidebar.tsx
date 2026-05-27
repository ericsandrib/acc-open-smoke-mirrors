import {
  useWorkflow,
  useChildActionContext,
  getChildReviewState,
  useAdvisorResubmitEligible,
} from '@/stores/workflowStore'
import { useServicing } from '@/stores/servicingStore'
import { useNavigate } from 'react-router-dom'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getSubTaskDisplayTitle, getVisibleChildSubTasks } from '@/utils/childTaskRegistry'
import { getAccountWorkflowPhase, ownersAmlScreeningCleared } from '@/utils/ownerKycReview'
import {
  getAccountOpeningSubTaskProgress,
} from '@/utils/accountOpeningChildProgress'
import { getGenericChildSubTaskProgress } from '@/utils/childSubTaskProgress'
import {
  Clock,
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
import { isChildAwaitingAdvisorClarification } from '@/utils/childStatusDisplay'
import { getKycValidationErrors, kycChildHasOptionalIdVerification } from './forms/KycChildInfoForm'
import { JourneyHeader, type WorkflowBreadcrumbItem } from '@/components/wizard/JourneyHeader'
import { PizzaTrackerRowMeta, PIZZA_TRACKER_META_ROW_PADDING } from '@/components/wizard/PizzaTrackerRowMeta'
import { PizzaTrackerTaskNameTooltip } from '@/components/wizard/PizzaTrackerTaskNameTooltip'
import { usePizzaTrackerDisplayPrefs, PizzaTrackerDisplayPrefsProvider } from '@/components/wizard/usePizzaTrackerDisplayPrefs'
import { computeOverallJourneyProgressPct } from '@/components/wizard/StepSidebar'
import { getChildSubTaskDueMeta } from '@/utils/pizzaTrackerMeta'
import {
  captureJourneyAssigneeSnapshot,
  captureTaskAssignees,
  restoreJourneyAssigneeSnapshot,
  restoreTaskAssignees,
} from '@/utils/assigneeAssignUndo'
import { ApplicationStatusWidget } from '@/components/wizard/ApplicationStatusWidget'
import { useTheme } from '@/stores/themeStore'
import { isSingleFlowKycEnabled } from '@/utils/ownerKycReview'
import { findParentTaskForChild } from '@/utils/openAccountsTaskContext'
import { AssignAllTasksControl } from '@/components/wizard/AssignAllTasksControl'
import { PizzaTrackerProgressIndicator } from '@/components/wizard/PizzaTrackerProgressIndicator'
import type { PizzaTrackerRowProgress } from '@/components/wizard/pizzaTrackerDisplayProgress'
import {
  useOpenAccountsVariant,
  useOpenAccountsVariantControls,
} from '@/components/wizard/openAccountsVariantContext'
import type { ChildTask, TaskStatus, WorkflowState } from '@/types/workflow'
import { getAccountOwnersMissingKyc } from '@/utils/accountOpeningOwnerKyc'
import {
  isChildInAmlReviewQueue,
  isChildInDocumentReviewQueue,
  isChildInHoKycReviewQueue,
  isChildInPrincipalReviewQueue,
} from '@/utils/childReviewQueue'
import { NigoDialog } from './NigoDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { handleWizardPanelShellWheel, handleWizardScrollPaneWheel } from '@/utils/wizardScroll'
import { formatStructuredReviewText } from '@/utils/formatStructuredReviewText'

import { PizzaTrackerActionIcon } from '@/components/wizard/PizzaTrackerEntityIcons'

const reviewDialogContentClass =
  'data-[state=open]:!animate-none data-[state=closed]:!animate-none !duration-0'

type ReviewReasonOption = { value: string; label: string }

/** Escalation / legacy AML return flows — not used for account-opening rejection modal. */
const AML_REJECTION_REASONS: ReviewReasonOption[] = [
  { value: 'sanctions-potential-match', label: 'Potential sanctions or watchlist match' },
  { value: 'pep-adverse-media', label: 'PEP or adverse media concern' },
  { value: 'source-of-funds-unclear', label: 'Source of funds requires clarification' },
  { value: 'high-risk-geography', label: 'High-risk geography or cross-border exposure' },
  { value: 'business-activity-risk', label: 'Occupation, employer, or business activity risk' },
  { value: 'identity-data-inconsistency', label: 'Identity data inconsistency requires review' },
  { value: 'other', label: 'Other AML concern' },
]

/** Account-opening AML reject disposition — required structured reason + optional notes. */
const ACCOUNT_OPENING_AML_REJECTION_REASONS: ReviewReasonOption[] = [
  { value: 'potential-pep-match', label: 'Potential PEP match' },
  { value: 'ofac-sanctions-match', label: 'OFAC / sanctions match' },
  { value: 'adverse-media-findings', label: 'Adverse media findings' },
  { value: 'identity-mismatch', label: 'Identity mismatch' },
  { value: 'fraud-concern', label: 'Fraud concern' },
  { value: 'unable-to-verify-identity', label: 'Unable to verify identity' },
  { value: 'insufficient-supporting-documentation', label: 'Insufficient supporting documentation' },
  { value: 'duplicate-suspicious-activity', label: 'Duplicate / suspicious account activity' },
  { value: 'compliance-policy-restriction', label: 'Compliance policy restriction' },
  { value: 'other', label: 'Other' },
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

function getReasonLabel(options: ReviewReasonOption[], value: string): string {
  return options.find((reason) => reason.value === value)?.label ?? ''
}

/**
 * Mirrors StepSidebar progress signals for child sub-task rows.
 */
function getChildSubTaskNavProgress(
  state: WorkflowState,
  child: ChildTask,
  subTask: { suffix: string; formKey: string },
  subTaskIndex: number,
): PizzaTrackerRowProgress {
  const subTaskId = `${child.id}-${subTask.suffix}`
  const hasData = !!state.taskData[subTaskId] && Object.keys(state.taskData[subTaskId]).length > 0
  const accountOpeningChildId = child.childType === 'account-opening' ? child.id : undefined
  const subTaskSuffix = child.childType === 'account-opening' ? subTask.suffix : undefined

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
    const progress = getGenericChildSubTaskProgress(state, {
      subTaskId,
      formKey: subTask.formKey,
      childId: child.id,
      subTaskIndex,
    })
    filled = progress.filled
    total = progress.total
  }

  const pct = Math.min(1, Math.max(0, filled / total))
  const edited = hasData
  const status: TaskStatus = isCanceled
    ? 'canceled'
    : pct >= 1
      ? 'complete'
      : 'in_progress'

  return { pct, total, edited, status }
}

function computeChildSubTasksProgress(
  state: WorkflowState,
  child: ChildTask,
  visibleSubTasks: ReadonlyArray<{ suffix: string; formKey: string }>,
): PizzaTrackerRowProgress {
  if (visibleSubTasks.length === 0) {
    return { pct: 0, total: 0, edited: false, status: 'not_started' }
  }

  const nodeProgress = visibleSubTasks.map((subTask, idx) =>
    getChildSubTaskNavProgress(state, child, subTask, idx),
  )
  const measurable = nodeProgress.filter((p) => p.total > 0)
  const pct =
    measurable.length > 0
      ? measurable.reduce((sum, p) => sum + p.pct, 0) / measurable.length
      : 0
  const edited = nodeProgress.some((p) => p.edited)
  const status: TaskStatus =
    child.status === 'canceled'
      ? 'canceled'
      : pct >= 1
        ? 'complete'
        : 'in_progress'

  return { pct, total: measurable.length > 0 ? 1 : 0, edited, status }
}

function SubTaskProgressIndicator({
  formKey,
  childId,
  subTaskIndex,
  subTaskSuffix,
}: {
  formKey: string
  childId: string
  subTaskIndex: number
  subTaskSuffix: string
}) {
  const { state } = useWorkflow()
  const child = state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === childId)
  if (!child) return null

  const progress = getChildSubTaskNavProgress(
    state,
    child,
    { suffix: subTaskSuffix, formKey },
    subTaskIndex,
  )

  return (
    <PizzaTrackerProgressIndicator
      pct={progress.pct}
      total={progress.total}
      edited={progress.edited}
      status={progress.status}
    />
  )
}

type ReviewerDialog =
  | null
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
  | 'account-aml-approve'
  | 'account-aml-reject'
  | 'account-cip-approve'
  | 'account-cip-request'
  | 'account-principal-approve'
  | 'account-principal-reject'
  | 'account-principal-request'

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
  return <div className="space-y-1 px-4 pb-4">{children}</div>
}

function SecondaryActionRow({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>
}

function ReviewTextDialog({
  open,
  title,
  description,
  supportingDescription,
  reasonLabel,
  reasonPlaceholder = 'Select a reason...',
  reasonOptions,
  reasonValue,
  onReasonChange,
  label,
  placeholder,
  value,
  requireNotesWhenReasonValue,
  notesValidationMessage,
  confirmLabel,
  confirmTone = 'default',
  onChange,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: ReactNode
  supportingDescription?: ReactNode
  reasonLabel?: string
  reasonPlaceholder?: string
  reasonOptions?: ReviewReasonOption[]
  reasonValue?: string
  onReasonChange?: (value: string) => void
  label: string
  placeholder: string
  value: string
  requireNotesWhenReasonValue?: string
  notesValidationMessage?: string
  confirmLabel: string
  confirmTone?: 'default' | 'destructive'
  onChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const notesTrimmed = value.trim()
  const reasonRequired = Boolean(reasonOptions?.length)
  const reasonMissing = reasonRequired && !reasonValue
  const notesRequired =
    Boolean(requireNotesWhenReasonValue) && reasonValue === requireNotesWhenReasonValue
  const notesInvalid = notesRequired && !notesTrimmed
  const confirmDisabled = reasonMissing || notesInvalid

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className={cn('max-w-md', reviewDialogContentClass)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{description}</p>
              {supportingDescription ? <p>{supportingDescription}</p> : null}
            </div>
          </DialogDescription>
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
          {notesInvalid && notesValidationMessage ? (
            <p className="text-xs text-destructive">{notesValidationMessage}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmTone}
            onClick={onConfirm}
            disabled={confirmDisabled}
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
  notesLabel,
  notesPlaceholder,
  notesValue,
  onNotesChange,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  confirmClassName?: string
  notesLabel?: string
  notesPlaceholder?: string
  notesValue?: string
  onNotesChange?: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const hasNotes = Boolean(notesLabel && onNotesChange)
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className={cn(hasNotes ? 'max-w-md' : 'max-w-sm', reviewDialogContentClass)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {hasNotes ? (
          <div className="space-y-2">
            <Label className="text-sm">{notesLabel}</Label>
            <textarea
              value={notesValue ?? ''}
              onChange={(e) => onNotesChange!(e.target.value)}
              placeholder={notesPlaceholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[88px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ) : null}
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
  const mode = state.demoViewMode

  const hasReviewerActions =
    mode === 'aml' ||
    mode === 'ho-documents' ||
    mode === 'ho-principal' ||
    mode === 'ho-kyc'

  const closeDialog = () => {
    setDialog(null)
    setComments('')
    setSelectedReason('')
  }

  if (!hasReviewerActions) return null

  let actions: ReactNode = null
  let helper: ReactNode = null

  // Single-flow KYC: account-opening children expose account-level AML / CIP dispositions
  // through this status card. These short-circuit before the legacy KYC-child branches below.
  const isSingleFlowAccountChild =
    child.childType === 'account-opening' && isSingleFlowKycEnabled(state)
  const accountPhase = isSingleFlowAccountChild ? getAccountWorkflowPhase(state, child.id) : 'draft'

  if (isSingleFlowAccountChild && mode === 'aml') {
    const amlScreeningComplete = ownersAmlScreeningCleared(reviewState)
    if (
      amlScreeningComplete &&
      (accountPhase === 'aml_review' || accountPhase === 'escalation_hold')
    ) {
      helper = (
        <p className="text-xs text-muted-foreground">
          AML screening is complete for all participants. This account is awaiting document review.
        </p>
      )
    } else if (accountPhase === 'aml_review' || accountPhase === 'escalation_hold') {
      actions = (
        <StatusActionGroup>
          <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('account-aml-approve')}>
            Approve AML
          </StatusActionButton>
          <SecondaryActionRow>
            <StatusActionButton tone="reject" className="w-full" onClick={() => setDialog('account-aml-reject')}>
              Reject
            </StatusActionButton>
          </SecondaryActionRow>
        </StatusActionGroup>
      )
    }
  } else if (isSingleFlowAccountChild && mode === 'ho-principal') {
    if (accountPhase !== 'principal_review') {
      if (accountPhase === 'document_review') {
        helper = (
          <p className="text-xs text-muted-foreground">
            Waiting on document review before principal review can begin.
          </p>
        )
      } else if (accountPhase === 'aml_review' || accountPhase === 'escalation_hold') {
        helper = (
          <p className="text-xs text-muted-foreground">
            Waiting on Escalation / Hold before principal review can begin.
          </p>
        )
      }
    } else {
      actions = (
        <StatusActionGroup>
          <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('account-principal-approve')}>
            Approve Review
          </StatusActionButton>
          <SecondaryActionRow>
            <StatusActionButton tone="reject" className="w-full" onClick={() => setDialog('account-principal-reject')}>
              Reject Review
            </StatusActionButton>
            <StatusActionButton tone="secondary" className="w-full" onClick={() => setDialog('account-principal-request')}>
              Request Information
            </StatusActionButton>
          </SecondaryActionRow>
        </StatusActionGroup>
      )
    }
  } else if (
    isSingleFlowAccountChild &&
    (mode === 'ho-documents' || mode === 'ho-kyc')
  ) {
    if (accountPhase !== 'document_review') {
      if (accountPhase === 'aml_review' || accountPhase === 'escalation_hold') {
        helper = (
          <p className="text-xs text-muted-foreground">
            Waiting on Escalation / Hold before document review can begin.
          </p>
        )
      }
    } else {
      actions = (
        <StatusActionGroup>
          <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('account-cip-approve')}>
            Approve Review
          </StatusActionButton>
          <SecondaryActionRow>
            <StatusActionButton tone="secondary" className="w-full" onClick={() => setDialog('account-cip-request')}>
              Request Information
            </StatusActionButton>
          </SecondaryActionRow>
        </StatusActionGroup>
      )
    }
  } else if (mode === 'aml') {
    if (!isChildInAmlReviewQueue(child, reviewState)) {
      actions = null
    } else {
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
    }
  } else if (
    mode === 'ho-kyc' ||
    (child.childType === 'kyc' && (mode === 'ho-principal' || mode === 'ho-documents'))
  ) {
    const amlEscalated = amlReview?.status === 'escalated'
    const terminal = hoKycReview?.status === 'approved' || amlEscalated
    const inHoKycQueue = isChildInHoKycReviewQueue(child, reviewState)

    if (amlEscalated) {
      helper = <p className="text-xs text-red-700">SAR escalated. KYC cannot be approved.</p>
    }

    if (!terminal) {
      if (!inHoKycQueue) {
        actions = null
      } else {
        actions = (
          <StatusActionGroup>
            <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('ho-kyc-approve')}>
              Approve
            </StatusActionButton>
            <SecondaryActionRow>
              <StatusActionButton tone="reject" className="w-full" onClick={() => setDialog('ho-kyc-reject')}>
                Reject
              </StatusActionButton>
              <StatusActionButton tone="secondary" className="w-full" onClick={() => setDialog('ho-kyc-request')}>
                Request Information
              </StatusActionButton>
            </SecondaryActionRow>
          </StatusActionGroup>
        )
      }
    }
  } else if (mode === 'ho-documents') {
    const amlEscalated = amlReview?.status === 'escalated'
    const terminal = docReview?.status === 'igo' || docReview?.status === 'nigo' || amlEscalated
    const inDocQueue =
      child.childType === 'kyc'
        ? isChildInHoKycReviewQueue(child, reviewState)
        : isChildInDocumentReviewQueue(child, reviewState)

    if (amlEscalated) {
      helper = <p className="text-xs text-red-700">SAR escalated. Document review cannot be approved.</p>
    } else if (
      child.status === 'awaiting_review' &&
      (amlReview?.status === 'pending' || amlReview?.status === 'flagged')
    ) {
      helper = (
        <p className="text-xs text-muted-foreground">
          Waiting on AML review before document review can begin.
        </p>
      )
    }

    if (!terminal) {
      if (!inDocQueue) {
        actions = null
      } else {
        actions = (
          <StatusActionGroup>
            <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('doc-accept')}>
              Approve Review
            </StatusActionButton>
            <SecondaryActionRow>
              <StatusActionButton tone="secondary" className="w-full" onClick={() => setDialog('doc-request')}>
                Request Information
              </StatusActionButton>
            </SecondaryActionRow>
          </StatusActionGroup>
        )
      }
    }
  } else if (mode === 'ho-principal') {
    const docIgo = docReview?.status === 'igo'
    const amlEscalated = amlReview?.status === 'escalated'
    const kycBlockedOwners =
      child.childType === 'account-opening' ? getAccountOwnersMissingKyc(state, child.id).names : []
    const inPrincipalQueue = isChildInPrincipalReviewQueue(child, reviewState)
    const blocked = !inPrincipalQueue || kycBlockedOwners.length > 0
    const terminal = principalReview?.status === 'igo' || principalReview?.status === 'nigo' || amlEscalated

    if (amlEscalated) {
      helper = <p className="text-xs text-red-700">SAR escalated. Principal review cannot approve.</p>
    } else if (!inPrincipalQueue && child.status === 'awaiting_review' && !docIgo) {
      helper = (
        <p className="text-xs text-muted-foreground">
          Waiting on document review before principal review can begin.
        </p>
      )
    } else if (inPrincipalQueue && kycBlockedOwners.length > 0) {
      helper = (
        <p className="text-xs text-amber-700">
          Waiting on KYC approval: {kycBlockedOwners.join(', ')}
        </p>
      )
    }

    if (!terminal) {
      actions = (
        !blocked ? (
          <StatusActionGroup>
            <StatusActionButton tone="accept" className="w-full" onClick={() => setDialog('principal-approve')}>
              Approve Review
            </StatusActionButton>
            <SecondaryActionRow>
              <StatusActionButton tone="reject" className="w-full" onClick={() => setShowNigoModal('principal')}>
                Reject Review
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
        open={dialog === 'aml-approve'}
        title="Approve AML Review"
        description="Confirm that AML and sanctions screening review is complete and approve this submission."
        notesLabel="Review notes"
        notesPlaceholder="Add optional review notes..."
        notesValue={comments}
        onNotesChange={setComments}
        confirmLabel="Confirm Approval"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({ type: 'AML_REVIEW_CLEAR', approvalReason: comments.trim() || undefined })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'aml-return'}
        title="Request Information"
        description="Request additional information from the advisor before AML review can continue."
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
        description="Escalate this submission for suspicious activity handling and SAR review."
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
        description="Confirm that KYC verification is complete and all participant data has been reviewed."
        notesLabel="Review notes"
        notesPlaceholder="Add optional review notes..."
        notesValue={comments}
        onNotesChange={setComments}
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
        description="Request additional information from the advisor before document review can continue."
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
        description="Reject this submission and return it to the advisor with rationale."
        reasonLabel="Rejection reason"
        reasonOptions={CIP_REJECTION_REASONS}
        reasonValue={selectedReason}
        onReasonChange={setSelectedReason}
        label="Reviewer notes"
        placeholder="Add additional compliance findings or review notes..."
        value={comments}
        requireNotesWhenReasonValue="other"
        notesValidationMessage="Additional details are required when selecting Other."
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
        title="Approve Review"
        description="Approve document and CIP review and advance the submission to Principal Review."
        notesLabel="Review notes"
        notesPlaceholder="Add optional review notes..."
        notesValue={comments}
        onNotesChange={setComments}
        confirmLabel="Approve Review"
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
        description="Request additional information or supporting documents from the advisor before document review can continue."
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
        title="Approve Review"
        description="Approve principal review and finalize the account opening. The account will be marked complete and cleared for processing."
        confirmLabel="Approve Review"
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
        description="Request additional information from the advisor needed to complete principal review."
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

      <ReviewConfirmDialog
        open={dialog === 'account-aml-approve'}
        title="Approve AML Screening"
        description="Approve AML screening and continue onboarding. The account will move to the next review stage."
        notesLabel="Review notes"
        notesPlaceholder="Add optional review notes..."
        notesValue={comments}
        onNotesChange={setComments}
        confirmLabel="Approve AML"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({
            type: 'ACCOUNT_AML_APPROVE_ALL',
            accountChildId: child.id,
            approvalReason: comments.trim() || undefined,
          })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'account-aml-reject'}
        title="Reject Account Opening"
        description="Reject this account opening due to AML findings. The advisor will be notified and onboarding will be closed."
        reasonLabel="Rejection reason"
        reasonOptions={ACCOUNT_OPENING_AML_REJECTION_REASONS}
        reasonValue={selectedReason}
        onReasonChange={setSelectedReason}
        label="Reviewer notes"
        placeholder="Add additional compliance findings or review notes..."
        value={comments}
        requireNotesWhenReasonValue="other"
        notesValidationMessage="Additional details are required when selecting Other."
        confirmLabel="Reject"
        confirmTone="destructive"
        onChange={setComments}
        onCancel={closeDialog}
        onConfirm={() => {
          const rejectionReason = getReasonLabel(ACCOUNT_OPENING_AML_REJECTION_REASONS, selectedReason)
          const reviewerNotes = comments.trim() || undefined
          dispatch({
            type: 'ACCOUNT_AML_REJECT_ALL',
            accountChildId: child.id,
            rejectionReasonCode: selectedReason,
            rejectionReason,
            reviewerNotes,
          })
          closeDialog()
        }}
      />

      <ReviewConfirmDialog
        open={dialog === 'account-cip-approve'}
        title="Approve Review"
        description="Approve document and CIP review and advance the account to Principal Review. Verification will be recorded for all participants."
        notesLabel="Review notes"
        notesPlaceholder="Add optional review notes..."
        notesValue={comments}
        onNotesChange={setComments}
        confirmLabel="Approve Review"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({ type: 'ACCOUNT_CIP_APPROVE_ALL', accountChildId: child.id })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'account-cip-request'}
        title="Request Information"
        description="Send the account back to the advisor for additional CIP information or supporting documents."
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
            type: 'ACCOUNT_CIP_REQUEST_INFO',
            accountChildId: child.id,
            comments:
              formatStructuredReviewText(reason, comments) || 'Please provide additional information.',
          })
          closeDialog()
        }}
      />

      <ReviewConfirmDialog
        open={dialog === 'account-principal-approve'}
        title="Approve Review"
        description="Approve principal review and finalize the account opening. The account will be marked complete and cleared for processing."
        notesLabel="Review notes"
        notesPlaceholder="Add optional review notes..."
        notesValue={comments}
        onNotesChange={setComments}
        confirmLabel="Approve Review"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        onCancel={closeDialog}
        onConfirm={() => {
          dispatch({ type: 'ACCOUNT_PRINCIPAL_APPROVE', accountChildId: child.id })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'account-principal-reject'}
        title="Reject Review"
        description="Reject principal review due to supervisory findings. The advisor will be notified and the account will move to Escalation / Hold."
        reasonLabel="Rejection reason"
        reasonOptions={DOCUMENT_REVIEW_REJECTION_REASONS}
        reasonValue={selectedReason}
        onReasonChange={setSelectedReason}
        label="Reviewer notes"
        placeholder="Add additional compliance findings or review notes..."
        value={comments}
        requireNotesWhenReasonValue="other"
        notesValidationMessage="Additional details are required when selecting Other."
        confirmLabel="Reject Review"
        confirmTone="destructive"
        onChange={setComments}
        onCancel={closeDialog}
        onConfirm={() => {
          const rejectionReason = getReasonLabel(DOCUMENT_REVIEW_REJECTION_REASONS, selectedReason)
          const reviewerNotes = formatStructuredReviewText(rejectionReason, comments) || rejectionReason
          dispatch({
            type: 'ACCOUNT_PRINCIPAL_REJECT',
            accountChildId: child.id,
            reason: reviewerNotes,
          })
          closeDialog()
        }}
      />

      <ReviewTextDialog
        open={dialog === 'account-principal-request'}
        title="Request Information"
        description="Request additional information from the advisor needed to complete principal review. The account will return to the advisor for corrections."
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
            type: 'ACCOUNT_PRINCIPAL_REQUEST_INFO',
            accountChildId: child.id,
            comments:
              formatStructuredReviewText(reason, comments) || 'Please provide additional information.',
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
        variant="reject"
        title="Reject Review"
        confirmLabel="Reject Review"
        reasonLabel="Rejection reason"
        reasonOptions={DOCUMENT_REVIEW_REJECTION_REASONS}
        onSubmit={(reason, feedback) => {
          dispatch({ type: 'PRINCIPAL_REVIEW_NIGO', reason, feedback: feedback || undefined })
          setShowNigoModal(null)
        }}
      />
    </>
  )
}

export function ChildActionSidebar() {
  return (
    <PizzaTrackerDisplayPrefsProvider>
      <ChildActionSidebarInner />
    </PizzaTrackerDisplayPrefsProvider>
  )
}

function ChildActionSidebarInner() {
  const { state, dispatch } = useWorkflow()
  const { hideKycChildWorkflows } = useTheme()
  const hideKycPage = hideKycChildWorkflows
  const { journeys } = useServicing()
  const navigate = useNavigate()
  const workflowExitPath = useMemo(() => {
    const j = journeys.find((x) => x.id === state.journeyId)
    return j?.category === 'Onboarding' ? '/onboarding' : '/servicing'
  }, [journeys, state.journeyId])
  const ctx = useChildActionContext()
  const {
    collapsed: rightPanelCollapsed,
    activeTab: rightPanelActiveTab,
    setCollapsed: setRightPanelCollapsed,
    setActiveTab: setRightPanelTab,
  } = useWizardRightPanel()
  const variant = useOpenAccountsVariant()
  const { variant: selectedVariant } = useOpenAccountsVariantControls()
  const journeyProgressPct = useMemo(
    () => computeOverallJourneyProgressPct(state, selectedVariant, hideKycPage),
    [state, selectedVariant, hideKycPage],
  )
  const [exitToOnboardingOpen, setExitToOnboardingOpen] = useState(false)
  const [resubmitOpen, setResubmitOpen] = useState(false)
  const { prefs } = usePizzaTrackerDisplayPrefs()
  const advisorResubmitEligible = useAdvisorResubmitEligible()

  const parentTask = useMemo(() => {
    const id = state.activeChildActionId
    if (!id) return undefined
    return findParentTaskForChild(state, id)
  }, [state.activeChildActionId, state.tasks])

  const activeChildForNav = useMemo(() => {
    const id = state.activeChildActionId
    if (!id) return undefined
    return state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === id)
  }, [state.activeChildActionId, state.tasks])

  const parentAction = parentTask
    ? state.actions.find((a) => a.id === parentTask.actionId)
    : undefined
  const breadcrumbLabel = parentAction?.title ?? parentTask?.title ?? 'Back'
  const v5OpenAccountsLabel = parentAction?.title ?? parentTask?.title ?? 'Open Accounts'

  const parentSectionId = useMemo(() => {
    if (!activeChildForNav) return undefined
    if (activeChildForNav.childType === 'account-opening') return 'oa-accounts'
    if (activeChildForNav.childType === 'kyc' && parentTask?.formKey === 'open-accounts') return 'oa-kyc'
    return undefined
  }, [activeChildForNav, parentTask?.formKey])

  const exitToParentAction = useCallback(() => {
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
  }, [dispatch, navigate, parentSectionId, parentTask, state.journeyId])

  const viewMode = state.demoViewMode

  const workflowBreadcrumbs = useMemo((): WorkflowBreadcrumbItem[] => {
    const topLabel = variant === 'v5' ? v5OpenAccountsLabel : breadcrumbLabel
    const crumbs: WorkflowBreadcrumbItem[] = [{ label: topLabel, onClick: exitToParentAction }]
    const resume = state.childActionResume
    if (!resume) return crumbs

    const accountChild = state.tasks
      .flatMap((t) => t.children ?? [])
      .find((c) => c.id === resume.accountChildId)
    if (!accountChild?.name) return crumbs

    const exitToAccountFromNestedLine = () => {
      dispatch({ type: 'EXIT_CHILD_ACTION' })
    }

    crumbs.push({ label: accountChild.name, onClick: exitToAccountFromNestedLine })
    return crumbs
  }, [
    breadcrumbLabel,
    dispatch,
    exitToParentAction,
    state.childActionResume,
    state.tasks,
    variant,
    v5OpenAccountsLabel,
  ])

  if (!ctx) return null

  const { child, subTaskIndex } = ctx
  /** Match top-level nav style: no numeric prefixes for drill-in child flows. */
  const showSubTaskNumbers =
    child.childType !== 'account-opening' &&
    child.childType !== 'kyc' &&
    child.childType !== 'funding-line' &&
    child.childType !== 'feature-service-line'
  const childAssignee = parentTask?.assignedTo ?? state.assignedTo
  const visibleSubTasks = getVisibleChildSubTasks(child.childType, viewMode, child.status, {
    accountWorkflowPhase:
      child.childType === 'account-opening'
        ? getAccountWorkflowPhase(state, child.id)
        : undefined,
  })
  const childProgress = computeChildSubTasksProgress(state, child, visibleSubTasks)

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        className="w-[330px] shrink-0 border-r border-sidebar-border bg-white text-sidebar-foreground flex flex-col min-h-0 self-stretch h-full"
        onWheel={handleWizardPanelShellWheel}
      >
        <JourneyHeader
          onExitWorkflow={() => setExitToOnboardingOpen(true)}
          workflowBreadcrumbs={workflowBreadcrumbs}
          onWorkflowBreadcrumbChevronClick={exitToParentAction}
          journeySubtitle={
            viewMode === 'aml' && child.childType === 'kyc'
              ? 'AML compliance'
              : child.childType === 'kyc'
                ? 'KYC'
                : child.childType === 'account-opening'
                  ? 'Account opening'
                  : 'Workflow'
          }
          onIconClick={variant === 'v5' ? () => navigate('/onboarding') : undefined}
          iconTooltip={variant === 'v5' ? 'Onboarding' : undefined}
          metaDateLabel={state.journeyDateLabel}
          metaAssigneeLabel={state.assignedTo}
          metaProgressPct={journeyProgressPct}
          onAssignJourney={(assignee) => {
            const snapshot = captureJourneyAssigneeSnapshot(state)
            dispatch({ type: 'SET_JOURNEY_ASSIGNEE', assignee })
            return restoreJourneyAssigneeSnapshot(dispatch, snapshot)
          }}
        />
        <div
          data-wizard-scroll-pane
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain pl-3 pr-3 pt-2"
          onWheel={handleWizardScrollPaneWheel}
        >
          <div className="mb-4 flex items-start gap-2.5">
            <div className="relative z-20 flex w-7 shrink-0 flex-col items-center self-stretch">
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-0 w-px -translate-x-1/2 bg-sidebar-border"
              />
              <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[var(--bg-tertiary)] text-muted-foreground">
                <PizzaTrackerActionIcon />
              </span>
              <div className="min-h-0 w-full flex-1 shrink" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  'mb-1.5 flex min-h-9 items-center gap-2',
                  PIZZA_TRACKER_META_ROW_PADDING,
                )}
              >
                <h2 className="min-w-0 flex-1">
                  <PizzaTrackerTaskNameTooltip
                    label={child.name}
                    className="block text-left text-sm font-semibold leading-snug line-clamp-2 whitespace-normal"
                  />
                </h2>
                <PizzaTrackerRowMeta
                  showDueDateColumn={prefs.showDueDate}
                  showAssigneeColumn={prefs.showAssignee}
                  assigneeLabel={childAssignee}
                  onAssign={
                    parentTask
                      ? (assignee) => {
                          const snapshot = captureTaskAssignees([parentTask])
                          dispatch({
                            type: 'SET_TASKS_ASSIGNEE',
                            taskIds: [parentTask.id],
                            assignee,
                          })
                          return restoreTaskAssignees(dispatch, snapshot)
                        }
                      : undefined
                  }
                  trailing={
                    <PizzaTrackerProgressIndicator
                      pct={childProgress.pct}
                      total={childProgress.total}
                      edited={childProgress.edited}
                      status={childProgress.status}
                    />
                  }
                />
              </div>

              <ul className="space-y-1">
                {visibleSubTasks.map((subTask, idx) => {
                  const subTaskDueMeta = getChildSubTaskDueMeta(state, idx, visibleSubTasks.length)
                  const subTaskTitle = getSubTaskDisplayTitle(child.childType, subTask, viewMode)
                  return (
                    <li
                      key={subTask.suffix}
                      className={cn(
                        'group/task-row relative -ml-[38px] rounded-lg pl-[38px]',
                        idx === subTaskIndex ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/70',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'SET_CHILD_SUB_TASK', index: idx })}
                        aria-current={idx === subTaskIndex ? 'page' : undefined}
                        className={cn(
                          'flex w-full min-w-0 items-center gap-2 rounded-lg py-2.5 pl-0 pr-1.5 text-left text-sm font-medium transition-colors min-h-9',
                          idx === subTaskIndex
                            ? 'text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground group-hover/task-row:text-sidebar-accent-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'flex min-w-0 flex-1 items-center gap-1.5',
                            idx === subTaskIndex ? 'font-semibold' : '',
                          )}
                        >
                          {showSubTaskNumbers && (
                            <span className="w-4 shrink-0 pt-px text-right text-[11px] tabular-nums text-muted-foreground">
                              {idx + 1}.
                            </span>
                          )}
                          <PizzaTrackerTaskNameTooltip
                            label={subTaskTitle}
                            className="flex-1 text-left leading-snug"
                          />
                        </span>
                        <PizzaTrackerRowMeta
                          showDueDateColumn={prefs.showDueDate}
                          showAssigneeColumn={prefs.showAssignee}
                          dateLabel={subTaskDueMeta.dateLabel}
                          dueAt={subTaskDueMeta.dueAt}
                          assigneeLabel={childAssignee}
                          onAssign={
                            parentTask
                              ? (assignee) => {
                                  const snapshot = captureTaskAssignees([parentTask])
                                  dispatch({
                                    type: 'SET_TASKS_ASSIGNEE',
                                    taskIds: [parentTask.id],
                                    assignee,
                                  })
                                  return restoreTaskAssignees(dispatch, snapshot)
                                }
                              : undefined
                          }
                          trailing={
                            <SubTaskProgressIndicator
                              formKey={subTask.formKey}
                              childId={child.id}
                              subTaskIndex={idx}
                              subTaskSuffix={subTask.suffix}
                            />
                          }
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
          const clarificationRequired = isChildAwaitingAdvisorClarification(reviewState, child.status)
          const stageLabel = clarificationRequired
            ? 'Clarification / Document Required'
            : getActiveStageLabel(child.status, child.childType, reviewState ?? undefined)
          const statusSentence = clarificationRequired
            ? 'Review feedback, update the package, and submit for review.'
            : stageLabel === 'Draft'
              ? 'Application is in progress.'
              : `Application is in ${stageLabel}.`
          const detailSentence = clarificationRequired
            ? null
            : stageLabel === 'Draft' &&
                child.childType === 'account-opening' &&
                isSingleFlowKycEnabled(state)
              ? 'Review submits automatically after the client signs the forms package.'
              : stageLabel === 'Draft'
                ? 'Complete all sections to submit.'
                : 'Check the activity timeline for details.'
          const showResubmit =
            state.demoViewMode === 'advisor' && advisorResubmitEligible

          const handleStatusCardResubmit = () => {
            if (child.childType === 'kyc') {
              const infoTaskId = `${child.id}-info`
              const infoData = state.taskData[infoTaskId] ?? {}
              const childMeta = state.taskData[child.id] ?? {}
              const kycParty =
                state.relatedParties.find(
                  (p) => p.id === (childMeta.kycSubjectPartyId as string | undefined),
                ) ?? state.relatedParties.find((p) => p.name === child.name)
              const kycSubjectType: 'individual' | 'entity' =
                childMeta.kycSubjectType === 'entity' || kycParty?.type === 'related_organization'
                  ? 'entity'
                  : 'individual'
              const errors = getKycValidationErrors(infoData, {
                optionalIdVerification: kycChildHasOptionalIdVerification(child),
                subjectType: kycSubjectType,
              })
              if (errors.length > 0) {
                toast.error('Please fix validation errors before submitting', {
                  description: `${errors.length} required field${errors.length === 1 ? '' : 's'} need attention.`,
                })
                dispatch({
                  type: 'SET_TASK_DATA',
                  taskId: infoTaskId,
                  fields: { _submitAttempted: true, _validationScrollNonce: Date.now() },
                })
                dispatch({ type: 'SET_CHILD_SUB_TASK', index: 0 })
                return
              }
            }
            setResubmitOpen(true)
          }

          return (
            <div className="shrink-0 p-2 border-t border-border">
              <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
                <div className="px-4 pb-2 pt-3">
                  <ApplicationStatusWidget stageLabel={stageLabel} />
                </div>
                <div className="px-4 pb-4 space-y-3">
                  {clarificationRequired ? (
                    <p className="text-sm text-foreground leading-snug">{statusSentence}</p>
                  ) : (
                    <p className="text-[14px] font-normal text-primary leading-snug">
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
                    <Button type="button" className="w-full" onClick={handleStatusCardResubmit}>
                      Submit for Review
                    </Button>
                  ) : null}
                </div>
                <ChildReviewStatusActions />
                <div className="border-t border-border/60 bg-muted/35 px-3 flex items-center" style={{ minHeight: '44px' }}>
                  <button
                    type="button"
                    aria-expanded={!rightPanelCollapsed && rightPanelActiveTab === 'activity'}
                    onClick={() => {
                      if (!rightPanelCollapsed && rightPanelActiveTab === 'activity') {
                        setRightPanelCollapsed(true)
                        return
                      }
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
            <DialogTitle>Submit for review?</DialogTitle>
            <DialogDescription>
              {child.childType === 'kyc'
                ? 'This will submit the KYC package to the AML Team. Advisor edits will lock until review completes.'
                : 'This will submit the application to the Document Review Team. Advisor edits will lock until review completes.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResubmitOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                dispatch({ type: 'SUBMIT_CHILD_FOR_REVIEW' })
                setResubmitOpen(false)
              }}
            >
              Submit for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={exitToOnboardingOpen} onOpenChange={setExitToOnboardingOpen}>
        <DialogContent className="max-w-md !data-[state=closed]:zoom-out-100 !data-[state=open]:zoom-in-100 !data-[state=closed]:slide-out-to-left-0 !data-[state=open]:slide-in-from-left-0 !data-[state=closed]:slide-out-to-top-[50%] !data-[state=open]:slide-in-from-top-[50%]">
          <DialogHeader>
            <DialogTitle>Exit current workflow?</DialogTitle>
            <DialogDescription>
              {workflowExitPath === '/onboarding'
                ? 'This takes you out of the current workflow and back to the onboarding list.'
                : 'This takes you out of the current workflow and back to the servicing queue.'}
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
                navigate(workflowExitPath)
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
