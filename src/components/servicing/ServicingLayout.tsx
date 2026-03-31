import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { ComposeDialog } from '@/components/dashboard/ComposeDialog'
import { ServicingContent } from './ServicingContent'

export function ServicingLayout() {
  const [composeOpen, setComposeOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        activeItem="Servicing"
        onCreateClick={() => setComposeOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-8">
        <ServicingContent />
      </main>

      {composeOpen && <ComposeDialog onClose={() => setComposeOpen(false)} />}
    </div>
  )
}
