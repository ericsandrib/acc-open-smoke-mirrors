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
