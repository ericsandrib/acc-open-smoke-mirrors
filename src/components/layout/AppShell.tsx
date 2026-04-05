import { useState } from 'react'
import { VerticalNav } from '@/components/navigation/vertical-nav'
import { ComposeDialog } from '@/components/dashboard/ComposeDialog'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [composeOpen, setComposeOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <VerticalNav onCreateClick={() => setComposeOpen(true)} />

      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>

      <div id="filter-sidebar-portal" />

      {composeOpen && <ComposeDialog onClose={() => setComposeOpen(false)} />}
    </div>
  )
}
