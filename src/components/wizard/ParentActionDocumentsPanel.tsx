import { useMemo } from 'react'
import { ExternalLink, FileDown } from 'lucide-react'
import { useWorkflow } from '@/stores/workflowStore'
import { useSupportingDocumentPreview } from '@/components/wizard/supportingDocumentPreviewContext'
import { resolveEsignFormSampleWithFallback } from '@/constants/esignFormSamples'
import { resolveSupportingDocumentPreviewSrc } from '@/utils/supportingDocumentPreviewResolve'
import {
  collectParentActionDocumentSections,
  type ChildActionDocumentListRow,
} from '@/utils/childActionDocumentsPanel'

function ParentActionDocumentRow({ row }: { row: ChildActionDocumentListRow }) {
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
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm text-foreground">{row.label}</span>
          {row.contextLabel ? (
            <span className="block truncate text-xs text-muted-foreground">{row.contextLabel}</span>
          ) : null}
        </div>
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
      {row.contextLabel ? (
        <span className="min-w-0 shrink text-xs text-muted-foreground truncate">{row.contextLabel}</span>
      ) : null}
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

function ParentDocumentListSection({
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
            <ParentActionDocumentRow key={row.rowKey} row={row} />
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Parent Open Accounts documents tab: rolls up uploads/forms across all account children.
 */
export function ParentActionDocumentsPanel({ parentTaskId }: { parentTaskId: string }) {
  const { state } = useWorkflow()
  const sections = useMemo(
    () => collectParentActionDocumentSections(state, parentTaskId),
    [state, parentTaskId],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-1">
      <ParentDocumentListSection
        title="Supporting Documents"
        rows={sections.supportingDocuments}
        emptyMessage="No supporting documents uploaded yet across account child actions."
      />
      <ParentDocumentListSection
        title="Forms packages"
        rows={sections.formsPackage}
        emptyMessage="No forms package documents yet across account child actions."
      />
    </div>
  )
}
