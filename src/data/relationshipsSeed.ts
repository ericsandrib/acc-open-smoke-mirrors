// Relationships overview seed — Zions POC instance (Spec 007 Phase 3).
//
// The advisor's book of business. Reuses the locked identity-graph personas so the
// Relationships overview, the cross-silo Relationship Graph, and the opportunity
// surfacing all tell one coherent story:
//   • Whitmore Household — unified across Fi-Tek + LPL + eMoney + Amegy (Existing)
//   • City of Cedar Falls — Corporate Trust deal relationship (Existing)
//   • Marcus Hale / Janet Cole — cross-silo prospects surfaced by identity unification
//
// Columns map to approved Zions source systems via the unified relationship model
// (Salesforce / Fi-Tek / LPL); no production integration implied. Synthetic data.

export type RelationshipType = 'Prospective' | 'New' | 'Existing'

export interface Relationship {
  id: string
  household: string
  advisor: string
  type: RelationshipType
  aum: number | null
  targetedAum: number | null
  updatedAt: string
  status: string | null
}

export const RELATIONSHIPS_SEED: Relationship[] = [
  // ── Existing (managed wealth + corporate trust) ──
  { id: 'r-whitmore',    household: 'Whitmore Household',       advisor: 'Priya Raman',   type: 'Existing',    aum: 5_560_000,  targetedAum: null,      updatedAt: '2 days ago',  status: 'Onboarded · Wealth + Bank' },
  { id: 'r-cedar-falls', household: 'City of Cedar Falls',      advisor: 'Daniel Okafor', type: 'Existing',    aum: 42_000_000, targetedAum: null,      updatedAt: '1 day ago',   status: 'Corporate Trust · active deal' },
  { id: 'r-hargrove',    household: 'Hargrove Foundation',      advisor: 'Sofia Delgado', type: 'Existing',    aum: 12_400_000, targetedAum: null,      updatedAt: '1 week ago',  status: 'Onboarded' },
  { id: 'r-beckett',     household: 'Beckett Living Trust',     advisor: 'Sofia Delgado', type: 'Existing',    aum: 8_100_000,  targetedAum: null,      updatedAt: '4 days ago',  status: 'Onboarded' },
  { id: 'r-vance',       household: 'Vance Family Trust',       advisor: 'Marcus Webb',   type: 'Existing',    aum: 6_900_000,  targetedAum: null,      updatedAt: '5 days ago',  status: 'Onboarded' },
  { id: 'r-nakamura',    household: 'Nakamura Family',          advisor: 'Priya Raman',   type: 'Existing',    aum: 3_250_000,  targetedAum: null,      updatedAt: '3 days ago',  status: 'Onboarded' },
  // ── New (onboarding in flight) ──
  { id: 'r-cedar-ridge', household: 'Cedar Ridge Holdings LLC', advisor: 'Daniel Okafor', type: 'New',         aum: null,       targetedAum: 5_000_000, updatedAt: '1 hour ago',  status: 'Commercial → wealth referral' },
  { id: 'r-tran',        household: 'Tran Family',              advisor: 'Marcus Webb',   type: 'New',         aum: 450_000,    targetedAum: 1_000_000, updatedAt: '6 hours ago', status: 'Account opening in progress' },
  { id: 'r-sandoval',    household: 'Sandoval Family',          advisor: 'Priya Raman',   type: 'New',         aum: 300_000,    targetedAum: 900_000,   updatedAt: 'yesterday',   status: 'KYC in review' },
  // ── Prospective (cross-silo surfaced + COI) ──
  { id: 'r-hale',        household: 'Marcus Hale',              advisor: 'Daniel Okafor', type: 'Prospective', aum: null,       targetedAum: 1_500_000, updatedAt: '1 hour ago',  status: 'Trust-officer prospect · Cedar Falls' },
  { id: 'r-cole',        household: 'Janet Cole',               advisor: 'Daniel Okafor', type: 'Prospective', aum: null,       targetedAum: 5_000_000, updatedAt: '2 hours ago', status: 'Bank-inflow prospect · $8.5M CB&T' },
  { id: 'r-pearson',     household: 'Pearson, James R.',        advisor: 'Priya Raman',   type: 'Prospective', aum: null,       targetedAum: 750_000,   updatedAt: '3 days ago',  status: 'Referral · COI' },
]

// --- derived metrics (header summary cards) --------------------------------

function sumBy(rows: Relationship[], key: 'aum' | 'targetedAum'): number {
  return rows.reduce((t, r) => t + (r[key] ?? 0), 0)
}

function compactUsd(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return `${n}`
}

const _prospective = RELATIONSHIPS_SEED.filter((r) => r.type === 'Prospective')
const _new = RELATIONSHIPS_SEED.filter((r) => r.type === 'New')
const _existing = RELATIONSHIPS_SEED.filter((r) => r.type === 'Existing')

export const RELATIONSHIP_METRICS = {
  totalClients: RELATIONSHIPS_SEED.length,
  totalAumWealth: compactUsd(sumBy(_existing, 'aum')),
  annualizedPremiumLife: 0,
  annualizedPremiumDisability: 0,
  prospective: {
    total: _prospective.length,
    targetedAum: compactUsd(sumBy(_prospective, 'targetedAum')),
  },
  new: {
    total: _new.length,
    aum: compactUsd(sumBy(_new, 'aum')),
  },
  existing: {
    total: _existing.length,
    aum: compactUsd(sumBy(_existing, 'aum')),
  },
}
