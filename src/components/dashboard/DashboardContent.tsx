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
// Mock data — Zions POC instance (Spec 007 Phase 3)
// ---------------------------------------------------------------------------

interface ActionItem {
  id: string;
  title: string;
  description: string;
  refId: string;
  status: "In Progress" | "Draft";
  date: string;
}

function getMeaningfulActionTitle(action: ActionItem): string {
  const currentTitle = action.title.trim();
  if (currentTitle && currentTitle.toLowerCase() !== "untitled action") {
    return currentTitle;
  }

  const rawDescription = action.description.replace(/\.\.\.$/, "").trim();
  if (!rawDescription) {
    return "Client Servicing Action";
  }

  const normalized = rawDescription.toLowerCase();
  if (normalized.includes("account ope")) return "Account Opening";
  if (normalized.includes("close financial account")) return "Account Closure";
  if (normalized.includes("investment strategy")) return "Investment Strategy Update";
  if (normalized.includes("cash")) return "Cash Management Update";
  if (normalized.includes("dollar cost averag")) return "Dollar-Cost Averaging Update";

  return rawDescription;
}

const actions: ActionItem[] = [
  {
    id: "1",
    title: "Distribution Request",
    description: "Whitmore Household · ACH $120K (from 6/1 review)",
    refId: "SVC-DST-8841",
    status: "In Progress",
    date: "Jun 1",
  },
  {
    id: "2",
    title: "Account Opening",
    description: "Whitmore Household · Fi-Tek custody",
    refId: "FT-AO-20455",
    status: "In Progress",
    date: "Jun 1",
  },
  {
    id: "3",
    title: "Corporate Trust Disbursement",
    description: "City of Cedar Falls · 2026 GO bond",
    refId: "FT-CT-90187",
    status: "In Progress",
    date: "May 27",
  },
  {
    id: "4",
    title: "Transfer of Assets",
    description: "Tran Family · LPL → Fi-Tek",
    refId: "SVC-TOA-7720",
    status: "In Progress",
    date: "May 28",
  },
  {
    id: "5",
    title: "Manage Investment Strategy",
    description: "Nakamura Family",
    refId: "REL-NAK-3391",
    status: "Draft",
    date: "May 30",
  },
  {
    id: "6",
    title: "KYC / Identity Check",
    description: "Sandoval Family · onboarding",
    refId: "REL-SAN-5540",
    status: "Draft",
    date: "May 31",
  },
  {
    id: "7",
    title: "Standing Money Movement",
    description: "Hargrove Foundation · grant schedule",
    refId: "SVC-STD-2210",
    status: "In Progress",
    date: "May 29",
  },
  {
    id: "8",
    title: "Account Maintenance",
    description: "Resolve custodian alert · Vance Family Trust",
    refId: "SVC-ALR-1188",
    status: "Draft",
    date: "May 26",
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
    name: "Marcus Hale — Finance Director, City of Cedar Falls",
    refId: "OPP-TW-0001",
    status: "Corporate Trust → Wealth",
  },
  {
    id: "2",
    name: "Janet Cole — $8.5M CB&T business-sale inflow",
    refId: "OPP-BW-0002",
    status: "Bank → Wealth",
  },
  {
    id: "3",
    name: "Cedar Ridge Holdings — commercial relationship",
    refId: "OPP-CW-0003",
    status: "Commercial → Wealth",
  },
  {
    id: "4",
    name: "Pearson, James R. — COI referral",
    refId: "REL-PEARSON",
    status: "Qualified Opportunity",
  },
  {
    id: "5",
    name: "Nakamura Family — RMD planning window",
    refId: "REL-NAK-3391",
    status: "Qualified Opportunity",
  },
];

interface InsightItem {
  label: string;
  category: string;
  color: string;
}

const insights: InsightItem[] = [
  { label: "Excess Cash — held-away (Plaid)", category: "Financial Accounts", color: "#e85526" },
  { label: "New Distributions — Fi-Tek", category: "Servicing", color: "#e85526" },
  { label: "Cross-silo match — Bank → Wealth", category: "Opportunities", color: "#0b4f9c" },
  { label: "Unassigned Trust Officer", category: "Corporate Trust", color: "#0d3f5e" },
  { label: "No Scheduled Review", category: "Relationship Health", color: "#0d3f5e" },
  { label: "RMD due within 60 days", category: "Financial Accounts", color: "#e85526" },
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
    <div className="min-h-full bg-white -m-8">
      <div className="relative mx-auto max-w-[1280px] px-8 py-8">
        {/* Greeting header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-foreground">
              Good afternoon, Priya
            </h1>
            <p className="text-lg font-light text-muted-foreground mt-0.5">
              Monday, June 1
            </p>
          </div>
          <button className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary-hover)]">
            Customize
          </button>
        </div>

        {/* Main grid: left (Actions + Tasks) / right (Meetings + Growth) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            {/* Actions card */}
            <div className="rounded-xl bg-[var(--bg-secondary)]">
              <CardHeader title="Actions" count={2841}>
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
                        {getMeaningfulActionTitle(action)}
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
            <div className="rounded-xl bg-[var(--bg-secondary)]">
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
            <div className="rounded-xl bg-[var(--bg-secondary)]">
              <CardHeader title="Meetings" count={1}>
                <div className="flex items-center gap-1">
                  <button className="rounded-md p-1 hover:bg-[var(--bg-secondary)]">
                    <ChevronLeft className="h-4 w-4 text-[var(--icon-secondary)]" />
                  </button>
                  <span className="px-2 text-sm font-medium text-[var(--text-primary)]">
                    Jun 1
                  </span>
                  <button className="rounded-md p-1 hover:bg-[var(--bg-secondary)]">
                    <ChevronRight className="h-4 w-4 text-[var(--icon-secondary)]" />
                  </button>
                </div>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                    <Calendar className="h-4 w-4 text-[var(--icon-secondary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      Whitmore Household — Quarterly Review
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      11:00 AM &bull; Meeting Assistant ready
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--text-tertiary)]">Today</span>
                </div>
              </div>
            </div>

            {/* Growth card */}
            <div className="rounded-xl bg-[var(--bg-secondary)]">
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf1f8]">
                      <TrendingUp className="h-4 w-4 text-[#0b4f9c]" />
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
        <div className="mt-6 rounded-xl bg-[var(--bg-secondary)]">
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
