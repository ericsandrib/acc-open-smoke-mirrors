import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { BrandThemeSwitcher } from '@/components/ui/brand-theme-switcher'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ClipboardList, label: 'Servicing', path: '/servicing' },
]

interface DashboardSidebarProps {
  activeItem?: string
  onCreateClick: () => void
}

export function DashboardSidebar({ activeItem = 'Dashboard', onCreateClick }: DashboardSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-muted/30">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold tracking-tight">Wealth Platform</span>
        <div className="flex items-center gap-1">
          <BrandThemeSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = item.label === activeItem
          const isEnabled = !!item.path
          return (
            <button
              key={item.label}
              onClick={() => isEnabled && navigate(item.path!)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm ${
                isActive
                  ? 'bg-accent font-medium text-accent-foreground'
                  : isEnabled
                    ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              disabled={!isEnabled}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
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
