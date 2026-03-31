import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function WizardFooter() {
  const { state, dispatch } = useWorkflow()
  const idx = state.flatTaskOrder.indexOf(state.activeTaskId)
  const isFirst = idx === 0
  const isLast = idx === state.flatTaskOrder.length - 1

  // Resolve next task title for contextual CTA
  const nextTaskId = !isLast ? state.flatTaskOrder[idx + 1] : null
  const nextTask = nextTaskId
    ? state.tasks.find((t) => t.id === nextTaskId)
    : null
  const nextLabel = nextTask ? `Next: ${nextTask.title}` : 'Next'

  return (
    <footer className="border-t border-border bg-background px-6 py-3 flex justify-between items-center shrink-0">
      <Button
        variant="outline"
        onClick={() => dispatch({ type: 'GO_BACK' })}
        disabled={isFirst}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>
      <Button
        onClick={() => dispatch({ type: 'GO_NEXT' })}
        disabled={isLast}
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </footer>
  )
}
