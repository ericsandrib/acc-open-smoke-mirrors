import type { ReactNode } from 'react'
import { useWizardRightPanel } from '@/components/wizard/wizardRightPanelContext'
import { cn } from '@/lib/utils'

type CollapsibleRightPanelProps = {
  title: string
  children: ReactNode
  /** Extra class on the scrollable body (e.g. padding overrides). */
  bodyClassName?: string
}

/**
 * Collapses to zero width with no visible border. Toggle lives in the wizard
 * accessory bar (RightSidebarToggle) — this panel doesn't render its own.
 *
 * Animation (per Emil Kowalski's design-eng principles):
 * - Width and border-color transition together (200ms ease-out).
 * - Content opacity has a 200ms delay only when opening, so the panel widens
 *   first and then content fades in. Close is symmetric-immediate (no delay)
 *   for snappy feedback.
 * - Honors prefers-reduced-motion.
 */
export function CollapsibleRightPanel({
  title,
  children,
  bodyClassName,
}: CollapsibleRightPanelProps) {
  const { collapsed } = useWizardRightPanel()

  return (
    <aside
      id="wizard-right-panel"
      className={cn(
        'shrink-0 overflow-hidden bg-white border-l border-l-transparent flex flex-col min-h-0 h-full',
        'transition-[width,border-color] duration-200 ease-out motion-reduce:transition-none',
        collapsed ? 'w-0' : 'w-64 border-l-border',
      )}
      aria-label={title}
      aria-hidden={collapsed}
    >
      <div
        className={cn(
          'flex flex-col w-64 min-h-0 h-full transition-opacity duration-150 ease-out motion-reduce:transition-none',
          collapsed ? 'opacity-0' : 'opacity-100 delay-200',
        )}
      >
        <div className="flex h-14 items-center px-3 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {title}
          </h3>
        </div>
        <div
          className={cn(
            'flex-1 min-h-0 overflow-y-auto text-sm',
            bodyClassName ?? 'p-4',
          )}
        >
          {children}
        </div>
      </div>
    </aside>
  )
}
