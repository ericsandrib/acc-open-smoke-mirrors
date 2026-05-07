import { useNavigate } from 'react-router-dom'
import { Briefcase, ChevronLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
export function JourneyHeader({
  backLabel,
  onBack,
  onChevronBack,
  breadcrumbItems,
  showChevron = true,
  onIconClick,
  iconTooltip,
}: {
  backLabel?: string
  onBack?: () => void
  onChevronBack?: () => void
  breadcrumbItems?: Array<{ label: string; onClick?: () => void }>
  showChevron?: boolean
  onIconClick?: () => void
  iconTooltip?: string
} = {}) {
  const { state } = useWorkflow()
  const navigate = useNavigate()
  const showsBreadcrumbBack = typeof backLabel === 'string' && backLabel.trim().length > 0
  const hasBreadcrumbItems = Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0

  return (
    <div>
      <div className="flex h-14 items-center px-2">
        {hasBreadcrumbItems ? (
          <div className="flex h-8 items-center gap-1 text-xs text-muted-foreground min-w-0">
            {showChevron ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                onClick={onChevronBack ?? (() => navigate(-1))}
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            {breadcrumbItems.map((item, idx) => (
              <div key={`${item.label}-${idx}`} className="flex items-center min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={item.onClick}
                >
                  <span className="truncate">{item.label}</span>
                </Button>
                {idx < breadcrumbItems.length - 1 ? (
                  <span className="mx-0.5 shrink-0 text-muted-foreground/70" aria-hidden>
                    /
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : showsBreadcrumbBack ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-1.5 text-xs text-muted-foreground"
            onClick={onBack ?? (() => navigate(-1))}
            aria-label={`Back to ${backLabel}`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="truncate">{backLabel}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground"
            onClick={onBack ?? (() => navigate(-1))}
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
      <div className="flex h-14 items-center px-3">
        {onIconClick ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-md bg-[var(--bg-tertiary)] text-muted-foreground hover:bg-[var(--bg-tertiary)]"
                onClick={onIconClick}
                aria-label={iconTooltip ?? 'Onboarding'}
              >
                <Briefcase className="h-4 w-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{iconTooltip ?? 'Onboarding'}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-muted-foreground"
            aria-hidden
          >
            <Briefcase className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="flex h-14 items-center gap-2 px-3 border-b border-border">
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {state.journeyName ?? 'Client Onboarding'}
          </h2>
          <p className="truncate text-xs text-muted-foreground">Onboarding</p>
        </div>
        <OwnerAvatar name={state.assignedTo} />
      </div>
    </div>
  )
}
