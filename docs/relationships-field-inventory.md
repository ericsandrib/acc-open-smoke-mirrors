# Relationships page — off-the-shelf field inventory

Source intelligence we have on hand for what could populate the Relationships
list view, ranked by how cheaply each field can be lit up.

**Sources cross-referenced**
1. **Avantos canonical model** — extracted from
   `Derived data model_Avantos_G/data-lineage_guardian-staging_guardian_20260409_183509.xlsx`
   (Guardian → Avantos ingest, 26 target tables, ~3,650 mapping rows)
2. **Guardian PDFs** — `Guardian on the Avantos data model (draft).pdf`,
   `Guardian Ingestion Current State.pdf`, `Guardian ↔ Avantos Producer & Agency
   Data Mapping`. These document **how a third-party feed has already been
   mapped** onto the Avantos schema — i.e. proof that the schema can ingest a
   real production source.
3. **Stratos Data Dictionary** — `Stratos_Data_Dictionary_v1 (2).xlsx` (266
   fields across 13 buckets, ~143 sourced from Schwab forms).

---

## Tier 1 — shipped on `/relationships` (post 2026-04-28 session)

Six columns post the working session with Chris Radzinski & Wes Hawkins.
Each has a real source path; sources clarified during the session are noted.

| Column | Source | Stratos | Notes |
|---|---|---|---|
| Household | `client_organisations.name` (Avantos) | S142 Household Name | Renamed from "Relationship" per Chris: *"If it's household level, I would just call it household."* |
| Advisor | `agents.*` via `agent_client_org_relationships` (Avantos) — cross-walked with Salesforce ownership + Orion rep mapping | S195 IAR Name | Cross-system identity is open; SSN at the account level is current backstop |
| Type | `client_organisations.client_organisation_type` (Avantos) | S244 Contact Type | Prospective / New / Existing |
| Status | `client_organisations.relationship_status` (**Avantos** — not Salesforce/Orion) | — | Onboarding state + relationship record |
| AUM | `sum(position_valuations.valuation_amount)` per household (**Orion** rollup, existing clients only) | S141/S142 | Prospects do not roll up AUM in MVP |
| Updated At | `client_organisations.updated_at` (**Avantos** — not Salesforce) | — | Default sort candidate (advisor council to confirm) |

### Removed in 4/28 session

| Column | Reason |
|---|---|
| Firm | Custodian was floated as a replacement; rejected due to multi-custodian per household. Dropped from the overview. |
| Zip Code | Not relevant on the relationships overview. |

The previous 8-column shape is preserved in git history; nothing was lost,
just trimmed.

---

## Tier 2 — derivable from current ingest, no new source needed

Available in Avantos today; the only work is the join/aggregate.

| Candidate column | Avantos source | Stratos | Effort |
|---|---|---|---|
| Primary Client Name | `clients` via `is_primary=true` join | S001-S003 | XS |
| Secondary Client | `clients` via `is_primary=false` | S023-S025 | XS |
| Client Count | `count(clients)` per household | — | XS |
| Account Count | `count(financial_accounts)` per household | — | XS |
| Policy Count | `count(policies)` per household | — | XS |
| State | `address_entity_relationships.state` | S041 | XS |
| City | `address_entity_relationships.city` | S040 | XS |
| Country | `address_entity_relationships.country` | S043 | XS |
| Email (primary) | `client_contact_details.value WHERE type='email' AND role='primary'` | S016 | S |
| Phone (primary) | `client_contact_details.value WHERE type='phone'` | S018-S020 | S |
| Contract # | `client_contracts.contract_number` | — | S |
| Contract Type | `client_contracts.contract_type` | — | S |
| Office | `client_contracts.office_id` | — | S |
| Agency | `agent_organisations.name` via contract | S093 | S |
| Source System | `client_contracts.source_system` (e.g. "guardian", "salesforce") | — | XS |
| Opened Date | `min(financial_accounts.opened_date)` per household | — | S |
| Last Account Opened | `max(financial_accounts.opened_date)` | — | S |
| Currency | `financial_accounts.currency_code` (most common) | — | S |
| Tax ID Type | `clients.ssn` shape vs `clients.org_external_id` (entity vs individual) | S009 | S |
| Birth Date | `clients.birth_date` (primary client) | S007 | XS |
| Gender | `clients.gender` (primary client) | — | XS |
| Suffix | `clients.suffix` | S004 | XS |
| Middle Name | `clients.middle_name` | S002 | XS |
| Created At | `client_organisations.created_at` | — | XS |

---

## Tier 3 — line-of-business specific (insurance side)

Useful for an insurance-heavy book; mostly empty in pure-wealth households.
Belong on a **filtered view** rather than the default table.

