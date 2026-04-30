import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

export function AdvisorViewFooter() {
  const { state, dispatch } = useWorkflow()
  const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
  const isFirst = idx === 0
  const isLast = idx === state.flatTaskOrder.length - 1

  return (
    <footer className="border-t border-border bg-background px-6 py-3 min-h-14 flex justify-between items-center shrink-0 box-border">
      <div className="max-w-[52.5rem] mx-auto w-full flex items-center justify-between">
        <div>
          {!isFirst && (
            <Button variant="outline" onClick={() => dispatch({ type: 'GO_BACK' })}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Submitted for home office review at {state.submittedAt ?? 'N/A'}</span>
          </div>
          {!isLast && (
            <Button onClick={() => dispatch({ type: 'GO_NEXT' })}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </footer>
  )
}
