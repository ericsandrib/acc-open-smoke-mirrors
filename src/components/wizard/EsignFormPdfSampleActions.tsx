import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resolveEsignFormSampleWithFallback } from '@/constants/esignFormSamples'
import { Eye, FileDown } from 'lucide-react'

export type EsignPdfViewMode = 'signed' | 'preview'

type Props = {
  formIdOrDocId: string
  /** Human label for fallback filenames when this form id has no explicit sample PDF */
  displayLabel: string
  /** Documents review shows executed copies; envelope builder shows pre-sign preview */
  viewMode?: EsignPdfViewMode
}

/** View / Download for firm/custodian demo PDFs (explicit map or fallback). */
export function EsignFormPdfSampleActions({ formIdOrDocId, displayLabel, viewMode = 'signed' }: Props) {
  const sample = resolveEsignFormSampleWithFallback(formIdOrDocId, displayLabel)
  const [viewer, setViewer] = useState<{ href: string; title: string } | null>(null)
  const titlePrefix = viewMode === 'signed' ? 'Signed' : 'Preview'

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          title="View"
          onClick={() => setViewer({ href: sample.href, title: sample.fileName })}
        >
          <Eye className="h-4 w-4" aria-hidden />
          <span className="sr-only">View {sample.fileName}</span>
        </Button>
        <a
          href={sample.href}
          download={sample.fileName}
          title="Download"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <FileDown className="h-4 w-4 shrink-0" aria-hidden />
          <span className="sr-only">Download {sample.fileName}</span>
        </a>
      </div>
      <Dialog open={viewer !== null} onOpenChange={(open) => !open && setViewer(null)}>
        <DialogContent className="grid h-[min(90vh,820px)] max-h-[90vh] w-[min(96vw,56rem)] max-w-5xl grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 pb-3 pt-12 text-left">
            <DialogTitle className="pr-8 text-base">
              {viewer ? `${titlePrefix}: ${viewer.title}` : 'PDF'}
            </DialogTitle>
          </DialogHeader>
          {viewer ? (
            <iframe
              key={viewer.href + viewer.title}
              title={viewer.title}
              src={viewer.href}
              className="h-full min-h-[50vh] w-full border-0 bg-muted"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
