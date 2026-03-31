# Spec 004: Child KYC Tasks

## Overview

Restructure each child KYC action from a single form into three distinct tasks: Client Info, Documents, and KYC Results. This gives each KYC review a proper multi-step workflow instead of cramming everything into one screen.

## Motivation

The previous single-form approach for child KYC (ID fields, risk rating, PEP, sanctions) didn't match the real-world compliance workflow, where identity verification involves reviewing personal info, collecting documents, and awaiting results from a separate review process. Splitting into three tasks makes the demo more realistic and sets up the KYC Results task as a placeholder for async compliance results.

## Design: Derived Sub-Task IDs

Rather than adding a `tasks` array to `KycChild` (which would create 3-level nesting in every reducer), we use a **derived ID convention**. A child with `id: 'kyc-child-123'` produces three entries in `flatTaskOrder`:

- `kyc-child-123-info`
- `kyc-child-123-documents`
- `kyc-child-123-results`

A shared utility (`src/utils/kycChildSubTasks.ts`) provides:
- `KYC_CHILD_SUB_TASKS` — constant array of `{ suffix, title, formKey }`
- `parseChildSubTaskId(id)` — extracts `{ childId, suffix }` from a derived ID
- `getChildSubTaskIds(childId)` — returns the 3 derived IDs for a child

## Tasks

### 1. Client Info (`kyc-child-info`)

Editable form pre-populated from the `RelatedParty` matching the child's name. Fields: first name, last name, date of birth, relationship, email, phone.

### 2. Documents (`kyc-child-documents`)

Static mockup with two dashed-border upload areas:
- **Government-Issued ID** — passport, driver's license, or national ID
- **Supporting Documents** — proof of address, utility bills, etc.

No actual file handling (purely visual for the demo).

### 3. KYC Results (`kyc-child-results`)

Placeholder showing "KYC Results Pending" with a message that results arrive asynchronously from the compliance team. No interactive elements.

## Files Changed

### New
- `src/utils/kycChildSubTasks.ts`
- `src/components/wizard/forms/KycChildInfoForm.tsx`
- `src/components/wizard/forms/KycChildDocumentsForm.tsx`
- `src/components/wizard/forms/KycChildResultsForm.tsx`

### Modified
- `src/stores/workflowStore.tsx` — `computeFlatTaskOrder` pushes 3 IDs per child; reducer cases resolve sub-task IDs
- `src/components/wizard/formRegistry.ts` — 3 new form entries replacing `kyc-child`
- `src/components/wizard/TaskContent.tsx` — sub-task ID resolution for title and form
- `src/components/wizard/WizardFooter.tsx` — sub-task status resolution
- `src/components/wizard/DetailSidebar.tsx` — sub-task detail display
- `src/components/wizard/StepSidebar.tsx` — sub-task highlight matching
- `src/components/wizard/forms/KycForm.tsx` — navigate to `-info` suffix
- `src/stores/servicingStore.tsx` — 3 `JourneyTask` objects per child action

### Deleted
- `src/components/wizard/forms/KycChildForm.tsx`
