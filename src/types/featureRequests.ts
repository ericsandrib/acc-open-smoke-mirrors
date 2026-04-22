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
  /**
   * Maps to Pershing `cashManagement.cashManagementType.marginDebtIndicator` (Y/N). Optional sweep coverage of margin debt.
   * Not used for `marginPrivileges` (maintenance-only; never sent on account open).
   */
  marginDebtCoveredBySweep?: boolean
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

export type AlternativeStrategyType =
  | 'private_equity'
  | 'hedge_funds'
  | 'private_credit'
  | 'real_assets'
  | 'structured_products'
  | 'other'

export interface AlternativeStrategyDisclosures {
  illiquidityAccepted?: boolean
  lossAccepted?: boolean
  feeComplexityAccepted?: boolean
  redemptionRestrictionsAccepted?: boolean
}

/**
 * Internal suitability / compliance for alternative strategy election.
 * Not mapped onto Pershing account fields — custody-facing indicators remain margin/options on `investmentObjectives.investmentObjType`.
 */
export interface AlternativeStrategyElection extends FeatureRequestAgreement {
  requested?: boolean
  status?: FeatureRequestStatus
  strategyTypes?: AlternativeStrategyType[]
  otherStrategyText?: string
  targetAllocationPercent?: number
  maxAllocationPercent?: number
  primaryObjective?: 'diversification' | 'growth' | 'income' | 'inflation_hedge' | string
  illiquidityTolerance?: 'lt_1y' | 'y1_3' | 'y3_7' | 'gt_7y' | string
  lossTolerance?: 'moderate' | 'high' | 'total_loss' | string
  complexityTolerance?: 'low' | 'medium' | 'high' | string
  valuationToleranceAccepted?: boolean
  emergencyLiquidityBufferMonths?: number
  canMeetCapitalCalls?: boolean
  capitalCallCapacityAmount?: number | null
  liquidNetWorthPercent?: number
  disclosures?: AlternativeStrategyDisclosures
  /** Demo default true — drives optional eSign PDF inclusion. */
  includePdfInEsign?: boolean
}

export interface FeatureRequestsState {
  margin?: MarginFeatureRequest
  options?: OptionsFeatureRequest
  alternativeStrategySelection?: AlternativeStrategyElection
}

export function createDefaultAlternativeStrategyElection(): AlternativeStrategyElection {
  return {
    requested: false,
    agreementAccepted: false,
    status: 'draft',
    strategyTypes: [],
    otherStrategyText: '',
    targetAllocationPercent: undefined,
    maxAllocationPercent: undefined,
    primaryObjective: '',
    illiquidityTolerance: '',
    lossTolerance: '',
    complexityTolerance: '',
    valuationToleranceAccepted: false,
    emergencyLiquidityBufferMonths: undefined,
    canMeetCapitalCalls: undefined,
    capitalCallCapacityAmount: null,
    liquidNetWorthPercent: undefined,
    disclosures: {
      illiquidityAccepted: false,
      lossAccepted: false,
      feeComplexityAccepted: false,
      redemptionRestrictionsAccepted: false,
    },
    includePdfInEsign: true,
  }
}

export function createDefaultFeatureRequests(): FeatureRequestsState {
  return {
    margin: {
      requested: false,
      marginDebtCoveredBySweep: false,
      agreementAccepted: false,
      status: 'draft',
    },
    options: {
      requested: false,
      agreementAccepted: false,
      requestedLevel: 1,
      status: 'draft',
    },
    alternativeStrategySelection: createDefaultAlternativeStrategyElection(),
  }
}

export function mergeFeatureRequests(existing: unknown): FeatureRequestsState {
  const base = createDefaultFeatureRequests()
  if (!existing || typeof existing !== 'object') return base
  const e = existing as Record<string, unknown>
  const altIn = e.alternativeStrategySelection
  const altDefault = createDefaultAlternativeStrategyElection()
  const altMerged: AlternativeStrategyElection =
    typeof altIn === 'object' && altIn
      ? {
          ...altDefault,
          ...(altIn as AlternativeStrategyElection),
          disclosures: {
            ...altDefault.disclosures,
            ...(typeof (altIn as AlternativeStrategyElection).disclosures === 'object' &&
            (altIn as AlternativeStrategyElection).disclosures
              ? ((altIn as AlternativeStrategyElection).disclosures as AlternativeStrategyDisclosures)
              : {}),
          },
        }
      : altDefault
  return {
    margin: { ...base.margin, ...(typeof e.margin === 'object' && e.margin ? (e.margin as object) : {}) },
    options: { ...base.options, ...(typeof e.options === 'object' && e.options ? (e.options as object) : {}) },
    alternativeStrategySelection: altMerged,
  }
}
