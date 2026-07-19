// Ask Anything — scripted answers (Spec 007 Phase 6 · Spec 010 P0.3 meeting-aware).
// No LLM; keyword-matched mock responses (markdown), now keyed by relationship so a
// question inside the Nakamura or Cedar Falls meeting no longer returns Whitmore answers.
// Match order: the meeting's relationship set → book-of-business (default) → relationship fallback.

export interface ScriptedReply {
  /** Lowercased keywords; first rule whose keywords all match wins. */
  keywords: string[]
  /** Markdown answer (rendered via marked + DOMPurify, typed out by the typewriter). */
  answer: string
}

interface ReplySet {
  suggested: string[]
  replies: ScriptedReply[]
  fallback: string
}

// --- Whitmore Household (r-whitmore) ---------------------------------------
const WHITMORE: ReplySet = {
  suggested: [
    'Summarize this meeting and generate follow-up actions',
    'What referral opportunities came up in this meeting?',
    'Prep me for my next meeting with this household',
    'Which distributions are delayed beyond SLA?',
  ],
  replies: [
    {
      keywords: ['accounts', 'custodian'],
      answer: `**Whitmore Household — accounts across systems** (one unified identity):

- **Fi-Tek** (in-house custody) — managed account · **$4.2M**
- **LPL** — fee + brokerage (incl. joint) · **$1.8M**
- **eMoney** — active financial plan
- **Amegy Bank** (core) — checking $180K, mortgage ($640K)
- **Salesforce** — CRM relationship record

Total relationship value ≈ **$5.6M** across Wealth + Bank.`,
    },
    {
      keywords: ['onboarding', 'tasks'],
      answer: `**Whitmore Household — open items**

- Account Opening (Fi-Tek custody) — *Generate & Submit* in progress
- Distribution — ACH $120K to Amegy — *Suitability & Supervision review* next
- Beneficiary update (LPL) — not started
- RMD calculation (age 73) — not started

No KYC gaps outstanding.`,
    },
    {
      keywords: ['referral'],
      answer: `**3 referral signals** in today's Whitmore review:

- **Moment of delight** — *"You've made all of this so easy this year."* A natural opening to ask for an introduction.
- **Network mention** — Ralph's sister **Carol** is recently widowed and worried about retirement (~92% confidence). Suggested: offer a warm intro call.
- **Center of influence** — the household CPA **Janet Liu** handles the trust returns. Suggested: COI outreach for year-end tax coordination.

I can draft a referral task or add a line to the follow-up email — your call. *(Compliant prompts only — never auto-sent.)*`,
    },
    {
      keywords: ['delight'],
      answer: `One clear **moment of delight** today: *"You've made all of this so easy this year. We really appreciate it."* — a strong satisfaction signal and a natural, compliant opening to ask whether Ralph & Diane know others who'd benefit from similar guidance.`,
    },
    {
      keywords: ['prep'],
      answer: `Here's your **pre-meeting prep** for the Whitmore household (full report is on the Prep tab):

- **History:** last 3 meetings centered on the lake-property sale and resulting liquidity; open item — confirm Diane as primary beneficiary (LPL).
- **Profile:** Ralph turns 73 (first RMD); new grandchild (529 interest); sister Carol — possible referral.
- **Financials:** Fi-Tek $4.2M · LPL $1.8M; allocation slightly over on equity vs. policy.
- **Recommended agenda:** confirm the $120K landed, finalize RMD + 529, decide on the Carol intro and CPA Janet Liu sync.`,
    },
    {
      keywords: ['life event'],
      answer: `**3 life events** detected from the transcript:

- **Liquidity event** — lake property sold; $120K bridge need by mid-June.
- **Turning 73** — first Required Minimum Distribution due before year-end.
- **New grandchild** — interest in funding a 529.

Each can be turned into a tracked action from the Actions tab.`,
    },
    {
      keywords: ['summarize', 'follow'],
      answer: `**Today's Whitmore review, in brief:**

- Lake-property sale closed → needs **$120K** to Amegy checking by mid-June.
- First **RMD** (age 73) to schedule before year-end.
- Interest in a **529** for a grandchild.
- Confirm **Diane** as primary beneficiary on LPL.

**Recommended actions** (see the Actions tab): create the $120K distribution, schedule the RMD calc, update the LPL beneficiary.`,
    },
    {
      keywords: ['summary', 'topics'],
      answer: `Main topics from the Whitmore Quarterly Review: a **$120K liquidity need** from the property sale, a first-year **RMD**, a **529** for education, and a **beneficiary** confirmation on the LPL accounts.`,
    },
  ],
  fallback:
    "I can answer across the Whitmore household — accounts, the $120K distribution, the RMD, the 529, referral signals (Carol, CPA Janet Liu), or prep for the Annual Planning meeting. Try one of the suggested prompts.",
}

