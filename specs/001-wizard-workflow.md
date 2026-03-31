# Spec 001: Account Opening Wizard Workflow

## Overview
Build a smoke-and-mirrors demo of a wizard-like workflow for account opening. Two views share the same workflow state: a visual workflow viewer (React Flow) and an interactive wizard frontend.

## Endpoints

### `/workflow` — Workflow Viewer
- React Flow graph showing all actions, tasks, and their connections
- Custom nodes for actions (group containers), tasks, and KYC child tasks
- Reflects live state (status, spawned children) from shared context
- Auto-layout via dagre for dynamic node positioning

### `/wizard` — Wizard Frontend
- **Left sidebar**: Step navigation — tasks grouped by action, current step highlighted, status badges
- **Main content**: Title + form elements for the active task
- **Right sidebar**: Placeholder (future use)
- **Sticky footer**: Back/Next navigation buttons

## Data Model

### Actions (top-level groupings)
1. **Collect Client Data**
   - Client Info
   - Related Parties
   - Financial Accounts
2. **KYC**
   - KYC (can dynamically spawn child tasks per household member)
3. **Account Opening**
   - Placeholder 1
   - Placeholder 2

### Task Properties
- `id` — unique identifier
- `title` — display name
- `actionId` — parent action
- `status` — not_started | in_progress | complete | blocked
- `assignedTo` — owner name/role
- `formKey` — maps to a form component
- `children` — optional array of child tasks (KYC)
- `order` — sort position within action

### KYC Dynamic Children
- The KYC task displays household members with a "Start KYC Review" button each
- Clicking spawns a child task inserted into the navigation order after the KYC parent
- Child tasks appear indented in the sidebar and as connected nodes in the workflow viewer
- Navigation flows: KYC parent → child tasks (in order) → next action's first task

## State Management
- React Context + useReducer shared across both routes
- `flatTaskOrder` — linearized navigation sequence recomputed on every structural change
- Reducer actions: SET_ACTIVE_TASK, SET_TASK_STATUS, SPAWN_KYC_CHILD, REMOVE_KYC_CHILD, GO_NEXT, GO_BACK

## Tech Stack
- React + TypeScript (Vite)
- shadcn/ui + Tailwind CSS
- React Flow (@xyflow/react)
- React Router
- dagre (auto-layout)

## Forms
All forms are decorative (no real validation/submission). Use shadcn Input, Select, Checkbox, Label components.
