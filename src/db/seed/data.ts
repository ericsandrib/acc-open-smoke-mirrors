// Source data for the synthetic seed.
//
// All identifiers, names, addresses, account numbers, and balances are
// fabricated for the prototype. No tenant brand names (no Mercer, Guardian,
// Schwab). Single custodian: Fidelity. Sole advisor: Greta Friedrichs.
//
// Each entry mirrors the prior in-memory seed at src/data/relationshipsSeed.ts
// so the new DB-backed UI looks visually identical to the old seed-backed one.

export const TENANT_ID = 'stratos'
export const ADVISOR_ID = 'agt_greta'
export const ADVISOR_PERSON_ID = 'per_greta'
export const ADVISOR_ORG_ID = 'org_stratos'

export type RelType = 'Prospect' | 'Onboarding' | 'Existing'

export interface SeedHousehold {
  /** Internal short id used as the suffix for client_organisation.id, etc. */
  slug: string
  /** Display household name */
  household: string
  /** Existing-style relationship type */
  type: RelType
  offering: string
  totalAum: number
  city: string
  state: string
  clientSince: string | null
  lastInteraction: string | null
  nextMeeting: string | null
  /** Household members — first becomes the primary client. */
  members: Array<{
    firstName: string
    lastName: string
    role: 'primary' | 'spouse' | 'child' | 'trustee'
    dob: string | null
    email: string
    phone: string
  }>
  /** Number of financial accounts (split totalAum across them). */
  accountCount: number
  /** Number of in-flight action runs to create. */
  actionRunCount: number
  /** Number of meetings to create. */
  meetingCount: number
}

