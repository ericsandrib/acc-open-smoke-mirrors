import { useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTitle } from '@/components/page-title'
import { useServicing } from '@/stores/servicingStore'
import { useWorkflow } from '@/stores/workflowStore'
import { useTheme } from '@/stores/themeStore'
import { OnboardingJourneysTable, deriveOnboardingJourneyRows } from './OnboardingJourneysTable'
import { ActionsTable, deriveActionRows } from './ActionsTable'
import { DocumentReviewActionsTable } from './DocumentReviewActionsTable'
import { TasksTable, deriveTaskRows } from './TasksTable'
import { TableViewWrapper } from './table-view-wrapper'
import {
  journeyColumns,
  journeyPresets,
  actionColumns,
  actionPresetsForDemoView,
  actionVisibleColumnsJourneyGroupedShell,
  isReviewerWorkQueuePresetId,
  taskColumns,
  taskPresets,
} from '@/data/servicing-view-presets'

export function OnboardingContent() {
  const { onboardingJourneys, currentLiveJourney, lastCreatedJourneyId } = useServicing()
  const { state } = useWorkflow()
  const onboardingActionsHiddenColumns = useMemo(() => new Set(['reviewQueueItemType']), [])

  const pinRowId = useMemo(() => {
    if (onboardingJourneys.some((j) => j.id === lastCreatedJourneyId)) {
      return lastCreatedJourneyId
    }
    return currentLiveJourney?.id
  }, [onboardingJourneys, lastCreatedJourneyId, currentLiveJourney?.id])

  const { showNestedGroups, hideKycChildWorkflows } = useTheme()
  const journeyRows = useMemo(
    () =>
      deriveOnboardingJourneyRows(
        onboardingJourneys,
        hideKycChildWorkflows,
        hideKycChildWorkflows,
      ),
    [onboardingJourneys, hideKycChildWorkflows],
  )
  const actionRows = useMemo(
    () => deriveActionRows(onboardingJourneys, hideKycChildWorkflows),
    [onboardingJourneys, hideKycChildWorkflows],
  )
  const taskRows = useMemo(
    () => deriveTaskRows(onboardingJourneys, hideKycChildWorkflows),
    [onboardingJourneys, hideKycChildWorkflows],
  )
  const actionPresets = useMemo(() => actionPresetsForDemoView(state.demoViewMode), [state.demoViewMode])
  const onboardingActionColumns = useMemo(
    () => actionColumns.filter((column) => !onboardingActionsHiddenColumns.has(column.key)),
    [onboardingActionsHiddenColumns],
  )
  const onboardingActionPresets = useMemo(
    () =>
      actionPresets.map((preset) => ({
        ...preset,
        visibleColumns: preset.visibleColumns.filter(
          (columnKey) => !onboardingActionsHiddenColumns.has(columnKey),
        ),
      })),
    [actionPresets, onboardingActionsHiddenColumns],
  )
  const onboardingJourneyGroupedActionColumns = useMemo(
    () =>
      actionVisibleColumnsJourneyGroupedShell.filter(
        (columnKey) => !onboardingActionsHiddenColumns.has(columnKey),
      ),
    [onboardingActionsHiddenColumns],
  )
  /** One persist bucket for all reviewer teams so switching views keeps the selected tab. */
  const actionsTablePersistKey =
    (state.demoViewMode ?? 'advisor') === 'advisor' ? 'advisor' : 'reviewer'
  /** Advisor + reviewer: Actions defaults to journey grouping (toggle to flat list in toolbar). */
  const defaultActionsGroupBy = 'parentJourneyId' as const
  const isAdvisor = actionsTablePersistKey === 'advisor'
  const defaultOnboardingTab = isAdvisor ? 'journeys' : 'actions'

  return (
    <div className="max-w-6xl mx-auto">
      {/*
        Do not key Tabs by demo view: remounting resets the tab to defaultValue and jumps Journeys ↔ Actions
        when switching advisor vs reviewer teams. defaultValue only applies on first mount (e.g. route to
        /onboarding); all teams can use every tab after that.
      */}
      <Tabs defaultValue={defaultOnboardingTab}>
        <div className="flex items-center justify-between mb-6">
          <PageTitle
            title="Onboarding"
            subHead="Track client onboarding journeys, actions, and tasks."
          />
          <TabsList variant="elevated">
            <TabsTrigger value="journeys">Journeys</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="journeys">
          <TableViewWrapper
            tableId="onboarding-journeys"
            presets={journeyPresets}
            columns={journeyColumns}
            allRows={journeyRows}
            defaultRelationshipScope="all"
            pinRowId={pinRowId}
          >
            {({ rows, visibleColumns }) => (
              <OnboardingJourneysTable
                rows={rows}
                visibleColumns={visibleColumns}
                showNestedGroups={showNestedGroups}
                hideKyc={hideKycChildWorkflows}
                hideAccountChildWorkflows={hideKycChildWorkflows}
              />
            )}
          </TableViewWrapper>
        </TabsContent>
        <TabsContent value="actions">
          <TableViewWrapper
            tableId={`onboarding-actions-${actionsTablePersistKey}`}
            presets={onboardingActionPresets}
            columns={onboardingActionColumns}
            allRows={actionRows}
            defaultRelationshipScope="all"
            showGroupBy
            defaultGroupBy={defaultActionsGroupBy}
          >
            {({ rows, visibleColumns, activeViewId, groupBy }) => {
              const onboardingVisibleColumns = visibleColumns.filter(
                (columnKey) => !onboardingActionsHiddenColumns.has(columnKey),
              )
              const reviewerQueue = Boolean(activeViewId && isReviewerWorkQueuePresetId(activeViewId))
              const advisorJourneyGrouped = isAdvisor && groupBy === 'parentJourneyId'

              /** Reviewer status tabs (All / In Progress / Completed): flat child-workflow rows, no journey headers. */
              if (!isAdvisor) {
                const flatStatusTab = !reviewerQueue
                const reviewerRows = flatStatusTab
                  ? rows.filter((r) => r.isChildWorkflow && r.childId)
                  : rows
                return (
                  <DocumentReviewActionsTable
                    rows={reviewerRows}
                    visibleColumns={onboardingVisibleColumns}
                    journeys={onboardingJourneys}
                    statusMode="onboarding"
                    groupBy={flatStatusTab ? 'none' : (groupBy ?? 'parentJourneyId')}
                    nestRowMode="pipeline"
                    hideKycChildWorkflows={hideKycChildWorkflows}
                    pinJourneyId={pinRowId}
                  />
                )
              }

              if (advisorJourneyGrouped) {
                return (
                  <DocumentReviewActionsTable
                    rows={rows}
                    visibleColumns={onboardingJourneyGroupedActionColumns}
                    journeys={onboardingJourneys}
                    statusMode="onboarding"
                    groupBy={groupBy}
                    nestRowMode="allChildWorkflows"
                    showNestedFundingGroups
                    hideKycChildWorkflows={hideKycChildWorkflows}
                    pinJourneyId={pinRowId}
                  />
                )
              }
              return (
                <ActionsTable
                  rows={rows}
                  visibleColumns={onboardingVisibleColumns}
                  statusMode="onboarding"
                  groupBy={groupBy}
                  pinJourneyId={pinRowId}
                />
              )
            }}
          </TableViewWrapper>
        </TabsContent>
        <TabsContent value="tasks">
          <TableViewWrapper tableId="onboarding-tasks" presets={taskPresets} columns={taskColumns} allRows={taskRows} defaultRelationshipScope="all">
            {({ rows, visibleColumns }) => (
              <TasksTable rows={rows} visibleColumns={visibleColumns} />
            )}
          </TableViewWrapper>
        </TabsContent>
      </Tabs>
    </div>
  )
}