// --- Nakamura Family (r-nakamura) — live check-in --------------------------
const NAKAMURA: ReplySet = {
  suggested: [
    'Summarize the Nakamura check-in so far',
    'What should I cover with the Nakamuras today?',
    'Is the portfolio due for a rebalance?',
    'Any RMD planning items for the Nakamuras?',
  ],
  replies: [
    {
      keywords: ['rebalanc'],
      answer: `**Yes — the Nakamura portfolio is overdue for a rebalance.** Drift has pushed equity above the policy band since the last review. The *Manage Investment Strategy* action (REL-NAK-3391) is staged in Draft — I can move it forward once you and Ken align on the target allocation.`,
    },
    {
      keywords: ['rmd'],
      answer: `Ken asked about an **RMD planning window** last time. It's flagged as a **Qualified Opportunity** (REL-NAK-3391) — worth confirming his target distribution year and withholding before year-end. I can open an RMD calculation action from the Actions tab.`,
    },
    {
      keywords: ['529'],
      answer: `The Nakamuras' **529** is on the agenda for a performance check. Returns are tracking to plan; no action needed unless they want to adjust contributions. I can pull the detailed performance if helpful.`,
    },
    {
      keywords: ['cover'],
      answer: `**Suggested agenda for the Nakamura check-in:**

1. **Rebalance** — equity is over the policy band; confirm the target allocation.
2. **RMD planning window** — Ken raised this last time; lock the distribution year.
3. **529 performance** — quick review, no action expected.

Mei RSVP'd *Maybe* — keep it concise in case she joins late.`,
    },
    {
      keywords: ['summar'],
      answer: `**Nakamura check-in — live.** This session is in progress, so there's no final summary yet. Top of mind from prep: the portfolio is **overdue for a rebalance**, Ken has an open **RMD planning** question, and the **529** is due for a performance check. I'll draft the full summary the moment the meeting ends.`,
    },
    {
      keywords: ['account'],
      answer: `**Nakamura Family — accounts:** a Fi-Tek managed account and an IRA, with the *Manage Investment Strategy* action (REL-NAK-3391) currently in Draft. Ask about the rebalance or RMD window for the specifics.`,
    },
  ],
  fallback:
    "This is the Nakamura Family check-in (live). I can talk through the rebalance, Ken's RMD planning window, or the 529 — or summarize once the session ends.",
}

// --- City of Cedar Falls (r-cedar-falls) — muni trust ----------------------
const CEDAR_FALLS: ReplySet = {
  suggested: [
    'Summarize the Cedar Falls trustee sync',
    "What's the status of the GO bond disbursement?",
    'Any growth opportunities with Cedar Falls?',
  ],
  replies: [
    {
      keywords: ['bond'],
      answer: `**2026 GO bond disbursement** (FT-CT-90187) is **In Progress** and tracking to the trustee schedule. Corporate Trust owns the disbursement; next checkpoint is the trustee review. I can surface the full servicing trail from the Actions tab.`,
    },
    {
      keywords: ['disburs'],
      answer: `The **GO bond disbursement** (FT-CT-90187) is **In Progress**, within the trustee timeline. No blockers flagged.`,
    },
    {
      keywords: ['referral'],
      answer: `**One strong growth signal:** **Marcus Hale**, Finance Director at the City of Cedar Falls, is a **Corporate Trust → Wealth** bridge (OPP-TW-0001). The trustee relationship is the natural warm intro. *(Compliant prompts only — never auto-sent.)*`,
    },
    {
      keywords: ['growth'],
      answer: `**Marcus Hale** (Finance Director) is the headline opportunity here — a **Corporate Trust → Wealth** cross-sell (OPP-TW-0001). The municipal trustee relationship gives you a credible reason to connect.`,
    },
    {
      keywords: ['hale'],
      answer: `**Marcus Hale** — Finance Director, City of Cedar Falls. Flagged as a **Corporate Trust → Wealth** opportunity (OPP-TW-0001). Worth a warm introduction off the trustee relationship.`,
    },
    {
      keywords: ['recording'],
      answer: `This trustee sync was **in person — no recording**. There's no transcript or AI summary; notes were captured manually. You can still link a recording later to generate a summary, or write one by hand on the Summary tab.`,
    },
    {
      keywords: ['transcript'],
      answer: `No transcript — this was an **in-person** meeting with no recording. Summarize manually on the Summary tab, or link a recording to generate one.`,
    },
    {
      keywords: ['summar'],
      answer: `**Cedar Falls trustee sync** (in person, no recording). From the manual notes: routine trustee coordination, the **2026 GO bond disbursement** is on track, and **Marcus Hale** (Finance Director) is a live **Corporate Trust → Wealth** opportunity. No AI summary — this meeting wasn't recorded.`,
    },
  ],
  fallback:
    "This is the City of Cedar Falls trustee sync — in person, no recording. I can talk through the 2026 GO bond disbursement or the Marcus Hale growth opportunity.",
}

