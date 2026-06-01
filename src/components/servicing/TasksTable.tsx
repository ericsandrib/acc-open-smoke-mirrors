import { useMemo, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Play, Flag } from 'lucide-react'
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@/components/ui/data-table'
import { StatusBadge } from './StatusBadge'
import { ClaimTaskDialog } from './ClaimTaskDialog'
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
  relationshipOwner: string
  taskOwner: string
  category: string
  actionCode: string
  description: string
  nextStep: string
  readyToBegin: string
  due: string
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
        relationshipOwner: journey.assignedTo,
        taskOwner: task.taskOwner ?? task.assignedTo,
        category: action.category ?? '',
        actionCode: action.actionCode ?? '',
        description: action.description ?? action.title,
        nextStep: task.nextStep ?? '',
        readyToBegin: task.readyToBegin ?? '',
        due: task.due ?? '',
      })),
    ),
  )
}

/**
 * Maps a servicing task to the part of the client-onboarding wizard it opens into,
 * so clicking a task (or Begin) brings the advisor to that part of the journey.
 */
function wizardTargetForTask(title: string): { taskId: string; sectionId?: string } {
  switch (title) {
    case 'Client Info':
      return { taskId: 'related-parties' }
    case 'Existing Accounts':
      return { taskId: 'existing-accounts' }
    case 'Upload Supporting Documents':
      return { taskId: 'open-accounts', sectionId: 'oa-documents' }
    case 'KYC / Identity Check':
    case 'Suitability & Supervision Review':
      return { taskId: 'open-accounts', sectionId: 'oa-kyc' }
    case 'Generate & Submit Request':
    case 'Collect Client Signature':
    case 'Complete Quality Control Review':
    case 'Verify Complete':
      return { taskId: 'open-accounts', sectionId: 'oa-esign' }
    case 'Complete Custodian Form':
    case 'Investment & Model Selection':
    default:
      return { taskId: 'open-accounts', sectionId: 'oa-accounts' }
  }
}

