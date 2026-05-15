import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSupportingDocumentPreview } from '@/components/wizard/supportingDocumentPreviewContext'
import {
  pdfViewerEmbedSrc,
  resolveSupportingDocumentPreviewSrc,
} from '@/utils/supportingDocumentPreviewResolve'

type Props = {
  previewKey: string
  fileName: string
  className?: string
}

/** Opens an in-app PDF preview for supporting-document rows (blob or demo fallback). */
export function SupportingDocumentPdfViewButton({ previewKey, fileName, className }: Props) {
  const { getPreviewUrl } = useSupportingDocumentPreview()
  const href = resolveSupportingDocumentPreviewSrc(previewKey, fileName, getPreviewUrl)
  const [open, setOpen] = useState(false)

  if (!href) return null

  const embedSrc = pdfViewerEmbedSrc(href)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className ?? 'h-7 text-xs'}
        onClick={() => setOpen(true)}
      >
        View
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="grid h-[min(90vh,820px)] max-h-[90vh] w-[min(96vw,56rem)] max-w-5xl grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 pb-3 pt-12 text-left">
            <DialogTitle className="pr-8 text-base truncate">{fileName}</DialogTitle>
          </DialogHeader>
          <object
            key={embedSrc}
            title={fileName}
            data={embedSrc}
            type="application/pdf"
            className="h-full min-h-[50vh] w-full bg-muted"
          >
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 bg-muted p-6 text-center">
              <p className="text-sm text-muted-foreground">PDF preview is not available in this browser.</p>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-foreground underline underline-offset-4"
              >
                Open PDF in a new tab
              </a>
            </div>
          </object>
        </DialogContent>
      </Dialog>
    </>
  )
}
