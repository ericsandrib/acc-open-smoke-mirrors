// Zions meeting mock data — Spec 007 Phase 6 + Spec 009 (end-to-end Meeting Assistant).
//
// Centerpiece: the Whitmore Quarterly Review. Its AI summary surfaces a $120K life-event
// distribution; accepting the recommendation creates the Whitmore distribution servicing
// journey (sv-whitmore in servicingSeed). The seed also carries the full AI bundle the real
// Avantos meetings module produces — follow-up email, referral/moments-of-delight signals,
// life events, topics — plus a forward-looking Pre-Meeting Prep Report on the upcoming
// Annual Planning meeting (the roadmap headline).
//
// Dates are anchored around "today" = 2026-06-05 so the list shows Live / Today / Upcoming.

import type {
  Meeting,
  MeetingSummary,
  ActionRecommendation,
  MeetingActionItem,
  Participant,
} from '@/types/meeting'

// --- People ----------------------------------------------------------------

const PRIYA: Participant = { id: 'p-priya', name: 'Priya Raman', kind: 'advisor', title: 'Sr. Wealth Advisor', email: 'priya.raman@zionsbancorp.com', rsvp: 'going' }
const MARCUS: Participant = { id: 'p-marcus', name: 'Marcus Bell', kind: 'advisor', title: 'Associate Advisor', email: 'marcus.bell@zionsbancorp.com', rsvp: 'going' }
const DANIEL: Participant = { id: 'p-daniel', name: 'Daniel Okafor', kind: 'advisor', title: 'Corporate Trust Officer', email: 'daniel.okafor@zionsbancorp.com', rsvp: 'going' }

const RALPH: Participant = { id: 'c-ralph', name: 'Ralph Whitmore', kind: 'client', title: 'Primary', email: 'ralph.whitmore@gmail.com', phone: '+1 (801) 555-0142', rsvp: 'going' }
const DIANE: Participant = { id: 'c-diane', name: 'Diane Whitmore', kind: 'client', title: 'Spouse', email: 'diane.whitmore@gmail.com', phone: '+1 (801) 555-0143', rsvp: 'going' }

const KEN: Participant = { id: 'c-ken', name: 'Ken Nakamura', kind: 'client', title: 'Primary', email: 'ken.nakamura@outlook.com', phone: '+1 (480) 555-0199', rsvp: 'going' }
const MEI: Participant = { id: 'c-mei', name: 'Mei Nakamura', kind: 'client', title: 'Spouse', email: 'mei.nakamura@outlook.com', rsvp: 'maybe' }

const TRUSTEE_1: Participant = { id: 'c-cf-rivera', name: 'Sandra Rivera', kind: 'client', title: 'City Treasurer', email: 'srivera@cedarfalls.gov', phone: '+1 (319) 555-0110', rsvp: 'going' }
const TRUSTEE_2: Participant = { id: 'c-cf-hodge', name: 'Tom Hodge', kind: 'client', title: 'Finance Director', email: 'thodge@cedarfalls.gov', rsvp: 'declined' }

// --- Meetings --------------------------------------------------------------

