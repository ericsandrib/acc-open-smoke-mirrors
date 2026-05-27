import { useMemo } from 'react'
import { ExternalLink, FileDown } from 'lucide-react'
import { useChildActionContext, useWorkflow } from '@/stores/workflowStore'
import { useSupportingDocumentPreview } from '@/components/wizard/supportingDocumentPreviewContext'
import { resolveEsignFormSampleWithFallback } from '@/constants/esignFormSamples'
import { resolveSupportingDocumentPreviewSrc } from '@/utils/supportingDocumentPreviewResolve'
import {
  collectChildActionDocumentSections,
  type ChildActionDocumentListRow,
} from '@/utils/childActionDocumentsPanel'

function ChildActionDocumentRow({ row }: { row: ChildActionDocumentListRow }) {
  const { getPreviewUrl } = useSupportingDocumentPreview()

  let href: string | undefined
  let downloadName = row.fileName ?? row.label

  if (row.previewKey && row.fileName) {
    href = resolveSupportingDocumentPreviewSrc(row.previewKey, row.fileName, getPreviewUrl)
    downloadName = row.fileName
  } else if (row.formIdOrDocId) {
    const sample = resolveEsignFormSampleWithFallback(row.formIdOrDocId, row.label)
    href = sample.href
    downloadName = sample.fileName
  }

  const linkLabel = row.fileName ?? row.label

  if (!href) {
    return (
      <li className="flex items-center gap-3 px-3 py-2.5">
        <span className="min-w-0 flex-1 text-sm text-foreground">{row.label}</span>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 flex-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-2"
      >
        <span className="truncate">{linkLabel}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      <a
        href={href}
        download={downloadName}
        title="Download"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <FileDown className="h-4 w-4" aria-hidden />
        <span className="sr-only">Download {downloadName}</span>
      </a>
    </li>
  )
}

function DocumentListSection({
  title,
  rows,
  emptyMessage,
}: {
  title: string
  rows: ChildActionDocumentListRow[]
  emptyMessage: string
}) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-relaxed px-2 py-1">{emptyMessage}</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <ChildActionDocumentRow key={row.rowKey} row={row} />
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Child-action Documents tab: supporting uploads + executed forms package rows.
 */
export function ChildActionDocumentsPanel() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const sections = useMemo(
    () =>
      ctx
        ? collectChildActionDocumentSections(state, ctx.child.id)
        : { supportingDocuments: [], formsPackage: [] },
    [state, ctx],
  )

  if (!ctx) {
    return (
      <p className="text-sm text-muted-foreground px-1">
        Open a child workflow step to see uploaded documents here.
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-1">
      <DocumentListSection
        title="Supporting Documents"
        rows={sections.supportingDocuments}
        emptyMessage="No supporting documents uploaded yet. Files added in the Supporting Documents step will appear here."
      />
      <DocumentListSection
        title="Forms packages"
        rows={sections.formsPackage}
        emptyMessage="No executed forms yet. Completed forms from the Forms Package step will appear here after eSign."
      />
    </div>
  )
}
