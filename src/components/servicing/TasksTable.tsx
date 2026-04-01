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
  taskStatusOrder,
} from '@/lib/sort-comparators'
import type { Journey } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'

export interface TaskRow {
  id: string
  actionId: string
  journeyId: string
  title: string
  status: TaskStatus
  assignedTo: string
  isSubTask?: boolean
  nickname: string | undefined
  actionTitle: string
  journeyName: string
  relationshipName: string
}

export function deriveTaskRows(journeys: Journey[]): TaskRow[] {
  return journeys.flatMap((journey) =>
    journey.actions.flatMap((action) =>
      action.tasks.map((task) => ({
        id: task.id,
        actionId: task.actionId,
        journeyId: task.journeyId,
        title: task.title,
        status: task.status,
        assignedTo: task.assignedTo,
        isSubTask: task.isSubTask,
        nickname: task.nickname,
        actionTitle: action.title,
        journeyName: journey.name,
        relationshipName: journey.relationshipName,
      })),
    ),
  )
}

interface TasksTableProps {
  rows: TaskRow[]
  visibleColumns: string[]
}

export function TasksTable({ rows, visibleColumns }: TasksTableProps) {
  const navigate = useNavigate()

  const comparators = useMemo(
    () => ({
      title: compareString<TaskRow>((r) => r.title),
      nickname: compareString<TaskRow>((r) => r.nickname ?? ''),
      actionTitle: compareString<TaskRow>((r) => r.actionTitle),
      journeyName: compareString<TaskRow>((r) => r.journeyName),
      relationshipName: compareString<TaskRow>((r) => r.relationshipName),
      status: compareStatus<TaskRow>((r) => r.status, taskStatusOrder),
      assignedTo: compareString<TaskRow>((r) => r.assignedTo),
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
          {vis('title') && <DataTableHeader sortable sorted={sorted('title')} onSort={() => onSort('title')} style={{ width: 200 }}>Task</DataTableHeader>}
          {vis('nickname') && <DataTableHeader sortable sorted={sorted('nickname')} onSort={() => onSort('nickname')}>Action Nickname</DataTableHeader>}
          {vis('actionTitle') && <DataTableHeader sortable sorted={sorted('actionTitle')} onSort={() => onSort('actionTitle')}>Action Type</DataTableHeader>}
          {vis('journeyName') && <DataTableHeader sortable sorted={sorted('journeyName')} onSort={() => onSort('journeyName')}>Journey</DataTableHeader>}
          {vis('relationshipName') && <DataTableHeader sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>}
          {vis('status') && <DataTableHeader sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>}
          {vis('assignedTo') && <DataTableHeader sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <DataTableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${row.journeyId}`)}>
            {vis('title') && (
              <DataTableCell type="primary" className="font-medium">
                {row.isSubTask ? (
                  <span className="pl-4 text-muted-foreground">{row.title}</span>
                ) : (
                  row.title
                )}
              </DataTableCell>
            )}
            {vis('nickname') && <DataTableCell>{row.nickname}</DataTableCell>}
            {vis('actionTitle') && <DataTableCell>{row.actionTitle}</DataTableCell>}
            {vis('journeyName') && <DataTableCell>{row.journeyName}</DataTableCell>}
            {vis('relationshipName') && <DataTableCell>{row.relationshipName}</DataTableCell>}
            {vis('status') && <DataTableCell type="badge"><StatusBadge status={row.status} /></DataTableCell>}
            {vis('assignedTo') && <DataTableCell>{row.assignedTo}</DataTableCell>}
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
