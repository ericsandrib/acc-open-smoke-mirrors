import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type ComplianceModalTone = 'warning' | 'destructive'

const headerToneClass: Record<ComplianceModalTone, string> = {
  warning: 'border-b border-amber-200/80 bg-amber-50/90',
  destructive: 'border-b border-red-200/70 bg-red-50/80',
}

const iconWrapToneClass: Record<ComplianceModalTone, string> = {
  warning: 'rounded-full bg-amber-100 p-2 shrink-0 ring-1 ring-amber-200/80',
  destructive: 'rounded-full bg-red-100/90 p-2 shrink-0 ring-1 ring-red-200/70',
}

interface ComplianceModalShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tone: ComplianceModalTone
  icon: ReactNode
  title: string
  description: ReactNode
  children: ReactNode
  footer: ReactNode
  contentClassName?: string
}

/** Shared layout for compliance acknowledgment and disposition modals. */
export function ComplianceModalShell({
  open,
  onOpenChange,
  tone,
  icon,
  title,
  description,
  children,
  footer,
  contentClassName,
}: ComplianceModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'sm:max-w-lg gap-0 p-0 overflow-hidden data-[state=open]:!animate-none data-[state=closed]:!animate-none !duration-0',
          contentClassName,
        )}
      >
        <div className={cn('px-6 py-5', headerToneClass[tone])}>
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className={iconWrapToneClass[tone]} aria-hidden>
                {icon}
              </div>
              <div className="space-y-1.5 min-w-0">
                <DialogTitle className="text-base font-semibold text-foreground">{title}</DialogTitle>
                <DialogDescription className="text-sm text-foreground/80 leading-relaxed">
                  {description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">{children}</div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4 sm:justify-end gap-2">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