| Candidate column | Source | Notes |
|---|---|---|
| Premium (Life) | `sum(policies.premium_amount WHERE line_of_business='LIFE')` | S093 adjacent |
| Premium (Disability) | `sum(policies.premium_amount WHERE line_of_business='DI')` | |
| Premium (Annuity) | `sum(policies.premium_amount WHERE line_of_business='ANN')` | |
| Total Premium | `sum(policies.premium_amount)` | The "Annualized Premium" headers in the dashboard image map here |
| Face Amount | `sum(policies.face_amount)` | |
| Policy Count | `count(policies)` | duplicate of Tier 2 — flag once |
| Active Policy Count | `count(policies WHERE status='active')` | |
| Carriers (list) | `distinct(policies.carrier)` | |
| Latest Policy Date | `max(policies.issue_date)` | |
| LOB Mix | `distinct(policies.line_of_business)` | E.g. "Life · DI · Annuity" |
| Surrender Charge | `sum(position_valuations.attributes.POL_DLY_SURR_CHRG_AM)` | Insurance-only |
| Death Benefit | `sum(position_valuations.attributes.POL_DLY_TOT_DTH_BEN_AM)` | Insurance-only |
| Loan Interest Paid | `sum(position_valuations.attributes.POL_LOAN_INT_PD_TO_DT_AM)` | Insurance-only |

---

## Tier 4 — wealth-side specific

Useful for a wealth-heavy book.

| Candidate column | Source | Notes |
|---|---|---|
| Investment Objective | `financial_accounts.additional_attributes.Investment_Objective` | S080 |
| Risk Factor | `financial_accounts.additional_attributes.Risk_Factor` | S079 |
| Time Horizon | `financial_accounts.additional_attributes.Time_Horizon` | S081 |
| Liquidity Needs | `financial_accounts.additional_attributes.Liquidity_Needs` | S087 |
| Registration Mix | `distinct(financial_accounts.additional_attributes.Registration_Type)` | S132 |
| Account Type Mix | `distinct(financial_accounts.additional_attributes.Account_Type)` | S133 |
| Are Other Investments | `clients.additional_attributes.Are_Other_Investments` | — |
| Net Worth Range | `clients.additional_attributes.Net_Worth_Range` (if present in feed) | S068 |
| Income Range | `clients.additional_attributes.Annual_Income_Range` | S067 |

---

## Tier 5 — blocked: source not in Avantos ingest yet

Would require a new feed or new mapping work before they could populate.

| Candidate column | What's missing |
|---|---|
| Last Meeting | No Salesforce Activity / CRM touchpoint feed in the Guardian-shaped ingest |
| Next Meeting | Same — needs CRM Task/Event |
| Last Contact | Needs CRM activity feed |
| Notes / Summary | Stratos S246 (rich text from SF-CT) — no SF ingest path mapped today |
| Pipeline Stage (detailed) | CRM opportunity stage; not in canonical model |
| Referral Source | CRM custom field |
| Targeted AUM | No source of truth — typically advisor-entered planning value |
| Marketing Tags | Not in canonical model |
| Birthday This Month flag | Derivable from `clients.birth_date` but UI-only logic |

---

## Tier 6 — won't render on a list view (privacy / per-row noise)

These exist in the data but should never appear on the default list.

| Field | Why excluded |
|---|---|
| `clients.ssn` / `Client_TaxID` | PII |
| `clients.birth_date` (full) | PII; mask as "born YYYY" if needed |
| Policy SSN / `INSRD_TAX_ID` | PII |
| Phone numbers (raw) | PII for a list — show only on detail page |
| Email (raw) | Same |
| Address line 1-5 (full) | PII; Zip+State is the right list-view granularity |

---

## Guardian-specific signals (not generic)

The Guardian feed surfaces these via `extra_properties` on `client_organisations`
and `clients`. They're real fields but **Guardian-named** — they shouldn't drive
column labels in a Stratos demo, but they prove the canonical model can absorb a
production insurance feed:

- `LOB` — line of business
- `POL_DT`, `POL_ANNIV_DT`, `POL_ISS_ST_CD`, `POL_STATUS_DE`
- `INSRD_*` — insured party fields
- `OWNR_*` — policy owner fields
- `AGT_WRITING_CODE`, `PRI_AGCY_CD`, `SEC_AGCY_CD`
- `LIST_BILL_NR`, `MODAL_PREM_AM`, `SCHED_EPUA_PREM_AM`
- `Run_Date`, `RECORD_TRANSACTION_TYPE` — ingest plumbing

These map onto the canonical schema's `policies.*` fields; they're the "before"
state in the lineage doc.

---

## Recommendation for the next iteration of `/relationships`

If we want to grow past 8 columns without bloating the default view:

1. **Add 4 Tier-2 columns** to the default table:
   - Account Count, Policy Count, City + State (replace Zip), Source System
2. **Add a "Wealth view" toggle** that swaps in Tier 4 columns:
   - Risk Factor, Investment Objective, Time Horizon
3. **Add an "Insurance view" toggle** that swaps in Tier 3 columns:
   - Premium (Life), Premium (Disability), Face Amount, Carriers
4. **Detail page** (`/relationships/:id`) gets everything in Tier 2 + 4 + 5 +
   the safe slice of Tier 6 (masked).

Total fields available off-the-shelf for Relationships:
- **Tier 1 (shipped):** 8
- **Tier 2 (derivable):** 24
- **Tier 3 (insurance):** 13
- **Tier 4 (wealth):** 9
- **Total ready-to-light:** ~54
- **Blocked (Tier 5):** 9 (need CRM feed)
