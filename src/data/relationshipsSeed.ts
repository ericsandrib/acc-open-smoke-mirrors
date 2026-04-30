// Relationships dashboard seed data.
//
// 2026-04-28 working session w/ Chris Radzinski & Wes Hawkins:
//   • RENAME relationship → household (advisor language; row is household-level)
//   • REMOVE firm column (custodian rejected as replacement; multi-custodian per
//     household made it untenable)
//   • REMOVE zip-code column (not relevant on the overview)
//   • Source clarification: status + updatedAt come from Avantos
//   • Source clarification: aum comes from Orion (household rollup, existing only)
//
// Remaining columns mirror the agreed-upon Stratos overview shape:
//   Household       (Avantos relationship/household record)
//   Advisor         (rep mapping; Salesforce + Orion cross-walk)
//   Type            (Prospective / New / Existing)
//   Status          (Avantos onboarding state + relationship record)
//   AUM             (Orion household rollup, existing clients only)
//   Updated At      (Avantos last-modified)

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

// Intentionally sparse — Stratos overview, brand-new prototype.
export const RELATIONSHIPS_SEED: Relationship[] = [
  { id: 'r-lincoln',   household: 'Abraham Lincoln',  advisor: 'Eric Sandrib', type: 'Prospective', aum: null,    targetedAum: null,   updatedAt: '3 days ago', status: null },
  { id: 'r-acme',      household: 'Acme',             advisor: 'Eric Sandrib', type: 'Prospective', aum: null,    targetedAum: null,   updatedAt: '3 days ago', status: null },
  { id: 'r-sandler',   household: 'Adam Sandler',     advisor: 'Eric Sandrib', type: 'Prospective', aum: null,    targetedAum: null,   updatedAt: '3 days ago', status: null },
  { id: 'r-collins',   household: 'Ava Collins',      advisor: 'Eric Sandrib', type: 'Prospective', aum: null,    targetedAum: null,   updatedAt: '3 days ago', status: null },
  { id: 'r-pitt',      household: 'Brad Pitt',        advisor: 'Eric Sandrib', type: 'Prospective', aum: null,    targetedAum: null,   updatedAt: '3 days ago', status: null },
  { id: 'r-biz-413',   household: 'Business 4/13',    advisor: 'Eric Sandrib', type: 'Prospective', aum: null,    targetedAum: null,   updatedAt: '3 days ago', status: null },
  { id: 'r-meaney',    household: 'Erin Aiko Meaney', advisor: 'Eric Sandrib', type: 'Prospective', aum: null,    targetedAum: null,   updatedAt: '3 days ago', status: null },
  { id: 'r-erin-test', household: 'Erin test',        advisor: 'Eric Sandrib', type: 'Prospective', aum: null,    targetedAum: null,   updatedAt: '3 days ago', status: null },
  { id: 'r-lang',      household: 'Lang, Chris M.',   advisor: 'Alice Chen',   type: 'New',         aum: 250000,  targetedAum: 500000, updatedAt: '1 hour ago', status: 'Account opening in progress' },
  { id: 'r-smith',     household: 'Smith Family',     advisor: 'Alice Chen',   type: 'Existing',    aum: 1250000, targetedAum: null,   updatedAt: '2 days ago', status: 'Onboarded' },
  { id: 'r-johnson',   household: 'Johnson Trust',    advisor: 'Bob Martinez', type: 'Existing',    aum: 3400000, targetedAum: null,   updatedAt: '5 days ago', status: 'Onboarded' },
]

export const RELATIONSHIP_METRICS = {
  totalClients: RELATIONSHIPS_SEED.length,
  totalAumWealth: 0,
  annualizedPremiumLife: 0,
  annualizedPremiumDisability: 0,
  // These match the prospect-summary card set in the top header image.
  prospective: {
    total: RELATIONSHIPS_SEED.filter((r) => r.type === 'Prospective').length,
    targetedAum: 0,
  },
  new: {
    total: RELATIONSHIPS_SEED.filter((r) => r.type === 'New').length,
    aum: 0,
  },
  existing: {
    total: RELATIONSHIPS_SEED.filter((r) => r.type === 'Existing').length,
    aum: 0,
  },
}
