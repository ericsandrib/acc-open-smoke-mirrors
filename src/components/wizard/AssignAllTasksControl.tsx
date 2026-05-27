import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AssigneeSearchMenuContent } from '@/components/wizard/AssigneeQuickAssignMenu'
import {
  captureJourneyAssigneeSnapshot,
  restoreJourneyAssigneeSnapshot,
  showAssigneeUpdatedToast,
} from '@/utils/assigneeAssignUndo'

type AssignAllTasksControlProps = {
  /** Extra classes on the outer footer strip (e.g. omit top border when stacked). */
  className?: string
}

export function AssignAllTasksControl({ className }: AssignAllTasksControlProps) {
  const { state, dispatch } = useWorkflow()
  const [assignAllOpen, setAssignAllOpen] = useState(false)

  return (
    <div
      className={cn(
        'w-full min-w-0 border-t border-border px-3 py-3.5 shrink-0 mt-auto bg-background',
        className,
      )}
    >
      <div className="ml-auto w-fit max-w-full shrink-0">
        <Popover
          open={assignAllOpen}
          onOpenChange={setAssignAllOpen}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit shrink-0 px-3"
              aria-label="Assign all tasks to an advisor"
            >
              Assign All
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            sideOffset={8}
            className="w-[min(280px,calc(100vw-1.5rem))] p-1 shadow-lg"
          >
            {assignAllOpen ? (
              <AssigneeSearchMenuContent
                selectedAssignee={state.assignedTo}
                searchPlaceholder="Assign all tasks to..."
                onSelect={(name) => {
                  const snapshot = captureJourneyAssigneeSnapshot(state)
                  dispatch({ type: 'SET_JOURNEY_ASSIGNEE', assignee: name })
                  setAssignAllOpen(false)
                  window.setTimeout(() => {
                    showAssigneeUpdatedToast(
                      `Assigned to ${name}.`,
                      restoreJourneyAssigneeSnapshot(dispatch, snapshot),
                    )
                  }, 0)
                }}
              />
            ) : null}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
