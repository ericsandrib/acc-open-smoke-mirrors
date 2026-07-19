import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Reorder, useDragControls } from "framer-motion";
import {
  Route,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ClipboardList,
  GripVertical,
  ArrowLeftRight,
  Check,
  Settings2,
  ArrowUpRight,
  RotateCcw,
  Video,
  MapPin,
} from "lucide-react";

import { useMeetings } from "@/stores/meetingsStore";
import { useServicing } from "@/stores/servicingStore";
import { deriveActionRows, type ActionRow } from "@/components/servicing/ActionsTable";
import { deriveTaskRows, type TaskRow } from "@/components/servicing/TasksTable";
import { StatusBadge } from "@/components/servicing/StatusBadge";
import { DEMO_TODAY, addDays, toISODate, relativeDayLabel } from "@/lib/demoClock";
import { fmtTime, vendorShort, isLive } from "@/components/meetings/meetingUtils";
import type { Meeting } from "@/types/meeting";
import type { TaskStatus } from "@/types/workflow";
import type { JourneyStatus } from "@/types/servicing";

// ---------------------------------------------------------------------------
// Static demo data that has no Servicing/Meetings counterpart yet.
// ---------------------------------------------------------------------------

interface GrowthItem {
  id: string;
  name: string;
  refId: string;
  status: string;
}

