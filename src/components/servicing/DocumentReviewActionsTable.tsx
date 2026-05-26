import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Journey } from '@/types/servicing'
import { useJourneyNavigation } from '@/hooks/useJourneyNavigation'
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@/components/ui/data-table'
import { useSortableTable } from '@/hooks/useSortableTable'
import { compareString } from '@/lib/sort-comparators'
import { ChevronRight, ChevronDown, GitBranch, Link2, ShieldCheck, Briefcase, ArrowDownToLine, Layers } from 'lucide-react'
import { childStatusConfig, type ChildDisplayStatus } from '@/utils/childStatusDisplay'
import {
  deriveParentOperationalSummary,
  formatWorkflowBreakdownLine,
} from '@/utils/workflowSummary'
import {
  deriveOnboardingParentOperationalSummary,
  formatOnboardingWorkflowBreakdownLine,
  getOnboardingActionStatusDisplay,
} from '@/utils/onboardingActionStatus'
import { OperationalStatusPill } from './operationalStatusPill'
import { cn } from '@/lib/utils'
import {
  type ActionRow,
  actionRowInHomeOfficeReviewPipeline,
  deriveActionRows,
  isActionGroupRow,
  isChildUnderActionGroup,
  resolveAccountSectionActionIdForNavigation,
  ReviewQueueTypePill,
} from './ActionsTable'
import type { OnboardingActionsGroupBy } from './table-controls'
import { compactNestedActionLabel } from '@/utils/servicingActionLabel'
import { sortJourneyGroupsByCreated } from '@/utils/journeyGroupSort'

/** Open Accounts section shells (“KYC Reviews”, “Accounts”) nest under the parent but are not child workflows — they have no `childId`. */
function isLeafChildWorkflowRow(row: ActionRow): boolean {
  return row.isChildWorkflow && Boolean(row.childId)
}

const leadingLayoutClass = 'grid grid-cols-[1.25rem_1.25rem_minmax(0,1fr)] items-center gap-2 min-w-0'
const leadingSlotClass = 'flex h-5 w-5 shrink-0 items-center justify-center'
const journeyIconClass = 'h-4 w-4 text-foreground/65'
const rowIconClass = 'h-4 w-4 text-muted-foreground/60'
const journeyRowClass = '[&>td]:h-14 [&>td]:py-0 [&>td]:align-middle'
const childRegionRowClass = '[&>td]:h-14 [&>td]:bg-muted/[0.10] [&>td]:py-0 [&>td]:align-middle hover:[&>td]:bg-muted/[0.18]'
const journeyExpandButtonClass =
  'p-0 h-5 w-5 flex items-center justify-center hover:bg-muted rounded transition-colors shrink-0 text-foreground/70'

