import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageTitle } from '@/components/page-title'
import { useServicing } from '@/stores/servicingStore'
import { useTheme } from '@/stores/themeStore'
import { useJourneyNavigation } from '@/hooks/useJourneyNavigation'
import { deriveOnboardingJourneyRows } from '@/components/servicing/OnboardingJourneysTable'
import { visibleOnboardingJourneyActions } from '@/utils/onboardingJourneyActionTree'
import { OperationalStatusPill } from '@/components/servicing/operationalStatusPill'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown } from 'lucide-react'
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@/components/ui/data-table'
import { AdvisorReviewerPerspectiveCard } from '@/components/wizard/AdvisorReviewerPerspectiveCard'
import type { JourneyAction, JourneyStatus } from '@/types/servicing'
import {
  deriveOnboardingParentOperationalSummary,
  getOnboardingActionStatusDisplay,
  getOnboardingGenericStatusDisplay,
} from '@/utils/onboardingActionStatus'

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <div className={`h-1 w-16 rounded-full bg-border overflow-hidden ${className ?? ''}`}>
      <div
        className="h-full rounded-full bg-foreground/30 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

const allColumns = ['name', 'relationshipName', 'status', 'assignedTo', 'createdAt', 'progress']

function renderOnboardingStatusPill({
  label,
  className,
  pillVariant,
}: {
  label: string
  className: string
  pillVariant?: 'draft' | 'completed' | 'declined'
}) {
  return (
    <OperationalStatusPill
      variant={pillVariant}
      label={label}
      className={className}
      showIcon={Boolean(pillVariant)}
    />
  )
}

function isDescendantOfAction(
  candidate: JourneyAction,
  ancestorId: string,
  actionsById: Map<string, JourneyAction>,
): boolean {
  let currentParentId = candidate.parentActionId
  while (currentParentId) {
    if (currentParentId === ancestorId) return true
    currentParentId = actionsById.get(currentParentId)?.parentActionId
  }
  return false
}

