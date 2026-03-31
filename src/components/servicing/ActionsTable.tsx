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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead sortKey="nickname" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} className="w-[250px]">Action Nickname</SortableTableHead>
          <SortableTableHead sortKey="title" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} className="w-[200px]">Action Type</SortableTableHead>
          <SortableTableHead sortKey="journeyName" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Journey</SortableTableHead>
          <SortableTableHead sortKey="relationshipName" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Relationship</SortableTableHead>
          <SortableTableHead sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Status</SortableTableHead>
          <SortableTableHead sortKey="assignedTo" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Assigned To</SortableTableHead>
          <SortableTableHead sortKey="tasksComplete" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} className="text-right">Tasks Complete</SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map((row) => (
          <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${row.journeyId}`)}>
            <TableCell className="font-medium">{row.nickname}</TableCell>
            <TableCell>{row.title}</TableCell>
            <TableCell>{row.journeyName}</TableCell>
            <TableCell>{row.relationshipName}</TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell>{row.assignedToDisplay}</TableCell>
            <TableCell className="text-right">
              {row.complete}/{row.total}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
