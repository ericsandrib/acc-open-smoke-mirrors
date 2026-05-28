import { DEFAULT_ESIGN_DEMO_PDF_HREF } from '@/constants/esignFormSamples'

export function isPreviewablePdfFileName(fileName: string): boolean {
  const n = fileName.trim().toLowerCase()
  return Boolean(n) && n !== 'no file uploaded' && n.endsWith('.pdf')
}

export function isPreviewableImageFileName(fileName: string): boolean {
  const n = fileName.trim().toLowerCase()
  if (!n || n === 'no file uploaded') return false
  return /\.(png|jpe?g|gif|webp)$/i.test(n)
}

/** Demo placeholder when session blob previews are unavailable (e.g. after reload). */
export function resolveSupportingDocumentDemoHref(fileName: string): string | undefined {
  const n = fileName.trim().toLowerCase()
  if (!n || n === 'no file uploaded') return undefined
  return DEFAULT_ESIGN_DEMO_PDF_HREF
}

/** @deprecated Use {@link resolveSupportingDocumentDemoHref} */
export function resolveSupportingDocumentDemoPdfHref(fileName: string): string | undefined {
  return resolveSupportingDocumentDemoHref(fileName)
}

export function pdfViewerEmbedSrc(href: string): string {
  if (href.startsWith('blob:')) return href
  return `${href}#toolbar=1&navpanes=0&view=FitH`
}

export function resolveSupportingDocumentPreviewSrc(
  previewKey: string,
  fileName: string,
  getPreviewUrl: (key: string) => string | undefined,
): string | undefined {
  const blob = getPreviewUrl(previewKey)
  if (blob) return blob
  return resolveSupportingDocumentDemoHref(fileName)
}
