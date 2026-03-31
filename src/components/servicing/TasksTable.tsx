import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServicing } from '@/stores/servicingStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SortableTableHead } from '@/components/ui/sortable-table-head'
import { StatusBadge } from './StatusBadge'
import { useSortableTable } from '@/hooks/useSortableTable'
import {
  compareString,
  compareStatus,
  taskStatusOrder,
} from '@/lib/sort-comparators'

export function TasksTable() {
  const { journeys } = useServicing()
  const navigate = useNavigate()

  const rows = journeys.flatMap((journey) =>
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead sortKey="title" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} className="w-[200px]">Task</SortableTableHead>
          <SortableTableHead sortKey="nickname" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Action Nickname</SortableTableHead>
          <SortableTableHead sortKey="actionTitle" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Action Type</SortableTableHead>
          <SortableTableHead sortKey="journeyName" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Journey</SortableTableHead>
          <SortableTableHead sortKey="relationshipName" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Relationship</SortableTableHead>
          <SortableTableHead sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Status</SortableTableHead>
          <SortableTableHead sortKey="assignedTo" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Assigned To</SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map((row) => (
          <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${row.journeyId}`)}>
            <TableCell className="font-medium">
              {row.isSubTask ? (
                <span className="pl-4 text-muted-foreground">{row.title}</span>
              ) : (
                row.title
              )}
            </TableCell>
            <TableCell>{row.nickname}</TableCell>
            <TableCell>{row.actionTitle}</TableCell>
            <TableCell>{row.journeyName}</TableCell>
            <TableCell>{row.relationshipName}</TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell>{row.assignedTo}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
