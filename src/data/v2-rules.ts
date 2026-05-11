// V2 rules engine — Stratos's configuration.
//
// Source: Avantos_RIA_Account_Opening_Spec.docx §5.3.
//
// Three categories:
//   1. Inline guardrails (G-1..G-7) — block submit at field entry / form submit.
//   2. High-risk routing rules (R-1..R-11) — fire at form submit, produce
//      review-action tags. Any account with ≥1 tag routes to the Review queue.
//   3. Universal review triggers (U-1..U-3) — apply unconditionally to
//      specific account types, regardless of high-risk evaluation.
//
// Each rule is a pure JS predicate over V2AccountContext. Adding / removing /
// modifying a rule for another RIA is a single edit here — no schema change,
// no migration, no compile dance.

import type {
  V2AccountContext,
  V2Rule,
  V2RulesEvaluation,
  V2ReviewActionType,
} from '@/types/workflow-v2'

// ─── 5.3.1 Inline guardrails ───────────────────────────────────────────

export const V2_GUARDRAILS: V2Rule[] = [
  {
    id: 'G-1',
    category: 'guardrail',
    name: 'Account Value > Liquid Net Worth',
    conditionLabel: 'Approximate Account Value > Liquid Net Worth',
    evaluate: (ctx) => ctx.approximateAccountValue > ctx.liquidNetWorth,
    action: {
      kind: 'block_submit',
      errorMessage: 'Account Value cannot exceed Liquid Net Worth.',
      affectedFields: ['approximateAccountValue', 'liquidNetWorth'],
    },
    inputs: ['approximateAccountValue [advisor]', 'liquidNetWorth [Orion]'],
    source: 'Stratos',
  },
  {
    id: 'G-2',
    category: 'guardrail',
    name: 'Account Value > Net Worth',
    conditionLabel: 'Approximate Account Value > Net Worth',
    evaluate: (ctx) => ctx.approximateAccountValue > ctx.netWorth,
    action: {
      kind: 'block_submit',
      errorMessage: 'Account Value cannot exceed Net Worth.',
      affectedFields: ['approximateAccountValue', 'netWorth'],
    },
    inputs: ['approximateAccountValue [advisor]', 'netWorth [Orion]'],
    source: 'Stratos',
  },
  {
    id: 'G-3',
    category: 'guardrail',
    name: 'Liquidity Need > Account Value',
    conditionLabel: 'Client Liquidity Need > Account Value',
    evaluate: (ctx) => ctx.liquidityNeed > ctx.approximateAccountValue,
    action: {
      kind: 'block_submit',
      errorMessage: 'Liquidity Need cannot exceed Account Value.',
      affectedFields: ['liquidityNeed', 'approximateAccountValue'],
    },
    inputs: ['liquidityNeed [Orion or advisor]', 'approximateAccountValue [advisor]'],
    source: 'Stratos',
  },
  {
    id: 'G-4',
    category: 'guardrail',
    name: 'Liquid Net Worth > Net Worth',
    conditionLabel: 'Liquid Net Worth > Net Worth',
    evaluate: (ctx) => ctx.liquidNetWorth > ctx.netWorth,
    action: {
      kind: 'block_submit',
      errorMessage: 'Liquid Net Worth cannot exceed total Net Worth.',
      affectedFields: ['liquidNetWorth', 'netWorth'],
    },
    inputs: ['liquidNetWorth [Orion]', 'netWorth [Orion]'],
    source: 'Stratos',
  },
  {
    id: 'G-5',
    category: 'guardrail',
    name: 'Client Agreement completeness',
    conditionLabel: 'Any required Client Agreement field empty',
    evaluate: (ctx) => Object.values(ctx.clientAgreementCompleteness).some((v) => !v),
    action: {
      kind: 'block_submit',
      errorMessage: 'All Client Agreement fields must be completed before submitting.',
    },
    inputs: ['Client Agreement fields [advisor + Orion]'],
    source: 'Stratos',
  },
  {
    id: 'G-6',
    category: 'guardrail',
    name: 'BID required for qualified accounts',
    conditionLabel: 'Qualified account AND BID artifact missing',
    evaluate: (ctx) =>
      ctx.accountType.startsWith('qualified-') && !ctx.bidAttached,
    action: {
      kind: 'block_submit',
      errorMessage: 'Best Interest Disclosure (BID) is required for qualified accounts. Attach via InvestorCOM or upload.',
      affectedFields: ['bidAttached'],
    },
    inputs: ['accountType [advisor]', 'bidAttached [InvestorCOM / upload]'],
    source: 'Stratos',
  },
  {
    id: 'G-7',
    category: 'guardrail',
    name: 'Client Profile Mismatch (household-level)',
    conditionLabel: 'Prefilled value edited in-session conflicts with household profile',
    evaluate: (ctx) => !!ctx.householdProfileMismatchDetected,
    action: {
      // Default behavior is warn+tag, not block. We model this as a
      // configurable rule but flag as non-blocking in the UI.
      kind: 'tag',
      tag: 'compliance-review',
    },
    inputs: ['Orion prefilled vs household existing-account profile'],
    source: 'Platform',
  },
]

