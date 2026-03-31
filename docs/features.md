# Features

Page-by-page walkthrough of what the app does and how it's composed.

## Dashboard (`/`)

**Components:** `DashboardLayout` > `DashboardSidebar` + `DashboardContent`

The landing page for the platform. The sidebar provides navigation (Dashboard and Servicing are active; Clients, Portfolios, Reports, Settings are placeholder) and a theme toggle.

A "Create" button in the sidebar opens the **ComposeDialog**, a bottom-right floating panel styled like a compose window. The dialog collects:

1. **Journey name** (free text)
2. **Action type** (only "Client Onboarding" is enabled; 6 others are listed as "Coming soon")
3. **Relationship** (select from 3 seeded relationships)

On submit, if there's an active live journey it gets saved first, then `INITIALIZE_FROM_RELATIONSHIP` resets the workflow with the selected relationship's parties, accounts, and client info. The user is navigated to `/wizard`.

---

## Wizard (`/wizard`)

**Components:** `WizardLayout` > `StepSidebar` + `TaskContent` + `DetailSidebar` + `WizardFooter`

Three-column layout for step-by-step onboarding.

### Left sidebar (StepSidebar)
Groups tasks under their parent action with status icons (circle, loader, checkmark, ban). Clicking a task navigates to it. The parent task highlights when any of its KYC children is active.

### Main content (TaskContent)
Renders the active task's form component based on its `formKey`. Shows the task title and a contextual description.

**Forms:**

| Form | Key fields |
|------|-----------|
| **Client Info** | First/last name, email, phone, date of birth, client type (individual/joint/trust/corporate) |
| **Related Parties** | Add/edit/remove household members, related contacts, and organizations. Supports primary member designation, soft-delete with restore, and per-type add dialogs. |
| **Financial Accounts** | Add/edit/remove accounts (brokerage, IRA, Roth IRA, 401k, trust, checking, savings) with custodian, account number, and estimated value. |
| **KYC Review** | Three phases: (1) select household members needing verification, (2) confirmation dialog, (3) post-submission dashboard with clickable links to each child task. Compliance team handoff notice. |
| **KYC Child** | Per-member identity verification: ID type/number, issue/expiry dates, risk rating, PEP and sanctions checks. |
| **Placeholder 1** | Branch assignment, relationship manager code, online banking setup. |
| **Placeholder 2** | Final review showing all collected data across tasks, with confirmation checkboxes and a complete button. |

### Right sidebar (DetailSidebar)
Shows metadata for the active task: title, assigned owner, and current status.

### Footer (WizardFooter)
Context-sensitive navigation:
- **Back / Next** for linear navigation through `flatTaskOrder`
- **Confirm** appears when a task is `in_progress` (transitions to `complete`)
- **Edit** appears when a task is `complete` (reopens as `in_progress`)
- Status message for `blocked` tasks

---

## Workflow Viewer (`/workflow`)

**Components:** React Flow canvas with custom nodes

Interactive graph visualization of the workflow. The `workflowToFlow` function converts the workflow state into React Flow nodes and edges using a two-pass layout:

1. **Inner pass:** positions tasks and KYC children within each action group
2. **Dagre pass:** positions the action groups left-to-right

Three custom node types:
- **ActionGroupNode** — colored container with action title and status badge
- **TaskNode** — task card showing title, assignee, and status
- **KycChildNode** — compact blue card for KYC child tasks

Edge styles: dashed within action groups, animated between groups, solid to KYC children.

---

## Servicing (`/servicing`)

**Components:** `ServicingLayout` > `ServicingContent` with 3 tab panels

Dashboard for tracking all onboarding journeys. Uses the same sidebar as Dashboard.

### Journeys tab (JourneysTable)
Lists all journeys (saved + seeded + live) with columns: name, relationship, status, assigned to, created date, and progress (X/Y tasks complete). The currently active journey shows a pulsing blue indicator. Rows link to the journey detail page.

### Actions tab (ActionsTable)
Flattened view of all actions across all journeys with status and task completion count.

### Tasks tab (TasksTable)
Flattened view of all tasks across all journeys with status and assignee.

All three tables use a shared `StatusBadge` component with color-coded styling per status.

---

## Journey Detail (`/servicing/:journeyId`)

**Components:** `JourneyDetailPage` (3-column layout)

Detailed view of a single journey.

- **Left sidebar:** hierarchical task list grouped by action, with status icons
- **Main content:** selected task's title, status badge, action name, and a detail card (assignee, status, relationship, action)
- **Right sidebar:** journey-level metadata (relationship, assignee, created date, progress count)

A "Continue in Wizard" button appears when the journey matches the currently active workflow, linking back to `/wizard`.

---

## Seed data

### Relationships (`src/data/relationships.ts`)

3 pre-configured client relationships:

| Relationship | Members | Accounts |
|-------------|---------|----------|
| **The Smith Family** | John (primary), Jane (spouse), Robert (child), Margaret (parent contact), David Chen (attorney), Smith Family Trust LLC | Smith Family Trust, John IRA |
| **Johnson Trust** | Michael (primary), Sarah (spouse), Patricia Wells (accountant), Johnson Holdings Inc | Johnson Family Trust, Michael Roth IRA |
| **Davis Household** | Emily (primary), James (spouse), Olivia (child), Richard Palmer (financial advisor), Davis & Associates | Davis Brokerage |

### Seeded journeys (`src/data/servicingSeed.ts`)

4 journeys at various stages:

| Journey | Status |
|---------|--------|
| Smith Family Onboarding | All tasks complete |
| Johnson Trust Onboarding | KYC blocked, account tasks not started |
| Davis Household Onboarding | In progress (client info started) |
| Smith Family Onboarding 2 | Not started |
