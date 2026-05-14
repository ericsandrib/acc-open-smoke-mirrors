import { useMemo } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
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
  const { navigateToServicing } = useJourneyNavigation()

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
      <thead className="bg-muted/60 border-b border-border [&_th_svg]:hidden">
        <tr>
          {vis('name') && <DataTableHeader size="comfortable" sortable sorted={sorted('name')} onSort={() => onSort('name')} style={{ minWidth: 240 }}>Journey</DataTableHeader>}
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
          {vis('assignedTo') && <DataTableHeader size="comfortable" sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>}
          {vis('createdAt') && <DataTableHeader size="comfortable" sortable sorted={sorted('createdAt')} onSort={() => onSort('createdAt')}>Created</DataTableHeader>}
          {vis('progress') && <DataTableHeader size="comfortable" sortable sorted={sorted('progress')} onSort={() => onSort('progress')}>Progress</DataTableHeader>}
        </tr>
      </thead>
      <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
        {sortedRows.map((row) => (
          <DataTableRow key={row.id} className="cursor-pointer" onClick={() => navigateToServicing(row)}>
            {vis('name') && (
              <DataTableCell type="primary" className="font-medium min-w-0">
                {row.id === state.journeyId ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{row.name}</span>
                    <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-fill-brand-primary animate-pulse" />
                  </span>
                ) : (
                  <span className="block truncate">{row.name}</span>
                )}
              </DataTableCell>
            )}
            {vis('relationshipName') && (
              <DataTableCell className="max-w-[15rem] min-w-0">
                <span className="block truncate" title={row.relationshipName}>
                  {row.relationshipName}
                </span>
              </DataTableCell>
            )}
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
