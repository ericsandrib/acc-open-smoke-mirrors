// Relationship dashboard seed data.
// Columns mirror the Stratos Data Dictionary → Orion/Salesforce mappings:
//   Relationship         (S243 Client ID / SF-CT)
//   Advisor              (S195 IAR Name / SF-FA)
//   Type                 (S244 Contact Type — Prospect/Client/etc.)
//   Product              (derived: Wealth, Insurance, etc.)
//   AUM                  (household-level total; S141/S142)
//   Last Meeting         (SF-CT activity)
//   Next Meeting         (SF-CT activity)
//   Updated At           (SF-CT last modified)
//   Premium              (insurance premium totals)
//   Firm                 (broker-dealer / SF firm)
//   Zip Code             (S042)
//   Status               (SF-CT record type / pipeline stage)

export type RelationshipType = 'Prospective' | 'New' | 'Existing'
export type ProductType = '' | 'Wealth' | 'Insurance' | 'Insurance · Wealth'

export interface Relationship {
  id: string
  relationship: string
  advisor: string
  type: RelationshipType
  product: ProductType
  aum: number | null
  targetedAum: number | null
  lastMeeting: string | null
  nextMeeting: string | null
  updatedAt: string
  premium: number | null
  firm: string | null
  zipCode: string | null
  status: string | null
}

// Intentionally sparse — this is a "brand new prototype" Stratos view.
// Most fields are blank to mirror the screenshot.
export const RELATIONSHIPS_SEED: Relationship[] = [
  { id: 'r-lincoln',      relationship: 'Abraham Lincoln',  advisor: 'Eric Sandrib',   type: 'Prospective', product: '', aum: null, targetedAum: null, lastMeeting: null, nextMeeting: null, updatedAt: '3 days ago', premium: null, firm: null, zipCode: null, status: null },
  { id: 'r-acme',         relationship: 'Acme',             advisor: 'Eric Sandrib',   type: 'Prospective', product: '', aum: null, targetedAum: null, lastMeeting: null, nextMeeting: null, updatedAt: '3 days ago', premium: null, firm: null, zipCode: null, status: null },
  { id: 'r-sandler',      relationship: 'Adam Sandler',     advisor: 'Eric Sandrib',   type: 'Prospective', product: '', aum: null, targetedAum: null, lastMeeting: null, nextMeeting: null, updatedAt: '3 days ago', premium: null, firm: null, zipCode: null, status: null },
  { id: 'r-collins',      relationship: 'Ava Collins',      advisor: 'Eric Sandrib',   type: 'Prospective', product: '', aum: null, targetedAum: null, lastMeeting: null, nextMeeting: null, updatedAt: '3 days ago', premium: null, firm: null, zipCode: null, status: null },
  { id: 'r-pitt',         relationship: 'Brad Pitt',        advisor: 'Eric Sandrib',   type: 'Prospective', product: '', aum: null, targetedAum: null, lastMeeting: null, nextMeeting: null, updatedAt: '3 days ago', premium: null, firm: null, zipCode: null, status: null },
  { id: 'r-biz-413',      relationship: 'Business 4/13',    advisor: 'Eric Sandrib',   type: 'Prospective', product: '', aum: null, targetedAum: null, lastMeeting: null, nextMeeting: null, updatedAt: '3 days ago', premium: null, firm: null, zipCode: null, status: null },
  { id: 'r-meaney',       relationship: 'Erin Aiko Meaney', advisor: 'Eric Sandrib',   type: 'Prospective', product: '', aum: null, targetedAum: null, lastMeeting: null, nextMeeting: null, updatedAt: '3 days ago', premium: null, firm: null, zipCode: null, status: null },
  { id: 'r-erin-test',    relationship: 'Erin test',        advisor: 'Eric Sandrib',   type: 'Prospective', product: '', aum: null, targetedAum: null, lastMeeting: null, nextMeeting: null, updatedAt: '3 days ago', premium: null, firm: null, zipCode: null, status: null },
  { id: 'r-lang',         relationship: 'Lang, Chris M.',   advisor: 'Alice Chen',     type: 'New',         product: 'Wealth', aum: 250000, targetedAum: 500000, lastMeeting: '2 days ago', nextMeeting: 'in 5 days', updatedAt: '1 hour ago', premium: null, firm: 'Schwab', zipCode: '80018', status: 'Account opening in progress' },
  { id: 'r-smith',        relationship: 'Smith Family',     advisor: 'Alice Chen',     type: 'Existing',    product: 'Wealth', aum: 1250000, targetedAum: null, lastMeeting: '1 week ago', nextMeeting: 'in 3 weeks', updatedAt: '2 days ago', premium: null, firm: 'Schwab', zipCode: '60657', status: 'Onboarded' },
  { id: 'r-johnson',      relationship: 'Johnson Trust',    advisor: 'Bob Martinez',   type: 'Existing',    product: 'Insurance · Wealth', aum: 3400000, targetedAum: null, lastMeeting: '3 weeks ago', nextMeeting: 'next month', updatedAt: '5 days ago', premium: 18500, firm: 'Schwab', zipCode: '94104', status: 'Onboarded' },
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
