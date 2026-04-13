import { useState, useMemo } from 'react'
import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FundingLinePickerDialog } from '@/components/wizard/forms/FundingLinePickerDialog'
import { spawnFundingLineChildren, type FundingLineRowInput } from '@/utils/spawnFundingLineChildren'
import { getSubTaskIndexByFormKey } from '@/utils/childTaskRegistry'
import { Banknote, Plus } from 'lucide-react'
import type { ChildTask } from '@/types/workflow'
import { ChildActionKebabMenu } from '@/components/wizard/ChildActionKebabMenu'
import { ChildActionTimelineSheet } from '@/components/wizard/ChildActionTimelineSheet'
import { childStatusConfig, deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import { cn } from '@/lib/utils'

/**
 * Hub step (per account child): list funding / account transfer workflows—mirrors "Accounts to be Opened" on Open Accounts.
 */
export function FundChildFundingForm() {
  const { state, dispatch } = useWorkflow()
  const ctx = useChildActionContext()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [timelineChild, setTimelineChild] = useState<ChildTask | null>(null)

  const openAccountsTask = state.tasks.find((t) => t.formKey === 'open-accounts')
  const fundingSubTaskIndex = getSubTaskIndexByFormKey('account-opening', 'acct-child-funding-transfers')

  const linesForAccount = useMemo(() => {
    if (!openAccountsTask?.children || !ctx?.child.id) return []
    return openAccountsTask.children.filter((c) => {
      if (c.childType !== 'funding-line') return false
      const pid = (state.taskData[c.id] as Record<string, unknown> | undefined)?.parentAccountChildId as
        | string
        | undefined
      return pid === ctx.child.id
    })
  }, [openAccountsTask?.children, ctx, state.taskData])

  if (!ctx || ctx.child.childType !== 'account-opening') {
    return <p className="text-sm text-muted-foreground">Open this step from account opening.</p>
  }

  if (!openAccountsTask) {
    return <p className="text-sm text-muted-foreground">Open Accounts task not found.</p>
  }

  const handleConfirm = (rows: FundingLineRowInput[]) => {
    spawnFundingLineChildren(dispatch, openAccountsTask.id, ctx.child.id, rows)
    setPickerOpen(false)
  }

  const enterLine = (line: ChildTask) => {
    dispatch({
      type: 'ENTER_CHILD_ACTION',
      childId: line.id,
      subTaskIndex: 0,
      resumeAfterExit: { accountChildId: ctx.child.id, subTaskIndex: fundingSubTaskIndex },
    })
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Funding & asset movement
            </h3>
          </div>
          {linesForAccount.length > 0 && (
            <Button variant="outline" size="sm" type="button" onClick={() => setPickerOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add More
            </Button>
          )}
        </div>

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
                    <Banknote className="h-4 w-4" aria-hidden />
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
            <Banknote className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground mb-3">
              No funding or asset movement workflows yet. Add how cash or positions should move for this account—ACH,
              transfers, wires, journals, standing instructions, and recurring mutual fund orders.
            </p>
            <Button type="button" onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add funding & asset movement
            </Button>
          </div>
        )}

        <FundingLinePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onConfirm={handleConfirm} />
      </section>

      <ChildActionTimelineSheet
        open={!!timelineChild}
        onOpenChange={(open) => !open && setTimelineChild(null)}
        child={timelineChild}
      />
    </div>
  )
}
