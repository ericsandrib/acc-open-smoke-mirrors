import { useMemo, useState, type ReactNode } from 'react'
import type { Journey } from '@/types/servicing'
import { useJourneyNavigation } from '@/hooks/useJourneyNavigation'
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@/components/ui/data-table'
import { StatusBadge } from './StatusBadge'
import { OperationalStatusPill } from './operationalStatusPill'
import { useSortableTable } from '@/hooks/useSortableTable'
import {
  compareString,
  compareStatus,
  compareFraction,
  journeyStatusOrder,
} from '@/lib/sort-comparators'
import { ChevronRight, ChevronDown, GitBranch, Link2, ShieldCheck, Briefcase } from 'lucide-react'
import { childStatusConfig, type ChildDisplayStatus } from '@/utils/childStatusDisplay'
import { visibleOnboardingJourneyActions } from '@/utils/onboardingJourneyActionTree'
import { cn } from '@/lib/utils'

export type OnboardingJourneyRow = Journey & { totalTasks: number; progressedTasks: number }

const leadingLayoutClass = 'grid grid-cols-[1.25rem_1.25rem_minmax(0,1fr)] items-center gap-2 min-w-0'
const leadingSlotClass = 'flex h-5 w-5 shrink-0 items-center justify-center'
const journeyIconClass = 'h-4 w-4 text-foreground/65'
const rowIconClass = 'h-4 w-4 text-muted-foreground/60'
const journeyRowClass = '[&>td]:h-14 [&>td]:py-0 [&>td]:align-middle'
const actionRowClass = '[&>td]:h-14 [&>td]:py-0 [&>td]:align-middle'
const sectionHeaderRowClass = '[&>td]:h-11 [&>td]:bg-muted/[0.10] [&>td]:py-0 [&>td]:align-middle'
const childRegionRowClass = '[&>td]:h-14 [&>td]:bg-muted/[0.10] [&>td]:py-0 [&>td]:align-middle hover:[&>td]:bg-muted/[0.18]'
const parentActionRowClass = '[&>td]:bg-muted/[0.07] hover:[&>td]:bg-muted/[0.16]'
const journeyExpandButtonClass = 'p-0 h-5 w-5 flex items-center justify-center hover:bg-muted rounded transition-colors shrink-0 text-foreground/70'
const actionExpandButtonClass = 'p-0 h-5 w-5 flex items-center justify-center hover:bg-muted rounded transition-colors shrink-0 text-muted-foreground/55'