// 10 households mirroring the legacy seed (names preserved so the
// Relationships list looks identical to today). Members are synthetic.
export const HOUSEHOLDS: SeedHousehold[] = [
  {
    slug: 'whitfield',
    household: 'Robert Whitfield',
    type: 'Existing',
    offering: 'Guided Investing',
    totalAum: 105568,
    city: 'Queen Creek',
    state: 'AZ',
    clientSince: '2020-03-16',
    lastInteraction: '2026-05-09',
    nextMeeting: null,
    members: [
      { firstName: 'Robert', lastName: 'Whitfield', role: 'primary', dob: '1958-07-12', email: 'rwhitfield@example.com', phone: '(480) 555-0142' },
    ],
    accountCount: 1,
    actionRunCount: 1,
    meetingCount: 3,
  },
  {
    slug: 'sutherland',
    household: 'The Sutherland Family',
    type: 'Onboarding',
    offering: 'Guided Investing',
    totalAum: 253710,
    city: 'San Diego',
    state: 'CA',
    clientSince: '2025-11-02',
    lastInteraction: '2025-12-10',
    nextMeeting: null,
    members: [
      { firstName: 'Aaron', lastName: 'Sutherland', role: 'primary', dob: '1972-03-21', email: 'a.sutherland@example.com', phone: '(619) 555-0118' },
      { firstName: 'Maren', lastName: 'Sutherland', role: 'spouse', dob: '1974-09-04', email: 'm.sutherland@example.com', phone: '(619) 555-0119' },
      { firstName: 'Ella', lastName: 'Sutherland', role: 'child', dob: '2008-04-30', email: '', phone: '' },
    ],
    accountCount: 2,
    actionRunCount: 3,
    meetingCount: 2,
  },
  {
    slug: 'patel',
    household: 'Nina Patel',
    type: 'Onboarding',
    offering: 'Wealth Path',
    totalAum: 731415,
    city: 'Chula Vista',
    state: 'CA',
    clientSince: '2025-10-04',
    lastInteraction: '2025-12-22',
    nextMeeting: '2026-01-12',
    members: [
      { firstName: 'Nina', lastName: 'Patel', role: 'primary', dob: '1980-11-22', email: 'npatel@example.com', phone: '(619) 555-0163' },
    ],
    accountCount: 3,
    actionRunCount: 2,
    meetingCount: 4,
  },
  {
    slug: 'bell',
    household: 'Marcus Bell',
    type: 'Prospect',
    offering: 'Wealth Path',
    totalAum: 0,
    city: '',
    state: '',
    clientSince: null,
    lastInteraction: null,
    nextMeeting: null,
    members: [
      { firstName: 'Marcus', lastName: 'Bell', role: 'primary', dob: null, email: 'm.bell@example.com', phone: '' },
    ],
    accountCount: 0,
    actionRunCount: 0,
    meetingCount: 1,
  },
  {
    slug: 'nguyen',
    household: 'Dana Nguyen',
    type: 'Existing',
    offering: 'Guided Investing',
    totalAum: 252979,
    city: 'Castle Rock',
    state: 'CO',
    clientSince: '2019-08-04',
    lastInteraction: '2025-12-31',
    nextMeeting: null,
    members: [
      { firstName: 'Dana', lastName: 'Nguyen', role: 'primary', dob: '1965-02-17', email: 'd.nguyen@example.com', phone: '(720) 555-0177' },
    ],
    accountCount: 2,
    actionRunCount: 1,
    meetingCount: 3,
  },
  {
    slug: 'foster',
    household: 'Henry Foster',
    type: 'Prospect',
    offering: 'Wealth Path',
    totalAum: 0,
    city: 'San Diego',
    state: 'CA',
    clientSince: null,
    lastInteraction: '2025-09-23',
    nextMeeting: null,
    members: [
      { firstName: 'Henry', lastName: 'Foster', role: 'primary', dob: '1969-06-09', email: 'h.foster@example.com', phone: '(619) 555-0181' },
    ],
    accountCount: 0,
    actionRunCount: 0,
    meetingCount: 2,
  },
  {
    slug: 'reyes',
    household: 'Olivia Reyes',
    type: 'Existing',
    offering: 'Wealth & Tax',
    totalAum: 1840220,
    city: 'Phoenix',
    state: 'AZ',
    clientSince: '2017-05-22',
    lastInteraction: '2025-11-04',
    nextMeeting: '2026-02-18',
    members: [
      { firstName: 'Olivia', lastName: 'Reyes', role: 'primary', dob: '1961-12-03', email: 'o.reyes@example.com', phone: '(602) 555-0194' },
      { firstName: 'Daniel', lastName: 'Reyes', role: 'spouse', dob: '1959-10-18', email: 'd.reyes@example.com', phone: '(602) 555-0195' },
    ],
    accountCount: 4,
    actionRunCount: 4,
    meetingCount: 6,
  },
  {
    slug: 'bautista',
    household: 'Kyle Bautista',
    type: 'Onboarding',
    offering: 'Guided Investing',
    totalAum: 412000,
    city: 'Irvine',
    state: 'CA',
    clientSince: '2025-12-15',
    lastInteraction: '2026-01-06',
    nextMeeting: null,
    members: [
      { firstName: 'Kyle', lastName: 'Bautista', role: 'primary', dob: '1985-04-25', email: 'k.bautista@example.com', phone: '(949) 555-0207' },
    ],
    accountCount: 2,
    actionRunCount: 2,
    meetingCount: 3,
  },
  {
    slug: 'singh',
    household: 'Maya Singh',
    type: 'Existing',
    offering: 'Wealth Path',
    totalAum: 980341,
    city: 'Denver',
    state: 'CO',
    clientSince: '2018-01-09',
    lastInteraction: '2025-10-28',
    nextMeeting: null,
    members: [
      { firstName: 'Maya', lastName: 'Singh', role: 'primary', dob: '1970-08-14', email: 'm.singh@example.com', phone: '(303) 555-0211' },
      { firstName: 'Arjun', lastName: 'Singh', role: 'spouse', dob: '1968-05-19', email: 'a.singh@example.com', phone: '(303) 555-0212' },
    ],
    accountCount: 3,
    actionRunCount: 3,
    meetingCount: 5,
  },
  {
    slug: 'arnold',
    household: 'Theo Arnold',
    type: 'Existing',
    offering: 'Life Insurance',
    totalAum: 145000,
    city: 'Boulder',
    state: 'CO',
    clientSince: '2021-06-30',
    lastInteraction: '2025-08-14',
    nextMeeting: null,
    members: [
      { firstName: 'Theo', lastName: 'Arnold', role: 'primary', dob: '1990-02-11', email: 't.arnold@example.com', phone: '(303) 555-0223' },
    ],
    accountCount: 1,
    actionRunCount: 1,
    meetingCount: 2,
  },
]

// Action blueprints — mirror the existing dashboard mocks.
export const ACTION_BLUEPRINTS: Array<{
  slug: string
  name: string
  category: string
  description: string
}> = [
  { slug: 'onboard', name: 'Onboard New Client', category: 'Onboarding', description: 'Standard new-client onboarding workflow.' },
  { slug: 'sloa', name: 'Standing Money Movement', category: 'Servicing', description: 'Set up or amend a standing letter of authorization.' },
  { slug: 'close', name: 'Close Financial Account', category: 'Servicing', description: 'Close one or more financial accounts.' },
  { slug: 'rebalance', name: 'Manage Investment Strategy', category: 'Servicing', description: 'Quarterly rebalance and strategy review.' },
  { slug: 'review', name: 'Annual Relationship Review', category: 'Planning', description: 'Annual review covering goals, accounts, and risk.' },
]
