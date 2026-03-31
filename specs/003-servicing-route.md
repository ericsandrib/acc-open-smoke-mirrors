# Spec 003: Servicing Route

## Overview

Add a `/servicing` route that provides a table-based overview of all onboarding journeys, their actions, and tasks. A tab switcher toggles between three views: Journeys, Actions, and Tasks.

## Motivation

The prototype currently tracks a single onboarding journey through the wizard. The servicing view gives the team a way to see the operational state of all onboarding work — both seeded dummy data and any journey actively being worked through the wizard.

## Data Model

### Journey hierarchy

- **Journey** → contains Actions → contain Tasks
- Each journey is tied to a relationship (household) and has an overall status
- Status is computed from child statuses (bottom-up)

### New types (`src/types/servicing.ts`)

- `JourneyStatus`: `'not_started' | 'in_progress' | 'complete' | 'cancelled'`
- `Journey`: id, relationshipName, status, createdAt, assignedTo, actions[]
- `JourneyAction`: id, journeyId, title, status, tasks[]
- `JourneyTask`: id, actionId, journeyId, title, status, assignedTo

### Seed data (`src/data/servicingSeed.ts`)

Four pre-seeded journeys using existing relationships:
1. Smith Family Onboarding — complete
2. Johnson Trust Onboarding — in progress (KYC blocked)
3. Davis Household Onboarding — in progress (just started)
4. Smith Family Account Transfer — not started

### Live journey

The current wizard's `WorkflowState` is derived into a `Journey` and appended to the table when a user has started work in the wizard. This uses a `deriveLiveJourney()` helper.

## UI Design

### Navigation

- "Servicing" item added to the dashboard sidebar (between Dashboard and Clients)
- Sidebar is shared between Dashboard and Servicing pages via `activeItem` prop

### Layout

Same structure as DashboardLayout: sidebar + main content area.

### Content

- Page title "Servicing" with description
- Tab switcher (top-right): Journeys | Actions | Tasks
- Each tab shows a table:
  - **Journeys**: Name, Relationship, Status, Assigned To, Created, Progress
  - **Actions**: Action, Journey, Status, Tasks Complete
  - **Tasks**: Task, Action, Journey, Status, Assigned To
- Status shown via color-coded badges (green/blue/gray/red)

## Files

### New
- `src/types/servicing.ts`
- `src/data/servicingSeed.ts`
- `src/stores/servicingStore.tsx`
- `src/pages/ServicingPage.tsx`
- `src/components/servicing/ServicingLayout.tsx`
- `src/components/servicing/ServicingContent.tsx`
- `src/components/servicing/StatusBadge.tsx`
- `src/components/servicing/JourneysTable.tsx`
- `src/components/servicing/ActionsTable.tsx`
- `src/components/servicing/TasksTable.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`

### Modified
- `src/App.tsx` — route + provider
- `src/components/dashboard/DashboardSidebar.tsx` — navigation + Servicing item

## Phases

### Phase 1: Foundation
- Types, seed data, store, UI primitives (Table, Tabs)

### Phase 2: Sidebar & Routing
- Sidebar navigation update, page component, route registration

### Phase 3: Table Views
- ServicingContent with tabs, three table components, status badges

### Phase 4: Live Journey Integration
- deriveLiveJourney helper, merge with seeded data
