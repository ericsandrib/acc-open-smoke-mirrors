import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Bell,
  CalendarDays,
  Handshake,
  Users,
  Globe,
  TrendingUp,
  Clock,
  BookOpen,
  ShieldCheck,
  Settings,
  Plus,
  PanelRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Nav data — matches Figma vertical nav design
// ---------------------------------------------------------------------------

const navGroups: NavGroup[] = [
  {
    items: [
      { icon: Home, label: "Home", href: "/" },
      { icon: Search, label: "Search", href: "/search" },
      { icon: Bell, label: "Notifications", href: "/notifications", badge: 8 },
      { icon: CalendarDays, label: "Meetings", href: "/meetings" },
    ],
  },
  {
    items: [
      { icon: Handshake, label: "Servicing", href: "/servicing" },
      { icon: Users, label: "Relationships", href: "/relationships" },
      { icon: Globe, label: "Onboarding", href: "/onboarding" },
      { icon: TrendingUp, label: "Growth", href: "/growth" },
    ],
  },
  {
    items: [
      { icon: Clock, label: "Insights", href: "/insights" },
      { icon: BookOpen, label: "Advisor Directory", href: "/advisor-directory" },
      { icon: ShieldCheck, label: "Advisor Matching", href: "/advisor-matching" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Utility hooks
// ---------------------------------------------------------------------------

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const setStoredValue = (newValue: T | ((val: T) => T)) => {
    const valueToStore =
      newValue instanceof Function ? newValue(value) : newValue;
    setValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  };
  return [value, setStoredValue] as const;
}

// ---------------------------------------------------------------------------
// NavigationContent — shared between desktop & mobile
// ---------------------------------------------------------------------------

function NavigationContent({
  isExpanded,
  onItemClick,
  onCreateClick,
}: {
  isExpanded: boolean;
  onItemClick?: () => void;
  onCreateClick?: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <>
      {/* Navigation items */}
      <div className="flex-1 px-3 pt-1 pb-2 overflow-y-auto flex flex-col gap-0">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col gap-0.5">
            {groupIndex > 0 && (
              <div className="my-2 mx-3 h-px bg-border/60" />
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/onboarding" && pathname.startsWith("/wizard"));

              const button = (
                <Link
                  to={item.href}
                  onClick={onItemClick}
                  className={`relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--bg-tertiary)] font-medium text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  } ${!isExpanded ? "justify-center" : ""}`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {isExpanded && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {item.badge && isExpanded && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md bg-red-500 px-1.5 text-[11px] font-medium text-white">
                      {item.badge}
                    </span>
                  )}
                  {item.badge && !isExpanded && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-medium text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );

              if (!isExpanded) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.href}>{button}</div>;
            })}
          </div>
        ))}
      </div>

      {/* Footer: Settings + Create */}
      <div className="border-t border-border px-3 py-3 flex flex-col gap-2">
        {isExpanded ? (
          <>
            <Link
              to="/settings"
              onClick={onItemClick}
              className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            >
              <Settings className="h-[18px] w-[18px] shrink-0" />
              <span>Settings</span>
            </Link>
            {onCreateClick && (
              <Button
                onClick={() => {
                  onItemClick?.();
                  onCreateClick();
                }}
                className="w-full gap-2 bg-[var(--fill-inverse-primary)] text-white hover:bg-[var(--fill-inverse-primary-hover)]"
              >
                Create
              </Button>
            )}
          </>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings"
                  onClick={onItemClick}
                  className="flex h-10 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  <Settings className="h-[18px] w-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Settings
              </TooltipContent>
            </Tooltip>
            {onCreateClick && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onCreateClick}
                    size="icon"
                    className="w-full bg-[var(--fill-inverse-primary)] text-white hover:bg-[var(--fill-inverse-primary-hover)]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  Create
                </TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// VerticalNav — main export
// ---------------------------------------------------------------------------

export interface VerticalNavProps {
  onCreateClick?: () => void;
  defaultCollapsed?: boolean;
}

export function VerticalNav({ onCreateClick, defaultCollapsed }: VerticalNavProps) {
  const mounted = useMounted();
  const [isExpanded, setIsExpanded] = useLocalStorage(
    defaultCollapsed ? "vertical-nav-expanded-collapsed" : "vertical-nav-expanded",
    !defaultCollapsed
  );
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Keyboard shortcut: Cmd+. to toggle sidebar
  useEffect(() => {
    if (!mounted || isMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, isMobile, setIsExpanded]);

  const navWidth = !mounted ? 260 : isExpanded ? 260 : 60;

  if (!mounted) {
    return (
      <>
        <div className="shrink-0" style={{ width: navWidth }} />
        <nav
          className="flex flex-col h-screen fixed top-0 left-0 border-r border-border bg-white"
          style={{ width: navWidth }}
          role="navigation"
          aria-label="Main navigation"
        />
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={300}>
      {isMobile ? (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px]">
            <nav
              className="flex flex-col h-full bg-white"
              role="navigation"
              aria-label="Main navigation"
            >
              {/* Header */}
              <div className="h-14 px-4 flex items-center justify-between shrink-0 border-b border-border">
                <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  M<span className="text-[var(--text-tertiary)]">|</span>
                </span>
              </div>
              <NavigationContent
                isExpanded={true}
                onItemClick={() => setIsMobileMenuOpen(false)}
                onCreateClick={onCreateClick}
              />
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        <>
          <div
            className="shrink-0 transition-[width] duration-200"
            style={{ width: navWidth }}
          />
          <nav
            className="flex flex-col h-screen fixed top-0 left-0 transition-[width] duration-200 bg-white border-r border-border z-40"
            style={{ width: navWidth }}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between shrink-0">
              {isExpanded ? (
                <>
                  <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                    M<span className="text-[var(--text-tertiary)]">|</span>
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(false)}
                        className="h-8 w-8"
                        aria-label="Collapse sidebar"
                      >
                        <PanelRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      Collapse
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsExpanded(true)}
                      className="h-8 w-8 mx-auto"
                      aria-label="Expand sidebar"
                    >
                      <PanelRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    Expand
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <NavigationContent
              isExpanded={isExpanded}
              onCreateClick={onCreateClick}
            />
          </nav>
        </>
      )}
    </TooltipProvider>
  );
}
