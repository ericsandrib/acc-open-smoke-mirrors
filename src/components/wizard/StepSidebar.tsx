import { useEffect, useMemo, useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import type { Action, TaskStatus, Task, WorkflowState } from '@/types/workflow'
import { cn } from '@/lib/utils'
import { parseChildSubTaskId } from '@/utils/childTaskRegistry'
import {
  isOpenAccountsFormKey,
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import { taskSections } from '@/components/wizard/formRegistry'
import { useTheme } from '@/stores/themeStore'
import {
  type OpenAccountsVariant,
  useCombinedSectionFocus,
  useOpenAccountsVariant,
} from '@/components/wizard/openAccountsVariantContext'
import { combinedOpenAccountsSections } from '@/components/wizard/combinedOpenAccountsSections'
import { ProgressIcon, pickVariant } from '@/components/wizard/ProgressIcons'
import type { LucideIcon } from 'lucide-react'
import {
  ChevronDown,
  ChevronRight,
  Users,
  Wallet,
  ListChecks,
} from 'lucide-react'
import { Circle, Loader, CheckCircle2, Ban, Clock, XCircle } from 'lucide-react'
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

function getTaskFieldProgress(state: WorkflowState, task: Task): { filled: number; total: number } {
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

const DEFAULT_TASK_SECTIONS = [{ id: '__top__', label: 'Overview' }] as const

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

type DisplayTaskNode = {
  /** Stable row id (React key). May be synthetic in v5 while `underlyingTaskIds` holds the real task id. */
  id: string
  label: string
  /** Underlying task ids that this display node represents (1:1 in default/v1, both in v2). */
  underlyingTaskIds: string[]
  /** v5: separate “page” within the no-annuity Open Accounts task. */
  v5NoAnnuityPage?: 'instructions' | 'kyc' | 'envelopes'
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

/**
 * Build the action/task display structure honoring the demo Account Opening variant.
 *
 * - In a non-split journey (no `account-opening-annuity` action) the structure is unchanged.
 * - In v1 split: merge the two account-opening actions into a single "Account Opening" group,
 *   and rename each open-accounts task to clarify the annuity vs. no-annuity flow.
 * - In v2/v3/v4 split: keep both open-accounts tasks visible (renamed labels on each row).
 * - In v5 split: collapsible “Accounts without Annuities” / “Accounts with Annuities”.
 *   Without-annuity side uses three navigator rows (Account Instructions, KYC Verification, Envelopes)
 *   that all bind to the same underlying task and swap full-page `OpenAccountsForm` content.
 */
function buildDisplayActions(state: WorkflowState, variant: OpenAccountsVariant): DisplayActionNode[] {
  const visibleActions = state.actions
    .filter((a) => a.id !== 'kyc')
    .sort((a, b) => a.order - b.order)
  const visibleTasks = (action: Action) =>
    state.tasks
      .filter((t) => t.actionId === action.id && t.formKey !== 'kyc' && t.id !== 'kyc-review')
      .sort((a, b) => a.order - b.order)

  const noAnnuityAction = visibleActions.find((a) => a.id === 'account-opening')
  const withAnnuityAction = visibleActions.find((a) => a.id === 'account-opening-annuity')
  const isSplit = !!(noAnnuityAction && withAnnuityAction)

  const toTaskRow = (t: Task, label: string): DisplayTaskRow => ({
    type: 'task',
    task: { id: t.id, label, underlyingTaskIds: [t.id] },
  })

  if (!isSplit) {
    return visibleActions.map((action) => ({
      id: action.id,
      title: action.title,
      taskRows: visibleTasks(action).map((t) => toTaskRow(t, t.title)),
    }))
  }

  const otherActions = visibleActions.filter(
    (a) => a.id !== 'account-opening' && a.id !== 'account-opening-annuity',
  )

  const noAnnuityTasks = visibleTasks(noAnnuityAction)
  const withAnnuityTasks = visibleTasks(withAnnuityAction)
  const noAnnuityOpenAccountsTaskId =
    noAnnuityTasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY)?.id ??
    noAnnuityTasks[0]?.id

  const accountOpeningGroup: DisplayActionNode = {
    id: 'account-opening',
    title: 'Account Opening',
    taskRows:
      variant === 'v5'
        ? [
            {
              type: 'group',
              id: 'v5-accounts-without-annuity',
              label: 'Accounts without Annuities',
              tasks:
                noAnnuityOpenAccountsTaskId != null
                  ? [
                      {
                        id: 'v5-noann-account-instructions',
                        label: 'Account Instructions',
                        underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
                        v5NoAnnuityPage: 'instructions',
                      },
                      {
                        id: 'v5-noann-kyc-verification',
                        label: 'KYC Verification',
                        underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
                        v5NoAnnuityPage: 'kyc',
                      },
                      {
                        id: 'v5-noann-envelopes',
                        label: 'Envelopes',
                        underlyingTaskIds: [noAnnuityOpenAccountsTaskId],
                        v5NoAnnuityPage: 'envelopes',
                      },
                    ]
                  : [],
            },
            {
              type: 'group',
              id: 'v5-accounts-with-annuity',
              label: 'Accounts with Annuities',
              tasks: withAnnuityTasks.map((t) => ({
                id: t.id,
                label: t.title,
                underlyingTaskIds: [t.id],
              })),
            },
          ]
        : [
            ...noAnnuityTasks.map((t) => toTaskRow(t, 'Accounts without Annuities')),
            ...withAnnuityTasks.map((t) => toTaskRow(t, 'Accounts with Annuities')),
          ],
  }

  const result: DisplayActionNode[] = []
  let inserted = false
  for (const action of otherActions) {
    if (
      !inserted &&
      action.order > Math.min(noAnnuityAction.order, withAnnuityAction.order)
    ) {
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

export function StepSidebar() {
  const { state, dispatch } = useWorkflow()
  const { taskSectionNavStyle } = useTheme()
  const variant = useOpenAccountsVariant()
  const { requestFocus } = useCombinedSectionFocus()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  /** v5 collapsible task sections in the pizza tracker; default expanded */
  const [v5GroupOpen, setV5GroupOpen] = useState<Record<string, boolean>>({})

  const activeTopLevelTask = useMemo(
    () => state.tasks.find((t) => t.id === state.activeTaskId),
    [state.tasks, state.activeTaskId],
  )
  const isV2CombinedActive =
    (variant === 'v2' || variant === 'v3' || variant === 'v4' || variant === 'v5') &&
    !!activeTopLevelTask &&
    (activeTopLevelTask.formKey === OPEN_ACCOUNTS_FORM_KEY ||
      activeTopLevelTask.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY) &&
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY) &&
    state.tasks.some((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY)
  const activeSections = useMemo(
    () => (activeTopLevelTask ? taskSections[activeTopLevelTask.formKey] ?? DEFAULT_TASK_SECTIONS : DEFAULT_TASK_SECTIONS),
    [activeTopLevelTask],
  )

  useEffect(() => {
    setActiveSectionId(activeSections[0]?.id ?? null)
  }, [state.activeTaskId, activeSections])

  const displayActions = useMemo(
    () => buildDisplayActions(state, variant),
    [state, variant],
  )

  const isV5GroupOpen = (groupId: string) => v5GroupOpen[groupId] !== false

  const toggleV5Group = (groupId: string) => {
    setV5GroupOpen((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] !== false),
    }))
  }

  useEffect(() => {
    if (variant !== 'v5') return
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
  }, [variant, displayActions, state.activeTaskId, state.tasks])

  const renderTaskNavListItem = (displayTask: DisplayTaskNode, nestedInV5Group: boolean) => {
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
    const baseTaskActive =
      underlyingTasks.some((t) => state.activeTaskId === t.id) ||
      underlyingTasks.some((t) =>
        (t.children ?? []).some((c) => {
          if (c.id === state.activeTaskId) return true
          const parsed = parseChildSubTaskId(state.activeTaskId)
          return parsed ? c.id === parsed.childId : false
        }),
      )
    const isActiveTask = displayTask.v5NoAnnuityPage
      ? baseTaskActive && state.v5NoAnnuityOpenAccountsPage === displayTask.v5NoAnnuityPage
      : baseTaskActive
    const sections = (() => {
      const formKey = underlyingTasks[0]?.formKey
      if (!formKey) return DEFAULT_TASK_SECTIONS
      return taskSections[formKey] ?? DEFAULT_TASK_SECTIONS
    })()
    return (
      <li key={displayTask.id}>
        <button
          type="button"
          onClick={() => {
            const taskId = displayTask.underlyingTaskIds[0] ?? displayTask.id
            if (displayTask.v5NoAnnuityPage) {
              dispatch({
                type: 'SET_V5_NO_ANNUITY_OPEN_ACCOUNTS_PAGE',
                page: displayTask.v5NoAnnuityPage,
              })
            }
            dispatch({ type: 'SET_ACTIVE_TASK', taskId })
          }}
          aria-current={isActiveTask ? 'page' : undefined}
          className={cn(
            'w-full text-left pr-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between gap-2 transition-colors',
            nestedInV5Group ? 'pl-9' : 'pl-12',
            isActiveTask ? 'bg-accent/60 text-foreground' : 'hover:bg-muted/50 text-foreground',
          )}
        >
          <span className={cn('truncate min-w-0', isActiveTask ? 'font-semibold' : '')}>
            {getTaskNavLabel(displayTask.label)}
          </span>
          <TaskProgressIndicator
            pct={pct}
            total={progressTotals.total}
            edited={aggregatedEdited}
            status={aggregatedStatus}
          />
        </button>
        {taskSectionNavStyle === 'nested' && isActiveTask && isV2CombinedActive ? (
          <ul className="mt-1.5 ml-4 space-y-2 border-l border-border/80 pl-2.5">
            {combinedOpenAccountsSections.map((group) => (
              <li key={group.key} className="space-y-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                  <ChevronRight className="h-3 w-3" />
                  <span className="truncate">{group.label}</span>
                </div>
                <ul className="ml-3 space-y-1 border-l border-border/60 pl-2.5">
                  {group.sections.map((section) => {
                    const compositeId = `${group.key}::${section.id}`
                    return (
                      <li key={compositeId}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSectionId(compositeId)
                            requestFocus(group.key, section.id)
                          }}
                          aria-current={activeSectionId === compositeId ? 'page' : undefined}
                          className={cn(
                            'w-full text-left px-2.5 py-1.5 text-[12px] rounded-md transition-colors',
                            activeSectionId === compositeId
                              ? 'bg-muted text-foreground font-semibold'
                              : 'cursor-pointer text-foreground/85 hover:text-foreground hover:bg-muted/60',
                          )}
                        >
                          {section.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        ) : taskSectionNavStyle === 'nested' && isActiveTask && sections.length > 0 ? (
          <ul className="mt-1.5 ml-4 space-y-1.5 border-l border-border/80 pl-2.5">
            {sections.map((section) => {
              const childSections = 'children' in section ? section.children : undefined
              const hasChildren = !!childSections?.length
              if (hasChildren && childSections) {
                return (
                  <li key={section.id} className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                      <ChevronRight className="h-3 w-3" />
                      <span className="truncate">{section.label}</span>
                    </div>
                    <ul className="ml-3 space-y-1 border-l border-border/60 pl-2.5">
                      {childSections.map((child) => (
                        <li key={child.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSectionId(child.id)
                              dispatch({ type: 'FOCUS_PARENT_TASK_SECTION', sectionId: child.id })
                            }}
                            aria-current={activeSectionId === child.id ? 'page' : undefined}
                            className={cn(
                              'w-full text-left px-2.5 py-1.5 text-[12px] rounded-md transition-colors',
                              activeSectionId === child.id
                                ? 'bg-muted text-foreground font-semibold'
                                : 'cursor-pointer text-foreground/85 hover:text-foreground hover:bg-muted/60',
                            )}
                          >
                            {child.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              }
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSectionId(section.id)
                      dispatch({ type: 'FOCUS_PARENT_TASK_SECTION', sectionId: section.id })
                    }}
                    aria-current={activeSectionId === section.id ? 'page' : undefined}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 text-[12px] rounded-md transition-colors',
                      activeSectionId === section.id
                        ? 'bg-muted text-foreground font-semibold'
                        : 'cursor-pointer text-foreground/85 hover:text-foreground hover:bg-muted/60',
                    )}
                  >
                    {section.label}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </li>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <nav className={cn('w-[330px] border-r border-border overflow-y-auto bg-white')}>
        <JourneyHeader />
        <div className="px-1 pt-2">
        {displayActions.map((action) => {
          const ActionIcon = getActionIcon(action.id)
          return (
          <div key={action.id} className="mb-5">
            <div className="mb-1.5 flex h-9 items-center gap-2 px-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-muted-foreground">
                <ActionIcon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <h3 className="text-sm font-medium text-foreground">
                {action.title}
              </h3>
            </div>
            <ul className="space-y-1">
              {action.taskRows.map((row) => {
                if (row.type === 'task') {
                  return renderTaskNavListItem(row.task, false)
                }
                const expanded = isV5GroupOpen(row.id)
                return (
                  <li key={row.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleV5Group(row.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-start rounded-lg py-2 pl-8 pr-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-muted-foreground"
                    >
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                        <span className="min-w-0 truncate">{row.label}</span>
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 text-muted-foreground/90 transition-transform',
                            !expanded && '-rotate-90',
                          )}
                          aria-hidden
                        />
                      </span>
                    </button>
                    {expanded ? (
                      <ul className="ml-2 space-y-1 border-l border-border/70 pl-2">
                        {row.tasks.map((t) => renderTaskNavListItem(t, true))}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
          )
        })}
        </div>
      </nav>
    </TooltipProvider>
  )
}
