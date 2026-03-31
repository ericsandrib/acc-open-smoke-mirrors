import { LayoutDashboard, Users, Briefcase, BarChart3, Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Users, label: 'Clients' },
  { icon: Briefcase, label: 'Portfolios' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
]

interface DashboardSidebarProps {
  onCreateClick: () => void
}

export function DashboardSidebar({ onCreateClick }: DashboardSidebarProps) {
  return (
    <aside className="flex w-60 flex-col border-r border-border bg-muted/30">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold tracking-tight">Wealth Platform</span>
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${
              item.active
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            disabled={!item.active}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <Button onClick={onCreateClick} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </div>
    </aside>
  )
}
