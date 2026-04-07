import { useMemo } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { computeWorkflowMissingData } from '@/utils/workflowMissingData'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function MissingDataSection({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const { state, dispatch } = useWorkflow()
  const entries = useMemo(() => computeWorkflowMissingData(state), [state])
  const compact = variant === 'compact'

  if (entries.length === 0) {
    return (
      <div
        className={cn(
          'rounded-md border border-border bg-muted/20 px-3 py-2',
          compact ? 'text-[11px]' : 'text-xs',
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" aria-hidden />
          <span>No outstanding items across tasks.</span>
        </div>
      </div>
    )
  }

  return (
    <Collapsible defaultOpen className="rounded-md border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
      <CollapsibleTrigger
        className={cn(
          'group flex w-full items-center justify-between gap-2 px-3 py-2 text-left rounded-md hover:bg-amber-100/60 dark:hover:bg-amber-950/30 outline-none focus-visible:ring-2 focus-visible:ring-ring',
          compact ? 'text-xs' : 'text-sm',
        )}
      >
        <span className="flex items-center gap-2 font-medium text-foreground">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden />
          Missing data
          <span className="text-muted-foreground font-normal tabular-nums">({entries.length})</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn('px-3 pb-3 space-y-2.5 overflow-hidden', compact ? 'max-h-44 overflow-y-auto' : 'max-h-72 overflow-y-auto')}
      >
        {entries.map((e) => (
          <div
            key={e.taskId}
            className="rounded-md border border-border bg-background/90 p-2.5 space-y-1.5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={cn('font-medium text-foreground truncate', compact ? 'text-[11px]' : 'text-xs')}>
                  {e.taskTitle}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{e.actionTitle}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 text-[10px] shrink-0 px-2"
                onClick={(ev) => {
                  ev.preventDefault()
                  dispatch({ type: 'GO_TO_TASK', taskId: e.taskId })
                }}
              >
                Go to task
              </Button>
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] leading-snug text-muted-foreground">
              {e.issues.map((issue, i) => (
                <li key={i} className="text-foreground/90">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
