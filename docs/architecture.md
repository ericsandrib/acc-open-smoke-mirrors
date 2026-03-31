# Architecture

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router v7 |
| State | React Context + useReducer |
| UI components | shadcn/ui + Tailwind CSS 4 |
| Graph visualization | React Flow (@xyflow/react) + dagre |
| Icons | Lucide React |

No backend. All data lives in memory and resets on refresh.

## Provider hierarchy

```
ThemeProvider
  WorkflowProvider
    ServicingProvider        ← must be inside WorkflowProvider (calls useWorkflow)
      BrowserRouter
        Routes
```

`ServicingProvider` derives live journey state from the active workflow, so it depends on `WorkflowProvider` being above it in the tree.

## Routes

| Route | Page component | Description |
|-------|---------------|-------------|
| `/` | `DashboardPage` | Landing page with sidebar nav and journey creation dialog |
| `/wizard` | `WizardPage` | Multi-step onboarding workflow (3-column layout) |
| `/workflow` | `WorkflowPage` | React Flow graph visualization of actions and tasks |
| `/servicing` | `ServicingPage` | Tabbed journey/action/task tracking dashboard |
| `/servicing/:journeyId` | `JourneyDetailPage` | Detail view of a specific journey with task navigation |
| `*` | Redirects to `/` | Catch-all |

## Project structure

```
src/
  pages/            Route-level page components (5 pages)
  components/
    dashboard/      Dashboard layout, sidebar, compose dialog
    wizard/         Wizard layout, sidebar, footer, detail panel
      forms/        Task form components (6 forms)
    workflow/       React Flow custom nodes and state-to-graph converter
    servicing/      Servicing layout, tabs, journey/action/task tables
    ui/             shadcn/ui primitives (button, input, select, etc.)
  stores/           Context + useReducer state management (3 stores)
  types/            TypeScript interfaces for workflow, servicing, relationships
  data/             Seed data (relationships, tasks, journeys)
  utils/            Helper functions (getActionStatus)
  lib/              Tailwind utility (cn)
docs/               Product and technical documentation
specs/              Feature specifications
```

## Key patterns

### formKey component lookup
`TaskContent` maps each task's `formKey` string to a React component. Adding a new form means adding a component and a key to the lookup table.

```
formKey        → Component
'client-info'  → ClientInfoForm
'related-parties' → RelatedPartiesForm
'financial-accounts' → FinancialAccountsForm
'kyc'          → KycForm
'kyc-child'    → KycChildForm
'placeholder-1' → Placeholder1Form
'placeholder-2' → Placeholder2Form
```

### flatTaskOrder
A computed flat array of all task IDs (parents + KYC children) in sequence. Used for:
- Back/Next navigation in the wizard footer
- Validating `SET_ACTIVE_TASK` targets
- Recomputed whenever KYC children are added or removed

### Dynamic KYC child spawning
The KYC Review task can spawn child tasks at runtime for each household member needing identity verification. Children get unique IDs (`kyc-child-{timestamp}`), are inserted into `flatTaskOrder`, and each renders the `KycChildForm`.

### Soft-delete for related parties
`REMOVE_RELATED_PARTY` sets `isHidden: true` instead of removing from the array. Hidden parties can be restored with `RESTORE_RELATED_PARTIES`. The primary member cannot be deleted.

### Relationship initialization
`ComposeDialog` selects a relationship from seed data and dispatches `INITIALIZE_FROM_RELATIONSHIP`, which resets the entire workflow state with that relationship's parties, accounts, and pre-filled client info.

### workflowToFlow graph transformation
Two-pass layout: first computes inner layout per action group (tasks + KYC children positioned relatively), then uses dagre to position the action groups left-to-right.
