import { useState } from 'react'
import { SideNav } from '@/components/navigation/side-nav'
import { ComposeDialog } from '@/components/dashboard/ComposeDialog'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [composeOpen, setComposeOpen] = useState(false)
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <SideNav
        collapsed={sideNavCollapsed}
        onToggle={() => setSideNavCollapsed((c) => !c)}
        onCreateClick={() => setComposeOpen(true)}
      />

      <main className="flex-1 overflow-y-auto px-8 pt-8 pb-4">
        {children}
      </main>

      <div id="filter-sidebar-portal" />

      {composeOpen && <ComposeDialog onClose={() => setComposeOpen(false)} />}
    </div>
  )
}
