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
  taskStatusOrder,
} from '@/lib/sort-comparators'

import type { JourneyCategory } from '@/types/servicing'

export function TasksTable({ filterCategory }: { filterCategory?: JourneyCategory }) {
  const { journeys } = useServicing()
  const navigate = useNavigate()

  const filtered = filterCategory ? journeys.filter((j) => j.category === filterCategory) : journeys
  const rows = filtered.flatMap((journey) =>
    journey.actions.flatMap((action) =>
      action.tasks.map((task) => ({
        ...task,
        actionTitle: action.title,
        journeyName: journey.name,
        relationshipName: journey.relationshipName,
      })),
    ),
  )

  type Row = (typeof rows)[number]

  const comparators = useMemo(
    () => ({
      title: compareString<Row>((r) => r.title),
      nickname: compareString<Row>((r) => r.nickname ?? ''),
      actionTitle: compareString<Row>((r) => r.actionTitle),
      journeyName: compareString<Row>((r) => r.journeyName),
      relationshipName: compareString<Row>((r) => r.relationshipName),
      status: compareStatus<Row>((r) => r.status, taskStatusOrder),
      assignedTo: compareString<Row>((r) => r.assignedTo),
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
          <DataTableHeader sortable sorted={sorted('title')} onSort={() => onSort('title')} style={{ width: 200 }}>Task</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('nickname')} onSort={() => onSort('nickname')}>Action Nickname</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('actionTitle')} onSort={() => onSort('actionTitle')}>Action Type</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('journeyName')} onSort={() => onSort('journeyName')}>Journey</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <DataTableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${row.journeyId}`)}>
            <DataTableCell type="primary" className="font-medium">
              {row.isSubTask ? (
                <span className="pl-4 text-muted-foreground">{row.title}</span>
              ) : (
                row.title
              )}
            </DataTableCell>
            <DataTableCell>{row.nickname}</DataTableCell>
            <DataTableCell>{row.actionTitle}</DataTableCell>
            <DataTableCell>{row.journeyName}</DataTableCell>
            <DataTableCell>{row.relationshipName}</DataTableCell>
            <DataTableCell type="badge">
              <StatusBadge status={row.status} />
            </DataTableCell>
            <DataTableCell>{row.assignedTo}</DataTableCell>
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
