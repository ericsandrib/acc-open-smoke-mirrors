import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resolveEsignFormSampleWithFallback } from '@/constants/esignFormSamples'
import { FileDown, Files, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BundleDocItem = { id: string; label: string }

type Props = {
  items: BundleDocItem[]
  /** Shown on the open button */
  triggerLabel?: string
}

/**
 * Single dialog to browse all firm/custodian forms (demo: same PDF bytes, distinct labels / downloads).
 * Intended for the account documents step after eSign — executed copies only.
 */
export function EsignDocumentsBundleViewerButton({ items, triggerLabel = 'View all signed forms' }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const resolved = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        ...resolveEsignFormSampleWithFallback(it.id, it.label),
      })),
    [items],
  )

  const current = resolved[selectedIndex] ?? resolved[0]

  if (items.length === 0) return null

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setOpen(true)}>
        <Files className="h-3.5 w-3.5" />
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[min(92vh,880px)] max-h-[92vh] w-[min(96vw,64rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
          <DialogHeader className="shrink-0 border-b border-border px-5 pb-3 pt-10 text-left sm:px-6">
            <DialogTitle className="flex items-center gap-2 pr-8 text-base">
              <PanelLeft className="h-4 w-4 text-muted-foreground" />
              Signed firm / custodian forms
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-normal pt-1">
              Demo: fully executed package after client eSign. Draft templates are edited in the eSign envelope step —
              this viewer shows the signed record only.
            </p>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <nav
              className="flex max-h-[40vh] shrink-0 flex-col gap-0.5 overflow-y-auto border-b border-border bg-muted/30 p-2 sm:max-h-none sm:w-[220px] sm:border-b-0 sm:border-r"
              aria-label="Forms in this package"
            >
              {resolved.map((doc, i) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  className={cn(
                    'rounded-md px-2 py-2 text-left text-xs transition-colors',
                    i === selectedIndex
                      ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-border'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  <span className="line-clamp-3">{doc.label}</span>
                </button>
              ))}
            </nav>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/20">
              {current ? (
                <>
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2">
                    <p className="min-w-0 truncate text-sm font-medium text-foreground">{current.label}</p>
                    <a
                      href={current.href}
                      download={current.fileName}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                  <iframe
                    title={current.fileName}
                    src={current.href}
                    className="h-full min-h-[min(60vh,520px)] w-full flex-1 border-0 bg-muted"
                  />
                </>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
