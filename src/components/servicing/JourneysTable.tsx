import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServicing } from '@/stores/servicingStore'
import { useWorkflow } from '@/stores/workflowStore'
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

export function JourneysTable() {
  const { journeys } = useServicing()
  const { state } = useWorkflow()
  const navigate = useNavigate()

  const rows = journeys.map((journey) => {
    const totalTasks = journey.actions.reduce((sum, a) => sum + a.tasks.length, 0)
    const completeTasks = journey.actions.reduce(
      (sum, a) => sum + a.tasks.filter((t) => t.status === 'complete').length,
      0,
    )
    return { ...journey, totalTasks, completeTasks }
  })

  type Row = (typeof rows)[number]

  const comparators = useMemo(
    () => ({
      name: compareString<Row>((r) => r.name),
      relationshipName: compareString<Row>((r) => r.relationshipName),
      status: compareStatus<Row>((r) => r.status, journeyStatusOrder),
      assignedTo: compareString<Row>((r) => r.assignedTo),
      createdAt: compareString<Row>((r) => r.createdAt),
      progress: compareFraction<Row>(
        (r) => r.completeTasks,
        (r) => r.totalTasks,
      ),
    }),
    [],
  )

  const { sortedRows, sortKey, sortDirection, onSort } = useSortableTable(rows, comparators)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead sortKey="name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} className="w-[200px]">Journey</SortableTableHead>
          <SortableTableHead sortKey="relationshipName" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Relationship</SortableTableHead>
          <SortableTableHead sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Status</SortableTableHead>
          <SortableTableHead sortKey="assignedTo" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Assigned To</SortableTableHead>
          <SortableTableHead sortKey="createdAt" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort}>Created</SortableTableHead>
          <SortableTableHead sortKey="progress" currentSortKey={sortKey} currentDirection={sortDirection} onSort={onSort} className="text-right">Progress</SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map((row) => (
          <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${row.id}`)}>
            <TableCell className="font-medium">
              {row.id === state.journeyId ? (
                <span className="flex items-center gap-2">
                  {row.name}
                  <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                </span>
              ) : (
                row.name
              )}
            </TableCell>
            <TableCell>{row.relationshipName}</TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell>{row.assignedTo}</TableCell>
            <TableCell>{row.createdAt}</TableCell>
            <TableCell className="text-right">
              {row.completeTasks}/{row.totalTasks} tasks
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
