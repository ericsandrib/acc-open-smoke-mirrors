import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface TaskSectionPanelProps {
  sections: Array<{ id: string; label: string }>
  onSelectSection: (sectionId: string) => void
}

export function TaskSectionPanel({ sections, onSelectSection }: TaskSectionPanelProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset to first section only when the actual task sections change (not on every re-render).
  // Using a stable key instead of the array reference avoids spurious resets.
  const sectionsKey = sections.map((s) => s.id).join(',')
  useEffect(() => {
    setActiveId(sections[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsKey])

  function handleSectionClick(sectionId: string) {
    setActiveId(sectionId)
    onSelectSection(sectionId)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setIsHovering(false), 150)
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  const effectiveActiveId = activeId ?? sections[0]?.id

  return (
    <div
      className="relative shrink-0 w-6 ml-4 flex flex-col items-center justify-center gap-2"
      onMouseEnter={() => { cancelClose(); setIsHovering(true) }}
      onMouseLeave={scheduleClose}
    >
      {sections.map((section) => {
        const isActive = section.id === effectiveActiveId
        return (
          <button
            key={section.id}
            type="button"
            aria-label={section.label}
            onClick={() => handleSectionClick(section.id)}
            className={cn(
              'w-3 h-0.5 rounded-full transition-colors duration-150 cursor-pointer',
              isActive
                ? 'bg-foreground/80'
                : 'bg-border hover:bg-muted-foreground/60',
            )}
          />
        )
      })}

      {isHovering && sections.length > 0 && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-popover border border-border rounded-lg shadow-md py-1 min-w-52"
          onMouseEnter={() => { cancelClose(); setIsHovering(true) }}
          onMouseLeave={scheduleClose}
        >
          {sections.map((section) => {
            const isActive = section.id === effectiveActiveId
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionClick(section.id)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'text-foreground font-medium bg-accent/60'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted/50',
                )}
              >
                {section.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
