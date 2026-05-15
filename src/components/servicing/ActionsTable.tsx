import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import type { Journey, JourneyAction, JourneyStatus } from '@/types/servicing'
import { childStatusConfig, type ChildDisplayStatus } from '@/utils/childStatusDisplay'
import { compactNestedActionLabel, shortActionNicknameForTable } from '@/utils/servicingActionLabel'
import { reviewerQueueLaneForDisplayStatus, type ReviewerQueueLane } from '@/data/servicing-view-presets'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const REVIEW_QUEUE_TYPE_PILL: Record<'KYC' | 'Account', string> = {
  KYC: 'bg-sky-50 text-sky-800 border-sky-200 shadow-none dark:bg-sky-950/45 dark:text-sky-200 dark:border-sky-800',
  Account:
    'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-none dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
}

/** Colored pill for actions “Type” (KYC vs Account). */
export function ReviewQueueTypePill({ type, label }: { type: 'KYC' | 'Account'; label?: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium border-transparent shrink-0', REVIEW_QUEUE_TYPE_PILL[type])}>
      {label ?? type}
    </Badge>
  )
}

function computeStateModelLabel(action: JourneyAction): string {
  const ds = action.displayStatus
  if (ds && ds in childStatusConfig) {
    return childStatusConfig[ds as ChildDisplayStatus].label
  }
  if (action.status === 'awaiting_review') {
    return childStatusConfig.awaiting_review.label
  }
  switch (action.status) {
    case 'in_progress':
      return 'In Progress'
    case 'complete':
      return 'Completed'
    case 'not_started':
      return 'Not Started'
    case 'rejected':
      return 'Rejected'
    case 'cancelled':
      return 'Declined'
    default:
      return String(action.status)
  }
}

export interface ActionRow {
  id: string
  journeyId: string
  title: string
  status: JourneyStatus
  nickname: string | undefined
  parentActionId?: string
  journeyName: string
  relationshipName: string
  assignedTo: string
  complete: number
  total: number
  /** View preset filter: rows in any reviewer pipeline tab. */
  hoReviewQueue: 'yes' | 'no'
  /** Team lane derived from child pipeline status (RBAC/ABAC demo filtering). */
  reviewerQueueLane: ReviewerQueueLane
  /** Nested workflow line (shown under journey in Home Office review view). */
  isChildWorkflow: boolean
  /** Workflow child id for deep links when present. */
  childId?: string
  /** Raw reviewer pipeline status from live journey derivation. */
  displayStatus?: string
  /** Human-readable review pipeline label (Document Review column / filters). */
  stateModelStatus: string
  /** KYC vs account-opening child (Document Review queue); empty for other rows. */
  reviewQueueItemType: '' | 'KYC' | 'Account'
  /** Tab filter bucket for All / In Progress / Completed presets. */
  listTab: ActionListTab
}
const HOME_OFFICE_REVIEW_DISPLAY = new Set<string>([
  'awaiting_review',
  'aml_review',
  'document_review',
  'ho_kyc_review',
  'escalation_hold',
  'principal_review',
  'clarification_required',
  'nigo',
  'nigo_document',
  'nigo_principal',
  'rejected_aml',
])

/** True when this action (or nested child line) belongs in the Document Review tab queue. */
function journeyActionNeedsHomeOfficeReview(action: JourneyAction): boolean {
  if (action.status === 'awaiting_review') return true
  if (action.tasks.some((t) => t.status === 'awaiting_review')) return true
  const ds = action.displayStatus
  if (typeof ds === 'string' && HOME_OFFICE_REVIEW_DISPLAY.has(ds)) return true
  return false
}

/** Child workflow rows in the reviewer pipeline (for Home Office Document Review nested list). */
export function actionRowInHomeOfficeReviewPipeline(row: ActionRow): boolean {
  if (row.status === 'awaiting_review') return true
  const ds = row.displayStatus
  return typeof ds === 'string' && HOME_OFFICE_REVIEW_DISPLAY.has(ds)
}

/** Buckets for Actions list tabs (All / In Progress / Completed). */
export type ActionListTab = 'in_progress' | 'complete' | 'not_started'

/** Maps workflow + pipeline status to a list tab (child `awaiting_review` → in progress). */
export function deriveActionListTab(
  action: Pick<JourneyAction, 'status' | 'displayStatus'>,
): ActionListTab {
  if (action.status === 'complete' || action.displayStatus === 'complete') return 'complete'
  if (action.status === 'not_started') return 'not_started'
  return 'in_progress'
}

/** Document Review row type from servicing / workflow parent ids. */
export function deriveReviewQueueItemType(action: JourneyAction): 'KYC' | 'Account' | '' {
  if (action.groupType === 'funding' || action.groupType === 'feature-service') return 'Account'
  const p = action.parentActionId ?? ''
  if (p.includes('kyc-child-actions')) return 'KYC'
  if (p.includes('account-opening-child')) return 'Account'
  return ''
}

