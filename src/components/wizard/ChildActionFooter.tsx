import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ChildActionFooter() {
  const { dispatch } = useWorkflow()
  const ctx = useChildActionContext()

  if (!ctx) return null

  const { isFirst, isLast } = ctx

  return (
    <footer className="border-t border-border bg-background px-6 py-3 flex justify-between items-center shrink-0">
      <div>
        {!isFirst && (
          <Button
            variant="outline"
            onClick={() => dispatch({ type: 'CHILD_GO_BACK' })}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isLast ? (
          <Button onClick={() => dispatch({ type: 'EXIT_CHILD_ACTION' })}>
            Done
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => dispatch({ type: 'CHILD_GO_NEXT' })}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </footer>
  )
}
