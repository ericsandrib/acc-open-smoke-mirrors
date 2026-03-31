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
- [Relationship profiles](docs/Relationships/relationships.md) — how the platform models client relationships
- [Households](docs/Relationships/households.md) — household member structure
- [Specs index](specs/README.md) — feature specifications and status
- [Progress](PROGRESS.md) — implementation progress tracking
