# Upstream deltas — proposed changes for `mosaic-avantos/acc-open-smoke-mirrors`

This doc tracks UX changes the Stratos fork has made to the original onboarding
journey. They are **siloed** in `ericsandrib/acc-open-smoke-mirrors` and have
**not** been pushed to the upstream. Use this list to draft upstream PRs or
GitHub issues when ready.

Each delta documents:
- **What** — the user-visible behavior change
- **Why** — the advisor-experience problem it solves
- **Where** — file paths and line ranges in upstream
- **Risk** — what to watch for during review

---

## Delta 1 — Remove annuity question from journey-creation panel

**What.** The "Will this client open an account that includes an annuity?"
required dropdown is removed from the New-journey panel. The journey is
created with `openAnnuityAccount: false` by default; advisors add an annuity
registration on-demand inside Open Accounts.

**Why.** Forces a decision the advisor often can't make at journey-creation
time. If they pick "No" but later realize they need an annuity, they're stuck.
Removing the question avoids the abandon/restart cycle and matches how
annuity-specific configuration is already handled in Open Accounts.

**Where.** `src/components/dashboard/ComposeDialog.tsx`
- Drop the `<Select>` block under "Action settings"
- Drop `Select*` imports
- Drop `openAnnuityAccount` state — keep a const `'no'` so the dispatch payload
  stays the same shape
- Update `canSubmit` to no longer check the annuity field
- Drop `setOpenAnnuityAccount` from the `createMore` reset

**Risk.** Any downstream code that branches on
`journeyOnboardingConfig.openAnnuityAccount === true` will need a way to opt
into annuity flow at runtime (likely via the registration-type picker in Open
Accounts). Verify the annuity child form (`AcctChildAnnuityForm.tsx`) still
loads when an annuity registration is added.

---

## Delta 2 — Auto-spawn KYC drafts for adult household members

**What.** When the wizard opens, `KycForm` automatically creates a Draft
KYC child task for every adult household member (anyone with
`type === 'household_member'` and `role !== 'Dependent'`). Dependents are
skipped. Members already tagged with `kycDirectAdd: true` are skipped to keep
the effect idempotent.

**Why.** 95% of onboarding flows need KYC for the primary client and spouse.
The original UX requires the advisor to click `+ Add contact → search → select
→ submit` for each one — 3-4 clicks per person. Auto-drafting cuts that to a
single "Review & Submit" per row.

**Where.** `src/components/wizard/forms/KycForm.tsx` — add a new `useEffect`
right after the existing `pendingKycPartyId` effect. Keyed on
`kycParentTask?.id` plus `state.relatedParties` so it survives re-renders.

**Risk.**
- The `kycDirectAdd` flag is the source of truth for "already KYC'd" — make
  sure the workflow store's reducers don't clear it on journey resets unless
  intended.
- For households with many adults (e.g. trust scenarios with multiple
  trustees), the auto-spawn could create more drafts than the advisor wants.
  Consider a feature flag or a per-relationship opt-out.

---

## Delta 3 — Gate `+ New envelope` button

**What.** The `+ New envelope` and `Add envelope` buttons in the eSign
Envelopes section of `OpenAccountsForm` are disabled until at least one
account child task reaches `complete` or `awaiting_review`. A tooltip
explains: *"Complete at least one account setup to generate signature
documents."*

**Why.** Prevents advisors from triggering envelope generation against
empty/incomplete accounts. Off-the-shelf UI patterns require sequential
dependencies be visually locked until prerequisites are met.

**Where.** `src/components/wizard/forms/OpenAccountsForm.tsx`
- Add `Tooltip*` imports
- Compute `hasCompletedAccountChild` and
  `envelopeButtonDisabledReason` near the existing `accountOpeningChildren`
  derivation
- Wrap both envelope-trigger buttons in `<Tooltip>` and apply
  `disabled={!!envelopeButtonDisabledReason}`

**Risk.** If a workflow exists where envelopes need to be drafted before any
account is configured (e.g. specific account types pre-pre-fill), this gate
will block them. Verify with the document-validation team. Easy escape hatch:
loosen the `hasCompletedAccountChild` predicate.

