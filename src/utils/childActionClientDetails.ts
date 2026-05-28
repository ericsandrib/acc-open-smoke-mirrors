import type { FinancialAccount, RelatedParty, WorkflowState } from '@/types/workflow'

const DEFAULT_PLANNING_GROUP = 'Retirement Planning Group'
const DEFAULT_JOINED_LABEL = 'Joined Jan 6, 2021'

/** Household-facing display name (e.g. "John and Jane Smith"). */
export function buildHouseholdDisplayName(
  relatedParties: RelatedParty[],
  journeyName?: string,
): string {
  const members = relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)
  const namedAdults = members.filter((p) => p.role === 'Client' || p.role === 'Spouse' || p.isPrimary)

  if (namedAdults.length >= 2) {
    const lastNames = new Set(
      namedAdults.map((p) => p.lastName?.trim() || p.name.trim().split(/\s+/).pop() || ''),
    )
    if (lastNames.size === 1 && [...lastNames][0]) {
      const firsts = namedAdults
        .map((p) => p.firstName?.trim() || p.name.trim().split(/\s+/)[0] || '')
        .filter(Boolean)
      const last = [...lastNames][0]
      if (firsts.length === 2) return `${firsts[0]} and ${firsts[1]} ${last}`
      if (firsts.length > 2) {
        return `${firsts.slice(0, -1).join(', ')} and ${firsts[firsts.length - 1]} ${last}`
      }
    }
  }

  const primary = members.find((p) => p.isPrimary) ?? members[0]
  if (primary?.name?.trim()) return primary.name.trim()
  const journey = journeyName?.trim()
  if (journey) return journey
  return 'Client household'
}

export function formatHouseholdJoinedLabel(journeyStartedAt?: string): string {
  if (!journeyStartedAt) return DEFAULT_JOINED_LABEL
  const d = new Date(journeyStartedAt)
  if (Number.isNaN(d.getTime())) return DEFAULT_JOINED_LABEL
  return `Joined ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function parseEstimatedValue(raw?: string): number {
  const n = Number.parseInt((raw ?? '').replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

export function sumHouseholdEstimatedAssets(accounts: FinancialAccount[]): number {
  return accounts.reduce((sum, acct) => sum + parseEstimatedValue(acct.estimatedValue), 0)
}

export function formatUsdCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function resolvePlanningGroupLabel(state: WorkflowState): string {
  const fromConfig = (
    state.journeyOnboardingConfig as { planningGroup?: string } | undefined
  )?.planningGroup
  if (typeof fromConfig === 'string' && fromConfig.trim()) return fromConfig.trim()
  return DEFAULT_PLANNING_GROUP
}
