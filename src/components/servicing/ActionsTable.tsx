import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServicing } from '@/stores/servicingStore'
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

export function ActionsTable() {
  const { journeys } = useServicing()
  const navigate = useNavigate()

  const rows = journeys.flatMap((journey) =>
    journey.actions.map((action) => {
      const complete = action.tasks.filter((t) => t.status === 'complete').length
      return {
        ...action,
        journeyName: journey.name,
        relationshipName: journey.relationshipName,
        journeyId: journey.id,
        assignedToDisplay: [...new Set(action.tasks.map((t) => t.assignedTo))].join(', '),
        complete,
        total: action.tasks.length,
      }
    }),
  )

  type Row = (typeof rows)[number]

  const comparators = useMemo(
    () => ({
      nickname: compareString<Row>((r) => r.nickname ?? ''),
      title: compareString<Row>((r) => r.title),
      journeyName: compareString<Row>((r) => r.journeyName),
      relationshipName: compareString<Row>((r) => r.relationshipName),
      status: compareStatus<Row>((r) => r.status, journeyStatusOrder),
      assignedTo: compareString<Row>((r) => r.assignedToDisplay),
      tasksComplete: compareFraction<Row>(
        (r) => r.complete,
        (r) => r.total,
      ),
    }),
    [],
  )

  const { sortedRows, sortKey, sortDirection, onSort } = useSortableTable(rows, comparators)

  const sorted = (key: string): 'asc' | 'desc' | false =>
    sortKey === key ? (sortDirection as 'asc' | 'desc') : false

  return (
    <DataTable>
      <thead>
        <tr>
          <DataTableHeader sortable sorted={sorted('nickname')} onSort={() => onSort('nickname')} style={{ width: 250 }}>Action Nickname</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('title')} onSort={() => onSort('title')} style={{ width: 200 }}>Action Type</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('journeyName')} onSort={() => onSort('journeyName')}>Journey</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('tasksComplete')} onSort={() => onSort('tasksComplete')} align="end">Tasks Complete</DataTableHeader>
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <DataTableRow key={row.id} className="cursor-pointer" onClick={() => navigate(row.parentActionId ? `/servicing/${row.journeyId}/action/${row.id}` : `/servicing/${row.journeyId}`)}>
            <DataTableCell type="primary" className="font-medium">{row.nickname}</DataTableCell>
            <DataTableCell>{row.title}</DataTableCell>
            <DataTableCell>{row.journeyName}</DataTableCell>
            <DataTableCell>{row.relationshipName}</DataTableCell>
            <DataTableCell type="badge">
              <StatusBadge status={row.status} />
            </DataTableCell>
            <DataTableCell>{row.assignedToDisplay}</DataTableCell>
            <DataTableCell align="end" type="secondary">
              {row.complete}/{row.total}
            </DataTableCell>
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
