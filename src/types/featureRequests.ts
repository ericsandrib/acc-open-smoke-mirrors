/** Eligibility-style feature requests on the parent account (not API service workflows). */

export type FeatureRequestStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface FeatureRequestAgreement {
  agreementAccepted?: boolean
  /** ISO timestamp when the client accepted/signed (demo). */
  agreementSignedAt?: string
  agreementDocumentId?: string
}

export interface MarginFeatureRequest extends FeatureRequestAgreement {
  requested?: boolean
  status?: FeatureRequestStatus
}

export interface OptionsFeatureRequest extends FeatureRequestAgreement {
  requested?: boolean
  requestedLevel?: number
  status?: FeatureRequestStatus
  investorExperienceProducts?: string
  investorExperienceYears?: string
  knowledgeLevel?: string
  requestedStrategies?: string
}

export interface FeatureRequestsState {
  margin?: MarginFeatureRequest
  options?: OptionsFeatureRequest
}

export function createDefaultFeatureRequests(): FeatureRequestsState {
  return {
    margin: {
      requested: false,
      agreementAccepted: false,
      status: 'draft',
    },
    options: {
      requested: false,
      agreementAccepted: false,
      requestedLevel: 1,
      status: 'draft',
    },
  }
}

export function mergeFeatureRequests(existing: unknown): FeatureRequestsState {
  const base = createDefaultFeatureRequests()
  if (!existing || typeof existing !== 'object') return base
  const e = existing as Record<string, unknown>
  return {
    margin: { ...base.margin, ...(typeof e.margin === 'object' && e.margin ? (e.margin as object) : {}) },
    options: { ...base.options, ...(typeof e.options === 'object' && e.options ? (e.options as object) : {}) },
  }
}
