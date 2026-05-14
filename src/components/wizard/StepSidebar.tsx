import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkflow } from '@/stores/workflowStore'
import { useServicing } from '@/stores/servicingStore'
import type { Action, TaskStatus, Task, WorkflowState } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import {
  isOpenAccountsFormKey,
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_NAV_ANNUITY_ORDER_ROW_LABEL,
  OPEN_ACCOUNTS_NAV_NO_ANNUITY_GROUP_LABEL,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import {
  type OpenAccountsVariant,
  useOpenAccountsVariant,
  useOpenAccountsVariantControls,
} from '@/components/wizard/openAccountsVariantContext'
import { ProgressIcon, pickVariant } from '@/components/wizard/ProgressIcons'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, Users, Wallet, ListChecks, Circle, Loader, CheckCircle2, Ban, Clock, XCircle } from 'lucide-react'
import { JourneyHeader } from '@/components/wizard/JourneyHeader'

const ACTION_ICONS: Record<string, LucideIcon> = {
  'collect-client-data': Users,
  'account-opening': Wallet,
}

function getActionIcon(actionId: string): LucideIcon {
  return ACTION_ICONS[actionId] ?? ListChecks
}
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AssignAllTasksControl } from '@/components/wizard/AssignAllTasksControl'

const statusColors: Record<TaskStatus, string> = {
  not_started: 'text-text-tertiary',
  in_progress: 'text-text-category1-primary',
  complete: 'text-text-success-primary',
  canceled: 'text-text-tertiary',
  blocked: 'text-text-danger-primary',
  awaiting_review: 'text-text-warning-primary',
  rejected: 'text-text-danger-primary',
}

const statusLabels: Record<TaskStatus, string> = {
  not_started: 'Ready to Begin',
  in_progress: 'In Progress',
  complete: 'Complete',
  canceled: 'Canceled',
  blocked: 'Blocked',
  awaiting_review: 'Awaiting Review',
  rejected: 'Rejected',
}

const StatusIcon: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  not_started: Circle,
  in_progress: Loader,
  complete: CheckCircle2,
  canceled: XCircle,
  blocked: Ban,
  awaiting_review: Clock,
  rejected: XCircle,
}

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const Icon = StatusIcon[status]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('shrink-0 flex items-center', statusColors[status])}>
          <Icon className={cn('h-3.5 w-3.5', className)} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{statusLabels[status]}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function getTaskFieldProgress(state: WorkflowState, task: Task): { filled: number; total: number } {
  switch (task.formKey) {
    case 'related-parties': {
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const total = members.length * 2
      let filled = 0
      for (const m of members) {
        if (m.email?.trim()) filled++
        if (m.phone?.trim()) filled++
      }
      return { filled, total }
    }
    case 'existing-accounts':
      return {
        filled: state.financialAccounts.length > 0 ? 1 : 0,
        total: 1,
      }
    case 'kyc': {
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const needsKyc = members.filter((m) => m.kycStatus !== 'verified')
      const children = task.children ?? []
      const total = Math.max(needsKyc.length, 1)
      const filled = Math.min(
        children.filter((c) => c.status === 'complete').length,
        total,
      )
      return { filled, total }
    }
    case 'open-accounts': {
      const accountChildren = (task.children ?? []).filter((c) => c.childType === 'account-opening')
      const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
      const kycChildren = (kycTask?.children ?? []).filter((c) => c.childType === 'kyc')
      const taskData = (state.taskData[task.id] as Record<string, unknown> | undefined) ?? {}
      const envelopes = Array.isArray(taskData.esignEnvelopes) ? taskData.esignEnvelopes : []

      let filled = 0
      if (accountChildren.length > 0) filled++
      if (kycChildren.length > 0) filled++
      if (envelopes.length > 0) filled++

      return { filled, total: 3 }
    }
    case 'open-accounts-with-annuity': {
      const accountChildren = (task.children ?? []).filter((c) => c.childType === 'account-opening')
      return {
        filled: accountChildren.length > 0 ? 1 : 0,
        total: 1,
      }
    }
    default:
      if (isOpenAccountsFormKey(task.formKey)) return { filled: 0, total: 1 }
      return { filled: 0, total: 0 }
  }
}

