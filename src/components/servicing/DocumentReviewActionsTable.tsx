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
import { ChevronRight, ChevronDown, GitBranch, Link2, ShieldCheck, Briefcase } from 'lucide-react'
import { childStatusConfig, type ChildDisplayStatus } from '@/utils/childStatusDisplay'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { type ActionRow, actionRowInHomeOfficeReviewPipeline, ReviewQueueTypePill } from './ActionsTable'
import type { OnboardingActionsGroupBy } from './table-controls'
import { compactNestedActionLabel } from '@/utils/servicingActionLabel'

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

function StateModelCell({ row }: { row: ActionRow }) {
  const ds = row.displayStatus
  const cfg =
    ds && ds in childStatusConfig ? childStatusConfig[ds as ChildDisplayStatus] : undefined
  if (cfg) {
    return (
      <Badge variant="outline" className={cn('text-xs font-medium border-transparent', cfg.className)}>
        {cfg.label}
      </Badge>
    )
  }
  return <span className="text-sm text-foreground/80">{row.stateModelStatus}</span>
}

/** Higher index = lower priority for which statuses to show first when space is limited. */
const STATUS_DISPLAY_PRIORITY: string[] = [
  'rejected_aml',
  'nigo_document',
  'nigo_principal',
  'nigo',
  'escalation_hold',
  'aml_review',
  'document_review',
  'ho_kyc_review',
  'principal_review',
  'awaiting_documents',
  'awaiting_review',
  'draft',
  'canceled',
  'complete',
]

function statusRank(sortKey: string): number {
  const i = STATUS_DISPLAY_PRIORITY.indexOf(sortKey)
  return i === -1 ? 500 : i
}

function rowStatusSignature(row: ActionRow): { sortKey: string; label: string; className: string } | null {
  const ds = row.displayStatus
  if (ds && ds in childStatusConfig) {
    const c = childStatusConfig[ds as ChildDisplayStatus]
    return { sortKey: ds, label: c.label, className: c.className }
  }
  const sm = row.stateModelStatus?.trim()
  if (sm) {
    const queueLike = sm === 'Need Review' || sm === 'In Review'
    return {
      sortKey: `fallback:${sm}`,
      label: queueLike ? 'Need Review' : sm,
      className: queueLike ? childStatusConfig.awaiting_review.className : 'bg-muted/80 text-muted-foreground border-border',
    }
  }
  return null
}

function OverflowCountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <Badge
      variant="outline"
      className="h-5 shrink-0 border-transparent bg-muted/70 px-1.5 py-0 text-[10px] font-semibold text-muted-foreground"
    >
      +{count}
    </Badge>
  )
}

function JourneyTypeSummary({ rows }: { rows: ActionRow[] }) {
  const kyc = rows.filter((r) => r.reviewQueueItemType === 'KYC').length
  const acct = rows.filter((r) => r.reviewQueueItemType === 'Account').length
  if (!kyc && !acct) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  return (
    <div className="flex max-w-[min(100%,240px)] flex-wrap items-center gap-1 min-w-0">
      {kyc > 0 ? (
        <>
          <ReviewQueueTypePill type="KYC" />
          {kyc > 1 ? <OverflowCountBadge count={kyc - 1} /> : null}
        </>
      ) : null}
      {acct === 1 ? <ReviewQueueTypePill type="Account" /> : null}
      {acct === 2 ? <ReviewQueueTypePill type="Account" label="Accounts" /> : null}
      {acct > 2 ? (
        <>
          <ReviewQueueTypePill type="Account" label="Accounts" />
          <OverflowCountBadge count={acct - 2} />
        </>
      ) : null}
    </div>
  )
}