export const MEETINGS: Meeting[] = [
  // 1) CENTERPIECE — concluded today, full AI bundle ready.
  {
    id: 'mtg-whitmore-q2',
    subject: 'Whitmore Household — Quarterly Review',
    relationshipName: 'Whitmore Household',
    relationshipId: 'r-whitmore',
    startTime: '2026-06-05T09:00:00',
    endTime: '2026-06-05T09:45:00',
    meetingType: 'periodic',
    lifecycle: 'ended_ready',
    vendor: 'teams',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/whitmore-q2',
    hasTranscript: true,
    isAttendee: true,
    myRsvp: 'going',
    owner: 'Priya Raman',
    organizer: PRIYA,
    participants: [RALPH, DIANE, PRIYA, MARCUS],
    prepStatus: 'complete',
    prepNotesHtml: `<p>Goals for today: confirm the lake-property proceeds and timing, tee up the first RMD, and get the 529 moving for the new grandchild. Diane wants Ralph's beneficiary designations cleaned up.</p>`,
    transcript: `Priya Raman: Thanks for making time, Ralph. Diane, good to see you. How did the lake property sale close out?
Ralph Whitmore: It closed last Friday — cleaner than expected. We'll need about a hundred and twenty thousand moved over to our Amegy checking by mid-June for the bridge on the new place.
Priya Raman: Got it — a one-twenty distribution to the Amegy account, targeting mid-June. I'll get that started.
Diane Whitmore: Honestly, Priya, you've made all of this so easy this year. We really appreciate it.
Priya Raman: That means a lot — thank you.
Diane Whitmore: And we wanted to ask about the grandchild — our daughter just had a baby, and we'd like to set something up for college.
Priya Raman: A 529 makes sense. I'll pull options. Ralph, you also turn 73 this year, so we need to schedule your first RMD before year-end.
Ralph Whitmore: Right. Let's make sure that's handled. Also — my sister Carol is recently widowed and pretty worried about her retirement. I'd love for her to talk to someone like you.
Priya Raman: I'd be glad to help Carol. We can set up an introductory call whenever she's ready.
Diane Whitmore: One more — our CPA, Janet Liu, handles the trust returns; it might be worth the two of you connecting before year-end.
Priya Raman: Great idea. And please confirm Diane is primary beneficiary on the LPL accounts — I'll get that updated.`,
    topics: [
      { id: 't1', label: 'Liquidity / cash need' },
      { id: 't2', label: 'Required Minimum Distribution' },
      { id: 't3', label: 'Education funding (529)' },
      { id: 't4', label: 'Beneficiary designation' },
      { id: 't5', label: 'Referral — family' },
    ],
    lifeEvents: [
      { id: 'le1', type: 'liquidity_event', label: 'Liquidity event', detail: 'Lake property sold; $120K bridge need to Amegy by mid-June.', snippet: 'It closed last Friday… a hundred and twenty thousand moved over to our Amegy checking by mid-June.' },
      { id: 'le2', type: 'retirement', label: 'Turning 73 — first RMD', detail: "Ralph turns 73 this year; first Required Minimum Distribution due before year-end.", snippet: 'you also turn 73 this year, so we need to schedule your first RMD before year-end.' },
      { id: 'le3', type: 'new_grandchild', label: 'New grandchild', detail: 'Daughter had a baby; interest in funding a 529.', snippet: 'our daughter just had a baby, and we’d like to set something up for college.' },
    ],
    referralMoments: [
      { id: 'rm1', trigger: 'network_mention', snippet: 'My sister Carol is recently widowed and pretty worried about her retirement. I’d love for her to talk to someone like you.', timestampRange: '00:06:10–00:06:40', subjectName: 'Carol (Ralph’s sister)', relationship: 'family', inferredNeed: 'retirement / widow planning', confidence: 0.92, suggestedNextStep: 'Offer a warm introductory call with Carol; add a referral task.' },
      { id: 'rm2', trigger: 'positive_sentiment', snippet: 'You’ve made all of this so easy this year. We really appreciate it.', timestampRange: '00:02:55–00:03:05', relationship: 'unknown', confidence: 0.86, suggestedNextStep: 'Moment of delight — natural opening to ask if they know others who’d benefit.' },
      { id: 'rm3', trigger: 'coi_reference', snippet: 'Our CPA, Janet Liu, handles the trust returns; it might be worth the two of you connecting.', subjectName: 'Janet Liu (CPA)', relationship: 'COI', inferredNeed: 'tax / trust coordination', confidence: 0.81, suggestedNextStep: 'Plan COI outreach to Janet Liu for year-end tax coordination.' },
    ],
    email: {
      status: 'draft',
      isAi: true,
      subject: 'Following up on today’s review — next steps',
      to: ['ralph.whitmore@gmail.com', 'diane.whitmore@gmail.com'],
      cc: ['priya.raman@zionsbancorp.com'],
      bodyHtml: `<p>Hi Ralph and Diane,</p>
<p>Thank you both for the time today — it was great to catch up. To recap what we agreed:</p>
<ul>
<li>We’ll process the <strong>$120,000 distribution</strong> to your Amegy checking by <strong>mid-June</strong> for the bridge purchase.</li>
<li>I’ll schedule Ralph’s <strong>first RMD</strong> and follow up with the calculation in two weeks.</li>
<li>I’ll send a short menu of <strong>529 options</strong> for your new grandchild.</li>
<li>I’ll update the records to confirm <strong>Diane as primary beneficiary</strong> on the LPL accounts.</li>
</ul>
<p>Whenever Carol is ready, just let me know and I’ll set up a time to say hello.</p>
<p>Warm regards,<br/>Priya</p>`,
    },
  },

  // 2) LIVE right now.
  {
    id: 'mtg-nakamura-live',
    subject: 'Nakamura Family — Portfolio Check-in',
    relationshipName: 'Nakamura Family',
    relationshipId: 'r-nakamura',
    startTime: '2026-06-05T13:00:00',
    endTime: '2026-06-05T13:30:00',
    meetingType: 'periodic',
    lifecycle: 'live',
    vendor: 'zoom',
    meetingLink: 'https://zoom.us/j/nakamura-checkin',
    hasTranscript: false,
    isAttendee: true,
    myRsvp: 'going',
    owner: 'Priya Raman',
    organizer: PRIYA,
    participants: [KEN, MEI, PRIYA],
    prepStatus: 'in_progress',
    prepNotesHtml: `<p>Rebalance overdue; Ken asked last time about an RMD planning window. Check 529 performance.</p>`,
  },

  // 3) UPCOMING — Pre-Meeting Prep Report demo (roadmap headline).
  {
    id: 'mtg-whitmore-annual',
    subject: 'Whitmore Household — Annual Planning',
    relationshipName: 'Whitmore Household',
    relationshipId: 'r-whitmore',
    startTime: '2026-06-09T10:00:00',
    endTime: '2026-06-09T11:00:00',
    meetingType: 'periodic',
    lifecycle: 'upcoming',
    vendor: 'teams',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/whitmore-annual',
    hasTranscript: false,
    isAttendee: true,
    myRsvp: 'going',
    owner: 'Priya Raman',
    organizer: PRIYA,
    participants: [RALPH, DIANE, PRIYA, MARCUS],
    prepStatus: 'not_started',
    prepReport: {
      generatedAt: '2026-06-08T06:00:00',
      deliveredTo: 'priya.raman@zionsbancorp.com',
      recommendedTopics: [
        'Confirm the $120K distribution landed and the bridge purchase closed',
        'Walk through first-RMD calculation and withholding election',
        'Present 529 options for the new grandchild',
        'Introduce a plan for Carol (Ralph’s sister) if she’s ready',
        'Year-end tax coordination with CPA Janet Liu',
      ],
      sections: [
        {
          id: 's1', title: 'Meeting History & Key Themes', icon: 'history',
          highlights: [
            'Last 3 meetings centered on the lake-property sale and resulting liquidity.',
            'Recurring theme: simplifying Ralph & Diane’s cross-custodian picture (Fi-Tek + LPL).',
            'Open thread from Q2: confirm Diane as primary beneficiary on LPL.',
          ],
          evidence: [
            { quote: '“…a hundred and twenty thousand moved over to our Amegy checking by mid-June.”', source: 'Quarterly Review · Jun 5, 2026' },
            { quote: '“Confirm Diane is primary beneficiary on the LPL accounts.”', source: 'Quarterly Review · Jun 5, 2026' },
          ],
        },
        {
          id: 's2', title: 'Client Profile Overview', icon: 'user',
          highlights: [
            'Ralph (73 this year) & Diane Whitmore; retired, Salt Lake City.',
            'New grandchild (daughter’s child) — 529 interest.',
            'Sister Carol recently widowed — potential referral.',
          ],
        },
        {
          id: 's3', title: 'Relationship Profile', icon: 'users',
          highlights: [
            'Wealth team: Priya Raman (lead), Marcus Bell (associate).',
            'Tenure 8 yrs · Segment: HNW · Relationship value ≈ $5.6M.',
            'COI: Janet Liu, CPA (trust returns).',
          ],
        },
        {
          id: 's4', title: 'Servicing Productivity', icon: 'workflow',
          highlights: [
            'Distribution — ACH $120K to Amegy: in progress, within SLA.',
            'Account Opening (Fi-Tek custody): Generate & Submit in progress.',
            'Beneficiary update (LPL) & RMD calculation: not started.',
          ],
        },
        {
          id: 's5', title: 'Financial Overview', icon: 'trending',
          highlights: [
            'Fi-Tek managed $4.2M · LPL $1.8M · Amegy core (checking $180K, mortgage $640K).',
            'Allocation 62/33/5 (equity/fixed/cash); slightly over on equity vs. policy.',
            'YTD performance +6.1% net; trailing 1-yr +11.4%.',
          ],
        },
        {
          id: 's6', title: 'Recommended Discussion Topics', icon: 'sparkles',
          highlights: [
            'Rebalance equity back toward policy band after the distribution settles.',
            'Lock the RMD schedule and 529 funding amount.',
            'Decide on the Carol introduction and Janet Liu (CPA) year-end sync.',
          ],
        },
      ],
    },
  },

  // 4) IN-PERSON — no recording → manual summary, transcript-link banner.
  {
    id: 'mtg-cedar-falls',
    subject: 'City of Cedar Falls — Trustee Sync',
    relationshipName: 'City of Cedar Falls',
    relationshipId: 'r-cedar-falls',
    startTime: '2026-06-03T09:30:00',
    endTime: '2026-06-03T10:15:00',
    meetingType: 'one_off',
    lifecycle: 'no_recording',
    vendor: 'in_person',
    location: '220 Clay St, Cedar Falls, IA 50613',
    hasTranscript: false,
    isAttendee: true,
    myRsvp: 'going',
    owner: 'Daniel Okafor',
    organizer: DANIEL,
    participants: [TRUSTEE_1, TRUSTEE_2, DANIEL],
    prepStatus: 'complete',
  },

  // 5) HISTORICAL — predates AI capture.
  {
    id: 'mtg-nakamura-may',
    subject: 'Nakamura Family — Portfolio Check-in',
    relationshipName: 'Nakamura Family',
    relationshipId: 'r-nakamura',
    startTime: '2026-05-28T14:00:00',
    endTime: '2026-05-28T14:30:00',
    meetingType: 'periodic',
    lifecycle: 'historical',
    vendor: 'zoom',
    isHistorical: true,
    isAttendee: true,
    myRsvp: 'going',
    owner: 'Priya Raman',
    organizer: PRIYA,
    participants: [KEN, PRIYA],
    transcript: 'Discussion of rebalancing and an upcoming RMD planning window.',
  },

  // 6) NON-ATTENDEE — view-only, muted in the list.
  {
    id: 'mtg-amegy-intro',
    subject: 'Amegy Commercial — Business-owner Intro',
    relationshipName: 'Tran Logistics (prospect)',
    relationshipId: 'r-tran',
    startTime: '2026-06-09T15:00:00',
    endTime: '2026-06-09T15:30:00',
    meetingType: 'one_off',
    lifecycle: 'upcoming',
    vendor: 'meet',
    meetingLink: 'https://meet.google.com/tran-intro',
    isExternal: true,
    isAttendee: false,
    myRsvp: 'none',
    owner: 'Marcus Bell',
    organizer: MARCUS,
    participants: [MARCUS],
  },
]

