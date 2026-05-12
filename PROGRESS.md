# Progress

## Spec 001: Account Opening Wizard Workflow

### Phase 1: Project Setup
- [x] Scaffold Vite + React + TypeScript
- [x] Install and configure Tailwind CSS
- [x] Initialize shadcn/ui
- [x] Install React Flow, React Router, dagre
- [x] Configure path aliases (@/)

### Phase 2: Data Layer
- [x] Define TypeScript types (workflow.ts)
- [x] Create seed data with all actions/tasks
- [x] Build workflow store (context + reducer)
- [x] Implement flatTaskOrder computation
- [x] Implement KYC child spawning logic

### Phase 3: Wizard Frontend
- [x] Set up routing (App.tsx, main.tsx)
- [x] Build WizardLayout (3-column grid + sticky footer)
- [x] Build StepSidebar (left — action/task navigation)
- [x] Build TaskContent (center — form router)
- [x] Build DetailSidebar (right — placeholder)
- [x] Build WizardFooter (back/next)
- [x] Create Client Info form
- [x] Create Related Parties form
- [x] Create Financial Accounts form
- [x] Create KYC form (with member list + spawn buttons)
- [x] Create KYC Child form
- [x] Create Placeholder 1 form
- [x] Create Placeholder 2 form

### Phase 4: Workflow Viewer
- [x] Build workflowToFlow transformer
- [x] Create ActionNode custom node
- [x] Create TaskNode custom node
- [x] Create KycChildNode custom node
- [x] Build WorkflowViewer page with React Flow
- [x] Integrate dagre for auto-layout

### Phase 5: Polish
- [x] Navigation between /wizard and /workflow
- [x] Default redirect to /wizard
- [ ] Visual refinement and consistency pass

## Spec 002: Task Data Persistence

### Phase 1: State & Reducer
- [x] Add `taskData` to `WorkflowState` type and `SET_TASK_DATA` to `WorkflowAction` union
- [x] Add `taskData: {}` to initial state
- [x] Implement `SET_TASK_DATA` reducer case with shallow-merge semantics
- [x] Clean up orphaned `taskData` entries in `REMOVE_KYC_CHILD` case

### Phase 2: Hook
- [x] Create `useTaskData(taskId)` hook in workflowStore.tsx

### Phase 3: Form Migration
- [x] Convert ClientInfoForm to controlled inputs (6 fields)
- [x] Convert KycChildForm to controlled inputs keyed by child ID (7 fields)
- [x] Convert Placeholder1Form to controlled inputs (3 fields)
- [x] Convert Placeholder2Form to controlled inputs (3 fields)

### Phase 4: Cross-Task Summary
- [x] Wire Placeholder2Form review summary to display data from client-info and placeholder-1 tasks

## Spec 003: Servicing Route

### Phase 1: Foundation
- [x] Define servicing types (Journey, JourneyAction, JourneyTask)
- [x] Create seed data with 4 journeys across existing relationships
- [x] Build servicing store with context provider
- [x] Add Table and Tabs UI components

### Phase 2: Sidebar & Routing
- [x] Update DashboardSidebar with activeItem prop and Servicing nav item
- [x] Create ServicingPage and ServicingLayout
- [x] Register /servicing route in App.tsx

### Phase 3: Table Views
- [x] Build ServicingContent with tab switcher
- [x] Build JourneysTable with progress column
- [x] Build ActionsTable with tasks-complete column
- [x] Build TasksTable with action/journey context
- [x] Create StatusBadge component with color-coded badges

### Phase 4: Live Journey Integration
- [x] Implement deriveLiveJourney helper to convert wizard state
- [x] Merge live journey with seeded data in ServicingProvider

## Spec 004: Child KYC Tasks

### Phase 1: Foundation
- [x] Create kycChildSubTasks utility (constants, parser, ID generator)
- [x] Update computeFlatTaskOrder to push 3 derived IDs per child
- [x] Update reducer cases (SET_TASK_DATA, SET_TASK_STATUS, CONFIRM_TASK, REOPEN_TASK, REMOVE_KYC_CHILD)

### Phase 2: Form Components
- [x] Create KycChildInfoForm (editable, pre-populated from RelatedParty)
- [x] Create KycChildDocumentsForm (static upload mockup)
- [x] Create KycChildResultsForm (pending placeholder)
- [x] Update formRegistry with 3 new entries and descriptions

### Phase 3: Navigation & Display
- [x] Update TaskContent for sub-task ID resolution and title
- [x] Update WizardFooter for sub-task status resolution
- [x] Update DetailSidebar for sub-task detail display
- [x] Update StepSidebar for sub-task highlight matching
- [x] Update KycForm to navigate to -info suffix

