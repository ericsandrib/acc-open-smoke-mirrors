# Progress

## Spec 001: Account Opening Wizard Workflow

### Phase 1: Project Setup
- [ ] Scaffold Vite + React + TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Initialize shadcn/ui
- [ ] Install React Flow, React Router, dagre
- [ ] Configure path aliases (@/)

### Phase 2: Data Layer
- [ ] Define TypeScript types (workflow.ts)
- [ ] Create seed data with all actions/tasks
- [ ] Build workflow store (context + reducer)
- [ ] Implement flatTaskOrder computation
- [ ] Implement KYC child spawning logic

### Phase 3: Wizard Frontend
- [ ] Set up routing (App.tsx, main.tsx)
- [ ] Build WizardLayout (3-column grid + sticky footer)
- [ ] Build StepSidebar (left — action/task navigation)
- [ ] Build TaskContent (center — form router)
- [ ] Build DetailSidebar (right — placeholder)
- [ ] Build WizardFooter (back/next)
- [ ] Create Client Info form
- [ ] Create Related Parties form
- [ ] Create Financial Accounts form
- [ ] Create KYC form (with member list + spawn buttons)
- [ ] Create KYC Child form
- [ ] Create Placeholder 1 form
- [ ] Create Placeholder 2 form

### Phase 4: Workflow Viewer
- [ ] Build workflowToFlow transformer
- [ ] Create ActionNode custom node
- [ ] Create TaskNode custom node
- [ ] Create KycChildNode custom node
- [ ] Build WorkflowViewer page with React Flow
- [ ] Integrate dagre for auto-layout

### Phase 5: Polish
- [ ] Navigation between /wizard and /workflow
- [ ] Default redirect to /wizard
- [ ] Visual refinement and consistency pass
