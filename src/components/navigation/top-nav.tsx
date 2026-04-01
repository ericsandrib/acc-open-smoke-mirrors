import { Link, useLocation } from "react-router-dom";
import { Search, HelpCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Relationships", href: "/relationships" },
  { label: "Servicing", href: "/servicing" },
  { label: "Meetings", href: "/meetings" },
  { label: "Insights", href: "/insights" },
  { label: "Growth", href: "/growth" },
  { label: "Advisor Directory", href: "/advisor-directory" },
  { label: "Advisor Matching", href: "/advisor-matching" },
];

export function TopNav() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-white px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          M
        </span>
        <div className="h-6 w-px bg-border" />
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-0 overflow-x-auto min-w-0 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                isActive
                  ? "font-semibold text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-3 shrink-0">
        <Button
          size="sm"
          className="gap-1.5 bg-[var(--fill-inverse-primary)] text-white hover:bg-[var(--fill-inverse-primary-hover)] rounded-full px-4"
        >
          Create
          <span className="text-xs">+</span>
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--icon-tertiary)]" />
          <input
            type="text"
            placeholder="Search"
            className="h-8 w-44 rounded-md border border-border bg-[var(--bg-secondary)] pl-8 pr-3 text-sm placeholder:text-[var(--text-placeholder-primary)] focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Help */}
        <button className="rounded-full p-1.5 text-[var(--icon-secondary)] hover:bg-[var(--bg-secondary)]">
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button className="relative rounded-full p-1.5 text-[var(--icon-secondary)] hover:bg-[var(--bg-secondary)]">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            10
          </span>
        </button>

        {/* User avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fill-brand-accent-primary)] text-xs font-medium text-white">
          GF
        </div>
      </div>
    </header>
  );
}
