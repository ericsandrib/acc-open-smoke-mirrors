# Account Opening Smoke & Mirrors Demo

## Project Overview
A wizard-like workflow demo for account opening with two endpoints:
- **Workflow Viewer** (`/workflow`) — React Flow graph visualization of the workflow
- **Wizard Frontend** (`/wizard`) — Step-by-step wizard UI

## Tech Stack
- React + TypeScript (Vite)
- shadcn/ui + Tailwind CSS
- React Flow (@xyflow/react)
- React Router

## Key Concepts
- **Actions**: Top-level groupings (Collect Client Data, KYC, Account Opening)
- **Tasks**: Individual steps within actions, each with status and assigned owner
- Tasks can have dynamic children (KYC spawns child tasks per household member)

## Project Structure
- `src/types/` — TypeScript type definitions
- `src/data/` — Seed/mock data
- `src/stores/` — React Context + useReducer state management
- `src/components/wizard/` — Wizard UI components
- `src/components/workflow/` — React Flow workflow viewer components
- `src/pages/` — Route-level page components
- `specs/` — Feature specifications
- `PROGRESS.md` — Progress tracking against specs

## Specs & Progress Tracking
- Each feature or plan gets a numbered spec file in `specs/` (e.g. `002-feature-name.md`)
- Numbers are zero-padded, three digits, and always increment from the highest existing spec
- `specs/README.md` is the index — add every new spec to the table there with its status
- `PROGRESS.md` tracks implementation progress per spec with checkbox phases
- When all phases of a spec are checked off, mark it **Complete** in `specs/README.md`

### When creating a new spec
1. Find the highest existing spec number in `specs/`
2. Create `specs/<next-number>-<short-name>.md` with the spec content
3. Add a row to the table in `specs/README.md`
4. Add a corresponding section to `PROGRESS.md` with phase checklists

## Commands
- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