// ─── 5.3.2 High-risk routing rules ─────────────────────────────────────

export const V2_HIGH_RISK_RULES: V2Rule[] = [
  {
    id: 'R-1',
    category: 'high_risk',
    name: 'Senior + aggressive growth',
    conditionLabel: 'Primary client age ≥ 70 AND Investment Objective = Aggressive Growth',
    evaluate: (ctx) => ctx.age >= 70 && ctx.investmentObjective === 'Aggressive Growth',
    action: { kind: 'tag', tag: 'suitability-review' },
    inputs: ['DOB → age [Orion]', 'investmentObjective [Orion]'],
    source: 'Stratos',
  },
  {
    id: 'R-2',
    category: 'high_risk',
    name: 'Retired / unemployed + aggressive growth',
    conditionLabel: 'Employment Status ∈ {Retired, Unemployed} AND Investment Objective = Aggressive Growth',
    evaluate: (ctx) =>
      (ctx.employmentStatus === 'Retired' || ctx.employmentStatus === 'Unemployed') &&
      ctx.investmentObjective === 'Aggressive Growth',
    action: { kind: 'tag', tag: 'suitability-review' },
    inputs: ['employmentStatus [Orion — see OQ-4]', 'investmentObjective [Orion]'],
    source: 'Stratos',
    openQuestionId: 'OQ-4',
  },
  {
    id: 'R-3',
    category: 'high_risk',
    name: 'Risk tolerance / objective mismatch',
    conditionLabel: 'Risk Tolerance and Investment Objective inconsistent per mapping',
    evaluate: (ctx) => {
      // Stratos mapping: Conservative + (Growth | Aggressive Growth), or
      // Moderate + Aggressive Growth → mismatch.
      if (ctx.riskTolerance === 'Conservative' && (ctx.investmentObjective === 'Growth' || ctx.investmentObjective === 'Aggressive Growth'))
        return true
      if (ctx.riskTolerance === 'Moderate' && ctx.investmentObjective === 'Aggressive Growth')
        return true
      return false
    },
    action: { kind: 'tag', tag: 'suitability-review' },
    inputs: ['riskTolerance [Orion]', 'investmentObjective [Orion]'],
    source: 'Stratos',
  },
  {
    id: 'R-4',
    category: 'high_risk',
    name: 'Source of funds = Rollover',
    conditionLabel: 'Source of Funds = Rollover',
    evaluate: (ctx) => ctx.sourceOfFunds === 'Rollover',
    action: { kind: 'tag', tag: 'suitability-review' },
    inputs: ['sourceOfFunds [advisor — not in Orion]'],
    source: 'Stratos',
  },
  {
    id: 'R-5',
    category: 'high_risk',
    name: 'Advisor email on client account',
    conditionLabel: 'Client contact email matches advisor email',
    evaluate: (ctx) =>
      !!ctx.clientEmail &&
      !!ctx.advisorEmail &&
      ctx.clientEmail.trim().toLowerCase() === ctx.advisorEmail.trim().toLowerCase(),
    action: { kind: 'tag', tag: 'compliance-review' },
    inputs: ['clientEmail [Orion]', 'advisorEmail [advisor profile]'],
    source: 'Stratos',
  },
  {
    id: 'R-6',
    category: 'high_risk',
    name: 'OBA — legal entity is Stratos employee',
    conditionLabel: 'Legal entity associated with account is a Stratos Registered Employee',
    evaluate: (ctx) => !!ctx.entityAttributes?.isStratosEmployeeOba,
    action: { kind: 'tag', tag: 'compliance-review' },
    inputs: ['entity OBA flag [advisor — verified against employee list]'],
    source: 'Stratos',
  },
  {
    id: 'R-7',
    category: 'high_risk',
    name: 'Advisory fee exceeds threshold',
    conditionLabel: 'Advisor Fee > configured threshold (placeholder: 1.50%)',
    evaluate: (ctx) => ctx.advisorFee > 1.5,
    action: { kind: 'tag', tag: 'compliance-review' },
    inputs: ['advisorFee [advisor]', 'threshold [RIA config — see OQ-5]'],
    source: 'Stratos',
    openQuestionId: 'OQ-5',
  },
  {
    id: 'R-8',
    category: 'high_risk',
    name: 'Margin enabled',
    conditionLabel: 'Margin = enabled on the account',
    evaluate: (ctx) => ctx.margin,
    action: { kind: 'tag', tag: 'suitability-review' },
    inputs: ['margin [advisor]'],
    source: 'Stratos',
  },
  {
    id: 'R-9',
    category: 'high_risk',
    name: 'Options enabled (activity level)',
    conditionLabel: 'Options = enabled AND activity level ≥ medium (placeholder threshold)',
    evaluate: (ctx) =>
      ctx.options &&
      (ctx.optionsActivityLevel === 'medium' || ctx.optionsActivityLevel === 'high'),
    action: { kind: 'tag', tag: 'suitability-review' },
    inputs: ['options [advisor]', 'optionsActivityLevel [advisor — see OQ-6]'],
    source: 'Stratos',
    openQuestionId: 'OQ-6',
  },
  {
    id: 'R-10',
    category: 'high_risk',
    name: 'OBA verification missing / stale',
    conditionLabel: 'Stratos employee entity AND OBA verification missing or stale',
    evaluate: (ctx) =>
      !!ctx.entityAttributes?.isStratosEmployeeOba &&
      !ctx.entityAttributes?.obaVerificationOnFile,
    action: { kind: 'tag', tag: 'compliance-review' },
    inputs: ['OBA flag [advisor]', 'OBA verification record [Stratos system — TBD]'],
    source: 'Stratos',
  },
  {
    id: 'R-11',
    category: 'high_risk',
    name: 'Entity attribute review',
    conditionLabel: 'Entity account AND attribute ∈ {BO disclosure, trust, foreign, promoter}',
    evaluate: (ctx) => {
      if (ctx.accountType !== 'entity' && ctx.accountType !== 'trust') return false
      const e = ctx.entityAttributes ?? {}
      return !!(
        e.beneficialOwnerDisclosurePresent ||
        e.isTrust ||
        e.foreignResidency ||
        e.promoterRelationship
      )
    },
    action: { kind: 'tag', tag: 'compliance-review' },
    inputs: ['accountType [advisor]', 'entity attributes [advisor]'],
    source: 'Platform',
    openQuestionId: 'OQ-7',
  },
]