export function deriveActionRows(journeys: Journey[]): ActionRow[] {
  return journeys.flatMap((journey) =>
    journey.actions.map((action) => {
      const complete = action.tasks.filter((t) => t.status === 'complete').length
      return {
        id: action.id,
        journeyId: journey.id,
        title: action.title,
        status: action.status,
        nickname: shortActionNicknameForTable(journey.name, action.nickname, action.title),
        parentActionId: action.parentActionId,
        journeyName: journey.name,
        relationshipName: journey.relationshipName,
        assignedTo: [...new Set(action.tasks.map((t) => t.assignedTo))].join(', '),
        complete,
        total: action.tasks.length,
        hoReviewQueue: journeyActionNeedsHomeOfficeReview(action) ? 'yes' : 'no',
        reviewerQueueLane: reviewerQueueLaneForDisplayStatus(action.displayStatus),
        isChildWorkflow: Boolean(action.parentActionId),
        childId: action.childId,
        displayStatus: action.displayStatus,
        stateModelStatus: computeStateModelLabel(action),
        reviewQueueItemType: deriveReviewQueueItemType(action),
        listTab: deriveActionListTab(action),
      }
    }),
  )
}

import type { OnboardingActionsGroupBy } from './table-controls'

export function buildParentJourneyActionGroups(rows: ActionRow[]): {
  journeyId: string
  journeyName: string
  relationshipName: string
  rows: ActionRow[]
}[] {
  const map = new Map<string, ActionRow[]>()
  for (const r of rows) {
    const list = map.get(r.journeyId) ?? []
    list.push(r)
    map.set(r.journeyId, list)
  }
  return [...map.entries()]
    .map(([journeyId, groupRows]) => ({
      journeyId,
      journeyName: groupRows[0]?.journeyName ?? journeyId,
      relationshipName: groupRows[0]?.relationshipName ?? '',
      rows: groupRows,
    }))
    .sort((a, b) => a.journeyName.localeCompare(b.journeyName))
}

interface ActionsTableProps {
  rows: ActionRow[]
  visibleColumns: string[]
  groupBy?: OnboardingActionsGroupBy
}

