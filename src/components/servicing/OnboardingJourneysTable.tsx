import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Journey } from '@/types/servicing'
import { useJourneyNavigation } from '@/hooks/useJourneyNavigation'
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@/components/ui/data-table'
import { StatusBadge } from './StatusBadge'
import { useSortableTable } from '@/hooks/useSortableTable'
import {
  compareString,
  compareStatus,
  compareFraction,
  journeyStatusOrder,
} from '@/lib/sort-comparators'
import { ChevronRight, ChevronDown, GitBranch, Link2 } from 'lucide-react'
import { childStatusConfig, type ChildDisplayStatus } from '@/utils/childStatusDisplay'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type OnboardingJourneyRow = Journey & { totalTasks: number; progressedTasks: number }

export function deriveOnboardingJourneyRows(journeys: Journey[]): OnboardingJourneyRow[] {
  return journeys
    .filter((journey) => journey.category === 'Onboarding')
    .map((journey) => {
      const totalTasks = journey.actions.reduce((sum, a) => sum + a.tasks.length, 0)
      const progressedTasks = journey.actions.reduce(
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

export function OnboardingJourneysTable({ rows, visibleColumns, showNestedGroups = false }: OnboardingJourneysTableProps) {
  const navigate = useNavigate()
  const { navigateToServicing } = useJourneyNavigation()
  const [expandedJourneyIds, setExpandedJourneyIds] = useState<Set<string>>(new Set())
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set())
  type Row = OnboardingJourneyRow

  const toggleExpanded = (id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
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
          {vis('name') && <DataTableHeader size="comfortable" sortable sorted={sorted('name')} onSort={() => onSort('name')} style={{ width: 200 }} className="[&>button]:pl-9 [&>span]:pl-9">Journey</DataTableHeader>}
          {vis('relationshipName') && <DataTableHeader size="comfortable" sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>}
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
          return [
            /* ── Journey row ─────────────────────────────────── */
            <DataTableRow
              key={row.id}
              className="cursor-pointer hover:bg-muted/50"
              border={false}
            >
              {vis('name') && (
                <DataTableCell type="primary" className="font-semibold">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpanded(row.id, expandedJourneyIds, setExpandedJourneyIds)
                      }}
                      className="p-0 h-5 w-5 flex items-center justify-center hover:bg-muted rounded transition-colors shrink-0"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-muted-foreground shrink-0">
                      <GitBranch className="h-3.5 w-3.5" />
                    </span>
                    <span onClick={() => navigate(`/onboarding/${row.id}`)} className="truncate">
                      {row.name}
                    </span>
                  </div>
                </DataTableCell>
              )}
              {vis('relationshipName') && (
                <DataTableCell onClick={() => navigate(`/onboarding/${row.id}`)}>
                  {row.relationshipName}
                </DataTableCell>
              )}
              {vis('status') && (
                <DataTableCell type="badge" onClick={() => navigate(`/onboarding/${row.id}`)}>
                  <StatusBadge status={row.status} />
                </DataTableCell>
              )}
              {vis('assignedTo') && (
                <DataTableCell onClick={() => navigate(`/onboarding/${row.id}`)}>
                  {row.assignedTo}
                </DataTableCell>
              )}
              {vis('createdAt') && (
                <DataTableCell onClick={() => navigate(`/onboarding/${row.id}`)}>
                  {row.createdAt}
                </DataTableCell>
              )}
              {vis('progress') && (
                <DataTableCell type="secondary" onClick={() => navigate(`/onboarding/${row.id}`)}>
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
              ? row.actions
                  .filter((action) => !action.parentActionId)
                  .flatMap((action) => {
                    const childActions = row.actions.filter((a) => a.parentActionId === action.id)
                    const actionTotal = action.tasks.length
                    const actionDone = action.tasks.filter((t) => t.status !== 'not_started').length
                    const actionPct = actionTotal > 0 ? actionDone / actionTotal : 0
                    return [
                      /* ── Action row ──────────────────────────────── */
                      <DataTableRow
                        key={`${row.id}-action-${action.id}`}
                        className="cursor-pointer hover:bg-muted/50"
                        border={false}
                        onClick={() => navigateToServicing(row, action.id)}
                      >
                        {vis('name') && (
                          <DataTableCell type="primary" className="pl-8 font-medium text-foreground/90">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-muted-foreground shrink-0">
                                <Link2 className="h-3.5 w-3.5" />
                              </span>
                              <span className="truncate">{action.title}</span>
                            </div>
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

                      ...childActions.flatMap((childAction) => {
                        const grandchildActions = row.actions.filter((a) => a.parentActionId === childAction.id && !a.groupType)
                        const groupActions = row.actions.filter((a) => a.parentActionId === childAction.id && a.groupType)
                        if (grandchildActions.length === 0 && groupActions.length === 0) return []
                        return [
                          /* ── Section header ────────────────────────── */
                          <tr
                            key={`${row.id}-section-${childAction.id}`}
                            className=""
                          >
                            <td colSpan={colCount} className="pt-4 pb-2 pl-10 pr-3">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">
                                {childAction.title}
                              </span>
                            </td>
                          </tr>,

                          /* ── Sub-workflow rows (accounts / kyc) ───── */
                          ...grandchildActions.flatMap((gc) => {
                            const cfg = gc.displayStatus
                              ? childStatusConfig[gc.displayStatus as ChildDisplayStatus]
                              : undefined
                            const gcGroups = row.actions.filter((a) => a.parentActionId === gc.id && a.groupType)
                            return [
                              <DataTableRow
                                key={`${row.id}-action-${gc.id}`}
                                className="cursor-pointer hover:bg-muted/50"
                                border={false}
                                onClick={() => navigateToServicing(row, childAction.id, gc.childId)}
                              >
                                {vis('name') && (
                                  <DataTableCell type="primary" className="pl-8 text-foreground/75">
                                    {gc.title}
                                  </DataTableCell>
                                )}
                                {vis('relationshipName') && <DataTableCell />}
                                {vis('status') && (
                                  <DataTableCell type="badge">
                                    {cfg ? (
                                      <Badge variant="outline" className={cn('text-xs font-medium border-transparent', cfg.className)}>
                                        {cfg.label}
                                      </Badge>
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
                                const groupChildren = row.actions.filter((a) => a.parentActionId === group.id)
                                if (groupChildren.length === 0) return []
                                const isGroupExpanded = expandedGroupIds.has(group.id)
                                const groupTotal = groupChildren.reduce((s, a) => s + a.tasks.length, 0)
                                const groupDone = groupChildren.reduce((s, a) => s + a.tasks.filter((t) => t.status !== 'not_started').length, 0)
                                const groupPct = groupTotal > 0 ? groupDone / groupTotal : 0
                                return [
                                  <DataTableRow
                                    key={`${row.id}-group-${group.id}`}
                                    className="cursor-pointer hover:bg-muted/50"
                                    border={false}
                                    onClick={() => toggleExpanded(group.id, expandedGroupIds, setExpandedGroupIds)}
                                  >
                                    {vis('name') && (
                                      <DataTableCell type="primary" className="pl-8 pt-1 text-[13px]">
                                        <div className="flex items-center gap-2 font-medium text-foreground/65">
                                          <span className="h-5 w-5 flex items-center justify-center shrink-0">
                                            {isGroupExpanded
                                              ? <ChevronDown className="h-3.5 w-3.5" />
                                              : <ChevronRight className="h-3.5 w-3.5" />}
                                          </span>
                                          {group.title}
                                        </div>
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
                                        className="cursor-pointer hover:bg-muted/50"
                                        border={false}
                                        onClick={() => navigateToServicing(row, childAction.id, gc2.childId)}
                                      >
                                        {vis('name') && (
                                          <DataTableCell type="primary" className="pl-[60px] text-[13px] text-foreground/65">
                                            {gc2.title}
                                          </DataTableCell>
                                        )}
                                        {vis('relationshipName') && <DataTableCell />}
                                        {vis('status') && (
                                          <DataTableCell type="badge">
                                            {gc2Cfg ? (
                                              <Badge variant="outline" className={cn('text-xs font-medium border-transparent', gc2Cfg.className)}>
                                                {gc2Cfg.label}
                                              </Badge>
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
                            const groupChildren = row.actions.filter((a) => a.parentActionId === group.id)
                            if (groupChildren.length === 0) return []
                            const isGroupExpanded = expandedGroupIds.has(group.id)
                            const groupTotal = groupChildren.reduce((s, a) => s + a.tasks.length, 0)
                            const groupDone = groupChildren.reduce((s, a) => s + a.tasks.filter((t) => t.status !== 'not_started').length, 0)
                            const groupPct = groupTotal > 0 ? groupDone / groupTotal : 0
                            return [
                              <DataTableRow
                                key={`${row.id}-group-${group.id}`}
                                className="cursor-pointer hover:bg-muted/50"
                                border={false}
                                onClick={() => toggleExpanded(group.id, expandedGroupIds, setExpandedGroupIds)}
                              >
                                {vis('name') && (
                                  <DataTableCell type="primary" className="pl-8 pt-1 text-[13px]">
                                    <div className="flex items-center gap-2 font-medium text-foreground/65">
                                      <span className="h-5 w-5 flex items-center justify-center shrink-0">
                                        {isGroupExpanded
                                          ? <ChevronDown className="h-3.5 w-3.5" />
                                          : <ChevronRight className="h-3.5 w-3.5" />}
                                      </span>
                                      {group.title}
                                    </div>
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
                                    className="cursor-pointer hover:bg-muted/50"
                                    border={false}
                                    onClick={() => navigateToServicing(row, childAction.id, gc2.childId)}
                                  >
                                    {vis('name') && (
                                      <DataTableCell type="primary" className="pl-8 text-foreground/75">
                                        {gc2.title}
                                      </DataTableCell>
                                    )}
                                    {vis('relationshipName') && <DataTableCell />}
                                    {vis('status') && (
                                      <DataTableCell type="badge">
                                        {gc2Cfg ? (
                                          <Badge variant="outline" className={cn('text-xs font-medium border-transparent', gc2Cfg.className)}>
                                            {gc2Cfg.label}
                                          </Badge>
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
                    ]
                  })
              : []),
          ]
        })}
      </tbody>
    </DataTable>
  )
}
