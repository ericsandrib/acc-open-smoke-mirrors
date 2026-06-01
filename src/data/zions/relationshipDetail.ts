// Relationship-detail view-model — Zions POC (Spec 007 Phase 3 follow-on).
//
// Joins the data we already have into the per-household detail the Avantos profile shows:
//   identity graph  → accounts across custodians + members + related orgs + opportunities
//   servicing seed  → open actions / tasks for the relationship
//   meetings seed   → meetings linked to the relationship
// Every relationship resolves to a working detail; the cross-silo personas (Whitmore,
// Cedar Falls, Cedar Ridge, Hale, Cole) are richest.

import { RELATIONSHIPS_SEED } from '@/data/relationshipsSeed'
import { ZIONS_IDENTITY_GRAPH } from '@/data/zions/identityGraphSeed'
import { SOURCE_SYSTEM_LABEL, SILO_LABEL, AFFILIATE_LABEL, OPPORTUNITY_LABEL, type LegalEntity } from '@/types/identityGraph'
import { seededJourneys } from '@/data/servicingSeed'
import { MEETINGS } from '@/data/zions/meetingsSeed'

export interface DetailAccount { system: string; domain: string; label: string; value?: number; affiliate?: string; externalId: string }
export interface DetailMember {
  id: string
  name: string
  role: string
  isPrimary?: boolean
  descriptor?: string
  preferredName?: string
  status?: string
  dob?: string
  age?: number
  ssnMasked?: string
  email?: string
  phone?: string
  address?: string
  clientPortalRegistered?: boolean
  clientPortalLastLogin?: string
}
export interface DetailOrg { id: string; name: string; role: string }
export interface DetailAction { name: string; category: string; status: string; date?: string }
export interface DetailTask { name: string; status: string; owner?: string; nextStep?: string }
export interface DetailOpportunity { kind: string; signal: string; estimatedValue?: number; priority?: string }
export interface DetailMeetingRef { id: string; subject: string; date: string }
export interface TeamMember { name: string; role: string; email?: string; phone?: string }
export interface Engagement { label: string; date: string }

export interface RelationshipDetail {
  id: string
  name: string
  type: string
  offering: string
  clientSince: string
  aum: number | null
  context: string
  lastMeeting?: string
  nextMeeting?: string
  alert?: string
  members: DetailMember[]
  relatedContacts: DetailMember[]
  relatedOrgs: DetailOrg[]
  accounts: DetailAccount[]
  openActions: DetailAction[]
  openTasks: DetailTask[]
  opportunities: DetailOpportunity[]
  meetings: DetailMeetingRef[]
  engagements: Engagement[]
  team: { division: string; region: string; market: string; office: string; householdId: string; members: TeamMember[] }
}

const REL_TO_ENTITY: Record<string, string> = {
  'r-whitmore': 'e-whitmore-hh',
  'r-cedar-falls': 'e-cedar-falls',
  'r-cedar-ridge': 'e-cedar-ridge',
  'r-hale': 'e-marcus-hale',
  'r-cole': 'e-janet-cole',
}

// Per-relationship narrative overrides (context note + offering + division).
const OVERRIDES: Record<string, Partial<RelationshipDetail>> = {
  'r-whitmore': { offering: 'Wealth + Bank', clientSince: 'Mar 2014', context: 'Lake-property sale closed; a $120K ACH distribution is in flight (from the 6/1 review). Banks at Amegy. First RMD due this year.' },
  'r-cedar-falls': { offering: 'Corporate Trust', clientSince: 'Jul 2019', context: '$42M 2026 GO bond issuance in Corporate Trust on Fi-Tek + Transtar. Trustee sync held 5/22.' },
  'r-cedar-ridge': { offering: 'Commercial → Wealth', clientSince: 'New', context: 'C&I borrower at California Bank & Trust; $8.5M business-sale inflow. Commercial → wealth referral in motion.' },
  'r-hale': { offering: 'Prospect', clientSince: '—', context: 'Finance Director of the City of Cedar Falls (a $42M Corporate Trust issuer). Banks personally at Zions Bank; no Wealth relationship yet — surfaced by identity unification.' },
  'r-cole': { offering: 'Prospect', clientSince: '—', context: 'Owner of Cedar Ridge Holdings, which took an $8.5M liquidity event into CB&T. Only a Vectra mortgage on file; no Wealth relationship yet.' },
}

