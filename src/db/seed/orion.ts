// Orion-derived attributes for the synthetic seed.
//
// Source of truth: src/data/orionFieldMap.ts — the Y/N spreadsheet.
//
// Every value here corresponds to an Orion field flagged `available = true`
// in the field map. Fields flagged `available = false` are intentionally
// absent; the UI surfaces them via <NaField />.
//
// Values are deterministic from the household slug so each household has a
// consistent profile across page loads.

import type { SeedHousehold } from './data'

// Reference data lists — all flagged available in Orion.
export const CUSTODIAN_LIST = ['Fidelity']
export const ACCOUNT_TYPES = [
  'Joint Brokerage',
  'Traditional IRA',
  'Roth IRA',
  '401(k) Rollover',
  'Revocable Trust',
] as const
export const MGMT_STYLES = [
  'Discretionary — Core Portfolio',
  'Discretionary — Tax Aware',
  'Non-Discretionary',
] as const
export const FEE_SCHEDULES = [
  'Flat 1.00% (Standard)',
  'Flat 0.85% (UHNW)',
  'Tiered Advisory',
] as const
export const PAYOUT_SCHEDULES = ['Quarterly in arrears', 'Monthly in arrears'] as const
export const SUB_ADVISORS = ['None', 'Internal Equity Team', 'Internal Fixed Income'] as const
export const REPS = ['GF — Greta Friedrichs', 'GF2 — Greta Friedrichs (joint)'] as const
export const DOWNLOAD_SOURCES = ['Orion daily download', 'Manual entry'] as const
export const BUSINESS_LINES = ['Wealth Management', 'Retirement', 'Trust'] as const
export const SHARE_CLASSES = ['Institutional', 'Advisor', 'I-Class', 'A-Class'] as const

// ─── Household-level Orion suitability + risk profile ──────────────────

export interface OrionHouseholdProfile {
  // Household > General
  statementDelivery: 'Mail' | 'eDelivery' | 'Both'
  videoStatementDelivery: 'Enabled' | 'Disabled'
  category: 'Standard' | 'UHNW' | 'Mass Affluent'
  advClientCategory: 'Individual' | 'Retirement Account' | 'Trust'
  primaryRepresentative: string
  taxId: string  // Display-safe last-4 only

  // Registration > Suitability
  investmentObjective: 'Growth' | 'Income' | 'Capital Preservation' | 'Balanced'
  timeHorizon: 'Short (<3 yrs)' | 'Intermediate (3–10 yrs)' | 'Long (>10 yrs)'
  liquidNetWorth: number
  netWorth: number
  netIncome: number
  stockPercent: number   // 0–100
  bondPercent: number    // 0–100
  investmentKnowledge: 'Limited' | 'Good' | 'Extensive'
  investmentExperience: 'Limited' | 'Good' | 'Extensive'

  // Registration > Risk
  riskExposure: 'Conservative' | 'Moderate' | 'Aggressive'
  riskTolerance: 'Low' | 'Medium' | 'High'

  // Registration > Audit
  editedBy: string
  createdBy: string
}

const OBJECTIVES: OrionHouseholdProfile['investmentObjective'][] = [
  'Growth', 'Income', 'Capital Preservation', 'Balanced',
]
const HORIZONS: OrionHouseholdProfile['timeHorizon'][] = [
  'Short (<3 yrs)', 'Intermediate (3–10 yrs)', 'Long (>10 yrs)',
]
const KNOWLEDGE: OrionHouseholdProfile['investmentKnowledge'][] = ['Limited', 'Good', 'Extensive']
const RISK_EXP: OrionHouseholdProfile['riskExposure'][] = ['Conservative', 'Moderate', 'Aggressive']
const RISK_TOL: OrionHouseholdProfile['riskTolerance'][] = ['Low', 'Medium', 'High']

// Deterministic pick from an array based on a string seed.
function pick<T>(seed: string, arr: readonly T[], salt = 0): T {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return arr[(h + salt) % arr.length]
}

function lastFour(slug: string): string {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return String(1000 + (h % 9000))
}

