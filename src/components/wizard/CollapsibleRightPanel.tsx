import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWizardRightPanel } from '@/components/wizard/wizardRightPanelContext'
import { cn } from '@/lib/utils'

type CollapsibleRightPanelProps = {
  title: string
  children: ReactNode
  /** Extra class on the scrollable body (e.g. padding overrides). */
  bodyClassName?: string
}

export function CollapsibleRightPanel({
  title,
  children,
  bodyClassName,
}: CollapsibleRightPanelProps) {
  const { collapsed, toggle } = useWizardRightPanel()

  if (collapsed) {
    return (
      <div
        className={cn(
          'flex flex-col shrink-0 w-9 border-l border-border bg-sidebar-background',
          'items-center py-2 min-h-0 h-full',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={toggle}
          aria-expanded={false}
          aria-label={`Expand ${title}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    )
  }

  return (
    <aside
      id="wizard-right-panel"
      className={cn(
        'w-64 shrink-0 border-l border-border bg-sidebar-background',
        'flex flex-col min-h-0 h-full',
      )}
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">
          {title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={toggle}
          aria-expanded={true}
          aria-controls="wizard-right-panel"
          aria-label={`Collapse ${title}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div
        className={cn(
          'flex-1 min-h-0 overflow-y-auto text-sm',
          bodyClassName ?? 'p-4',
        )}
      >
        {children}
      </div>
    </aside>
  )
}
