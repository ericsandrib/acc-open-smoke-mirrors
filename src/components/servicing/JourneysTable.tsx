import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import type { Journey } from '@/types/servicing'

export type JourneyRow = Journey & { totalTasks: number; completeTasks: number }

export function deriveJourneyRows(journeys: Journey[]): JourneyRow[] {
  return journeys.map((journey) => {
    const totalTasks = journey.actions.reduce((sum, a) => sum + a.tasks.length, 0)
    const completeTasks = journey.actions.reduce(
      (sum, a) => sum + a.tasks.filter((t) => t.status === 'complete').length,
      0,
    )
    return { ...journey, totalTasks, completeTasks }
  })
}

interface JourneysTableProps {
  rows: JourneyRow[]
  visibleColumns: string[]
}

export function JourneysTable({ rows, visibleColumns }: JourneysTableProps) {
  const { state } = useWorkflow()
  const navigate = useNavigate()

  const comparators = useMemo(
    () => ({
      name: compareString<JourneyRow>((r) => r.name),
      relationshipName: compareString<JourneyRow>((r) => r.relationshipName),
      status: compareStatus<JourneyRow>((r) => r.status, journeyStatusOrder),
      assignedTo: compareString<JourneyRow>((r) => r.assignedTo),
      createdAt: compareString<JourneyRow>((r) => r.createdAt),
      progress: compareFraction<JourneyRow>(
        (r) => r.completeTasks,
        (r) => r.totalTasks,
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
          {vis('name') && <DataTableHeader sortable sorted={sorted('name')} onSort={() => onSort('name')} style={{ width: 200 }}>Journey</DataTableHeader>}
          {vis('relationshipName') && <DataTableHeader sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>}
          {vis('status') && <DataTableHeader sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>}
          {vis('assignedTo') && <DataTableHeader sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>}
          {vis('createdAt') && <DataTableHeader sortable sorted={sorted('createdAt')} onSort={() => onSort('createdAt')}>Created</DataTableHeader>}
          {vis('progress') && <DataTableHeader sortable sorted={sorted('progress')} onSort={() => onSort('progress')} align="end">Progress</DataTableHeader>}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <DataTableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${row.id}`)}>
            {vis('name') && (
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
            )}
            {vis('relationshipName') && <DataTableCell>{row.relationshipName}</DataTableCell>}
            {vis('status') && <DataTableCell type="badge"><StatusBadge status={row.status} /></DataTableCell>}
            {vis('assignedTo') && <DataTableCell>{row.assignedTo}</DataTableCell>}
            {vis('createdAt') && <DataTableCell>{row.createdAt}</DataTableCell>}
            {vis('progress') && <DataTableCell align="end" type="secondary">{row.completeTasks}/{row.totalTasks} tasks</DataTableCell>}
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
