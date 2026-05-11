import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Search,
  Bell,
  CalendarDays,
  History,
  Users,
  TrendingUp,
  Lightbulb,
  BarChart3,
  BookOpen,
  MessagesSquare,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

type IconType = ComponentType<SVGProps<SVGSVGElement>>

interface NavItem {
  label: string
  href: string
  icon: IconType
  badge?: string
}

const primaryItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Notifications', href: '/notifications', icon: Bell, badge: '99+' },
  { label: 'Meetings', href: '/meetings', icon: CalendarDays },
]

const workItems: NavItem[] = [
  { label: 'Servicing', href: '/servicing', icon: History },
  { label: 'Relationships', href: '/relationships', icon: Users },
  { label: 'Growth', href: '/growth', icon: TrendingUp },
  { label: 'Insights', href: '/insights', icon: Lightbulb },
  { label: 'KPI Dashboard', href: '/kpi-dashboard', icon: BarChart3 },
]


const advisorItems: NavItem[] = [
  { label: 'Advisor Directory', href: '/advisor-directory', icon: BookOpen },
  { label: 'Advisor Matching', href: '/advisor-matching', icon: MessagesSquare },
]

interface SideNavProps {
  collapsed: boolean
  onToggle: () => void
  onCreateClick?: () => void
}

export function SideNav({ collapsed, onToggle, onCreateClick }: SideNavProps) {
  const { pathname } = useLocation()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const widthClass = collapsed ? 'w-16' : 'w-60'

  return (
    <aside
      className={`${widthClass} shrink-0 flex flex-col border-r border-border bg-white transition-[width] duration-200 ease-in-out`}
    >
      {/* Brand + collapse toggle */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-border">
        <Link
          to="/"
          aria-label="Stratos home"
          className="flex items-center gap-2 min-w-0"
        >
          <span className="font-serif text-2xl tracking-tight text-foreground">
            S
          </span>
          {!collapsed && (
            <span className="text-sm font-medium text-foreground truncate">
              Stratos
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Scrolling middle area */}
      <div className="flex-1 overflow-y-auto py-3">
        <NavGroup items={primaryItems} collapsed={collapsed} isActive={isActive} />
        <Divider />
        <NavGroup items={workItems} collapsed={collapsed} isActive={isActive} />
        <Divider />
        <NavGroup items={advisorItems} collapsed={collapsed} isActive={isActive} />
      </div>

      {/* Footer: Settings + Create */}
      <div className="border-t border-border px-2 py-3 flex flex-col gap-2">
        <NavLink
          item={{ label: 'Settings', href: '/settings', icon: Settings2 }}
          active={isActive('/settings')}
          collapsed={collapsed}
        />
        <button
          type="button"
          onClick={onCreateClick}
          className={`mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors ${
            collapsed ? 'h-9 w-9 self-center p-0' : 'w-full'
          }`}
          aria-label="Create"
        >
          {collapsed ? <Plus className="h-4 w-4" /> : <span>Create</span>}
        </button>
      </div>
    </aside>
  )
}

function NavGroup({
  items,
  collapsed,
  isActive,
}: {
  items: NavItem[]
  collapsed: boolean
  isActive: (href: string) => boolean
}) {
  return (
    <ul className="px-2 flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item.href}>
          <NavLink
            item={item}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        </li>
      ))}
    </ul>
  )
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-muted font-medium text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto inline-flex h-5 min-w-[28px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-medium text-white">
          {item.badge}
        </span>
      )}
      {collapsed && item.badge && (
        <span
          className="absolute ml-5 -mt-4 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-medium text-white"
          aria-hidden="true"
        >
          •
        </span>
      )}
    </Link>
  )
}

function Divider() {
  return <div className="my-3 mx-3 border-t border-border" />
}
