# Relationship Profiles

The platform maintains a comprehensive profile for every client relationship. Each profile can track over 50 data points, with configurable column visibility per deployment. Profiles are organized around a detail view with nine tabs (Overview, Household, Investments, Planning, Servicing, Growth, Billing, Communications, Documents), a sidebar with team and detail information, and a quick-view Passport card for at-a-glance context.

---

## Feature overview

### Relationship list

The relationship list is the primary view for browsing and segmenting the client book. It includes:

- **KPI dashboard cards** at the top, showing aggregate metrics (total clients, assets under management, counts by segment). The specific metrics displayed are configured per deployment — one deployment may show client counts by lifecycle stage with AUM totals, while another may show counts by line of business.
- **Configurable columns** — the platform supports over 50 possible columns per deployment. Administrators control which columns are available; end users control which visible columns appear in their personal view.
- **My Relationships toggle** — filters the list to only relationships assigned to the current user. Defaults to on.
- **Saved views, filters, sorting, and pagination** — standard table controls available on every list in the platform.
- **CSV export** — available per deployment configuration.
- **New Prospect creation** — optionally enabled, allowing users to create individual or business prospect records directly from the list.

### Relationship detail

Selecting a relationship opens a full detail view with:

- **Header** showing the relationship name, type, client-since date, and offering badge.
- **Nine content tabs**: Overview, Household, Investments, Planning, Servicing, Growth, Billing, Communications, and Documents.
- **Sidebar** with two panels: Details (AUM, offerings, context notes, activity dates, household members) and Team (market information and assigned team members with contact details).

### Passport card

The Passport is a quick-view summary panel that appears in contexts like meeting preparation. It surfaces key relationship data without navigating away from the current page:

- Relationship name, type, and offering
- Alert indicators
- Date joined and assets under management
- Context description
- Team assignments (advisors, service specialists, financial planner)
- Market information (region, market, office)
- Last and next meeting dates
- Quick links to the full profile, team panel, and all detail tabs
- Household member list with roles, contact details, and addresses

---

## Data points

### Relationship list — KPI metrics

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Client count by lifecycle stage | Number of relationships grouped by stage (e.g., Prospective, New, Existing) | Prospective: 12, New: 8, Existing: 245 | Auto-calculated from relationship records |
| Assets under management by stage | Total AUM grouped by lifecycle stage | Existing: $1.2B | Auto-calculated from financial data |
| Client count by line of business | Number of relationships grouped by business line | Life: 340, Wealth: 128 | Auto-calculated from relationship records |
| Total client count | Aggregate count of all relationships | 1,247 | Auto-calculated |

### Relationship list — columns