const growthItems: GrowthItem[] = [
  {
    id: "0",
    name: "Carol Whitmore — recently widowed, retirement planning (referred in review)",
    refId: "REL-WHIT-CAROL",
    status: "Qualified Opportunity",
  },
  { id: "1", name: "Marcus Hale — Finance Director, City of Cedar Falls", refId: "OPP-TW-0001", status: "Corporate Trust → Wealth" },
  { id: "2", name: "Janet Cole — $8.5M CB&T business-sale inflow", refId: "OPP-BW-0002", status: "Bank → Wealth" },
  { id: "3", name: "Cedar Ridge Holdings — commercial relationship", refId: "OPP-CW-0003", status: "Commercial → Wealth" },
  { id: "4", name: "Pearson, James R. — COI referral", refId: "REL-PEARSON", status: "Qualified Opportunity" },
  { id: "5", name: "Nakamura Family — RMD planning window", refId: "REL-NAK-3391", status: "Qualified Opportunity" },
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
// Shared presentational bits
// ---------------------------------------------------------------------------

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
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
        {count !== undefined && (
          <span className="text-sm text-[var(--text-secondary)]">{count.toLocaleString()}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/** Small "open in Servicing" affordance shared by the Actions + Tasks headers. */
function OpenInServicing({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary-hover)]"
    >
      {label}
      <ArrowUpRight className="h-3 w-3" />
    </button>
  );
}

// Active statuses bubble to the top of the dashboard cards (most actionable first).
const ACTIVE_FIRST: Record<string, number> = {
  blocked: 0,
  awaiting_review: 1,
  in_progress: 2,
  not_started: 3,
  scheduled: 3,
  todo: 3,
  complete: 4,
  completed: 4,
};
const rank = (s: string) => ACTIVE_FIRST[s] ?? 2;

// ---------------------------------------------------------------------------
// Panel: Actions — derived from the live Servicing store (matches /servicing)
// ---------------------------------------------------------------------------

function ActionsPanel() {
  const navigate = useNavigate();
  const { journeys } = useServicing();
  const rows = useMemo(() => deriveActionRows(journeys), [journeys]);

  // Surface the most actionable first; non-complete on top.
  const sorted = useMemo(
    () => [...rows].sort((a, b) => rank(a.status) - rank(b.status)),
    [rows],
  );
  const shown = sorted.slice(0, 6);

  const openActions = () => navigate("/servicing?tab=actions");

  return (
    <div className="rounded-xl bg-[var(--bg-secondary)]">
      <CardHeader title="Actions" count={rows.length}>
        <OpenInServicing onClick={openActions} label="Servicing" />
      </CardHeader>
      <div className="px-6 pb-2">
        {shown.map((row: ActionRow) => (
          <button
            key={row.id}
            onClick={openActions}
            className="flex w-full items-center gap-3 border-b border-border/50 py-3 text-left last:border-b-0 hover:bg-[var(--bg-tertiary)]/50 rounded-lg -mx-1 px-1"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
              <Route className="h-4 w-4 text-[var(--icon-secondary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {row.nickname || row.title}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {row.relationshipName} &bull; {row.category || row.title} &bull; {row.actionCode}
              </p>
            </div>
            <StatusBadge status={row.status as JourneyStatus} />
            <span className="shrink-0 text-xs text-[var(--text-tertiary)] w-12 text-right">
              {row.complete}/{row.total}
            </span>
          </button>
        ))}
      </div>
      <div className="px-6 pb-4 pt-1">
        <button
          onClick={openActions}
          className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          See All Actions &rsaquo;
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Tasks — the active task steps inside those actions (matches /servicing)
// ---------------------------------------------------------------------------

function TasksPanel() {
  const navigate = useNavigate();
  const { journeys } = useServicing();
  const rows = useMemo(() => deriveTaskRows(journeys), [journeys]);

  // The dashboard Tasks card is the advisor's "what needs me now" — active steps only.
  const active = useMemo(
    () =>
      rows
        .filter((t) => t.status === "in_progress" || t.status === "awaiting_review" || t.status === "blocked")
        .sort((a, b) => rank(a.status) - rank(b.status)),
    [rows],
  );
  const shown = active.slice(0, 6);

  const openTasks = () => navigate("/servicing?tab=tasks");

  return (
    <div className="rounded-xl bg-[var(--bg-secondary)]">
      <CardHeader title="Tasks" count={active.length}>
        <OpenInServicing onClick={openTasks} label="Servicing" />
      </CardHeader>
      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
          <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No active tasks</p>
        </div>
      ) : (
        <div className="px-6 pb-2">
          {shown.map((row: TaskRow) => (
            <button
              key={row.id}
              onClick={openTasks}
              className="flex w-full items-center gap-3 border-b border-border/50 py-3 text-left last:border-b-0 hover:bg-[var(--bg-tertiary)]/50 rounded-lg -mx-1 px-1"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                <ClipboardList className="h-4 w-4 text-[var(--icon-secondary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{row.title}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {row.relationshipName} &bull; {row.nickname || row.actionTitle}
                </p>
              </div>
              <StatusBadge status={row.status as TaskStatus} />
              <span className="shrink-0 text-xs text-[var(--text-tertiary)] w-16 text-right">
                {row.nextStep}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="px-6 pb-4 pt-1">
        <button
          onClick={openTasks}
          className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          See All Tasks &rsaquo;
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Meetings — real date toggle bound to the meetings store
// ---------------------------------------------------------------------------

function compactDayLabel(d: Date): string {
  const rel = relativeDayLabel(d);
  if (rel === "Today" || rel === "Tomorrow" || rel === "Yesterday") return rel;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function MeetingsPanel() {
  const navigate = useNavigate();
  const { meetings } = useMeetings();
  const [selISO, setSelISO] = useState(() => toISODate(DEMO_TODAY));
  const selDate = useMemo(() => new Date(`${selISO}T00:00:00`), [selISO]);

  const dayMeetings = useMemo(
    () =>
      meetings
        .filter((m) => m.isAttendee !== false && toISODate(new Date(m.startTime)) === selISO)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [meetings, selISO],
  );

  const shiftDays = (n: number) => setSelISO(toISODate(addDays(selDate, n)));
  const isToday = selISO === toISODate(DEMO_TODAY);

  return (
    <div className="rounded-xl bg-[var(--bg-secondary)]">
      <CardHeader title="Meetings" count={dayMeetings.length}>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous day"
            onClick={() => shiftDays(-1)}
            className="rounded-md p-1 hover:bg-[var(--bg-tertiary)]"
          >
            <ChevronLeft className="h-4 w-4 text-[var(--icon-secondary)]" />
          </button>
          <span className="min-w-[112px] px-2 text-center text-sm font-medium text-[var(--text-primary)]">
            {compactDayLabel(selDate)}
          </span>
          <button
            aria-label="Next day"
            onClick={() => shiftDays(1)}
            className="rounded-md p-1 hover:bg-[var(--bg-tertiary)]"
          >
            <ChevronRight className="h-4 w-4 text-[var(--icon-secondary)]" />
          </button>
        </div>
      </CardHeader>

      <div className="px-6 pb-4">
        {dayMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-[var(--text-tertiary)]">
            <Calendar className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No meetings on this day</p>
            {!isToday && (
              <button
                onClick={() => setSelISO(toISODate(DEMO_TODAY))}
                className="mt-2 text-xs font-medium text-[#0b4f9c] hover:underline"
              >
                Jump to today
              </button>
            )}
          </div>
        ) : (
          dayMeetings.map((mtg: Meeting) => {
            const live = isLive(mtg);
            return (
              <button
                key={mtg.id}
                onClick={() => navigate(`/meetings/${mtg.id}`)}
                className="flex w-full items-center gap-3 border-b border-border/50 py-3 text-left last:border-b-0 hover:bg-[var(--bg-tertiary)]/50 rounded-lg -mx-1 px-1"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
                  {mtg.vendor === "in_person" ? (
                    <MapPin className="h-4 w-4 text-[var(--icon-secondary)]" />
                  ) : (
                    <Video className="h-4 w-4 text-[var(--icon-secondary)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{mtg.subject}</p>
                  <p className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] truncate">
                    {live && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 animate-pulse" />}
                    {mtg.relationshipName || "No relationship connected"} &bull; {vendorShort(mtg.vendor)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-[var(--text-tertiary)] w-16 text-right">
                  {live ? <span className="text-red-600">Live now</span> : fmtTime(mtg.startTime)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Growth (static demo content)
// ---------------------------------------------------------------------------

function GrowthPanel() {
  const [growthTab, setGrowthTab] = useState<"referral" | "consolidation">("referral");
  return (
    <div className="rounded-xl bg-[var(--bg-secondary)]">
      <CardHeader title="Growth" count={14} />
      <div className="flex gap-0 border-b border-border px-6">
        {(["referral", "consolidation"] as const).map((tab) => (
          <button
            key={tab}
            className={`relative px-3 pb-2 text-sm font-medium capitalize transition-colors ${
              growthTab === tab
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
            onClick={() => setGrowthTab(tab)}
          >
            {tab}
            {growthTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]" />}
          </button>
        ))}
      </div>
      <div className="px-6 pb-2">
        {growthItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf1f8]">
              <TrendingUp className="h-4 w-4 text-[#0b4f9c]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">No next steps &bull; {item.refId}</p>
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
  );
}

function InsightsPanel() {
  return (
    <div className="rounded-xl bg-[var(--bg-secondary)]">
      <CardHeader title="Insights" />
      <div className="px-6 pb-5">
        {insights.map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
            <span className="text-xs text-[var(--text-tertiary)]">{item.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customizable layout
// ---------------------------------------------------------------------------

type PanelKey = "actions" | "tasks" | "meetings" | "growth";
const ALL_PANELS: PanelKey[] = ["actions", "tasks", "meetings", "growth"];

interface Layout {
  left: PanelKey[];
  right: PanelKey[];
}
const DEFAULT_LAYOUT: Layout = { left: ["actions", "tasks"], right: ["meetings", "growth"] };
const LS_KEY = "zions-dashboard-layout-v1";

function isValidLayout(l: unknown): l is Layout {
  if (!l || typeof l !== "object") return false;
  const cast = l as Partial<Layout>;
  if (!Array.isArray(cast.left) || !Array.isArray(cast.right)) return false;
  const all = [...cast.left, ...cast.right];
  return all.length === ALL_PANELS.length && ALL_PANELS.every((k) => all.includes(k));
}

function loadLayout(): Layout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidLayout(parsed)) return parsed;
    }
  } catch {
    /* ignore corrupt state */
  }
  return DEFAULT_LAYOUT;
}

const PANEL_LABEL: Record<PanelKey, string> = {
  actions: "Actions",
  tasks: "Tasks",
  meetings: "Meetings",
  growth: "Growth",
};

/** One draggable panel. Drag only starts from the grip handle (so inner buttons stay clickable). */
function PanelItem({
  panelKey,
  node,
  customizing,
  onMoveColumn,
}: {
  panelKey: PanelKey;
  node: React.ReactNode;
  customizing: boolean;
  onMoveColumn: (k: PanelKey) => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={panelKey}
      dragListener={false}
      dragControls={controls}
      className={
        customizing
          ? "relative rounded-xl outline-dashed outline-2 outline-[#0b4f9c]/30"
          : "relative"
      }
    >
      {customizing && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          <button
            onClick={() => onMoveColumn(panelKey)}
            title="Move to other column"
            aria-label={`Move ${PANEL_LABEL[panelKey]} to other column`}
            className="rounded-md border border-border bg-white p-1.5 text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-primary-hover)]"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>
          <button
            onPointerDown={(e) => controls.start(e)}
            title="Drag to reorder"
            aria-label={`Drag ${PANEL_LABEL[panelKey]} to reorder`}
            className="cursor-grab touch-none rounded-md border border-border bg-white p-1.5 text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-primary-hover)] active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className={customizing ? "pointer-events-none select-none" : undefined}>{node}</div>
    </Reorder.Item>
  );
}

function PanelColumn({
  keys,
  panels,
  customizing,
  onReorder,
  onMoveColumn,
}: {
  keys: PanelKey[];
  panels: Record<PanelKey, React.ReactNode>;
  customizing: boolean;
  onReorder: (next: PanelKey[]) => void;
  onMoveColumn: (k: PanelKey) => void;
}) {
  return (
    <Reorder.Group as="div" axis="y" values={keys} onReorder={onReorder} className="flex flex-col gap-6">
      {keys.map((k) => (
        <PanelItem key={k} panelKey={k} node={panels[k]} customizing={customizing} onMoveColumn={onMoveColumn} />
      ))}
    </Reorder.Group>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardContent() {
  const [layout, setLayout] = useState<Layout>(loadLayout);
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(layout));
    } catch {
      /* ignore */
    }
  }, [layout]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = DEMO_TODAY.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Panel instances are created once per render; component state (e.g. the Meetings
  // selected day) lives inside each panel and survives the customize toggle.
  const panels: Record<PanelKey, React.ReactNode> = {
    actions: <ActionsPanel />,
    tasks: <TasksPanel />,
    meetings: <MeetingsPanel />,
    growth: <GrowthPanel />,
  };

  const moveColumn = (k: PanelKey) =>
    setLayout((prev) => {
      const inLeft = prev.left.includes(k);
      const from: keyof Layout = inLeft ? "left" : "right";
      const to: keyof Layout = inLeft ? "right" : "left";
      return {
        ...prev,
        [from]: prev[from].filter((x) => x !== k),
        [to]: [...prev[to], k],
      };
    });

  return (
    <div className="min-h-full bg-white -m-8">
      <div className="relative mx-auto max-w-[1280px] px-8 py-8">
        {/* Greeting header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light text-foreground">{greeting}, Priya</h1>
            <p className="text-lg font-light text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>
          <button
            onClick={() => setCustomizing((c) => !c)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium ${
              customizing
                ? "border-[#0b4f9c] bg-[#0b4f9c] text-white hover:bg-[#0a4789]"
                : "border-border bg-white text-[var(--text-primary)] hover:bg-[var(--bg-primary-hover)]"
            }`}
          >
            {customizing ? <Check className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
            {customizing ? "Done" : "Customize"}
          </button>
        </div>

        {/* Customize hint banner */}
        {customizing && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-[#0b4f9c]/20 bg-[#eaf1f8] px-4 py-2.5">
            <p className="text-sm text-[#0b4f9c]">
              Drag <GripVertical className="inline h-3.5 w-3.5 -mt-0.5" /> to reorder, or{" "}
              <ArrowLeftRight className="inline h-3.5 w-3.5 -mt-0.5" /> to move a panel between columns. Changes save
              automatically.
            </p>
            <button
              onClick={() => setLayout(DEFAULT_LAYOUT)}
              className="inline-flex items-center gap-1 rounded-md border border-[#0b4f9c]/30 bg-white px-2.5 py-1 text-xs font-medium text-[#0b4f9c] hover:bg-white/60"
            >
              <RotateCcw className="h-3 w-3" />
              Reset layout
            </button>
          </div>
        )}

        {/* Main grid: two reorderable columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PanelColumn
            keys={layout.left}
            panels={panels}
            customizing={customizing}
            onReorder={(next) => setLayout((prev) => ({ ...prev, left: next }))}
            onMoveColumn={moveColumn}
          />
          <PanelColumn
            keys={layout.right}
            panels={panels}
            customizing={customizing}
            onReorder={(next) => setLayout((prev) => ({ ...prev, right: next }))}
            onMoveColumn={moveColumn}
          />
        </div>

        {/* Insights — pinned full-width */}
        <div className="mt-6">
          <InsightsPanel />
        </div>
      </div>
    </div>
  );
}
