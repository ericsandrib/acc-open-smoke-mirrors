# 007: Synthesized KYC Status + Verification Details

## Goal

Collapse the three competing peer statuses (KYC / AML / CIP) on the verification surface into a single primary KYC disposition, and move AML + CIP into supporting detail inside a side sheet.

## Primary KYC status

| Status | Label | Tone | Rule |
| --- | --- | --- | --- |
| `pass` | Pass | success (green) | AML cleared AND HO KYC approved |
| `fail` | Fail | danger (red) | AML flagged/escalated OR CIP overallStatus = fail |
| `pending_review` | Pending Review | neutral (grey) | KYC has run but isn't in pass/fail (AML pending, info_requested, HO pending, changes_requested) |
| `unverified` | Unverified | neutral (grey) | KYC never run OR required fields missing |
| `expired` | Expired | warning (amber) | Future hook — no current producer |

Tones resolve through the spec 006 semantic palette (success → green, danger → red, neutral → grey, warning → amber, default → black).

## Where each surface renders the synthesized status

| Surface | Behavior |
| --- | --- |
| Account & Owners owner card (advisor) | Single KYC chip + missing-field hint. No AML / CIP detail. |
| AML Screening & Review subject row | Single KYC chip (same component) |
| CIP Verification & Review subject row | Single KYC chip (same component) |
| Side sheet (opened from a row) | Full breakdown: KYC / AML / CIP / Failure / Metadata / Documents / History |
| Application Status card | Unchanged — drives workflow phase, not KYC status |

## Side-sheet sections (in order)

1. **KYC Status** — large headline + tone
2. **AML Status** — current state, decided-at, approval reason / findings / info-request comments
3. **CIP Status** — ID / Address / DOB verification, mismatches
4. **Failure Reason** — rendered only when KYC = fail
5. **Verification Metadata** — Provider · Last Run · Run Type · Trigger Source · Last Re-run By · Re-run Reason
6. **Linked Supporting Documents** — navigates to Documents subtask
7. **Verification History** — existing snapshot list

## Operational language

Prefer "Pass" / "Fail" / "Pending Review" / "Unverified" / "Additional Documents Required" / "Address Verification Required". Drop provider-y phrasing ("Identity verification failed", LexisNexis-specific terminology) from row-level surfaces.

## Phases

- **P1: Foundation** — `KycStatus` type + `getKycStatus` / `getKycStatusBadge` resolvers
- **P2: Subject row + Account & Owners** — replace 3-chip with single chip; drop `focus` param
- **P3: Side-sheet** — `VerificationDetailsPanel`; consolidate AML / CIP detail bodies
- **P4: Language sweep + cleanup** — remove now-redundant helpers and provider-y labels

## Out of scope

- Workflow phase transitions (handled by status card)
- Disposition actions / dialogs
- AML / CIP reducer logic
- Snapshot data model
