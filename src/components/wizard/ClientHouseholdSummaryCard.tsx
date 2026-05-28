import { useMemo } from 'react'
import { Briefcase, ExternalLink, MoreVertical, Users } from 'lucide-react'
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
  formatUsdCompact,
  sumHouseholdEstimatedAssets,
} from '@/utils/childActionClientDetails'

/** Household identity card shared by child and parent journey RHS panels. */
export function ClientHouseholdSummaryCard() {
  const { state } = useWorkflow()

  const householdName = useMemo(
    () => buildHouseholdDisplayName(state.relatedParties, state.journeyName),
    [state.relatedParties, state.journeyName],
  )
  const joinedLabel = formatHouseholdJoinedLabel(state.journeyStartedAt)
  const assetsLabel = formatUsdCompact(sumHouseholdEstimatedAssets(state.financialAccounts))

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-base font-semibold text-foreground leading-snug">{householdName}</p>
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="text-sm text-muted-foreground">{joinedLabel}</p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          <Users className="h-5 w-5" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-foreground">
        <Briefcase className="h-4 w-4 text-muted-foreground" aria-hidden />
        {assetsLabel}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8 flex-1 bg-background">
          View Team
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-8 flex-1 gap-1.5 bg-background">
          View More
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 bg-background"
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