function JourneyLeading({
  expand,
  icon,
  children,
  className,
  /**
   * Flat list (no “Group by journey”): no expand chevron column — avoids an empty 1.25rem track that
   * pushed labels past the “Journey” header. Nested journey rows keep the 3-column grid.
   */
  flat = false,
}: {
  expand?: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
  flat?: boolean
}) {
  if (flat) {
    return (
      <div className={cn('flex min-w-0 items-center gap-2', className)}>
        {icon ? <span className={leadingSlotClass}>{icon}</span> : null}
        <span className="min-w-0 flex-1 truncate">{children}</span>
      </div>
    )
  }
  return (
    <div className={cn(leadingLayoutClass, className)}>
      <span className={leadingSlotClass}>{expand}</span>
      <span className={leadingSlotClass}>{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

function childWorkflowIconFromTitle(title: string) {
  const t = title.toLowerCase()
  if (t.includes('kyc')) return <ShieldCheck className={rowIconClass} />
  if (t.includes('account')) return <Briefcase className={rowIconClass} />
  return <Link2 className={rowIconClass} />
}

function childWorkflowIconFromRow(row: ActionRow) {
  if (row.reviewQueueItemType === 'KYC') return <ShieldCheck className={rowIconClass} />
  if (row.reviewQueueItemType === 'Account') return <Briefcase className={rowIconClass} />
  return childWorkflowIconFromTitle(row.title)
}

function workflowLabel(row: ActionRow, visibleColumns: string[]) {
  const raw =
    (visibleColumns.includes('nickname') && row.nickname)
      ? row.nickname
      : visibleColumns.includes('title')
        ? row.title
        : (row.nickname ?? row.title)

  if (!row.isChildWorkflow) return raw
  return compactNestedActionLabel({
    journeyName: row.journeyName,
    isChildWorkflow: true,
    preferredLabel: raw,
  })
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

function ReviewStatusBadge({
  label,
  className,
  title,
  variant = 'default',
  pillVariant,
}: {
  label: string
  className: string
  title?: string
  variant?: 'default' | 'detail'
  pillVariant?: 'draft' | 'completed' | 'declined'
}) {
  return (
    <OperationalStatusPill
      title={title}
      variant={pillVariant}
      label={label}
      className={cn(variant === 'detail' && 'opacity-[0.88] ring-1 ring-border/40', className)}
      showIcon={false}
    />
  )
}

function StateModelCell({
  row,
  variant = 'default',
  statusMode = 'default',
}: {
  row: ActionRow
  variant?: 'default' | 'detail'
  statusMode?: 'default' | 'onboarding'
}) {
  if (statusMode === 'onboarding') {
    const onboardingDisplay = getOnboardingActionStatusDisplay(
      row.displayStatus,
      row.stateModelStatus,
    )
    return (
      <ReviewStatusBadge
        label={onboardingDisplay.label}
        className={onboardingDisplay.className}
        variant={variant}
        pillVariant={onboardingDisplay.pillVariant}
      />
    )
  }
  const ds = row.displayStatus
  const cfg =
    ds && ds in childStatusConfig ? childStatusConfig[ds as ChildDisplayStatus] : undefined
  if (cfg) {
    return (
      <ReviewStatusBadge
        label={cfg.label}
        className={cfg.className}
        variant={variant}
        pillVariant={cfg.pillVariant}
      />
    )
  }
  return (
    <span className={cn('text-sm text-foreground/80', variant === 'detail' && 'text-muted-foreground')}>
      {row.stateModelStatus}
    </span>
  )
}

function ParentOperationalStatusBadge({
  allChildRows,
  statusMode = 'default',
}: {
  allChildRows: ActionRow[]
  statusMode?: 'default' | 'onboarding'
}) {
  if (allChildRows.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  const summary =
    statusMode === 'onboarding'
      ? deriveOnboardingParentOperationalSummary(allChildRows)
      : deriveParentOperationalSummary(allChildRows)
  if (!summary) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  const breakdownLine =
    statusMode === 'onboarding'
      ? formatOnboardingWorkflowBreakdownLine(allChildRows)
      : formatWorkflowBreakdownLine(allChildRows)
  const title = breakdownLine ? `${summary.label} · ${breakdownLine}` : summary.label
  return (
    <ReviewStatusBadge
      label={summary.label}
      className={summary.className}
      title={title}
      pillVariant={summary.pillVariant}
    />
  )
}

interface DocumentReviewActionsTableProps {
  rows: ActionRow[]
  visibleColumns: string[]
  journeys: Journey[]
  statusMode?: 'default' | 'onboarding'
  /** When omitted (e.g. Servicing), defaults to journey grouping. */
  groupBy?: OnboardingActionsGroupBy
  /**
   * How to pick rows under each journey.
   * - `pipeline` (default): reviewer-pipeline child lines when any exist, else any children, else all rows.
   * - `allChildWorkflows`: every nested child line regardless of review status (advisor “all statuses”).
   */
  nestRowMode?: 'pipeline' | 'allChildWorkflows'
  /** When true, funding / feature-service lines nest under their group headers (Onboarding Journeys parity). */
  showNestedFundingGroups?: boolean
  /** When true, omit separate KYC child workflows from journey breakdown rows. */
  hideKycChildWorkflows?: boolean
  /** Pin this journey’s group to the top (matches Journeys tab). */
  pinJourneyId?: string
}

type JourneyGroup = {
  journeyId: string
  journeyName: string
  relationshipName: string
  createdAt: string
  rows: ActionRow[]
}

type NestedDisplayRow =
  | { kind: 'workflow'; row: ActionRow; depth: number }
  | { kind: 'group'; row: ActionRow; depth: number }
  | { kind: 'groupChild'; row: ActionRow; depth: number }

function buildNestedDisplayRows(
  journeyRows: ActionRow[],
  allRows: ActionRow[],
  expandedGroupIds: Set<string>,
): NestedDisplayRow[] {
  const topLevel = journeyRows.filter((r) => !isChildUnderActionGroup(r, allRows))
  const out: NestedDisplayRow[] = []

  for (const workflowRow of topLevel) {
    out.push({ kind: 'workflow', row: workflowRow, depth: 1 })

    if (workflowRow.reviewQueueItemType !== 'Account') continue

    const groups = allRows
      .filter(
        (r) =>
          r.journeyId === workflowRow.journeyId &&
          r.parentActionId === workflowRow.id &&
          isActionGroupRow(r),
      )
      .sort((a, b) => a.title.localeCompare(b.title))

    for (const group of groups) {
      const groupChildren = allRows
        .filter((r) => r.parentActionId === group.id && r.childId)
        .sort((a, b) => a.title.localeCompare(b.title))
      if (groupChildren.length === 0) continue

      out.push({ kind: 'group', row: group, depth: 2 })
      if (expandedGroupIds.has(group.id)) {
        for (const child of groupChildren) {
          out.push({ kind: 'groupChild', row: child, depth: 3 })
        }
      }
    }
  }

  return out
}

export function DocumentReviewActionsTable({
  rows,
  visibleColumns,
  journeys,
  statusMode = 'default',
  groupBy,
  nestRowMode = 'pipeline',
  showNestedFundingGroups = false,
  hideKycChildWorkflows = false,
  pinJourneyId,
}: DocumentReviewActionsTableProps) {
  const { navigateToServicing } = useJourneyNavigation()
  const navigate = useNavigate()
  const [expandedJourneyIds, setExpandedJourneyIds] = useState<Set<string>>(new Set())
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set())

  const layoutGroupBy = groupBy ?? 'parentJourneyId'

  const nestRows = useMemo(() => {
    let base: ActionRow[]
    if (nestRowMode === 'allChildWorkflows') {
      const children = rows.filter(isLeafChildWorkflowRow)
      base = children.length > 0 ? children : rows
    } else {
      const pipelineChildren = rows.filter(
        (r) => isLeafChildWorkflowRow(r) && actionRowInHomeOfficeReviewPipeline(r),
      )
      if (pipelineChildren.length > 0) base = pipelineChildren
      else {
        const anyChildren = rows.filter(isLeafChildWorkflowRow)
        base = anyChildren.length > 0 ? anyChildren : rows
      }
    }
    if (showNestedFundingGroups) {
      return base.filter((r) => !isChildUnderActionGroup(r, rows))
    }
    return base
  }, [rows, nestRowMode, showNestedFundingGroups])

  const groups = useMemo((): JourneyGroup[] => {
    const map = new Map<string, ActionRow[]>()
    for (const r of nestRows) {
      const list = map.get(r.journeyId) ?? []
      list.push(r)
      map.set(r.journeyId, list)
    }
    const built = [...map.entries()].map(([journeyId, groupRows]) => ({
      journeyId,
      journeyName: groupRows[0]?.journeyName ?? journeyId,
      relationshipName: groupRows[0]?.relationshipName ?? '',
      createdAt: groupRows[0]?.createdAt ?? '',
      rows: [...groupRows].sort((a, b) =>
        workflowLabel(a, visibleColumns).localeCompare(workflowLabel(b, visibleColumns)),
      ),
    }))
    return sortJourneyGroupsByCreated(built, pinJourneyId)
  }, [nestRows, visibleColumns, pinJourneyId])

  const journeyStubs = useMemo(() => {
    const m = new Map<string, Journey>()
    for (const j of journeys) m.set(j.id, j)
    return m
  }, [journeys])

  /** All leaf child workflows per journey — used for parent Status + expanded breakdown (filter-independent). */
  const allChildRowsByJourneyId = useMemo(() => {
    const map = new Map<string, ActionRow[]>()
    for (const journey of journeys) {
      const children = deriveActionRows([journey], hideKycChildWorkflows).filter(isLeafChildWorkflowRow)
      if (children.length > 0) map.set(journey.id, children)
    }
    return map
  }, [journeys, hideKycChildWorkflows])

  const toggleJourney = (id: string) => {
    setExpandedJourneyIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleGroup = (id: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const nestedIndentClass = (depth: number) => {
    if (depth <= 1) return undefined
    if (depth === 2) return 'pl-7'
    return 'pl-14'
  }

  const groupIcon = (groupType: ActionRow['groupType']) => {
    if (groupType === 'funding') return <ArrowDownToLine className={rowIconClass} />
    if (groupType === 'feature-service') return <Layers className={rowIconClass} />
    return <Link2 className={rowIconClass} />
  }

  const vis = (key: string) => key !== 'status' && visibleColumns.includes(key)

  const comparators = useMemo(
    () => ({
      journeyName: compareString<JourneyGroup>((g) => g.journeyName),
    }),
    [],
  )

  const { sortedRows: sortedGroups, sortKey, sortDirection, onSort } = useSortableTable(groups, comparators)
  const sorted = (key: string): 'asc' | 'desc' | false =>
    sortKey === key ? (sortDirection as 'asc' | 'desc') : false

  const handleChildClick = (row: ActionRow) => {
    const journey = journeyStubs.get(row.journeyId)
    if (journey) {
      if (row.childId) {
        const sectionActionId = resolveAccountSectionActionIdForNavigation(row, rows) ?? row.parentActionId
        if (sectionActionId) {
          navigateToServicing(journey, sectionActionId, row.childId)
          return
        }
      }
      if (row.parentActionId) {
        navigateToServicing(journey, row.parentActionId)
        return
      }
      navigateToServicing(journey)
      return
    }
    navigate(`/servicing/${row.journeyId}`)
  }

  const renderNestedChildRow = (display: NestedDisplayRow) => {
    const { row, depth, kind } = display
    const isGroup = kind === 'group'
    const isGroupExpanded = expandedGroupIds.has(row.id)

    return (
      <DataTableRow
        key={`${row.journeyId}-${kind}-${row.id}`}
        className={cn('cursor-pointer', childRegionRowClass)}
        border={false}
        onClick={() => {
          if (isGroup) {
            toggleGroup(row.id)
            return
          }
          handleChildClick(row)
        }}
      >
        {(vis('nickname') || vis('title') || vis('journeyName')) && (
          <DataTableCell
            type="primary"
            className={cn(
              'font-medium text-foreground/70',
              kind === 'group' && 'text-[13px] text-foreground/65',
              kind === 'groupChild' && 'text-[13px] text-foreground/65',
            )}
          >
            <JourneyLeading
              className={nestedIndentClass(depth)}
              expand={
                isGroup ? (
                  isGroupExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )
                ) : undefined
              }
              icon={
                isGroup
                  ? groupIcon(row.groupType)
                  : childWorkflowIconFromRow(row)
              }
            >
              <span className="truncate">{workflowLabel(row, visibleColumns)}</span>
            </JourneyLeading>
          </DataTableCell>
        )}
        {vis('reviewQueueItemType') && (
          <DataTableCell type="secondary" className="align-middle">
            {row.reviewQueueItemType ? <ReviewQueueTypePill type={row.reviewQueueItemType} /> : '—'}
          </DataTableCell>
        )}
        {vis('relationshipName') && <DataTableCell />}
        {vis('stateModelStatus') && (
          <DataTableCell type="badge">
            {isGroup ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <StateModelCell
                row={row}
                variant={statusMode === 'onboarding' ? 'default' : 'detail'}
                statusMode={statusMode}
              />
            )}
          </DataTableCell>
        )}
        {vis('assignedTo') && <DataTableCell>{isGroup ? '' : row.assignedTo}</DataTableCell>}
        {vis('tasksComplete') && (
          <DataTableCell type="secondary">
            {isGroup ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <div className="flex items-center justify-start gap-2">
                <span>
                  {row.complete}/{row.total}
                </span>
                <ProgressBar value={row.total > 0 ? row.complete / row.total : 0} />
              </div>
            )}
          </DataTableCell>
        )}
      </DataTableRow>
    )
  }

  return (
    <DataTable>
      <thead className="bg-muted/60 border-b border-border [&_th_svg]:hidden">
        <tr>
          {(vis('nickname') || vis('title') || vis('journeyName')) && (
            <DataTableHeader
              size="comfortable"
              sortable={layoutGroupBy !== 'none'}
              sorted={layoutGroupBy !== 'none' ? sorted('journeyName') : false}
              onSort={layoutGroupBy !== 'none' ? () => onSort('journeyName') : undefined}
              className={
                layoutGroupBy !== 'none'
                  ? 'min-w-0 [&>button]:!pl-9 [&>span]:!pl-9'
                  : 'min-w-0'
              }
              style={{ minWidth: 156 }}
            >
              {layoutGroupBy === 'none' ? 'Action' : 'Journey'}
            </DataTableHeader>
          )}
          {vis('reviewQueueItemType') && (
            <DataTableHeader size="comfortable" style={{ width: 88 }}>
              Type
            </DataTableHeader>
          )}
          {vis('relationshipName') && (
            <DataTableHeader size="comfortable" style={{ minWidth: 200, maxWidth: 240 }}>
              Relationship
            </DataTableHeader>
          )}
          {vis('stateModelStatus') && (
            <DataTableHeader size="comfortable">Status</DataTableHeader>
          )}
          {vis('assignedTo') && (
            <DataTableHeader size="comfortable">Assigned To</DataTableHeader>
          )}
          {vis('tasksComplete') && (
            <DataTableHeader size="comfortable">Tasks complete</DataTableHeader>
          )}
        </tr>
      </thead>
      <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
        {layoutGroupBy === 'none'
          ? nestRows.map((row) => (
              <DataTableRow
                key={row.id}
                className={cn('cursor-pointer', childRegionRowClass)}
                border={false}
                onClick={() => handleChildClick(row)}
              >
                {(vis('nickname') || vis('title') || vis('journeyName')) && (
                  <DataTableCell type="primary" className="font-medium text-foreground/70">
                    <JourneyLeading flat icon={childWorkflowIconFromRow(row)}>
                      <span className="truncate">{workflowLabel(row, visibleColumns)}</span>
                    </JourneyLeading>
                  </DataTableCell>
                )}
                {vis('reviewQueueItemType') && (
                  <DataTableCell type="secondary" className="align-middle">
                    {row.reviewQueueItemType ? <ReviewQueueTypePill type={row.reviewQueueItemType} /> : '—'}
                  </DataTableCell>
                )}
                {vis('relationshipName') && (
                  <DataTableCell className="max-w-[15rem] min-w-0">
                    <span className="block truncate" title={row.relationshipName}>
                      {row.relationshipName}
                    </span>
                  </DataTableCell>
                )}
                {vis('stateModelStatus') && (
                  <DataTableCell type="badge">
                    <StateModelCell
                      row={row}
                      variant={statusMode === 'onboarding' ? 'default' : 'detail'}
                      statusMode={statusMode}
                    />
                  </DataTableCell>
                )}
                {vis('assignedTo') && <DataTableCell>{row.assignedTo}</DataTableCell>}
                {vis('tasksComplete') && (
                  <DataTableCell type="secondary">
                    <div className="flex items-center justify-start gap-2">
                      <span>
                        {row.complete}/{row.total}
                      </span>
                      <ProgressBar value={row.total > 0 ? row.complete / row.total : 0} />
                    </div>
                  </DataTableCell>
                )}
              </DataTableRow>
            ))
          : sortedGroups.flatMap((group) => {
              const isExpanded = expandedJourneyIds.has(group.journeyId)
              const journey = journeyStubs.get(group.journeyId)
              const openJourney = () => {
                if (journey) navigateToServicing(journey)
                else navigate(`/servicing/${group.journeyId}`)
              }
              const totalTasks = group.rows.reduce((s, r) => s + r.total, 0)
              const doneTasks = group.rows.reduce((s, r) => s + r.complete, 0)
              const journeyPct = totalTasks > 0 ? doneTasks / totalTasks : 0
              const allChildRows = allChildRowsByJourneyId.get(group.journeyId) ?? []

              return [
                <DataTableRow
                  key={`${group.journeyId}-hdr`}
                  className={cn(
                    journeyRowClass,
                    'cursor-pointer hover:bg-muted/50',
                    isExpanded && '[&>td]:bg-muted/[0.08]',
                  )}
                  border={false}
                  onClick={() => openJourney()}
                >
                  {(vis('nickname') || vis('title') || vis('journeyName')) && (
                    <DataTableCell type="primary" className="font-bold text-foreground">
                      <JourneyLeading
                        expand={(
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleJourney(group.journeyId)
                            }}
                            className={journeyExpandButtonClass}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        )}
                        icon={<GitBranch className={journeyIconClass} />}
                      >
                        <span className="truncate">{group.journeyName}</span>
                      </JourneyLeading>
                    </DataTableCell>
                  )}
                  {vis('reviewQueueItemType') && (
                    <DataTableCell type="secondary" className="align-middle">
                      <span className="text-sm text-muted-foreground">—</span>
                    </DataTableCell>
                  )}
                  {vis('relationshipName') && (
                    <DataTableCell className="max-w-[15rem] min-w-0">
                      <span className="block truncate" title={group.relationshipName}>
                        {group.relationshipName}
                      </span>
                    </DataTableCell>
                  )}
                  {vis('stateModelStatus') && (
                    <DataTableCell type="badge" className="align-middle">
                      <ParentOperationalStatusBadge
                        allChildRows={allChildRows}
                        statusMode={statusMode}
                      />
                    </DataTableCell>
                  )}
                  {vis('assignedTo') && (
                    <DataTableCell>
                      {journey?.assignedTo ?? group.rows[0]?.assignedTo ?? ''}
                    </DataTableCell>
                  )}
                  {vis('tasksComplete') && (
                    <DataTableCell type="secondary">
                      <div className="flex items-center justify-start gap-2">
                        <span className="font-medium text-foreground">
                          {doneTasks}/{totalTasks}
                        </span>
                        <ProgressBar value={journeyPct} />
                      </div>
                    </DataTableCell>
                  )}
                </DataTableRow>,
                ...(isExpanded
                  ? (showNestedFundingGroups
                      ? buildNestedDisplayRows(group.rows, rows, expandedGroupIds).map((display) =>
                          renderNestedChildRow(display),
                        )
                      : group.rows.map((row) => renderNestedChildRow({ kind: 'workflow', row, depth: 1 })))
                  : []),
              ]
            })}
      </tbody>
    </DataTable>
  )
}
