import {
  Wrench,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Check,
  Circle,
  FileText,
} from "lucide-react";
import { ConfigHotspot } from "@/components/config-overlay";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

type ActionStatus = "In Progress" | "Ready to Begin" | "Draft";

interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  status: ActionStatus;
  date: string;
}

const todayShort = new Date().toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
});

const actions: ActionItem[] = [
  {
    id: "1",
    title: "test",
    subtitle: "Standing Money Movement … · REL_60718…",
    status: "In Progress",
    date: "Apr 18",
  },
  {
    id: "2",
    title: "test",
    subtitle: "Close Financial Acco… · REL_F1D9743D…",
    status: "Ready to Begin",
    date: "Jun 25",
  },
  {
    id: "3",
    title: "Onboard New Client",
    subtitle: "Onboard New Client · Annette Schmitz",
    status: "In Progress",
    date: todayShort,
  },
  {
    id: "4",
    title: "Manage Investment Strategy",
    subtitle: "Quarterly rebalance · REL_4EC1F2BB9C",
    status: "Ready to Begin",
    date: "Apr 22",
  },
];

interface TaskItem {
  id: string;
  title: string;
  status: string;
  refId: string;
  date: string;
  done: boolean;
}

const tasks: TaskItem[] = [
  { id: "1", title: "Add Financial Account to …", status: "Open Financia…", refId: "REL_6D05F…", date: "Apr 11", done: false },
  { id: "2", title: "Add Financial Account to …", status: "Open Financia…", refId: "REL_7F2E8…", date: "Aug 14", done: true },
  { id: "3", title: "Add Financial Account to …", status: "Open Financia…", refId: "REL_7F2E8…", date: "Feb 4", done: true },
  { id: "4", title: "Add Financial Account to …", status: "Open Financia…", refId: "REL_7F2E8…", date: "Dec 19", done: true },
  { id: "5", title: "Add Financial Account to …", status: "Open Financia…", refId: "REL_7F2E8…", date: "Jan 14", done: true },
  { id: "6", title: "Add Financial Account to …", status: "Open Financia…", refId: "REL_7F2E8…", date: "Feb 6", done: true },
  { id: "7", title: "Add Financial Account to …", status: "Open Financia…", refId: "REL_7F2E8…", date: "Feb 8", done: true },
  { id: "8", title: "Add Financial Account to …", status: "Open Financia…", refId: "REL_7F2E8…", date: "Feb 11", done: true },
];

interface InsightItem {
  label: string;
  category: string;
}

const insights: InsightItem[] = [
  { label: "Excess Cash", category: "Financial Accounts" },
  { label: "No Model Assigned", category: "Financial Accounts" },
  { label: "No Schedule Reviews", category: "Relationship Health" },
  { label: "Trade Holds - Orion", category: "Financial Accounts" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getGreeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ActionStatus }) {
  if (status === "In Progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="28"
            strokeDashoffset="8"
          />
        </svg>
        In Progress
      </span>
    );
  }
  if (status === "Ready to Begin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
        </svg>
        Ready to Begin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
      <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="28"
          strokeDashoffset="20"
        />
      </svg>
      Draft
    </span>
  );
}

