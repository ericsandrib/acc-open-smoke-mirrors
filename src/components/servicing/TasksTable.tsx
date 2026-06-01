import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
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
  taskOwner: string
  nextStep: string
  readyToBegin: string
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
        taskOwner: task.taskOwner ?? task.assignedTo,
        nextStep: task.nextStep ?? '',
        readyToBegin: task.readyToBegin ?? '',
      })),
    ),
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function OwnerCell({ name }: { name: string }) {
  if (!name || name === 'Unassigned') {
    return <span className="text-muted-foreground">Unassigned</span>
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
        {initials(name)}
      </span>
      {name}
    </span>
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
      relationshipName: compareString<TaskRow>((r) => r.relationshipName),
      title: compareString<TaskRow>((r) => r.title),
      taskOwner: compareString<TaskRow>((r) => r.taskOwner),
      nickname: compareString<TaskRow>((r) => r.nickname ?? ''),
      actionTitle: compareString<TaskRow>((r) => r.actionTitle),
      journeyName: compareString<TaskRow>((r) => r.journeyName),
      status: compareStatus<TaskRow>((r) => r.status, taskStatusOrder),
      nextStep: compareString<TaskRow>((r) => r.nextStep),
      readyToBegin: compareString<TaskRow>((r) => r.readyToBegin),
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
          {vis('relationshipName') && <DataTableHeader size="comfortable" sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>}
          {vis('title') && <DataTableHeader size="comfortable" sortable sorted={sorted('title')} onSort={() => onSort('title')} style={{ width: 230 }}>Task</DataTableHeader>}
          {vis('taskOwner') && <DataTableHeader size="comfortable" sortable sorted={sorted('taskOwner')} onSort={() => onSort('taskOwner')}>Task Owner</DataTableHeader>}
          {vis('status') && <DataTableHeader size="comfortable" sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>}
          {vis('nextStep') && <DataTableHeader size="comfortable" sortable sorted={sorted('nextStep')} onSort={() => onSort('nextStep')}>Next Step</DataTableHeader>}
          {vis('readyToBegin') && <DataTableHeader size="comfortable" sortable sorted={sorted('readyToBegin')} onSort={() => onSort('readyToBegin')}>Ready to Begin</DataTableHeader>}
          {vis('actionTitle') && <DataTableHeader size="comfortable" sortable sorted={sorted('actionTitle')} onSort={() => onSort('actionTitle')}>Action Type</DataTableHeader>}
          {vis('journeyName') && <DataTableHeader size="comfortable" sortable sorted={sorted('journeyName')} onSort={() => onSort('journeyName')}>Journey</DataTableHeader>}
          {vis('nickname') && <DataTableHeader size="comfortable" sortable sorted={sorted('nickname')} onSort={() => onSort('nickname')}>Action Nickname</DataTableHeader>}
        </tr>
      </thead>
      <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
        {sortedRows.map((row) => (
          <DataTableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/servicing/${row.journeyId}`)}>
            {vis('relationshipName') && (
              <DataTableCell type="relationship">
                <span className="inline-flex items-center gap-1.5 text-foreground underline-offset-2 hover:underline">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {row.relationshipName}
                </span>
              </DataTableCell>
            )}
            {vis('title') && (
              <DataTableCell type="primary" className="font-medium underline-offset-2 hover:underline">
                {row.isSubTask ? (
                  <span className="pl-4 text-muted-foreground">{row.title}</span>
                ) : (
                  row.title
                )}
              </DataTableCell>
            )}
            {vis('taskOwner') && <DataTableCell type="person"><OwnerCell name={row.taskOwner} /></DataTableCell>}
            {vis('status') && <DataTableCell type="badge"><StatusBadge status={row.status} /></DataTableCell>}
            {vis('nextStep') && <DataTableCell type="secondary">{row.nextStep}</DataTableCell>}
            {vis('readyToBegin') && <DataTableCell type="secondary">{row.readyToBegin}</DataTableCell>}
            {vis('actionTitle') && <DataTableCell>{row.actionTitle}</DataTableCell>}
            {vis('journeyName') && <DataTableCell>{row.journeyName}</DataTableCell>}
            {vis('nickname') && <DataTableCell>{row.nickname}</DataTableCell>}
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
