import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServicing } from '@/stores/servicingStore'
import { useWorkflow } from '@/stores/workflowStore'
import { relationships } from '@/data/relationships'
import { seededJourneys } from '@/data/servicingSeed'
import type { Journey } from '@/types/servicing'
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

export type OnboardingJourneyRow = Journey & { totalTasks: number; progressedTasks: number }

export function deriveOnboardingJourneyRows(journeys: Journey[]): OnboardingJourneyRow[] {
  return journeys
    .filter((journey) => journey.category === 'Onboarding')
    .map((journey) => {
      const totalTasks = journey.actions.reduce((sum, a) => sum + a.tasks.length, 0)
      const progressedTasks = journey.actions.reduce(
        (sum, a) => sum + a.tasks.filter((t) => t.status !== 'not_started').length,
        0,
      )
      return { ...journey, totalTasks, progressedTasks }
    })
}

interface OnboardingJourneysTableProps {
  rows: OnboardingJourneyRow[]
  visibleColumns: string[]
}

export function OnboardingJourneysTable({ rows, visibleColumns }: OnboardingJourneysTableProps) {
  const { currentLiveJourney, saveCurrentJourney } = useServicing()
  const { state, dispatch } = useWorkflow()
  const navigate = useNavigate()
  const seededJourneyIds = useMemo(() => new Set(seededJourneys.map((j) => j.id)), [])
  type Row = OnboardingJourneyRow

  const comparators = useMemo(
    () => ({
      name: compareString<Row>((r) => r.name),
      relationshipName: compareString<Row>((r) => r.relationshipName),
      status: compareStatus<Row>((r) => r.status, journeyStatusOrder),
      assignedTo: compareString<Row>((r) => r.assignedTo),
      createdAt: compareString<Row>((r) => r.createdAt),
      progress: compareFraction<Row>(
        (r) => r.progressedTasks,
        (r) => r.totalTasks,
      ),
    }),
    [],
  )

  const { sortedRows, sortKey, sortDirection, onSort } = useSortableTable(rows, comparators)

  const sorted = (key: string): 'asc' | 'desc' | false =>
    sortKey === key ? (sortDirection as 'asc' | 'desc') : false
  const vis = (key: string) => visibleColumns.includes(key)

  const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const findTemplateRelationship = (relationshipName: string) => {
    const target = normalize(relationshipName)
    if (!target) return undefined
    const exact = relationships.find((r) => normalize(r.name) === target)
    if (exact) return exact
    const includes = relationships.find((r) => {
      const candidate = normalize(r.name)
      return candidate.includes(target) || target.includes(candidate)
    })
    if (includes) return includes
    const tokens = new Set(target.split(' ').filter(Boolean))
    return relationships.find((r) =>
      normalize(r.name)
        .split(' ')
        .some((t) => tokens.has(t)),
    )
  }

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
          <DataTableRow
            key={row.id}
            className="cursor-pointer"
            onClick={() => {
              if (row.id === state.journeyId) {
                navigate('/wizard')
                return
              }
              if (seededJourneyIds.has(row.id)) {
                const relationship = findTemplateRelationship(row.relationshipName)
                if (!relationship) {
                  navigate(`/servicing/${row.id}`)
                  return
                }
                if (currentLiveJourney) {
                  saveCurrentJourney(currentLiveJourney)
                }
                dispatch({
                  type: 'INITIALIZE_FROM_RELATIONSHIP',
                  relatedParties: relationship.relatedParties,
                  financialAccounts: relationship.financialAccounts,
                  clientInfo: {
                    firstName: relationship.primaryContact.firstName,
                    lastName: relationship.primaryContact.lastName,
                    email: relationship.primaryContact.email,
                    phone: relationship.primaryContact.phone,
                    dob: relationship.primaryContact.dob ?? '',
                    clientType: relationship.primaryContact.clientType ?? '',
                  },
                  journeyName: row.name,
                  journeyId: `journey-${Date.now()}`,
                  assignedTo: row.assignedTo,
                  journeyOnboardingConfig: {
                    office: '',
                    investmentProfessionalId: '',
                    openMultipleAccounts: false,
                  },
                })
                navigate('/wizard')
                return
              }
              navigate(`/servicing/${row.id}`)
            }}
          >
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
            {vis('status') && (
              <DataTableCell type="badge">
                <StatusBadge status={row.status} />
              </DataTableCell>
            )}
            {vis('assignedTo') && <DataTableCell>{row.assignedTo}</DataTableCell>}
            {vis('createdAt') && <DataTableCell>{row.createdAt}</DataTableCell>}
            {vis('progress') && (
              <DataTableCell align="end" type="secondary">
                {row.progressedTasks}/{row.totalTasks} tasks
              </DataTableCell>
            )}
          </DataTableRow>
        ))}
      </tbody>
    </DataTable>
  )
}