function entityAccounts(e: LegalEntity): DetailAccount[] {
  return e.identities.map((id) => ({
    system: SOURCE_SYSTEM_LABEL[id.system],
    domain: SILO_LABEL[id.domain],
    label: id.context ?? SILO_LABEL[id.domain],
    value: id.value,
    affiliate: id.affiliate ? AFFILIATE_LABEL[id.affiliate] : undefined,
    externalId: id.externalId,
  }))
}

// Per-member detail (synthetic) for the cross-silo personas; others fall back to descriptor-parsed age.
const MEMBER_DETAILS: Record<string, Partial<DetailMember>> = {
  'Ralph Whitmore': { preferredName: 'Ralph', status: 'Client · Active', dob: '1962-09-14', age: 63, ssnMasked: '***-**-4471', email: 'ralph.whitmore@example.com', phone: '(801) 555-0142', address: '2280 Walker Lane, Salt Lake City, UT 84117', clientPortalRegistered: true, clientPortalLastLogin: 'May 28, 2026' },
  'Diane Whitmore': { preferredName: 'Diane', status: 'Spouse · Active', dob: '1964-03-02', age: 61, ssnMasked: '***-**-7790', email: 'diane.whitmore@example.com', phone: '(801) 555-0143', address: '2280 Walker Lane, Salt Lake City, UT 84117', clientPortalRegistered: true, clientPortalLastLogin: 'May 12, 2026' },
  'Marcus Hale': { preferredName: 'Marcus', status: 'Prospect', dob: '1971-06-20', age: 54, email: 'mhale@cedarfalls.gov', phone: '(319) 555-0110', address: '14 Municipal Plaza, Cedar Falls, IA 50613', clientPortalRegistered: false },
  'Janet Cole': { preferredName: 'Janet', status: 'Prospect', dob: '1968-11-05', age: 57, email: 'janet@cedarridgeholdings.com', phone: '(720) 555-0188', address: '880 Vine Street, Denver, CO 80206', clientPortalRegistered: false },
}

function parseAge(descriptor?: string): number | undefined {
  const m = descriptor?.match(/age (\d+)/)
  return m ? Number(m[1]) : undefined
}

function enrichMember(m: DetailMember): DetailMember {
  return { ...m, age: m.age ?? parseAge(m.descriptor), ...MEMBER_DETAILS[m.name] }
}

