import { useState } from "react";
import {
  Route,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  ClipboardList,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface ActionItem {
  id: string;
  title: string;
  description: string;
  refId: string;
  status: "In Progress" | "Draft";
  date: string;
}

const actions: ActionItem[] = [
  {
    id: "1",
    title: "Untitled Action",
    description: "Schwab Account Ope...",
    refId: "001Dn00000SA4I...",
    status: "In Progress",
    date: "Oct 3",
  },
  {
    id: "2",
    title: "Untitled Action",
    description: "Manage Investment Strategy",
    refId: "REL_86E0554BBE",
    status: "Draft",
    date: "Oct 31",
  },
  {
    id: "3",
    title: "Untitled Action",
    description: "Manage Investment Strategy",
    refId: "REL_156AEB0EB0",
    status: "Draft",
    date: "Nov 12",
  },
  {
    id: "4",
    title: "Untitled Action",
    description: "Manage Cash or Pla...",
    refId: "George and Patrici...",
    status: "In Progress",
    date: "Aug 11",
  },
  {
    id: "5",
    title: "Untitled Action",
    description: "Manage Investment Strategy",
    refId: "REL_C689072A23",
    status: "Draft",
    date: "Nov 10",
  },
  {
    id: "6",
    title: "Untitled Action",
    description: "Testing Action - Account Ope...",
    refId: "REL_438E...",
    status: "In Progress",
    date: "Nov 7",
  },
  {
    id: "7",
    title: "Untitled Action",
    description: "Close Financial Account",
    refId: "REL_54606C0718",
    status: "In Progress",
    date: "Oct 9",
  },
  {
    id: "8",
    title: "Untitled Action",
    description: "Manage Dollar Cost Averaging...",
    refId: "REL_86E0554...",
    status: "Draft",
    date: "Nov 11",
  },
  {
    id: "9",
    title: "Untitled Action",
    description: "Close Financial Account",
    refId: "REL_54606C0718",
    status: "In Progress",
    date: "Oct 9",
  },
  {
    id: "10",
    title: "Untitled Action",
    description: "Manage Investment Strategy",
    refId: "REL_56A49B0E80",
    status: "Draft",
    date: "Nov 11",
  },
];

interface GrowthItem {
  id: string;
  name: string;
  refId: string;
  status: string;
}

const growthItems: GrowthItem[] = [
  {
    id: "1",
    name: "Aaron Allan-Referral-2026-23-14",
    refId: "REL_4EC1F2BB9C",
    status: "Qualified Opportunity",
  },
  {
    id: "2",
    name: "Aaron Allan-Referral-2026-24-04",
    refId: "REL_4EC1F2BB9C",
    status: "Qualified Opportunity",
  },
  {
    id: "3",
    name: "Aaron Allan-Referral-2026-25-04",
    refId: "REL_4EC1F2BB9C",
    status: "Qualified Opportunity",
  },
  {
    id: "4",
    name: "Aaron Allan-Referral-2026-30-05",
    refId: "REL_4EC1F2BB9C",
    status: "Qualified Opportunity",
  },
  {
    id: "5",
    name: "Aaron Allan-Referral-2026-47-04",
    refId: "REL_4EC1F2BB9C",
    status: "Qualified Opportunity",
  },
  {
    id: "6",
    name: "Aaron Allan-Referral-2026-47-04",
    refId: "REL_4EC1F2BB9C",
    status: "Qualified Opportunity",
  },
  {
    id: "7",
    name: "Aaron Allan-Referral-2026-47-04",
    refId: "REL_4EC1F2BB9C",
    status: "Qualified Opportunity",
  },
  {
    id: "8",
    name: "Aaron Allan-Referral-2026-49-04",
    refId: "REL_4EC1F2BB9C",
    status: "Qualified Opportunity",
  },
  {
    id: "9",
    name: "Aaron Allan-Referral-2026-50-20",
    refId: "REL_4EC1F2BB9C",
    status: "Qualified Opportunity",
  },
];

interface InsightItem {
  label: string;
  category: string;
  color: string;
}

const insights: InsightItem[] = [
  { label: "Excess Cash", category: "Financial Accounts", color: "#e85526" },
  {
    label: "No Model Assigned",
    category: "Financial Accounts",
    color: "#e85526",
  },
  {
    label: "No Schedule Reviews",
    category: "Relationship Health",
    color: "#0d3f5e",
  },
  {
    label: "Trade Holds - Envestnet",
    category: "Financial Accounts",
    color: "#e85526",
  },
  {
    label: "Trade Holds - Orion",
    category: "Financial Accounts",
    color: "#e85526",
  },
  {
    label: "New Distributions",
    category: "Financial Accounts",
    color: "#e85526",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: "In Progress" | "Draft" }) {
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
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-sm text-[var(--text-secondary)]">{count.toLocaleString()}</span>
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
  const [growthTab, setGrowthTab] = useState<"referral" | "consolidation">(
    "referral"
  );

  return (
    <div className="min-h-full bg-[var(--bg-secondary)] -m-8">
      {/* Decorative wavy background */}
      <div className="pointer-events-none absolute inset-x-0 top-14 h-56 overflow-hidden opacity-[0.04]">
        <svg viewBox="0 0 1440 200" className="w-full h-full" preserveAspectRatio="none">
          {Array.from({ length: 8 }).map((_, i) => (
            <path
              key={i}
              d={`M0,${20 + i * 24} C360,${60 + i * 24} 720,${-10 + i * 24} 1440,${30 + i * 24}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1280px] px-8 py-8">
        {/* Greeting header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-[#3d1f1f]">
              Good afternoon, Greta
            </h1>
            <p className="text-lg font-light text-[#6b8e6b] mt-0.5">
              Wednesday, April 1
            </p>
          </div>
          <button className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary-hover)]">
            Customize
          </button>
        </div>

        {/* Main grid: left (Actions + Tasks) / right (Meetings + Growth) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            {/* Actions card */}
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <CardHeader title="Actions" count={13287}>
                <DropdownButton label="Default" />
              </CardHeader>
              <div className="px-6 pb-2">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                      <Route className="h-4 w-4 text-[var(--icon-secondary)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {action.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {action.description} &bull; {action.refId}
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

            {/* Tasks card */}
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <CardHeader title="Tasks" count={0}>
                <DropdownButton label="All Actions" />
              </CardHeader>
              <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
                <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No Tasks</p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Meetings card */}
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <CardHeader title="Meetings" count={0}>
                <div className="flex items-center gap-1">
                  <button className="rounded-md p-1 hover:bg-[var(--bg-secondary)]">
                    <ChevronLeft className="h-4 w-4 text-[var(--icon-secondary)]" />
                  </button>
                  <span className="px-2 text-sm font-medium text-[var(--text-primary)]">
                    Apr 1
                  </span>
                  <button className="rounded-md p-1 hover:bg-[var(--bg-secondary)]">
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
            </div>

            {/* Growth card */}
            <div className="rounded-xl border border-border bg-white shadow-sm">
              <CardHeader title="Growth" count={14}>
                <DropdownButton label="All" />
              </CardHeader>

              {/* Tabs */}
              <div className="flex gap-0 border-b border-border px-6">
                <button
                  className={`relative px-3 pb-2 text-sm font-medium transition-colors ${
                    growthTab === "referral"
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                  onClick={() => setGrowthTab("referral")}
                >
                  Referral
                  {growthTab === "referral" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
                  )}
                </button>
                <button
                  className={`relative px-3 pb-2 text-sm font-medium transition-colors ${
                    growthTab === "consolidation"
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                  onClick={() => setGrowthTab("consolidation")}
                >
                  Consolidation
                  {growthTab === "consolidation" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />
                  )}
                </button>
              </div>

              {/* Growth items */}
              <div className="px-6 pb-2">
                {growthItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3eef8]">
                      <TrendingUp className="h-4 w-4 text-[#7c5caa]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        No next steps &bull; {item.refId}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full whitespace-nowrap text-[11px] font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-4 pt-1">
                <button className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  See All Growth Opportunities &rsaquo;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Insights card — full width */}
        <div className="mt-6 rounded-xl border border-border bg-white shadow-sm">
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
              <div
                key={i}
                className="flex items-center gap-3 py-2"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-[var(--text-primary)]">
                  {item.label}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
