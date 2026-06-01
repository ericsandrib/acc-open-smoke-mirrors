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
  compareFraction,
  journeyStatusOrder,
} from '@/lib/sort-comparators'
import type { Journey, JourneyStatus } from '@/types/servicing'

export interface ActionRow {
  id: string
  journeyId: string
  title: string
  status: JourneyStatus
  nickname: string | undefined
  parentActionId?: string
  journeyName: string
  relationshipName: string
  category: string
  actionCode: string
  description: string
  assignedTo: string
  complete: number
  total: number
}

export function deriveActionRows(journeys: Journey[]): ActionRow[] {
  return journeys.flatMap((journey) =>
    journey.actions.map((action) => {
      const complete = action.tasks.filter((t) => t.status === 'complete').length
      return {
        id: action.id,
        journeyId: journey.id,
        title: action.title,
        status: action.status,
        nickname: action.nickname,
        parentActionId: action.parentActionId,
        journeyName: journey.name,
        relationshipName: journey.relationshipName,
        category: action.category ?? '',
        actionCode: action.actionCode ?? '',
        description: action.description ?? action.title,
        assignedTo: [...new Set(action.tasks.map((t) => t.assignedTo))].join(', '),
        complete,
        total: action.tasks.length,
      }
    }),
  )
}

interface ActionsTableProps {
  rows: ActionRow[]
  visibleColumns: string[]
}

export function ActionsTable({ rows, visibleColumns }: ActionsTableProps) {
  const navigate = useNavigate()

  const comparators = useMemo(
    () => ({
      relationshipName: compareString<ActionRow>((r) => r.relationshipName),
      category: compareString<ActionRow>((r) => r.category),
      actionCode: compareString<ActionRow>((r) => r.actionCode),
      description: compareString<ActionRow>((r) => r.description),
      nickname: compareString<ActionRow>((r) => r.nickname ?? ''),
      title: compareString<ActionRow>((r) => r.title),
      status: compareStatus<ActionRow>((r) => r.status, journeyStatusOrder),
      assignedTo: compareString<ActionRow>((r) => r.assignedTo),
      tasksComplete: compareFraction<ActionRow>(
        (r) => r.complete,
        (r) => r.total,
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
          {vis('relationshipName') && <DataTableHeader size="comfortable" sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>}
          {vis('category') && <DataTableHeader size="comfortable" sortable sorted={sorted('category')} onSort={() => onSort('category')}>Category</DataTableHeader>}
          {vis('actionCode') && <DataTableHeader size="comfortable" sortable sorted={sorted('actionCode')} onSort={() => onSort('actionCode')} style={{ width: 110 }}>Action ID</DataTableHeader>}
          {vis('description') && <DataTableHeader size="comfortable" sortable sorted={sorted('description')} onSort={() => onSort('description')} style={{ width: 280 }}>Action Description</DataTableHeader>}
          {vis('nickname') && <DataTableHeader size="comfortable" sortable sorted={sorted('nickname')} onSort={() => onSort('nickname')} style={{ width: 240 }}>Action Nickname</DataTableHeader>}
          {vis('title') && <DataTableHeader size="comfortable" sortable sorted={sorted('title')} onSort={() => onSort('title')}>Action Type</DataTableHeader>}
          {vis('status') && <DataTableHeader size="comfortable" sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>}
          {vis('assignedTo') && <DataTableHeader size="comfortable" sortable sorted={sorted('assignedTo')} onSort={() => onSort('assignedTo')}>Assigned To</DataTableHeader>}
          {vis('tasksComplete') && <DataTableHeader size="comfortable" sortable sorted={sorted('tasksComplete')} onSort={() => onSort('tasksComplete')}>Tasks Complete</DataTableHeader>}
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
            {vis('category') && <DataTableCell type="secondary">{row.category}</DataTableCell>}
            {vis('actionCode') && <DataTableCell type="secondary">{row.actionCode}</DataTableCell>}
            {vis('description') && <DataTableCell>{row.description}</DataTableCell>}
            {vis('nickname') && <DataTableCell type="primary" className="font-medium underline-offset-2 hover:underline">{row.nickname}</DataTableCell>}
            {vis('title') && <DataTableCell>{row.title}</DataTableCell>}
            {vis('status') && <DataTableCell type="badge"><StatusBadge status={row.status} /></DataTableCell>}
            {vis('assignedTo') && <DataTableCell>{row.assignedTo}</DataTableCell>}
            {vis('tasksComplete') && <DataTableCell align="end" type="secondary">{row.complete}/{row.total}</DataTableCell>}
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
