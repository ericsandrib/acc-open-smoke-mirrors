import { StepSidebar } from './StepSidebar'
import { TaskContent } from './TaskContent'
import { DetailSidebar } from './DetailSidebar'
import { WizardFooter } from './WizardFooter'
import { HomeOfficeReviewFooter } from './HomeOfficeReviewFooter'
import { AmlReviewFooter } from './AmlReviewFooter'
import { HoKycReviewFooter } from './HoKycReviewFooter'
import { ChildActionSidebar } from './ChildActionSidebar'
import { ChildActionContent } from './ChildActionContent'
import { ChildActionFooter } from './ChildActionFooter'
import { ChildActionRightSidebar } from './ChildActionRightSidebar'
import { ChildHoDocumentViewContent } from './ChildHoDocumentViewContent'
import { ChildHoPrincipalViewContent } from './ChildHoPrincipalViewContent'
import { ChildHoKycViewContent } from './ChildHoKycViewContent'
import { ChildAmlReviewContent } from './ChildAmlReviewContent'
import { useState, type ReactNode } from 'react'
import { Eye, ShieldCheck, ShieldAlert, Building } from 'lucide-react'
import { VerticalNav } from '@/components/navigation/vertical-nav'
import { ComposeDialog } from '@/components/dashboard/ComposeDialog'
import { useWorkflow } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  WizardRightPanelProvider,
} from '@/components/wizard/wizardRightPanelContext'
import { getChildTypeConfig, getSubTaskDisplayTitle } from '@/utils/childTaskRegistry'

type WizardActionProgressItem = { id: string; title: string; pct: number }
type HeaderBreadcrumb = {
  id: string
  label: string
  onClick?: () => void
  isCurrent?: boolean
  className?: string
  menuItems?: Array<{ id: string; label: string; onSelect: () => void }>
}

const HEADER_BREADCRUMB_MAX_VISIBLE = 4

