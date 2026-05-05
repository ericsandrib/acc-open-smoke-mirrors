# Agent 2: UX Copy & Content Design Audit — Account Opening (split annuity)

Branched off `bianca-open-accounts` → `copy-cleanup-acct-opening`. Scope: every user-facing string the v1 (Two tasks) and v2 (Accordion) Account Opening variants render when a household needs both standard and annuity accounts, plus the action and task labels rendered in the pizza tracker (StepSidebar) for the journey those variants live in.

## Verdict: CONDITIONAL

Substantive findings against the rubric — none data-loss or task-blocking, but enough HIGH/MEDIUM violations of "lead with the action / don't describe the system" that the current copy reads as platform-team prose, not advisor guidance.

## Status legend

- ✅ **Applied** — source edit landed on `copy-cleanup-acct-opening`.
- ⏸ **Parked** — deliberately deferred per discussion.
- ➖ **No-op** — finding kept the original wording.
- 🔁 **Resolved by other** — fixed implicitly by another finding's edit.
- ✏️ **Pending manual** — left for hand-tuning.

## Wording calls — resolved

- W1 → **Standard / Annuity** (Title Case for visual consistency with the rest of the wizard; deviation from the audit's literal sentence-case suggestion noted below).
- W2 → **drop "External"**.
- W3 → **Submit** standardised across heading, button, and prose.
- W4 → **Client Setup** (Title Case to match `Account Opening` sibling).
- W5 → **keep `Open Accounts`** (industry conventional; F11 = no-op).

> **Case decision:** the audit's `Suggested Copy` strings used sentence case ("Standard accounts") but the rest of the wizard uses Title Case for headings/labels ("Existing Accounts", "Account Opening"). Applied **Title Case** for visual consistency. The broader sentence-case-everywhere question stays a separate project-wide call.

## Findings

### F1 — [HIGH] Implementation leak: "not in this demo"
- **Status:** ⏸ Parked — internal demo concern, not worth changing per Nick.
- **Location:** `src/components/wizard/forms/OpenAccountsCombinedForm.tsx:137`
- **Flow:** Account Opening → Annuity accordion subtitle (v2)
- **Component Type:** Section subtitle
- **Current Copy:** "Annuity path. KYC and eSign run in NetX360, not in this demo."
- **Issue:** Tells the advisor they're inside a demo wrapper around the real product — the worst kind of implementation leak (Grice "Quality" maxim violation, plus the prototype's own framing creeping into production-modelled copy). Also opens with "Annuity path" — internal taxonomy.
- **Suggested Copy:** "Submit to NetX360 once accounts are ready."
- **Principle:** Lead with the action; cut system description; tone matches an advisor doing routine work, not a developer reviewing a wireframe.
- **Reference:** Apple — Empathy / Context; Grice — Quality maxim.

### F2 — [HIGH] Implementation leak: "inside this app" + jargon: "Standard custodian path"
- **Status:** ✅ Applied — subtitle removed.
- **Location:** `src/components/wizard/forms/OpenAccountsCombinedForm.tsx:107–108`
- **Flow:** Account Opening → Standard accordion subtitle (v2)
- **Component Type:** Section subtitle
- **Current Copy:** "Standard custodian path. KYC, supporting documents, and eSign run inside this app."
- **Issue:** "Standard custodian path" is platform-team jargon — advisors don't think in "paths". "Inside this app" leaks the wrapper boundary. The whole sentence describes the system instead of telling the advisor what to do, and the accordion contents already make the workflow self-evident on expand.
- **Suggested Copy:** *(removed — accordion content is its own affordance)*
- **Principle:** Every word earns its place — Jenga rule. Tooltips/subtitles add information not already visible; this one duplicates the heading and adds noise.
- **Reference:** Shopify — Jenga / Intuit "write small"; NNG — scanning patterns.

