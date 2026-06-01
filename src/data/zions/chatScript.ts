// Ask Anything — scripted answers (Spec 007 Phase 6). No LLM; keyword-matched mock
// responses (markdown) that answer the RFI's example prompts against the Zions seed.

export interface ScriptedReply {
  /** Lowercased keywords; first rule whose keywords all match wins. */
  keywords: string[]
  /** Markdown answer (rendered via marked + DOMPurify, typed out by the typewriter). */
  answer: string
}

export const SUGGESTED_PROMPTS: string[] = [
  'Summarize this meeting and generate follow-up actions',
  'Which distributions are delayed beyond SLA?',
  'Show all accounts held across custodians for this client',
  'What pending onboarding tasks does the Whitmore household have?',
]

export const SCRIPTED_REPLIES: ScriptedReply[] = [
  {
    keywords: ['delayed', 'sla'],
    answer: `**2 distributions are past SLA.**

| Client | Request | Owner | Status |
| --- | --- | --- | --- |
| Hargrove Foundation | Grant disbursement $250K | Sofia Delgado | **Blocked** — 4 days over SLA |
| City of Cedar Falls | 2026 GO bond disbursement | Daniel Okafor | Awaiting review — at SLA |

The Whitmore $120K ACH (created from today's review) is **in progress and within SLA**.`,
  },
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
]

export const DEFAULT_REPLY =
  "I can answer across this household's accounts, onboarding, servicing, and meetings. Try one of the suggested prompts — for example, *“Which distributions are delayed beyond SLA?”* or *“Show all accounts held across custodians for this client.”*"

export function matchReply(prompt: string): string {
  const p = prompt.toLowerCase()
  for (const r of SCRIPTED_REPLIES) {
    if (r.keywords.every((k) => p.includes(k))) return r.answer
  }
  return DEFAULT_REPLY
}