export function OnboardingJourneyDetailPage() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()
  const { onboardingJourneys } = useServicing()
  const { showNestedGroups, hideKycChildWorkflows } = useTheme()
  const { navigateToServicing } = useJourneyNavigation()
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set())

  const rows = useMemo(
    () =>
      deriveOnboardingJourneyRows(
        onboardingJourneys,
        hideKycChildWorkflows,
        hideKycChildWorkflows,
      ),
    [onboardingJourneys, hideKycChildWorkflows],
  )
  const row = rows.find((r) => r.id === journeyId)

  const toggleExpanded = (id: string) => {
    const next = new Set(expandedGroupIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedGroupIds(next)
  }

  if (!row) {
    return (
      <>
        <AppShell>
          <div className="max-w-6xl mx-auto">
            <p className="text-muted-foreground">Journey not found.</p>
            <Link to="/onboarding" className="text-sm text-primary underline mt-2 inline-block">
              Back to Onboarding
            </Link>
          </div>
        </AppShell>
        <AdvisorReviewerPerspectiveCard />
      </>
    )
  }

  const vis = (_key: string) => true
  const colCount = allColumns.length
  const journeyPct = row.totalTasks > 0 ? row.progressedTasks / row.totalTasks : 0
  const actions = visibleOnboardingJourneyActions(
    row.actions,
    hideKycChildWorkflows,
    hideKycChildWorkflows,
  )
  const actionsById = new Map(actions.map((action) => [action.id, action] as const))
  const journeyLeafRows = actions.filter((action) => action.childId)
  const journeyStatusDisplay =
    deriveOnboardingParentOperationalSummary(journeyLeafRows) ??
    getOnboardingGenericStatusDisplay(row.status as JourneyStatus)

  return (
    <>
      <AppShell>
        <div className="max-w-6xl mx-auto">
        <div className="mb-1">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <Link to="/onboarding" className="hover:text-foreground transition-colors">
              Onboarding
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{row.name}</span>
          </nav>
        </div>

        <div className="flex items-center justify-between mb-6">
          <PageTitle
            title={row.name}
            subHead={`${row.relationshipName} · ${row.assignedTo}`}
          />
          <div className="flex items-center gap-3">
            {renderOnboardingStatusPill(journeyStatusDisplay)}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{row.progressedTasks}/{row.totalTasks}</span>
              <ProgressBar value={journeyPct} />
            </div>
          </div>
        </div>

        <DataTable>
          <thead>
            <tr>
              <DataTableHeader style={{ width: 200 }}>Action</DataTableHeader>
              <DataTableHeader>Relationship</DataTableHeader>
              <DataTableHeader>Status</DataTableHeader>
              <DataTableHeader>Assigned To</DataTableHeader>
              <DataTableHeader>Created</DataTableHeader>
              <DataTableHeader align="end">Progress</DataTableHeader>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
            {actions
              .filter((action) => !action.parentActionId)
              .flatMap((action) => {
                const childActions = actions.filter((a) => a.parentActionId === action.id)
                const actionLeafRows = actions.filter(
                  (candidate) => candidate.childId && isDescendantOfAction(candidate, action.id, actionsById),
                )
                const actionStatusDisplay =
                  deriveOnboardingParentOperationalSummary(actionLeafRows) ??
                  getOnboardingGenericStatusDisplay(action.status)
                const actionTotal = action.tasks.length
                const actionDone = action.tasks.filter((t) => t.status !== 'not_started').length
                const actionPct = actionTotal > 0 ? actionDone / actionTotal : 0

                const nestedChildRows = childActions.flatMap((childAction) => {
                    const grandchildActions = actions.filter((a) => a.parentActionId === childAction.id && !a.groupType)
                    const groupActions = actions.filter((a) => a.parentActionId === childAction.id && a.groupType)
                    if (grandchildActions.length === 0 && groupActions.length === 0) return []
                    return [
                      <tr
                        key={`section-${childAction.id}`}
                        className=""
                      >
                        <td colSpan={colCount} className="pt-4 pb-2 pl-5 pr-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">
                            {childAction.title}
                          </span>
                        </td>
                      </tr>,

                      ...grandchildActions.flatMap((gc) => {
                        const gcStatusDisplay = getOnboardingActionStatusDisplay(
                          gc.displayStatus,
                          gc.status === 'complete' ? 'Complete' : undefined,
                        )
                        const gcGroups = actions.filter((a) => a.parentActionId === gc.id && a.groupType)
                        return [
                          <DataTableRow
                            key={`action-${gc.id}`}
                            className="cursor-pointer hover:bg-muted/50"
                            border={false}
                            onClick={() => navigateToServicing(row, childAction.id, gc.childId)}
                          >
                            <DataTableCell type="primary" className="text-foreground/75">
                              {gc.title}
                            </DataTableCell>
                            <DataTableCell />
                            <DataTableCell type="badge">
                              {renderOnboardingStatusPill(gcStatusDisplay)}
                            </DataTableCell>
                            <DataTableCell />
                            <DataTableCell />
                            <DataTableCell align="end" type="secondary">
                              <div className="flex items-center justify-end gap-2">
                                <span>{gc.tasks.filter((t) => t.status !== 'not_started').length}/{gc.tasks.length}</span>
                                <ProgressBar value={gc.tasks.length > 0 ? gc.tasks.filter((t) => t.status !== 'not_started').length / gc.tasks.length : 0} />
                              </div>
                            </DataTableCell>
                          </DataTableRow>,

                          ...(showNestedGroups ? gcGroups : []).flatMap((group) => {
                            const groupChildren = actions.filter((a) => a.parentActionId === group.id)
                            if (groupChildren.length === 0) return []
                            const isGroupExpanded = expandedGroupIds.has(group.id)
                            const groupTotal = groupChildren.reduce((s, a) => s + a.tasks.length, 0)
                            const groupDone = groupChildren.reduce((s, a) => s + a.tasks.filter((t) => t.status !== 'not_started').length, 0)
                            const groupPct = groupTotal > 0 ? groupDone / groupTotal : 0
                            return [
                              <DataTableRow
                                key={`group-${group.id}`}
                                className="cursor-pointer hover:bg-muted/50"
                                border={false}
                                onClick={() => toggleExpanded(group.id)}
                              >
                                <DataTableCell type="primary" className="pt-1 text-[13px]">
                                  <div className="flex items-center gap-2 font-medium text-foreground/65">
                                    <span className="h-5 w-5 flex items-center justify-center shrink-0">
                                      {isGroupExpanded
                                        ? <ChevronDown className="h-3.5 w-3.5" />
                                        : <ChevronRight className="h-3.5 w-3.5" />}
                                    </span>
                                    {group.title}
                                  </div>
                                </DataTableCell>
                                <DataTableCell />
                                <DataTableCell />
                                <DataTableCell />
                                <DataTableCell />
                                <DataTableCell align="end" type="secondary">
                                  <div className="flex items-center justify-end gap-2">
                                    <span>{groupDone}/{groupTotal}</span>
                                    <ProgressBar value={groupPct} />
                                  </div>
                                </DataTableCell>
                              </DataTableRow>,

                              ...(isGroupExpanded ? groupChildren.map((gc2) => {
                                const gc2StatusDisplay = getOnboardingActionStatusDisplay(
                                  gc2.displayStatus,
                                  gc2.status === 'complete' ? 'Complete' : undefined,
                                )
                                return (
                                  <DataTableRow
                                    key={`action-${gc2.id}`}
                                    className="cursor-pointer hover:bg-muted/50"
                                    border={false}
                                    onClick={() => navigateToServicing(row, childAction.id, gc2.childId)}
                                  >
                                    <DataTableCell type="primary" className="pl-[48px] text-[13px] text-foreground/65">
                                      {gc2.title}
                                    </DataTableCell>
                                    <DataTableCell />
                                    <DataTableCell type="badge">
                                      {renderOnboardingStatusPill(gc2StatusDisplay)}
                                    </DataTableCell>
                                    <DataTableCell />
                                    <DataTableCell />
                                    <DataTableCell align="end" type="secondary">
                                      <div className="flex items-center justify-end gap-2">
                                        <span>{gc2.tasks.filter((t) => t.status !== 'not_started').length}/{gc2.tasks.length}</span>
                                        <ProgressBar value={gc2.tasks.length > 0 ? gc2.tasks.filter((t) => t.status !== 'not_started').length / gc2.tasks.length : 0} />
                                      </div>
                                    </DataTableCell>
                                  </DataTableRow>
                                )
                              }) : []),
                            ]
                          }),
                        ]
                      }),

                      ...(showNestedGroups ? groupActions : []).flatMap((group) => {
                        const groupChildren = actions.filter((a) => a.parentActionId === group.id)
                        if (groupChildren.length === 0) return []
                        const isGroupExpanded = expandedGroupIds.has(group.id)
                        const groupTotal = groupChildren.reduce((s, a) => s + a.tasks.length, 0)
                        const groupDone = groupChildren.reduce((s, a) => s + a.tasks.filter((t) => t.status !== 'not_started').length, 0)
                        const groupPct = groupTotal > 0 ? groupDone / groupTotal : 0
                        return [
                          <DataTableRow
                            key={`group-${group.id}`}
                            className="cursor-pointer hover:bg-muted/50"
                            border={false}
                            onClick={() => toggleExpanded(group.id)}
                          >
                            <DataTableCell type="primary" className="pt-1 text-[13px]">
                              <div className="flex items-center gap-2 font-medium text-foreground/65">
                                <span className="h-5 w-5 flex items-center justify-center shrink-0">
                                  {isGroupExpanded
                                    ? <ChevronDown className="h-3.5 w-3.5" />
                                    : <ChevronRight className="h-3.5 w-3.5" />}
                                </span>
                                {group.title}
                              </div>
                            </DataTableCell>
                            <DataTableCell />
                            <DataTableCell />
                            <DataTableCell />
                            <DataTableCell />
                            <DataTableCell align="end" type="secondary">
                              <div className="flex items-center justify-end gap-2">
                                <span>{groupDone}/{groupTotal}</span>
                                <ProgressBar value={groupPct} />
                              </div>
                            </DataTableCell>
                          </DataTableRow>,

                          ...(isGroupExpanded ? groupChildren.map((gc2) => {
                            const gc2StatusDisplay = getOnboardingActionStatusDisplay(
                              gc2.displayStatus,
                              gc2.status === 'complete' ? 'Complete' : undefined,
                            )
                            return (
                              <DataTableRow
                                key={`action-${gc2.id}`}
                                className="cursor-pointer hover:bg-muted/50"
                                border={false}
                                onClick={() => navigateToServicing(row, childAction.id, gc2.childId)}
                              >
                                <DataTableCell type="primary" className="text-foreground/75">
                                  {gc2.title}
                                </DataTableCell>
                                <DataTableCell />
                                <DataTableCell type="badge">
                                  {renderOnboardingStatusPill(gc2StatusDisplay)}
                                </DataTableCell>
                                <DataTableCell />
                                <DataTableCell />
                                <DataTableCell align="end" type="secondary">
                                  <div className="flex items-center justify-end gap-2">
                                    <span>{gc2.tasks.filter((t) => t.status !== 'not_started').length}/{gc2.tasks.length}</span>
                                    <ProgressBar value={gc2.tasks.length > 0 ? gc2.tasks.filter((t) => t.status !== 'not_started').length / gc2.tasks.length : 0} />
                                  </div>
                                </DataTableCell>
                              </DataTableRow>
                            )
                          }) : []),
                        ]
                      }),
                    ]
                  })

                return [
                  <DataTableRow
                    key={`action-${action.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    border={false}
                    onClick={() => navigateToServicing(row, action.id)}
                  >
                    <DataTableCell type="primary" className="font-medium text-foreground/90">
                      {action.title}
                    </DataTableCell>
                    <DataTableCell />
                    <DataTableCell type="badge">
                      {renderOnboardingStatusPill(actionStatusDisplay)}
                    </DataTableCell>
                    <DataTableCell />
                    <DataTableCell />
                    <DataTableCell align="end" type="secondary">
                      <div className="flex items-center justify-end gap-2">
                        <span>{actionDone}/{actionTotal}</span>
                        <ProgressBar value={actionPct} />
                      </div>
                    </DataTableCell>
                  </DataTableRow>,

                  ...nestedChildRows,
                ]
              })}
          </tbody>
        </DataTable>
        </div>
      </AppShell>
      <AdvisorReviewerPerspectiveCard />
    </>
  )
}