### F3 — [HIGH] Wall-of-text page description duplicates accordion subtitles
- **Status:** ✅ Applied — copy now reads "Add the household's accounts. Submit annuity accounts to NetX360 when ready." (rephrased from the audit's original suggestion to use "Submit" per W3).
- **Location:** `src/components/wizard/TaskContent.tsx:128–131`
- **Flow:** Account Opening → page subtitle when v2 combined view is active
- **Component Type:** Page subtitle
- **Current Copy:** "Set up new accounts across both flows. The annuity path hands off to NetX360, while the standard path stays in this app for KYC, supporting documents, and eSign."
- **Issue:** Repeats the same content the two accordion subtitles already give (two-screen redundancy), uses internal "path" framing twice, and contains the "stays in this app" implementation leak. Quantity-maxim violation: more text than the moment requires.
- **Suggested Copy:** "Add the household's accounts. Annuity accounts hand off to NetX360 once submitted."
- **Principle:** Lead with the user's task; one idea per sentence; remove redundant copy across adjacent components.
- **Reference:** Mailchimp — clarity trumps entertainment; Apple — Purpose foundation.

### F4 — [MEDIUM] Parenthetical labels: "(No Annuity)" / "(With Annuity)"
- **Status:** ✅ Applied — "Standard Accounts" / "Annuity Accounts" everywhere (Title Case per W1 case decision).
- **Location:** Multiple — `OpenAccountsCombinedForm.tsx:106, 131`; `combinedOpenAccountsSections.ts:23, 33`; `StepSidebar.tsx:270, 277`; `WizardLayout.tsx:550–551`
- **Flow:** Account Opening — every label that distinguishes the two buckets across both v1 and v2
- **Component Type:** Headings, sidebar labels, breadcrumbs, accordion headers
- **Current Copy:** `Account Opening (No Annuity)` / `Account Opening (With Annuity)` / `Open Accounts (No Annuity)` / `Open Accounts (With Annuity)`
- **Issue:** Parenthetical qualifiers read as form-field metadata or internal taxonomy, not the natural noun phrase an advisor would say out loud. Same parent step title is repeated on every label, then varied only by paren content — the eye has to parse past the redundant prefix to find the differentiator.
- **Suggested Copy:** `Standard accounts` / `Annuity accounts` (parallel two-word labels; differentiator-first)
- **Principle:** Front-loaded keywords for scanning; same concept = same word; remove redundancy.
- **Reference:** NNG — F-pattern scanning; Mailchimp — consistency.

> ⚠ **Wording call for Bianca:** "Standard" is the friendliest pairing against "Annuity" without saying "non-annuity". Alternates: **Brokerage** (narrower — excludes IRAs/trusts that flow through the same registration), **Custodial** (means something specific in financial services and is wrong here), or whatever the firm uses internally. Confirm before we apply.

### F5 — [MEDIUM] CTA / heading verb inconsistency: "Hand off" vs "Submit"
- **Status:** ✅ Applied — header now "Submit to NetX360"; also flipped `ready for handoff` → `ready to submit` in the panel sub-text for consistency.
- **Location:** `src/components/wizard/forms/OpenAccountsCombinedForm.tsx:153` ("Hand off to NetX360" header) and `:168–170` ("Submit to NetX360" button)
- **Flow:** Account Opening → Annuity accordion → handoff panel (v2)
- **Component Type:** Panel heading + primary CTA (same action)
- **Current Copy:** Heading `Hand off to NetX360`; button `Submit to NetX360`
- **Issue:** Same action, two verbs in adjacent components. Forces the advisor to map "hand off" → "submit" mentally. The proposed page subtitle (`hand off to NetX360 once submitted`) adds a third surface. Pick one.
- **Suggested Copy:** Standardise on **Submit to NetX360** in heading, button, and prose. Verb-noun, matches the rest of the wizard ("Submit account workflows for review"), conventional CTA shape.
- **Principle:** CTA consistency — same action, same label everywhere it appears.
- **Reference:** Mailchimp — consistent terminology; NNG — CTA conventions.

> ⚠ **Wording call for Bianca:** alternate is to keep "Hand off" as the heading verb and change the button to "Hand off to NetX360" (4 words incl. brand — within limits, warmer tone). Confirm direction.

### F6 — [MEDIUM] "External" qualifier on the NetX360 badge
- **Status:** ✅ Applied — badge now reads "NetX360".
- **Location:** `src/components/wizard/forms/OpenAccountsCombinedForm.tsx:132–137`
- **Flow:** Account Opening → Annuity accordion header (v2)
- **Component Type:** Status / system badge
- **Current Copy:** `External · NetX360`
- **Issue:** "External" is meta-commentary about the system, not user-relevant content. Advisors already know NetX360 is a separate platform — they live in it. After the accordion subtitle is rewritten to lead with "Submit to NetX360", the badge's "External" qualifier is fully redundant.
- **Suggested Copy:** `NetX360` (drop the qualifier)
- **Principle:** Every word earns its place; remove redundancy across adjacent surfaces.
- **Reference:** Intuit — "cut ruthlessly"; Shopify Jenga.

> ⚠ **Wording call for Bianca:** alternate is to keep "External" as a quick visual cue that this side of the workflow leaves the platform — defensible if the badge is the *only* surface carrying that signal. Given the rewritten subtitle and button both name NetX360, recommend dropping.

### F7 — [MEDIUM] Grammar + jargon: "Next Steps for Annuities Accounts"
- **Status:** ✅ Applied — "Next Steps in NetX360" everywhere (Title Case per case decision). **Also caught during verification:** the actual rendered H3 + body in `OpenAccountsForm.tsx:808–812` had the same heading and a related "outside this demo" body sentence — both updated. The H3 fell under F7; the body cleanup is logged as F13 below.
- **Location:** `combinedOpenAccountsSections.ts:36`; `formRegistry.ts:80`; `OpenAccountsForm.tsx:808` (added during verification)
- **Flow:** Account Opening → Annuity accordion section nav (both v1 and v2)
- **Component Type:** Section label / sidebar nav item
- **Current Copy:** "Next Steps for Annuities Accounts"
- **Issue:** Two issues at once — "Annuities Accounts" is grammatically wrong (should be "Annuity Accounts" — adjective, not plural noun), and the whole label is generic ("Next Steps for X") where the actual next step is concrete (NetX360 handoff).
- **Suggested Copy:** "Next steps in NetX360"
- **Principle:** Specificity over generic labels; clarity above all.
- **Reference:** Mailchimp — clarity; Apple — specificity in labels.

### F8 — [MEDIUM] Pizza tracker action: "Collect Client Data" reads as system jargon
- **Status:** ✅ Applied — action title now "Client Setup".
- **Location:** `src/data/seed.ts:4` (also appears in `workflowStore.tsx` snapshots)
- **Flow:** Pizza tracker (StepSidebar) — first action group header, visible across the entire journey
- **Component Type:** Action / phase label
- **Current Copy:** "Collect Client Data"
- **Issue:** "Collect … Data" is database/CRM language. An advisor's mental model for this phase is closer to "set up the household" or "gather the client's info" — they're having conversations and entering known information, not extracting data from a record. Two of the rubric's anti-patterns apply: jargon (system-flavored verb-noun pair) and tone mismatch (formal/system register where the rest of the wizard reads conversationally). Compounds with the next finding (terminology drift to the child task "Client Info").
- **Suggested Copy:** "Client setup" (recommended — phase-style noun, matches the cadence of "Account Opening"), or "Client info" if we'd rather collapse action + task into the same noun (see next finding).
- **Principle:** Write like a human; tone consistency across phases; describe the user's task, not the system's.
- **Reference:** Apple — Empathy / Purpose; Mailchimp — voice & tone.

> ⚠ **Wording call for Bianca:** "Client setup" preserves "Account Opening" as the parallel sibling phase. "Client info" matches the child task verbatim and removes the data/info terminology drift in one move. Confirm direction.

### F9 — [MEDIUM] Implementation leak in v1 form description: "outside this app"
- **Status:** ✅ Applied.
- **Location:** `src/components/wizard/formRegistry.ts:44–45`
- **Flow:** v1 — Open Accounts (with annuity) task description
- **Component Type:** Task subtitle (rendered under the page heading by `TaskContent`)
- **Current Copy:** "Annuity path: add accounts by registration type. KYC and eSign run outside this app."
- **Issue:** Same "path" jargon and "outside this app" implementation leak as the v2 subtitles, plus front-loaded "Annuity path:" prefix that scanning eyes hit first.
- **Suggested Copy:** "Add annuity accounts. Submit to NetX360 — KYC and signatures continue there."
- **Principle:** Lead with the action; describe the destination, not the boundary.
- **Reference:** Apple — Purpose; Mailchimp — voice/tone.

### F10 — [LOW] Pizza tracker terminology drift: "Client Data" (action) vs "Client Info" (task)
- **Status:** 🔁 Resolved by F8 — "Data" no longer appears as a label, so the synonym drift with "Info" is gone. "Client Setup" (phase) and "Client Info" (form) are now distinct concepts, not two words for the same thing.
- **Location:** Action `src/data/seed.ts:4` "Collect Client Data" + child task `src/data/seed.ts:11` "Client Info"
- **Flow:** Pizza tracker — Collect Client Data → Client Info
- **Component Type:** Action label + task label, parent/child pairing
- **Current Copy:** Action "Collect Client Data"; task "Client Info"
- **Issue:** Same concept, two nouns. The action speaks "Data", the only task inside it speaks "Info". Even the proposed page subtitle for the v2 view talks about "the household's accounts" — a third term for related material. Mailchimp principle: same concept, same word, always.
- **Suggested Copy:** Pick one noun and use it across both labels. Recommended: "Client info" everywhere (warmer than "Data"; the task already uses it).
- **Principle:** Consistent terminology — schema formation depends on it.
- **Reference:** Mailchimp — consistency; NNG — schema and learnability.

### F11 — [LOW] "Open Accounts" reads ambiguously next to "Existing Accounts"
- **Status:** ➖ No-op — keeping "Open Accounts" per W5; industry-conventional, lower-stakes.
- **Location:** `src/data/seed.ts:29`; surfaces in pizza tracker labels and breadcrumbs
- **Flow:** Pizza tracker — Account Opening → Open Accounts (also active state title)
- **Component Type:** Task label
- **Current Copy:** "Open Accounts"
- **Issue:** Sitting one row above "Existing Accounts" in the sidebar, the eye reads "Open" as the parallel adjective to "Existing" — i.e. "accounts that are currently open" — rather than the imperative ("open these accounts"). The label is conventional industry shorthand and advisors will parse it correctly, but new users (and screen readers) are forced to disambiguate against the parent action title. Soft finding.
- **Suggested Copy:** "New accounts" (parallel to "Existing accounts"; differentiator is the lifecycle stage). Optional — keeping "Open Accounts" is defensible given industry conventions.
- **Principle:** Front-loaded keywords; remove ambiguity from sibling labels.
- **Reference:** NNG — F-pattern scanning; Mailchimp — clarity.

> ⚠ **Wording call for Bianca:** lower-stakes than the others — "Open Accounts" works in context. Flagging because once we touch label copy it's the cheapest moment to fix. Confirm whether to apply or skip.

### F12 — [LOW] v1 standard form description: tighten + drop redundant qualifier
- **Status:** ✅ Applied.
- **Location:** `src/components/wizard/formRegistry.ts:42–43`
- **Flow:** v1 — Open Accounts (no annuity) task description
- **Component Type:** Task subtitle
- **Current Copy:** "Set up new accounts, complete KYC, and prepare documents for client signature."
- **Issue:** "for client signature" is a redundant qualifier — the only signatures in this flow are the client's. "Set up new" = "Add". Two words to remove.
- **Suggested Copy:** "Add accounts, complete KYC, and prepare documents for signature."
- **Principle:** Jenga / write small.
- **Reference:** Intuit; Shopify.

### F13 — [MEDIUM] Implementation leak: "outside this demo" (added during verification)
- **Status:** ✅ Applied — caught when the verification grep flagged a body paragraph adjacent to the F7 H3.
- **Location:** `src/components/wizard/forms/OpenAccountsForm.tsx:809–811`
- **Flow:** v1 (with-annuity task) and v2 (annuity accordion) — body text under the "Next Steps" heading
- **Component Type:** Section body
- **Current Copy:** "After account and owners are set for each annuity account below, use NetX360 for servicing steps that run outside this demo (funding, features, documents, KYC, and reviews)."
- **Issue:** Same "outside this demo" implementation leak F1/F9 flagged. Also passive-leaning ("are set"), parenthetical list at the end, and the lead-in spends six words before naming what to do.
- **Applied Copy:** "Set the account and owners for each annuity below. Funding, features, documents, KYC, and reviews continue in NetX360." (revised again as part of F14 — leads with the work, not the platform.)
- **Principle:** Lead with the action; describe the destination, not the boundary; one idea per sentence.
- **Reference:** Apple — Purpose; Mailchimp — voice/tone.

### F14 — [MEDIUM] Heading + supporting copy lead with platform name
- **Status:** ✅ Applied across H3 + body + checklist card.
- **Location:** `src/components/wizard/forms/OpenAccountsForm.tsx:808–811` (H3 + body); `src/components/wizard/forms/Netx360HandoffSection.tsx:14–17` (checklist card); `combinedOpenAccountsSections.ts:36`, `formRegistry.ts:80` (matching nav labels).
- **Flow:** v1 with-annuity task and v2 annuity accordion — the section that lists what's still outstanding for an annuity account.
- **Component Type:** Section heading + body + checklist card intro.
- **Current Copy:**
  - H3: `Next Steps in NetX360`
  - Body: `Set the account and owners for each annuity below. NetX360 handles funding, features, documents, KYC, and reviews.`
  - Card: `Account and owner setup is complete in this app. Continue the account opening workflow in NetX360 to finish:`
- **Issue:** Headline and body lead with the platform name rather than the advisor's goal. Card has another "in this app" leak (already removed from sibling copy in F2/F3/F9/F13). The advisor doesn't care which system it lives in — they care what they're trying to accomplish.
- **Applied Copy:**
  - H3: `Continue the account opening` (count-agnostic; verb-led; names the goal, not the venue).
  - Body: `Set the account and owners for each annuity below. Funding, features, documents, KYC, and reviews continue in NetX360.` (work first, venue second).
  - Card: `Account and owner setup is done. Continue in NetX360 to finish:` (drops "in this app" leak, tighter).
  - Nav labels (`Next Steps in NetX360` in `combinedOpenAccountsSections.ts:36` and `formRegistry.ts:80`) updated to match the H3 — terminology consistency.
- **Principle:** Lead with the user's task; describe the goal, not the venue; consistent terminology between nav and heading.
- **Reference:** Apple — Purpose / Empathy; Mailchimp — consistency.

### F15 — [MEDIUM] v1 page title doesn't match pizza tracker label
- **Status:** ✅ Applied.
- **Location:** `src/components/wizard/TaskContent.tsx:90` (page H2)
- **Flow:** v1 split — when the active task is the no-annuity or with-annuity Open Accounts task.
- **Component Type:** Page heading (H2).
- **Issue:** After F4 the pizza tracker shows `Standard Accounts` / `Annuity Accounts`, but the page H2 still pulled from `task.title` which is `Open Accounts` for both records. Same task, two names — Mailchimp consistency violation.
- **Applied Copy:** Page H2 now reads `Standard Accounts` (no-annuity) or `Annuity Accounts` (with-annuity) in v1 split. The override mirrors the existing breadcrumb logic at `WizardLayout.tsx:543`. v2 combined and non-split journeys are unchanged.
- **Principle:** Same concept, same word.
- **Reference:** Mailchimp — consistency; NNG — schema and learnability.

### F16 — [MEDIUM] v1 page subtitles describe process, not page identity
- **Status:** ✅ Applied — supersedes the F9 and F12 applied copy.
- **Location:** `src/components/wizard/formRegistry.ts:42–45`
- **Flow:** v1 — page subtitle under the H2 on each split-annuity Open Accounts page.
- **Component Type:** Page subtitle.
- **Issue:** F9 and F12's applied copy still led with process steps ("Add accounts, complete KYC, prepare documents for signature.") instead of explaining what differentiates the page from its sibling. Process belongs in the section H3s within each page (`Accounts`, `Supporting Documents`, `KYC Verification`, `Envelopes`, `Continue the account opening`), which already articulate the work. Per Nick: the user cares about which accounts go on which page (with vs. without an annuity), not the workflow boundary or platform.
- **Applied Copy:**
  - `open-accounts` (Standard Accounts page): `Set up accounts without an annuity.`
  - `open-accounts-with-annuity` (Annuity Accounts page): `Set up accounts that include an annuity.`
- **Principle:** Page subtitle explains *why this page exists* (identity / category); section H3s explain *what to do here* (process). Parallel structure across siblings; differentiator front-and-centre.
- **Reference:** Apple — Purpose; Mailchimp — voice & tone (page identity vs. process).

### F17 — [MEDIUM] Annuity handoff card duplicates downstream platform's own checklist
- **Status:** ✅ Applied — supersedes the F14 card copy.
- **Location:** `src/components/wizard/forms/Netx360HandoffSection.tsx`
- **Flow:** v1 with-annuity task and v2 annuity accordion — handoff card under the "Continue the account opening" section.
- **Component Type:** CTA card with body + button.
- **Issue:** Card listed six bullets (`Annuity`, `Funding & asset movement`, `Account features & services`, `Documents & eSign`, `KYC`, `Home Office and Principal Reviews`) under a `NEXT STEPS CHECKLIST` H4. NetX360 already shows that checklist when the advisor opens it — duplicating it here creates two sources of truth and leans status-y instead of step-y. Per Nick: this should read as a step, not a status, and NetX360 should appear in the sub-head/button only.
- **Applied Copy:**
  - Body: `Finish the remaining setup for these accounts.` (action-led; the button names the venue).
  - H4 `Next Steps Checklist` and the `<ul>` removed entirely.
  - Outer wrapper collapsed (single child).
  - Button unchanged: `Open NetX360 workflow`.
- **Principle:** Step framing over status framing; the user's task in the body, the destination in the button; remove duplicated content the downstream system owns.
- **Reference:** Apple — Purpose; Mailchimp — voice & tone; Shopify Jenga.

### F18 — [LOW] Section subtitle and CTA button each carry the venue, doubling up
- **Status:** ✅ Applied — supersedes part of the F14 body + the original CTA label.
- **Location:** `src/components/wizard/forms/OpenAccountsForm.tsx:809–811` (subtitle); `src/components/wizard/forms/Netx360HandoffSection.tsx` (button).
- **Flow:** v1 with-annuity task and v2 annuity accordion — section header + CTA.
- **Component Type:** Section subtitle + primary CTA.
- **Issue:** F14 left the section subtitle carrying two ideas: (1) what to do on this page, and (2) what continues in NetX360. The button below redundantly named the venue too (`Open NetX360 workflow`). Two surfaces saying the same handoff in two ways.
- **Applied Copy:**
  - Subtitle: `Set the account and owners for each annuity below.` (drops the trailing list of what continues in NetX360 — that detail moves to the button)
  - Button: `Continue in NetX360` (was `Open NetX360 workflow` — verb-led, mirrors the H3 verb, names the venue once)
- **Principle:** One idea per surface; venue lives where the action happens (the button), not in the subtitle.
- **Reference:** Mailchimp — clarity, consistency; Apple — Purpose.

### F19 — [LOW] Handoff card wrapper and label are now redundant with the button alone
- **Status:** ✅ Applied — supersedes the F17 card structure.
- **Location:** `src/components/wizard/forms/Netx360HandoffSection.tsx`
- **Flow:** v1 with-annuity task and v2 annuity accordion — what used to be the handoff card.
- **Component Type:** CTA (now button-only).
- **Issue:** After F17 the card was a rounded panel containing one paragraph (`Finish the remaining setup for these accounts.`) and one button. The H3 + section subtitle above it already set up the action — the wrapper and the inner label were ceremony around the only thing the advisor needs to do.
- **Applied:** Removed the `rounded-lg border` card wrapper, removed the body paragraph, kept the button (`Continue in NetX360`) wrapped in an `inline-block` anchor so it doesn't take full width.
- **Principle:** Jenga — keep removing until functionality breaks. The button alone says everything the section subtitle hasn't already said.
- **Reference:** Shopify — Jenga; Intuit — write small.

## String-Level Summary

- Passive voice: 0 instances in scope (post-revision: 0).
- Sentences over 20 words: 1 (`TaskContent.tsx:128–131` at 27 words; revised version is 13 words).
- Reading level: current scope sits around grade 10–11 due to financial-domain terms; proposed revisions sit around grade 8–9 — within rubric, appropriate to advisor persona.
- Jargon flags: "path" (4 occurrences), "custodian path" (1), "this app/this demo" (4), all removed in proposed revisions.
- Generic CTAs: 0 — buttons in scope are already verb-noun.
- Blame language in errors: N/A — no error copy in scope.
- Filler words: 0 in proposed revisions.

## Component-Level Summary

- **Section subtitles** (4 instances across `OpenAccountsCombinedForm.tsx`, `TaskContent.tsx`, `formRegistry.ts`): currently describe the system; revisions reframe as "what the advisor does next". 3 of 4 retain a brief subtitle; 1 (`OpenAccountsCombinedForm.tsx:107–108`) is removed entirely as redundant with the accordion contents.
- **Headings** (sidebar, breadcrumb, accordion, page): drop parenthetical qualifiers; differentiator becomes the noun ("Standard accounts" / "Annuity accounts").
- **Pizza tracker action + task labels** (`seed.ts`): one MEDIUM (action "Collect Client Data" reads as system jargon) and two LOW (Data/Info terminology drift; "Open Accounts" / "Existing Accounts" sibling parallelism). "Existing Accounts" and "Account Opening" pass clean.
- **Section nav labels** (`combinedOpenAccountsSections.ts`, `formRegistry.ts`): one label rewritten for grammar + specificity; other functional labels (Accounts, Supporting Documents, KYC Verification, Envelopes) untouched — already conform.
- **CTAs / panel headings**: standardised on "Submit to NetX360" pending Bianca's verb call.
- **Badge**: "External" qualifier proposed for removal; depends on Bianca's call.
- **Errors / empty states / dialogs / tooltips**: none in scope.

## Flow Consistency Summary

- **Terminology**: post-revision the no-annuity bucket reads "Standard accounts" everywhere it appears (sidebar, breadcrumb, accordion, scrollspy); annuity bucket reads "Annuity accounts". Currently four label variants per bucket — collapses to one.
- **Tone**: post-revision, both v1 and v2 use the same advisor-task voice. Currently v2 sounds like a system overview, v1 sounds like a task description — same flow, two registers.
- **CTA consistency**: pending Bianca's verb call; proposed "Submit to NetX360" used uniformly across heading, button, and prose.
- **Progressive disclosure**: post-revision the page subtitle gives the one fact the advisor needs (annuity → NetX360 handoff); accordion subtitles drop entirely (no-annuity) or compress to the action (annuity). Detail layered correctly.

## Anti-Pattern Hits

- **Jargon / tech-speak**: "Standard custodian path", "Annuity path" (Clarity & Comprehension table).
- **Wall of text**: `TaskContent.tsx:128–131` 27-word sentence describing both flows where two short clauses suffice (Volume & Structure).
- **Redundant copy**: page subtitle, accordion subtitles, and form descriptions all explain the same split (Volume & Structure / Redundant copy).
- **Inconsistent terminology**: "(No Annuity)" / "(With Annuity)" / "no-annuity path" / "annuity path" / "standard path" — five surface variants for two concepts (Consistency & Convention). Also: "Client Data" (action) vs "Client Info" (task) — two nouns for the same concept in adjacent pizza-tracker labels.
- **Mixed verbs for same action**: "Hand off" / "Submit" (CTA consistency).
- **Misleading qualifier**: "External" on a NetX360 badge that already names a known external system (Volume & Structure / Redundant copy).
- **Grammar slip**: "Annuities Accounts" — noun used as adjective.

## Contemporary Standards Assessment

Current copy reads like 2018 platform-team microcopy: descriptive, system-named, parenthetical qualifiers, formal nouns. 2025–2026 standard is conversational, action-led, persona-aware, with progressive disclosure replacing dense subtitles. Proposed revisions move every flagged surface in that direction. One pattern that remains dated even after revision: Title Case headings (`Open Accounts`, `Account Opening`, and the existing functional section labels `Supporting Documents`, `KYC Verification`, `Envelopes` are Title Case). The agent rubric calls for sentence case across all UI elements unless brand explicitly requires otherwise. **Not proposing case changes in this pass** — flagging as a separate observation for Bianca to decide as a project-wide call.

## Considered, not changing (yet)

- **`workflowStore.tsx:504–505` action titles** ("Account opening (no annuity)" / "Account opening (with annuity)") — in split mode the breadcrumb override at `WizardLayout.tsx:543` forces "Account Opening", so these strings are not user-visible. Leaving; revisit if they surface elsewhere (analytics, tracking, telemetry).
- **`OpenAccountsVariantSwitcher.tsx`** — internal demo control prefixed `Demo:`. Out of scope for advisor-facing copy.
- **`seed.ts:270–274` "Additional instructions"** — advisor-authored field content, seeded for the prototype. Not interface chrome.
- **Title Case → sentence case across the app** — flagged in Contemporary Standards above; would be a separate, broader pass.

## Wording calls for Bianca (please confirm before source edits)

- **W1 — No-annuity bucket noun** *(drives F4)*: `Standard accounts` (recommended) / `Brokerage accounts` / `Custodial accounts` / firm-preferred term?
- **W2 — NetX360 badge** *(drives F6)*: drop `External` → `NetX360` (recommended) / keep `External · NetX360`?
- **W3 — Verb consistency** *(drives F5; also threads through F1, F3, F9)*: standardise on `Submit to NetX360` (recommended, matches existing wizard CTAs) / standardise on `Hand off to NetX360` (warmer)?
- **W4 — Pizza tracker action label** *(drives F8 + F10)*: `Client setup` (recommended — keeps "Account Opening" as parallel sibling phase) / `Client info` (matches child task and dissolves the Data/Info drift in one move) / keep `Collect Client Data`?
- **W5 — "Open Accounts" task label** *(drives F11)*: keep as-is (industry conventional) / rename to `New accounts` (parallel to "Existing accounts")? Lower-stakes — apply only if confirmed.

## Summary

- Critical: 0 | High: 3 | Medium: 11 | Low: 5
- **Applied:** 16 (F2, F3, F4, F5, F6, F7, F8, F9→F16, F12→F16, F13, F14→F17/F18/F19, F15, F16, F17→F19, F18, F19)
- **Parked:** 1 (F1)
- **No-op:** 1 (F11)
- **Resolved by other:** 1 (F10 ← F8)
- **Remaining manual passes:** ✏️ pending Bianca / Nick — broader sentence-case audit, advisor-instructions in `seed.ts:270–274`, any internal `openAccountsTaskContext.ts` JSDoc comments referencing "this app" (cosmetic, internal).
