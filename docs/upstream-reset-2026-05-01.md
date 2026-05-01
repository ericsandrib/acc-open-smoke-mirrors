# Upstream reset — 2026-05-01

The wizard / Account Opening flow has been reset to **upstream parity** at
`mosaic-avantos/acc-open-smoke-mirrors@7180a6d`, with one carve-out:
**insurance-specific elements (annuity / NetX360 split path) are removed.**

The Schwab API harness that previously lived under `/onboarding/flow/*` is
**archived** to `archive/schwab-demo/` — code preserved, demo no longer
reachable.

Stratos branding and the `/relationships` page (6-column build locked by
Chris Radzinski's 4/28 advisor session) are **kept**.

## Inventory

### Wizard — reset to upstream

Every file under `src/components/wizard/`, `src/components/dashboard/
ComposeDialog.tsx`, `src/components/servicing/`, `src/data/seed.ts`,
`src/data/servicingSeed.ts`, `src/data/accountFeatureServiceOptions.ts`,
`src/types/workflow.ts`, `src/utils/accountOpeningChildProgress.ts`,
`src/utils/accountOpeningOwnerKyc.ts`, `src/utils/childTaskRegistry.ts`,
`src/utils/openAccountsDocumentValidation.ts`,
`src/utils/openAccountsTaskContext.ts`,
`src/utils/smartDocuments.ts`, `src/utils/workflowMissingData.ts`,
`src/stores/servicingStore.tsx` was checked out from `upstream/main`.

Restored upstream-only files we had deleted:
- `src/components/wizard/forms/DocumentUploadInstancesTable.tsx`
- `src/components/wizard/forms/TaskSectionNav.tsx`
- `src/utils/breadcrumbPaths.ts`
- `src/utils/openAccountsTaskContext.ts`
- `tests/breadcrumbPaths.test.ts`

Reverted with the reset (no longer present):
- DELTA 2 — KYC auto-spawn for adult household members
- DELTA 4 — Simplified 4-stage advisor timeline
- DELTA 5a — Save & Return CTA on the last child sub-step
- DELTA 5b — Primary-styled parent-task breadcrumb
- "Additional Instructions" textarea removal on Existing Accounts
- Corestone option removal in `accountFeatureServiceOptions.ts`
- Citizenship init bug fix in `KycChildInfoForm.tsx` (the field doesn't
  exist on upstream at all — there's no bug to fix)

### Wizard — insurance carve-outs (kept)

Only annuity / NetX360 split-path code paths are removed from the upstream
baseline. Specifically:

**Files deleted:**
- `src/components/wizard/forms/AcctChildAnnuityForm.tsx`
- `src/components/wizard/forms/AcctChildNetx360NextStepsForm.tsx`

**Surgical edits to strip annuity refs:**
- `src/components/dashboard/ComposeDialog.tsx` — removed
  `openAnnuityAccount` state + the *"Do you expect to add an annuity to any
  of the accounts?"* required dropdown.
- `src/types/workflow.ts` — removed `openAnnuityAccount` field from
  `JourneyOnboardingConfig`.
- `src/components/wizard/formRegistry.ts` — removed annuity-only form-key
  entries (`open-accounts-with-annuity`, `acct-child-netx360-next-steps`).
- `src/utils/childTaskRegistry.ts` — removed the
  `'netx360-next-steps'` sub-task on account-opening child workflows.
- `src/utils/openAccountsTaskContext.ts` — `OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY`
  is now a sentinel (`'__annuity_path_disabled__'`) and
  `isAnnuityExternalPlatformOpenAccountsTask()` always returns `false`,
  leaving annuity branches as dead code without rewriting every call site.
- `src/components/servicing/OnboardingJourneysTable.tsx` — `openAnnuityAccount: false`
  removed from journey-init dispatch payload.

### Schwab harness — archived

Moved from live `src/` into `archive/schwab-demo/`:

```
archive/schwab-demo/
├── README.md                   ← was docs/stratos-onboarding-flow.md
├── server/index.mjs            ← Node/Express OAuth proxy (was server/)
├── components/
│   ├── AccountOpeningFunding.tsx
│   ├── FlowStepPlaceholder.tsx
│   ├── SchwabConnectivityPanel.tsx
│   ├── TestClientFlowDashboard.tsx
│   └── schwabFormDefaults.ts
├── pages/
│   ├── AccountOpeningFundingPage.tsx
│   ├── FlowStepPlaceholderPage.tsx
│   └── TestClientFlowPage.tsx
├── lib/schwabClient.ts
├── data/testClientFlow.ts
└── env/.env.example
```

**Live code edits to disconnect the harness:**
- `src/App.tsx` — removed three `/onboarding/flow*` routes + their imports.
- `src/components/servicing/OnboardingContent.tsx` — reset to upstream
  (drops the test-client banner that was added on top of the existing tabs).
- `package.json` — removed `server` and `dev:all` scripts; removed deps
  `express`, `dotenv`, devDep `concurrently`.
- `vite.config.ts` — removed the `/api/schwab` proxy target.

**Re-enabling later:** revert the four edits above and copy archive files
back into `src/`. The OAuth proxy and Schwab API integration code are
preserved verbatim under `archive/schwab-demo/`.

### Kept / unchanged

No changes to:
- `src/components/relationships/**` — 6-column Relationships build,
  Create Prospect dialog (ported from production avantos), seed data.
- `src/data/relationshipsSeed.ts`
- `src/pages/RelationshipsPage.tsx`
- `public/stratos-logo.png` and the larger sidebar header that
  accommodates it.
- `src/components/navigation/vertical-nav.tsx` — Stratos logo in the
  expanded + collapsed sidebar header, "Relationships" nav item.
- `src/styles/themes/mercer.css` — `[data-theme="stratos"]` aliased
  to the mercer token set.
- `src/stores/themeStore.tsx` — Stratos brand-theme default.
- `src/components/ui/brand-theme-switcher.tsx` — single-Stratos config.
- `src/App.tsx` — `/relationships` route preserved.

## Verification

1. **Build clean:** `pnpm install && pnpm build` succeeds.
2. **No Schwab harness in `src/`:** `grep -r "TEST_CLIENT\|testClientFlow"
   src/` returns 0 results. (The remaining `Schwab` matches are
   upstream-legitimate references to Charles Schwab as a custodian in
   `FinancialAccountsForm.tsx` and seed data.)
3. **No annuity question in journey-create panel:** open the dashboard,
   click **Create**, pick "Client Onboarding" — the only required action-
   settings question is "Do you plan to open more than one account for
   this client?" — annuity question is absent.
4. **No "+ Annuity" button** anywhere in Open Accounts.
5. **No NetX360 sub-task** under Account & Owners for any account child.
6. **`/onboarding/flow` 404s** (redirects to `/`).
7. **Wizard surfaces match upstream:** advisor sees the 7-stage timeline;
   "Save & Return" CTA is gone; KYC drafts only spawn when advisor adds
   them; Existing Accounts retains the Additional Instructions textarea.
8. **Stratos surfaces preserved:** `/relationships` renders 6 columns
   (Household / Advisor / Type / Status / AUM / Updated At); Stratos logo
   in top-left of every page; "+ New Prospect" dialog opens the two-step
   prospect/business form.
