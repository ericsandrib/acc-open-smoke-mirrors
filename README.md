# Account Opening — Smoke & Mirrors

Design prototype for a client onboarding journey in a wealth management platform. No backend — this is a front-end-only demo for aligning on the user experience.

See [docs/product-context.md](docs/product-context.md) for full product context.

## Quick start

```bash
pnpm install
pnpm dev
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard — select a relationship and start an onboarding journey |
| `/wizard` | Wizard — step-by-step task UI for the onboarding workflow |
| `/workflow` | Workflow viewer — React Flow graph of actions, tasks, and status |
| `/servicing` | Servicing — tabbed dashboard tracking all journeys, actions, and tasks |
| `/servicing/:journeyId` | Journey detail — task-level breakdown of a specific journey |

## Tech stack

- React + TypeScript (Vite)
- shadcn/ui + Tailwind CSS
- React Flow (@xyflow/react)
- React Router

## Project structure

```
src/
  types/        TypeScript type definitions
  data/         Seed/mock data
  stores/       React Context + useReducer state management
  components/
    wizard/     Wizard UI (sidebar, forms, footer)
    workflow/   React Flow workflow viewer
    dashboard/  Dashboard and journey creation
    servicing/  Servicing tables and journey detail
  pages/        Route-level page components
docs/           Product and domain documentation
specs/          Feature specifications
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |

## Documentation

- [Product context](docs/product-context.md) — what this is, who it's for, and why
- [Architecture](docs/architecture.md) — tech stack, provider hierarchy, routing, and key patterns
- [State management](docs/state-management.md) — the 3 stores, their state shapes, and all reducer actions
- [Features](docs/features.md) — page-by-page walkthrough of what's been built
- [Relationship profiles](docs/product/relationships.md) — how the platform models client relationships
- [Households](docs/product/households.md) — household member structure
- [Actions and tasks](docs/product/actions-and-tasks.md) — domain model for actions, tasks, and lifecycle
- [Workflow lifecycle](docs/product/workflow-lifecycle.md) — status definitions and transition rules
- [Specs index](specs/README.md) — feature specifications and status
- [Progress](PROGRESS.md) — implementation progress tracking
