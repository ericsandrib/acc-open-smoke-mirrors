import { useMemo, useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { JOURNEY_BULK_ASSIGN_OPTIONS } from '@/data/journeyAssigneeDirectory'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Search, Check } from 'lucide-react'

type AssignAllTasksControlProps = {
  /** Extra classes on the outer footer strip (e.g. omit top border when stacked). */
  className?: string
}

export function AssignAllTasksControl({ className }: AssignAllTasksControlProps) {
  const { state, dispatch } = useWorkflow()
  const [assignAllOpen, setAssignAllOpen] = useState(false)
  const [assignAllQuery, setAssignAllQuery] = useState('')

  const assignAllFiltered = useMemo(() => {
    const q = assignAllQuery.trim().toLowerCase()
    if (!q) return [...JOURNEY_BULK_ASSIGN_OPTIONS]
    return JOURNEY_BULK_ASSIGN_OPTIONS.filter((m) => m.name.toLowerCase().includes(q))
  }, [assignAllQuery])

  return (
    <div
      className={cn(
        'w-full min-w-0 border-t border-border px-3 py-3 shrink-0 mt-auto bg-background',
        className,
      )}
    >
      <div className="ml-auto w-fit max-w-full shrink-0">
        <Popover
          open={assignAllOpen}
          onOpenChange={(open) => {
            setAssignAllOpen(open)
            if (!open) setAssignAllQuery('')
          }}
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
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1.5">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <Input
                  type="search"
                  autoComplete="off"
                  autoFocus
                  placeholder="Assign all tasks to..."
                  value={assignAllQuery}
                  onChange={(e) => setAssignAllQuery(e.target.value)}
                  className="h-7 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="Filter assignees"
                />
              </div>
              <div className="max-h-[220px] overflow-y-auto py-0.5">
                {assignAllFiltered.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
                ) : (
                  assignAllFiltered.map((m) => {
                    const selected = state.assignedTo === m.name
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-medium outline-none transition-colors',
                          'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
                        )}
                        onClick={() => {
                          dispatch({ type: 'SET_JOURNEY_ASSIGNEE', assignee: m.name })
                          setAssignAllOpen(false)
                          setAssignAllQuery('')
                          window.setTimeout(() => {
                            toast.success('Advisor updated', {
                              description: `Assigned to ${m.name}.`,
                              duration: 5000,
                            })
                          }, 0)
                        }}
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-primary/5 text-[10px] font-semibold text-primary"
                          aria-hidden
                        >
                          {m.initials}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{m.name}</span>
                        {selected ? (
                          <Check className="h-4 w-4 shrink-0 text-foreground" aria-label="Selected" />
                        ) : (
                          <span className="h-4 w-4 shrink-0" aria-hidden />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
