import { useNavigate } from 'react-router-dom'
import { Briefcase, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkflow } from '@/stores/workflowStore'

/**
 * Top-of-sidebar header that establishes the active journey:
 * back button → 36×36 featured journey icon → journey title.
 *
 * Shared between the journey-level StepSidebar and the sub-action
 * ChildActionSidebar so the journey identity persists when drilling in.
 */
export function JourneyHeader() {
  const { state } = useWorkflow()
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex h-14 items-center px-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="flex h-14 items-center px-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-muted-foreground"
          aria-hidden
        >
          <Briefcase className="h-4 w-4" />
        </span>
      </div>
      <div className="px-3 pt-2 pb-4 mb-2 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          {state.journeyName ?? 'Client Onboarding'}
        </h2>
      </div>
    </div>
  )
}
