// Account & Owners step guardrails.
//
// Three system guardrails fire when the advisor clicks Next on the
// Account & Owners sub-task of an account-opening child. Any failure
// blocks navigation and surfaces the failing condition(s).
//
// Inputs:
//   • approximateAccountValue   — net-new numeric field on AccountProfileSection
//   • liquidityNeed             — net-new numeric field on AccountProfileSection
//   • each owner's netWorthRange / liquidNetWorthRange — ranges captured
//     on the owner profile (View & edit details modal). We parse the
//     range upper bound for comparison; if an owner has no range set,
//     we fall back to the household-level value or skip that owner.
//
// Rules (V2 spec §5.3.1 guardrails G-1, G-2, G-3):
//   G-1  Approximate Account Value > Liquid Net Worth → block
//   G-2  Approximate Account Value > Net Worth        → block
//   G-3  Client Liquidity Need > Account Value        → block

import type { WorkflowState } from '@/types/workflow'

export interface GuardrailViolation {
  id: 'G-1' | 'G-2' | 'G-3'
  message: string
}

/**
 * Parse a range label like "$150,000–$249,999" or "$1,000,000+" into
 * an upper bound. Returns null when the value can't be parsed.
 *
 * For open-ended ranges ("$5,000,000+"), we return the floor (5,000,000)
 * as the conservative comparison value — i.e. for a guardrail like
 * "Account Value > Net Worth", we treat the lowest possible net worth
 * within the range as the bound. This keeps the guardrail honest
 * without forcing exact numbers.
 */
function parseRangeUpperBound(raw: string | undefined | null): number | null {
  if (!raw) return null
  // Strip currency symbols, commas, whitespace; keep digits, dots, dashes, plus.
  const cleaned = raw.replace(/[$,\s]/g, '')
  // "1000000+" → floor 1,000,000 (open-ended; advisor's range is "at least this")
  if (cleaned.endsWith('+')) {
    const n = parseFloat(cleaned.slice(0, -1))
    return Number.isFinite(n) ? n : null
  }
  // "150000-249999" or "150000–249999" or "Under50000"
  const m = cleaned.match(/(\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)/)
  if (m) {
    const upper = parseFloat(m[2])
    return Number.isFinite(upper) ? upper : null
  }
  // "Under50000" / "Under-50000"
  const under = cleaned.match(/^Under(\d+)$/i)
  if (under) {
    const n = parseFloat(under[1])
    return Number.isFinite(n) ? n : null
  }
  // Fallback: parse first number we find
  const single = cleaned.match(/(\d+(?:\.\d+)?)/)
  if (single) {
    const n = parseFloat(single[1])
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Read approximateAccountValue + liquidityNeed off the account-info
 * task data for the active account-opening child.
 */
function readAccountInputs(
  state: WorkflowState,
  childId: string,
): { approxAccountValue: number | null; liquidityNeed: number | null } {
  // AccountProfileSection writes under the child's primary task data key.
  // The same data store also backs the `${childId}-account-info` key in
  // some flows; we read both for safety.
  const primary = (state.taskData[childId] ?? {}) as Record<string, unknown>
  const info = (state.taskData[`${childId}-account-info`] ?? {}) as Record<string, unknown>
  const merged = { ...primary, ...info }

  const toNum = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      const cleaned = v.replace(/[$,\s]/g, '')
      const n = parseFloat(cleaned)
      return Number.isFinite(n) ? n : null
    }
    return null
  }
  return {
    approxAccountValue: toNum(merged.approximateAccountValue),
    liquidityNeed: toNum(merged.liquidityNeed),
  }
}

/**
 * Resolve the net-worth + liquid-net-worth caps for the account by
 * looking at every selected owner. We take the SMALLEST upper bound
 * across owners as the comparison value — i.e. if Owner A has
 * $150K–$249K and Owner B has $1M+, the conservative cap is $249,999.
 *
 * Returns null when no owner has the range set; in that case the
 * guardrail simply doesn't fire (we don't have data to evaluate it).
 */
function resolveOwnerCaps(
  state: WorkflowState,
  childId: string,
): { liquidNetWorthCap: number | null; netWorthCap: number | null } {
  const ownersData = (state.taskData[`${childId}-account-owners`] ?? {}) as Record<string, unknown>
  // Owner slot rows reference relatedParties by id.
  const owners = (ownersData.owners as Array<{ type?: string; partyId?: string }> | undefined) ?? []
  const ownerPartyIds = owners
    .filter((o) => o.type === 'existing' && typeof o.partyId === 'string')
    .map((o) => o.partyId as string)

  const liquidUpperBounds: number[] = []
  const netUpperBounds: number[] = []

  for (const pid of ownerPartyIds) {
    const party = state.relatedParties.find((p) => p.id === pid)
    if (!party?.accountOwnerIndividual) continue
    const profile = party.accountOwnerIndividual
    const liquid = parseRangeUpperBound(profile.liquidNetWorthRange)
    const net = parseRangeUpperBound(profile.netWorthRange)
    if (liquid !== null) liquidUpperBounds.push(liquid)
    if (net !== null) netUpperBounds.push(net)
  }

  return {
    liquidNetWorthCap: liquidUpperBounds.length > 0 ? Math.min(...liquidUpperBounds) : null,
    netWorthCap: netUpperBounds.length > 0 ? Math.min(...netUpperBounds) : null,
  }
}

const fmtMoney = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

/**
 * Run the three guardrails. Returns an array of violations; empty array
 * means the advisor may proceed.
 *
 * Each guardrail only fires when its inputs are present — a missing
 * Approximate Account Value, for example, simply means we have nothing
 * to compare. The Next button uses field-level required validation to
 * catch that separately.
 */
export function runAccountOwnersGuardrails(
  state: WorkflowState,
  childId: string,
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = []
  const { approxAccountValue, liquidityNeed } = readAccountInputs(state, childId)
  const { liquidNetWorthCap, netWorthCap } = resolveOwnerCaps(state, childId)

  // G-1: Account Value > Liquid Net Worth
  if (
    approxAccountValue !== null &&
    liquidNetWorthCap !== null &&
    approxAccountValue > liquidNetWorthCap
  ) {
    violations.push({
      id: 'G-1',
      message: `Approximate Account Value (${fmtMoney(
        approxAccountValue,
      )}) is greater than the owner's Liquid Net Worth (range cap ${fmtMoney(
        liquidNetWorthCap,
      )}). Review the account value or update the owner's liquid net worth range.`,
    })
  }

  // G-2: Account Value > Net Worth
  if (
    approxAccountValue !== null &&
    netWorthCap !== null &&
    approxAccountValue > netWorthCap
  ) {
    violations.push({
      id: 'G-2',
      message: `Approximate Account Value (${fmtMoney(
        approxAccountValue,
      )}) is greater than the owner's Net Worth (range cap ${fmtMoney(
        netWorthCap,
      )}). Review the account value or update the owner's net worth range.`,
    })
  }

  // G-3: Liquidity Need > Account Value
  if (
    liquidityNeed !== null &&
    approxAccountValue !== null &&
    liquidityNeed > approxAccountValue
  ) {
    violations.push({
      id: 'G-3',
      message: `Client Liquidity Need (${fmtMoney(
        liquidityNeed,
      )}) is greater than the Approximate Account Value (${fmtMoney(
        approxAccountValue,
      )}). Lower the liquidity need or raise the account value.`,
    })
  }

  return violations
}
