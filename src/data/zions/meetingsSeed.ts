// Zions meeting mock data — Spec 007 Phase 6 (the meeting-to-action centerpiece).
//
// The Whitmore Quarterly Review's AI summary surfaces a $120K life-event distribution;
// accepting the recommendation creates the Whitmore distribution servicing journey
// (sv-whitmore in servicingSeed). Mirrors the dashboard's "Meeting Assistant ready" card.

import type {
  Meeting,
  MeetingSummary,
  ActionRecommendation,
  MeetingActionItem,
} from '@/types/meeting'

export const MEETINGS: Meeting[] = [
  {
    id: 'mtg-whitmore-q2',
    subject: 'Whitmore Household — Quarterly Review',
    relationshipName: 'Whitmore Household',
    relationshipId: 'r-whitmore',
    startTime: '2026-06-01T11:00:00',
    endTime: '2026-06-01T11:45:00',
    hasTranscript: true,
    owner: 'Priya Raman',
    transcript: `Priya Raman: Thanks for making time, Ralph. Diane, good to see you. How did the lake property sale close out?
Ralph Whitmore: It closed last Friday — cleaner than expected. We'll need about a hundred and twenty thousand moved over to our Amegy checking by mid-June for the bridge on the new place.
Priya Raman: Got it — a one-twenty distribution to the Amegy account, targeting mid-June. I'll get that started.
Diane Whitmore: And we wanted to ask about the grandchild — setting something up for college.
Priya Raman: A 529 makes sense. I'll pull options. Ralph, you also turn 73 this year, so we need to schedule your first RMD before year-end.
Ralph Whitmore: Right. Let's make sure that's handled. Also please confirm Diane is primary beneficiary on the LPL accounts.`,
  },
  {
    id: 'mtg-nakamura',
    subject: 'Nakamura Family — Portfolio Check-in',
    relationshipName: 'Nakamura Family',
    relationshipId: 'r-nakamura',
    startTime: '2026-05-28T14:00:00',
    endTime: '2026-05-28T14:30:00',
    hasTranscript: true,
    isHistorical: true,
    owner: 'Priya Raman',
    transcript: 'Discussion of rebalancing and an upcoming RMD planning window.',
  },
  {
    id: 'mtg-cedar-falls',
    subject: 'City of Cedar Falls — Trustee Sync',
    relationshipName: 'City of Cedar Falls',
    relationshipId: 'r-cedar-falls',
    startTime: '2026-05-22T09:30:00',
    endTime: '2026-05-22T10:15:00',
    hasTranscript: true,
    isHistorical: true,
    owner: 'Daniel Okafor',
    transcript: 'Bond disbursement schedule for the 2026 GO bond and document requirements.',
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
      detail: 'Life-event liquidity need confirmed in the 6/1 review. Targets mid-June; routes to Suitability & Supervision then ops.',
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
