# Workflow Lifecycle

The platform tracks the status of every action and task through a defined set of statuses, each with clear transition rules. Actions move through statuses automatically as tasks are completed, and the platform derives standing indicators (On Track, At Risk, Overdue, etc.) in real time. Organizations that need more granular tracking can define custom status workflows with their own states, transition rules, and display colors.

---

## Feature overview

### Action statuses

Every action has one of 11 statuses that reflect where it is in its lifecycle:

| Status | What It Means |
|--------|-------------- |
| Draft | The action has been created but initial setup is not yet complete. |
| Recommended | The platform's AI has recommended this action based on meeting outcomes or client data. Awaiting approval or decline. |
| Snoozed | The action has been scheduled to start on a future date. It will automatically become "Ready to Begin" when that date arrives. |
| Ready to Begin | All prerequisites are met. The action is available for someone to claim or start. |
| In Progress | At least one task within the action is actively being worked on. |
| Completed | All tasks are finished. The action is closed. |
| Cancelled | The action was cancelled by a user. A cancellation reason is recorded. |
| Pending Cancellation | Cancellation has been requested, but one or more in-progress tasks need to wrap up first. |
| Declined | A recommended action was declined by a user. A decline reason is recorded. |
| Failed | A system error occurred during processing. |
| Queued | The action is waiting for prerequisite conditions to be met before it can begin. |

### How actions move between statuses

Actions transition automatically based on what happens with their tasks:

| From | To | What Triggers It |
|------|----|-----------------|
| Draft | Snoozed | Setup is complete and a future start date is set |
| Draft | Ready to Begin | Setup is complete with no future start date |
| Ready to Begin | In Progress | The first task is started or auto-completed |
| In Progress | Completed | All tasks are finished |
| Ready to Begin or In Progress | Pending Cancellation | A user requests cancellation |
| Pending Cancellation | Cancelled | All in-progress tasks finish their cancellation |
| Draft (Recommended) | Declined | A user declines the AI recommendation |
| Any active status | Failed | A system error occurs |

### Task statuses

Every task has one of 10 statuses:

| Status | What It Means |
|--------|-------------- |
| Ready to Begin | The task is available to be claimed or started. |
| In Progress | Someone is actively working on this task. |
| Waiting | The task is paused because the assignee is waiting on someone or something (e.g., waiting on the client, a custodian, or an upcoming meeting). |
| Pending Approval | The submission is complete and waiting for a reviewer to approve or reject it. |
| Completed | The task is finished. |
| Cancelled | The task was cancelled. |
| Declined | A review task was rejected — the work was sent back to the submitter. |
| Scheduled | The task is scheduled to start on a future date. |
| Queued | The task is waiting for prerequisite tasks in the sequence to complete. |
| Pending Cancellation | Cancellation has been requested for this task. |

### Key task transitions

For submission tasks:

| From | To | What Triggers It |
|------|----|-----------------|
| Queued | Ready to Begin | Prerequisite tasks complete |
| Ready to Begin | In Progress | The assignee starts the task |
| In Progress | Waiting | The assignee marks the task as waiting |
| Waiting | In Progress | The assignee marks the task as no longer waiting |
| In Progress | Pending Approval | The assignee submits the form |
| Pending Approval | Completed | The reviewer approves |
| Pending Approval | Ready to Begin | The reviewer rejects (sends back for revision) |

For review tasks:

| From | To | What Triggers It |
|------|----|-----------------|
| Queued | In Progress | The submission task moves to Pending Approval |
| In Progress | Completed | The reviewer approves |
| In Progress | Declined | The reviewer rejects |

### The claim-start-submit-approve cycle

The most common workflow path through a task:

1. **Claim** — An eligible team member claims an unassigned task (or a manager assigns it).
2. **Start** — The assignee begins working. The task moves to "In Progress."
3. **Work** — The assignee fills out forms, enters data, or uploads documents. They can save drafts at any time. If they need to pause, they can mark the task as "Waiting" with a reason.
4. **Submit** — The assignee submits the completed work. If the step requires approval, the task moves to "Pending Approval."
5. **Approve or Reject** — A reviewer examines the submission. They either approve it (moving it to "Completed") or reject it with feedback (sending it back to the submitter for revision).

### Custom status workflows

Beyond the built-in statuses, organizations can define custom status workflows for specific action types. This is a configurable system that allows:

- **Custom states** — Define any number of business-specific states (e.g., "Awaiting Client Signature," "Under Legal Review," "Pending Custodian Transfer") with display names and colors.
- **Transition rules** — Specify which states can lead to which other states, creating a controlled workflow that matches the organization's process.
- **Automatic triggers** — Transitions can fire automatically based on five types of events:
  - A task reaching a specific status (e.g., when the "Client Signature" task is completed, move to "Signature Received")
  - A form step reaching a specific status
  - The action itself reaching a specific status
  - Another custom status change occurring
  - An external system calling the API
- **Submission restrictions** — Certain form steps can be locked until the action reaches a specific custom status (e.g., the "Final Processing" form only becomes available when the custom status reaches "All Approvals Complete").
- **Progress tracking** — Every custom status transition is recorded with a timestamp, who or what triggered it, and the previous state.
- **Display customization** — Each custom state has a configurable display name and color (Neutral, Positive, Warning, Critical, or Primary).

Custom statuses appear alongside the built-in workflow status, giving teams both the system-level tracking (where is this in the workflow?) and the business-level tracking (what business milestone has this reached?).