export function ActionsTable({ rows, visibleColumns, groupBy = 'none' }: ActionsTableProps) {
  const navigate = useNavigate()

  const comparators = useMemo(
    () => ({
      nickname: compareString<ActionRow>((r) => r.nickname ?? ''),
      title: compareString<ActionRow>((r) => r.title),
      journeyName: compareString<ActionRow>((r) => r.journeyName),
      relationshipName: compareString<ActionRow>((r) => r.relationshipName),
      status: compareStatus<ActionRow>((r) => r.status, journeyStatusOrder),
      stateModelStatus: compareString<ActionRow>((r) => r.stateModelStatus),
      reviewQueueItemType: compareString<ActionRow>((r) => r.reviewQueueItemType),
      reviewerQueueLane: compareString<ActionRow>((r) => r.reviewerQueueLane),
      assignedTo: compareString<ActionRow>((r) => r.assignedTo),
      tasksComplete: compareFraction<ActionRow>(
        (r) => r.complete,
        (r) => r.total,
      ),
    }),
    [],
  )

  const { sortedRows, sortKey, sortDirection, onSort } = useSortableTable(rows, comparators)

  const sorted = (key: string): 'asc' | 'desc' | false =>
    sortKey === key ? (sortDirection as 'asc' | 'desc') : false

  const vis = (key: string) => visibleColumns.includes(key)

  const journeyGroups = useMemo(
    () => (groupBy === 'parentJourneyId' ? buildParentJourneyActionGroups(sortedRows) : []),
    [groupBy, sortedRows],
  )

  const visibleColCount =
    (vis('nickname') ? 1 : 0) +
    (vis('reviewQueueItemType') ? 1 : 0) +
    (vis('title') ? 1 : 0) +
    (vis('journeyName') ? 1 : 0) +
    (vis('relationshipName') ? 1 : 0) +
    (vis('status') ? 1 : 0) +
    (vis('stateModelStatus') ? 1 : 0) +
    (vis('assignedTo') ? 1 : 0) +
    (vis('tasksComplete') ? 1 : 0)

  const renderDataRow = (row: ActionRow) => (
    <DataTableRow
      key={row.id}
      className="cursor-pointer"
      onClick={() =>
        navigate(row.parentActionId ? `/servicing/${row.journeyId}/action/${row.id}` : `/servicing/${row.journeyId}`)
      }
    >
      {vis('nickname') && (
        <DataTableCell type="primary" className="min-w-0 max-w-[12rem] font-medium">
          {row.isChildWorkflow
            ? compactNestedActionLabel({
                journeyName: row.journeyName,
                isChildWorkflow: true,
                preferredLabel: row.nickname ?? row.title,
              })
            : (row.nickname ?? row.title)}
        </DataTableCell>
      )}
      {vis('reviewQueueItemType') && (
        <DataTableCell type="secondary" className="align-middle">
          {row.reviewQueueItemType ? <ReviewQueueTypePill type={row.reviewQueueItemType} /> : '—'}
        </DataTableCell>
      )}
      {vis('title') && <DataTableCell>{row.title}</DataTableCell>}
      {vis('journeyName') && (
        <DataTableCell className="min-w-0">
          <span className="block truncate">{row.journeyName}</span>
        </DataTableCell>
      )}
      {vis('relationshipName') && (
        <DataTableCell className="max-w-[15rem] min-w-0">
          <span className="block truncate" title={row.relationshipName}>
            {row.relationshipName}
          </span>
        </DataTableCell>
      )}
      {vis('status') && (
        <DataTableCell type="badge">
          <StatusBadge status={row.status} />
        </DataTableCell>
      )}
      {vis('stateModelStatus') && <DataTableCell type="secondary">{row.stateModelStatus}</DataTableCell>}
      {vis('assignedTo') && <DataTableCell>{row.assignedTo}</DataTableCell>}
      {vis('tasksComplete') && (
        <DataTableCell align="end" type="secondary">
          {row.complete}/{row.total}
        </DataTableCell>
      )}
    </DataTableRow>
  )

  return (
    <DataTable>
      <thead className="bg-muted/60 border-b border-border [&_th_svg]:hidden">
        <tr>
          {vis('nickname') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('nickname')}
              onSort={() => onSort('nickname')}
              style={{ width: '18%', minWidth: 100, maxWidth: 168 }}
            >
              Action
            </DataTableHeader>
          )}
          {vis('reviewQueueItemType') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('reviewQueueItemType')}
              onSort={() => onSort('reviewQueueItemType')}
              style={{ width: 72 }}
            >
              Type
            </DataTableHeader>
          )}
          {vis('title') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('title')}
              onSort={() => onSort('title')}
              style={{ width: '14%', minWidth: 92, maxWidth: 150 }}
            >
              Action Type
            </DataTableHeader>
          )}
          {vis('journeyName') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('journeyName')}
              onSort={() => onSort('journeyName')}
              className="min-w-0"
              style={{ width: '28%', minWidth: 120 }}
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
          {vis('stateModelStatus') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('stateModelStatus')}
              onSort={() => onSort('stateModelStatus')}
            >
              Status
            </DataTableHeader>
          )}
          {vis('assignedTo') && <DataTableHeader size="comfortable" sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>}
          {vis('tasksComplete') && <DataTableHeader size="comfortable" sortable sorted={sorted('tasksComplete')} onSort={() => onSort('tasksComplete')}>Tasks Complete</DataTableHeader>}
        </tr>
      </thead>
      <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
        {groupBy === 'parentJourneyId'
          ? journeyGroups.flatMap((g) => [
              <DataTableRow
                key={`grp-hdr-${g.journeyId}`}
                className="cursor-pointer bg-muted/35 hover:bg-muted/45"
                border={false}
                onClick={() => navigate(`/servicing/${g.journeyId}`)}
              >
                {vis('journeyName') ? (
                  <>
                    {vis('nickname') && <DataTableCell />}
                    {vis('reviewQueueItemType') && (
                      <DataTableCell type="secondary" className="align-middle">
                        <span className="text-sm text-muted-foreground">—</span>
                      </DataTableCell>
                    )}
                    {vis('title') && <DataTableCell />}
                    <DataTableCell type="primary" className="min-w-0 font-semibold">
                      <span className="truncate">{g.journeyName}</span>
                      <span className="ml-2 font-normal text-muted-foreground tabular-nums">{g.journeyId}</span>
                    </DataTableCell>
                    {vis('relationshipName') && <DataTableCell />}
                    {vis('status') && <DataTableCell />}
                    {vis('stateModelStatus') && <DataTableCell />}
                    {vis('assignedTo') && <DataTableCell />}
                    {vis('tasksComplete') && <DataTableCell />}
                  </>
                ) : (
                  <DataTableCell colSpan={Math.max(1, visibleColCount)} type="primary" className="font-semibold">
                    <span className="truncate">{g.journeyName}</span>
                    <span className="ml-2 font-normal text-muted-foreground tabular-nums">{g.journeyId}</span>
                  </DataTableCell>
                )}
              </DataTableRow>,
              ...g.rows.map((row) => renderDataRow(row)),
            ])
          : sortedRows.map((row) => renderDataRow(row))}
      </tbody>
    </DataTable>
  )
}
