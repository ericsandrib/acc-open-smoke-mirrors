import { FolderOpen, HelpCircle } from 'lucide-react'
import { ConfigHotspot } from '@/components/config-overlay'

/**
 * Documents tab — explicitly TBD pending document-storage decisions.
 *
 * The auth-gate placeholder we had before implied a specific direction
 * (Stratos vault, single sign-in). That isn't a decision Stratos has made
 * yet. This surface names the open questions clearly and anchors a Config
 * Overlay hotspot so the firm can capture their preference during review.
 */
export function DocumentsTab() {
  return (
    <div className="relative rounded-xl border border-border bg-white">
      <ConfigHotspot
        knobId="relationships/detail/tabs/documents"
        anchor="top-right"
        size="md"
        area="region"
        className="!top-2 !right-2"
      />

      <div className="px-5 pt-4 pb-3 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Documents</h2>
      </div>

      <div className="px-8 py-12 flex flex-col items-center text-center">
        <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center mb-4">
          <FolderOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1.5">
          Document storage — configuration pending
        </h3>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          Once a storage provider is selected, advisors will see uploaded files,
          search, filter, and upload affordances here.
        </p>

        <div className="mt-6 max-w-md w-full rounded-lg border border-dashed border-border bg-muted/20 px-5 py-4 text-left">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Open decisions
            </span>
          </div>
          <ul className="space-y-1.5 text-xs text-foreground/85">
            <li>
              <span className="font-medium">Storage provider</span> — built-in
              vault, SharePoint, Box, Google Drive, or another integration.
            </li>
            <li>
              <span className="font-medium">Folder root</span> — single client
              folder, or split by year, document type, or workflow.
            </li>
            <li>
              <span className="font-medium">Classification rules</span> —
              auto-tagging by document type (statements, agreements,
              correspondence) or manual tagging only.
            </li>
            <li>
              <span className="font-medium">Access control</span> — visible to
              the client portal, internal-only, or per-document toggle.
            </li>
          </ul>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          Click the indicator in the corner to capture this decision for
          follow-up.
        </p>
      </div>
    </div>
  )
}
