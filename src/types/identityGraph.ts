// Cross-silo identity graph — Zions POC (Spec 007, Phase 2).
//
// The headline demonstration: ONE legal entity -> ONE node, unified across Zions's
// source systems and the 7 affiliate banks. "Wealth Access aggregates dashboards;
// Avantos aggregates identity." Grounded in the Zions Architect Brief + RFI 2.1/2.2/2.5.
//
// Everything here is representative dummy data. Source systems and affiliate names are
// real Zions facts; entity names, IDs, and dollar figures are synthetic.

/** Zions source systems the platform "sits above" (RFI 2.5 / 2.10; Architect Brief). */
export type SourceSystem =
  | 'fitek' // Fi-Tek / GWES — wealth (in-house custody) AND corporate trust
  | 'lpl' // LPL — fee + brokerage (~$3B / ~8K accts)
  | 'transtar' // bond accounting (corporate trust)
  | 'emoney' // financial planning
  | 'salesforce' // CRM
  | 'bank-core' // Zions commercial-bank core — deposits / loans / credit facilities

export const SOURCE_SYSTEM_LABEL: Record<SourceSystem, string> = {
  fitek: 'Fi-Tek / GWES',
  lpl: 'LPL',
  transtar: 'Transtar',
  emoney: 'eMoney',
  salesforce: 'Salesforce',
  'bank-core': 'Bank Core',
}

/** The 7 Zions affiliate banks (Architect Brief). */
export type ZionsAffiliate =
  | 'zions-bank'
  | 'cbt' // California Bank & Trust
  | 'amegy' // Amegy Bank (TX)
  | 'nbaz' // National Bank of Arizona
  | 'nevada-state'
  | 'vectra' // Vectra Bank Colorado
  | 'commerce-wa-or' // The Commerce Bank of WA/OR

export const AFFILIATE_LABEL: Record<ZionsAffiliate, string> = {
  'zions-bank': 'Zions Bank',
  cbt: 'California Bank & Trust',
  amegy: 'Amegy Bank',
  nbaz: 'National Bank of Arizona',
  'nevada-state': 'Nevada State Bank',
  vectra: 'Vectra Bank Colorado',
  'commerce-wa-or': 'Commerce Bank of WA/OR',
}

export type SiloDomain = 'wealth' | 'corporate-trust' | 'retail-bank' | 'commercial-bank'

export const SILO_LABEL: Record<SiloDomain, string> = {
  wealth: 'Wealth',
  'corporate-trust': 'Corporate Trust',
  'retail-bank': 'Retail Bank',
  'commercial-bank': 'Commercial Bank',
}

export type EntityKind = 'person' | 'household' | 'business' | 'trust' | 'municipality' | 'issuer'

/** One identifier a legal entity carries in a specific source system / silo. */
export interface SourceIdentity {
  system: SourceSystem
  domain: SiloDomain
  /** Native ID in that system (synthetic). The thing we collapse into one node. */
  externalId: string
  affiliate?: ZionsAffiliate
  /** Short context, e.g. "Wealth — in-house custody", "Corporate Trust — deal acct". */
  context?: string
  /** Optional balance for cards; negative = liability (loan/mortgage). */
  value?: number
  accountCount?: number
}

export type EdgeKind =
  | 'household_member'
  | 'owner_of'
  | 'officer_of'
  | 'trustee_of'
  | 'board_member_of'
  | 'beneficiary_of'
  | 'advised_by'

export interface EntityEdge {
  id: string
  source: string // LegalEntity id
  target: string // LegalEntity id
  kind: EdgeKind
  label?: string
}

/** A cross-org opportunity that only becomes visible once identity is unified (RFI 2.2). */
export type OpportunityKind = 'trust_to_wealth' | 'bank_to_wealth' | 'commercial_to_wealth'

export const OPPORTUNITY_LABEL: Record<OpportunityKind, string> = {
  trust_to_wealth: 'Corporate Trust → Wealth',
  bank_to_wealth: 'Bank → Wealth',
  commercial_to_wealth: 'Commercial → Wealth',
}

export interface CrossSiloOpportunity {
  id: string
  entityId: string
  kind: OpportunityKind
  /** The signal that fired (deposit threshold, business-sale inflow, issuer officer, RMD…). */
  signal: string
  rationale: string
  estimatedValue?: number
  advisor?: string
  priority: 'high' | 'medium' | 'low'
}

export interface LegalEntity {
  id: string
  name: string
  kind: EntityKind
  /** The unified node's source-system identities — the "collapse to one node" payload. */
  identities: SourceIdentity[]
  affiliates?: ZionsAffiliate[]
  /** Short descriptor for the node subtitle. */
  descriptor?: string
  /** Synthetic relationship-value rollup across silos. */
  totalValue?: number
  advisor?: string
  /** True when this entity has no wealth relationship yet (drives opportunity styling). */
  wealthProspect?: boolean
}

export interface IdentityGraph {
  entities: LegalEntity[]
  edges: EntityEdge[]
  opportunities: CrossSiloOpportunity[]
}
