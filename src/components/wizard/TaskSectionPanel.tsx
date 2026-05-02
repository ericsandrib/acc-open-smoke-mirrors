import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TaskSectionPanelProps {
  sections: Array<{ id: string; label: string }>
  onSelectSection: (sectionId: string) => void
}

export function TaskSectionPanel({ sections, onSelectSection }: TaskSectionPanelProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  useEffect(() => {
    setActiveSectionId(sections[0]?.id ?? null)
  }, [sections])

  const handleSectionClick = (sectionId: string) => {
    setActiveSectionId(sectionId)
    onSelectSection(sectionId)
  }

  return (
    <nav className="w-48 border-r border-border bg-sidebar-background p-3 overflow-y-auto shrink-0">
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => handleSectionClick(section.id)}
              aria-current={activeSectionId === section.id ? 'page' : undefined}
              className={cn(
                'w-full text-left px-3 py-2 text-sm rounded-md transition-colors border border-transparent',
                activeSectionId === section.id
                  ? 'bg-accent/60 text-foreground border-border font-medium'
                  : 'text-foreground/85 hover:text-foreground hover:bg-muted/50',
              )}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
