import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'

function str(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function maskTaxId(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 4) return `***-**-${digits.slice(-4)}`
  return value ? '***-**-****' : ''
}

function formatAddress(parts: {
  street?: string
  apt?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}): string {
  const line1 = [parts.street, parts.apt].filter(Boolean).join(parts.street && parts.apt ? ', ' : '')
  const line2 = [parts.city, parts.state, parts.zip].filter(Boolean).join(', ')
  const lines = [line1, line2, parts.country].filter(Boolean)
  return lines.length > 0 ? lines.join(' · ') : ''
}

export function useKycSubjectReviewData() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const child = ctx?.child ?? null

  const childMeta = child ? ((state.taskData[child.id] as Record<string, unknown> | undefined) ?? {}) : {}
  const subjectPartyId = childMeta.kycSubjectPartyId as string | undefined
  const isEntity = childMeta.kycSubjectType === 'entity'
  const party =
    state.relatedParties.find((p) => p.id === subjectPartyId) ??
    (child ? state.relatedParties.find((p) => p.name === child.name) : undefined)
  const taskData = child ? ((state.taskData[`${child.id}-info`] as Record<string, unknown> | undefined) ?? {}) : {}

  const firstName = str(taskData.firstName) || party?.firstName || ''
  const lastName = str(taskData.lastName) || party?.lastName || ''
  const legalName = str(taskData.legalName) || party?.organizationName || child?.name || ''
  const displayName = isEntity ? legalName : `${firstName} ${lastName}`.trim() || child?.name || '—'

  const taxIdRaw = str(taskData.taxId) || party?.taxId || party?.ssn || ''
  const legalStreet = str(taskData.legalStreet) || party?.accountOwnerIndividual?.legalStreet || ''
  const legalApt = str(taskData.legalApt) || party?.accountOwnerIndividual?.legalApt || ''
  const legalCity = str(taskData.legalCity) || party?.accountOwnerIndividual?.legalCity || ''
  const legalState = str(taskData.legalState) || party?.accountOwnerIndividual?.legalState || ''
  const legalZip = str(taskData.legalZip) || party?.accountOwnerIndividual?.legalZip || ''
  const legalCountry = str(taskData.legalCountry) || party?.accountOwnerIndividual?.legalCountry || ''

  return {
    child,
    isEntity,
    displayName,
    subjectTypeLabel: isEntity ? 'Legal entity' : 'Individual',
    individual: isEntity
      ? null
      : {
          fullName: displayName,
          dob: str(taskData.dob) || party?.dob || '—',
          taxId: taxIdRaw ? maskTaxId(taxIdRaw) : '—',
          email: str(taskData.email) || party?.email || '—',
          phone: str(taskData.phone) || party?.phone || '—',
          address: formatAddress({
            street: legalStreet,
            apt: legalApt,
            city: legalCity,
            state: legalState,
            zip: legalZip,
            country: legalCountry,
          }) || '—',
          employmentStatus: str(taskData.employmentStatus) || '—',
          employerName: str(taskData.employerName) || '—',
          occupation: str(taskData.occupation) || '—',
          sourceOfFunds: str(taskData.sourceOfFunds) || party?.accountOwnerIndividual?.sourceOfFunds || '—',
        },
    entity: isEntity
      ? {
          legalName: displayName,
          entityType: str(taskData.entityType) || party?.entityType || '—',
          taxId: taxIdRaw ? maskTaxId(taxIdRaw) : '—',
          jurisdiction: str(taskData.jurisdiction) || party?.jurisdiction || '—',
          contactPerson: str(taskData.contactPerson) || party?.contactPerson || '—',
          email: str(taskData.email) || party?.email || '—',
          phone: str(taskData.phone) || party?.phone || '—',
          address: formatAddress({
            street: legalStreet,
            apt: legalApt,
            city: legalCity,
            state: legalState,
            zip: legalZip,
            country: legalCountry,
          }) || '—',
          sourceOfFunds: str(taskData.sourceOfFunds) || '—',
        }
      : null,
  }
}