### Phase 4: Servicing View
- [x] Update servicingStore to generate 3 JourneyTask objects per child action

### Phase 5: Cleanup
- [x] Delete old KycChildForm
- [x] Verify build passes

## Spec 005: Port Filter Sidebar from claudNav

### Phase 1: Port Core Filter Components
- [x] Create `src/components/filter/filter-types.ts` with type definitions
- [x] Port `filter-tag.tsx` (pill tag with × button)
- [x] Port `filter-trigger.tsx` (collapsible header with chevron + remove)
- [x] Port `filter-input-row.tsx` (tags container + search input)
- [x] Port `filter-multi-select.tsx` (searchable option list)
- [x] Port `filter-date.tsx` (date preset buttons)
- [x] Port `filter-panel.tsx` (content router for filter types)
- [x] Port `filter.tsx` (main wrapper component)
- [x] Create `index.ts` barrel export
- [x] Map claudNav design tokens to smoke-mirrors theme tokens

### Phase 2: Build Filter Sidebar Container
- [x] Create `filter-sidebar.tsx` with 380px animated sidebar
- [x] Add spring-physics slide animation (AnimatePresence)
- [x] Add header with title and close button
- [x] Add scrollable filter list area
- [x] Add "+" dropdown for adding new filters
- [x] Add clear-all button

### Phase 3: Build Adapter Layer
- [x] Build adapter to bridge `ColumnDef` → claudNav `FilterProps`
- [x] Build adapter for onChange → `ViewFilter[]` sync

### Phase 4: Integration
- [x] Replace `FilterPanel` Sheet in `table-view-wrapper.tsx` with sidebar
- [x] Update layout for sidebar push (not overlay)
- [x] Wire `TableControls` filter button to toggle sidebar
- [x] Verify view presets, dirty tracking, save/reset still work
- [x] Test all three tabs (Journeys, Actions, Tasks)

### Phase 5: Polish & Cleanup
- [x] Remove old `filter-panel.tsx`
- [x] Smooth animation pass
- [x] Keyboard accessibility check
- [x] Verify build passes

## Spec 006: Custodian Selection + Schwab Native Forms

### Phase 1: Picker Dialog
- [x] Add `src/utils/custodians.ts` with `CUSTODIAN_OPTIONS` and `ACCOUNT_CATEGORY_OPTIONS`
- [x] Replace Product dropdown with Custodian dropdown in `AccountTypePickerDialog`
- [x] Add Category dropdown
- [x] Update `Selection` type with `custodian` + `category`
- [x] Thread `custodian` + `accountCategory` through `spawnOpenAccountChildrenFromSelections` metadata

### Phase 2: Schwab Form Infrastructure
- [x] Create shared primitives (`schwabPrimitives.tsx`)
- [x] Create shared sections (`SchwabSharedSections.tsx` — IA cover, Account Holder, Trusted Contact, Source/Purpose, Issuer Communications)
- [x] Create `useSchwabFormState` hook with pre-population seeding
- [x] Create `buildSchwabPrefill` derivation from related parties + client info + advisor
- [x] Create registration-type → Schwab-form-key router

### Phase 3: Four Schwab Forms
- [x] `SchwabOnePersonalForm` (APP13582) — 12 sections
- [x] `SchwabIraForm` (APP10539) — 11 sections + 4 beneficiary blocks
- [x] `SchwabManagedAccountForm` (APP20284) — 13 sections + 7 manager blocks + Appendix A
- [x] `SchwabTransferForm` (APP10864) — 6 sections

### Phase 4: Wiring
- [x] `SchwabAccountForm` router component
- [x] `AcctChildOwnerInfoForm` short-circuits to `SchwabAccountForm` when `custodian === 'schwab'`
- [x] TypeScript build clean
- [x] Lint clean for Schwab files (warnings only)

### Phase 5: Picker simplification (2026-05-12 follow-up)
- [x] Compose dialog: action type dropdown reduced to "Client Onboarding" only
- [x] Compose dialog: "Do you expect to add an annuity…" field removed
- [x] OpenAccountsVariantSwitcher (floating demo widget) removed from App / Dashboard / Onboarding pages
- [x] AccountTypePickerDialog: Category reduced to "Open a new account" only
- [x] AccountTypePickerDialog: Registration type → Application type with 4 Schwab options (Schwab One Personal / IRA Account / Managed Account Marketplace / Transfer)
- [x] Spawned child name now derived from application type shortLabel
- [x] getSchwabFormKey simplified — application type IS the form key

