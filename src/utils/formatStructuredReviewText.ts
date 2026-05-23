/** Combines a structured disposition reason with optional reviewer details for display/audit. */
export function formatStructuredReviewText(reason: string, details: string): string {
  const trimmedReason = reason.trim()
  const trimmedDetails = details.trim()
  if (trimmedReason && trimmedDetails) {
    return `${trimmedReason}\n\nAdditional information: ${trimmedDetails}`
  }
  return trimmedReason || trimmedDetails
}
