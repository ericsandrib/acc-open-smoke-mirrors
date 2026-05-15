import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ReviewSummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === '—') return null
  return (
    <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-x-4 gap-y-1 py-2.5 border-b border-border/60 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground text-right">{value}</dd>
    </div>
  )
}

export function ReviewSummarySection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p> : null}
      </div>
      <dl className="px-4 py-1">{children}</dl>
    </section>
  )
}
