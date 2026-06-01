# Spec 007: Zions POC Instance

> **Branch:** `zions-poc` · **Status:** In Progress · **Owner:** Eric Sandrib
> **Locked to:** Zions + Avantos POC Outline (§I–VI) and the Zions "Unified Wealth Intelligence" RFI (§2.1–2.11).
> Companion vision doc (internal, not in-repo): `Documents/Stratos data/Zions POC/Avantos_Zions_Platform_Vision_PRD.md`.

## Context

Zions Wealth & Corporate Trust (Zions Bancorporation, N.A.) is evaluating Avantos via the "Unified Wealth Intelligence" RFI. This spec builds a **Zions-branded instance** of this prototype that demonstrates the three POC workflows + the AI surfaces on representative dummy data. It is "smoke and mirrors" per [docs/product-context.md](../docs/product-context.md): no backend, no real LLM, all data seeded in-memory, all interactions simulated.

The instance is a **branch** (`zions-poc`), not a runtime brand toggle, because Zions needs its own seed data, its own cross-silo identity model, and POC-specific surfaces — beyond the visual reskin the `data-theme` switch provides.

### The Zions story this instance must tell (from the Architect Brief)
- Zions is a holding company over **7 affiliate banks** (Zions Bank, California Bank & Trust, Amegy, NBAZ, Nevada State, Vectra, Commerce WA/OR); centralized tech/ops via ZMSC.
- **Fi-Tek (GWES)** runs **both** Wealth (~$7B / ~2K HNW accts, in-house custody) **and** Corporate Trust (30K+ "deal" accts). LPL holds ~$3B / ~8K accts. Planning on eMoney. Bond accounting on Transtar.
- **The same legal entity** (person / LLC / trust / municipality) appears in **2–4 silos under different IDs**.
- **Headline demo:** a cross-silo **identity graph** — one legal entity → one node — and the **corporate-trust → wealth bridge** (officers/owners/boards behind a muni issuer surfaced as prospects). Incumbent to beat = Wealth Access (dashboards). Our edge = aggregate *identity* + run the *work*.

## Goals
1. A Zions-branded advisor desktop that hits the POC's three workflows + AI surfaces.
2. A cross-silo **identity graph** that visibly unifies a legal entity across Fi-Tek / LPL / Transtar / eMoney / bank-core IDs and across the 7 affiliates.
3. Cross-org **opportunity surfacing**: corporate-trust → wealth bridge and bank → wealth promotion.
4. Onboarding/account-opening + servicing "meeting-to-action" (distribution/ACH) flows re-seeded for Zions, with simulated Fi-Tek/GWES + Salesforce + eSignature integrations.
5. Everything traceable to the POC outline + RFI (coverage map below).

## Non-goals
- Production-grade integrations (per POC outline §I — "not production-grade").
- A real LLM / live AI backend (smoke & mirrors — scripted/mock AI).
- Custodian production rails. The "integrations" are *simulated* source-system representations.

## RFI / POC coverage map
| POC §  / RFI § | Capability | Phase |
| --- | --- | --- |
| Outline A · RFI 2.1, 2.4 | Unified Advisor Experience / dashboard / relationship intelligence | 3 |
| Outline II.2 · RFI 2.1, 2.5 | Knowledge graph & unified household + cross-silo identity | 2 |
| RFI 2.2 | Predictive opportunities (cross-org bridges) | 2 + 3 |
| Outline B · RFI 2.3 | Onboarding / account opening + doc AI + Salesforce Cases | 4 |
| Outline C · RFI 2.7 | Servicing "meeting-to-action" distribution event | 5 + 6 |
| Outline II.4 · RFI 2.7 | "Ask Anything" + Meeting Assistant (AI surfaces) | 6 |
| Outline IV · RFI 2.8 | Operational analytics (SLA, bottlenecks) | 7 |
| RFI 2.9 | Corporate Trust use case (muni issuer → wealth) | 2 + 8 |
| RFI 2.10 | Sits-above integration posture (Fi-Tek/Salesforce/SEI/LPL/eMoney/DocuSign/Box) | 8 |

---

## Phase 1: Zions brand + instance default
- [ ] Add `'zions'` to `BrandTheme` union in `src/stores/themeStore.tsx`
- [ ] Force `'zions'` as the instance default (replace the stratos lock in `getInitialBrandTheme`)
- [ ] Create `src/styles/themes/zions.css` (`[data-theme="zions"]` light + dark) — Zions navy brand palette; neutrals inherited from the shared token system
- [ ] `@import` `zions.css` in `src/index.css`
- [ ] Point `BrandThemeSwitcher` at Zions (single-brand lock, mirrors the Stratos pattern)
- [ ] Zions wordmark/logo in the nav (persistent, like the Stratos logo)
- [ ] `pnpm build` + `pnpm dev` clean