---

## Delta 4 — Simplified 4-stage timeline for advisor view

**What.** The advisor-side `ChildActionTimeline` for account-opening renders
4 stages instead of 7:

| Stage | Maps to (HO 7-stage) |
|---|---|
| Draft | Draft |
| Pending Client | Client Signature |
| In Review | Submitted + Document Review + Principal Review |
| Complete | Pending Release + Complete |

Home Office views (which don't currently render `ChildActionTimeline`) keep
the full 7-stage breakdown via `advisorView={false}`.

**Why.** Advisors only need to know "is it on my desk or theirs?" The 7-stage
view is back-office detail — accurate but cognitively expensive. The 4-stage
view groups the home-office-internal stages.

**Where.** `src/components/wizard/ChildActionTimelineSheet.tsx`
- Add `ADVISOR_ACCOUNT_OPENING_STAGES` constant
- Update `getStagesForType` to take an `advisorView` flag
- Add `advisorView?: boolean` (default `true`) to `ChildActionTimeline`
- Add `advisorView` arg to `getActiveStageLabel` (default `false` for
  back-compat)
- Add aliases for "Pending Client" (=`Client Signature`) and "In Review"
  (=`Submitted`) in the pre-review-timeline annotation block

**Risk.** Status-derived UI elsewhere (e.g. badge labels) calls
`getActiveStageLabel`. The default there is `false` so existing call sites
get the 7-stage label, unchanged. New callers can opt in.

---

## Delta 5a — Save-and-return CTA on the last child sub-step

**What.** On the final sub-step of a child action (e.g. Documents step in
Account Opening) in advisor view, the left-side "Back" button is replaced
with a primary "← Save & Return to Accounts Hub" button. Clicking it
dispatches `EXIT_CHILD_ACTION` instead of `CHILD_GO_BACK`.

**Why.** Users get lost in nested forms. The current pattern requires them
to either click "Back" repeatedly or rely on the breadcrumb. A clear "Save &
Return" affordance on the terminal step is the standard hub-and-spoke exit.

**Where.** `src/components/wizard/ChildActionFooter.tsx` — inside the
`isAdvisorView || isAmlView || isHoKycView` branch, replace the unconditional
`{!isFirst && <Back/>}` with a conditional that shows the save-return button
when `isAdvisorView && isLast`, falls back to the original Back otherwise.

**Risk.** AML and HO KYC views still get the original Back button — this
change is scoped to advisor view only. Verify with the supervision team that
they don't want the same affordance.

## Delta 5b — Primary-styled parent-task breadcrumb in ChildActionSidebar

**What.** The "Back to Open Accounts / Back to KYC Review" link in
`ChildActionSidebar` is restyled from a quiet text link to a primary-fill
button (`bg-primary text-primary-foreground`).

**Why.** Reinforces the hub-and-spoke exit pattern from Delta 5a — the
primary button in the top-left is the unambiguous way out.

**Where.** `src/components/wizard/ChildActionSidebar.tsx` — change the
className on the `<button onClick={EXIT_CHILD_ACTION}>` near line 145.

**Risk.** Visual only. May want to soften the styling if the primary fill
feels too aggressive in production themes.

---

## Out-of-scope ideas (not implemented)

These came up in discussion but weren't shipped — keep here for future
reference:

- **Annuity-on-demand badge in Open Accounts.** Surface a one-click "Add
  annuity" prompt inside Open Accounts so advisors don't have to remember the
  annuity flow exists. Pairs naturally with Delta 1.
- **KYC draft "preview" before auto-spawn.** Show advisor a "We'll create
  KYC drafts for: Jane Smith, John Smith. Continue?" toast on first wizard
  load. Reduces surprise from Delta 2.
- **NIGO badge in advisor 4-stage timeline.** When a child is in
  `rejected` status, show "Action Required" as a 5th red stage label in the
  advisor view. Currently rejection paints the active stage red but the
  label still says "In Review", which can be misleading.
