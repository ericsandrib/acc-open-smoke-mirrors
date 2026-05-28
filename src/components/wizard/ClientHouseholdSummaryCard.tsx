import { useMemo } from 'react'
import { ArrowUpRight, MoreVertical, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorkflow } from '@/stores/workflowStore'
import {
  buildHouseholdDisplayName,
  formatHouseholdJoinedLabel,
} from '@/utils/childActionClientDetails'

/** Household identity card shared by child and parent journey RHS panels. */
export function ClientHouseholdSummaryCard() {
  const { state } = useWorkflow()

  const householdName = useMemo(
    () => buildHouseholdDisplayName(state.relatedParties, state.journeyName),
    [state.relatedParties, state.journeyName],
  )
  const joinedLabel = formatHouseholdJoinedLabel(state.journeyStartedAt)

  return (
    <div className="rounded-xl bg-muted/40 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-base font-semibold text-foreground leading-snug">{householdName}</p>
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="text-xs text-muted-foreground">{joinedLabel}</p>
        </div>
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          <Users className="h-6 w-6" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" className="h-8 flex-1 shadow-none">
          View Team
        </Button>
        <Button type="button" variant="secondary" size="sm" className="h-8 flex-1 gap-1.5 shadow-none">
          View More
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 shrink-0 shadow-none"
              aria-label="More client actions"
            >
              <MoreVertical className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>Open client profile</DropdownMenuItem>
            <DropdownMenuItem disabled>View household members</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
