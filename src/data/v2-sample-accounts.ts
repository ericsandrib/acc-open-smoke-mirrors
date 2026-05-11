// Sample accounts that exercise the V2 rules engine end-to-end.
//
// Five fixtures chosen to demonstrate distinct rule-engine outcomes:
//   1. clean-bypass     — no rules fire; bypasses review entirely (L3 → L5)
//   2. qualified-only   — only U-1 (qualified) + U-3 (docs) fire; best-interest queue
//   3. multi-tag-suit   — multiple suitability triggers fire (senior + objective mismatch)
//   4. multi-tag-comp   — compliance triggers fire (advisor=client email, advisory fee)
//   5. blocked-guardrail — guardrail violation (Account Value > Net Worth) blocks submit
//
// All data is synthetic and intentionally drawn from the seeded relationships
// so the sample accounts visually echo the existing prototype households.

import type { V2AccountContext } from '@/types/workflow-v2'

export interface V2SampleAccount {
  id: string
  label: string
  /** One-line description of the outcome this fixture demonstrates */
  outcome: string
  /** Tags expected to fire — used by the rules-explorer for verification */
  expectedTagsHint?: string[]
  context: V2AccountContext
}

const EMPTY_AGREEMENT: V2AccountContext['clientAgreementCompleteness'] = {
  subAdvisor: true,
  advisorFee: true,
  simFee: true,
  transactionCharges: true,
  annualLiquidityNeeds: true,
  investmentTimeHorizon: true,
  investmentObjective: true,
  householdData: true,
  financialInformation: true,
  clientBackground: true,
}