### Phase 8: Documents-first cleanup + Supervision Review (2026-05-12 follow-up)
- [x] Removed duplicate "Documents" sub-task from account-opening child config — documents now live only at the parent Open Accounts step
- [x] Renamed OpenAccountsForm section headers: Supporting Documents → "1. Gather documents"; Account instructions → "2. Account forms"; KYC Verification → "3. KYC and Supervision"; Envelopes badge bumped to "4"
- [x] Added "Aggressive Growth" to INVESTMENT_OBJECTIVES so owner suitability profiles can be tagged
- [x] New `src/utils/supervisionRules.ts` with `evaluateSupervisionRules(accountChildId, state, kycVerified)` returning `{ status, triggered[] }`. 6 active rules:
  1. Owner age ≥70 with Aggressive Growth objective
  2. Owner Retired / Not Employed with Aggressive Growth objective
  3. Risk tolerance × Investment Objective mismatch (Conservative × Growth/Aggressive/Speculation; Aggressive × Capital Preservation)
  4. Source of Funds = Rollover
  5. Margin requested (account feature OR Schwab One "with Margin" radio)
  6. Options requested (level included in detail when present)
- [x] New "Supervision Review" sub-section inside "3. KYC and Supervision" — lists each account-opening child with its supervision status badge (Not started / In review / Passed / Returned / Pending approval) and the list of triggered rules
- [x] Gating logic: KYC review can complete normally; when any rule fires AND KYC is verified, supervision = "Pending approval" (manual sign-off); when no rules fire AND KYC is verified, supervision = "Passed"
- [x] Deferred per Owner's instruction: advisor email rule, Stratos Registered Employee (OBA) rule, Advisory fee threshold rule, Options activity level — Owner still discovering these fields

### Phase 7: Owner-picker unification + dropdown source-of-funds (2026-05-12 follow-up)
- [x] AcctChildOwnerInfoForm: removed Schwab early-return; now renders Owners & Participants for every custodian
- [x] Schwab flow renders Owners section → SchwabAccountForm; Beneficiaries / Account Information / Investment Elections sections are hidden for Schwab (their data lives in the native Schwab paperwork)
- [x] Schwab owner-slot count derived from applicationType (1 for IRA, 2 for Schwab One / Managed, 3 for Transfer) — no longer falls back to the entity multi-owner cap
- [x] useSchwabFormState reads selectedOwnerPartyIds from `taskData['<childId>-account-owners'].owners`; primary/additional Holder fields auto-fill from selected owners and re-sync when the operator changes them
- [x] AccountFinancialSection rewired to read each selected owner's `accountOwnerIndividual.liquidNetWorthRange` / `.netWorthRange`; ranges parse to numeric midpoints via new `src/utils/netWorthRange.ts`; multiple owners sum their midpoints
- [x] AccountFinancialSection surfaces "missing range on Owner X" hint plus combined estimate readout
- [x] Right-rail nav (WizardLayout) filters `acct-info` / `acct-features` anchors for Schwab so dead links are gone
- [x] Standalone Financial summary section removed from RelatedPartiesForm; ClientInfoForm reverted to its original simple state
- [x] Source of funds / wealth field converted from textarea to dropdown (Salary / Savings / Proceeds from sale of home / Rollover) in AccountOwnerIndividualFormFields

### Phase 6: Documents-first flow + signing-ceremony separation + net-worth validation (2026-05-12 follow-up)
- [x] Open Accounts page: Supporting Documents section moved BEFORE Account Instructions
- [x] Add accounts button disabled until at least one supporting document is uploaded; hint text shown
- [x] Schwab forms: removed all signature blocks (collected later in signing ceremony) — Schwab One Section 11, IRA Section 11, Managed Sections 11/12/13 sigs, Transfer Section 6 sigs, Appendix A sigs all dropped
- [x] Schwab forms: kept the non-signature acknowledgement / data fields from those sections so application data is still captured
- [x] Client Info (RelatedPartiesForm): added Financial Summary section with Liquid Net Worth + Net Worth fields, validates Liquid > Net error
- [x] New shared AccountFinancialSection component: Approximate Account Value + Client's Liquidity Need fields with three validations (vs Liquid Net Worth, vs Net Worth, vs Liquidity Need)
- [x] AccountFinancialSection inserted into all 4 Schwab forms (One §6a, IRA §11, Managed §4a, Transfer §7)
- [x] schwabPrePopulation: new deriveIdentityFromUploadedDocs() generates fake-but-plausible ID type, number, country, state, issue/expiration date from filename + subType
- [x] useSchwabFormState wired to seed idType/idNumber/idCountry/idState/idIssueDate/idExpirationDate from the document identity