// --- Book of business (default / no relationship) --------------------------
const DEFAULT_SET: ReplySet = {
  suggested: [
    'Which distributions are delayed beyond SLA?',
    'What meetings do I have today?',
    "Summarize my book's open servicing actions",
    'Where are the biggest growth opportunities?',
  ],
  replies: [
    {
      keywords: ['delayed', 'sla'],
      answer: `**2 distributions are past SLA.**

| Client | Request | Owner | Status |
| --- | --- | --- | --- |
| Hargrove Foundation | Grant disbursement $250K | Sofia Delgado | **Blocked** — 4 days over SLA |
| City of Cedar Falls | 2026 GO bond disbursement | Daniel Okafor | Awaiting review — at SLA |

The Whitmore $120K ACH (created from the Quarterly Review) is **in progress and within SLA**.`,
    },
    {
      keywords: ['sla'],
      answer: `One distribution is **blocked past SLA** — the Hargrove Foundation $250K grant (4 days over). Cedar Falls' GO bond disbursement is **at SLA**. Everything else, including the Whitmore $120K ACH, is within SLA.`,
    },
    {
      keywords: ['today', 'meeting'],
      answer: `**Today (Fri, Jun 5):** two meetings —

- **Nakamura Family — Portfolio Check-in** · 1:00 PM · **Live now**
- **Whitmore Household — Quarterly Review** · 9:00 AM · Meeting Assistant ready (summary + actions waiting)`,
    },
    {
      keywords: ['growth'],
      answer: `**Top growth opportunities** right now:

- **Carol Whitmore** — widowed, retirement planning (from the Quarterly Review)
- **Janet Cole** — $8.5M CB&T business-sale inflow (Bank → Wealth)
- **Marcus Hale** — Finance Director, Cedar Falls (Corporate Trust → Wealth)
- **Nakamura Family** — RMD planning window`,
    },
    {
      keywords: ['referral'],
      answer: `Across your book, the freshest **referral signals** are **Carol Whitmore** (from today's review), the household CPA **Janet Liu**, and **Marcus Hale** at Cedar Falls. Open a meeting to act on its specific signals.`,
    },
    {
      keywords: ['servicing'],
      answer: `**Open servicing, by status:** several *In Progress* (Whitmore distribution + account opening, Cedar Falls bond, Tran transfer, Hargrove grant) and a few *Drafts* (Nakamura strategy, Sandoval KYC, Vance maintenance). The Hargrove grant is the one **past SLA**.`,
    },
  ],
  fallback:
    "I can answer across your book — open a meeting for its specific signals, or ask about distributions past SLA, today's meetings, or your biggest growth opportunities.",
}

const REPLY_SETS: Record<string, ReplySet> = {
  'r-whitmore': WHITMORE,
  'r-nakamura': NAKAMURA,
  'r-cedar-falls': CEDAR_FALLS,
  default: DEFAULT_SET,
}

/** Context-aware suggested prompts for the empty state. */
export function suggestedPrompts(relationshipId?: string): string[] {
  return (relationshipId && REPLY_SETS[relationshipId]?.suggested) || DEFAULT_SET.suggested
}

/**
 * Match a prompt against the relationship's reply set, then fall back to
 * book-of-business answers, then the relationship's fallback line.
 */
export function matchReply(prompt: string, relationshipId?: string): string {
  const p = prompt.toLowerCase()
  const set = (relationshipId && REPLY_SETS[relationshipId]) || DEFAULT_SET
  for (const r of set.replies) if (r.keywords.every((k) => p.includes(k))) return r.answer
  if (set !== DEFAULT_SET) {
    for (const r of DEFAULT_SET.replies) if (r.keywords.every((k) => p.includes(k))) return r.answer
  }
  return set.fallback
}