The platform tracks the following data points per relationship. Column visibility is configurable — deployments typically show 10-15 columns by default, with the remaining columns available to be shown on demand.

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Relationship Name | Client or organization display name; links to detail view | Whitfield Family | Synced from CRM |
| Advisor | Primary advisor assigned to the relationship | Sarah Chen | Role assignment |
| Offering | Service tier or product offering | Wealth & Tax, Life Insurance | Synced from CRM |
| Type | Lifecycle stage of the relationship | Prospect, Onboarding, Existing, Transferred | Synced from CRM |
| Sub-Type | Further classification within the type | High Net Worth | Synced from CRM |
| AUM | Approximate assets under management | $2,450,000 | Synced from financial systems |
| Last Meeting | Date of the most recent meeting | Mar 12, 2026 | Auto-calculated |
| Next Meeting | Date of the next scheduled meeting | Apr 3, 2026 | Auto-calculated |
| City | Client billing or household city | Denver | Synced from CRM |
| State | Client billing or household state | Colorado | Synced from CRM |
| Alerts | Whether the client has active alerts | Yes | Synced from CRM |
| Birthday | Client date of birth | Jun 15, 1978 | Synced from CRM |
| Age | Client age | 47 | Auto-calculated |
| Location | Client household city | Chicago | Synced from CRM |
| Account Opening Date | Date the account was opened | Jan 10, 2019 | Synced from CRM |
| Annuity Purchase Date | Date of annuity purchase | Feb 28, 2022 | Synced from CRM |
| Policy Issue Date | Date an insurance policy was issued | Sep 1, 2021 | Synced from CRM |
| Effective Date | Policy or account effective date | Oct 1, 2021 | Synced from CRM |
| Renewal Date | Policy renewal date | Oct 1, 2026 | Synced from CRM |
| Payment Due Date | Next payment due date | Apr 15, 2026 | Synced from CRM |
| Household | Household name or group | Whitfield Household | Synced from CRM |
| Associated Businesses | Businesses linked to the client | Whitfield & Associates LLC | Synced from CRM |
| Product | Product associated with the relationship | Term Life 20 | Synced from CRM |
| Consolidation Target | Active consolidation target amount | $500,000 | Synced from CRM |
| Consolidation Notes | Notes on consolidation opportunities | Rollover from previous 401(k) pending | Manual entry |
| Next Consolidation Activity | Date of next consolidation-related activity | May 1, 2026 | Manual entry |
| Advisor Transition Date | Date the client transitioned to a new advisor | Jan 15, 2026 | Synced from CRM |
| Client Anniversary | Anniversary of the client relationship | Mar 1 | Synced from CRM |
| Client Since | Date the client relationship began | Mar 1, 2018 | Synced from CRM |
| Discount Type | Type of fee discount applied | Household Discount | Synced from CRM |
| Estate Review Complete | Whether an estate review has been completed | Yes | Synced from CRM |
| Financial Planning Complete | Whether financial planning is complete | Yes | Synced from CRM |
| Insurance Review Complete | Whether an insurance review is complete | No | Synced from CRM |
| Investments Complete | Whether investment setup is complete | Yes | Synced from CRM |
| Tax Review Complete | Whether a tax review is complete | Yes | Synced from CRM |
| Trust | Whether the client has a trust | Yes | Synced from CRM |
| Market | Geographic or business market segment | Northeast | Synced from CRM |
| Referral Source | How the client was referred | Employee Referral | Synced from CRM |
| Referral Program | Specific referral program | Partner Referral Program | Synced from CRM |
| Referrer | Name of the referring individual | James Morton | Synced from CRM |
| Primary Advisor Payout | Primary advisor's payout percentage | 60% | Synced from CRM |
| Secondary Advisor | Secondary advisor name | Michael Torres | Role assignment |
| Secondary Advisor Payout | Secondary advisor's payout percentage | 40% | Synced from CRM |
| Previous Advisor | Previously assigned advisor | Robert Kim | Role assignment |
| Regional Sales Associate | Assigned regional sales associate | Dana Williams | Role assignment |
| Regional Vice President | Assigned regional VP | Patricia Holmes | Role assignment |
| Primary Client Service Specialist | Assigned client service specialist | Amy Rodriguez | Role assignment |
| Tax Associate | Assigned tax associate | Kevin Patel | Role assignment |
| Tax Manager | Assigned tax manager | Lisa Nguyen | Role assignment |
| Tax Support Specialist | Assigned tax support specialist | Jordan Hayes | Role assignment |
| Tax Client | Whether the client uses tax services | Yes | Synced from CRM |
| Tax Client Since | Date tax services began | Apr 1, 2020 | Synced from CRM |
| Tax Type | Type of tax service provided | Individual 1040 | Synced from CRM |
| Tax Notes | Important notes about tax services | Extension filed for 2025 | Manual entry |
| Tax Pod | Tax office or pod assignment | Boston Tax Office | Synced from CRM |
| Tax Statements Uploaded | Whether tax statements have been uploaded | Yes | Synced from CRM |
| Tax Statements Year | Year of uploaded tax statements | 2025 | Synced from CRM |
| Number of Tax Statements | Count of uploaded tax statements | 3 | Synced from CRM |
| Tax Statements Last Updated | Date tax statements were last uploaded | Feb 15, 2026 | Synced from CRM |
| View SOW Details | Link to external statement of work details | (external link) | Synced from CRM |
| View Tax Statements | Link to external tax statement repository | (external link) | Synced from CRM |
| Last Updated | Date the relationship record was last updated | Mar 25, 2026 | Auto-captured |
| Beneficiary Information | Beneficiary details for the relationship | Spouse — Jane Whitfield, 100% | Synced from CRM |