function JourneyReviewStatusSummary({ rows }: { rows: ActionRow[] }) {
  const sigs = rows.map(rowStatusSignature).filter(Boolean) as Array<{ sortKey: string; label: string; className: string }>
  if (sigs.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  const byLabel = new Map<string, { className: string; rank: number }>()
  for (const s of sigs) {
    const r = statusRank(s.sortKey)
    const ex = byLabel.get(s.label)
    if (!ex || r < ex.rank) {
      byLabel.set(s.label, { className: s.className, rank: r })
    }
  }
  const list = [...byLabel.entries()]
    .map(([label, v]) => ({ sortKey: label, label, className: v.className, rank: v.rank }))
    .sort((a, b) => a.rank - b.rank)
  const maxVisible = 2
  const visible = list.slice(0, maxVisible)
  const overflowKinds = list.length - maxVisible
  return (
    <div className="flex max-w-[min(100%,340px)] flex-wrap items-center gap-1 min-w-0">
      {visible.map((s) => (
        <Badge
          key={s.sortKey}
          variant="outline"
          title={s.label}
          className={cn('max-w-[10rem] shrink-0 truncate border-transparent text-xs font-medium', s.className)}
        >
          {s.label}
        </Badge>
      ))}
      {overflowKinds > 0 ? <OverflowCountBadge count={overflowKinds} /> : null}
    </div>
  )
}

interface DocumentReviewActionsTableProps {
  rows: ActionRow[]
  visibleColumns: string[]
  journeys: Journey[]
  /** When omitted (e.g. Servicing), defaults to journey grouping. */
  groupBy?: OnboardingActionsGroupBy
}

type JourneyGroup = { journeyId: string; journeyName: string; relationshipName: string; rows: ActionRow[] }

export function DocumentReviewActionsTable({ rows, visibleColumns, journeys, groupBy }: DocumentReviewActionsTableProps) {
  const { navigateToServicing } = useJourneyNavigation()
  const navigate = useNavigate()
  const [expandedJourneyIds, setExpandedJourneyIds] = useState<Set<string>>(new Set())

  const layoutGroupBy = groupBy ?? 'parentJourneyId'

  const nestRows = useMemo(() => {
    const pipelineChildren = rows.filter((r) => r.isChildWorkflow && actionRowInHomeOfficeReviewPipeline(r))
    if (pipelineChildren.length > 0) return pipelineChildren
    const anyChildren = rows.filter((r) => r.isChildWorkflow)
    if (anyChildren.length > 0) return anyChildren
    return rows
  }, [rows])

  const groups = useMemo((): JourneyGroup[] => {
    const map = new Map<string, ActionRow[]>()
    for (const r of nestRows) {
      const list = map.get(r.journeyId) ?? []
      list.push(r)
      map.set(r.journeyId, list)
    }
    return [...map.entries()]
      .map(([journeyId, groupRows]) => ({
        journeyId,
        journeyName: groupRows[0]?.journeyName ?? journeyId,
        relationshipName: groupRows[0]?.relationshipName ?? '',
        rows: [...groupRows].sort((a, b) =>
          workflowLabel(a, visibleColumns).localeCompare(workflowLabel(b, visibleColumns)),
        ),
      }))
      .sort((a, b) => a.journeyName.localeCompare(b.journeyName))
  }, [nestRows, visibleColumns])

  const journeyStubs = useMemo(() => {
    const m = new Map<string, Journey>()
    for (const j of journeys) m.set(j.id, j)
    return m
  }, [journeys])

  const toggleJourney = (id: string) => {
    setExpandedJourneyIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
      if (row.childId && row.parentActionId) {
        navigateToServicing(journey, row.parentActionId, row.childId)
        return
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
              style={{ minWidth: 240 }}
              className={
                layoutGroupBy !== 'none' ? '[&>button]:pl-[64px] [&>span]:pl-[64px]' : undefined
              }
            >
              Journey / workflow
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
            <DataTableHeader size="comfortable">Review Status</DataTableHeader>
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
                    <JourneyLeading icon={childWorkflowIconFromRow(row)}>
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
                    <StateModelCell row={row} />
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
                    <DataTableCell className="align-middle">
                      <JourneyTypeSummary rows={group.rows} />
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
                    <DataTableCell className="align-middle">
                      <JourneyReviewStatusSummary rows={group.rows} />
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
                  ? group.rows.map((row) => (
                      <DataTableRow
                        key={`${group.journeyId}-${row.id}`}
                        className={cn('cursor-pointer', childRegionRowClass)}
                        border={false}
                        onClick={() => handleChildClick(row)}
                      >
                        {(vis('nickname') || vis('title') || vis('journeyName')) && (
                          <DataTableCell type="primary" className="font-medium text-foreground/70">
                            <JourneyLeading icon={childWorkflowIconFromRow(row)}>
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
                            <StateModelCell row={row} />
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
                  : []),
              ]
            })}
      </tbody>
    </DataTable>
  )
}
