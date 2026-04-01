import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  PanelRight,
  Menu,
  GitCompare,
  Wand2,
  Workflow,
  ChevronRight,
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
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { BrandThemeSwitcher } from "@/components/ui/brand-theme-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavSubItem {
  label: string;
  href: string;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  shortcut?: string;
  subItems?: NavSubItem[];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Nav data
// ---------------------------------------------------------------------------

const coreGroup: NavItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: GitCompare, label: "Servicing", href: "/servicing" },
];

const toolsGroup: NavItem[] = [
  { icon: Wand2, label: "Wizard", href: "/wizard" },
  { icon: Workflow, label: "Workflow", href: "/workflow" },
];

const navGroups: NavGroup[] = [
  { items: coreGroup },
  { label: "Tools", items: toolsGroup },
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
// NavSubPopover — hover popover for collapsed sidebar sub-items
// ---------------------------------------------------------------------------

function NavSubPopover({
  item,
  onItemClick,
  children,
}: {
  item: NavItem;
  onItemClick?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="w-full"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={4}
        className="w-auto min-w-[180px] p-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="px-3 py-2 text-sm font-medium">{item.label}</div>
        <div className="mx-1 h-px bg-border" />
        <div className="flex flex-col gap-0 py-1">
          {item.subItems?.map((sub) => {
            const isSubActive = window.location.pathname === sub.href;
            return (
              <Link
                key={sub.href}
                to={sub.href}
                onClick={() => {
                  setOpen(false);
                  onItemClick?.();
                }}
                className={`flex h-8 items-center rounded-md px-3 text-sm hover:bg-accent ${
                  isSubActive ? "bg-accent font-medium" : ""
                }`}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
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
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const [openCollapsibles, setOpenCollapsibles] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.subItems) {
          if (
            pathname === item.href ||
            pathname.startsWith(item.href + "/")
          ) {
            initial[item.href] = true;
          }
        }
      }
    }
    return initial;
  });

  return (
    <>
      {/* Navigation items */}
      <div className="flex-1 px-2 pt-0 pb-2 overflow-y-auto flex flex-col gap-3">
        {navGroups.map((group, groupIndex) => {
          const isGroupCollapsed = group.label
            ? (collapsedGroups[group.label] ?? false)
            : false;
          return (
            <div key={groupIndex} className="flex flex-col gap-0">
              {group.label && (
                <button
                  type="button"
                  onClick={() => isExpanded && toggleGroup(group.label!)}
                  className="flex items-center justify-between px-3 pt-1 pb-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors overflow-hidden"
                >
                  <span
                    className={`whitespace-nowrap transition-opacity ${
                      isExpanded ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ transitionDuration: "200ms" }}
                  >
                    {group.label}
                  </span>
                  <ChevronRight
                    className={`size-3 transition-all ${
                      isExpanded ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      transform: isGroupCollapsed
                        ? "rotate(0deg)"
                        : "rotate(90deg)",
                      transitionDuration: "200ms",
                    }}
                  />
                </button>
              )}
              {!isGroupCollapsed &&
                group.items.map((item) => {
                  const isActive = item.subItems
                    ? false
                    : pathname === item.href;
                  const showTooltip = !isExpanded;

                  // Items with sub-items: collapsible group
                  if (item.subItems) {
                    const isOpen = openCollapsibles[item.href] ?? false;
                    const hasActiveChild =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");

                    const parentButton = (
                      <Button
                        variant="ghost"
                        className={`relative w-full h-9 min-h-9 text-sidebar-foreground hover:bg-accent font-normal focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary overflow-hidden ${
                          !isExpanded && hasActiveChild ? "bg-accent" : ""
                        }`}
                        onClick={() => {
                          if (hasActiveChild && isOpen) return;
                          setOpenCollapsibles((prev) => ({
                            ...prev,
                            [item.href]: !prev[item.href],
                          }));
                        }}
                      >
                        <item.icon className="size-5 flex-shrink-0 absolute left-2.5" />
                        <span
                          className={`absolute left-[38px] text-sm leading-none whitespace-nowrap transition-opacity pointer-events-none ${
                            isExpanded ? "opacity-100" : "opacity-0"
                          }`}
                          style={{ transitionDuration: "200ms" }}
                        >
                          {item.label}
                        </span>
                        <ChevronRight
                          className={`size-4 absolute right-2 transition-transform duration-200 text-muted-foreground ${
                            isExpanded ? "opacity-100" : "opacity-0"
                          } ${isOpen ? "rotate-90" : ""}`}
                        />
                      </Button>
                    );

                    return (
                      <Collapsible
                        key={item.href}
                        open={isOpen}
                        onOpenChange={(open) =>
                          setOpenCollapsibles((prev) => ({
                            ...prev,
                            [item.href]: open,
                          }))
                        }
                      >
                        <div className="h-9 min-h-9 flex leading-none">
                          {!isExpanded ? (
                            <NavSubPopover
                              item={item}
                              onItemClick={onItemClick}
                            >
                              {parentButton}
                            </NavSubPopover>
                          ) : (
                            parentButton
                          )}
                        </div>
                        {isExpanded && (
                          <CollapsibleContent className="overflow-hidden">
                            <ul className="flex min-w-0 flex-col gap-0 py-0.5">
                              {item.subItems.map((sub) => {
                                const isSubActive = pathname === sub.href;
                                return (
                                  <li key={sub.href}>
                                    <Link
                                      to={sub.href}
                                      onClick={onItemClick}
                                      className={`flex h-9 min-w-0 items-center overflow-hidden rounded-md text-sm text-sidebar-foreground hover:bg-accent ${
                                        isSubActive
                                          ? "bg-accent font-medium"
                                          : ""
                                      }`}
                                      style={{ paddingLeft: 38 }}
                                    >
                                      <span className="truncate">
                                        {sub.label}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    );
                  }

                  // Standard nav item
                  const button = (
                    <Button
                      variant="ghost"
                      asChild
                      className={`relative w-full h-9 min-h-9 text-sidebar-foreground hover:bg-accent font-normal focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary overflow-hidden ${
                        isActive ? "bg-accent" : ""
                      }`}
                    >
                      <Link to={item.href} onClick={onItemClick}>
                        <item.icon className="size-5 flex-shrink-0 absolute left-2.5" />
                        <span
                          className={`absolute left-[38px] text-sm leading-none whitespace-nowrap transition-opacity pointer-events-none ${
                            isExpanded ? "opacity-100" : "opacity-0"
                          }`}
                          style={{ transitionDuration: "200ms" }}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </Button>
                  );

                  if (!showTooltip) {
                    return (
                      <div
                        key={item.href}
                        className="h-9 min-h-9 flex leading-none"
                      >
                        {button}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.href}
                      className="h-9 min-h-9 flex leading-none"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="text-xs flex items-center gap-2"
                        >
                          <span>{item.label}</span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Footer: brand switcher, theme toggle, create button */}
      <div className="border-t border-sidebar-border p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <BrandThemeSwitcher />
          <ThemeToggle />
        </div>
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

  // Keyboard shortcut: Cmd+. (Mac) or Ctrl+. (Windows) to toggle sidebar
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

  // Placeholder to avoid layout shift before mount
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
      {/* Mobile: hamburger + sheet */}
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
              {/* Header */}
              <div className="h-16 pt-4 pb-6 pl-4 pr-2 flex items-center shrink-0">
                <span className="text-sm font-semibold tracking-tight">
                  Wealth Platform
                </span>
              </div>

              <NavigationContent
                isExpanded={true}
                onItemClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Create button */}
              {onCreateClick && (
                <div className="border-t border-sidebar-border p-2">
                  <Button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onCreateClick();
                    }}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create
                  </Button>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop: collapsible sidebar */
        <>
          <div
            className="shrink-0 transition-[width] duration-200"
            style={{ width: navWidth }}
          />
          <nav
            className={`flex flex-col h-screen fixed top-0 left-0 transition-[width,background-color] duration-200 bg-sidebar border-r border-sidebar-border`}
            style={{ width: navWidth }}
            role="navigation"
            aria-label="Main navigation"
            onMouseEnter={() => !isExpanded && setIsCollapsedHovered(true)}
            onMouseLeave={() => setIsCollapsedHovered(false)}
          >
            {/* Header */}
            <div className="h-16 pt-4 pb-6 pl-4 pr-2 flex items-center shrink-0 relative">
              {isExpanded ? (
                <>
                  <span className="text-sm font-semibold tracking-tight">
                    Wealth Platform
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(false)}
                        className="w-9 h-9 flex-shrink-0 ml-auto"
                        aria-label="Collapse sidebar"
                      >
                        <PanelRight className="w-5 h-5" />
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
                  {/* Collapsed: show abbreviation or toggle on hover */}
                  <span
                    className={`text-sm font-semibold tracking-tight pointer-events-none ${
                      isCollapsedHovered ? "invisible" : ""
                    }`}
                  >
                    W
                  </span>
                  {isCollapsedHovered && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="pointer-events-auto">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsExpanded(true)}
                              className="w-9 h-9 flex-shrink-0"
                              aria-label="Expand sidebar"
                            >
                              <PanelRight className="w-5 h-5" />
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

            {/* Create button (desktop) */}
            {onCreateClick && (
              <div className="border-t border-sidebar-border p-2">
                {isExpanded ? (
                  <Button onClick={onCreateClick} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Create
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onCreateClick}
                        size="icon"
                        className="w-full"
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