## Phase 2: Cross-silo identity graph + Zions seed (the headline)
- [ ] New types: a legal-entity node with multiple **source-system identities** (Fi-Tek, LPL, Transtar, eMoney, bank-core) + affiliate-bank membership + entity kind (person / household / LLC / trust / municipality / issuer)
- [ ] Zions seed: a HNW household on Fi-Tek + LPL; a muni/corporate **issuer** in Corporate Trust with officers/owners; a business owner who also banks retail/commercial at an affiliate
- [ ] Graph viz (reuse `@xyflow/react` + `dagre`): one entity node, edges to each source-system ID + affiliate, "collapse to one node" interaction
- [ ] Corporate-trust → wealth bridge: surface issuer officers/owners as next-best-action prospects
- [ ] Bank → wealth promotion signal (deposit threshold / mortgage equity / business-sale inflow) on a retail customer

## Phase 3: Unified Advisor Experience
- [ ] Re-seed `relationshipsSeed.ts` with Zions households (replace Stratos sample book)
- [ ] Dashboard: book-of-business view + next-best actions + alerts, Zions-flavored
- [ ] Relationships page: Zions households incl. the cross-silo entity + the issuer
- [ ] Activity timeline + AI client summary placeholder hooks
- [ ] Source-system badges (Fi-Tek / LPL / eMoney / Transtar / bank-core) on accounts

## Phase 4: Onboarding / Account Opening (re-seed for Zions)
- [ ] Re-seed the onboarding journey for a Zions household
- [ ] Simulated integrations surfaced in-flow: **Fi-Tek/GWES**, **Salesforce** (read + Case write-back), **eSignature** (DocuSign-style envelope)
- [ ] Doc AI step: ingest/classify a trust agreement / corporate resolution → prefill (mocked extraction)
- [ ] SLA / status tracking visible to advisor + ops + compliance

## Phase 5: Servicing — meeting-to-action (distribution event)
- [ ] Build on the in-progress servicing `Arch` model (`open / open-sim / toa / contribution / standing / alert`) — Zions distribution/ACH ("Move Money") journey
- [ ] Seed a Zions servicing book incl. a distribution journey at/near SLA breach (for the "delayed beyond SLA" AMA prompt)
- [ ] "Launch from insight": a meeting surfaces a life-event → auto-generated distribution request → routed approval tasks → status tracking

## Phase 6: AI surfaces — DECISION PENDING (see below)
- [ ] **Meeting Assistant** (summary + AI-recommended action cards → accept creates a servicing action) — maps 1:1 to "meeting-to-action"
- [ ] **Ask Anything** (NL queries over household / onboarding / servicing / ops data; scripted answers for the RFI's example prompts)
- [ ] Route + nav entry (`/assistant` or `/meetings/:id`)
- [ ] **Until Eric confirms approach: ship a clean branded placeholder shell, not a fabricated AI.**

## Phase 7: Operational analytics (POC deliverable §IV)
- [ ] SLA dashboard + bottleneck visibility + workflow monitoring + task transparency over the Zions servicing/onboarding seed

## Phase 8: Simulated-integration posture
- [ ] A "Connected systems" representation (Fi-Tek / Salesforce / SEI / LPL / eMoney / DocuSign / Box / Transtar / bank-core) showing sits-above read/write-back, per RFI 2.10
- [ ] Corporate-trust panel (RFI 2.9) tied to the Phase-2 issuer

---

## The AI page — back-door investigation result (2026-06-01)
Upstream `mosaic-avantos/avantos` was investigated for faithful reproduction of the AI piece:
- **Meeting Assistant** (`/modules/os-meetings/` summary page + action-recommendation cards + TipTap `ai-text-editor`): **CLEAN port** — UI decoupled from the LLM; all API calls mockable; "accept recommendation" → create action maps exactly to our servicing model.
- **"Ask Anything" chat** (`shared-ui-components/molecules/chat-interface/`): **HARD** — bound to Vercel AI SDK streaming + a live AI API. Faithful only as ported UI + *scripted* responses (no real model).
- **Friction:** upstream uses the `reshaped` design system (not this repo's shadcn/Radix), plus TipTap + AI SDK deps. A *pixel-faithful* port is a real effort with accuracy risk.

**Recommendation (Eric to confirm):** Build Phase 6 as a clean, on-brand placeholder using *this* repo's shadcn components, modeled on the real Avantos flow (summary → action cards → accept; chat with suggested prompts + scripted answers). Offer a faithful upstream port (Meeting Assistant first; Ask Anything UI + scripted) as a follow-on once Eric confirms the accuracy bar / supplies the exact UX.

## Notes
- Eric's in-progress servicing rewrite (uncommitted on this branch's working tree) is the basis for Phase 5 — do **not** clobber it; build on the `Arch` model.
- All new domain names must be grounded (POC outline / RFI / Architect Brief); avoid inventing Zions schema identifiers.