export const MEETING_SUMMARIES: Record<string, MeetingSummary> = {
  'mtg-whitmore-q2': {
    meetingId: 'mtg-whitmore-q2',
    isAttested: false,
    isAiEnhanced: true,
    contentHtml: `<h2>Meeting summary</h2>
<p>Quarterly review with <strong>Ralph &amp; Diane Whitmore</strong> (Whitmore Household). Reviewed portfolio performance across Fi-Tek and LPL, planning in eMoney, and near-term cash needs.</p>
<h3>Key topics</h3>
<ul>
<li><strong>Liquidity event.</strong> The lake-property sale closed; Ralph needs <strong>$120,000</strong> moved to his Amegy checking by mid-June for a bridge purchase.</li>
<li><strong>RMD.</strong> Ralph turns 73 this year — his first required minimum distribution must be scheduled before year-end.</li>
<li><strong>Education.</strong> Interest in funding a 529 for a new grandchild.</li>
<li><strong>Beneficiaries.</strong> Confirm Diane as primary beneficiary across the LPL accounts.</li>
</ul>
<h3>Decisions &amp; next steps</h3>
<ul>
<li>Proceed with a <strong>$120,000 ACH distribution</strong> from the Fi-Tek managed account to Amegy checking.</li>
<li>Schedule the RMD calculation; follow up in two weeks.</li>
<li>Send 529 options; update beneficiary designation on LPL.</li>
</ul>`,
  },
}

