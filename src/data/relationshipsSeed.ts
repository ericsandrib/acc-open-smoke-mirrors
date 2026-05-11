// Relationships dashboard seed data.
//
// Stratos prototype — Greta is the advisor for every household; types limit
// to Prospect / Onboarding / Existing (Avantos Prod's Transferred bucket is
// out of scope for this view).

export type RelationshipType = 'Prospect' | 'Onboarding' | 'Existing'

export type Offering =
  | 'Guided Investing'
  | 'Wealth Path'
  | 'Wealth & Tax'
  | 'Life Insurance'

export interface Relationship {
  id: string
  household: string
  advisor: string
  advisorInitials: string
  offering: Offering
  type: RelationshipType
  aum: number | null
  lastMeeting: string
  nextMeeting: string
  city: string
  state: string
  // Legacy fields kept so existing imports keep compiling.
  targetedAum: number | null
  updatedAt: string
  status: string | null
  // Detail page extras (used on /relationships/:id).
  clientSince?: string
  totalAum?: number
}

const G = { advisor: 'Greta Friedrichs', advisorInitials: 'GF' }

export const RELATIONSHIPS_SEED: Relationship[] = [
  {
    id: 'r-whitfield',
    household: 'Robert Whitfield',
    ...G,
    offering: 'Guided Investing',
    type: 'Existing',
    aum: 105568.0,
    lastMeeting: 'Yesterday',
    nextMeeting: '',
    city: 'Queen Creek',
    state: 'AZ',
    targetedAum: null,
    updatedAt: 'Yesterday',
    status: 'Onboarded',
    clientSince: 'Mar 16, 2020',
    totalAum: 105568,
  },
  {
    id: 'r-sutherland',
    household: 'The Sutherland Family',
    ...G,
    offering: 'Guided Investing',
    type: 'Onboarding',
    aum: 253710.14,
    lastMeeting: 'Dec 10, 2025',
    nextMeeting: '',
    city: 'San Diego',
    state: 'CA',
    targetedAum: null,
    updatedAt: 'Dec 10, 2025',
    status: 'Account opening in progress',
  },
  {
    id: 'r-patel',
    household: 'Nina Patel',
    ...G,
    offering: 'Wealth Path',
    type: 'Onboarding',
    aum: 731414.82,
    lastMeeting: 'Dec 22, 2025',
    nextMeeting: 'Jan 12, 2026',
    city: 'Chula Vista',
    state: 'CA',
    targetedAum: null,
    updatedAt: 'Dec 22, 2025',
    status: 'Account opening in progress',
  },
  {
    id: 'r-bell',
    household: 'Marcus Bell',
    ...G,
    offering: 'Wealth Path',
    type: 'Prospect',
    aum: 0,
    lastMeeting: '',
    nextMeeting: '',
    city: '',
    state: '',
    targetedAum: null,
    updatedAt: '3 days ago',
    status: null,
  },
  {
    id: 'r-nguyen',
    household: 'Dana Nguyen',
    ...G,
    offering: 'Guided Investing',
    type: 'Existing',
    aum: 252979.49,
    lastMeeting: 'Dec 31, 2025',
    nextMeeting: '',
    city: 'Castle Rock',
    state: 'CO',
    targetedAum: null,
    updatedAt: 'Dec 31, 2025',
    status: 'Onboarded',
  },
  {
    id: 'r-foster',
    household: 'Henry Foster',
    ...G,
    offering: 'Wealth Path',
    type: 'Prospect',
    aum: 0,
    lastMeeting: 'Sep 23, 2025',
    nextMeeting: '',
    city: 'San Diego',
    state: 'CA',
    targetedAum: null,
    updatedAt: 'Sep 23, 2025',
    status: null,
  },
  {
    id: 'r-reyes',
    household: 'Olivia Reyes',
    ...G,
    offering: 'Wealth & Tax',
    type: 'Existing',
    aum: 1840220.0,
    lastMeeting: 'Nov 4, 2025',
    nextMeeting: 'Feb 18, 2026',
    city: 'Phoenix',
    state: 'AZ',
    targetedAum: null,
    updatedAt: 'Nov 4, 2025',
    status: 'Onboarded',
  },
  {
    id: 'r-bautista',
    household: 'Kyle Bautista',
    ...G,
    offering: 'Guided Investing',
    type: 'Onboarding',
    aum: 412000.0,
    lastMeeting: 'Jan 6, 2026',
    nextMeeting: '',
    city: 'Irvine',
    state: 'CA',
    targetedAum: null,
    updatedAt: 'Jan 6, 2026',
    status: 'Account opening in progress',
  },
  {
    id: 'r-singh',
    household: 'Maya Singh',
    ...G,
    offering: 'Wealth Path',
    type: 'Existing',
    aum: 980340.55,
    lastMeeting: 'Oct 28, 2025',
    nextMeeting: '',
    city: 'Denver',
    state: 'CO',
    targetedAum: null,
    updatedAt: 'Oct 28, 2025',
    status: 'Onboarded',
  },
  {
    id: 'r-arnold',
    household: 'Theo Arnold',
    ...G,
    offering: 'Life Insurance',
    type: 'Existing',
    aum: 145000.0,
    lastMeeting: 'Aug 14, 2025',
    nextMeeting: '',
    city: 'Boulder',
    state: 'CO',
    targetedAum: null,
    updatedAt: 'Aug 14, 2025',
    status: 'Onboarded',
  },
]

// KPI numbers shown in the Avantos Prod overview header — not derived from
// the visible row sample.
export const RELATIONSHIP_METRICS = {
  totalClients: 237,
  prospective: { total: 48, targetedAum: '17.95M' },
  new: { total: 72, aum: '42.35M' },
  existing: { total: 116, aum: '33.5M' },
  // Per-tab counts.
  tabs: {
    all: 237,
    prospective: 48,
    onboarding: 22,
    existing: 116,
    transferred: 50,
  },
}