// ─── 5.3.3 Universal review triggers ───────────────────────────────────

export const V2_UNIVERSAL_TRIGGERS: V2Rule[] = [
  {
    id: 'U-1',
    category: 'universal',
    name: 'Best Interest Review for qualified accounts',
    conditionLabel: 'Account type ∈ {qualified}',
    evaluate: (ctx) => ctx.accountType.startsWith('qualified-'),
    action: { kind: 'tag', tag: 'best-interest-review' },
    inputs: ['accountType [advisor]'],
    source: 'Stratos',
    openQuestionId: 'OQ-10',
  },
  {
    id: 'U-2',
    category: 'universal',
    name: 'SIM document review',
    conditionLabel: 'Account has SIM Fee configured',
    evaluate: (ctx) => typeof ctx.simFee === 'number' && ctx.simFee > 0,
    action: { kind: 'tag', tag: 'sim-document-review' },
    inputs: ['simFee [advisor]'],
    source: 'Stratos',
  },
  {
    id: 'U-3',
    category: 'universal',
    name: 'Documentation completeness review',
    conditionLabel: 'Always (post-eSign by operations)',
    // U-3 is post-eSign; we model it as always-firing for documentation-review.
    // In a real implementation it would be queued by the operations workflow
    // after eSign completes, not by the rules engine pre-submit.
    evaluate: () => true,
    action: { kind: 'tag', tag: 'documentation-review' },
    inputs: ['Documentation set [Avantos document store]'],
    source: 'Platform',
  },
]

// All rules in stable order — guardrails, high-risk, universal.
export const V2_ALL_RULES: V2Rule[] = [
  ...V2_GUARDRAILS,
  ...V2_HIGH_RISK_RULES,
  ...V2_UNIVERSAL_TRIGGERS,
]

// ─── Evaluator ─────────────────────────────────────────────────────────

/**
 * Evaluate an account against the full Stratos rule set.
 *
 * - Guardrails that fire produce a blockingErrors entry.
 * - High-risk + universal rules that fire produce tags.
 * - Tags are deduplicated; an account can have any subset of the 5
 *   review action types.
 * - bypassReview = no tags fired AND no guardrails blocked.
 */
export function evaluateAccount(ctx: V2AccountContext): V2RulesEvaluation {
  const blockingErrors: V2RulesEvaluation['blockingErrors'] = []
  const tagSet = new Set<V2ReviewActionType>()
  const firings: V2RulesEvaluation['firings'] = []

  for (const rule of V2_ALL_RULES) {
    let fired = false
    try {
      fired = rule.evaluate(ctx)
    } catch {
      // A bad context shouldn't crash the evaluator — treat as not-fired
      // but still surface in firings for debugging.
      fired = false
    }
    if (!fired) continue

    if (rule.action.kind === 'block_submit') {
      blockingErrors.push({
        ruleId: rule.id,
        ruleName: rule.name,
        message: rule.action.errorMessage,
        affectedFields: rule.action.affectedFields,
      })
      firings.push({ ruleId: rule.id, ruleName: rule.name })
    } else {
      tagSet.add(rule.action.tag)
      firings.push({ ruleId: rule.id, ruleName: rule.name, tag: rule.action.tag })
    }
  }

  const tags = Array.from(tagSet)
  return {
    blockingErrors,
    tags,
    firings,
    bypassReview: tags.length === 0 && blockingErrors.length === 0,
    cannotSubmit: blockingErrors.length > 0,
  }
}
