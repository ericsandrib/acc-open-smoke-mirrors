import { PDFDocument } from 'pdf-lib'

/**
 * Returns a PDF blob with AcroForm widgets flattened into page content so
 * browser viewers show a read-only document (no fillable fields).
 */
export async function flattenPdfForPreview(file: File): Promise<Blob> {
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)
  try {
    pdfDoc.getForm().flatten()
  } catch {
    /* malformed or unsupported form — still return a saved copy when possible */
  }
  const flatBytes = await pdfDoc.save()
  return new Blob([flatBytes as BlobPart], { type: 'application/pdf' })
}
