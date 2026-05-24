# Last-minute tweaks

Running log of design changes made to the prototype on the `last-minute-tweaks` branch.

## 2026-05-24

### Journey Creation modal

- Header collapsed to a single 56px row (`h-14`) with the title vertically centered; removed the descriptive sub-paragraph.
- Removed the "Journey details" heading and its descriptive paragraph from the body.
- Removed the card wrapper around Journey name / Action type / Relationship — fields now sit inline in the section.

### Wizard pizza tracker (StepSidebar)

- Sidebar background switched to white.
- Selected task row now paints a full-width background that runs under the action spine on the left. Active fill moved from the button to the `<li>`; spine `z-index` bumped so the action line stays visible on top.
- Removed horizontal padding from the per-action row wrapper — spine, action title, and active fill now run edge-to-edge.
- Task `ProgressIcon` upsized from 14×14 to 16×16 to match the journey-header indicator.
- Journey-header progress ring replaced with the Lucide `LoaderCircle` icon at 16×16, right-aligned to share a vertical axis with the task status icons below.
- Scroll pane left padding bumped from `pl-1` to `pl-2` so the left gutter matches the right (8px each side).
- Nested task rows now extend their selected fill behind the action line, matching top-level rows. Dropped the nested `<ul>`'s `ml-4`; indentation moved into the button via `pl-6` when nested.
- Journey-header rows bumped from `px-2.5` to `px-[18px]` (+8px) for more breathing room from the sidebar edges.
- Hover state on task rows now matches the selected fill geometry — both live on the `<li>` and extend behind the action line. Active uses full opacity, hover uses `bg-sidebar-accent/70`. Text colour shift on hover wired through a `group/task-row` so the button still recolours when the row is hovered.

### Main vertical nav (desktop)

- When expanded, the nav now uses a `#F9F9F9` background and a transparent right border (border slot preserved to avoid a 1px layout shift on collapse). When collapsed it returns to `bg-sidebar` with `border-sidebar-border`.
- Transition list extended to `transition-[width,background-color,border-color]` so the bg and border fade alongside the existing width animation on open/close.

### Wizard pizza tracker (continued)

- Collapsible group header label ("Account Opening" etc.) now uses `text-muted-foreground` (and matching `text-muted-foreground/90` on its chevron) regardless of variant. Removed the v5/v6-only `text-foreground` override.

### Open Accounts form

- Account rows in the accounts list now have `min-h-[72px]` and `px-3` (was `p-3`) — vertical spacing driven by row height rather than padding, so rows read at a uniform 72px regardless of inner content.
- Account row leading icon avatar bumped from 32×32 (`h-8 w-8`) to 48×48 (`h-12 w-12`).
- "Add accounts" row inside the account-list container rebuilt to match account-row geometry: 72px tall, left-aligned, with the `Plus` glyph centered in a 48×48 transparent circle so it shares a vertical axis with the account-icon column above.
- "Add accounts" label now sits at `text-muted-foreground` by default and transitions to `text-foreground` on row hover (driven by a `group` on the button).

### ChildActionSidebar (child-action pizza tracker)

- Mirrored the parent pizza tracker treatments: nav background switched to white, scroll pane `pl-1` → `pl-2`, per-action wrapper drops `px-2.5`, and the sub-task `<li>` carries `group/task-row relative -ml-[38px] rounded-lg pl-[38px]` so active and hover fills both extend behind the action line edge-to-edge.
- Active fill moved off the button onto the `<li>` (active = `bg-sidebar-accent`, hover = `bg-sidebar-accent/70`). Text colour now recolours via `group-hover/task-row:` so the button still responds to row hover.
- Sub-task progress icon sized up from 14×14 (`h-3.5 w-3.5`) to 16×16 (`h-4 w-4`) to match the parent tracker.
