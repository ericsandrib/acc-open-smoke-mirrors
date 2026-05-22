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
- [ ] Render every status in two variants: terminal (solid filled, reversed icon) and active (faded tinted, colored icon)
- [ ] Classify each status as terminal vs active and label clearly

### Phase 5: Code review
- [ ] Spawn general-purpose subagent to review the branch diff
- [ ] Address findings or document why they were intentionally left

## Out of scope
- Changes to status enum values themselves
- Restyling other badge surfaces beyond the onboarding servicing tables and the widget
