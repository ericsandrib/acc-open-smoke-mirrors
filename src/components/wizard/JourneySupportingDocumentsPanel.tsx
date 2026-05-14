import { useMemo } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { collectJourneySupportingDocumentRows } from '@/utils/journeySupportingDocuments'
import { FileText } from 'lucide-react'

function formatStatus(status: string | undefined): string {
  if (!status) return '—'
  return status.replace(/_/g, ' ')
}

/**
 * Read-only list of supporting document uploads for reviewer cross-check
 * (Open Accounts + active child sub-step `taskData`).
 */
export function JourneySupportingDocumentsPanel() {
  const { state } = useWorkflow()
  const rows = useMemo(() => collectJourneySupportingDocumentRows(state), [state])

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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">Supporting documents</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">
        Read-only list from this journey&apos;s uploads. Use the main canvas to edit forms; use this panel to
        verify filenames and assignments against the workflow.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.rowKey}
            className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-xs leading-snug"
          >
            <div className="font-medium text-foreground">{r.requirementLabel}</div>
            <div className="mt-1 text-muted-foreground">{r.scopeLabel}</div>
            <div className="mt-1.5 flex flex-col gap-0.5 text-foreground/90">
              <span>
                <span className="text-muted-foreground">File: </span>
                {r.fileName}
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
          </li>
        ))}
      </ul>
    </div>
  )
}