function getTaskNavLabel(label: string): string {
  if (label === 'Accounts to Be Opened') return 'Accounts'
  return label
}

function TaskProgressIndicator({
  pct,
  total,
  edited,
  status,
}: {
  pct: number
  total: number
  edited: boolean
  status: TaskStatus
}) {
  const variant = pickVariant({ pct, total, edited, status })
  const displayPct = Math.max(0, Math.min(100, Math.round(pct * 100)))
  const tooltipText =
    variant === 'canceled'
      ? 'Canceled'
      : variant === 'done'
        ? edited ? 'Complete · Edited' : 'Complete'
        : variant === 'ambiguous'
          ? 'No progress to report'
          : displayPct === 0
            ? edited ? 'Not started · Edited' : 'Not started'
            : edited
              ? `${displayPct}% complete · Edited`
              : `${displayPct}% complete`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="shrink-0 inline-flex items-center justify-center h-3.5 w-3.5 text-muted-foreground/85"
          role="img"
          aria-label={tooltipText}
        >
          <ProgressIcon variant={variant} className="h-3.5 w-3.5" />
          <span className="sr-only">{tooltipText}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

type DisplayTaskNode = {
  /** Stable row id (React key). May be synthetic in v5 while `underlyingTaskIds` holds the real task id. */
  id: string
  label: string
  /** Underlying task ids that this display node represents (1:1 in default/v1, both in v2). */
  underlyingTaskIds: string[]
  /** v5: separate “page” within the no-annuity Open Accounts task. */
  v5NoAnnuityPage?: 'instructions' | 'kyc' | 'documents' | 'envelopes'
  /** v6: “Account Setup” row binds to the no-annuity task (combined-instructions page is no-annuity only). */
  v6CombinedInstructions?: boolean
}

/** One row in the action task list: either a single task or a v5 collapsible section with nested tasks. */
type DisplayTaskRow =
  | { type: 'task'; task: DisplayTaskNode }
  | { type: 'group'; id: string; label: string; tasks: DisplayTaskNode[] }

type DisplayActionNode = {
  id: string
  title: string
  taskRows: DisplayTaskRow[]
}

/** Advisor-only rows in the no-annuity open-accounts sub-nav (v5/v6 grouped list and non-split v5 list). */
function filterAdvisorOnlyOpenAccountsNavNodes(
  nodes: DisplayTaskNode[],
  isAdvisorDemoView: boolean,
): DisplayTaskNode[] {
  if (isAdvisorDemoView) return nodes
  return nodes.filter(
    (n) => n.v5NoAnnuityPage !== 'documents' && n.v5NoAnnuityPage !== 'envelopes',
  )
}

function isDisplayTaskNodeActive(dt: DisplayTaskNode, state: WorkflowState): boolean {
  const underlyingTasks = dt.underlyingTaskIds
    .map((id) => state.tasks.find((t) => t.id === id))
    .filter((t): t is Task => Boolean(t))
  const baseTaskActive =
    underlyingTasks.some((t) => state.activeTaskId === t.id) ||
    underlyingTasks.some((t) =>
      (t.children ?? []).some((c) => {
        if (c.id === state.activeTaskId) return true
        const parsed = parseChildSubTaskId(state.activeTaskId)
        return parsed ? c.id === parsed.childId : false
      }),
    )
  if (dt.v6CombinedInstructions) {
    return baseTaskActive && state.v5NoAnnuityOpenAccountsPage === 'instructions'
  }
  if (dt.v5NoAnnuityPage) {
    return baseTaskActive && state.v5NoAnnuityOpenAccountsPage === dt.v5NoAnnuityPage
  }
  return baseTaskActive
}

/**
 * Build the action/task display structure honoring the demo Account Opening variant.
 *
 * - In a non-split journey (only one of the two open-accounts form keys) the structure is unchanged.
 * - In v1 split: one Account Opening action with two tasks; rows are labeled by annuity path.
 * - In v2/v3/v4 split: keep both open-accounts tasks visible (renamed labels on each row).
 * - In v5 split: collapsible “Account Opening” first, then a flat “Account Opening + Annuity Order” task row (sibling to that group).
 * - In v6 split: optional flat annuity-order row after the Account Opening group (when annuity path is enabled).
 *   Without-annuity side uses navigator rows (Account Setup, KYC Initiation, Supporting Documents, Envelopes)
 *   that all bind to the same underlying task and swap full-page `OpenAccountsForm` content.
 * - In reviewer demo (`demoViewMode` other than `advisor`): Supporting Documents, Envelopes, and any
 *   Annuity-order path rows are omitted from the sidebar (advisor-only).
 */
export function buildDisplayActions(state: WorkflowState, variant: OpenAccountsVariant): DisplayActionNode[] {
  const hideClientSetupInReviewer = (state.demoViewMode ?? 'advisor') !== 'advisor'
  const isAdvisorDemoView = (state.demoViewMode ?? 'advisor') === 'advisor'
  const visibleActions = state.actions
    .filter((a) => a.id !== 'kyc')
    .filter((a) => !(hideClientSetupInReviewer && a.id === 'collect-client-data'))
    .sort((a, b) => a.order - b.order)
  const visibleTasks = (action: Action) =>
    state.tasks
      .filter((t) => t.actionId === action.id && t.formKey !== 'kyc' && t.id !== 'kyc-review')
      .sort((a, b) => a.order - b.order)

  const accountOpeningAction = visibleActions.find((a) => a.id === 'account-opening')
  const aoTasks = accountOpeningAction ? visibleTasks(accountOpeningAction) : []
  const noAnnuityTasks = aoTasks.filter((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)
  const withAnnuityTasks = aoTasks.filter((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)
  const isSplit = noAnnuityTasks.length > 0 && withAnnuityTasks.length > 0

  const toTaskRow = (t: Task, label: string): DisplayTaskRow => ({
    type: 'task',
    task: { id: t.id, label, underlyingTaskIds: [t.id] },
  })

  if (!isSplit) {
    const noAnnuityOnlyTaskId =
      variant === 'v5'
        ? aoTasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)?.id
        : undefined
    return visibleActions.map((action) => ({
      id: action.id,
      title: action.title,
      taskRows:
        variant === 'v5' && action.id === 'account-opening' && noAnnuityOnlyTaskId
          ? (() => {
              const v5NoSplitRows: DisplayTaskNode[] = [
                {
                  id: 'v5-noann-account-instructions',
                  label: 'Accounts',
                  underlyingTaskIds: [noAnnuityOnlyTaskId],
                  v5NoAnnuityPage: 'instructions',
                },
                {
                  id: 'v5-noann-kyc-verification',
                  label: 'KYC',
                  underlyingTaskIds: [noAnnuityOnlyTaskId],
                  v5NoAnnuityPage: 'kyc',
                },
                {
                  id: 'v5-noann-supporting-documents',
                  label: 'Supporting Documents',
                  underlyingTaskIds: [noAnnuityOnlyTaskId],
                  v5NoAnnuityPage: 'documents',
                },
                {
                  id: 'v5-noann-envelopes',
                  label: 'Envelopes',
                  underlyingTaskIds: [noAnnuityOnlyTaskId],
                  v5NoAnnuityPage: 'envelopes',
                },
              ]
              return filterAdvisorOnlyOpenAccountsNavNodes(v5NoSplitRows, isAdvisorDemoView).map((task) => ({
                type: 'task' as const,
                task,
              }))
            })()
          : visibleTasks(action)
              .filter(
                (t) =>
                  action.id !== 'account-opening' ||
                  isAdvisorDemoView ||
                  t.formKey !== OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
              )
              .map((t) => toTaskRow(t, t.title)),
    }))
  }

  if (!accountOpeningAction) {
    return visibleActions.map((action) => ({
      id: action.id,
      title: action.title,
      taskRows: visibleTasks(action).map((t) => toTaskRow(t, t.title)),
    }))
  }

  const otherActions = visibleActions.filter((a) => a.id !== 'account-opening')

  const noAnnuityOpenAccountsTaskId =
    noAnnuityTasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)?.id ??
    noAnnuityTasks[0]?.id

  /** Sibling “file” row(s) next to the Account Opening group header; not a collapsible group. */
  const v5AnnuitySiblingRows: DisplayTaskRow[] =
    withAnnuityTasks.length === 0
      ? []
      : withAnnuityTasks.length === 1 && withAnnuityTasks[0]
        ? [
            {
              type: 'task',
              task: {
                id: 'v5-annuity-accounts-setup',
                label: OPEN_ACCOUNTS_NAV_ANNUITY_ORDER_ROW_LABEL,
                underlyingTaskIds: [withAnnuityTasks[0].id],
              },
            },
          ]
        : withAnnuityTasks.map((t) =>
            toTaskRow(
              t,
              t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
                ? OPEN_ACCOUNTS_NAV_ANNUITY_ORDER_ROW_LABEL
                : t.title,
            ),
          )

  const v5NonAnnuityGroupTasks: DisplayTaskNode[] =
    noAnnuityOpenAccountsTaskId != null
      ? [
          {
            id: 'v5-noann-account-instructions',
            label: 'Accounts',
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v5NoAnnuityPage: 'instructions',
          },
          {
            id: 'v5-noann-kyc-verification',
            label: 'KYC',
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v5NoAnnuityPage: 'kyc',
          },
          {
            id: 'v5-noann-supporting-documents',
            label: 'Supporting Documents',
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v5NoAnnuityPage: 'documents',
          },
          {
            id: 'v5-noann-envelopes',
            label: 'Envelopes',
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v5NoAnnuityPage: 'envelopes',
          },
        ]
      : []

  const v5WithoutAnnuityGroup: DisplayTaskRow = {
    type: 'group',
    id: 'v5-accounts-without-annuity',
    label: OPEN_ACCOUNTS_NAV_NO_ANNUITY_GROUP_LABEL,
    tasks: filterAdvisorOnlyOpenAccountsNavNodes(v5NonAnnuityGroupTasks, isAdvisorDemoView),
  }

  const v6NonAnnuityGroupTasks: DisplayTaskNode[] =
    noAnnuityOpenAccountsTaskId != null
      ? [
          {
            id: 'v6-account-instructions',
            label: 'Accounts',
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v6CombinedInstructions: true,
          },
          {
            id: 'v5-noann-kyc-verification',
            label: 'KYC',
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v5NoAnnuityPage: 'kyc',
          },
          {
            id: 'v5-noann-supporting-documents',
            label: 'Supporting Documents',
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v5NoAnnuityPage: 'documents',
          },
          {
            id: 'v5-noann-envelopes',
            label: 'Envelopes',
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v5NoAnnuityPage: 'envelopes',
          },
        ]
      : []

  const v6WithoutAnnuityGroup: DisplayTaskRow = {
    type: 'group',
    id: 'v6-accounts-without-annuity',
    label: OPEN_ACCOUNTS_NAV_NO_ANNUITY_GROUP_LABEL,
    tasks: filterAdvisorOnlyOpenAccountsNavNodes(v6NonAnnuityGroupTasks, isAdvisorDemoView),
  }

  const accountOpeningGroup: DisplayActionNode = {
    id: 'account-opening',
    title: 'Open Accounts',
    taskRows:
      variant === 'v5'
        ? [v5WithoutAnnuityGroup, ...(isAdvisorDemoView ? v5AnnuitySiblingRows : [])]
        : variant === 'v6'
          ? [
              v6WithoutAnnuityGroup,
              ...(isAdvisorDemoView && withAnnuityTasks[0]?.id
                ? [
                    {
                      type: 'task' as const,
                      task: {
                        id: 'v6-annuity-accounts-setup',
                        label: OPEN_ACCOUNTS_NAV_ANNUITY_ORDER_ROW_LABEL,
                        underlyingTaskIds: [withAnnuityTasks[0].id],
                      },
                    },
                  ]
                : []),
            ]
        : [
            ...(isAdvisorDemoView
              ? withAnnuityTasks.map((t) => toTaskRow(t, OPEN_ACCOUNTS_NAV_ANNUITY_ORDER_ROW_LABEL))
              : []),
            ...noAnnuityTasks.map((t) => toTaskRow(t, OPEN_ACCOUNTS_NAV_NO_ANNUITY_GROUP_LABEL)),
          ],
  }

  const result: DisplayActionNode[] = []
  let inserted = false
  for (const action of otherActions) {
    if (!inserted && action.order > accountOpeningAction.order) {
      result.push(accountOpeningGroup)
      inserted = true
    }
    result.push({
      id: action.id,
      title: action.title,
      taskRows: visibleTasks(action).map((t) => toTaskRow(t, t.title)),
    })
  }
  if (!inserted) result.push(accountOpeningGroup)
  return result
}

/** Average field-completion % across sidebar-visible task rows (matches pizza-tracker weighting). */
export function computeOverallJourneyProgressPct(
  state: WorkflowState,
  variant: OpenAccountsVariant,
): number {
  const displayActions = buildDisplayActions(state, variant)
  const allDisplayTasks: DisplayTaskNode[] = displayActions.flatMap((a) =>
    a.taskRows.flatMap((row) => (row.type === 'task' ? [row.task] : row.tasks)),
  )
  const pcts = allDisplayTasks.map((dt) => {
    const underlyingTasks = dt.underlyingTaskIds
      .map((id) => state.tasks.find((t) => t.id === id))
      .filter((t): t is Task => Boolean(t))
    const totals = underlyingTasks
      .map((t) => getTaskFieldProgress(state, t))
      .reduce(
        (acc, p) => ({ filled: acc.filled + p.filled, total: acc.total + p.total }),
        { filled: 0, total: 0 },
      )
    if (totals.total <= 0) return null
    return totals.filled / totals.total
  })
  const valid = pcts.filter((p): p is number => typeof p === 'number' && Number.isFinite(p))
  if (valid.length === 0) return 0
  return (valid.reduce((a, b) => a + b, 0) / valid.length) * 100
}

export function StepSidebar() {
  const { state, dispatch } = useWorkflow()
  const { journeys } = useServicing()
  const navigate = useNavigate()
  const workflowExitPath = useMemo(() => {
    const j = journeys.find((x) => x.id === state.journeyId)
    return j?.category === 'Onboarding' ? '/onboarding' : '/servicing'
  }, [journeys, state.journeyId])
  const variant = useOpenAccountsVariant()
  const { variant: selectedVariant } = useOpenAccountsVariantControls()
  const sidebarGroupHeaderPrimary =
    selectedVariant === 'v5' || selectedVariant === 'v6'
  const [exitToOnboardingOpen, setExitToOnboardingOpen] = useState(false)
  /** v5 collapsible task sections in the pizza tracker; default expanded */
  const [v5GroupOpen, setV5GroupOpen] = useState<Record<string, boolean>>({})
  const displayActions = useMemo(
    () => buildDisplayActions(state, selectedVariant),
    [state, selectedVariant],
  )

  const isV5GroupOpen = (groupId: string) => v5GroupOpen[groupId] !== false

  const toggleV5Group = (groupId: string) => {
    setV5GroupOpen((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] !== false),
    }))
  }

  useEffect(() => {
    if (selectedVariant !== 'v5' && selectedVariant !== 'v6') return
    setV5GroupOpen((prev) => {
      const next = { ...prev }
      for (const action of displayActions) {
        for (const row of action.taskRows) {
          if (row.type !== 'group') continue
          const taskActiveInGroup = row.tasks.some((dt) => {
            const ids =
              dt.underlyingTaskIds.length > 0 ? dt.underlyingTaskIds : [dt.id]
            return ids.some((tid) => {
              if (tid === state.activeTaskId) return true
              const task = state.tasks.find((x) => x.id === tid)
              return (
                task?.children?.some((c) => {
                  if (c.id === state.activeTaskId) return true
                  const parsed = parseChildSubTaskId(state.activeTaskId)
                  return parsed ? c.id === parsed.childId : false
                }) ?? false
              )
            })
          })
          if (taskActiveInGroup) next[row.id] = true
        }
      }
      return next
    })
  }, [selectedVariant, displayActions, state.activeTaskId, state.tasks])

  const renderTaskNavListItem = (displayTask: DisplayTaskNode) => {
    const underlyingTasks = displayTask.underlyingTaskIds
      .map((id) => state.tasks.find((t) => t.id === id))
      .filter((t): t is Task => Boolean(t))
    const progressTotals = underlyingTasks
      .map((t) => getTaskFieldProgress(state, t))
      .reduce(
        (acc, p) => ({ filled: acc.filled + p.filled, total: acc.total + p.total }),
        { filled: 0, total: 0 },
      )
    const pct = progressTotals.total > 0 ? progressTotals.filled / progressTotals.total : 0
    const aggregatedEdited = underlyingTasks.some((t) => !!t.edited)
    const aggregatedStatus: TaskStatus =
      underlyingTasks.length > 0 && underlyingTasks.every((t) => t.status === 'canceled')
        ? 'canceled'
        : (underlyingTasks[0]?.status ?? 'not_started')
    const isActiveTask = isDisplayTaskNodeActive(displayTask, state)
    return (
      <li
        key={displayTask.id}
        className={cn(
          displayTask.id === 'v6-annuity-accounts-setup' ||
            displayTask.id === 'v5-annuity-accounts-setup'
            ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.99] motion-safe:duration-300'
            : undefined,
        )}
      >
        <button
          type="button"
          onClick={() => {
            const taskId =
              (displayTask.v6CombinedInstructions
                ? displayTask.underlyingTaskIds.find((id) => {
                    const task = state.tasks.find((t) => t.id === id)
                    return task?.formKey === OPEN_ACCOUNTS_FORM_KEY
                  })
                : undefined) ??
              displayTask.underlyingTaskIds[0] ??
              displayTask.id
            if (displayTask.v5NoAnnuityPage || displayTask.v6CombinedInstructions) {
              dispatch({
                type: 'SET_V5_NO_ANNUITY_OPEN_ACCOUNTS_PAGE',
                page: displayTask.v5NoAnnuityPage ?? 'instructions',
              })
            }
            dispatch({ type: 'SET_ACTIVE_TASK', taskId })
          }}
          aria-current={isActiveTask ? 'page' : undefined}
          className={cn(
            // Shared row geometry: same horizontal padding for active/inactive so the progress column
            // stays on one vertical axis; active state only changes surface color/weight.
            'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 rounded-lg py-2.5 pl-2 pr-1.5 text-left text-sm font-medium transition-colors',
            isActiveTask
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
          )}
        >
          <span
            className={cn(
              'min-w-0 truncate text-left leading-snug',
              isActiveTask ? 'font-semibold' : '',
            )}
          >
            {getTaskNavLabel(displayTask.label)}
          </span>
          <TaskProgressIndicator
            pct={pct}
            total={progressTotals.total}
            edited={aggregatedEdited}
            status={aggregatedStatus}
          />
        </button>
      </li>
    )
  }

  const overallProgressPct = useMemo(
    () => computeOverallJourneyProgressPct(state, selectedVariant),
    [state, selectedVariant],
  )

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        className={cn(
          'w-[330px] shrink-0 border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground flex flex-col min-h-0 self-stretch h-full',
        )}
      >
        <JourneyHeader
          onExitWorkflow={() => setExitToOnboardingOpen(true)}
          onIconClick={variant === 'v5' ? () => navigate('/onboarding') : undefined}
          iconTooltip={variant === 'v5' ? 'Onboarding' : undefined}
          metaDateLabel={state.journeyDateLabel}
          metaAssigneeLabel={state.assignedTo}
          metaProgressPct={overallProgressPct}
        />
        <div className="flex-1 min-h-0 overflow-y-auto pl-1 pr-2 pt-2">
          {displayActions.map((action, actionIndex) => {
            const ActionIcon = getActionIcon(action.id)
            return (
              <div
                key={action.id}
                className="mb-4 flex items-start gap-2.5 px-2.5"
              >
                {/* One continuous spine per column (top→bottom); icon sits on top with opaque fill so the line reads as unbroken between actions. */}
                <div className="relative flex w-7 shrink-0 flex-col items-center self-stretch">
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute left-1/2 top-0 z-0 w-px -translate-x-1/2 bg-border/70',
                      actionIndex < displayActions.length - 1 ? 'bottom-[-1.25rem]' : 'bottom-0',
                    )}
                  />
                  <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <ActionIcon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-h-0 w-full flex-1 shrink" aria-hidden />
                </div>
                <div className="relative z-[1] min-w-0 flex-1">
                  <div className="mb-1.5 flex min-h-9 items-center">
                    <h3 className="truncate text-sm font-medium leading-snug text-foreground">{action.title}</h3>
                  </div>
                  <ul className="space-y-1">
                      {action.taskRows.map((row) => {
                        if (row.type === 'task') {
                          return renderTaskNavListItem(row.task)
                        }
                        const expanded = isV5GroupOpen(row.id)
                        return (
                          <li key={row.id} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => toggleV5Group(row.id)}
                              aria-expanded={expanded}
                              className={cn(
                                'flex min-h-9 w-full items-center justify-start rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/50',
                                sidebarGroupHeaderPrimary
                                  ? 'text-foreground hover:text-foreground'
                                  : 'text-muted-foreground hover:text-muted-foreground',
                              )}
                            >
                              <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                                <span className="min-w-0 truncate leading-snug">{row.label}</span>
                                <ChevronDown
                                  className={cn(
                                    'h-3.5 w-3.5 shrink-0 transition-transform',
                                    sidebarGroupHeaderPrimary
                                      ? 'text-foreground/80'
                                      : 'text-muted-foreground/90',
                                    !expanded && '-rotate-90',
                                  )}
                                  aria-hidden
                                />
                              </span>
                            </button>
                            {expanded ? (
                              <ul className="ml-4 mt-1 space-y-1">
                                {row.tasks.map((t) => renderTaskNavListItem(t))}
                              </ul>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
              </div>
            )
          })}
        </div>

        <AssignAllTasksControl />
      </nav>
      <Dialog open={exitToOnboardingOpen} onOpenChange={setExitToOnboardingOpen}>
        <DialogContent className="max-w-md !data-[state=closed]:zoom-out-100 !data-[state=open]:zoom-in-100 !data-[state=closed]:slide-out-to-left-0 !data-[state=open]:slide-in-from-left-0 !data-[state=closed]:slide-out-to-top-[50%] !data-[state=open]:slide-in-from-top-[50%]">
          <DialogHeader>
            <DialogTitle>Exit current workflow?</DialogTitle>
            <DialogDescription>
              {workflowExitPath === '/onboarding'
                ? 'This takes you out of the current journey and back to the onboarding list.'
                : 'This takes you out of the current journey and back to the servicing queue.'}
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
