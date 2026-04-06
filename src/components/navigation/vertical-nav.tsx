import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Bell,
  CalendarDays,
  SlidersHorizontal,
  Handshake,
  Users,
  Star,
  Globe,
  TrendingUp,
  Settings,
  Wrench,
  PanelRight,
  Menu,
  Plus,
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
// Nav data — matches 5178 vertical nav layout
// ---------------------------------------------------------------------------

const navGroups: NavGroup[] = [
  {
    items: [
      { icon: Home, label: "Home", href: "/" },
      { icon: Search, label: "Search", href: "/search" },
      { icon: Bell, label: "Notifications", href: "/notifications", badge: 8 },
      { icon: CalendarDays, label: "Meetings", href: "/meetings" },
      { icon: SlidersHorizontal, label: "My Work", href: "/my-work" },
    ],
  },
  {
    label: "Favorites",
    items: [
      { icon: Users, label: "My Team", href: "/my-team" },
      { icon: Star, label: "My Favorite View", href: "/my-favorite-view" },
    ],
  },
  {
    label: "Manage",
    items: [
      { icon: Handshake, label: "Servicing", href: "/servicing" },
      { icon: Globe, label: "Onboarding", href: "/onboarding" },
      { icon: TrendingUp, label: "Tax", href: "/tax" },
      { icon: Settings, label: "Advisor Matching", href: "/advisor-matching" },
      { icon: Wrench, label: "Active Actions", href: "/active-actions" },
    ],
  },
  {
    label: "Insights",
    items: [],
  },
  {
    label: "Records",
    items: [],
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
}: {
  isExpanded: boolean;
  onItemClick?: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <>
      <div className="flex-1 px-3 pt-1 pb-2 overflow-y-auto flex flex-col gap-4">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex flex-col gap-0.5">
            {group.label && isExpanded && (
              <span className="px-3 pt-1 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </span>
            )}
            {group.label && !isExpanded && (
              <div className="mx-auto w-5 border-t border-border my-1" />
            )}
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/onboarding" && pathname.startsWith("/wizard")) ||
                (item.href === "/servicing" && pathname.startsWith("/servicing"));
              const showTooltip = !isExpanded;

              const button = (
                <Button
                  variant="ghost"
                  asChild
                  className={`relative w-full h-10 min-h-10 text-foreground/80 hover:bg-accent hover:text-foreground font-normal focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary overflow-hidden ${
                    isActive
                      ? "bg-accent text-foreground font-medium"
                      : ""
                  }`}
                >
                  <Link to={item.href} onClick={onItemClick}>
                    <item.icon className="size-[18px] flex-shrink-0 absolute left-3" />
                    <span
                      className={`absolute left-10 text-[14px] leading-none whitespace-nowrap transition-opacity pointer-events-none ${
                        isExpanded ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ transitionDuration: "200ms" }}
                    >
                      {item.label}
                    </span>
                    {item.badge && isExpanded && (
                      <span className="absolute right-3 inline-flex items-center justify-center min-w-[20px] h-5 rounded-md bg-[#E8503A] text-white text-[11px] font-medium px-1.5">
                        {item.badge}
                      </span>
                    )}
                    {item.badge && !isExpanded && (
                      <span className="absolute top-1 right-1 inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#E8503A]" />
                    )}
                  </Link>
                </Button>
              );

              if (!showTooltip) {
                return (
                  <div
                    key={item.href}
                    className="h-10 min-h-10 flex leading-none"
                  >
                    {button}
                  </div>
                );
              }

              return (
                <div
                  key={item.href}
                  className="h-10 min-h-10 flex leading-none"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="text-xs flex items-center gap-2"
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-md bg-[#E8503A] text-white text-[10px] font-medium px-1">
                          {item.badge}
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer: Settings */}
      <div className="px-3 pb-1">
        <Link
          to="/settings"
          onClick={onItemClick}
          className={`flex items-center h-10 px-3 text-[14px] text-foreground/80 hover:text-foreground transition-colors ${
            pathname === "/settings" ? "font-medium text-foreground" : ""
          }`}
        >
          {isExpanded ? (
            "Settings"
          ) : (
            <Settings className="size-[18px]" />
          )}
        </Link>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// VerticalNav — main export
// ---------------------------------------------------------------------------

export interface VerticalNavProps {
  onCreateClick?: () => void;
}

export function VerticalNav({ onCreateClick }: VerticalNavProps) {
  const mounted = useMounted();
  const [isExpanded, setIsExpanded] = useLocalStorage(
    "vertical-nav-expanded",
    true
  );
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsedHovered, setIsCollapsedHovered] = useState(false);

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

  const navWidth = !mounted ? 256 : isExpanded ? 256 : 56;

  if (!mounted) {
    return (
      <>
        <div className="shrink-0" style={{ width: navWidth }} />
        <nav
          className="flex flex-col h-screen fixed top-0 left-0 border-r border-sidebar-border bg-sidebar"
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
          <SheetContent side="left" className="p-0 w-64">
            <nav
              className="flex flex-col h-full bg-sidebar"
              role="navigation"
              aria-label="Main navigation"
            >
              <div className="h-14 px-4 flex items-center shrink-0">
                <span className="text-lg font-bold tracking-tight">M</span>
              </div>

              <NavigationContent
                isExpanded={true}
                onItemClick={() => setIsMobileMenuOpen(false)}
              />

              {onCreateClick && (
                <div className="px-3 pb-3">
                  <Button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onCreateClick();
                    }}
                    className="w-full h-10 gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-lg font-medium"
                  >
                    Create
                  </Button>
                </div>
              )}
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
            className="flex flex-col h-screen fixed top-0 left-0 transition-[width,background-color] duration-200 bg-sidebar border-r border-sidebar-border"
            style={{ width: navWidth }}
            role="navigation"
            aria-label="Main navigation"
            onMouseEnter={() => !isExpanded && setIsCollapsedHovered(true)}
            onMouseLeave={() => setIsCollapsedHovered(false)}
          >
            {/* Header: M logo + panel toggle */}
            <div className="h-14 px-4 flex items-center shrink-0 justify-between">
              {isExpanded ? (
                <>
                  <span className="text-lg font-bold tracking-tight">M</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(false)}
                        className="w-8 h-8 flex-shrink-0 text-foreground/60 hover:text-foreground"
                        aria-label="Collapse sidebar"
                      >
                        <PanelRight className="w-[18px] h-[18px]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="text-xs flex items-center gap-2"
                    >
                      <span>Hide Toolbar</span>
                      <kbd className="ml-1 rounded border bg-muted px-1 text-[10px]">
                        Cmd+.
                      </kbd>
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <span
                    className={`text-lg font-bold tracking-tight mx-auto pointer-events-none ${
                      isCollapsedHovered ? "invisible" : ""
                    }`}
                  >
                    M
                  </span>
                  {isCollapsedHovered && (
                    <div className="absolute inset-x-0 top-0 h-14 flex items-center justify-center pointer-events-none">
                      <div className="pointer-events-auto">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsExpanded(true)}
                              className="w-8 h-8 flex-shrink-0 text-foreground/60 hover:text-foreground"
                              aria-label="Expand sidebar"
                            >
                              <PanelRight className="w-[18px] h-[18px]" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="text-xs flex items-center gap-2"
                          >
                            <span>Show Toolbar</span>
                            <kbd className="ml-1 rounded border bg-muted px-1 text-[10px]">
                              Cmd+.
                            </kbd>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <NavigationContent isExpanded={isExpanded} />

            {/* Create button */}
            {onCreateClick && (
              <div className="px-3 pb-3">
                {isExpanded ? (
                  <Button
                    onClick={onCreateClick}
                    className="w-full h-10 gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-lg font-medium"
                  >
                    Create
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onCreateClick}
                        size="icon"
                        className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-lg"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      Create
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </nav>
        </>
      )}
    </TooltipProvider>
  );
}
