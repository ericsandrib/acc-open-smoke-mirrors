import type { RelatedParty, WorkflowState } from '@/types/workflow'
import { mergeFeatureRequests } from '@/types/featureRequests'

export type SupervisionStatus = 'not_started' | 'in_review' | 'passed' | 'returned' | 'pending_approval'

export const SUPERVISION_STATUS_LABELS: Record<SupervisionStatus, string> = {
  not_started: 'Not started',
  in_review: 'In review',
  passed: 'Passed',
  returned: 'Returned',
  pending_approval: 'Pending approval',
}

export interface SupervisionRuleHit {
  id: string
  /** Short label suitable for an inline badge. */
  label: string
  /** Longer description for the reviewer drawer. */
  detail: string
  /** Owner party IDs the rule references, if applicable. */
  ownerPartyIds?: string[]
}

const AGGRESSIVE_GROWTH = 'Aggressive Growth'

/**
 * Computes age in whole years from a YYYY-MM-DD date-of-birth string. Returns
 * null for missing/invalid input.
 */
function ageFromDob(dob: string | undefined | null): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (!Number.isFinite(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const monthDelta = now.getMonth() - d.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < d.getDate())) {
    age -= 1
  }
  return age
}

/**
 * Known risk-tolerance / investment-objective mismatches. Conservative profiles
 * with aggressive objectives, and Aggressive risk with Capital Preservation, are
 * the canonical pairings that trip supervisory review.
 */
function isRiskObjectiveMismatch(risk: string | undefined, objective: string | undefined): boolean {
  if (!risk || !objective) return false
  const r = risk.toLowerCase()
  const o = objective.toLowerCase()
  if (r === 'conservative' && (o === 'growth' || o === 'aggressive growth' || o === 'speculation')) {
    return true
  }
  if (r === 'aggressive' && o === 'capital preservation') {
    return true
  }
  return false
}

export interface SupervisionEvaluation {
  status: SupervisionStatus
  triggered: SupervisionRuleHit[]
}

/**
 * Evaluate all supervision rules for one account-opening child. Each rule
 * checks fields captured upstream — owner suitability profile, account
 * feature requests, etc. If any rule fires, status becomes `pending_approval`
 * (manual sign-off required); otherwise `passed`.
 *
 * Caller should pass `kycVerified` so we can keep the status at
 * `not_started` until KYC is complete (per the spec: KYC review can complete
 * normally; supervision then either passes or flips to pending approval).
 */
export function evaluateSupervisionRules(
  accountChildId: string,
  state: WorkflowState,
  kycVerified: boolean,
): SupervisionEvaluation {
  // Selected owners come from the account-owners sub-task taskData.
  const ownersBag = state.taskData[`${accountChildId}-account-owners`] as
    | Record<string, unknown>
    | undefined
  const ownerSlots = (ownersBag?.owners as Array<{ partyId?: string }> | undefined) ?? []
  const ownerParties: RelatedParty[] = ownerSlots
    .map((slot) => state.relatedParties.find((p) => p.id === slot.partyId))
    .filter((p): p is RelatedParty => Boolean(p))

  // Account-level feature requests live on the child root.
  const childRoot = (state.taskData[accountChildId] as Record<string, unknown> | undefined) ?? {}
  const featureRequests = mergeFeatureRequests(childRoot.featureRequests)
  const marginRequested = Boolean(featureRequests.margin?.requested)
  const optionsRequested = Boolean(featureRequests.options?.requested)
  const optionsLevel = featureRequests.options?.requestedLevel ?? null

  // Schwab paperwork also surfaces margin via Section 1 "Account type" radio.
  const schwabForm = childRoot.schwabForm as Record<string, unknown> | undefined
  const schwabAccountType = (schwabForm?.section1AccountType as string | undefined) ?? ''
  const schwabMarginRequested = schwabAccountType === 'Schwab One with Margin'

  const hits: SupervisionRuleHit[] = []

  // Rule 1: Owner ≥70 with Aggressive Growth
  for (const party of ownerParties) {
    const age = ageFromDob(party.dob)
    const objective = party.accountOwnerIndividual?.investmentObjective
    if (age !== null && age >= 70 && objective === AGGRESSIVE_GROWTH) {
      hits.push({
        id: `senior-aggressive-${party.id}`,
        label: 'Owner ≥70 with Aggressive Growth',
        detail: `${party.name || 'Owner'} is ${age} years old and Investment Objective = Aggressive Growth.`,
        ownerPartyIds: [party.id],
      })
    }
  }

  // Rule 2: Owner Retired / Not Employed with Aggressive Growth
  for (const party of ownerParties) {
    const employment = party.accountOwnerIndividual?.employmentStatus
    const objective = party.accountOwnerIndividual?.investmentObjective
    if (
      (employment === 'Retired' || employment === 'Not Employed') &&
      objective === AGGRESSIVE_GROWTH
    ) {
      hits.push({
        id: `retired-aggressive-${party.id}`,
        label: 'Retired/Unemployed with Aggressive Growth',
        detail: `${party.name || 'Owner'} is ${employment} and Investment Objective = Aggressive Growth.`,
        ownerPartyIds: [party.id],
      })
    }
  }

  // Rule 3: Risk tolerance × investment objective mismatch
  for (const party of ownerParties) {
    const risk = party.accountOwnerIndividual?.riskTolerance
    const objective = party.accountOwnerIndividual?.investmentObjective
    if (isRiskObjectiveMismatch(risk, objective)) {
      hits.push({
        id: `risk-objective-${party.id}`,
        label: 'Risk tolerance × objective mismatch',
        detail: `${party.name || 'Owner'}: Risk Tolerance = ${risk}, Investment Objective = ${objective}.`,
        ownerPartyIds: [party.id],
      })
    }
  }

  // Rule 4: Source of Funds = Rollover
  for (const party of ownerParties) {
    const sof = party.accountOwnerIndividual?.sourceOfFunds
    if (sof === 'Rollover') {
      hits.push({
        id: `source-rollover-${party.id}`,
        label: 'Source of Funds = Rollover',
        detail: `${party.name || 'Owner'} reported Source of Funds = Rollover.`,
        ownerPartyIds: [party.id],
      })
    }
  }

  // Rule 5: Margin requested (per-account)
  if (marginRequested || schwabMarginRequested) {
    hits.push({
      id: 'margin-requested',
      label: 'Margin requested',
      detail: schwabMarginRequested
        ? 'Schwab One application selected the "Schwab One with Margin" account type.'
        : 'Margin Feature Request marked Requested on this account.',
    })
  }

  // Rule 6: Options requested (per-account)
  if (optionsRequested) {
    const lvl = optionsLevel != null ? ` (Level ${optionsLevel})` : ''
    hits.push({
      id: 'options-requested',
      label: `Options requested${lvl}`,
      detail: `Options Feature Request marked Requested on this account${lvl}.`,
    })
  }

  let status: SupervisionStatus
  if (!kycVerified) {
    status = 'not_started'
  } else if (hits.length > 0) {
    status = 'pending_approval'
  } else {
    status = 'passed'
  }

  return { status, triggered: hits }
}
