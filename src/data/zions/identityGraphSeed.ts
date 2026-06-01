// Zions cross-silo identity-graph seed — Spec 007 Phase 2 (the headline demo).
//
// Tells three grounded stories from the Architect Brief:
//   1. UNIFY ACROSS THE BRANCHES — the Whitmore household, one legal entity, unified
//      across Fi-Tek (wealth, in-house custody), LPL, eMoney, and a mortgage/checking at
//      the Amegy affiliate. One node, many source-system IDs.
//   2. CORPORATE-TRUST -> WEALTH BRIDGE — the City of Cedar Falls $42M bond issuance sits
//      in Corporate Trust on Fi-Tek + Transtar; its Finance Director (Marcus Hale) is an
//      officer with NO wealth relationship -> a next-best-action prospect.
//   3. BANK -> WEALTH PROMOTION — Cedar Ridge Holdings took an $8.5M business-sale inflow
//      into a CB&T commercial deposit; owner Janet Cole has no wealth relationship.
//
// Synthetic: entity names, IDs, $ figures. Real: source systems + the 7 affiliates.

import type { IdentityGraph } from '@/types/identityGraph'

const ADVISOR_WHITMORE = 'Priya Raman'
const ADVISOR_PROSPECTS = 'Daniel Okafor'

export const ZIONS_IDENTITY_GRAPH: IdentityGraph = {
  entities: [
    // ── Story 1: unified HNW household across wealth + bank ───────────────────
    {
      id: 'e-whitmore-hh',
      name: 'Whitmore Household',
      kind: 'household',
      descriptor: 'HNW household · 2 members',
      advisor: ADVISOR_WHITMORE,
      totalValue: 5_560_000,
      affiliates: ['amegy'],
      identities: [
        { system: 'salesforce', domain: 'wealth', externalId: 'SF-HH-0Ad4471', context: 'CRM household record' },
      ],
    },
    {
      id: 'e-ralph-whitmore',
      name: 'Ralph Whitmore',
      kind: 'person',
      descriptor: 'Primary · age 63',
      advisor: ADVISOR_WHITMORE,
      totalValue: 5_380_000,
      affiliates: ['amegy'],
      identities: [
        { system: 'fitek', domain: 'wealth', externalId: 'FT-W-20455', context: 'Wealth — in-house custody', value: 4_200_000, accountCount: 3 },
        { system: 'lpl', domain: 'wealth', externalId: 'LPL-88231', context: 'Fee + brokerage', value: 980_000, accountCount: 2 },
        { system: 'emoney', domain: 'wealth', externalId: 'EM-4471', context: 'Financial plan (active)' },
        { system: 'bank-core', domain: 'retail-bank', externalId: 'AMG-CHK-7782', context: 'Checking', value: 180_000, affiliate: 'amegy' },
        { system: 'bank-core', domain: 'retail-bank', externalId: 'AMG-MTG-3310', context: 'Mortgage', value: -640_000, affiliate: 'amegy' },
        { system: 'salesforce', domain: 'wealth', externalId: 'SF-003Ad00xY1', context: 'CRM contact' },
      ],
    },
    {
      id: 'e-diane-whitmore',
      name: 'Diane Whitmore',
      kind: 'person',
      descriptor: 'Spouse · age 61',
      advisor: ADVISOR_WHITMORE,
      totalValue: 180_000,
      affiliates: ['amegy'],
      identities: [
        { system: 'lpl', domain: 'wealth', externalId: 'LPL-88232', context: 'Joint brokerage (with Ralph)', value: 820_000 },
        { system: 'bank-core', domain: 'retail-bank', externalId: 'AMG-SAV-7790', context: 'Savings', value: 95_000, affiliate: 'amegy' },
        { system: 'salesforce', domain: 'wealth', externalId: 'SF-003Ad00xY2', context: 'CRM contact' },
      ],
    },

    // ── Story 2: corporate-trust issuer -> its officer is a wealth prospect ────
    {
      id: 'e-cedar-falls',
      name: 'City of Cedar Falls',
      kind: 'municipality',
      descriptor: 'Municipal issuer · $42M GO bond',
      totalValue: 42_000_000,
      identities: [
        { system: 'fitek', domain: 'corporate-trust', externalId: 'FT-CT-DEAL-90187', context: 'Corporate Trust — deal account (2026 GO bond)', value: 42_000_000, accountCount: 1 },
        { system: 'transtar', domain: 'corporate-trust', externalId: 'TS-BND-5521', context: 'Bond accounting' },
      ],
    },
    {
      id: 'e-marcus-hale',
      name: 'Marcus Hale',
      kind: 'person',
      descriptor: 'Finance Director, City of Cedar Falls',
      wealthProspect: true,
      advisor: ADVISOR_PROSPECTS,
      totalValue: 95_000,
      affiliates: ['zions-bank'],
      identities: [
        { system: 'bank-core', domain: 'retail-bank', externalId: 'ZB-CHK-44120', context: 'Personal checking', value: 95_000, affiliate: 'zions-bank' },
        // No Fi-Tek wealth / LPL identity — that's the whole point: invisible without identity unification.
      ],
    },

    // ── Story 3: commercial bank deposit -> owner is a wealth prospect ─────────
    {
      id: 'e-cedar-ridge',
      name: 'Cedar Ridge Holdings LLC',
      kind: 'business',
      descriptor: 'C&I borrower · recent business sale',
      totalValue: 8_500_000,
      affiliates: ['cbt'],
      identities: [
        { system: 'bank-core', domain: 'commercial-bank', externalId: 'CBT-DDA-77310', context: 'Commercial deposit (business-sale inflow)', value: 8_500_000, affiliate: 'cbt' },
        { system: 'bank-core', domain: 'commercial-bank', externalId: 'CBT-CNI-2204', context: 'C&I revolving line', value: -1_250_000, affiliate: 'cbt' },
        { system: 'salesforce', domain: 'commercial-bank', externalId: 'SF-001Ce0099', context: 'Commercial CRM account' },
      ],
    },
    {
      id: 'e-janet-cole',
      name: 'Janet Cole',
      kind: 'person',
      descriptor: 'Owner, Cedar Ridge Holdings LLC',
      wealthProspect: true,
      advisor: ADVISOR_PROSPECTS,
      totalValue: 0,
      affiliates: ['vectra'],
      identities: [
        { system: 'bank-core', domain: 'retail-bank', externalId: 'VEC-MTG-1185', context: 'Mortgage', value: -510_000, affiliate: 'vectra' },
        // No wealth relationship despite an $8.5M liquidity event next door.
      ],
    },
  ],

  edges: [
    { id: 'ed-hh-ralph', source: 'e-whitmore-hh', target: 'e-ralph-whitmore', kind: 'household_member', label: 'Primary' },
    { id: 'ed-hh-diane', source: 'e-whitmore-hh', target: 'e-diane-whitmore', kind: 'household_member', label: 'Spouse' },
    { id: 'ed-falls-hale', source: 'e-cedar-falls', target: 'e-marcus-hale', kind: 'officer_of', label: 'Finance Director' },
    { id: 'ed-ridge-cole', source: 'e-cedar-ridge', target: 'e-janet-cole', kind: 'owner_of', label: '100% owner' },
  ],

  opportunities: [
    {
      id: 'opp-hale',
      entityId: 'e-marcus-hale',
      kind: 'trust_to_wealth',
      signal: 'Officer of a $42M GO bond issuance in Corporate Trust; no wealth relationship.',
      rationale:
        'Marcus Hale is Finance Director of City of Cedar Falls (Fi-Tek Corporate Trust deal FT-CT-DEAL-90187). He banks personally at Zions Bank but has no Wealth or LPL relationship. Identity unification surfaces the person behind the issuer as a private-wealth prospect.',
      estimatedValue: 1_500_000,
      advisor: ADVISOR_PROSPECTS,
      priority: 'high',
    },
    {
      id: 'opp-cole',
      entityId: 'e-janet-cole',
      kind: 'bank_to_wealth',
      signal: 'Business-sale inflow of $8.5M into a CB&T commercial deposit; owner has no wealth relationship.',
      rationale:
        'Janet Cole owns Cedar Ridge Holdings LLC, which received an $8.5M liquidity event into a California Bank & Trust commercial deposit. She has only a Vectra mortgage and no Wealth relationship. Core-banking signal → advisory promotion, scoped to the advisor book.',
      estimatedValue: 5_000_000,
      advisor: ADVISOR_PROSPECTS,
      priority: 'high',
    },
  ],
}
