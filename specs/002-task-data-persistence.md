# Spec 002: Task Data Persistence

## Overview
Add a general-purpose persistence layer so that form data entered in any wizard task survives navigation and can be read by subsequent tasks. A cross-task summary in the final review step demonstrates data flowing between tasks.

## Problem
Most wizard forms (Client Info, KYC Child, Account Opening placeholders) use uncontrolled inputs. Data typed into them is lost when the user navigates away. Only Related Parties and Financial Accounts persist because they have dedicated state slices with CRUD actions.

## Design

### State Shape
Add a new `taskData` slice to `WorkflowState`:

```typescript
taskData: Record<string, Record<string, unknown>>
```

- **Outer key**: task ID (e.g., `"client-info"`, `"kyc-child-1711234567890"`)
- **Inner record**: field name → value (e.g., `{ firstName: "John", lastName: "Smith" }`)

### Reducer Action
One new action with shallow-merge semantics:

```typescript
{ type: 'SET_TASK_DATA'; taskId: string; fields: Record<string, unknown> }
```

The reducer merges `fields` into the existing `taskData[taskId]` entry. When `REMOVE_KYC_CHILD` fires, the orphaned `taskData` entry for that child is also deleted.

### Hook
A `useTaskData(taskId)` hook co-located in `workflowStore.tsx`:

```typescript
useTaskData(taskId) → { data, updateField, updateFields }
```

- `data` — the current `taskData[taskId]` (or `{}`)
- `updateField(field, value)` — dispatches `SET_TASK_DATA` for a single field
- `updateFields(fields)` — dispatches `SET_TASK_DATA` for multiple fields at once

### Form Migration
Convert these forms from uncontrolled to controlled inputs using `useTaskData`:

| Form | Task ID | Fields |
|------|---------|--------|
| ClientInfoForm | `client-info` | firstName, lastName, email, phone, dob, clientType |
| KycChildForm | `{activeTaskId}` | idType, idNumber, issueDate, expiryDate, riskRating, pepCheck, sanctionsCheck |
| Placeholder1Form | `placeholder-1` | branchCode, rmCode, onlineBanking |
| Placeholder2Form | `placeholder-2` | termsAccepted, regulatoryAccepted, dataConsent |

### Cross-Task Summary
`Placeholder2Form` (final review step) reads `state.taskData['client-info']` and `state.taskData['placeholder-1']` to display a summary of previously entered data in the review summary box (client name, branch selection, etc.).

### Existing Slices Unchanged
`relatedParties` and `financialAccounts` keep their dedicated CRUD slices — they manage arrays of records with add/update/remove operations that don't fit a simple key-value model.

## Out of Scope
- Form validation
- localStorage / session persistence across page refresh
- Debouncing of state updates
- Form library integration (react-hook-form, formik, etc.)

## Files to Modify
- `src/types/workflow.ts` — add `taskData` to `WorkflowState`, `SET_TASK_DATA` to `WorkflowAction`
- `src/stores/workflowStore.tsx` — initial state, reducer case, `useTaskData` hook, `REMOVE_KYC_CHILD` cleanup
- `src/components/wizard/forms/ClientInfoForm.tsx` — controlled inputs
- `src/components/wizard/forms/KycChildForm.tsx` — controlled inputs keyed by child ID
- `src/components/wizard/forms/PlaceholderForm.tsx` — controlled inputs + cross-task summary