### Snooze, cancel, decline, and clone

- **Snooze** — Schedule an action to begin on a future date. The action sits in "Snoozed" status until the date arrives, then automatically moves to "Ready to Begin."
- **Cancel** — Cancel an action at any point (requires a reason). The platform handles graceful cancellation — in-progress tasks complete their cancellation before the action fully closes.
- **Decline** — When AI recommends an action, users can decline it with a reason. The recommendation and decline reason are both recorded.
- **Approve** — Accept an AI-recommended action to start the workflow.
- **Clone** — Duplicate an existing action as a single copy or in bulk, useful for repeating similar workflows.

---

## Data points

### Action status data

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Status | Current workflow status of the action | In Progress | System-computed |
| Custom Status | Business-level status from custom workflow rules | "Awaiting Client Signature" | Custom status configuration |
| Custom Status Display Color | Visual indicator for the custom status | Warning (yellow) | Custom status configuration |
| Standing | Derived progress indicator based on deadlines | On Track | Computed (see SLAs page) |

### Task status data

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Status | Current workflow status of the task | Pending Approval | System-computed |
| Standing | Derived progress indicator for the task | Due Today | Computed |
| Waiting On | Who or what the task is waiting for (when paused) | Client | User-selected |
| Waiting For | Free-text description of what is needed | "Signed IPS document" | User-entered |
| Total Time Waiting | Cumulative time spent in waiting status | 2 days, 4 hours | System-computed |

### Lifecycle timestamps

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Created | When the action or task was created | Mar 15, 2026 at 9:00 AM | System-recorded |
| Suggested Start | Scheduled future start date | Mar 20, 2026 | User-entered |
| Started | When work actually began | Mar 16, 2026 at 10:30 AM | System-recorded |
| Ready to Begin | When a task became available for work | Mar 15, 2026 at 4:00 PM | System-recorded |
| Completed | When the action or task finished | Mar 22, 2026 at 3:15 PM | System-recorded |
| Cancelled Date | When cancellation occurred | Mar 19, 2026 at 11:00 AM | System-recorded |
| Declined Date | When an AI recommendation was declined | Mar 17, 2026 at 2:00 PM | System-recorded |

### Custom status tracking data

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Current State | The active custom status | "Under Legal Review" | Custom status engine |
| Current State Display Name | Human-readable label for the state | "Under Legal Review" | Custom status configuration |
| Current State Color | Visual indicator | Warning | Custom status configuration |
| Is Required State | Whether the action must pass through this state | Yes | Custom status configuration |
| Is Final State | Whether this is a terminal state | No | Custom status configuration |

### Audit trail — status change log

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Changed By | Who triggered the status change | Jane Williams (or "System") | System-recorded |
| Previous Status | Status before the change | Ready to Begin | System-recorded |
| New Status | Status after the change | In Progress | System-recorded |
| Previous Custom Status | Custom status before the change (if applicable) | "Pending Signatures" | System-recorded |
| New Custom Status | Custom status after the change (if applicable) | "Signatures Received" | System-recorded |
| Timestamp | When the change occurred | Mar 16, 2026 at 10:30 AM | System-recorded |
| Additional Context | Extra detail such as cancellation reason | "Client withdrew request" | System-recorded |

### Audit trail — custom status transitions

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| From State | The state before the transition | "Pending Signatures" | System-recorded |
| To State | The state after the transition | "Signatures Received" | System-recorded |
| Transition Name | Which transition rule fired | "Signatures Complete" | System-recorded |
| Trigger Type | What caused the transition | Task completed | System-recorded |
| Triggered By | Who or what initiated it | Jane Williams | System-recorded |
| Timestamp | When the transition occurred | Mar 18, 2026 at 2:15 PM | System-recorded |

---

## Customization options

| Setting | What It Controls | Options | Default | Who Configures |
|---------|-----------------|---------|---------|----------------|
| Custom Status Workflow | Adds business-level status tracking alongside built-in statuses | Any number of custom states with names, colors, and descriptions | No custom workflow | Administrator (per blueprint) |
| Custom States | The possible business-level statuses an action can have | Unlimited custom states, each with a display name, description, color, and required/final flags | — | Administrator (per blueprint) |
| State Display Colors | Visual indicator for each custom state | Neutral, Positive, Warning, Critical, Primary | Neutral | Administrator (per state) |
| Transition Rules | Which states can lead to which other states | Custom transition map with from-states, to-state, and priority | — | Administrator (per blueprint) |
| Automatic Triggers | What causes custom status transitions to fire | Task status change, Form step status change, Action status change, Custom status change, External API call | No automatic triggers | Administrator (per transition) |
| Transition Conditions | Additional rules that must be met for a transition to fire | Custom expressions evaluated at transition time | No conditions (trigger is sufficient) | Administrator (per transition) |
| Transition Actions | What happens when a transition fires | Custom actions executed on transition | No additional actions | Administrator (per transition) |
| Submission Restrictions | Which custom statuses allow form submission on a given step | Any subset of defined custom statuses | All statuses allow submission | Administrator (per blueprint step) |
| Initial State | Which custom status an action starts in | Any defined state | First defined state | Administrator (per blueprint) |

---

## Related

- [Actions & Tasks](./actions-and-tasks.md) — What actions and tasks are, step types, and assignment methods
- Journeys — Multi-action workflows and how journey statuses derive from child actions
- SLAs, Deadlines & Compliance — How deadlines, standing, and business day calculations work
