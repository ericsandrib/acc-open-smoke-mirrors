import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getStageLabelSemantic,
  isTerminalStageLabel,
  statusSemanticClasses,
} from '@/utils/statusSemanticColors'

interface ApplicationStatusWidgetProps {
  /** User-visible stage label from `getActiveStageLabel`. */
  stageLabel: string
  className?: string
}

/**
 * Icon + label "header" of the Application Status card in the wizard's
 * ChildActionSidebar. Extracted so the same component renders in both the
 * production sidebar and the `/test/application-widget` sandbox.
 *
 * Each stage has exactly one visual treatment, determined by whether it's
 * terminal or active:
 *
 *  - **terminal** stages (Pending Release / Complete / Rejected / Canceled)
 *    render with a solid filled box and a reversed icon.
 *  - **active** stages (every in-flight or pre-flight stage) render with a
 *    faded tinted box and a colored icon.
 *
 * Both treatments resolve through `statusSemanticClasses` — no hex literals
 * or per-stage one-off colors at call sites.
 */
export function ApplicationStatusWidget({
  stageLabel,
  className,
}: ApplicationStatusWidgetProps) {
  const semantic = getStageLabelSemantic(stageLabel)
  const classes = statusSemanticClasses[semantic]
  const terminal = isTerminalStageLabel(stageLabel)

  const boxClass = terminal ? classes.solid : classes.pill
  const iconClass = terminal ? classes.iconOnSolid : classes.icon

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
          boxClass,
        )}
      >
        <FileText className={cn('h-4 w-4', iconClass)} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-none text-muted-foreground">
          Application Status
        </p>
        <p className="truncate text-[17px] font-semibold leading-[1.15] text-foreground">
          {stageLabel}
        </p>
      </div>
    </div>
  )
}
