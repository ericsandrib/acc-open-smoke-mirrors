import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkflow } from '@/stores/workflowStore'
import { useServicing } from '@/stores/servicingStore'
import type { Action, TaskStatus, Task, WorkflowState } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import { shouldHideKycChildWorkflows } from '@/utils/hideKycChildWorkflows'
import { useTheme } from '@/stores/themeStore'
import {
  isOpenAccountsFormKey,
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_NAV_ANNUITY_ORDER_ROW_LABEL,
  OPEN_ACCOUNTS_NAV_FORMS_PACKAGE_LABEL,
  OPEN_ACCOUNTS_NAV_NO_ANNUITY_GROUP_LABEL,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import {
  type OpenAccountsVariant,
  useOpenAccountsVariant,
  useOpenAccountsVariantControls,
} from '@/components/wizard/openAccountsVariantContext'
import { PizzaTrackerProgressIndicator } from '@/components/wizard/PizzaTrackerProgressIndicator'
import {
  computeDisplayTasksProgress,
  getDisplayTaskNodeProgress,
} from '@/components/wizard/pizzaTrackerDisplayProgress'
import { getTaskFieldProgress } from '@/utils/taskFieldProgress'
import { ChevronDown, Circle, Loader, CheckCircle2, Ban, Clock, XCircle } from 'lucide-react'
import { PizzaTrackerActionIcon } from '@/components/wizard/PizzaTrackerEntityIcons'
import { JourneyHeader } from '@/components/wizard/JourneyHeader'
import { PizzaTrackerRowMeta, PIZZA_TRACKER_META_ROW_PADDING } from '@/components/wizard/PizzaTrackerRowMeta'
import { PizzaTrackerTaskNameTooltip } from '@/components/wizard/PizzaTrackerTaskNameTooltip'
import { usePizzaTrackerDisplayPrefs, PizzaTrackerDisplayPrefsProvider } from '@/components/wizard/usePizzaTrackerDisplayPrefs'
import { handleWizardPanelShellWheel, handleWizardScrollPaneWheel } from '@/utils/wizardScroll'
import {
  getActionTasks,
  getAggregatedTaskDueMeta,
  getUniqueAssigneeNames,
  resolveAggregatedAssignee,
} from '@/utils/pizzaTrackerMeta'
import {
  captureJourneyAssigneeSnapshot,
  captureTaskAssignees,
  restoreJourneyAssigneeSnapshot,
  restoreTaskAssignees,
} from '@/utils/assigneeAssignUndo'

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
  complete: 'Pending Release',
  canceled: 'Declined',
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

export { getTaskFieldProgress } from '@/utils/taskFieldProgress'

function getTaskNavLabel(label: string): string {
  if (label === 'Accounts to Be Opened') return 'Accounts'
  return label
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

function computeDisplayActionProgress(state: WorkflowState, action: DisplayActionNode) {
  const displayTasks = action.taskRows.flatMap((row) =>
    row.type === 'task' ? [row.task] : row.tasks,
  )
  return computeDisplayTasksProgress(state, displayTasks)
}

/** Parent Supporting Documents nav — CIP uploads are on KYC children, not this parent page. */
function filterOpenAccountsNavNodes(
  nodes: DisplayTaskNode[],
  isAdvisorDemoView: boolean,
  hideKycPage: boolean,
): DisplayTaskNode[] {
  return nodes.filter((n) => {
    if (n.v5NoAnnuityPage === 'documents') return false
    if (hideKycPage && n.v5NoAnnuityPage === 'kyc') return false
    if (!isAdvisorDemoView && n.v5NoAnnuityPage === 'envelopes') return false
    return true
  })
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
 *   Without-annuity side uses navigator rows (Accounts, KYC, Forms Package) on the parent task;
 *   CIP supporting documents are on KYC children; account-level Documents on account-opening children.
 * - In reviewer demo (`demoViewMode` other than `advisor`): Forms Package and annuity-order rows are
 *   omitted from the sidebar (advisor-only).
 */
export function buildDisplayActions(
  state: WorkflowState,
  variant: OpenAccountsVariant,
  hideKycPage = shouldHideKycChildWorkflows(state),
): DisplayActionNode[] {
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
                  label: OPEN_ACCOUNTS_NAV_FORMS_PACKAGE_LABEL,
                  underlyingTaskIds: [noAnnuityOnlyTaskId],
                  v5NoAnnuityPage: 'envelopes',
                },
              ]
              return filterOpenAccountsNavNodes(v5NoSplitRows, isAdvisorDemoView, hideKycPage).map((task) => ({
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
            label: OPEN_ACCOUNTS_NAV_FORMS_PACKAGE_LABEL,
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v5NoAnnuityPage: 'envelopes',
          },
        ]
      : []

  const v5WithoutAnnuityGroup: DisplayTaskRow = {
    type: 'group',
    id: 'v5-accounts-without-annuity',
    label: OPEN_ACCOUNTS_NAV_NO_ANNUITY_GROUP_LABEL,
    tasks: filterOpenAccountsNavNodes(v5NonAnnuityGroupTasks, isAdvisorDemoView, hideKycPage),
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
            label: OPEN_ACCOUNTS_NAV_FORMS_PACKAGE_LABEL,
            underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
            v5NoAnnuityPage: 'envelopes',
          },
        ]
      : []

  const v6WithoutAnnuityGroup: DisplayTaskRow = {
    type: 'group',
    id: 'v6-accounts-without-annuity',
    label: OPEN_ACCOUNTS_NAV_NO_ANNUITY_GROUP_LABEL,
    tasks: filterOpenAccountsNavNodes(v6NonAnnuityGroupTasks, isAdvisorDemoView, hideKycPage),
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
  hideKycPage = shouldHideKycChildWorkflows(state),
): number {
  const displayActions = buildDisplayActions(state, variant, hideKycPage)
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

function StepSidebarInner() {
  const { state, dispatch } = useWorkflow()
  const { hideKycChildWorkflows } = useTheme()
  const { journeys } = useServicing()
  const hideKycPage = hideKycChildWorkflows
  const navigate = useNavigate()
  const workflowExitPath = useMemo(() => {
    const j = journeys.find((x) => x.id === state.journeyId)
    return j?.category === 'Onboarding' ? '/onboarding' : '/servicing'
  }, [journeys, state.journeyId])
  const variant = useOpenAccountsVariant()
  const { variant: selectedVariant } = useOpenAccountsVariantControls()
  const [exitToOnboardingOpen, setExitToOnboardingOpen] = useState(false)
  /** v5 collapsible task sections in the pizza tracker; default expanded */
  const [v5GroupOpen, setV5GroupOpen] = useState<Record<string, boolean>>({})
  const { prefs } = usePizzaTrackerDisplayPrefs()
  const displayActions = useMemo(
    () => buildDisplayActions(state, selectedVariant, hideKycPage),
    [state, selectedVariant, hideKycPage],
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

  const renderTaskNavListItem = (displayTask: DisplayTaskNode, nested = false) => {
    const underlyingTasks = displayTask.underlyingTaskIds
      .map((id) => state.tasks.find((t) => t.id === id))
      .filter((t): t is Task => Boolean(t))
    const { filled, total, pct, edited, status } = getDisplayTaskNodeProgress(state, displayTask)
    const progressTotals = { filled, total }
    const aggregatedEdited = edited
    const aggregatedStatus = status
    const taskDueMeta = getAggregatedTaskDueMeta(state, underlyingTasks)
    const taskAssignee = resolveAggregatedAssignee(underlyingTasks, state.assignedTo)
    const isActiveTask = isDisplayTaskNodeActive(displayTask, state)
    const rowGutter = nested ? '-ml-[54px] pl-[54px]' : '-ml-[38px] pl-[38px]'
    return (
      <li
        key={displayTask.id}
        className={cn(
          'group/task-row relative rounded-lg',
          rowGutter,
          isActiveTask ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/70',
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
            'flex w-full min-w-0 items-center gap-2 rounded-lg py-2.5 pl-0 pr-1.5 text-left text-sm font-medium transition-colors min-h-9',
            isActiveTask
              ? 'text-sidebar-accent-foreground'
              : 'text-sidebar-foreground group-hover/task-row:text-sidebar-accent-foreground',
          )}
        >
          <PizzaTrackerTaskNameTooltip
            label={getTaskNavLabel(displayTask.label)}
            tooltipLabel={displayTask.label}
            className={cn(
              'flex-1 text-left leading-snug',
              isActiveTask ? 'font-semibold' : '',
            )}
          />
          <PizzaTrackerRowMeta
            showDueDateColumn={prefs.showDueDate}
            showAssigneeColumn={prefs.showAssignee}
            dateLabel={taskDueMeta.dateLabel}
            dueAt={taskDueMeta.dueAt}
            assigneeLabel={taskAssignee}
            onAssign={(assignee) => {
              const snapshot = captureTaskAssignees(underlyingTasks)
              dispatch({
                type: 'SET_TASKS_ASSIGNEE',
                taskIds: displayTask.underlyingTaskIds,
                assignee,
              })
              return restoreTaskAssignees(dispatch, snapshot)
            }}
            trailing={
              <PizzaTrackerProgressIndicator
                pct={pct}
                total={progressTotals.total}
                edited={aggregatedEdited}
                status={aggregatedStatus}
              />
            }
          />
        </button>
      </li>
    )
  }

  const overallProgressPct = useMemo(
    () => computeOverallJourneyProgressPct(state, selectedVariant, hideKycPage),
    [state, selectedVariant, hideKycPage],
  )

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        className={cn(
          'w-[330px] shrink-0 border-r border-sidebar-border bg-white text-sidebar-foreground flex flex-col min-h-0 self-stretch h-full',
        )}
        onWheel={handleWizardPanelShellWheel}
      >
        <JourneyHeader
          onExitWorkflow={() => setExitToOnboardingOpen(true)}
          onIconClick={variant === 'v5' ? () => navigate('/onboarding') : undefined}
          iconTooltip={variant === 'v5' ? 'Onboarding' : undefined}
          metaDateLabel={state.journeyDateLabel}
          metaAssigneeLabel={state.assignedTo}
          metaProgressPct={overallProgressPct}
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
          {displayActions.map((action, actionIndex) => {
            const actionTasks = getActionTasks(state, action.id)
            const actionAssigneeNames = getUniqueAssigneeNames(actionTasks, state.assignedTo)
            const actionAssigneeCount = actionAssigneeNames.length
            const actionProgress = computeDisplayActionProgress(state, action)
            return (
              <div
                key={action.id}
                className="mb-4 flex items-start gap-2.5"
              >
                {/* One continuous spine per column (top→bottom); icon sits on top with opaque fill so the line reads as unbroken between actions. */}
                <div className="relative flex w-7 shrink-0 flex-col items-center self-stretch">
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute left-1/2 top-0 z-[2] w-px -translate-x-1/2 bg-border/70',
                      actionIndex < displayActions.length - 1 ? 'bottom-[-1.25rem]' : 'bottom-0',
                    )}
                  />
                  <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[var(--bg-tertiary)] text-muted-foreground">
                    <PizzaTrackerActionIcon />
                  </span>
                  <div className="min-h-0 w-full flex-1 shrink" aria-hidden />
                </div>
                <div className="relative z-[1] min-w-0 flex-1">
                  <div
                    className={cn(
                      'mb-1.5 flex min-h-9 items-center gap-2',
                      PIZZA_TRACKER_META_ROW_PADDING,
                    )}
                  >
                    <h3 className="min-w-0 flex-1 truncate text-sm font-medium leading-snug text-foreground">
                      {action.title}
                    </h3>
                    <PizzaTrackerRowMeta
                      showDueDateColumn={prefs.showDueDate}
                      showAssigneeColumn={prefs.showAssignee}
                      assigneeLabel={
                        actionAssigneeCount === 1
                          ? actionAssigneeNames[0]
                          : actionAssigneeCount === 0
                            ? 'Unassigned'
                            : undefined
                      }
                      assigneeCount={actionAssigneeCount > 1 ? actionAssigneeCount : undefined}
                      assigneeNames={
                        actionAssigneeCount > 1 ? actionAssigneeNames : undefined
                      }
                      onAssign={(assignee) => {
                        const snapshot = captureTaskAssignees(actionTasks)
                        dispatch({
                          type: 'SET_TASKS_ASSIGNEE',
                          taskIds: actionTasks.map((t) => t.id),
                          assignee,
                        })
                        return restoreTaskAssignees(dispatch, snapshot)
                      }}
                      successDescription={
                        actionAssigneeCount > 1
                          ? (name) => `All tasks in this action assigned to ${name}.`
                          : undefined
                      }
                      trailing={
                        <PizzaTrackerProgressIndicator
                          pct={actionProgress.pct}
                          total={actionProgress.total}
                          edited={actionProgress.edited}
                          status={actionProgress.status}
                        />
                      }
                    />
                  </div>
                  <ul className="space-y-1">
                      {action.taskRows.map((row) => {
                        if (row.type === 'task') {
                          return renderTaskNavListItem(row.task)
                        }
                        const expanded = isV5GroupOpen(row.id)
                        return (
                          <Fragment key={row.id}>
                            <li
                              className={cn(
                                '-ml-[38px] rounded-lg pl-[38px] transition-colors hover:bg-muted/50',
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => toggleV5Group(row.id)}
                                aria-expanded={expanded}
                                className="flex w-full min-w-0 items-center gap-2 rounded-lg py-2.5 pl-0 pr-1.5 text-left text-sm font-medium text-foreground transition-colors min-h-9"
                              >
                                <span className="inline-flex min-w-0 flex-1 items-center gap-1">
                                  <span className="min-w-0 truncate leading-snug">{row.label}</span>
                                  <ChevronDown
                                    className={cn(
                                      'h-3.5 w-3.5 shrink-0 text-muted-foreground/90 transition-transform',
                                      !expanded && '-rotate-90',
                                    )}
                                    aria-hidden
                                  />
                                </span>
                                <PizzaTrackerRowMeta
                                  showDueDateColumn={prefs.showDueDate}
                                  showAssigneeColumn={prefs.showAssignee}
                                  reserveTrailingColumn
                                />
                              </button>
                            </li>
                            {expanded ? (
                              <li>
                                <div className="relative mt-1 pl-4">
                                  <span
                                    aria-hidden
                                    className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-px bg-border/70"
                                  />
                                  <ul className="space-y-1">
                                    {row.tasks.map((t) => renderTaskNavListItem(t, true))}
                                  </ul>
                                </div>
                              </li>
                            ) : null}
                          </Fragment>
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

export function StepSidebar() {
  return (
    <PizzaTrackerDisplayPrefsProvider>
      <StepSidebarInner />
    </PizzaTrackerDisplayPrefsProvider>
  )
}
