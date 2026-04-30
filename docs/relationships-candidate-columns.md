# Relationships — candidate columns (not currently in the app)

The table at `/relationships` ships with 6 columns post the 2026-04-28 working
session with Chris Radzinski & Wes Hawkins.

This doc is your reference list of columns **considered and deferred** for MVP —
what they'd need to light up, and what they'd look like.

---

## Currently shipped (MVP — post 4/28 session)

| # | Column | Source | Stratos dict | Notes |
|---|---|---|---|---|
| 1 | Household | `client_organisations.name` (Avantos) | S142 | Renamed from "Relationship" per Chris |
| 2 | Advisor | `agents.*` via `agent_client_org_relationships` (Avantos) | S195 IAR Name | Cross-walked with SF ownership + Orion rep |
| 3 | Type | `client_organisations.client_organisation_type` (Avantos) | S244 Contact Type | Prospective / New / Existing |
| 4 | Status | `client_organisations.relationship_status` (**Avantos**) | — | Onboarding state + relationship record |
| 5 | AUM | `sum(position_valuations.valuation_amount)` per household (**Orion** rollup, existing only) | S141/S142 | Prospects don't roll up in MVP |
| 6 | Updated At | `client_organisations.updated_at` (**Avantos**) | — | Likely default sort |

### Removed in 4/28 session

- **Firm** — custodian rejected as replacement; multi-custodian per household made it untenable
- **Zip Code** — not relevant on the overview

---

## Candidate columns considered — reasons they're deferred

### 🟡 Deferred: data exists, but requires aggregation or derivation

| Column | Would come from | What's needed |
|---|---|---|
| **Primary Client Name** | `clients.first_name + last_name` via `is_primary=true` | Join through `client_client_organisation_relationships` — one extra join. Useful when household name is the entity (e.g. "Smith Family Trust") but advisor wants a human name. |
| **Secondary Client** | `clients.*` via `is_primary=false` | Same join, different filter. |
| **Account Count** | `count(financial_accounts WHERE client_organisation_id = ...)` | Aggregation. Often more informative than AUM for prospects. |
| **Policy Count** | `count(policies WHERE client_organisation_external_id = ...)` | Insurance-side — parallel to account count. |
| **State** | `address_entity_relationships.state` | Available; deferred only because Zip is more granular for territory mgmt. |
| **Contract #** | `client_contracts.contract_number` | Exists per contract; relationship can have many. Requires "primary contract" rule. |
| **Opened Date** | `financial_accounts.opened_date` (oldest per household) | Min aggregation. "Client since" analog. |

### 🟠 Deferred: line-of-business specific (insurance vs. wealth)

| Column | Source | Why deferred |
|---|---|---|
| **Premium (Life)** | `sum(policies.premium_amount WHERE line_of_business = 'LIFE')` | Only meaningful for insurance households; empty for 80%+ of rows in a pure-wealth book. Better as a filtered view or second tab. |
| **Premium (Disability)** | `sum(policies.premium_amount WHERE line_of_business = 'DI')` | Same. |
| **Face Amount** | `sum(policies.face_amount)` | Insurance-only. |
| **Policy Status** | `policies.status` | Many policies per relationship — needs rollup rule (any active? all lapsed?). |
| **Carrier** | `policies.carrier` | Multi-carrier households need multi-value display. |
| **Product** | `financial_products.product_type` + `policies.line_of_business` | No unified "product" field; would need a synthesized taxonomy per relationship. |

### 🔴 Deferred: not in Avantos ingest today — requires new source

| Column | Would come from | Status |
|---|---|---|
| **Last Meeting** | CRM / Salesforce Activity object | Not in Guardian ingest pipeline. Would require SF Activity feed. |
| **Next Meeting** | CRM / Salesforce Task / Event object | Same. |
| **Last Contact** | CRM touchpoint log | Same. |
| **Notes / Summary** | S246 Contact Notes (Rich Text) — SF-CT only | Would need SF-CT → Avantos mapping that isn't built. |
| **Household Target AUM** | Internal planning field | Typically advisor-entered; no source of truth today. |
| **Pipeline Stage (detailed)** | CRM opportunity stage | Relationship `status` is the coarse version; CRM has the full funnel. |
| **Referral Source** | CRM custom field | Advisor-captured; no ingest path yet. |

---

## Columns we WON'T consider — reasoning preserved

| Column | Why not |
|---|---|
| Client DOB | PII; not a list-view field |
| SSN / Tax ID | PII; never on a list |
| Phone / Email | Sensitive + redundant with detail pages |
| Investment Objective | Per-account, not per-relationship |
| Risk Factor | Per-account |

---

## When to add a column

Decision rule for MVP-to-V1:

1. **Is it in the Avantos ingest today?** (or trivially derivable from tables already there) → 🟢 low-lift, can add
2. **Is it in the Stratos dictionary?** → advisor has indicated they care
3. **Does every row get a value, or is it sparse?** → sparse columns belong in a filtered view, not the main table

If 3 ≤ yeses, add it. If < 3, don't waste the horizontal real estate on the default view.
