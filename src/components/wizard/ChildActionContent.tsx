import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { formComponents, taskDescriptions } from './formRegistry'
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react'

function AdvisorViewBanner() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const decision = state.childReviewDecision
  const reviewState = state.childReviewState
  const docReview = reviewState?.documentReview
  const principalReview = reviewState?.principalReview
  const amlReview = reviewState?.amlReview
  const isKyc = ctx?.child.childType === 'kyc'

  if (decision?.outcome === 'rejected') {
    if (isKyc && amlReview?.status === 'flagged') {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-4 py-3 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Flagged by AML Team
              </p>
              <p className="text-xs text-red-800/80 dark:text-red-200/70">
                The AML team has flagged this individual for further investigation. Please review their findings below.
              </p>
              {amlReview.findings && (
                <div className="mt-2 rounded-md bg-red-100/60 dark:bg-red-900/30 px-3 py-2">
                  <p className="text-xs text-red-900 dark:text-red-100">
                    <span className="font-semibold">Findings:</span> {amlReview.findings}
                  </p>
                </div>
              )}
              <p className="text-xs text-red-700/70 dark:text-red-300/60 mt-1">
                Flagged at {decision.decidedAt}
              </p>
            </div>
          </div>
        </div>
      )
    }

    const rejectedByDoc = docReview?.status === 'nigo'
    const rejectedByPrincipal = principalReview?.status === 'nigo'
    const teamLabel = rejectedByPrincipal ? 'Principal Review Team' : rejectedByDoc ? 'Document Review Team' : 'Home Office'
    const nigoData = rejectedByPrincipal ? principalReview : rejectedByDoc ? docReview : null

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 px-4 py-3 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              Submission Rejected by {teamLabel}
            </p>
            <p className="text-xs text-red-800/80 dark:text-red-200/70">
              Your submission has been returned for corrections. Please review the feedback below and resubmit.
            </p>
            {nigoData?.nigoReason && (
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
            )}
            <p className="text-xs text-red-700/70 dark:text-red-300/60 mt-1">
              Rejected at {decision.decidedAt}
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

  const progressParts: string[] = []
  if (isKyc) {
    if (amlReview?.status === 'pending') progressParts.push('AML Review: Pending')
  } else {
    if (docReview?.status === 'igo') progressParts.push('Document Review: IGO')
    else if (docReview?.status === 'pending') progressParts.push('Document Review: Pending')
    if (principalReview?.status === 'pending') progressParts.push('Principal Review: Pending')
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 px-4 py-3 mb-6">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Read-Only — Under {isKyc ? 'AML' : 'Home Office'} Review
          </p>
          <p className="text-xs text-blue-800/80 dark:text-blue-200/70">
            This submission is being reviewed by the {isKyc ? 'AML' : 'home office'} team. All fields are locked until the review is complete.
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

  if (!ctx) return null

  const { child, currentSubTask } = ctx
  const FormComponent = formComponents[currentSubTask.formKey] ?? null
  const description = taskDescriptions[currentSubTask.formKey]
  const inReview = child.status === 'awaiting_review'

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        {inReview && !isAdvisorView && (
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
        <p className="text-sm text-muted-foreground mb-1">{child.name}</p>
        <h2 className="text-3xl font-semibold text-foreground mb-6">
          {currentSubTask.title}
        </h2>
        {description && (
          <p className="text-base text-muted-foreground mb-6">{description}</p>
        )}
        <div className={isAdvisorView ? 'pointer-events-none opacity-75 select-none' : ''}>
          {FormComponent ? <FormComponent /> : <p className="text-muted-foreground">No form available.</p>}
        </div>
      </div>
    </main>
  )
}
