import { Calendar, Mail, MessageSquare } from 'lucide-react'
import type { Relationship } from '@/data/relationshipsSeed'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function OverviewTab({ r }: { r: Relationship }) {
  const total = r.totalAum ?? r.aum ?? 0

  return (
    <div className="flex flex-col gap-5">
      {/* Quick stats */}
      <div className="rounded-xl border border-border bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          <div className="bg-white px-5 py-4">
            <div className="text-xs text-muted-foreground">Total AUM</div>
            <div className="mt-1 text-xl font-semibold text-foreground tabular-nums">
              {formatMoney(total)}
            </div>
          </div>
          <div className="bg-white px-5 py-4">
            <div className="text-xs text-muted-foreground">Offering</div>
            <div className="mt-1 text-base font-medium text-foreground">
              {r.offering}
            </div>
          </div>
          <div className="bg-white px-5 py-4">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="mt-1 text-base font-medium text-foreground">
              {r.status ?? r.type}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-white">
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Recent Activity
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {[
            {
              icon: Calendar,
              title: 'Last meeting',
              detail: r.lastMeeting || 'Not Scheduled',
            },
            {
              icon: Mail,
              title: 'Last email',
              detail: 'Re: RTC/PR Strategies — Apr 15, 2026',
            },
            {
              icon: MessageSquare,
              title: 'Last note',
              detail: 'Tax-loss harvesting opportunity flagged',
            },
          ].map(({ icon: Icon, title, detail }) => (
            <li key={title} className="px-5 py-3 flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground">{detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
