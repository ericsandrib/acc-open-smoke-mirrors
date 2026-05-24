# 006: Semantic Status Colors + Component Sandbox

## Goal

Bring all status badges and the Application Status widget under one semantic color palette, and add a developer-facing `/test` sandbox to inspect component states in isolation.

## Semantic palette

| Bucket | Color | Tailwind tone |
| --- | --- | --- |
| success | green | green-50 / green-200 / green-700 |
| warning | yellow | amber-50 / amber-200 / amber-800 |
| danger | red | red-50 / red-200 / red-700 |
| neutral | grey | gray-50 / gray-200 / gray-700 |
| default | black | foreground |

## Status → color mapping

| Status | Color | Notes |
| --- | --- | --- |
| `complete` | success | only true-success state |
| `nigo`, `nigo_document`, `nigo_principal`, `clarification_required` | warning | reviewer returned to advisor — advisor action needed |
| `escalation_hold` | warning | held for compliance — needs attention |
| `blocked` (Task) | danger | workflow halted |
| `rejected` (Task) | danger | explicit failure |
| `rejected_aml` | danger | AML rejection |
| `not_started`, `draft`, `in_progress`, `awaiting_review` | neutral | in-flight or pre-flight |
| `awaiting_client_signature`, `awaiting_documents` | neutral | waiting on external party, lower stakes |
| `aml_review`, `document_review`, `ho_kyc_review`, `principal_review` | neutral | in-flight review pipeline |
| `canceled`, `cancelled` | neutral | intentional, terminal-neutral (label changes from "Declined" to "Canceled") |

## Application Status widget — stage label → color

The widget renders user-visible *stage labels* (from `getActiveStageLabel`), not raw status keys, and uses a slightly different mapping than the badge palette: stages that are actively advancing through the pipeline read as `success` (green) so a healthy in-flight account "looks alive." Only Draft (pre-flight) and Canceled (terminal-intentional) stay neutral. Treatment (terminal filled vs. active tinted) layers on top of the bucket — it's a property of the stage, not an axis you can override.

| Stage label | Bucket | Treatment | Notes |
| --- | --- | --- | --- |
| `Pending Release`, `Complete` | success | terminal | workflow concluded positively |
| `ID Verification`, `Client Signature`, `Submitted`, `Awaiting Review`, `AML Review`, `Document Review`, `Principal Review` | success | active | on-track motion through the pipeline |
| `Clarification / Document Required`, `Escalation / Hold` | warning | active | human follow-up needed |
| `Rejected` | danger | terminal | explicit failure |
| `Draft` | neutral | active | pre-flight, no progress yet to report |
| `Canceled` | neutral | terminal | intentionally stopped, outside the progress arc |

## Phases

### Phase 1: Semantic mapping
- [ ] Add shared semantic palette module
- [ ] Refactor `operationalStatusPill.tsx` to read from semantic palette
- [ ] Refactor `childStatusConfig` in `childStatusDisplay.ts` to read from semantic palette
- [ ] Rename `canceled` label from "Declined" to "Canceled" with neutral color
- [ ] Update icons to inherit `currentColor` so they match the badge color

### Phase 2: `/test` sandbox scaffold
- [ ] Add `/test` route with persistent left sidebar
- [ ] Data-driven sidebar entries
- [ ] Stub `/test/application-widget` entry (filled in Phase 4)
- [ ] Keep chrome minimal — dev-only surface

### Phase 3: Application Status widget icon
- [ ] Recolor icon inside `Application Status` card in `ChildActionSidebar` to semantic color of current stage

### Phase 4: Populate `/test/application-widget`
- [ ] Extract widget into a reusable component
- [ ] Classify each status as terminal vs active. Terminal stages render filled / reversed; active stages render tinted / colored. Treatment is a property of the status, not an axis — there is no "active rendering" of a terminal status, and vice versa.
- [ ] Render every status in its natural treatment, labeled with stage + bucket + treatment.

### Phase 5: Code review
- [ ] Spawn general-purpose subagent to review the branch diff
- [ ] Address findings or document why they were intentionally left

## Out of scope
- Changes to status enum values themselves
- Restyling other badge surfaces beyond the onboarding servicing tables and the widget
