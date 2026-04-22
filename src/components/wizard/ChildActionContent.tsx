import type { ChildReviewState } from '@/types/workflow'
import { useWorkflow, useChildActionContext, useAdvisorFormsEditable, getChildReviewState, getChildReviewDecision } from '@/stores/workflowStore'
import { getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { formComponents, taskDescriptions } from './formRegistry'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, FileText, FileSearch } from 'lucide-react'

function HoDocumentAccountOpeningBanners({
  docReview,
}: {
  docReview: ChildReviewState['documentReview']
}) {
  if (!docReview) return null

  if (docReview.status === 'igo') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Document Review — Accepted</p>
            <p className="text-xs text-green-800/80 dark:text-green-200/70">
              Documents passed review and were sent to Principal Review at {docReview.decidedAt}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (docReview.status === 'nigo') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Document Review — Rejected</p>
            <p className="text-xs text-red-800/80 dark:text-red-200/70">
              Returned to the advisor at {docReview.decidedAt}.
            </p>
            {docReview.nigoReason && (
              <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2 space-y-1">
                <p className="text-xs text-red-900 dark:text-red-100">
                  <span className="font-semibold">Reason:</span> {docReview.nigoReason}
                </p>
                {docReview.nigoFeedback && (
                  <p className="text-xs text-red-800/90 dark:text-red-200/80">
                    <span className="font-semibold">Feedback:</span> {docReview.nigoFeedback}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (docReview.status === 'pending') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <FileSearch className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Pending Document Team Review</p>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
              Review the account documentation below and choose Accept or Reject when ready.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function HoPrincipalAccountOpeningBanners({
  principalReview,
}: {
  principalReview: ChildReviewState['principalReview']
}) {
  if (!principalReview) return null

  if (principalReview.status === 'igo') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Principal Review — Approved</p>
            <p className="text-xs text-green-800/80 dark:text-green-200/70">
              This account opening was approved at {principalReview.decidedAt}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (principalReview.status === 'nigo') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Principal Review — NIGO</p>
            <p className="text-xs text-red-800/80 dark:text-red-200/70">
              Returned to the advisor at {principalReview.decidedAt}.
            </p>
            {principalReview.nigoReason && (
              <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2 space-y-1">
                <p className="text-xs text-red-900 dark:text-red-100">
                  <span className="font-semibold">Reason:</span> {principalReview.nigoReason}
                </p>
                {principalReview.nigoFeedback && (
                  <p className="text-xs text-red-800/90 dark:text-red-200/80">
                    <span className="font-semibold">Feedback:</span> {principalReview.nigoFeedback}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (principalReview.status === 'pending') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Pending HO Principal Team</p>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
              Review the account opening below and approve or return with feedback when ready.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

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
  if (child.status === 'in_progress' || child.status === 'not_started') {
    return null
  }

  if (decision?.outcome === 'rejected') {
    let teamLabel = 'Home Office'
    let detail = 'Your submission has been returned for corrections. Please review the feedback and resubmit.'
    let feedbackBlock: React.ReactNode = null

    if (isKyc) {
      if (amlReview?.status === 'flagged') {
        teamLabel = 'AML Team'
        detail = 'The AML team has flagged this individual for further investigation. Please review their findings and resubmit.'
        if (amlReview.findings) {
          feedbackBlock = (
            <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2">
              <p className="text-xs text-red-900 dark:text-red-100">
                <span className="font-semibold">Findings:</span> {amlReview.findings}
              </p>
            </div>
          )
        }
      } else if (amlReview?.status === 'info_requested') {
        teamLabel = 'AML Team'
        detail = 'The AML team has requested additional information. Please provide the requested details and resubmit.'
        if (amlReview.infoRequestComments) {
          feedbackBlock = (
            <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2">
              <p className="text-xs text-red-900 dark:text-red-100">
                <span className="font-semibold">Request:</span> {amlReview.infoRequestComments}
              </p>
            </div>
          )
        }
      } else if (hoKycReview?.status === 'changes_requested') {
        teamLabel = 'Document Review'
        detail = 'Document Review has requested changes to this submission. Please review the feedback and resubmit.'
        if (hoKycReview.comments) {
          feedbackBlock = (
            <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2">
              <p className="text-xs text-red-900 dark:text-red-100">
                <span className="font-semibold">Feedback:</span> {hoKycReview.comments}
              </p>
            </div>
          )
        }
      }
    } else {
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

  if (decision?.outcome === 'approved') {
    if (isKyc && amlReview?.status === 'cleared') {
      return (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/40 px-4 py-3 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Cleared by AML Team</p>
              <p className="text-xs text-green-800/80 dark:text-green-200/70">
                This individual has been cleared by the AML team. No sanctions or watchlist concerns found. Cleared at {decision.decidedAt}.
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (isKyc) {
      return (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/40 px-4 py-3 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Approved — KYC complete</p>
              <p className="text-xs text-green-800/80 dark:text-green-200/70">
                Document Review has approved this KYC submission. Approved at {decision.decidedAt}.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/40 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Approved by Home Office</p>
            <p className="text-xs text-green-800/80 dark:text-green-200/70">
              Both Document Review and Principal Review have approved this submission. Approved at {decision.decidedAt}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (child.status !== 'awaiting_review') {
    return null
  }

  const progressParts: string[] = []
  if (isKyc) {
    if (amlReview?.status === 'pending') progressParts.push('AML Screening: In Progress')
    else if (amlReview?.status === 'cleared') progressParts.push('AML Screening: Cleared')
    if (hoKycReview?.status === 'pending') progressParts.push('Document Review: Pending')
  } else {
    if (docReview?.status === 'igo') progressParts.push('Document Review: Accepted')
    else if (docReview?.status === 'nigo') progressParts.push('Document Review: Rejected')
    else if (docReview?.status === 'pending') progressParts.push('Document Review: Pending')
    if (principalReview?.status === 'pending') progressParts.push('Principal Review: Pending')
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 px-4 py-3 mb-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {isKyc ? 'Submitted for document review' : 'Read-Only — Under Home Office Review'}
          </p>
          <p className="text-xs text-blue-800/80 dark:text-blue-200/70">
            {isKyc
              ? 'Your submission has been sent for document review. AML screening is in progress. You will be notified when the review is complete.'
              : 'This submission is being reviewed by the home office team. All fields are locked until the review is complete.'}
          </p>
          {progressParts.length > 0 && (
            <p className="text-xs text-blue-700/80 dark:text-blue-300/70 mt-1">
              {progressParts.join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ChildActionContent() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const isAdvisorView = state.demoViewMode === 'advisor'
  const advisorFormsEditable = useAdvisorFormsEditable()

  if (!ctx) return null

  const { child, currentSubTask } = ctx
  const FormComponent = formComponents[currentSubTask.formKey] ?? null
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
  const formReadOnly = advisorDisabled || isHoTeamAccountOpening

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        {inReview && !isAdvisorView && !isHoTeamAccountOpening && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/40 px-4 py-3 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
                  Home Office Review
                </p>
                <p className="text-xs text-violet-800/80 dark:text-violet-200/70">
                  This account opening is currently being reviewed by the Home Office
                  Team. All fields are read-only until the review is accepted or
                  returned for corrections.
                </p>
              </div>
            </div>
          </div>
        )}
        {isAdvisorView && <AdvisorViewBanner />}
        {isHoDocAccountOpening && <HoDocumentAccountOpeningBanners docReview={reviewState?.documentReview} />}
        {isHoPrincipalAccountOpening && (
          <HoPrincipalAccountOpeningBanners principalReview={reviewState?.principalReview} />
        )}
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
        <p className="text-sm text-muted-foreground mb-1">{child.name}</p>
        {isHoTeamAccountOpening && amlFlagged && (
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 dark:text-red-200 dark:border-red-800 dark:bg-red-950/40 text-[10px]">
              Advisor Flagged
            </Badge>
          </div>
        )}
        <h2 className="text-3xl font-semibold text-foreground mb-6">
          {getSubTaskDisplayTitle(child.childType, currentSubTask, state.demoViewMode)}
        </h2>
        {description && (
          <p className="text-base text-muted-foreground mb-6">{description}</p>
        )}
        <div className={formReadOnly ? 'pointer-events-none opacity-75 select-none' : ''}>
          {FormComponent ? <FormComponent /> : <p className="text-muted-foreground">No form available.</p>}
        </div>
      </div>
    </main>
  )
}