/** AI action recommendations per meeting (from the transcript). */
export const ACTION_RECOMMENDATIONS: Record<string, ActionRecommendation[]> = {
  'mtg-whitmore-q2': [
    {
      id: 'rec-dist',
      blueprintName: 'Distribution — ACH $120,000 to Amegy checking',
      blueprintCategory: 'Move Money',
      servicingJourneyId: 'sv-whitmore',
      detail: 'Life-event liquidity need confirmed in the 6/5 review. Targets mid-June; routes to Suitability & Supervision then ops.',
    },
    {
      id: 'rec-rmd',
      blueprintName: 'Schedule RMD calculation (first RMD, age 73)',
      blueprintCategory: 'Account Maintenance',
      detail: 'First required minimum distribution due before year-end.',
    },
    {
      id: 'rec-bene',
      blueprintName: 'Update beneficiary designation — LPL accounts',
      blueprintCategory: 'Account Maintenance',
      detail: 'Confirm Diane Whitmore as primary beneficiary.',
    },
  ],
}

/** Actions already linked to the meeting. */
export const LINKED_ACTIONS: Record<string, MeetingActionItem[]> = {
  'mtg-whitmore-q2': [],
}

/** Other open actions for the relationship (linkable). */
export const RELATIONSHIP_ACTIONS: Record<string, MeetingActionItem[]> = {
  'mtg-whitmore-q2': [
    { actionRunId: 'FT-AO-20455', name: 'Account Opening — Fi-Tek custody', blueprintName: 'Account Opening', status: 'processing', createdAt: '2026-06-01', sourceSystem: 'avantos' },
    { actionRunId: 'REL-WHIT-REV', name: 'Annual review — schedule', blueprintName: 'Relationship Management', status: 'scheduled', createdAt: '2026-05-15', sourceSystem: 'salesforce' },
  ],
}
