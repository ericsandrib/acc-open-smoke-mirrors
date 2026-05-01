import { cn } from '@/lib/utils'

export type TaskSectionItem = {
  id: string
  label: string
}

export function TaskSectionNav({
  title = 'Task sections',
  sections,
  className,
}: {
  title?: string
  sections: TaskSectionItem[]
  className?: string
}) {
  return (
    <div className={cn('sticky top-0 z-10 rounded-md border border-border bg-background/95 backdrop-blur px-3 py-2', className)}>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {section.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
