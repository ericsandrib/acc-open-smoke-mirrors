import { useWorkflow, useChildActionContext, useAdvisorResubmitEligible } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { resumeDrillInBackLabel, getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'
import { getAccountOpeningSubTaskProgress } from '@/utils/accountOpeningChildProgress'
import { childStatusConfig, deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import type { ChildDisplayStatus } from '@/utils/childStatusDisplay'

const DONUT_R = 7
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R

function SubTaskStatusBadge({
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

  const accountChild =
    accountOpeningChildId &&
    state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === accountOpeningChildId)
  const lockedComplete =
    accountChild &&
    (accountChild.status === 'awaiting_review' || accountChild.status === 'complete')

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
  const progress = Math.min(1, Math.max(0, filled / total))
  const edited = hasData
  const rawPct = Math.round(progress * 100)
  const displayProgress = edited && rawPct === 0 ? 0.05 : progress
  const displayPct = Math.round(displayProgress * 100)
  const stroke = displayProgress * DONUT_CIRCUMFERENCE
  const tooltip = accountOpeningChildId && subTaskSuffix && !lockedComplete
    ? `${displayPct}% complete · ${filled}/${total} fields`
    : `${displayPct}% complete${edited ? ' · Edited' : ''}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="shrink-0 flex items-center justify-center h-3.5 w-3.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20">
            <circle
              cx="10"
              cy="10"
              r={DONUT_R}
              fill="none"
              strokeWidth="3"
              stroke="var(--color-border-secondary)"
            />
            {displayProgress > 0 && (
              <circle
                cx="10"
                cy="10"
                r={DONUT_R}
                fill="none"
                strokeWidth="3"
                stroke="var(--color-fill-category1-primary)"
                strokeDasharray={`${stroke} ${DONUT_CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform="rotate(-90 10 10)"
              />
            )}
          </svg>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function useChildOverallStatus(childId: string): ChildDisplayStatus {
  const { state } = useWorkflow()

  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === childId)

  return deriveChildDisplayStatus(child?.status ?? 'not_started', state.childReviewsByChildId?.[childId])
}

function backLabelForParent(formKey: string | undefined): string {
  switch (formKey) {
    case 'open-accounts':
      return 'Back to Open Accounts'
    case 'kyc':
    case 'kyc-review':
      return 'Back to KYC Review'
    default:
      return 'Back to task'
  }
}

export function ChildActionSidebar() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()

  const overallStatus = useChildOverallStatus(ctx?.child.id ?? '')
  const statusCfg = childStatusConfig[overallStatus]
  const advisorResubmitEligible = useAdvisorResubmitEligible()

  if (!ctx) return null

  const { child, config, subTaskIndex, parentTask } = ctx
  /** Match account opening: no "1." prefixes on sub-task labels (KYC has a single step today). */
  const showSubTaskNumbers =
    child.childType !== 'account-opening' && child.childType !== 'kyc'
  const viewMode = state.demoViewMode
  const isHoKycView = viewMode === 'ho-kyc'

  // Only collapse to one pseudo-step for KYC Document Review (ho-kyc) mode. HO Document and
  // HO Principal account-opening views use the same numbered subtasks as Advisor (AML is KYC-only).
  // (e.g. Account & owners → Documents).
  const showSingleReviewStep = child.childType === 'kyc' && isHoKycView
  const singleReviewStepLabel = 'Document Review'

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="w-64 border-r border-border bg-sidebar-background p-2 overflow-y-auto flex flex-col">
        <div className="px-3 pt-2 pb-4 mb-2 border-b border-border">
          <button
            onClick={() => dispatch({ type: 'EXIT_CHILD_ACTION' })}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            {state.childActionResume
              ? resumeDrillInBackLabel(state.childActionResume.subTaskIndex)
              : backLabelForParent(parentTask?.formKey)}
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {child.name}
          </h2>
        </div>

        <ul className="space-y-1">
          {showSingleReviewStep ? (
            <li>
              <div className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 bg-accent text-accent-foreground font-medium">
                <span className="flex items-center gap-2 truncate">
                  {showSubTaskNumbers && (
                    <span className="text-xs text-muted-foreground w-4 shrink-0">1.</span>
                  )}
                  {singleReviewStepLabel}
                </span>
              </div>
            </li>
          ) : (
            config.subTasks.map((subTask, idx) => {
              const subTaskId = `${child.id}-${subTask.suffix}`
              return (
                <li key={subTask.suffix}>
                  <button
                    onClick={() => dispatch({ type: 'SET_CHILD_SUB_TASK', index: idx })}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-colors',
                      idx === subTaskIndex
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {showSubTaskNumbers && (
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                      )}
                      {getSubTaskDisplayTitle(child.childType, subTask, viewMode)}
                    </span>
                    <SubTaskStatusBadge
                      subTaskId={subTaskId}
                      accountOpeningChildId={child.childType === 'account-opening' ? child.id : undefined}
                      subTaskSuffix={child.childType === 'account-opening' ? subTask.suffix : undefined}
                    />
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <div className="mt-auto px-3 pt-4 pb-2 border-t border-border mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <Badge variant="outline" className={cn('text-xs', advisorResubmitEligible ? 'bg-amber-50 text-amber-700 border-amber-200' : statusCfg.className)}>
              {advisorResubmitEligible
                ? 'Action Required'
                : statusCfg.label}
            </Badge>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
