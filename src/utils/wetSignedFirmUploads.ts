/**
 * Application-wide wet-signed firm/custodian scans live on the `open-accounts` task.
 * Legacy shape: `wet-signed-firm-docs` Record<documentTypeId, fileName>.
 */
export interface WetSignedFirmUpload {
  id: string
  fileName: string
  documentTypeId: string
  /** Which account opening child this scan applies to; omit when not specified. */
  accountChildId?: string
  /** Optional override or snapshot (e.g. custodian-assigned #); may mirror the selected account. */
  accountNumber?: string
  notes?: string
}

export const WET_SIGNED_FIRM_UPLOADS_KEY = 'wet-signed-firm-uploads'

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function coerceUpload(raw: unknown): WetSignedFirmUpload | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const id = o.id
  if (!isNonEmptyString(id)) return null
  const fileName = typeof o.fileName === 'string' ? o.fileName : ''
  const documentTypeId = typeof o.documentTypeId === 'string' ? o.documentTypeId : ''
  const accountChildId = isNonEmptyString(o.accountChildId) ? o.accountChildId.trim() : undefined
  const accountNumber = isNonEmptyString(o.accountNumber) ? o.accountNumber.trim() : undefined
  const notes = typeof o.notes === 'string' ? o.notes : undefined
  return {
    id,
    fileName,
    documentTypeId,
    accountChildId,
    accountNumber,
    notes,
  }
}

export function parseWetSignedFirmUploads(data: Record<string, unknown> | undefined): WetSignedFirmUpload[] {
  if (!data) return []
  const arr = data[WET_SIGNED_FIRM_UPLOADS_KEY]
  if (Array.isArray(arr)) {
    return arr.map(coerceUpload).filter((x): x is WetSignedFirmUpload => x !== null)
  }
  const legacy = data['wet-signed-firm-docs']
  if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
    return Object.entries(legacy as Record<string, string>).map(([documentTypeId, fileName]) => ({
      id: `wet-legacy-${documentTypeId}`,
      fileName: typeof fileName === 'string' ? fileName : '',
      documentTypeId,
    }))
  }
  return []
}

export function newWetSignedFirmUploadRow(defaults: Partial<Pick<WetSignedFirmUpload, 'documentTypeId' | 'accountChildId' | 'accountNumber'>> = {}): WetSignedFirmUpload {
  return {
    id: `wet-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    fileName: '',
    documentTypeId: defaults.documentTypeId ?? '',
    accountChildId: defaults.accountChildId,
    accountNumber: defaults.accountNumber,
    notes: '',
  }
}
