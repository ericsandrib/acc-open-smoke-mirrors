# Actions & Tasks

Actions are the platform's core unit of client servicing work. Each action represents a complete workflow — such as onboarding a new client, processing an account transfer, or completing a compliance review. Actions are made up of individual tasks that must be completed in sequence. Tasks come in two types: submission tasks (where someone fills out a form or enters data) and review tasks (where someone approves or rejects what was submitted).

---

## Feature overview

### What is an action?

An action is a structured, multi-step workflow created from a published action blueprint (a reusable template). When someone creates an action, the platform generates the full sequence of tasks, assigns deadlines based on SLA rules, and tracks the work from start to finish.

Each action is linked to a client relationship and categorized by type (e.g., "Onboarding," "Account Maintenance," "Compliance Review"). Administrators define action categories to match their business processes — categories are free-form, not a fixed list, so organizations can create whatever categories they need.

### What is a task?

A task is a single step within an action. There are two types:

- **Submission tasks** — The assignee fills out a form, enters data, or uploads documents, then submits the work.
- **Review tasks** — A reviewer examines what was submitted and either approves it or sends it back with feedback. Review tasks are created automatically when a step requires approval.

### Step types in action blueprints

Action blueprints are built from different step types that control how work flows:

| Step Type | What It Does |
|-----------|-------------|
| Form | A user-facing form that creates submission and (optionally) review tasks |
| Configuration | An initial setup form completed before the action begins |
| Conditional Branch | Routes work down different paths based on data or conditions |
| External Trigger | Connects to an external system or fires a webhook |
| Nested Action | Embeds another action blueprint as a sub-workflow |
| Loop | Repeats a set of steps for each item in a collection |
| Status Gate | Pauses the workflow until a custom status condition is met |

### Action detail view

The action detail page uses a three-panel layout:

- **Task tracker** — A vertical step-by-step view showing all tasks in order, with each step displaying the task name, assignee, date, and status. Review tasks appear as sub-steps beneath their corresponding submission tasks.
- **Active task content** — The working area where the assignee fills out forms (for submission tasks) or reviews and approves/rejects work (for review tasks).
- **Action sidebar** — Shows the action header, task assignment list, and (when enabled) pre-assignment controls for upcoming tasks.

### Task lifecycle at a glance

The task footer adapts to show the right actions at each stage:

| Stage | What the User Sees |
|-------|-------------------|
| Unclaimed | **Claim & Start** — assigns the task to the current user and begins work |
| Claimed but not started | **Start Task** — begins work on the assigned task |
| Scheduled | **Reschedule** — change the scheduled start date |
| In progress (submission) | **Submit** and **Save** — submit completed work or save a draft |
| In progress (review) | **Approve** and **Reject** — approve the submission or send it back |
| Waiting | **Mark as Not Waiting** — resume the task |
| Pending approval | **Next** — navigate to the review task |
| Completed | **Done** or navigate to the next task |
| Queued | Blocked indicator — waiting for prerequisite tasks |

### Assignment

The platform supports four methods for assigning tasks to team members:

1. **Self-claiming** — Any eligible user (matching the required role) can claim an unassigned task and start working on it immediately.
2. **Manual assignment** — A manager or team lead assigns tasks to specific people, either one at a time or in bulk using the bulk transfer capability.
3. **Auto-assignment** — The system automatically assigns tasks based on rules configured in the blueprint. Three strategies are available:
   - **By client role** — Assigns to the team member who holds a specific role for that client (e.g., the client's primary advisor).
   - **By primary email** — Assigns to a specific team member identified by email address.
   - **By form field** — Assigns based on an email address entered in a previous form step.
4. **Pre-assignment** — Team leads can designate owners for future tasks that haven't been created yet, so work is assigned as soon as it becomes available. Auto-assignment rules are configured separately for submission and review tasks.

Assignment is best-effort for auto-assignment — if the designated person cannot be found, the task remains unassigned rather than blocking the workflow.

### Additional action capabilities

- **Snooze** — Schedule an action to start on a future date. The action moves to "Snoozed" status and automatically becomes "Ready to Begin" when the date arrives.
- **Cancel** — Cancel an action with a required reason. In-progress tasks complete their cancellation before the action fully closes.
- **Decline** — Decline a recommended action with a reason (for AI-recommended actions).
- **Approve** — Accept a recommended action to begin the workflow.
- **Clone** — Duplicate an action, either as a single copy or in bulk.
- **Rename** — Edit the action nickname at any time.
- **Locking** — The platform prevents concurrent edits with a 5-minute automatic lock when someone is working on an action.

---

## Data points

### Action-level data

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Action ID | Unique identifier for the action | ACT-2024-00347 | System-generated |
| Action Nickname | User-defined name for quick reference | "Smith Family Onboarding" | User-entered |
| Status | Current workflow status of the action | In Progress | System-computed |
| Category | Business category the action belongs to | Account Maintenance | Blueprint configuration |
| Action Type | The blueprint template this action was created from | New Account Opening | Blueprint configuration |
| Description | Summary of what this action covers | "Transfer of assets from Fidelity to Schwab" | Blueprint configuration |
| Creator | The person who created this action | Jane Williams | System-recorded |
| Relationship | The client this action is for | Acme Financial Group | Linked from relationship |
| Relationship Type | Type of the linked client | Individual | Linked from relationship |
| Market | Market segment of the linked client | Northeast | Linked from relationship |
| AUM | Approximate assets under management for the client | $2,450,000 | Linked from relationship |
| Recommended | Whether AI recommended this action | Yes | System/AI |
| Recommended By | Who recommended this action | Meeting AI Assistant | System-recorded |
| Created | When the action was created | Mar 15, 2026 at 9:00 AM | System-recorded |
| Suggested Start | Scheduled future start date (snooze date) | Mar 20, 2026 | User-entered |
| Started | When work actually began | Mar 16, 2026 at 10:30 AM | System-recorded |
| Completed | When all tasks were finished | Mar 22, 2026 at 3:15 PM | System-recorded |
| Due | Deadline based on SLA configuration | Mar 25, 2026 | Computed from SLAs |
| Expected Completion | Forecast of when remaining work will finish | Mar 23, 2026 | Computed from remaining SLAs |
| Next Step | Earliest upcoming date from active tasks | Mar 18, 2026 | Computed |
| Time Until Due | Relative countdown to the deadline | In 3 days | Computed |
| Standing | Overall progress indicator | On Track | Computed from deadlines |
| Custom Status | Business-level status from custom workflow rules | "Awaiting Client Signature" | Custom status configuration |
| Cancelled Date | When the action was cancelled | Mar 19, 2026 at 11:00 AM | System-recorded |
| Cancelled By | Who cancelled the action | John Davis | System-recorded |
| Reason Cancelled | Explanation for the cancellation | "Client withdrew request" | User-entered |
| Declined Date | When the recommendation was declined | Mar 17, 2026 at 2:00 PM | System-recorded |
| Declined By | Who declined the recommendation | Sarah Chen | System-recorded |
| Reason Declined | Explanation for declining | "Already in progress through another channel" | User-entered |
| NCSS Coverage | Whether the client has national coverage | Yes | Linked from relationship |
| UHNW Service Team | Whether the client is serviced by the UHNW team | No | Linked from relationship |
| Financial Account Number | Account number associated with this action | 1234-5678-90 | Form data |
| Custodian | Custodian associated with this action | Charles Schwab | Form data |
| Client Service Director | Assigned client service director | Michael Torres | Linked from relationship roles |
| Primary Wealth Advisor | Assigned wealth advisor | Lisa Park | Linked from relationship roles |
| Locked By | Who is currently editing this action | Jane Williams | System-recorded |

### Task-level data

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Task Name | Name of this step in the workflow | "Complete Client Information Form" | Blueprint configuration |
| Task Owner | Person assigned to complete this task | Jane Williams | Assigned or auto-assigned |
| Status | Current status of the task | In Progress | System-computed |
| Task Type | Whether this is a submission or review task | Submission | Blueprint configuration |
| Task Role | Role(s) required to work on this task | Client Service Associate | Blueprint configuration |
| Section Name | Grouping label in the task tracker | "Client Details" | Blueprint configuration |
| Due | Task-level deadline | Mar 20, 2026 | Computed from SLA |
| SLA Duration | Time allocated for this task | 3 business days | Blueprint configuration |
| Scheduled Start | When this task is scheduled to begin | Mar 18, 2026 | User-entered |
| Started | When work began on this task | Mar 18, 2026 at 9:15 AM | System-recorded |
| Ready to Begin | When this task became available for work | Mar 17, 2026 at 4:00 PM | System-recorded |
| Next Step | Date when the waiting period ends | Mar 19, 2026 | User-entered |
| Completed | When this task was finished | Mar 19, 2026 at 2:30 PM | System-recorded |
| Completed By | Who completed this task | Jane Williams | System-recorded |
| Cancelled Date | When this task was cancelled | — | System-recorded |
| Cancelled By | Who cancelled this task | — | System-recorded |
| Reason Cancelled | Explanation for task cancellation | — | User-entered |
| Waiting On | Who or what the task is waiting for | Client | User-selected |
| Waiting For | Free-text description of what is needed | "Waiting for signed IPS document" | User-entered |
| Note | Additional context about the task state | "Left voicemail with client on 3/18" | User-entered |
| Tags | Labels applied to the task | "priority", "escalated" | Blueprint configuration |
| Can Begin | Whether the current user is eligible to work on this task | Yes | Computed from role matching |
| Total Time Waiting | Cumulative time spent in waiting status | 2 days, 4 hours | System-computed |
| Rejection Reason | Why a reviewer rejected this task | "Missing beneficiary designation" | User-entered (reviewer) |
| Priority | Task priority level | High | Blueprint configuration |

### Waiting On options

When a task is paused, the user selects who or what they are waiting for:

| Option | Description |
|--------|-------------|
| Client | Waiting for the client to provide information or take action |
| Custodian | Waiting for the custodian to process a request |
| Team Member | Waiting for an internal team member |
| Upcoming Meeting | Waiting for a scheduled meeting to occur |
| SMA Manager | Waiting for a separately managed account manager |
| External Party | Waiting for any other external party |

---

## Customization options

| Setting | What It Controls | Options | Default | Who Configures |
|---------|-----------------|---------|---------|----------------|
| Action Categories | How actions are grouped and filtered | Free-form text — organizations define their own categories | None predefined | Administrator |
| Action Blueprints | Available action types and their step sequences | Unlimited custom blueprints with any combination of step types | Organization-specific | Administrator |
| Step Types | What kind of work each step requires | Form, Configuration, Conditional Branch, External Trigger, Nested Action, Loop, Status Gate | — | Administrator (at blueprint design time) |
| Approval Required | Whether a form step requires a review/approval task | Yes or No per step | No | Administrator (per blueprint step) |
| Task Roles | Which roles are eligible to work on each task | Any combination of defined roles per step | All roles | Administrator (per blueprint step) |
| Auto-Assignment | How tasks are automatically assigned | By client role, By primary email, By form field email, or disabled | Disabled | Administrator (per blueprint step) |
| Auto-Assignment for Reviews | Separate assignment rules for review tasks | Same three strategies as submission tasks | Disabled | Administrator (per blueprint step) |
| Pre-Assignment | Whether team leads can assign owners for future tasks | Enabled or Disabled (feature flag) | Disabled | Platform administrator |
| SLA Duration | Time allocated for completing a submission task | Any duration in minutes, hours, or days | No SLA (no deadline) | Administrator (per blueprint step) |
| Approval SLA Duration | Time allocated for completing a review task | Any duration in minutes, hours, or days | No SLA (no deadline) | Administrator (per blueprint step) |
| Custom Status Workflow | Business-level status tracking with custom transition rules | Custom states, transitions, display colors, and submission restrictions | No custom status | Administrator (per blueprint) |
| Allowed Submission States | Which custom statuses allow form submission | Any subset of defined custom statuses | All states allow submission | Administrator (per blueprint step) |
| Snooze | Whether actions can be scheduled for a future start date | Enabled or Disabled (feature flag) | Enabled | Platform administrator |
| Action Locking | Prevents concurrent edits to the same action | Automatic 5-minute lock | Enabled | Platform (not configurable) |

---

## Related

- [Workflow Lifecycle](./workflow-lifecycle.md) — Status definitions, transition rules, and how work progresses through the platform
- Journeys — Multi-action workflows that orchestrate sequences of actions
- SLAs, Deadlines & Compliance — How the platform calculates deadlines, tracks standing, and maintains audit trails