export function getRelationshipDetail(relId: string): RelationshipDetail | null {
  const rel = RELATIONSHIPS_SEED.find((r) => r.id === relId)
  if (!rel) return null

  const g = ZIONS_IDENTITY_GRAPH
  const entityId = REL_TO_ENTITY[relId]
  const entity = entityId ? g.entities.find((e) => e.id === entityId) : undefined

  const members: DetailMember[] = []
  const relatedOrgs: DetailOrg[] = []
  let accounts: DetailAccount[] = []
  const opportunities: DetailOpportunity[] = []

  if (entity) {
    // Member entities reachable from this entity (household members, officers, owners).
    const memberEdges = g.edges.filter((ed) => ed.source === entity.id)
    const memberEntities = memberEdges
      .map((ed) => ({ ed, ent: g.entities.find((e) => e.id === ed.target) }))
      .filter((x): x is { ed: typeof memberEdges[number]; ent: LegalEntity } => !!x.ent)

    if (entity.kind === 'person') {
      // The person themselves is the primary member; what they're connected to is a related org.
      members.push({ id: entity.id, name: entity.name, role: 'Primary', isPrimary: true, descriptor: entity.descriptor })
      g.edges.filter((ed) => ed.target === entity.id).forEach((ed) => {
        const org = g.entities.find((e) => e.id === ed.source)
        if (org && org.kind !== 'person' && org.kind !== 'household') relatedOrgs.push({ id: org.id, name: org.name, role: ed.label ?? org.kind })
      })
      accounts = entityAccounts(entity)
    } else {
      // Household / org: members are the connected people; accounts roll up entity + members.
      memberEntities.forEach(({ ed, ent }) => {
        members.push({ id: ent.id, name: ent.name, role: ed.label ?? 'Member', isPrimary: ed.label === 'Primary', descriptor: ent.descriptor })
      })
      accounts = [entity, ...memberEntities.map((m) => m.ent)].flatMap(entityAccounts)
    }

    // Opportunities tied to this entity or any of its members.
    const entityIds = new Set<string>([entity.id, ...memberEntities.map((m) => m.ent.id)])
    g.opportunities
      .filter((o) => entityIds.has(o.entityId))
      .forEach((o) => opportunities.push({ kind: OPPORTUNITY_LABEL[o.kind], signal: o.signal, estimatedValue: o.estimatedValue, priority: o.priority }))
  } else {
    // No identity-graph entity: synth a primary member + a representative account from AUM.
    members.push({ id: `${relId}-p1`, name: rel.household, role: 'Primary', isPrimary: true })
    if (rel.aum) {
      accounts.push({ system: SOURCE_SYSTEM_LABEL.fitek, domain: SILO_LABEL.wealth, label: 'Managed account — in-house custody', value: rel.aum, externalId: 'FT-—' })
    }
  }

  // Open actions / tasks for this relationship, from the servicing seed.
  const journeys = seededJourneys.filter((j) => j.relationshipName === rel.household)
  const openActions: DetailAction[] = journeys
    .flatMap((j) => j.actions)
    .filter((a) => a.status !== 'complete')
    .map((a) => ({ name: a.title, category: a.category ?? 'Servicing', status: a.status, date: a.tasks.find((t) => t.status !== 'complete')?.nextStep }))
  const openTasks: DetailTask[] = journeys
    .flatMap((j) => j.actions)
    .flatMap((a) => a.tasks)
    .filter((t) => t.status === 'in_progress' || t.status === 'blocked' || t.status === 'awaiting_review')
    .slice(0, 8)
    .map((t) => ({ name: t.title, status: t.status, owner: t.taskOwner, nextStep: t.nextStep }))

  const meetings: DetailMeetingRef[] = MEETINGS.filter((m) => m.relationshipId === relId).map((m) => ({
    id: m.id,
    subject: m.subject,
    date: new Date(m.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }))

  const ov = OVERRIDES[relId] ?? {}
  const division = relId === 'r-cedar-falls' ? 'Corporate Trust' : 'Wealth Management'

  return {
    id: rel.id,
    name: rel.household,
    type: rel.type,
    offering: ov.offering ?? 'Wealth',
    clientSince: ov.clientSince ?? (rel.type === 'Existing' ? 'Jan 2021' : rel.type === 'New' ? '2026' : '—'),
    aum: rel.aum,
    context: ov.context ?? rel.status ?? '',
    lastMeeting: meetings[0]?.date,
    nextMeeting: rel.type === 'Prospective' ? undefined : 'In 2 weeks',
    alert: opportunities.length ? `${opportunities.length} cross-silo opportunity${opportunities.length > 1 ? 'ies' : ''}` : undefined,
    members: members.map(enrichMember),
    relatedContacts: [],
    relatedOrgs,
    accounts,
    openActions,
    openTasks,
    opportunities,
    meetings,
    engagements: [
      { label: 'Investments', date: 'Dec 15, 2025' },
      { label: 'Planning', date: 'Nov 3, 2025' },
      { label: 'Servicing', date: meetings[0]?.date ?? 'May 2026' },
    ],
    team: {
      division,
      region: 'Mountain West',
      market: 'Utah',
      office: 'Salt Lake City',
      householdId: `HH-${rel.id.replace('r-', '').toUpperCase()}`,
      members: [
        { name: rel.advisor, role: 'Wealth Advisor', email: `${rel.advisor.toLowerCase().replace(/[^a-z]/g, '.')}@zionswealth.com` },
        { name: 'Renee Albright', role: 'Client Service Specialist', email: 'renee.albright@zionswealth.com' },
        { name: 'Tom Vasquez', role: 'Financial Planner', email: 'tom.vasquez@zionswealth.com' },
      ],
    },
  }
}
