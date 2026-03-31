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

## Commands
- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
