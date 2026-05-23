import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServicing } from '@/stores/servicingStore'
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
  taskStatusOrder,
} from '@/lib/sort-comparators'
import type { Journey } from '@/types/servicing'
import type { TaskStatus } from '@/types/workflow'
import { shortActionNicknameForTable } from '@/utils/servicingActionLabel'
import { visibleOnboardingJourneyActions } from '@/utils/onboardingJourneyActionTree'

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

export function deriveTaskRows(
  journeys: Journey[],
  hideKycChildWorkflows = false,
): TaskRow[] {
  return journeys.flatMap((journey) => {
    const actions = visibleOnboardingJourneyActions(journey.actions, hideKycChildWorkflows, false)
    return actions.flatMap((action) =>
      action.tasks.map((task) => ({
        id: task.id,
        actionId: task.actionId,
        journeyId: task.journeyId,
        title: task.title,
        status: task.status,
        assignedTo: task.assignedTo,
        isSubTask: task.isSubTask,
        nickname: shortActionNicknameForTable(journey.name, task.nickname, task.title),
        actionTitle: action.title,
        journeyName: journey.name,
        relationshipName: journey.relationshipName,
      })),
    )
  })
}

interface TasksTableProps {
  rows: TaskRow[]
  visibleColumns: string[]
}

export function TasksTable({ rows, visibleColumns }: TasksTableProps) {
  const navigate = useNavigate()
  const { journeys } = useServicing()
  const { navigateToServicing } = useJourneyNavigation()

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
      <thead className="bg-muted/60 border-b border-border [&_th_svg]:hidden">
        <tr>
          {vis('title') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('title')}
              onSort={() => onSort('title')}
              style={{ width: '20%', minWidth: 100, maxWidth: 200 }}
            >
              Task
            </DataTableHeader>
          )}
          {vis('nickname') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('nickname')}
              onSort={() => onSort('nickname')}
              style={{ width: '18%', minWidth: 96, maxWidth: 168 }}
            >
              Action
            </DataTableHeader>
          )}
          {vis('actionTitle') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('actionTitle')}
              onSort={() => onSort('actionTitle')}
              style={{ width: '14%', minWidth: 88, maxWidth: 150 }}
            >
              Action Type
            </DataTableHeader>
          )}
          {vis('journeyName') && (
            <DataTableHeader
              size="comfortable"
              sortable
              sorted={sorted('journeyName')}
              onSort={() => onSort('journeyName')}
              className="min-w-0"
              style={{ width: '28%', minWidth: 120 }}
            >
              Journey
            </DataTableHeader>
          )}
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
        </tr>
      </thead>
      <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
        {sortedRows.map((row) => (
          <DataTableRow
            key={row.id}
            className="cursor-pointer"
            onClick={() => {
              const journey = journeys.find((j) => j.id === row.journeyId)
              if (journey) navigateToServicing(journey)
              else navigate(`/servicing/${row.journeyId}`)
            }}
          >
            {vis('title') && (
              <DataTableCell type="primary" className="font-medium">
                {row.isSubTask ? (
                  <span className="pl-4 text-muted-foreground">{row.title}</span>
                ) : (
                  row.title
                )}
              </DataTableCell>
            )}
            {vis('nickname') && (
              <DataTableCell className="min-w-0 max-w-[12rem]">
                <span className="block truncate">{row.nickname}</span>
              </DataTableCell>
            )}
            {vis('actionTitle') && <DataTableCell>{row.actionTitle}</DataTableCell>}
            {vis('journeyName') && (
              <DataTableCell className="min-w-0">
                <span className="block truncate">{row.journeyName}</span>
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
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
