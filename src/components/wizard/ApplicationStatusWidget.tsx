import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getStageLabelSemantic,
  isTerminalStageLabel,
  statusSemanticClasses,
} from '@/utils/statusSemanticColors'

export type ApplicationStatusWidgetVariant = 'auto' | 'terminal' | 'active'

interface ApplicationStatusWidgetProps {
  /** User-visible stage label from `getActiveStageLabel`. */
  stageLabel: string
  /**
   * `'auto'` (default) renders the `'terminal'` treatment for the known terminal
   * stages (Pending Release / Complete / Rejected / Canceled) and `'active'`
   * for every in-flight stage.
   *
   * Pass `'terminal'` or `'active'` directly when you want to force one
   * treatment — e.g. in the `/test/application-widget` state matrix.
   */
  variant?: ApplicationStatusWidgetVariant
  className?: string
}

/**
 * Icon + label "header" of the Application Status card in the wizard's
 * ChildActionSidebar. Extracted so the same component renders in both the
 * production sidebar and the `/test/application-widget` sandbox.
 *
 * Two visual treatments share one semantic palette:
 *
 *  - **terminal** — solid filled box, icon inverted on the fill. For stages
 *    where the workflow has come to rest (success / failure / canceled).
 *  - **active** — faded tinted box, colored icon on the tint. For every
 *    in-flight or pre-flight stage.
 *
 * Bucket colors all resolve through `statusSemanticClasses` — no hex literals
 * at the call site, no per-stage one-off colors.
 */
export function ApplicationStatusWidget({
  stageLabel,
  variant = 'auto',
  className,
}: ApplicationStatusWidgetProps) {
  const semantic = getStageLabelSemantic(stageLabel)
  const classes = statusSemanticClasses[semantic]

  const resolvedVariant: 'terminal' | 'active' =
    variant === 'auto'
      ? isTerminalStageLabel(stageLabel)
        ? 'terminal'
        : 'active'
      : variant

  const boxClass = resolvedVariant === 'terminal' ? classes.solid : classes.pill
  const iconClass = resolvedVariant === 'terminal' ? classes.iconOnSolid : classes.icon

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
