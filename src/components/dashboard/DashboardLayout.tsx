import { useState } from 'react'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardContent } from './DashboardContent'
import { ComposeDialog } from './ComposeDialog'

export function DashboardLayout() {
  const [composeOpen, setComposeOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar onCreateClick={() => setComposeOpen(true)} />

      <main className="flex-1 overflow-y-auto p-8">
        <DashboardContent />
      </main>

      {composeOpen && <ComposeDialog onClose={() => setComposeOpen(false)} />}
    </div>
  )
}
