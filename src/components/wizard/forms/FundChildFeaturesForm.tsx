import { useState, useMemo } from 'react'
import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FeatureServiceLinePickerDialog } from '@/components/wizard/forms/FeatureServiceLinePickerDialog'
import { spawnFeatureServiceLineChildren, type FeatureServiceLineRowInput } from '@/utils/spawnFeatureServiceLineChildren'
import { getSubTaskIndexByFormKey } from '@/utils/childTaskRegistry'
import { LayoutGrid, Plus } from 'lucide-react'
import type { ChildTask } from '@/types/workflow'
import { ChildActionKebabMenu } from '@/components/wizard/ChildActionKebabMenu'
import { ChildActionTimelineSheet } from '@/components/wizard/ChildActionTimelineSheet'
import { childStatusConfig, deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import { cn } from '@/lib/utils'

/**
 * Hub step (per account child): list account feature / service workflows—mirrors Funding & asset movement on the same account.
 */
export function FundChildFeaturesForm() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [timelineChild, setTimelineChild] = useState<ChildTask | null>(null)

  const openAccountsTask = state.tasks.find((t) => t.formKey === 'open-accounts')
  const featuresSubTaskIndex = getSubTaskIndexByFormKey('account-opening', 'acct-child-features-services')

  const linesForAccount = useMemo(() => {
    if (!openAccountsTask?.children || !ctx?.child.id) return []
    return openAccountsTask.children.filter((c) => {
      if (c.childType !== 'feature-service-line') return false
      const pid = (state.taskData[c.id] as Record<string, unknown> | undefined)?.parentAccountChildId as
        | string
        | undefined
      return pid === ctx.child.id
    })
  }, [openAccountsTask, ctx, state.taskData])

  if (!ctx || ctx.child.childType !== 'account-opening') {
    return <p className="text-sm text-muted-foreground">Open this step from account opening.</p>
  }

  if (!openAccountsTask) {
    return <p className="text-sm text-muted-foreground">Open Accounts task not found.</p>
  }

  const handleConfirm = (rows: FeatureServiceLineRowInput[]) => {
    spawnFeatureServiceLineChildren(dispatch, openAccountsTask.id, ctx.child.id, rows)
    setPickerOpen(false)
  }

  const enterLine = (line: ChildTask) => {
    dispatch({
      type: 'ENTER_CHILD_ACTION',
      childId: line.id,
      subTaskIndex: 0,
      resumeAfterExit: { accountChildId: ctx.child.id, subTaskIndex: featuresSubTaskIndex },
    })
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Account features & services
            </h3>
          </div>
          {linesForAccount.length > 0 && (
            <Button variant="outline" size="sm" type="button" onClick={() => setPickerOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add More
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          <span className="font-medium text-foreground">Margin</span> and{' '}
          <span className="font-medium text-foreground">options</span> are requested on the{' '}
          <span className="font-medium text-foreground">Account &amp; owners</span> step for this account—not here. Use
          this list for service-style workflows (eDelivery, Corestone, SelectLink, etc.).
        </p>

        {linesForAccount.length > 0 ? (
          <div className="space-y-2">
            {linesForAccount.map((line) => (
              <div
                key={line.id}
                className="group flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => enterLine(line)}
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                  </div>
                  <span className="text-sm font-medium truncate">{line.name}</span>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  {(() => {
                    const displayStatus = deriveChildDisplayStatus(line.status)
                    const cfg = childStatusConfig[displayStatus]
                    return (
                      <Badge
                        variant="outline"
                        className={cn('text-xs capitalize group-hover:hidden', cfg.className)}
                      >
                        {cfg.label}
                      </Badge>
                    )
                  })()}
                  <div className="hidden group-hover:block">
                    <ChildActionKebabMenu
                      onViewDetails={() => setTimelineChild(line)}
                      onDelete={() =>
                        dispatch({
                          type: 'REMOVE_CHILD',
                          parentTaskId: openAccountsTask.id,
                          childId: line.id,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <LayoutGrid className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground mb-3">
              No feature or service workflows yet. Add administrative, setup, or lifecycle items for this account (not
              transactional movements—those are under Funding & asset movement).
            </p>
            <Button type="button" onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add features & services
            </Button>
          </div>
        )}

        <FeatureServiceLinePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onConfirm={handleConfirm} />
      </section>

      <ChildActionTimelineSheet
        open={!!timelineChild}
        onOpenChange={(open) => !open && setTimelineChild(null)}
        child={timelineChild}
      />
    </div>
  )
}
