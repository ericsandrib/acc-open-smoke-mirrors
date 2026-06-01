# Spec 008: Relationship Detail Port

> **Branch:** `zions-poc` · **Status:** In Progress
> Faithful port of the Avantos relationship-detail surface (`modules/os-relationship-details`) into the Zions instance, wired to the Zions cross-silo data. Spec source: `docs/product/relationships.md` + `docs/product/households.md`. Full upstream blueprint captured in the build session.

## Why
The base prototype linked households to `/relationships/:id` but never built the page (no route → bounced to Home). The real Avantos detail is a **9-tab profile** + sidebar + Passport — the "Unified household/client view" (POC §A; RFI 2.1/2.4/2.5).

## Surface (faithful structure)
- **Shell** — header (icon tile + name + dot-subtitle + segmentation badge) · underline tab strip · resizable right **sidebar** with pill **Details / Team** tabs.
- **9 tabs** — Overview · Household · Investments · Planning · Servicing · Growth · Billing · Communications · Documents. (Upstream union is 11; `protection` + `tax` are tenant-gated off.)
- **Sidebar — Details:** AUM card (branded) · Activities (last/next meeting, alerts) · Household chips · Context. **Team:** Market Information (Division/Region/Market/Office/Household ID) · Team (roles → member popover w/ contact).
- **Passport** quick-view sheet (Overview + Household pill tabs) triggered from list rows / a header "Quick view".
- **Financial accounts table** (Overview + Investments) — tabs Accounts / RMDs / SLOAs; Accounts columns: Account (+ custodian + alert badge) · Investment Program · Account # · Total Balance · SLOAs ✓ · RMDs ✓.
- **Household tab** — two columns: contacts sidebar (Household / Related Contacts / Related Relationships) + member detail (Basic Information · Contact · Addresses · Client Portal).

## Zions wiring (view-model)
`src/data/zions/relationshipDetail.ts` joins: identity graph (accounts across Fi-Tek/LPL/Transtar/eMoney/bank-core + members + related orgs + opportunities) · servicing seed (open actions/tasks) · meetings seed. Richest for the cross-silo personas (Whitmore, Cedar Falls, Cedar Ridge, Hale, Cole).

## Progress
- [x] Route `/relationships/:relationshipId` + `RelationshipDetailPage` (un-break the link)
- [x] Header + segmentation/type badges + AUM + Details/Team sidebar
- [x] 9-tab strip (local tab state)
- [x] Overview — accounts-across-custodians table + open actions/tasks + growth opps + meetings
- [x] Household — two-column contacts + member detail (Basic info, Contact, Addresses, Client Portal)
- [x] Investments / Servicing / Growth — populated from real Zions data
- [ ] Financial-accounts table upstream column treatment (Accounts/RMDs/SLOAs tabs, alert badge, cash link)
- [ ] Passport quick-view sheet
- [ ] Nested routes per tab (deep-linkable) + servicing actions/tasks sub-routes
- [ ] Investments charts (market value line / allocation pie) + performance table
- [ ] Planning (plans table + net-worth stub) · Billing · Communications (filterable) · Documents — currently representative
- [ ] reshaped→shadcn token parity polish (branded fuchsia → Zions navy already applied)

## Notes
- Tenant config replaced with a static all-on `relationshipConfig`; React-Query hooks → synchronous selectors over the Zions seed.
- Salesforce deep-links / Launch Client Portal / external iframes (Growth/Billing/Documents) → stubs or representative panels per the smoke-and-mirrors model.