function wizardPath(journeyId: string, title: string): string {
  const t = wizardTargetForTask(title)
  const qs = t.sectionId ? `?taskId=${t.taskId}&sectionId=${t.sectionId}` : `?taskId=${t.taskId}`
  return `/servicing/${journeyId}${qs}`
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
  const [claimRow, setClaimRow] = useState<TaskRow | null>(null)

  const comparators = useMemo(
    () => ({
      relationshipName: compareString<TaskRow>((r) => r.relationshipName),
      category: compareString<TaskRow>((r) => r.category),
      actionCode: compareString<TaskRow>((r) => r.actionCode),
      description: compareString<TaskRow>((r) => r.description),
      nickname: compareString<TaskRow>((r) => r.nickname ?? ''),
      title: compareString<TaskRow>((r) => r.title),
      taskOwner: compareString<TaskRow>((r) => r.taskOwner),
      actionTitle: compareString<TaskRow>((r) => r.actionTitle),
      journeyName: compareString<TaskRow>((r) => r.journeyName),
      status: compareStatus<TaskRow>((r) => r.status, taskStatusOrder),
      nextStep: compareString<TaskRow>((r) => r.nextStep),
      readyToBegin: compareString<TaskRow>((r) => r.readyToBegin),
      due: compareString<TaskRow>((r) => r.due),
    }),
    [],
  )

  const { sortedRows, sortKey, sortDirection, onSort } = useSortableTable(rows, comparators)

  const sorted = (key: string): 'asc' | 'desc' | false =>
    sortKey === key ? (sortDirection as 'asc' | 'desc') : false

  const vis = (key: string) => visibleColumns.includes(key)

  /** Begin links into the client-onboarding form at the step matching this task. */
  const beginTarget = (row: TaskRow) => wizardPath(row.journeyId, row.title)

  const handleBegin = (e: MouseEvent, row: TaskRow) => {
    e.stopPropagation()
    const unassigned = !row.taskOwner || row.taskOwner === 'Unassigned'
    if (unassigned) {
      setClaimRow(row)
    } else {
      navigate(beginTarget(row))
    }
  }

  const canBegin = (s: TaskStatus) => s === 'not_started' || s === 'in_progress'

  return (
    <>
      <DataTable>
        <thead className="bg-muted/60 border-b border-border [&_th_svg]:hidden">
          <tr>
            {vis('relationshipName') && <DataTableHeader size="comfortable" sortable sorted={sorted('relationshipName')} onSort={() => onSort('relationshipName')}>Relationship</DataTableHeader>}
            {vis('category') && <DataTableHeader size="comfortable" sortable sorted={sorted('category')} onSort={() => onSort('category')}>Category</DataTableHeader>}
            {vis('actionCode') && <DataTableHeader size="comfortable" sortable sorted={sorted('actionCode')} onSort={() => onSort('actionCode')} style={{ width: 100 }}>Action ID</DataTableHeader>}
            {vis('description') && <DataTableHeader size="comfortable" sortable sorted={sorted('description')} onSort={() => onSort('description')} style={{ width: 240 }}>Action Description</DataTableHeader>}
            {vis('nickname') && <DataTableHeader size="comfortable" sortable sorted={sorted('nickname')} onSort={() => onSort('nickname')} style={{ width: 220 }}>Action Nickname</DataTableHeader>}
            {vis('title') && <DataTableHeader size="comfortable" sortable sorted={sorted('title')} onSort={() => onSort('title')} style={{ width: 230 }}>Task</DataTableHeader>}
            {vis('taskOwner') && <DataTableHeader size="comfortable" sortable sorted={sorted('taskOwner')} onSort={() => onSort('taskOwner')}>Task Owner</DataTableHeader>}
            {vis('readyToBegin') && <DataTableHeader size="comfortable" sortable sorted={sorted('readyToBegin')} onSort={() => onSort('readyToBegin')}>Ready to Begin</DataTableHeader>}
            {vis('due') && <DataTableHeader size="comfortable" sortable sorted={sorted('due')} onSort={() => onSort('due')}>Due</DataTableHeader>}
            {vis('begin') && <DataTableHeader size="comfortable" style={{ width: 110 }}>Begin</DataTableHeader>}
            {vis('status') && <DataTableHeader size="comfortable" sortable sorted={sorted('status')} onSort={() => onSort('status')}>Status</DataTableHeader>}
            {vis('nextStep') && <DataTableHeader size="comfortable" sortable sorted={sorted('nextStep')} onSort={() => onSort('nextStep')}>Next Step</DataTableHeader>}
            {vis('actionTitle') && <DataTableHeader size="comfortable" sortable sorted={sorted('actionTitle')} onSort={() => onSort('actionTitle')}>Action Type</DataTableHeader>}
            {vis('journeyName') && <DataTableHeader size="comfortable" sortable sorted={sorted('journeyName')} onSort={() => onSort('journeyName')}>Journey</DataTableHeader>}
          </tr>
        </thead>
        <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
          {sortedRows.map((row) => (
            <DataTableRow key={row.id} className="cursor-pointer" onClick={() => navigate(wizardPath(row.journeyId, row.title))}>
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
              {vis('nickname') && <DataTableCell type="secondary" className="underline-offset-2 hover:underline">{row.nickname}</DataTableCell>}
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
              {vis('readyToBegin') && <DataTableCell type="secondary">{row.readyToBegin}</DataTableCell>}
              {vis('due') && (
                <DataTableCell type="secondary">
                  {row.due ? (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <Flag className="h-3 w-3" />
                      {row.due}
                    </span>
                  ) : null}
                </DataTableCell>
              )}
              {vis('begin') && (
                <DataTableCell>
                  {canBegin(row.status) ? (
                    <button
                      type="button"
                      onClick={(e) => handleBegin(e, row)}
                      className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Begin
                    </button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </DataTableCell>
              )}
              {vis('status') && <DataTableCell type="badge"><StatusBadge status={row.status} /></DataTableCell>}
              {vis('nextStep') && <DataTableCell type="secondary">{row.nextStep}</DataTableCell>}
              {vis('actionTitle') && <DataTableCell>{row.actionTitle}</DataTableCell>}
              {vis('journeyName') && <DataTableCell>{row.journeyName}</DataTableCell>}
            </DataTableRow>
          ))}
        </tbody>
      </DataTable>

      <ClaimTaskDialog
        open={!!claimRow}
        taskTitle={claimRow?.title}
        onOpenChange={(o) => { if (!o) setClaimRow(null) }}
        onConfirm={() => {
          const r = claimRow
          setClaimRow(null)
          if (r) navigate(beginTarget(r))
        }}
      />
    </>
  )
}