export function profileForHousehold(hh: SeedHousehold): OrionHouseholdProfile {
  const stockPct = pick(hh.slug, [40, 50, 60, 70, 80], 1)
  return {
    statementDelivery: pick(hh.slug, ['Mail', 'eDelivery', 'Both'], 2),
    videoStatementDelivery: pick(hh.slug, ['Enabled', 'Disabled'], 3),
    category:
      hh.totalAum >= 1_000_000 ? 'UHNW' : hh.totalAum >= 250_000 ? 'Standard' : 'Mass Affluent',
    advClientCategory: pick(hh.slug, ['Individual', 'Retirement Account', 'Trust'], 4),
    primaryRepresentative: 'GF — Greta Friedrichs',
    taxId: `•••-••-${lastFour(hh.slug)}`,
    investmentObjective: pick(hh.slug, OBJECTIVES, 5),
    timeHorizon:
      hh.type === 'Prospect' ? 'Intermediate (3–10 yrs)' : pick(hh.slug, HORIZONS, 6),
    liquidNetWorth: Math.round(hh.totalAum * 1.2),
    netWorth: Math.round(hh.totalAum * 2.8),
    netIncome: Math.round(Math.max(100_000, hh.totalAum * 0.12)),
    stockPercent: stockPct,
    bondPercent: 100 - stockPct,
    investmentKnowledge: pick(hh.slug, KNOWLEDGE, 7),
    investmentExperience: pick(hh.slug, KNOWLEDGE, 8),
    riskExposure: pick(hh.slug, RISK_EXP, 9),
    riskTolerance: pick(hh.slug, RISK_TOL, 10),
    editedBy: 'Greta Friedrichs',
    createdBy: 'Onboarding workflow',
  }
}

// ─── Account-level Orion details ────────────────────────────────────────

export interface OrionAccountProfile {
  discretionary: 'Yes' | 'No'
  custodialRepCode: string
  fundFamily: string
  managementStyle: string
  advReportable: 'Yes' | 'No'
  subAdvisor: string
  managed: 'Yes' | 'No'
  downloadSource: string
  shareClass: string
  businessLine: string
  priceHierarchy: 'Custodian first' | 'Vendor first'
  // Billing
  payMethod: 'Direct debit' | 'Invoice' | 'Bill-to-account'
  feeSchedule: string
  payoutSchedule: string
  billingStatus: 'Active' | 'On hold' | 'Closed'
  // Billing > Frequency
  billingStyle: 'In arrears' | 'In advance'
  frequency: 'Quarterly' | 'Monthly'
  cycleMonth: 'Calendar' | 'Anniversary'
  valuationMethod: 'Average daily balance' | 'Period-end balance'
  billingStartDate: string
}

export function profileForAccount(slug: string, accountIdx: number): OrionAccountProfile {
  const seed = `${slug}-${accountIdx}`
  return {
    discretionary: pick(seed, ['Yes', 'No'] as const),
    custodialRepCode: `R${1000 + (accountIdx + 1) * 17}`,
    fundFamily: pick(seed, ['Vanguard', 'iShares', 'Fidelity', 'Dimensional'] as const),
    managementStyle: pick(seed, MGMT_STYLES),
    advReportable: 'Yes',
    subAdvisor: pick(seed, SUB_ADVISORS),
    managed: pick(seed, ['Yes', 'No'] as const, 1),
    downloadSource: 'Orion daily download',
    shareClass: pick(seed, SHARE_CLASSES),
    businessLine: pick(seed, BUSINESS_LINES),
    priceHierarchy: pick(seed, ['Custodian first', 'Vendor first'] as const),
    payMethod: pick(seed, ['Direct debit', 'Invoice', 'Bill-to-account'] as const),
    feeSchedule: pick(seed, FEE_SCHEDULES),
    payoutSchedule: pick(seed, PAYOUT_SCHEDULES),
    billingStatus: 'Active',
    billingStyle: 'In arrears',
    frequency: pick(seed, ['Quarterly', 'Monthly'] as const),
    cycleMonth: 'Calendar',
    valuationMethod: pick(seed, ['Average daily balance', 'Period-end balance'] as const),
    billingStartDate: '2024-01-01',
  }
}