### Relationship detail — header

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Relationship Name | Display name of the client or organization | Whitfield Family | Synced from CRM |
| Type | Lifecycle stage | Existing | Synced from CRM |
| Client Since | Date the relationship began | Mar 1, 2018 | Synced from CRM |
| Offering | Service tier badge | Wealth & Tax | Synced from CRM |

### Relationship detail — sidebar (Details panel)

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Total AUM | Total assets under management for the relationship | $2,450,000 | Synced from financial systems |
| Investments (last engagement) | Date of last investments engagement | Dec 15, 2025 | Synced from CRM |
| Planning (last engagement) | Date of last financial planning update | Nov 3, 2025 | Synced from CRM |
| Taxes (last engagement) | Date of last tax review | Oct 20, 2025 | Synced from CRM |
| Estate (last engagement) | Date of last estate plan update | Aug 8, 2025 | Synced from CRM |
| Insurance (last engagement) | Date of last insurance review | Jul 15, 2025 | Synced from CRM |
| Trusts (last engagement) | Date of last trust engagement | Sep 1, 2025 | Synced from CRM |
| Context | Free-text notes about the relationship (supports rich text) | Recently relocated from NY. Prefers phone calls over email. | Manual entry (editable) |
| Last Meeting | Date of most recent meeting | Mar 12, 2026 | Auto-calculated |
| Next Meeting | Date of next scheduled meeting | Apr 3, 2026 | Auto-calculated |
| Alerts | Whether the client has active alerts, with link to details | Active Alert | Synced from CRM |
| Household Members | List of household members with name, role, and primary indicator | John Whitfield (Client, Primary), Jane Whitfield (Spouse) | Synced from CRM |

### Relationship detail — sidebar (Team panel)

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Division | Business division | Wealth Management | Synced from CRM |
| Region | Geographic region | Northeast | Synced from CRM |
| Market | Market segment | Boston Metro | Synced from CRM |
| Office | Office location | Boston | Synced from CRM |
| Household ID | Household identifier | HH-2024-00847 | Synced from CRM |
| Team Member Name | Name of each assigned team member | Sarah Chen | Role assignment |
| Team Member Role | Role of each team member | Wealth Advisor | Role assignment |
| Team Member Email | Email address (shown on click) | sarah.chen@example.com | Role assignment |
| Team Member Phone | Phone number (shown on click) | (617) 555-0142 | Role assignment |

### Passport card

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Relationship Name | Client or organization name | Whitfield Family | Synced from CRM |
| Type | Lifecycle stage | Existing | Synced from CRM |
| Offering | Service tier badge | Wealth & Tax | Synced from CRM |
| Alerts | Active alert indicator | Active Alert | Synced from CRM |
| Date Joined | When the relationship was created | Mar 1, 2018 | Synced from CRM |
| AUM | Assets under management | $2,450,000 | Synced from financial systems |
| Description | Context or household comments | Recently relocated from NY. | Manual / Synced from CRM |
| Region | Geographic region | Northeast | Synced from CRM |
| Market | Market segment | Boston Metro | Synced from CRM |
| Office | Office location | Boston | Synced from CRM |
| Wealth Advisor | Primary advisor | Sarah Chen | Role assignment |
| Secondary Advisor | Secondary advisor | Michael Torres | Role assignment |
| Tertiary Advisor | Third advisor (if assigned) | — | Role assignment |
| National Coverage | Whether national coverage is assigned | Yes | Synced from CRM |
| Primary Client Service Specialist | Assigned service specialist | Amy Rodriguez | Role assignment |
| Secondary Client Service Specialist | Second service specialist | — | Role assignment |
| Financial Planner | Assigned financial planner | David Park | Role assignment |
| Household ID | Household identifier | HH-2024-00847 | Synced from CRM |
| Last Meeting | Date of most recent meeting | Mar 12, 2026 | Auto-calculated |
| Next Meeting | Date of next scheduled meeting | Apr 3, 2026 | Auto-calculated |

