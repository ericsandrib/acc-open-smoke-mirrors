import { useNavigate } from 'react-router-dom'
import { Briefcase, ChevronLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkflow } from '@/stores/workflowStore'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function OwnerAvatar({ name }: { name?: string }) {
  const initials = name ? getInitials(name) : ''
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold"
      role="img"
      aria-label={name ? `Assigned to ${name}` : 'Unassigned'}
      title={name ?? 'Unassigned'}
    >
      {initials || <User className="h-3 w-3" aria-hidden />}
    </span>
  )
}

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
      <div className="flex h-14 items-center gap-2 px-3 border-b border-border">
        <h2 className="flex-1 truncate text-sm font-semibold text-foreground">
          {state.journeyName ?? 'Client Onboarding'}
        </h2>
        <OwnerAvatar name={state.assignedTo} />
      </div>
    </div>
  )
}
