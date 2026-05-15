import { useEffect, useMemo, useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { collectJourneySupportingDocumentRows } from '@/utils/journeySupportingDocuments'
import { useSupportingDocumentPreview } from '@/components/wizard/supportingDocumentPreviewContext'
import {
  isPreviewablePdfFileName,
  pdfViewerEmbedSrc,
  resolveSupportingDocumentPreviewSrc,
} from '@/utils/supportingDocumentPreviewResolve'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatStatus(status: string | undefined): string {
  if (!status) return '—'
  return status.replace(/_/g, ' ')
}

function previewKindFromFileName(name: string): 'pdf' | 'image' | 'none' | 'other' {
  const n = name.trim().toLowerCase()
  if (!n || n === 'no file uploaded') return 'none'
  if (n.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|gif|webp)$/i.test(n)) return 'image'
  return 'other'
}

/**
 * Read-only list of supporting document uploads for reviewer cross-check
 * (Open Accounts + active child sub-step `taskData`), with in-panel preview
 * for files uploaded in this browser session (blob URLs).
 */
export function JourneySupportingDocumentsPanel() {
  const { state } = useWorkflow()
  const { getPreviewUrl } = useSupportingDocumentPreview()
  const rows = useMemo(() => collectJourneySupportingDocumentRows(state), [state])
  const [selectedPreviewKey, setSelectedPreviewKey] = useState<string | null>(null)

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedPreviewKey(null)
      return
    }
    setSelectedPreviewKey((prev) => {
      if (prev && rows.some((r) => r.previewKey === prev)) return prev
      return rows[0]?.previewKey ?? null
    })
  }, [rows])

  const selected = rows.find((r) => r.previewKey === selectedPreviewKey) ?? null
  const previewUrl = selected
    ? resolveSupportingDocumentPreviewSrc(selected.previewKey, selected.fileName, getPreviewUrl)
    : undefined
  const kind = selected ? previewKindFromFileName(selected.fileName) : 'none'
  const hasSessionBlob = selected ? Boolean(getPreviewUrl(selected.previewKey)?.startsWith('blob:')) : false

  if (rows.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4 shrink-0" aria-hidden />
          <h3 className="text-sm font-semibold text-foreground">Supporting documents</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          No supporting documents uploaded yet. Uploads from the journey&apos;s Supporting Documents steps
          will appear here for cross-reference while you review.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0 space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <h3 className="text-sm font-semibold text-foreground">Supporting documents</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-snug">
          Click a row to preview. PDFs and images open below; demo placeholders are used when files were uploaded before this session.
        </p>
      </div>

      <div className="flex min-h-0 max-h-[42%] shrink-0 flex-col gap-2 overflow-hidden">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Uploads</p>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {rows.map((r) => {
            const isSelected = r.previewKey === selectedPreviewKey
            const hasPreview = Boolean(
              resolveSupportingDocumentPreviewSrc(r.previewKey, r.fileName, getPreviewUrl),
            )
            return (
              <li key={r.rowKey}>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewKey(r.previewKey)}
                  className={cn(
                    'w-full rounded-md border px-3 py-2.5 text-left text-xs leading-snug transition-colors',
                    isSelected
                      ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-muted/30 hover:bg-muted/50',
                  )}
                >
                  <div className="font-medium text-foreground">{r.requirementLabel}</div>
                  <div className="mt-1 text-muted-foreground">{r.scopeLabel}</div>
                  <div className="mt-1.5 flex flex-col gap-0.5 text-foreground/90">
                    <span>
                      <span className="text-muted-foreground">File: </span>
                      <span className={cn(hasPreview && r.fileName !== 'No file uploaded' && 'text-primary underline-offset-2')}>
                        {r.fileName}
                      </span>
                      {hasPreview && r.fileName !== 'No file uploaded' ? (
                        <span className="sr-only"> — selected for preview</span>
                      ) : null}
                    </span>
                    <span>
                      <span className="text-muted-foreground">Assigned: </span>
                      {r.assignedToDisplay}
                    </span>
                    <span>
                      <span className="text-muted-foreground">Status: </span>
                      <span className="capitalize">{formatStatus(r.status)}</span>
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-md border border-border bg-muted/10">
        <div className="shrink-0 border-b border-border bg-muted/30 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
          <p className="mt-0.5 truncate text-xs font-medium text-foreground" title={selected?.fileName}>
            {selected?.fileName ?? '—'}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-background/80">
          {!selected ? (
            <p className="p-3 text-xs text-muted-foreground">Select a document above.</p>
          ) : !previewUrl ? (
            <div className="space-y-2 p-3 text-xs text-muted-foreground leading-relaxed">
              <p>No in-browser preview for this row.</p>
              <p>
                {isPreviewablePdfFileName(selected.fileName)
                  ? 'A demo PDF could not be loaded for this filename.'
                  : 'Upload a PDF or image in the supporting-documents step to preview here.'}
              </p>
            </div>
          ) : kind === 'pdf' ? (
            <object
              title={`Preview: ${selected.fileName}`}
              data={pdfViewerEmbedSrc(previewUrl)}
              type="application/pdf"
              className="h-full min-h-[200px] w-full bg-white"
            >
              <div className="p-3 text-xs text-muted-foreground">
                PDF preview is not available in this browser.{' '}
                <a href={previewUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                  Open in new tab
                </a>
              </div>
            </object>
          ) : kind === 'image' && hasSessionBlob ? (
            <div className="flex h-full min-h-[180px] items-center justify-center overflow-auto p-2">
              <img
                src={previewUrl}
                alt={selected.fileName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="space-y-2 p-3 text-xs text-muted-foreground">
              <p>Preview for this file type is not embedded in the demo.</p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                Open file in new tab
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