### Relationship overview tab

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Financial Accounts | Table of investment accounts (see Investments page) | 4 accounts | Synced from financial systems |
| Open Actions | Actions associated with this relationship, filterable by saved view | 3 open actions | Auto from servicing |
| Open Tasks | Tasks associated with this relationship, filterable by saved view | 7 tasks ready to begin | Auto from servicing |
| Growth Opportunities | Consolidation and referral data for the relationship | 2 active opportunities | Manual / Synced from CRM |

### Relationship types

| Type | Description | Example |
|------|-------------|---------|
| Prospect | A potential client not yet onboarded | Individual or business being evaluated |
| Onboarding | A new client currently being set up | Client signed within the last 90 days |
| Existing | An established, long-standing client | Client relationship of more than one year |
| Transferred | A client recently transferred from another advisor | Client moved from a departing advisor |

### Prospect creation

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Prospect Type | Whether the prospect is an individual or business | Individual | Manual entry |
| Legal First Name | First name (individual prospects) | John | Manual entry |
| Legal Last Name | Last name (individual prospects) | Whitfield | Manual entry |
| Email | Email address (individual prospects) | john@example.com | Manual entry |
| Phone Number | Phone number (individual prospects) | (617) 555-0100 | Manual entry |
| Business Name | Name of the business (business prospects) | Whitfield & Associates | Manual entry |
| Primary Contact | Primary contact name (business prospects) | John Whitfield | Manual entry |
| URL | Business website (business prospects) | www.whitfieldassoc.com | Manual entry |

---

## Customization options

| Setting | What It Controls | Options | Default | Who Configures |
|---------|-----------------|---------|---------|----------------|
| KPI dashboard metrics | Which aggregate metrics appear at the top of the relationship list | Configurable per deployment — choose from client counts, AUM totals, counts by segment, counts by line of business | Deployment-specific | Administrator |
| KPI dashboard layout | How metric cards are arranged | Grid (equal-sized cards) or Hero Row (one large card plus a group of smaller cards) | Deployment-specific | Administrator |
| Column visibility (default) | Which columns are shown when users first access the list | Any combination of available columns; deployments typically default to 10-15 visible columns | Deployment-specific | Administrator |
| Column visibility (personal) | Which columns an individual user sees | Users can show or hide any available column | Administrator default | End user |
| Column ordering | Order of columns in the list | Drag to reorder | Administrator default | End user |
| My Relationships toggle | Whether the list shows only the current user's relationships or all relationships | On (my relationships) or Off (all relationships) | On | End user |
| Saved views | Predefined or personal table configurations (filters, columns, sort order) | Global views, role-based views, or personal views (up to 10 per user per table) | Deployment-specific global views | End user / Administrator |
| Filters | Which filter criteria are applied to the list | Per-column filters including text search, multi-select, date range, and boolean | No filters applied | End user |
| Sorting | Which column the list is sorted by | Any sortable column, ascending or descending | Deployment-specific | End user |
| Page size | Number of rows displayed per page | Configurable pagination | Platform default | End user |
| CSV export | Whether export to CSV is available | Enabled or Disabled per deployment | Deployment-specific | Administrator |
| New Prospect button | Whether users can create prospect records from the list | Enabled or Disabled (controlled by feature flag) | Deployment-specific | Administrator |
| Growth tab visibility | Whether the Growth tab appears on relationship detail | Enabled or Disabled (controlled by feature flag); also automatically hidden for Prospect-type relationships | Deployment-specific | Administrator |
| Context notes | Editable free-text field on the relationship sidebar | Rich text or plain text, syncs back to CRM | Empty | End user |
| Offering badges | Which service offerings are tracked and displayed | Configurable set of offerings (e.g., Investments, Planning, Taxes, Estate, Insurance, Trusts) with active/inactive state and last engagement date | Deployment-specific | Administrator |

---

## Related

- [Households & Organizations](./households.md) — how the platform models families, dependents, and organizational structures
- [Actions & Tasks](./actions-and-tasks.md) — work items tracked per relationship
- Investments, Communications & Documents — the supporting data tabs on each relationship profile
- Meeting Management — meetings linked to relationships
- Views, Filters & Column Controls — detailed documentation on saved views and table configuration
