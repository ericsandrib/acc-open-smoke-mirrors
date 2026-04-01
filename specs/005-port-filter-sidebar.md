# Spec 005: Port Filter Sidebar from claudNav

## Overview

Replace the basic Sheet-based filter panel on the servicing route with the rich, animated filter sidebar from claudNav. This brings polished filter components with spring animations, tag-based selections, searchable multi-select, free-text with tag entry, date/date-range presets, and dynamic add/remove filter management.

## Motivation

The current `FilterPanel` is a minimal Sheet overlay with collapsible sections, basic checkboxes, and a text input. The claudNav prototype has a production-quality filter sidebar with morph animations, inline tags, search-within-options, and dynamic filter management — all patterns the team wants to demonstrate in the account opening prototype.

## Gap Analysis

### Current (smoke-mirrors)
- Sheet overlay (`w-80`), no animation beyond open/close
- Two filter types: multi-select (checkboxes) and text input
- All filterable columns always visible — no add/remove
- No tags for selected values
- No search within multi-select options
- No date or date-range filters

### Target (claudNav filter system)
- 380px sidebar with spring-physics slide-in/out (`motion`)
- Four filter types: multi-select, free-text, date, date-range
- Tags for selected values with × removal
- Search within multi-select option lists
- Dynamic add/remove filters via + dropdown menu
- Morph animation on expand/collapse per filter section
- Keyboard: Enter to add free-text tag, Backspace to remove last

## Component Architecture

### New components (`src/components/filter/`)

Port the following from `claudNav/components/filter/`:

| Component | Purpose |
|-----------|---------|
| `filter.tsx` | Main wrapper — manages expand/collapse state, search state, tag derivation |
| `filter-trigger.tsx` | Collapsible trigger header with chevron rotation + remove button |
| `filter-input-row.tsx` | Tags container + search/text input |
| `filter-panel.tsx` | Content router — renders multi-select options, date presets, or nothing (free-text) |
| `filter-multi-select.tsx` | Scrollable option list with checkboxes and search filtering |
| `filter-date.tsx` | Date preset buttons (Today, Yesterday, Last Week, Last Month, Custom) |
| `filter-tag.tsx` | Pill tag with × button |
| `filter-types.ts` | Type definitions (`FilterType`, `FilterOption`, `FilterState`, discriminated union props) |
| `index.ts` | Barrel export |

### New layout component

| Component | Purpose |
|-----------|---------|
| `filter-sidebar.tsx` | 380px animated sidebar with header, filter list, add-filter dropdown, clear-all |

### Adapter layer

The claudNav filter components use their own `FilterOption` / `FilterType` model, while smoke-mirrors uses `ViewFilter` / `ColumnDef`. An adapter is needed to bridge the two:

- Convert `ColumnDef` filterable columns → claudNav `FilterProps`
- Convert claudNav filter onChange callbacks → `ViewFilter[]` for `useViewManager`
- Derive filter options from table row data (same as current `FilterPanel`)

## Integration Points

### Replace `FilterPanel` usage in `table-view-wrapper.tsx`
- Remove the Sheet-based `FilterPanel`
- Render the new `FilterSidebar` as a sibling element in the flex layout
- Sidebar animates in from right, pushing table content left (not overlaying)

### Update `TableControls`
- Filter button toggles sidebar open/closed
- Filter count badge still shows active filter count

### Update `useViewManager` (if needed)
- May need to support `date` and `date-range` filter operators
- Add operator types to `ViewFilter` if needed

### Update `ColumnDef`
- Add `'date' | 'date-range'` to the `filterable` union
- Add `options?: { value: string; label: string }[]` for explicit option lists

## Design Tokens

claudNav uses custom CSS variables (`bg-fill-neutral`, `text-text-primary`, etc.). These will need to be mapped to the smoke-mirrors Tailwind theme tokens (`bg-accent`, `text-foreground`, etc.) during the port.

## Animation Dependencies

- `framer-motion` is already installed in smoke-mirrors
- claudNav uses `motion/react` (the newer import path) — verify compatibility or use `framer-motion` imports

## Files

### New files
- `src/components/filter/filter.tsx`
- `src/components/filter/filter-trigger.tsx`
- `src/components/filter/filter-input-row.tsx`
- `src/components/filter/filter-panel.tsx`
- `src/components/filter/filter-multi-select.tsx`
- `src/components/filter/filter-date.tsx`
- `src/components/filter/filter-tag.tsx`
- `src/components/filter/filter-types.ts`
- `src/components/filter/index.ts`
- `src/components/servicing/filter-sidebar.tsx`

### Modified files
- `src/components/servicing/table-view-wrapper.tsx` — swap Sheet for sidebar
- `src/components/servicing/table-controls.tsx` — wire toggle
- `src/types/view-preset.ts` — extend filter types
- `src/hooks/useViewManager.ts` — support new operators
- `src/data/servicing-view-presets.ts` — add date columns if applicable

### Removed files
- `src/components/servicing/filter-panel.tsx` — replaced by new system

## Phases

### Phase 1: Port Core Filter Components
Copy and adapt the 9 filter component files from claudNav. Map design tokens to smoke-mirrors theme. Verify they render in isolation.

### Phase 2: Build Filter Sidebar Container
Create the animated sidebar wrapper with header, scrollable filter list, add-filter dropdown, and clear-all. Wire up AnimatePresence for enter/exit.

### Phase 3: Build Adapter Layer
Bridge claudNav filter component props to `useViewManager`'s `ViewFilter[]` model. Handle bidirectional sync: preset filters → component state, component changes → `setFilters()`.

### Phase 4: Integration
Replace `FilterPanel` in `table-view-wrapper.tsx` with the new sidebar. Update layout so sidebar pushes content. Wire `TableControls` toggle. Ensure view presets, dirty tracking, save/reset all still work.

### Phase 5: Polish & Cleanup
- Remove old `filter-panel.tsx`
- Test all three tabs (Journeys, Actions, Tasks) with filters
- Verify animations are smooth
- Keyboard accessibility pass
