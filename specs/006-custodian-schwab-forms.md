# Spec 006: Custodian Selection + Schwab Native Forms

## Motivation
Stratos is multi-custody. The Add Accounts side panel previously had no
custodian selector — every account-opening flow assumed the same generic
owner-info form regardless of where the account is being opened. This spec
introduces:

1. A **Custodian** dropdown (SEI, Charles Schwab, Fidelity) replacing the
   prior placeholder "Product" field.
2. A **Category** dropdown (Open a new account / Link an existing account /
   Link an existing 401(k) account) so the workflow can branch on the kind
   of work being done, not just the registration type.
3. The first **custodian-native form experience**: when the custodian is
   Charles Schwab, the wizard's account-opening child task renders a
   field-for-field native UI replica of the appropriate Schwab paperwork
   instead of the generic AcctChild owner form.

The four Schwab forms recreated here are sourced from the production Schwab
form templates: **Schwab One Account Application — Personal (APP13582)**,
**Schwab IRA Account Application (APP10539)**, **Schwab Managed Account
Marketplace Application (APP20284)**, and **Transfer Your Account to Schwab
(APP10864)**.

## Picker dialog changes (`AccountTypePickerDialog`)
- Replaces the synthetic "Product" dropdown with **Custodian** (`SEI`,
  `Charles Schwab`, `Fidelity`) sourced from `src/utils/custodians.ts`.
- Adds **Category** dropdown (currently single-option: "Open a new account";
  "Link existing" categories are future scope).
- Replaces the prior "Registration type" row with **Application type** — the
  user picks which Schwab paperwork to start (Schwab One for Personal
  Accounts / IRA Account / Managed Account Marketplace / Transfer account to
  Schwab). The actual registration (Individual, Joint, Traditional IRA,
  etc.) is captured inside the chosen form, not in the picker.
- `Selection` carries `applicationType`, `custodian`, `category`,
  `officeCode`, `investmentProfessionalId`. `officeCode` is derived from the
  selected advisor's team-member record.
- `spawnOpenAccountChildrenFromSelections` names the child after the
  application's `shortLabel` ("Schwab One Account", "IRA Account",
  "Managed Account", "Account Transfer") and writes `custodian`,
  `accountCategory`, and `applicationType` into the spawned child's
  `taskData` metadata.

## Form routing
- `getSchwabFormKey(applicationType)` returns the application type directly
  — the picker selection IS the form key. No registration-type → form
  mapping is needed.

## Form components
All Schwab forms live under `src/components/wizard/forms/schwab/`:

| File | Source PDF | Sections |
| --- | --- | --- |
| `SchwabOnePersonalForm.tsx` | APP13582 | 12 + IA cover |
| `SchwabIraForm.tsx` | APP10539 | 11 + IA cover (4 beneficiary blocks) |
| `SchwabManagedAccountForm.tsx` | APP20284 | 13 + IA cover + Appendix A (7 manager + 7 funding blocks) |
| `SchwabTransferForm.tsx` | APP10864 | 6 |

Shared primitives:
- `schwabPrimitives.tsx` — `SchwabSection`, `SchwabFieldRow`,
  `SchwabTextField`, `SchwabRadioGroup`, `SchwabCheckboxGroup`,
  `SchwabSelectField`, `SchwabSingleCheckbox`, `SchwabSignatureLine`,
  plus shared option lists (`OCCUPATION_OPTIONS`, `EMPLOYMENT_STATUS_OPTIONS`,
  `SOURCE_OF_FUNDS_OPTIONS`, etc.).
- `SchwabSharedSections.tsx` — `IaCoverSection`, `AccountHolderSection`,
  `TrustedContactSection`, `SourceAndPurposeSection`,
  `IssuerCommunicationsSection`. The Account Holder section is identical
  across One Personal / IRA / Managed Account, so it is parameterized via a
  `prefix` so each holder block (primary, additional) gets its own bag of
  fields without collision.
- `SchwabAccountForm.tsx` — router that reads `custodian`,
  `accountCategory`, `registrationType` from `taskData` and picks one of the
  four forms.

## State + pre-population
- Schwab form state lives under `taskData[childId].schwabForm` (a record),
  isolated from the generic AcctChild profile so the two never collide.
- `useSchwabFormState(childId)` is the hook used by every Schwab form. On
  first mount per child it seeds the field bag from upstream data using
  `buildSchwabPrefill`:
  - Primary account holder ← first selected owner (or primary household
    member if none picked yet); falls back to `taskData['client-info']`.
  - Additional account holder ← second selected owner if applicable.
  - Trusted contact ← first related contact whose role/relationship
    contains "trusted".
  - IA cover ← advisor team-member record (`teamMembers[]`).
- Subsequent edits route through `set(field, value)` which writes a single
  field at a time via `SET_TASK_DATA`, matching the existing
  `useTaskData(taskId).updateFields` pattern.

## Wiring into the wizard
- `AcctChildOwnerInfoForm` early-returns the `SchwabAccountForm` when the
  child's `taskData.custodian === 'schwab'`. SEI / Fidelity continue to fall
  through to the generic form (future spec to build their native experiences).
- No new task / sub-task; the Schwab form occupies the same wizard slot as
  the existing owner-info form. The acct-child sub-tasks (funding, features,
  documents-review) continue to render unchanged for Schwab children.

## Documents-first flow
- The Supporting Documents section was moved to render BEFORE the Account
  Instructions header on the Open Accounts task. The "Add accounts" button is
  disabled until at least one document instance has a filename attached, so
  the operator must capture an identity document before starting any
  application.
- `deriveIdentityFromUploadedDocs(openAccountsTaskData)` scans the doc bag
  for the first uploaded instance and derives a plausible-but-fake `idType /
  idNumber / idCountry / idState / idIssueDate / idExpirationDate` from the
  filename and subType. This is prototype-only; production would parse the
  document via OCR or a KYC vendor.
- `useSchwabFormState` seeds the form's identity fields from the derived
  identity on first mount, so every application opened after a document
  upload starts with ID details pre-populated.

## Signing-ceremony separation
- All signature blocks were removed from the four Schwab forms. The
  underlying data (backup-withholding exception, subscription options,
  successor-custodian data, attachment acknowledgements) is still captured.
  Signatures will be collected later in a single signing ceremony, not
  inline per form.

## Net-worth / liquidity validation
- RelatedPartiesForm gained a **Financial summary** section with Liquid Net
  Worth + Net Worth fields. Stored under `taskData['related-parties']`.
- An inline error fires inside Client Info when Liquid Net Worth > Net Worth.
- A shared `AccountFinancialSection` component renders inside every Schwab
  form. It captures **Approximate Account Value** and **Client's Liquidity
  Need** and fires three inline validation errors when violated:
  1. Approximate Account Value > Liquid Net Worth
  2. Approximate Account Value > Net Worth
  3. Client's Liquidity Need > Approximate Account Value
- Errors are advisory only — they don't block submission yet. Hard gating
  will land with the signing-ceremony spec.

## Out of scope
- SEI and Fidelity native forms (separate specs once Schwab is approved).
- Final-step signing ceremony UX (separate spec).
- Server-side mapping back to Schwab's PDF form codes / XML schemas.
- Real document OCR / KYC vendor integration (prototype uses deterministic
  fake identity derivation).