function CardHeader({
  title,
  count,
  children,
}: {
  title: string;
  count?: number | string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-sm text-[var(--text-secondary)]">
            {typeof count === "number" ? count.toLocaleString() : count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function DropdownButton({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" />
        <rect x="9" y="9" width="5" height="5" rx="1" />
      </svg>
      {label}
      <ChevronDown className="h-3 w-3" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardContent() {
  const today = new Date();

  return (
    <div className="bg-white -mx-8 -mt-8 -mb-4">
      <div className="relative mx-auto max-w-[1280px] px-8 pt-8 pb-4">
        {/* Overall direction + page-level hotspots */}
        <ConfigHotspot
          knobId="platform/landing-route"
          anchor="top-left"
          size="md"
          className="!top-2 !left-2"
        />
        <ConfigHotspot
          knobId="home/page"
          anchor="top-right"
          size="md"
          className="!top-2 !right-2"
        />

        {/* Greeting header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-3xl font-light text-[#3d1f1f]">
              {getGreeting(today)}, Greta
            </h1>
            <p className="text-lg font-light text-[#6b8e6b] mt-0.5">
              {formatLongDate(today)}
            </p>
          </div>
          <div className="relative">
            <button className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary-hover)]">
              Customize
            </button>
            <ConfigHotspot knobId="home/widget-set" anchor="top-right" size="sm" />
          </div>
        </div>

        {/* Role-aware Home — sits above the grid as a cross-cutting knob */}
        <div className="mb-3 flex items-center justify-end">
          <ConfigHotspot
            knobId="home/role-aware"
            anchor="inline"
            size="sm"
            label="Role-aware Home"
          />
        </div>

        {/* 2x2 grid: Meetings | Insights / Actions | Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meetings — top-left */}
          <div className="relative rounded-xl bg-[var(--bg-secondary)]">
            <ConfigHotspot knobId="home/widget-meetings" anchor="top-right" size="sm" area="region" />
            <CardHeader title="Meetings" count={0}>
              <div className="flex items-center gap-1">
                <button className="rounded-md p-1 hover:bg-[var(--bg-tertiary)]">
                  <ChevronLeft className="h-4 w-4 text-[var(--icon-secondary)]" />
                </button>
                <span className="px-2 text-sm font-medium text-[var(--text-primary)]">
                  {formatShortDate(today)}
                </span>
                <button className="rounded-md p-1 hover:bg-[var(--bg-tertiary)]">
                  <ChevronRight className="h-4 w-4 text-[var(--icon-secondary)]" />
                </button>
              </div>
            </CardHeader>
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--bg-tertiary)] mb-3">
                <Calendar className="h-7 w-7 opacity-50" />
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No Meetings Found
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Try a different day or check back soon.
              </p>
            </div>
            <div className="px-6 pb-4 pt-1">
              <button className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                See All Meetings &rsaquo;
              </button>
            </div>
          </div>

          {/* Insights — top-right */}
          <div className="relative rounded-xl bg-[var(--bg-secondary)]">
            <ConfigHotspot knobId="home/widget-insights" anchor="top-right" size="sm" area="region" />
            <CardHeader title="Insights">
              <button className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M8 3v10M5 8h6" />
                  <rect x="2" y="2" width="12" height="12" rx="2" />
                </svg>
                Edit Widget
              </button>
            </CardHeader>
            <div className="px-6 pb-5">
              {insights.map((item, i) => (
                <button
                  key={i}
                  className="flex w-full items-center gap-3 rounded-md py-2.5 text-left hover:bg-[var(--bg-tertiary)] px-2 -mx-2"
                >
                  <FileText className="h-4 w-4 shrink-0 text-[var(--icon-tertiary)]" />
                  <span className="flex-1 text-sm text-[var(--text-primary)]">
                    {item.label}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions — bottom-left */}
          <div className="relative rounded-xl bg-[var(--bg-secondary)]">
            <ConfigHotspot knobId="home/widget-actions" anchor="top-right" size="sm" area="region" />
            <ConfigHotspot knobId="home/widgets-as-links" anchor="bottom-right" size="sm" />
            <CardHeader title="Actions" count={actions.length}>
              <DropdownButton label="All Open" />
            </CardHeader>
            <div className="px-6 pb-2">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                    <Wrench className="h-4 w-4 text-[var(--icon-secondary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {action.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {action.subtitle}
                    </p>
                  </div>
                  <StatusBadge status={action.status} />
                  <span className="shrink-0 text-xs text-[var(--text-tertiary)] w-12 text-right">
                    {action.date}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-4 pt-1">
              <button className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                See All Actions &rsaquo;
              </button>
            </div>
          </div>

          {/* Tasks — bottom-right */}
          <div className="relative rounded-xl bg-[var(--bg-secondary)]">
            <ConfigHotspot knobId="home/widget-tasks" anchor="top-right" size="sm" area="region" />
            <CardHeader title="Tasks" count={1}>
              <DropdownButton label="Ready to Begin" />
            </CardHeader>
            <div className="px-6 pb-2">
              {tasks.slice(0, 1).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 border-b border-border/50 py-2.5 last:border-b-0"
                >
                  <div className="shrink-0">
                    {task.done ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-[var(--icon-tertiary)]" strokeWidth={1.5} />
                    )}
                  </div>
                  <span className="text-sm text-[var(--text-primary)] truncate">
                    {task.title}
                  </span>
                  <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-[var(--icon-tertiary)]" />
                  <span className="text-xs text-[var(--text-secondary)] truncate flex-1">
                    {task.status}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--text-tertiary)] tabular-nums">
                    {task.refId}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--text-tertiary)] w-12 text-right">
                    {task.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
