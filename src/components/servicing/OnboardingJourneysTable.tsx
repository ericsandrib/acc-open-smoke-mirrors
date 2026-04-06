import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServicing } from '@/stores/servicingStore'
import { useWorkflow } from '@/stores/workflowStore'
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

export function OnboardingJourneysTable() {
  const { journeys } = useServicing()
  const { state } = useWorkflow()
  const navigate = useNavigate()

  const rows = journeys
    .filter((journey) => journey.category === 'Onboarding')
    .map((journey) => {
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

  const sorted = (key: string): 'asc' | 'desc' | false =>
    sortKey === key ? (sortDirection as 'asc' | 'desc') : false

  return (
    <DataTable>
      <thead>
        <tr>
          <DataTableHeader sortable sorted={sorted('name')} onSort={() => onSort('name')} style={{ width: 200 }}>Journey</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('createdAt')} onSort={() => onSort('createdAt')}>Created</DataTableHeader>
          <DataTableHeader sortable sorted={sorted('progress')} onSort={() => onSort('progress')} align="end">Progress</DataTableHeader>
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <DataTableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${row.id}`)}>
            <DataTableCell type="primary" className="font-medium">
              {row.id === state.journeyId ? (
                <span className="flex items-center gap-2">
                  {row.name}
                  <span className="inline-flex h-2 w-2 rounded-full bg-fill-brand-primary animate-pulse" />
                </span>
              ) : (
                row.name
              )}
            </DataTableCell>
            <DataTableCell>{row.relationshipName}</DataTableCell>
            <DataTableCell type="badge">
              <StatusBadge status={row.status} />
            </DataTableCell>
            <DataTableCell>{row.assignedTo}</DataTableCell>
            <DataTableCell>{row.createdAt}</DataTableCell>
            <DataTableCell align="end" type="secondary">
              {row.completeTasks}/{row.totalTasks} tasks
            </DataTableCell>
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
