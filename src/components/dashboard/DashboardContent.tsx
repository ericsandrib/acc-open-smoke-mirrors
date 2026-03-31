import { Users, Clock, CheckCircle2 } from 'lucide-react'

const stats = [
  { label: 'Active Onboardings', value: '3', icon: Users },
  { label: 'Pending Reviews', value: '7', icon: Clock },
  { label: 'Completed This Month', value: '12', icon: CheckCircle2 },
]

export function DashboardContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Here's an overview of your wealth management activity.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