export const V2_SAMPLE_ACCOUNTS: V2SampleAccount[] = [
  // 1) Clean bypass — no review needed
  {
    id: 'sample-clean',
    label: 'Robert Whitfield — Joint Brokerage',
    outcome:
      'No rules fire. Bypasses Lane 4 review entirely; advances directly to eSign once L2 KYC clears.',
    expectedTagsHint: ['documentation-review (post-eSign only)'],
    context: {
      primaryClientId: 'co_whitfield',
      primaryClientName: 'Robert Whitfield',
      age: 65,
      employmentStatus: 'Employed',
      liquidNetWorth: 250_000,
      netWorth: 600_000,
      netIncome: 180_000,
      riskTolerance: 'Moderate',
      investmentObjective: 'Balanced',
      timeHorizon: 'Long',
      clientEmail: 'rwhitfield@example.com',
      liquidityNeed: 25_000,
      accountType: 'individual',
      approximateAccountValue: 105_000,
      sourceOfFunds: 'Transfer',
      advisorFee: 1.0,
      simFee: undefined,
      margin: false,
      options: false,
      advisorEmail: 'greta.friedrichs@stratos.example',
      advisorLicensedStates: ['AZ', 'CA', 'CO'],
      clientStateOfResidence: 'AZ',
      bidAttached: false,
      adv2bAttached: true,
      clientAgreementCompleteness: EMPTY_AGREEMENT,
    },
  },

  // 2) Qualified IRA — universal review only
  {
    id: 'sample-qualified',
    label: 'Nina Patel — Traditional IRA',
    outcome:
      'Only universal triggers fire: U-1 (qualified → best-interest-review) + U-3 (documentation, post-eSign).',
    expectedTagsHint: ['best-interest-review', 'documentation-review'],
    context: {
      primaryClientId: 'co_patel',
      primaryClientName: 'Nina Patel',
      age: 46,
      employmentStatus: 'Employed',
      liquidNetWorth: 500_000,
      netWorth: 2_000_000,
      netIncome: 350_000,
      riskTolerance: 'Moderate',
      investmentObjective: 'Growth',
      timeHorizon: 'Long',
      clientEmail: 'npatel@example.com',
      liquidityNeed: 50_000,
      accountType: 'qualified-ira',
      approximateAccountValue: 250_000,
      sourceOfFunds: 'New money',
      advisorFee: 1.0,
      margin: false,
      options: false,
      advisorEmail: 'greta.friedrichs@stratos.example',
      advisorLicensedStates: ['AZ', 'CA', 'CO'],
      clientStateOfResidence: 'CA',
      bidAttached: true,  // qualified ⇒ BID required and present
      adv2bAttached: true,
      clientAgreementCompleteness: EMPTY_AGREEMENT,
    },
  },

  // 3) Multi-tag suitability — senior, objective mismatch, rollover
  {
    id: 'sample-multi-suit',
    label: 'Olivia Reyes — Aggressive Growth Joint',
    outcome:
      'Three suitability triggers fire: R-1 (senior + aggressive), R-3 (objective mismatch), R-4 (rollover). Routes to suitability-review.',
    expectedTagsHint: ['suitability-review'],
    context: {
      primaryClientId: 'co_reyes',
      primaryClientName: 'Olivia Reyes',
      age: 74,
      employmentStatus: 'Retired',
      liquidNetWorth: 800_000,
      netWorth: 3_500_000,
      netIncome: 90_000,
      riskTolerance: 'Conservative',  // mismatch with Aggressive Growth → R-3
      investmentObjective: 'Aggressive Growth',  // R-1 + R-3
      timeHorizon: 'Intermediate',
      clientEmail: 'o.reyes@example.com',
      liquidityNeed: 60_000,
      accountType: 'joint',
      approximateAccountValue: 450_000,
      sourceOfFunds: 'Rollover',  // R-4
      advisorFee: 1.0,
      margin: false,
      options: false,
      advisorEmail: 'greta.friedrichs@stratos.example',
      advisorLicensedStates: ['AZ', 'CA', 'CO'],
      clientStateOfResidence: 'AZ',
      bidAttached: false,
      adv2bAttached: true,
      clientAgreementCompleteness: EMPTY_AGREEMENT,
    },
  },

  // 4) Multi-tag compliance — advisor=client email, high fee, margin
  {
    id: 'sample-multi-comp',
    label: 'Henry Foster — Margin Account',
    outcome:
      'Compliance (R-5 advisor=client email, R-7 high fee) + suitability (R-8 margin) all fire. Two parallel review actions consolidate.',
    expectedTagsHint: ['compliance-review', 'suitability-review'],
    context: {
      primaryClientId: 'co_foster',
      primaryClientName: 'Henry Foster',
      age: 56,
      employmentStatus: 'Self-Employed',
      liquidNetWorth: 350_000,
      netWorth: 1_200_000,
      netIncome: 280_000,
      riskTolerance: 'Aggressive',
      investmentObjective: 'Growth',
      timeHorizon: 'Long',
      // R-5: client email matches advisor email → compliance-review
      clientEmail: 'greta.friedrichs@stratos.example',
      liquidityNeed: 30_000,
      accountType: 'individual',
      approximateAccountValue: 200_000,
      sourceOfFunds: 'Transfer',
      advisorFee: 1.85,  // R-7: > 1.50 threshold
      margin: true,       // R-8
      options: false,
      advisorEmail: 'greta.friedrichs@stratos.example',
      advisorLicensedStates: ['AZ', 'CA', 'CO'],
      clientStateOfResidence: 'CA',
      bidAttached: false,
      adv2bAttached: true,
      clientAgreementCompleteness: EMPTY_AGREEMENT,
    },
  },

  // 5) Blocked guardrail — Account Value > Net Worth
  {
    id: 'sample-blocked',
    label: 'Dana Nguyen — Over-Sized Brokerage',
    outcome:
      'G-2 fires (Account Value > Net Worth). Submit is blocked at L1 — advisor must correct before workflow advances.',
    expectedTagsHint: ['(blocked at L1 — no tags produced)'],
    context: {
      primaryClientId: 'co_nguyen',
      primaryClientName: 'Dana Nguyen',
      age: 61,
      employmentStatus: 'Employed',
      liquidNetWorth: 150_000,
      netWorth: 300_000,
      netIncome: 140_000,
      riskTolerance: 'Moderate',
      investmentObjective: 'Balanced',
      timeHorizon: 'Intermediate',
      clientEmail: 'd.nguyen@example.com',
      liquidityNeed: 20_000,
      accountType: 'individual',
      approximateAccountValue: 400_000,  // > netWorth 300k → G-2 blocks
      sourceOfFunds: 'Transfer',
      advisorFee: 1.0,
      margin: false,
      options: false,
      advisorEmail: 'greta.friedrichs@stratos.example',
      advisorLicensedStates: ['AZ', 'CA', 'CO'],
      clientStateOfResidence: 'CO',
      bidAttached: false,
      adv2bAttached: true,
      clientAgreementCompleteness: EMPTY_AGREEMENT,
    },
  },
]