function JourneyLeading({
  expand,
  icon,
  children,
  className,
}: {
  expand?: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(leadingLayoutClass, className)}>
      <span className={leadingSlotClass}>{expand}</span>
      <span className={leadingSlotClass}>{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

function childWorkflowIcon(sectionTitle: string) {
  const normalizedTitle = sectionTitle.toLowerCase()

  if (normalizedTitle.includes('kyc')) {
    return <ShieldCheck className={rowIconClass} />
  }

  if (normalizedTitle.includes('account')) {
    return <Briefcase className={rowIconClass} />
  }

  return <Link2 className={rowIconClass} />
}

export function deriveOnboardingJourneyRows(
  journeys: Journey[],
  hideKycChildWorkflows = true,
  hideAccountChildWorkflows = false,
): OnboardingJourneyRow[] {
  return journeys
    .filter((journey) => journey.category === 'Onboarding')
    .map((journey) => {
      const visibleActions = visibleOnboardingJourneyActions(
        journey.actions,
        hideKycChildWorkflows,
        hideAccountChildWorkflows,
      )
      const totalTasks = visibleActions.reduce((sum, a) => sum + a.tasks.length, 0)
      const progressedTasks = visibleActions.reduce(
        (sum, a) => sum + a.tasks.filter((t) => t.status !== 'not_started').length,
        0,
      )
      return { ...journey, totalTasks, progressedTasks }
    })
}

interface OnboardingJourneysTableProps {
  rows: OnboardingJourneyRow[]
  visibleColumns: string[]
  showNestedGroups?: boolean
  /** When true, hide KYC Reviews nested rows (single-flow). */
  hideKyc?: boolean
  /** When true, hide Accounts section and per-account child rows (Journeys tab only). */
  hideAccountChildWorkflows?: boolean
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div className={`h-1 w-16 rounded-full bg-border overflow-hidden ${className ?? ''}`}>
      <div
        className="h-full rounded-full bg-foreground/30 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function OnboardingJourneysTable({
  rows,
  visibleColumns,
  showNestedGroups = false,
  hideKyc = true,
  hideAccountChildWorkflows = false,
}: OnboardingJourneysTableProps) {
  const { navigateToServicing } = useJourneyNavigation()
  const [expandedJourneyIds, setExpandedJourneyIds] = useState<Set<string>>(new Set())
  const [collapsedActionIds, setCollapsedActionIds] = useState<Set<string>>(new Set())
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set())
  type Row = OnboardingJourneyRow

  const toggleExpanded = (id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  const toggleActionCollapsed = (id: string) => {
    toggleExpanded(id, collapsedActionIds, setCollapsedActionIds)
  }

  const comparators = useMemo(
    () => ({
      name: compareString<Row>((r) => r.name),
      relationshipName: compareString<Row>((r) => r.relationshipName),
      status: compareStatus<Row>((r) => r.status, journeyStatusOrder),
      assignedTo: compareString<Row>((r) => r.assignedTo),
      createdAt: compareString<Row>((r) => r.createdAt),
      progress: compareFraction<Row>(
        (r) => r.progressedTasks,
        (r) => r.totalTasks,
      ),
    }),
    [],
  )

  const { sortedRows, sortKey, sortDirection, onSort } = useSortableTable(rows, comparators)

  const sorted = (key: string): 'asc' | 'desc' | false =>
    sortKey === key ? (sortDirection as 'asc' | 'desc') : false
  const vis = (key: string) => visibleColumns.includes(key)
  const colCount = visibleColumns.length

  return (
    <DataTable>
      <thead className="bg-muted/60 border-b border-border [&_th_svg]:hidden">
        <tr>
          {vis('name') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('name')}
              onSort={() => onSort('name')}
              style={{ minWidth: 240 }}
              className="[&>button]:!pl-9 [&>span]:!pl-9"
            >
              Journey
            </DataTableHeader>
          )}
          {vis('relationshipName') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('relationshipName')}
              onSort={() => onSort('relationshipName')}
              style={{ minWidth: 200, maxWidth: 240 }}
            >
              Relationship
            </DataTableHeader>
          )}
          {vis('status') && <DataTableHeader size="comfortable" sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>}
          {vis('assignedTo') && <DataTableHeader size="comfortable" sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>}
          {vis('createdAt') && <DataTableHeader size="comfortable" sortable sorted={sorted('createdAt')} onSort={() => onSort('createdAt')}>Created</DataTableHeader>}
          {vis('progress') && <DataTableHeader size="comfortable" sortable sorted={sorted('progress')} onSort={() => onSort('progress')}>Progress</DataTableHeader>}
        </tr>
      </thead>
      <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
        {sortedRows.flatMap((row) => {
          const isExpanded = expandedJourneyIds.has(row.id)
          const journeyPct = row.totalTasks > 0 ? row.progressedTasks / row.totalTasks : 0
          const actions = visibleOnboardingJourneyActions(
            row.actions,
            hideKyc,
            hideAccountChildWorkflows,
          )
          return [
            /* ── Journey row ─────────────────────────────────── */
            <DataTableRow
              key={row.id}
              className={cn(journeyRowClass, 'cursor-pointer hover:bg-muted/50', isExpanded && '[&>td]:bg-muted/[0.08]')}
              border={false}
            >
              {vis('name') && (
                <DataTableCell type="primary" className="min-w-0 font-bold text-foreground">
                  <JourneyLeading
                    expand={(
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpanded(row.id, expandedJourneyIds, setExpandedJourneyIds)
                        }}
                        className={journeyExpandButtonClass}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4" />
                          : <ChevronRight className="h-4 w-4" />}
                      </button>
                    )}
                    icon={<GitBranch className={journeyIconClass} />}
                  >
                    <span onClick={() => navigateToServicing(row)} className="truncate">
                      {row.name}
                    </span>
                  </JourneyLeading>
                </DataTableCell>
              )}
              {vis('relationshipName') && (
                <DataTableCell className="max-w-[15rem] min-w-0" onClick={() => navigateToServicing(row)}>
                  <span className="block truncate" title={row.relationshipName}>
                    {row.relationshipName}
                  </span>
                </DataTableCell>
              )}
              {vis('status') && (
                <DataTableCell type="badge" onClick={() => navigateToServicing(row)}>
                  <StatusBadge status={row.status} />
                </DataTableCell>
              )}
              {vis('assignedTo') && (
                <DataTableCell onClick={() => navigateToServicing(row)}>
                  {row.assignedTo}
                </DataTableCell>
              )}
              {vis('createdAt') && (
                <DataTableCell onClick={() => navigateToServicing(row)}>
                  {row.createdAt}
                </DataTableCell>
              )}
              {vis('progress') && (
                <DataTableCell type="secondary" onClick={() => navigateToServicing(row)}>
                  <div className="flex items-center justify-start gap-2">
                    <span className="font-medium text-foreground">
                      {row.progressedTasks}/{row.totalTasks}
                    </span>
                    <ProgressBar value={journeyPct} />
                  </div>
                </DataTableCell>
              )}
            </DataTableRow>,

            ...(isExpanded
              ? actions
                  .filter((action) => !action.parentActionId)
                  .flatMap((action) => {
                    const childActions = actions.filter((a) => a.parentActionId === action.id)
                    const actionTotal = action.tasks.length
                    const actionDone = action.tasks.filter((t) => t.status !== 'not_started').length
                    const actionPct = actionTotal > 0 ? actionDone / actionTotal : 0
                    const hasChildRegion = childActions.some((childAction) => {
                        const grandchildActions = actions.filter((a) => a.parentActionId === childAction.id && !a.groupType)
                        const groupActions = actions.filter((a) => a.parentActionId === childAction.id && a.groupType)
                        return grandchildActions.length > 0 || groupActions.length > 0
                      })
                    const isActionExpanded = hasChildRegion && !collapsedActionIds.has(action.id)
                    return [
                      /* ── Action row ──────────────────────────────── */
                      <DataTableRow
                        key={`${row.id}-action-${action.id}`}
                        className={cn(actionRowClass, 'cursor-pointer hover:bg-muted/50', isActionExpanded && parentActionRowClass)}
                        border={false}
                        onClick={() => navigateToServicing(row, action.id)}
                      >
                        {vis('name') && (
                          <DataTableCell type="primary" className="font-medium text-foreground/75">
                            <JourneyLeading
                              expand={hasChildRegion ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleActionCollapsed(action.id)
                                  }}
                                  className={actionExpandButtonClass}
                                  aria-label={isActionExpanded ? `Collapse ${action.title}` : `Expand ${action.title}`}
                                  aria-expanded={isActionExpanded}
                                >
                                  {isActionExpanded
                                    ? <ChevronDown className="h-3.5 w-3.5" />
                                    : <ChevronRight className="h-3.5 w-3.5" />}
                                </button>
                              ) : undefined}
                              icon={<Link2 className={rowIconClass} />}
                            >
                              <span className="truncate">{action.title}</span>
                            </JourneyLeading>
                          </DataTableCell>
                        )}
                        {vis('relationshipName') && <DataTableCell />}
                        {vis('status') && (
                          <DataTableCell type="badge">
                            <StatusBadge status={action.status} />
                          </DataTableCell>
                        )}
                        {vis('assignedTo') && <DataTableCell />}
                        {vis('createdAt') && <DataTableCell />}
                        {vis('progress') && (
                          <DataTableCell type="secondary">
                            <div className="flex items-center justify-start gap-2">
                              <span>{actionDone}/{actionTotal}</span>
                              <ProgressBar value={actionPct} />
                            </div>
                          </DataTableCell>
                        )}
                      </DataTableRow>,

                      ...(isActionExpanded ? [
                        ...childActions.flatMap((childAction) => {
                        const grandchildActions = actions.filter((a) => a.parentActionId === childAction.id && !a.groupType)
                        const groupActions = actions.filter((a) => a.parentActionId === childAction.id && a.groupType)
                        if (grandchildActions.length === 0 && groupActions.length === 0) return []
                        return [
                          /* ── Section header ────────────────────────── */
                          <tr
                            key={`${row.id}-section-${childAction.id}`}
                            className={sectionHeaderRowClass}
                          >
                            <td
                              colSpan={colCount}
                              className="px-1"
                            >
                              <div className="flex h-full items-center px-2">
                                <JourneyLeading>
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground/60">
                                    {childAction.title}
                                  </span>
                                </JourneyLeading>
                              </div>
                            </td>
                          </tr>,

                          /* ── Sub-workflow rows (accounts / kyc) ───── */
                          ...grandchildActions.flatMap((gc) => {
                            const cfg = gc.displayStatus
                              ? childStatusConfig[gc.displayStatus as ChildDisplayStatus]
                              : undefined
                            const gcGroups = actions.filter((a) => a.parentActionId === gc.id && a.groupType)
                            return [
                              <DataTableRow
                                key={`${row.id}-action-${gc.id}`}
                                className={cn('cursor-pointer', childRegionRowClass)}
                                border={false}
                                onClick={() => navigateToServicing(row, childAction.id, gc.childId)}
                              >
                                {vis('name') && (
                                  <DataTableCell type="primary" className="font-medium text-foreground/70">
                                    <JourneyLeading icon={childWorkflowIcon(childAction.title)}>
                                      <span className="truncate">{gc.title}</span>
                                    </JourneyLeading>
                                  </DataTableCell>
                                )}
                                {vis('relationshipName') && <DataTableCell />}
                                {vis('status') && (
                                  <DataTableCell type="badge">
                                    {cfg ? (
                                      <OperationalStatusPill
                                        variant={cfg.pillVariant}
                                        label={cfg.label}
                                        className={cfg.className}
                                        showIcon={Boolean(cfg.pillVariant)}
                                      />
                                    ) : (
                                      <StatusBadge status={gc.status} />
                                    )}
                                  </DataTableCell>
                                )}
                                {vis('assignedTo') && <DataTableCell />}
                                {vis('createdAt') && <DataTableCell />}
                                {vis('progress') && (
                                  <DataTableCell type="secondary">
                                    <div className="flex items-center justify-start gap-2">
                                      <span>{gc.tasks.filter((t) => t.status !== 'not_started').length}/{gc.tasks.length}</span>
                                      <ProgressBar value={gc.tasks.length > 0 ? gc.tasks.filter((t) => t.status !== 'not_started').length / gc.tasks.length : 0} />
                                    </div>
                                  </DataTableCell>
                                )}
                              </DataTableRow>,

                              /* ── Group rows under this account ──────── */
                              ...(showNestedGroups ? gcGroups : []).flatMap((group) => {
                                const groupChildren = actions.filter((a) => a.parentActionId === group.id)
                                if (groupChildren.length === 0) return []
                                const isGroupExpanded = expandedGroupIds.has(group.id)
                                const groupTotal = groupChildren.reduce((s, a) => s + a.tasks.length, 0)
                                const groupDone = groupChildren.reduce((s, a) => s + a.tasks.filter((t) => t.status !== 'not_started').length, 0)
                                const groupPct = groupTotal > 0 ? groupDone / groupTotal : 0
                                return [
                                  <DataTableRow
                                    key={`${row.id}-group-${group.id}`}
                                    className={cn('cursor-pointer', childRegionRowClass)}
                                    border={false}
                                    onClick={() => toggleExpanded(group.id, expandedGroupIds, setExpandedGroupIds)}
                                  >
                                    {vis('name') && (
                                      <DataTableCell type="primary" className="text-[13px]">
                                        <JourneyLeading
                                          expand={isGroupExpanded
                                            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                          className="font-medium text-foreground/65"
                                        >
                                          <span className="truncate">{group.title}</span>
                                        </JourneyLeading>
                                      </DataTableCell>
                                    )}
                                    {vis('relationshipName') && <DataTableCell />}
                                    {vis('status') && <DataTableCell />}
                                    {vis('assignedTo') && <DataTableCell />}
                                    {vis('createdAt') && <DataTableCell />}
                                    {vis('progress') && (
                                      <DataTableCell type="secondary">
                                        <div className="flex items-center justify-start gap-2">
                                          <span>{groupDone}/{groupTotal}</span>
                                          <ProgressBar value={groupPct} />
                                        </div>
                                      </DataTableCell>
                                    )}
                                  </DataTableRow>,

                                  /* ── Expanded group children ──────────── */
                                  ...(isGroupExpanded ? groupChildren.map((gc2) => {
                                    const gc2Cfg = gc2.displayStatus
                                      ? childStatusConfig[gc2.displayStatus as ChildDisplayStatus]
                                      : undefined
                                    return (
                                      <DataTableRow
                                        key={`${row.id}-action-${gc2.id}`}
                                        className={cn('cursor-pointer', childRegionRowClass)}
                                        border={false}
                                        onClick={() => navigateToServicing(row, childAction.id, gc2.childId)}
                                      >
                                        {vis('name') && (
                                          <DataTableCell type="primary" className="text-[13px] text-foreground/65">
                                            <JourneyLeading icon={<Link2 className={rowIconClass} />}>
                                              <span className="truncate">{gc2.title}</span>
                                            </JourneyLeading>
                                          </DataTableCell>
                                        )}
                                        {vis('relationshipName') && <DataTableCell />}
                                        {vis('status') && (
                                          <DataTableCell type="badge">
                                            {gc2Cfg ? (
                                              <OperationalStatusPill
                                                variant={gc2Cfg.pillVariant}
                                                label={gc2Cfg.label}
                                                className={gc2Cfg.className}
                                                showIcon={Boolean(gc2Cfg.pillVariant)}
                                              />
                                            ) : (
                                              <StatusBadge status={gc2.status} />
                                            )}
                                          </DataTableCell>
                                        )}
                                        {vis('assignedTo') && <DataTableCell />}
                                        {vis('createdAt') && <DataTableCell />}
                                        {vis('progress') && (
                                          <DataTableCell type="secondary">
                                            <div className="flex items-center justify-start gap-2">
                                              <span>{gc2.tasks.filter((t) => t.status !== 'not_started').length}/{gc2.tasks.length}</span>
                                              <ProgressBar value={gc2.tasks.length > 0 ? gc2.tasks.filter((t) => t.status !== 'not_started').length / gc2.tasks.length : 0} />
                                            </div>
                                          </DataTableCell>
                                        )}
                                      </DataTableRow>
                                    )
                                  }) : []),
                                ]
                              }),
                            ]
                          }),

                          /* ── Standalone group rows (not under a sub-workflow) */
                          ...(showNestedGroups ? groupActions : []).flatMap((group) => {
                            const groupChildren = actions.filter((a) => a.parentActionId === group.id)
                            if (groupChildren.length === 0) return []
                            const isGroupExpanded = expandedGroupIds.has(group.id)
                            const groupTotal = groupChildren.reduce((s, a) => s + a.tasks.length, 0)
                            const groupDone = groupChildren.reduce((s, a) => s + a.tasks.filter((t) => t.status !== 'not_started').length, 0)
                            const groupPct = groupTotal > 0 ? groupDone / groupTotal : 0
                            return [
                              <DataTableRow
                                key={`${row.id}-group-${group.id}`}
                                className={cn('cursor-pointer', childRegionRowClass)}
                                border={false}
                                onClick={() => toggleExpanded(group.id, expandedGroupIds, setExpandedGroupIds)}
                              >
                                {vis('name') && (
                                  <DataTableCell type="primary" className="text-[13px]">
                                    <JourneyLeading
                                      expand={isGroupExpanded
                                        ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                        : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                      className="font-medium text-foreground/65"
                                    >
                                      <span className="truncate">{group.title}</span>
                                    </JourneyLeading>
                                  </DataTableCell>
                                )}
                                {vis('relationshipName') && <DataTableCell />}
                                {vis('status') && <DataTableCell />}
                                {vis('assignedTo') && <DataTableCell />}
                                {vis('createdAt') && <DataTableCell />}
                                {vis('progress') && (
                                  <DataTableCell type="secondary">
                                    <div className="flex items-center justify-start gap-2">
                                      <span>{groupDone}/{groupTotal}</span>
                                      <ProgressBar value={groupPct} />
                                    </div>
                                  </DataTableCell>
                                )}
                              </DataTableRow>,

                              ...(isGroupExpanded ? groupChildren.map((gc2) => {
                                const gc2Cfg = gc2.displayStatus
                                  ? childStatusConfig[gc2.displayStatus as ChildDisplayStatus]
                                  : undefined
                                return (
                                  <DataTableRow
                                    key={`${row.id}-action-${gc2.id}`}
                                    className={cn('cursor-pointer', childRegionRowClass)}
                                    border={false}
                                    onClick={() => navigateToServicing(row, childAction.id, gc2.childId)}
                                  >
                                    {vis('name') && (
                                      <DataTableCell type="primary" className="font-medium text-foreground/70">
                                        <JourneyLeading icon={childWorkflowIcon(childAction.title)}>
                                          <span className="truncate">{gc2.title}</span>
                                        </JourneyLeading>
                                      </DataTableCell>
                                    )}
                                    {vis('relationshipName') && <DataTableCell />}
                                    {vis('status') && (
                                      <DataTableCell type="badge">
                                        {gc2Cfg ? (
                                          <OperationalStatusPill
                                            variant={gc2Cfg.pillVariant}
                                            label={gc2Cfg.label}
                                            className={gc2Cfg.className}
                                            showIcon={Boolean(gc2Cfg.pillVariant)}
                                          />
                                        ) : (
                                          <StatusBadge status={gc2.status} />
                                        )}
                                      </DataTableCell>
                                    )}
                                    {vis('assignedTo') && <DataTableCell />}
                                    {vis('createdAt') && <DataTableCell />}
                                    {vis('progress') && (
                                      <DataTableCell type="secondary">
                                        <div className="flex items-center justify-start gap-2">
                                          <span>{gc2.tasks.filter((t) => t.status !== 'not_started').length}/{gc2.tasks.length}</span>
                                          <ProgressBar value={gc2.tasks.length > 0 ? gc2.tasks.filter((t) => t.status !== 'not_started').length / gc2.tasks.length : 0} />
                                        </div>
                                      </DataTableCell>
                                    )}
                                  </DataTableRow>
                                )
                              }) : []),
                            ]
                          }),
                        ]
                        }),
                        <tr key={`${row.id}-action-${action.id}-region-end`} aria-hidden>
                          <td colSpan={colCount} className="h-1.5 border-b border-border/40 bg-muted/[0.10] p-0" />
                        </tr>,
                      ] : []),
                    ]
                  })
              : []),
          ]
        })}
      </tbody>
    </DataTable>
  )
}