function HeaderBreadcrumbTrail({ items, title }: { items: HeaderBreadcrumb[]; title: string }) {
  if (items.length === 0) return null
  const needsCollapse = items.length > HEADER_BREADCRUMB_MAX_VISIBLE
  const hiddenItems = needsCollapse ? items.slice(1, -2) : []
  const visibleItems = needsCollapse
    ? [items[0], { id: '__ellipsis__', label: '...' as const }, ...items.slice(-2)]
    : items

  return (
    <div
      className="flex flex-row flex-nowrap items-center gap-1.5 text-xs"
      title={title}
    >
      {visibleItems.map((item, idx) => {
        const isEllipsis = item.id === '__ellipsis__'
        const isLast = idx === visibleItems.length - 1
        return (
          <div key={item.id} className="inline-flex items-center gap-1.5">
            {isEllipsis ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 whitespace-nowrap text-left text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 p-0 cursor-pointer"
                    aria-label="Show hidden breadcrumb items"
                    title="Show hidden breadcrumb items"
                  >
                    ...
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={6} className="min-w-[14rem]">
                  {hiddenItems.map((hidden) => (
                    <DropdownMenuItem
                      key={hidden.id}
                      onSelect={() => hidden.onClick?.()}
                      className="max-w-[18rem] truncate"
                      title={hidden.label}
                    >
                      {hidden.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : item.onClick ? (
              item.menuItems && item.menuItems.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'shrink-0 whitespace-nowrap text-left text-xs transition-colors bg-transparent border-0 p-0 cursor-pointer hover:text-foreground',
                        item.className ?? (item.isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'),
                      )}
                      onClick={item.onClick}
                      title={item.label}
                    >
                      {item.label}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="min-w-[14rem]">
                    {item.menuItems.map((menuItem) => (
                      <DropdownMenuItem
                        key={menuItem.id}
                        onSelect={menuItem.onSelect}
                        className="max-w-[18rem] truncate"
                        title={menuItem.label}
                      >
                        {menuItem.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  type="button"
                  className={cn(
                    'shrink-0 whitespace-nowrap text-left text-xs transition-colors bg-transparent border-0 p-0 cursor-pointer hover:text-foreground',
                    item.className ?? (item.isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'),
                  )}
                  onClick={item.onClick}
                  title={item.label}
                >
                  {item.label}
                </button>
              )
            ) : (
              <span
                className={cn(
                  'shrink-0 whitespace-nowrap text-xs',
                  item.className ?? (item.isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'),
                )}
                title={item.label}
              >
                {item.label}
              </span>
            )}
            {!isLast ? (
              <span className="shrink-0 text-muted-foreground" aria-hidden>
                /
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function WizardActionProgressBar({
  actions,
  activeActionId,
  onSelectAction,
}: {
  actions: WizardActionProgressItem[]
  activeActionId: string | undefined
  onSelectAction: (actionId: string) => void
}) {
  return (
    <div className="flex flex-row flex-nowrap items-center gap-3 w-full min-w-0">
      {actions.map((action) => {
        const isActive = activeActionId === action.id
        return (
          <div
            key={action.id}
            className="min-w-0 flex-1 px-2 py-1.5"
            title={`${action.title}: ${action.pct}% complete`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <button
                type="button"
                className={cn(
                  'text-[11px] truncate text-left transition-colors w-full',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => onSelectAction(action.id)}
              >
                {action.title}
              </button>
            </div>
            <div
              className={cn(
                'h-1 w-full rounded-full overflow-hidden',
                isActive ? 'bg-primary/25 dark:bg-primary/20' : 'bg-muted',
              )}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isActive ? 'bg-primary' : 'bg-muted-foreground/40 dark:bg-muted-foreground/35',
                )}
                style={{ width: `${action.pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Mirrors StepSidebar | main | DetailSidebar column widths so the progress bar
 * stays aligned with `max-w-2xl mx-auto` form content when the right rail collapses.
 */
function WizardProgressHeaderRow({
  left,
  actions,
  activeActionId,
  onSelectAction,
}: {
  left: ReactNode
  actions: WizardActionProgressItem[]
  activeActionId: string | undefined
  onSelectAction: (actionId: string) => void
}) {
  return (
    <header className="border-b border-border py-2 shrink-0 overflow-visible">
      <div className="flex flex-row items-center min-h-8 min-w-0 overflow-visible">
        <div className="w-64 shrink-0 min-w-0 px-5 overflow-visible relative z-20">
          <div className="w-max max-w-none overflow-visible py-0.5 pr-3 rounded-r-md bg-background">
            {left}
          </div>
        </div>
        <div className="flex-1 min-w-0 px-8 relative z-10">
          <div className="max-w-2xl w-full min-w-0 mx-auto">
            <WizardActionProgressBar
              actions={actions}
              activeActionId={activeActionId}
              onSelectAction={onSelectAction}
            />
          </div>
        </div>
        <div className="w-64 shrink-0" aria-hidden />
      </div>
    </header>
  )
}

export function WizardLayout() {
  const { state, dispatch } = useWorkflow()
  const navigate = useNavigate()
  const [composeOpen, setComposeOpen] = useState(false)
  const inChildAction = !!state.activeChildActionId
  const viewMode = state.demoViewMode

  const activeChild = inChildAction
    ? state.tasks.flatMap((t) => t.children ?? []).find((c) => c.id === state.activeChildActionId)
    : null
  const activeParentTask = activeChild
    ? state.tasks.find((t) => (t.children ?? []).some((c) => c.id === activeChild.id))
    : undefined
  const activeChildConfig = activeChild ? getChildTypeConfig(activeChild.childType) : undefined
  const activeChildSubTask =
    activeChildConfig && state.activeChildSubTaskIndex != null
      ? activeChildConfig.subTasks[state.activeChildSubTaskIndex]
      : undefined
  const isKycChild = activeChild?.childType === 'kyc'

  /** Reviewer demo tabs only for this child once it is submitted / in review / complete — not from global `submittedAt` (e.g. after KYC approval elsewhere). */
  const childInReviewerPipeline =
    !!activeChild &&
    (activeChild.status === 'awaiting_review' ||
      activeChild.status === 'complete' ||
      activeChild.status === 'rejected')
  const childSupportsReviewerDemoTabs =
    activeChild?.childType === 'kyc' || activeChild?.childType === 'account-opening'

  const isAdvisorView = viewMode === 'advisor'
  const isHoDocView = viewMode === 'ho-documents'
  const isHoPrincipalView = viewMode === 'ho-principal'
  const isHoKycView = viewMode === 'ho-kyc'
  const isAmlView = viewMode === 'aml'
  const isHomeOfficeView = isHoDocView || isHoPrincipalView
  /** Stale `ho-documents` / `ho-principal` after KYC must not put a draft account child into HO reviewer layout. */
  const showHomeOfficeAccountLayout =
    isHomeOfficeView &&
    (activeChild?.childType !== 'account-opening' || childInReviewerPipeline)

  const showViewToggle =
    inChildAction && childSupportsReviewerDemoTabs && childInReviewerPipeline
  const getTaskCompletionPct = (taskId: string, formKey: string): number => {
    if (formKey === 'related-parties') {
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const total = members.length * 2
      if (total <= 0) return 0
      let filled = 0
      for (const m of members) {
        if (m.email?.trim()) filled++
        if (m.phone?.trim()) filled++
      }
      return Math.round((filled / total) * 100)
    }
    if (formKey === 'existing-accounts') {
      return state.financialAccounts.length > 0 ? 100 : 0
    }
    if (formKey === 'kyc') {
      const task = state.tasks.find((t) => t.id === taskId)
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const needsKyc = members.filter((m) => m.kycStatus !== 'verified')
      const total = Math.max(needsKyc.length, 1)
      const filled = Math.min(
        (task?.children ?? []).filter((c) => c.status === 'complete').length,
        total,
      )
      return Math.round((filled / total) * 100)
    }
    if (formKey === 'open-accounts' || formKey === 'open-accounts-with-annuity') {
      const task = state.tasks.find((t) => t.id === taskId)
      const children = (task?.children ?? []).filter(
        (c) => c.childType === 'account-opening',
      )
      const taskData = (state.taskData[taskId] as Record<string, unknown> | undefined) ?? {}

      // Section 1: Accounts to Be Opened
      const accountsPct =
        children.length === 0
          ? 0
          : Math.round(
              (children.filter((c) => c.status === 'complete' || c.status === 'canceled').length /
                children.length) *
                100,
            ) || 35 // credit meaningful progress once accounts are added even before completion

      // Section 2: Required Documents (doc-instances-* rows with uploads)
      const docInstanceKeys = Object.keys(taskData).filter((k) => k.startsWith('doc-instances-'))
      let docRowsTotal = 0
      let docRowsUploaded = 0
      for (const key of docInstanceKeys) {
        const rows = (taskData[key] as Array<{ fileName?: string }> | undefined) ?? []
        docRowsTotal += rows.length
        docRowsUploaded += rows.filter((r) => Boolean(r?.fileName)).length
      }
      const documentsPct =
        docRowsTotal > 0
          ? Math.round((docRowsUploaded / docRowsTotal) * 100)
          : children.length > 0
            ? 10 // slight lift once accounts exist and docs section is in play
            : 0

      // Section 3: KYC Verification
      const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
      const kycChildren = (kycTask?.children ?? []).filter((c) => c.childType === 'kyc')
      const kycPct =
        kycChildren.length > 0
          ? Math.round((kycChildren.filter((c) => c.status === 'complete').length / kycChildren.length) * 100)
          : 0

      // Section 4: Envelopes
      const envelopes = (taskData.esignEnvelopes as Array<unknown> | undefined) ?? []
      const esignPct = envelopes.length > 0 ? 100 : 0

      // Weighted blend mirrors section importance in Open Accounts.
      return Math.round(accountsPct * 0.4 + documentsPct * 0.3 + kycPct * 0.15 + esignPct * 0.15)
    }
    return 0
  }
  const activeParentActionId = state.tasks.find((t) => t.id === state.activeTaskId)?.actionId
  const activeTopLevelTask = state.tasks.find((t) => t.id === state.activeTaskId)
  const getActionTitle = (actionId: string | undefined) =>
    actionId ? state.actions.find((a) => a.id === actionId)?.title : undefined
  const getTopLevelTasksForAction = (actionId: string | undefined) =>
    actionId
      ? state.tasks
          .filter((t) => t.actionId === actionId && t.formKey !== 'kyc' && t.id !== 'kyc-review')
          .sort((a, b) => a.order - b.order)
      : []
  const currentTopLevelActionId = inChildAction ? activeParentTask?.actionId : activeParentActionId
  const actionProgress = state.actions
    .filter((action) => action.id !== 'kyc')
    .sort((a, b) => a.order - b.order)
    .map((action) => {
      const tasks = state.tasks.filter(
        (t) => t.actionId === action.id && t.formKey !== 'kyc' && t.id !== 'kyc-review',
      )
      const total = tasks.length
      const pct = total > 0
        ? Math.round(tasks.reduce((sum, t) => sum + getTaskCompletionPct(t.id, t.formKey), 0) / total)
        : 0
      return { id: action.id, title: action.title, pct }
    })
  const goToJourneyStart = () => {
    const firstTaskId = state.flatTaskOrder[0]
    if (!firstTaskId) return
    dispatch({ type: 'GO_TO_TASK', taskId: firstTaskId })
    navigate('/wizard')
  }
  const navigateToParentAction = (actionId: string) => {
    const firstTask = state.tasks
      .filter((t) => t.actionId === actionId && t.formKey !== 'kyc' && t.id !== 'kyc-review')
      .sort((a, b) => a.order - b.order)[0]
    if (!firstTask) return
    dispatch({ type: 'GO_TO_TASK', taskId: firstTask.id })
  }
  const childBreadcrumbRow =
    inChildAction && activeChild ? (
      <WizardProgressHeaderRow
        left={(() => {
          const rootCrumb = 'Onboarding'
          const journeyCrumb = state.journeyName ?? 'Client Onboarding'
          const parentActionTitle = getActionTitle(activeParentTask?.actionId)
          const parentCrumb = activeParentTask?.title ?? 'Task'
          const actionMenuItems = state.actions
            .filter((a) => a.id !== 'kyc')
            .sort((a, b) => a.order - b.order)
            .map((a) => ({
              id: `action-${a.id}`,
              label: a.title,
              onSelect: () => navigateToParentAction(a.id),
            }))
          const parentTaskMenuItems = getTopLevelTasksForAction(activeParentTask?.actionId).map((t) => ({
            id: `task-${t.id}`,
            label: t.title,
            onSelect: () => dispatch({ type: 'GO_TO_TASK', taskId: t.id }),
          }))
          const accountSubTaskMenuItems = state.childActionResume
            ? getChildTypeConfig('account-opening').subTasks.map((subTask, index) => ({
                id: `account-subtask-${subTask.suffix}`,
                label: getSubTaskDisplayTitle('account-opening', subTask, state.demoViewMode),
                onSelect: () => {
                  dispatch({ type: 'EXIT_CHILD_ACTION' })
                  dispatch({ type: 'SET_CHILD_SUB_TASK', index })
                },
              }))
            : []
          const resumeAccountChild = state.childActionResume?.accountChildId
            ? state.tasks
                .flatMap((t) => t.children ?? [])
                .find((c) => c.id === state.childActionResume?.accountChildId)
            : undefined
          const showActiveChildCrumb =
            !resumeAccountChild &&
            !!activeChild?.name &&
            activeChild.name !== parentCrumb
          const resumeSubTask =
            state.childActionResume
              ? getChildTypeConfig('account-opening').subTasks[state.childActionResume.subTaskIndex]
              : undefined
          const pathItems: HeaderBreadcrumb[] = [
            { id: 'root', label: rootCrumb, onClick: () => navigate('/onboarding') },
            {
              id: 'journey',
              label: journeyCrumb,
              onClick: goToJourneyStart,
            },
            ...(parentActionTitle && activeParentTask?.actionId
              ? [{
                  id: 'parent-action',
                  label: parentActionTitle,
                  onClick: () => navigateToParentAction(activeParentTask.actionId),
                  menuItems: actionMenuItems,
                }]
              : []),
            {
              id: 'parent',
              label: parentCrumb,
              onClick: () => {
                if (activeParentTask?.id) {
                  dispatch({ type: 'GO_TO_TASK', taskId: activeParentTask.id })
                  return
                }
                dispatch({ type: 'EXIT_CHILD_ACTION' })
              },
              menuItems: parentTaskMenuItems,
            },
          ]
          if (resumeAccountChild) {
            pathItems.push({
              id: 'resume-account-child',
              label: resumeAccountChild.name,
              onClick: () => dispatch({ type: 'EXIT_CHILD_ACTION' }),
              menuItems: accountSubTaskMenuItems,
            })
          }
          if (showActiveChildCrumb) {
            pathItems.push({
              id: 'active-child',
              label: activeChild.name,
            })
          }
          if (resumeSubTask) {
            pathItems.push({
              id: 'resume-parent-subtask',
              label: resumeSubTask.title,
              onClick: () => dispatch({ type: 'EXIT_CHILD_ACTION' }),
            })
          }
          pathItems[pathItems.length - 1].isCurrent = true
          return <HeaderBreadcrumbTrail items={pathItems} title={pathItems.map((p) => p.label).join(' / ')} />
        })()}
        actions={actionProgress}
        activeActionId={currentTopLevelActionId}
        onSelectAction={navigateToParentAction}
      />
    ) : null

  return (
    <div className="flex h-screen bg-background">
      <VerticalNav defaultCollapsed onCreateClick={() => setComposeOpen(true)} />
      <WizardRightPanelProvider>
      <div className="flex flex-col flex-1 min-w-0">
        {!inChildAction && (
          <WizardProgressHeaderRow
            left={(() => {
              const jn = state.journeyName ?? 'Client Onboarding'
              const activeActionTitle = getActionTitle(activeTopLevelTask?.actionId)
              const activeTaskTitle = activeTopLevelTask?.title
              const actionMenuItems = state.actions
                .filter((a) => a.id !== 'kyc')
                .sort((a, b) => a.order - b.order)
                .map((a) => ({
                  id: `action-${a.id}`,
                  label: a.title,
                  onSelect: () => navigateToParentAction(a.id),
                }))
              const taskMenuItems = getTopLevelTasksForAction(activeTopLevelTask?.actionId).map((t) => ({
                id: `task-${t.id}`,
                label: t.title,
                onSelect: () => dispatch({ type: 'GO_TO_TASK', taskId: t.id }),
              }))
              const items: HeaderBreadcrumb[] = [
                { id: 'root', label: 'Onboarding', onClick: () => navigate('/onboarding') },
                {
                  id: 'journey',
                  label: jn,
                  onClick: goToJourneyStart,
                  isCurrent: !activeActionTitle && !activeTaskTitle,
                },
              ]
              if (activeActionTitle && activeTopLevelTask?.actionId) {
                items.push({
                  id: 'action',
                  label: activeActionTitle,
                  onClick: () => navigateToParentAction(activeTopLevelTask.actionId),
                  isCurrent: !activeTaskTitle,
                  menuItems: actionMenuItems,
                })
              }
              if (activeTaskTitle) items.push({ id: 'task', label: activeTaskTitle, isCurrent: true, menuItems: taskMenuItems })
              return <HeaderBreadcrumbTrail items={items} title={items.map((i) => i.label).join(' / ')} />
            })()}
            actions={actionProgress}
            activeActionId={activeParentActionId}
            onSelectAction={navigateToParentAction}
          />
        )}
        {childBreadcrumbRow}
        {showViewToggle && (
          <header className="border-b border-border px-8 py-2 flex items-center justify-end shrink-0">
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'advisor' })}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  isAdvisorView
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                Advisor
              </button>

              {isKycChild ? (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'aml' })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isAmlView
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    AML Team
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'ho-kyc' })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isHoKycView
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <Building className="h-3.5 w-3.5" />
                    Document Review
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'ho-documents' })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isHoDocView
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <Building className="h-3.5 w-3.5" />
                    Document Review
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_DEMO_VIEW', mode: 'ho-principal' })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isHoPrincipalView
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Principal Review
                  </button>
                </>
              )}
            </div>
          </header>
        )}
      <div className="flex flex-1 overflow-hidden">
          {inChildAction ? (
            isAmlView && isKycChild ? (
              <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  <ChildActionSidebar />
                  <div className="flex flex-1 min-h-0 overflow-hidden min-w-0">
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                      <ChildAmlReviewContent />
                    </div>
                    <ChildActionRightSidebar />
                  </div>
                </div>
                <AmlReviewFooter />
              </div>
            ) : isHoKycView && isKycChild ? (
              <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  <ChildActionSidebar />
                  <div className="flex flex-1 min-h-0 overflow-hidden min-w-0">
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                      <ChildHoKycViewContent />
                    </div>
                    <ChildActionRightSidebar />
                  </div>
                </div>
                <HoKycReviewFooter />
              </div>
            ) : showHomeOfficeAccountLayout ? (
              activeChild?.childType === 'account-opening' ? (
                <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                  <div className="flex flex-1 min-h-0 overflow-hidden">
                    <ChildActionSidebar />
                    <div className="flex flex-1 min-h-0 overflow-hidden min-w-0">
                      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        <ChildActionContent />
                      </div>
                      <ChildActionRightSidebar />
                    </div>
                  </div>
                  <HomeOfficeReviewFooter />
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                  <div className="flex flex-1 min-h-0 overflow-hidden">
                    <ChildActionSidebar />
                    <div className="flex flex-1 min-h-0 overflow-hidden min-w-0">
                      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        {isHoDocView ? <ChildHoDocumentViewContent /> : <ChildHoPrincipalViewContent />}
                      </div>
                      <ChildActionRightSidebar />
                    </div>
                  </div>
                  <HomeOfficeReviewFooter />
                </div>
              )
            ) : (
              <>
                <ChildActionSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ChildActionContent />
                  <ChildActionFooter />
                </div>
                <ChildActionRightSidebar />
              </>
            )
          ) : (
            <>
              <StepSidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <TaskContent />
                <WizardFooter />
              </div>
              <DetailSidebar />
            </>
          )}
      </div>
      </div>
      </WizardRightPanelProvider>
      {composeOpen && <ComposeDialog onClose={() => setComposeOpen(false)} />}
    </div>
  )
}
