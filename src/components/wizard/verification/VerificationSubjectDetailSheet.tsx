import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { shouldPreventSheetDismissForPerspective } from '@/utils/demoPerspectiveControl'

function preventDismissIfPerspective(event: Event) {
  if (shouldPreventSheetDismissForPerspective(event)) {
    event.preventDefault()
  }
}

export function VerificationSubjectDetailSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        forceBackdrop
        className="z-50 flex h-full w-full max-h-screen flex-col gap-0 p-0 sm:max-w-lg"
        onInteractOutside={preventDismissIfPerspective}
        onPointerDownOutside={preventDismissIfPerspective}
        onFocusOutside={preventDismissIfPerspective}
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-border px-6 pb-4 pr-14 pt-6 text-left">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-6 pb-12">
          <div className="space-y-4">{children}</div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
