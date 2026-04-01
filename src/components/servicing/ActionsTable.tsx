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
import type { Journey, JourneyStatus } from '@/types/servicing'

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
        nickname: action.nickname,
        parentActionId: action.parentActionId,
        journeyName: journey.name,
        relationshipName: journey.relationshipName,
        assignedTo: [...new Set(action.tasks.map((t) => t.assignedTo))].join(', '),
        complete,
        total: action.tasks.length,
      }
    }),
  )
}

interface ActionsTableProps {
  rows: ActionRow[]
  visibleColumns: string[]
}

export function ActionsTable({ rows, visibleColumns }: ActionsTableProps) {
  const navigate = useNavigate()

  const comparators = useMemo(
    () => ({
      nickname: compareString<ActionRow>((r) => r.nickname ?? ''),
      title: compareString<ActionRow>((r) => r.title),
      journeyName: compareString<ActionRow>((r) => r.journeyName),
      relationshipName: compareString<ActionRow>((r) => r.relationshipName),
      status: compareStatus<ActionRow>((r) => r.status, journeyStatusOrder),
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

  return (
    <DataTable>
      <thead>
        <tr>
          {vis('nickname') && <DataTableHeader sortable sorted={sorted('nickname')} onSort={() => onSort('nickname')} style={{ width: 250 }}>Action Nickname</DataTableHeader>}
          {vis('title') && <DataTableHeader sortable sorted={sorted('title')} onSort={() => onSort('title')} style={{ width: 200 }}>Action Type</DataTableHeader>}
          {vis('journeyName') && <DataTableHeader sortable sorted={sorted('journeyName')} onSort={() => onSort('journeyName')}>Journey</DataTableHeader>}
          {vis('relationshipName') && <DataTableHeader sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>}
          {vis('status') && <DataTableHeader sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>}
          {vis('assignedTo') && <DataTableHeader sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>}
          {vis('tasksComplete') && <DataTableHeader sortable sorted={sorted('tasksComplete')} onSort={() => onSort('tasksComplete')} align="end">Tasks Complete</DataTableHeader>}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <DataTableRow key={row.id} className="cursor-pointer" onClick={() => navigate(row.parentActionId ? `/servicing/${row.journeyId}/action/${row.id}` : `/servicing/${row.journeyId}`)}>
            {vis('nickname') && <DataTableCell type="primary" className="font-medium">{row.nickname}</DataTableCell>}
            {vis('title') && <DataTableCell>{row.title}</DataTableCell>}
            {vis('journeyName') && <DataTableCell>{row.journeyName}</DataTableCell>}
            {vis('relationshipName') && <DataTableCell>{row.relationshipName}</DataTableCell>}
            {vis('status') && <DataTableCell type="badge"><StatusBadge status={row.status} /></DataTableCell>}
            {vis('assignedTo') && <DataTableCell>{row.assignedTo}</DataTableCell>}
            {vis('tasksComplete') && <DataTableCell align="end" type="secondary">{row.complete}/{row.total}</DataTableCell>}
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
