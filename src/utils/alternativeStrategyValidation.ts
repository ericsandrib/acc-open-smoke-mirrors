import type { AlternativeStrategyElection } from '@/types/featureRequests'
import { mergeFeatureRequests } from '@/types/featureRequests'
import type { WorkflowState } from '@/types/workflow'
import type { EsignEnvelope } from '@/types/esignEnvelope'

const ALT_OPTIONAL_FORM_ID = 'opt-alternative-strategy-selection'

function hasNum(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'number') return Number.isFinite(v)
  if (typeof v === 'string') {
    const t = v.trim()
    if (t === '') return false
    return Number.isFinite(Number(t))
  }
  return false
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') return Number.parseFloat(v.replace(/[^0-9.-]/g, '')) || 0
  return 0
}

/** Blocking validation for alternative strategy election (internal suitability only — not sent to Pershing). */
export function getAlternativeStrategyBlockingIssues(alt: AlternativeStrategyElection | undefined): string[] {
  if (!alt?.requested) return []
  const issues: string[] = []

  const types = alt.strategyTypes ?? []
  if (types.length === 0) {
    issues.push('Select at least one alternative strategy type.')
  }
  if (types.includes('other') && !String(alt.otherStrategyText ?? '').trim()) {
    issues.push('Describe the “Other” alternative strategy.')
  }

  if (!hasNum(alt.targetAllocationPercent)) {
    issues.push('Enter target allocation to alternatives (%).')
  } else {
    const t = toNum(alt.targetAllocationPercent)
    if (t < 0 || t > 100) issues.push('Target allocation must be between 0 and 100%.')
  }

  if (!hasNum(alt.maxAllocationPercent)) {
    issues.push('Enter maximum allocation allowed (%).')
  } else {
    const m = toNum(alt.maxAllocationPercent)
    if (m < 0 || m > 100) issues.push('Maximum allocation must be between 0 and 100%.')
  }

  if (hasNum(alt.targetAllocationPercent) && hasNum(alt.maxAllocationPercent)) {
    const target = toNum(alt.targetAllocationPercent)
    const max = toNum(alt.maxAllocationPercent)
    if (target > max) {
      issues.push('Target allocation cannot exceed maximum allocation allowed.')
    }
  }

  const obj = String(alt.primaryObjective ?? '').trim()
  if (!obj) issues.push('Select a primary objective for alternatives.')

  const ill = String(alt.illiquidityTolerance ?? '').trim()
  if (!ill) issues.push('Select illiquidity tolerance.')

  const loss = String(alt.lossTolerance ?? '').trim()
  if (!loss) issues.push('Select loss tolerance for alternatives.')

  const cx = String(alt.complexityTolerance ?? '').trim()
  if (!cx) issues.push('Select complexity tolerance.')

  if (alt.valuationToleranceAccepted !== true) {
    issues.push('Acknowledge infrequent or estimated valuations.')
  }

  if (!hasNum(alt.emergencyLiquidityBufferMonths)) {
    issues.push('Enter emergency liquidity buffer (months).')
  } else {
    const mo = toNum(alt.emergencyLiquidityBufferMonths)
    if (mo < 0 || mo > 60) issues.push('Emergency liquidity buffer must be between 0 and 60 months.')
  }

  if (typeof alt.canMeetCapitalCalls !== 'boolean') {
    issues.push('Indicate whether the client can meet capital calls.')
  } else if (alt.canMeetCapitalCalls === true) {
    if (!hasNum(alt.capitalCallCapacityAmount)) {
      issues.push('Enter capital call capacity amount.')
    }
  }

  if (!hasNum(alt.liquidNetWorthPercent)) {
    issues.push('Enter percent of net worth in liquid assets.')
  } else {
    const liq = toNum(alt.liquidNetWorthPercent)
    if (liq < 0 || liq > 100) issues.push('Liquid net worth percent must be between 0 and 100%.')
  }

  const d = alt.disclosures ?? {}
  if (d.illiquidityAccepted !== true) issues.push('Acknowledge illiquidity risk.')
  if (d.lossAccepted !== true) issues.push('Acknowledge potential loss of capital.')
  if (d.feeComplexityAccepted !== true) issues.push('Acknowledge fee and cost complexity.')
  if (d.redemptionRestrictionsAccepted !== true) issues.push('Acknowledge redemption and lock-up restrictions.')

  return issues
}

/** Non-blocking suitability warnings (cross-checks with account liquidity and internal thresholds). */
export function getAlternativeStrategyWarnings(
  alt: AlternativeStrategyElection | undefined,
  investmentLiquidityNeedsCode: string | undefined,
): string[] {
  if (!alt?.requested) return []
  const warnings: string[] = []

  if (hasNum(alt.targetAllocationPercent) && toNum(alt.targetAllocationPercent) > 25) {
    warnings.push('Alternative allocation exceeds standard review threshold.')
  }

  const liq = String(investmentLiquidityNeedsCode ?? '').trim()
  const ill = String(alt.illiquidityTolerance ?? '').trim()
  if (liq === 'High' && (ill === 'y3_7' || ill === 'gt_7y')) {
    warnings.push('High liquidity need may conflict with long-duration alternative investments.')
  }

  if (hasNum(alt.liquidNetWorthPercent) && toNum(alt.liquidNetWorthPercent) < 20) {
    warnings.push('Low liquid asset percentage may not support illiquid alternative allocations.')
  }

  return warnings
}

export function isAlternativeStrategyElectionComplete(alt: AlternativeStrategyElection | undefined): boolean {
  return getAlternativeStrategyBlockingIssues(alt).length === 0
}

/** Progress weight: 0–1 for the alternative strategy “slot” when requested. */
export function alternativeStrategyProgressWeight(alt: AlternativeStrategyElection | undefined): number {
  if (!alt?.requested) return 1
  return isAlternativeStrategyElectionComplete(alt) ? 1 : 0
}

/**
 * When alternative strategy is requested and PDF should be in eSign, a sent envelope must include the account
 * and the optional alt-strategy form.
 */
export function getAlternativeStrategyEsignSubmitBlockers(
  state: WorkflowState,
  accountOpeningChildren: { id: string; name: string }[],
  sentEnvelopes: EsignEnvelope[],
): string[] {
  const blockers: string[] = []

  for (const child of accountOpeningChildren) {
    const childMeta = (state.taskData[child.id] as Record<string, unknown> | undefined) ?? {}
    const fr = mergeFeatureRequests(childMeta.featureRequests)
    const alt = fr.alternativeStrategySelection
    if (!alt?.requested) continue
    if (alt.includePdfInEsign === false) continue
    if (getAlternativeStrategyBlockingIssues(alt).length > 0) continue

    const covered = sentEnvelopes.some(
      (env) =>
        env.optionalFormIdsIncluded.includes(ALT_OPTIONAL_FORM_ID) &&
        env.formSelections.some((r) => r.included && r.accountChildId === child.id),
    )

    if (!covered) {
      blockers.push(
        `${child.name}: send an eSign envelope that includes this account and the Alternative Strategy Selection PDF.`,
      )
    }
  }

  return blockers
}
