# Progress

## Spec 001: Account Opening Wizard Workflow

### Phase 1: Project Setup
- [x] Scaffold Vite + React + TypeScript
- [x] Install and configure Tailwind CSS
- [x] Initialize shadcn/ui
- [x] Install React Flow, React Router, dagre
- [x] Configure path aliases (@/)

### Phase 2: Data Layer
- [x] Define TypeScript types (workflow.ts)
- [x] Create seed data with all actions/tasks
- [x] Build workflow store (context + reducer)
- [x] Implement flatTaskOrder computation
- [x] Implement KYC child spawning logic

### Phase 3: Wizard Frontend
- [x] Set up routing (App.tsx, main.tsx)
- [x] Build WizardLayout (3-column grid + sticky footer)
- [x] Build StepSidebar (left — action/task navigation)
- [x] Build TaskContent (center — form router)
- [x] Build DetailSidebar (right — placeholder)
- [x] Build WizardFooter (back/next)
- [x] Create Client Info form
- [x] Create Related Parties form
- [x] Create Financial Accounts form
- [x] Create KYC form (with member list + spawn buttons)
- [x] Create KYC Child form
- [x] Create Placeholder 1 form
- [x] Create Placeholder 2 form

### Phase 4: Workflow Viewer
- [x] Build workflowToFlow transformer
- [x] Create ActionNode custom node
- [x] Create TaskNode custom node
- [x] Create KycChildNode custom node
- [x] Build WorkflowViewer page with React Flow
- [x] Integrate dagre for auto-layout

### Phase 5: Polish
- [x] Navigation between /wizard and /workflow
- [x] Default redirect to /wizard
- [ ] Visual refinement and consistency pass

## Spec 002: Task Data Persistence

### Phase 1: State & Reducer
- [x] Add `taskData` to `WorkflowState` type and `SET_TASK_DATA` to `WorkflowAction` union
- [x] Add `taskData: {}` to initial state
- [x] Implement `SET_TASK_DATA` reducer case with shallow-merge semantics
- [x] Clean up orphaned `taskData` entries in `REMOVE_KYC_CHILD` case

### Phase 2: Hook
- [x] Create `useTaskData(taskId)` hook in workflowStore.tsx

### Phase 3: Form Migration
- [x] Convert ClientInfoForm to controlled inputs (6 fields)
- [x] Convert KycChildForm to controlled inputs keyed by child ID (7 fields)
- [x] Convert Placeholder1Form to controlled inputs (3 fields)
- [x] Convert Placeholder2Form to controlled inputs (3 fields)

### Phase 4: Cross-Task Summary
- [x] Wire Placeholder2Form review summary to display data from client-info and placeholder-1 tasks

## Spec 003: Servicing Route

### Phase 1: Foundation
- [x] Define servicing types (Journey, JourneyAction, JourneyTask)
- [x] Create seed data with 4 journeys across existing relationships
- [x] Build servicing store with context provider
- [x] Add Table and Tabs UI components

### Phase 2: Sidebar & Routing
- [x] Update DashboardSidebar with activeItem prop and Servicing nav item
- [x] Create ServicingPage and ServicingLayout
- [x] Register /servicing route in App.tsx

### Phase 3: Table Views
- [x] Build ServicingContent with tab switcher
- [x] Build JourneysTable with progress column
- [x] Build ActionsTable with tasks-complete column
- [x] Build TasksTable with action/journey context
- [x] Create StatusBadge component with color-coded badges

### Phase 4: Live Journey Integration
- [x] Implement deriveLiveJourney helper to convert wizard state
- [x] Merge live journey with seeded data in ServicingProvider

## Spec 004: Child KYC Tasks

### Phase 1: Foundation
- [x] Create kycChildSubTasks utility (constants, parser, ID generator)
- [x] Update computeFlatTaskOrder to push 3 derived IDs per child
- [x] Update reducer cases (SET_TASK_DATA, SET_TASK_STATUS, CONFIRM_TASK, REOPEN_TASK, REMOVE_KYC_CHILD)

### Phase 2: Form Components
- [x] Create KycChildInfoForm (editable, pre-populated from RelatedParty)
- [x] Create KycChildDocumentsForm (static upload mockup)
- [x] Create KycChildResultsForm (pending placeholder)
- [x] Update formRegistry with 3 new entries and descriptions

### Phase 3: Navigation & Display
- [x] Update TaskContent for sub-task ID resolution and title
- [x] Update WizardFooter for sub-task status resolution
- [x] Update DetailSidebar for sub-task detail display
- [x] Update StepSidebar for sub-task highlight matching
- [x] Update KycForm to navigate to -info suffix

### Phase 4: Servicing View
- [x] Update servicingStore to generate 3 JourneyTask objects per child action

### Phase 5: Cleanup
- [x] Delete old KycChildForm
- [x] Verify build passes

## Spec 005: Port Filter Sidebar from claudNav

### Phase 1: Port Core Filter Components
- [x] Create `src/components/filter/filter-types.ts` with type definitions
- [x] Port `filter-tag.tsx` (pill tag with × button)
- [x] Port `filter-trigger.tsx` (collapsible header with chevron + remove)
- [x] Port `filter-input-row.tsx` (tags container + search input)
- [x] Port `filter-multi-select.tsx` (searchable option list)
- [x] Port `filter-date.tsx` (date preset buttons)
- [x] Port `filter-panel.tsx` (content router for filter types)
- [x] Port `filter.tsx` (main wrapper component)
- [x] Create `index.ts` barrel export
- [x] Map claudNav design tokens to smoke-mirrors theme tokens

### Phase 2: Build Filter Sidebar Container
- [x] Create `filter-sidebar.tsx` with 380px animated sidebar
- [x] Add spring-physics slide animation (AnimatePresence)
- [x] Add header with title and close button
- [x] Add scrollable filter list area
- [x] Add "+" dropdown for adding new filters
- [x] Add clear-all button

### Phase 3: Build Adapter Layer
- [x] Build adapter to bridge `ColumnDef` → claudNav `FilterProps`
- [x] Build adapter for onChange → `ViewFilter[]` sync

### Phase 4: Integration
- [x] Replace `FilterPanel` Sheet in `table-view-wrapper.tsx` with sidebar
- [x] Update layout for sidebar push (not overlay)
- [x] Wire `TableControls` filter button to toggle sidebar
- [x] Verify view presets, dirty tracking, save/reset still work
- [x] Test all three tabs (Journeys, Actions, Tasks)

### Phase 5: Polish & Cleanup
- [x] Remove old `filter-panel.tsx`
- [x] Smooth animation pass
- [x] Keyboard accessibility check
- [x] Verify build passes
