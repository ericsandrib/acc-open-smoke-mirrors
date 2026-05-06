/** Subtype value: show free-text "Document type name" field. */
export const CUSTOM_DOCUMENT_SUBTYPE_VALUE = '__custom__'

export type SupportingDocumentStatus =
  | 'draft'
  /** Legacy persisted value; displayed as Draft in the workspace UI. */
  | 'suggested'
  | 'uploaded'
  | 'requested_by_review'
  | 'accepted'
  | 'rejected_needs_replacement'

export const SUPPORTING_DOCUMENT_STATUS_LABELS: Record<SupportingDocumentStatus, string> = {
  draft: 'Draft',
  suggested: 'Draft',
  uploaded: 'Uploaded',
  requested_by_review: 'Requested by review',
  accepted: 'Accepted',
  rejected_needs_replacement: 'Rejected / needs replacement',
}

/** Status for a new advisor-added document row (optional workspace; not a suggestion or requirement). */
export function defaultSupportingDocumentStatus(): SupportingDocumentStatus {
  return 'draft'
}

export function nextStatusAfterUpload(
  prev: SupportingDocumentStatus | undefined,
): SupportingDocumentStatus {
  if (
    prev === 'requested_by_review' ||
    prev === 'draft' ||
    prev === 'suggested' ||
    prev === 'rejected_needs_replacement'
  ) {
    return 'uploaded'
  }
  if (prev === 'accepted') return 'accepted'
  return 'uploaded'
}

export function instanceSpecificationComplete(
  subType: string | undefined,
  customSubTypeLabel: string | undefined,
  subTypesCount: number,
): boolean {
  if (subTypesCount === 0) return true
  if (!subType?.trim()) return false
  if (subType === CUSTOM_DOCUMENT_SUBTYPE_VALUE && !customSubTypeLabel?.trim()) return false
  return true
}
