import { useMemo } from 'react'
import { useWorkflow, useTaskData, useChildActionContext } from '@/stores/workflowStore'
import { SupportingDocumentPdfViewButton } from '@/components/wizard/SupportingDocumentPdfViewButton'
import { resolveSupportingDocumentPreviewSrc } from '@/utils/supportingDocumentPreviewResolve'
import { useSupportingDocumentPreview } from '@/components/wizard/supportingDocumentPreviewContext'
import type { DocumentUploadInstance } from '@/components/wizard/forms/DocumentUploadInstancesTable'
import {
  getOpenAccountsCoreSupportingDocumentSections,
  getDocSubTypes,
} from '@/utils/registrationDocuments'
import { buildSupportingDocumentPreviewKey } from '@/utils/journeySupportingDocuments'
import { REVIEWER_ADDITIONAL_CONTEXT_KEY } from '@/components/wizard/forms/ReviewerAdditionalContextSection'
import { ReviewSummarySection } from '@/components/wizard/aml/ReviewSummaryPrimitives'
import { FileText, Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

function statusLabel(status: DocumentUploadInstance['status']): string {
  switch (status) {
    case 'uploaded':
      return 'Uploaded'
    case 'requested_by_review':
      return 'Requested'
    case 'accepted':
      return 'Accepted'
    case 'rejected_needs_replacement':
      return 'Rejected'
    default:
      return 'Pending'
  }
}

export function AmlSupportingDocumentsReviewForm() {
  const ctx = useChildActionContext()
  const child = ctx?.child ?? null
  const taskId = ctx?.subTaskId ?? ''
  const { data } = useTaskData(taskId || '__no_child__')
  const { state } = useWorkflow()
  const { getPreviewUrl } = useSupportingDocumentPreview()

  const docs = useMemo(() => getOpenAccountsCoreSupportingDocumentSections(), [])
  const additionalContext = (data[REVIEWER_ADDITIONAL_CONTEXT_KEY] as string | undefined)?.trim()

  const assigneeName = (partyId: string) =>
    state.relatedParties.find((p) => p.id === partyId)?.name ?? (partyId || 'Unassigned')

  const subTypeLabel = (docId: string, subType?: string) => {
    if (!subType) return null
    return getDocSubTypes(docId).find((s) => s.value === subType)?.label ?? subType
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Evidence submitted with this subject. Review documents before recording an AML disposition on the{' '}
        <span className="font-medium text-foreground">AML Review</span> step.
      </p>

      {docs.map((doc) => {
        const instances =
          (data[`doc-instances-${doc.id}`] as DocumentUploadInstance[] | undefined)?.filter((i) => i.fileName) ?? []

        return (
          <ReviewSummarySection
            key={doc.id}
            title={doc.label}
            description={doc.description}
          >
            {instances.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">No files submitted for this category.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {instances.map((instance) => {
                  const previewKey = buildSupportingDocumentPreviewKey(
                    taskId,
                    `doc-instances-${doc.id}`,
                    instance.id,
                  )
                  const previewUrl = resolveSupportingDocumentPreviewSrc(
                    previewKey,
                    instance.fileName ?? '',
                    getPreviewUrl,
                  )
                  const subtype = subTypeLabel(doc.id, instance.subType)

                  return (
                    <li
                      key={instance.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex items-start gap-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{instance.fileName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {subtype ? `${subtype} · ` : ''}
                            Assigned to {assigneeName(instance.assignedTo)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {statusLabel(instance.status)}
                        </Badge>
                        {previewUrl ? (
                          <SupportingDocumentPdfViewButton
                            previewKey={previewKey}
                            fileName={instance.fileName ?? 'document.pdf'}
                          />
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </ReviewSummarySection>
        )
      })}

      {additionalContext ? (
        <ReviewSummarySection
          title="Advisor context"
          description="Additional notes supplied at submission for reviewers."
        >
          <div className="py-3 flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{additionalContext}</p>
          </div>
        </ReviewSummarySection>
      ) : null}
    </div>
  )
}
