import { PageTitle } from '@/components/page-title'

export function DashboardContent() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Welcome back"
        subHead="Here's an overview of your wealth management activity."
      />

      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-4 rounded bg-muted" />
            </div>
            <div className="mt-3 h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
