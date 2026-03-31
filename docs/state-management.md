# State Management

Three context-based stores, each with a provider and hook.

## WorkflowStore

**File:** `src/stores/workflowStore.tsx`
**Hook:** `useWorkflow()` returns `{ state, dispatch }`

### State shape

| Field | Type | Description |
|-------|------|-------------|
| `actions` | `Action[]` | The 3 workflow actions (Collect Client Data, KYC, Account Opening) |
| `tasks` | `Task[]` | All parent tasks with optional `children` array for KYC |
| `relatedParties` | `RelatedParty[]` | Household members, contacts, organizations |
| `financialAccounts` | `FinancialAccount[]` | Accounts under management |
| `activeTaskId` | `string` | Currently displayed task or child |
| `flatTaskOrder` | `string[]` | Linear navigation order (parents + children) |
| `taskData` | `Record<string, Record<string, unknown>>` | Form data keyed by task ID |
| `journeyName` | `string?` | Name of the current journey |
| `journeyId` | `string?` | ID assigned when initialized from a relationship |

### Reducer actions

**Navigation**
| Action | Behavior |
|--------|----------|
| `SET_ACTIVE_TASK` | Switch to a task. Validates the ID exists in `flatTaskOrder`. |
| `GO_NEXT` | Advance to the next entry in `flatTaskOrder`. |
| `GO_BACK` | Go to the previous entry in `flatTaskOrder`. |

**Task lifecycle**
| Action | Behavior |
|--------|----------|
| `SET_TASK_STATUS` | Set status on a parent or child task. |
| `CONFIRM_TASK` | Move an `in_progress` task to `complete`. |
| `REOPEN_TASK` | Move a `complete` task back to `in_progress`. |

**KYC children**
| Action | Behavior |
|--------|----------|
| `SPAWN_KYC_CHILD` | Add a child to the parent task's `children` array. Recomputes `flatTaskOrder`. |
| `REMOVE_KYC_CHILD` | Remove a child. Recomputes `flatTaskOrder`. If the removed child was active, falls back to the parent. Cleans up `taskData` for the removed child. |

**Related parties**
| Action | Behavior |
|--------|----------|
| `ADD_RELATED_PARTY` | Append a new party. |
| `UPDATE_RELATED_PARTY` | Shallow-merge updates into an existing party. |
| `SET_PRIMARY_MEMBER` | Designate a household member as primary (only one at a time). |
| `REMOVE_RELATED_PARTY` | Soft-delete (sets `isHidden: true`). Blocked if the party is primary. |
| `RESTORE_RELATED_PARTIES` | Un-hide a set of party IDs. |

**Financial accounts**
| Action | Behavior |
|--------|----------|
| `ADD_FINANCIAL_ACCOUNT` | Append a new account. |
| `UPDATE_FINANCIAL_ACCOUNT` | Shallow-merge updates. |
| `REMOVE_FINANCIAL_ACCOUNT` | Hard-delete from the array. |

**Form data**
| Action | Behavior |
|--------|----------|
| `SET_TASK_DATA` | Shallow-merge fields into `taskData[taskId]`. Side effect: if the task's status is `not_started`, auto-transitions to `in_progress`. |

**Initialization**
| Action | Behavior |
|--------|----------|
| `INITIALIZE_FROM_RELATIONSHIP` | Reset the entire workflow with fresh tasks, provided related parties, financial accounts, and pre-filled client info. Assigns a `journeyId`. |

### useTaskData hook

`useTaskData(taskId)` returns `{ data, updateField, updateFields }` for convenient form binding. Dispatches `SET_TASK_DATA` under the hood.

---

## ServicingStore

**File:** `src/stores/servicingStore.tsx`
**Hook:** `useServicing()` returns `{ journeys, allActions, allTasks, currentLiveJourney, saveCurrentJourney }`

### Data sources

The journeys list is built from three sources merged at render time:

1. **Saved journeys** — previously active workflows saved via `saveCurrentJourney()` (in-memory, lost on refresh)
2. **Seeded journeys** — 4 pre-built journeys from `src/data/servicingSeed.ts` at various completion stages
3. **Live journey** — derived in real-time from the current `WorkflowState` via `deriveLiveJourney()`

### deriveLiveJourney

Transforms the active workflow into a `Journey` by:
- Finding the primary related party for the relationship name
- Mapping each action's tasks into `JourneyTask` objects
- Deriving journey status: all complete → `complete`, any started → `in_progress`, else `not_started`

Returns `null` if no `journeyId` is set (no relationship has been selected).

### Flattened views

`allActions` and `allTasks` are computed by flatMapping across all journeys, used by the Servicing page's Actions and Tasks tabs.

---

## ThemeStore

**File:** `src/stores/themeStore.tsx`
**Hook:** `useTheme()` returns `{ theme, toggleTheme }`

- Reads initial value from `localStorage`, falls back to `prefers-color-scheme: dark`
- Toggles the `dark` class on `document.documentElement`
- Persists choice to `localStorage`
