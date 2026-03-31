# Product Context

## What is this?

The platform is a SaaS wealth management product sold to advisory firms. It provides advisors with a unified workspace for managing client relationships, households, investments, financial planning, and servicing.

This prototype demonstrates a new capability being added to the platform: **client onboarding journeys**.

## The problem

When a prospect is ready to become a client, the advisor needs to collect information, verify identities, open accounts, and coordinate across compliance and operations. Today this process is fragmented — different steps live in different systems, and there's no unified view of progress.

## What we're building

An onboarding journey is a guided, multi-step workflow that an advisor initiates when a prospect is ready to be onboarded as a client. The journey collects all necessary information, coordinates KYC verification, and sets up accounts — all within the platform.

### How it starts

Advisors manage prospects through the platform's existing [relationship profiles](./Relationships/relationships.md). When discussions with a prospect reach the right stage, the advisor creates an onboarding journey from the dashboard. This selects the relationship (household) and kicks off the workflow.

This prototype picks up at the point where the advisor is ready to start onboarding. Everything upstream (prospect management, initial conversations, relationship creation) is out of scope.

### The household model

Each onboarding journey covers a **household** — a primary contact and their related members (spouse, children, dependents, etc.). The primary household member is the main point of contact, but the journey collects data for and runs KYC on multiple individuals within the household.

See [Households & Organizations](./Relationships/households.md) for how the platform models household structures.

### The workflow

The onboarding journey is organized into **actions** (top-level phases) containing **tasks** (individual steps):

1. **Collect Client Data** — Gather client information, identify household members and related parties, and list financial accounts
2. **KYC** — Verify identity for household members who require it (not all will — some may have completed KYC previously). Spawns a child task per eligible member
3. **Account Opening** — Configure the account and complete final review

### Task ownership

The advisor who creates the journey owns most tasks and drives the process end-to-end. Certain tasks — particularly KYC verification — route to specialists like compliance officers. This is a new ownership model for the platform: historically, each task was independently assigned to a role. We're exploring whether tying the entire journey to a single advisor improves the experience.

### What the prototype includes

- **Dashboard** (`/`) — Entry point where the advisor selects a relationship and creates a journey
- **Wizard** (`/wizard`) — Step-by-step guided UI for completing each task in the workflow
- **Workflow viewer** (`/workflow`) — React Flow visualization showing all actions, tasks, and their status

## What "smoke and mirrors" means

This is a **design prototype** with no backend. There is no real data, no persistence across sessions, and no integration with external systems. The purpose is to align the internal team on the user experience before building the real thing. All data is seeded in-memory and all interactions are simulated.

## Audience

This prototype is for **internal use** — the team is using it to align on the design approach for the onboarding journey feature. It is not being shown to customers or external stakeholders.

## Future scope

The workflow will expand as the design solidifies. The current three-action structure (Collect Data, KYC, Account Opening) is a starting point. Additional steps, integrations, and capabilities will be added as the team iterates on the experience.
