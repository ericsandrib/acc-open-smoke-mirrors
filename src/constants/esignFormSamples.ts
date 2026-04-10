/**
 * Static PDFs in /public for demo: firm/custodian eSign form rows can offer a download.
 * Keys match `DocumentRequirement.id` from pasRequiredDocuments (e.g. form-NAW9 for PAS Client Application).
 */
export const ESIGN_FORM_SAMPLE_DOWNLOADS: Record<
  string,
  { href: string; fileName: string }
> = {
  'form-NAW9': {
    href: '/docs/client-application.pdf',
    fileName: 'Client Application.pdf',
  },
  /** Optional add-on catalog — demo uses the same static PDF with distinct download names. */
  'opt-loa': {
    href: '/docs/client-application.pdf',
    fileName: 'Letter of Authorization.pdf',
  },
  'opt-fee-disclosure': {
    href: '/docs/client-application.pdf',
    fileName: 'Fee Disclosure Addendum.pdf',
  },
  'opt-privacy': {
    href: '/docs/client-application.pdf',
    fileName: 'Privacy Policy Acknowledgment.pdf',
  },
  'opt-trusted-contact': {
    href: '/docs/client-application.pdf',
    fileName: 'Trusted Contact Designation.pdf',
  },
  'opt-margin-supplement': {
    href: '/docs/client-application.pdf',
    fileName: 'Margin Agreement Supplement.pdf',
  },
}

/**
 * Resolves a demo PDF for View/Download. Envelope rows use `accountChildId::documentId`;
 * documents review and optional catalog entries use a single id.
 */
export function resolveEsignFormSample(formIdOrDocId: string): { href: string; fileName: string } | undefined {
  const direct = ESIGN_FORM_SAMPLE_DOWNLOADS[formIdOrDocId]
  if (direct) return direct
  const sep = formIdOrDocId.lastIndexOf('::')
  if (sep === -1) return undefined
  const docId = formIdOrDocId.slice(sep + 2)
  return ESIGN_FORM_SAMPLE_DOWNLOADS[docId]
}
