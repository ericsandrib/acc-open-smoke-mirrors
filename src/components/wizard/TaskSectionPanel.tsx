import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type FlatSection = { id: string; label: string }

type SectionGroup = {
  key: string
  /** Empty/falsy label = standalone item (popover renders the section directly with no header). */
  label: string
  sections: FlatSection[]
}

interface TaskSectionPanelProps {
  sections: FlatSection[]
  onSelectSection: (sectionId: string) => void
  /**
   * Optional hierarchical grouping. When provided, the popover renders sections grouped under
   * their parent label and `onSelectGroupSection` is invoked instead of `onSelectSection`.
   * The compact dot-bar still renders one dot per section and inserts a small spacer between
   * groups so the two layers are visually discoverable.
   */
  groups?: SectionGroup[]
  onSelectGroupSection?: (groupKey: string, sectionId: string) => void
}

/**
 * Section scroll-spy. At narrow viewports renders as a compact tick column with
 * a hover-revealed label popover; at >=2xl it expands into its own labels
 * column that stays sticky while the form scrolls.
 */
export function TaskSectionPanel({
  sections,
  onSelectSection,
  groups,
  onSelectGroupSection,
}: TaskSectionPanelProps) {
  const flatFromGroups = groups
    ? groups.flatMap((group) =>
        group.sections.map((s) => ({ key: `${group.key}::${s.id}`, group, section: s })),
      )
    : null
  const flatList = flatFromGroups
    ? flatFromGroups.map((entry) => ({ id: entry.key, label: entry.section.label }))
    : sections

  const [isHovering, setIsHovering] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(flatList[0]?.id ?? null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset to first section only when the actual task sections change (not on every re-render).
  // Using a stable key instead of the array reference avoids spurious resets.
  const sectionsKey = flatList.map((s) => s.id).join(',')
  useEffect(() => {
    setActiveId(flatList[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsKey])

  function selectFlatSection(section: FlatSection) {
    setActiveId(section.id)
    onSelectSection(section.id)
  }

  function selectGroupSection(group: SectionGroup, section: FlatSection) {
    const composite = `${group.key}::${section.id}`
    setActiveId(composite)
    onSelectGroupSection?.(group.key, section.id)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setIsHovering(false), 150)
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  const effectiveActiveId = activeId ?? flatList[0]?.id

  return (
    <div
      className="relative shrink-0 w-6 2xl:w-52 ml-4 2xl:mx-14 flex flex-col items-center 2xl:items-stretch justify-center 2xl:justify-start 2xl:sticky 2xl:top-8 2xl:py-8 2xl:self-start gap-2 2xl:gap-1"
      onMouseEnter={() => { cancelClose(); setIsHovering(true) }}
      onMouseLeave={scheduleClose}
    >
      {/* Compact tick column: visible below 2xl */}
      <div className="flex flex-col items-center gap-2 2xl:hidden">
        {groups && flatFromGroups
          ? groups.map((group, groupIndex) => (
              <div key={group.key} className="flex flex-col items-center gap-2">
                {group.sections.map((section) => {
                  const compositeId = `${group.key}::${section.id}`
                  const isActive = compositeId === effectiveActiveId
                  return (
                    <button
                      key={compositeId}
                      type="button"
                      aria-label={`${group.label} — ${section.label}`}
                      onClick={() => selectGroupSection(group, section)}
                      className={cn(
                        'w-3 h-0.5 rounded-full transition-colors duration-150 cursor-pointer',
                        isActive
                          ? 'bg-foreground/80'
                          : 'bg-border hover:bg-muted-foreground/60',
                      )}
                    />
                  )
                })}
                {groupIndex < groups.length - 1 ? (
                  <span className="block h-0.5 w-1.5 rounded-full bg-border/60" aria-hidden />
                ) : null}
              </div>
            ))
          : sections.map((section) => {
              const isActive = section.id === effectiveActiveId
              return (
                <button
                  key={section.id}
                  type="button"
                  aria-label={section.label}
                  onClick={() => selectFlatSection(section)}
                  className={cn(
                    'w-3 h-0.5 rounded-full transition-colors duration-150 cursor-pointer',
                    isActive
                      ? 'bg-foreground/80'
                      : 'bg-border hover:bg-muted-foreground/60',
                  )}
                />
              )
            })}
      </div>

      {/* Hover popover for the compact column */}
      {isHovering && flatList.length > 0 && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-popover border border-border rounded-lg shadow-md py-1 min-w-56 2xl:hidden"
          onMouseEnter={() => { cancelClose(); setIsHovering(true) }}
          onMouseLeave={scheduleClose}
        >
          {groups
            ? groups.map((group, groupIndex) => (
                <div key={group.key} className={cn(groupIndex > 0 && 'border-t border-border mt-1 pt-1')}>
                  {group.label ? (
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </div>
                  ) : null}
                  {group.sections.map((section) => {
                    const compositeId = `${group.key}::${section.id}`
                    const isActive = compositeId === effectiveActiveId
                    return (
                      <button
                        key={compositeId}
                        type="button"
                        onClick={() => selectGroupSection(group, section)}
                        className={cn(
                          'w-full text-left pr-3 py-1.5 text-sm transition-colors',
                          group.label ? 'pl-5' : 'pl-3',
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
              ))
            : sections.map((section) => {
                const isActive = section.id === effectiveActiveId
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => selectFlatSection(section)}
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

      {/* Expanded labels column: visible at >=2xl */}
      <nav
        aria-label="Task sections"
        className="hidden 2xl:flex flex-col gap-0.5 w-full"
      >
        {groups
          ? groups.map((group, groupIndex) => (
              <div
                key={group.key}
                className={cn(
                  'flex flex-col gap-0.5',
                  groupIndex > 0 && 'border-t border-border mt-2 pt-2',
                )}
              >
                {group.label ? (
                  <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </div>
                ) : null}
                {group.sections.map((section) => {
                  const compositeId = `${group.key}::${section.id}`
                  const isActive = compositeId === effectiveActiveId
                  return (
                    <button
                      key={compositeId}
                      type="button"
                      onClick={() => selectGroupSection(group, section)}
                      className={cn(
                        'w-full text-left text-sm py-1.5 rounded-md transition-colors truncate',
                        group.label ? 'pl-5 pr-3' : 'px-3',
                        isActive
                          ? 'bg-accent/60 text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      )}
                    >
                      {section.label}
                    </button>
                  )
                })}
              </div>
            ))
          : sections.map((section) => {
              const isActive = section.id === effectiveActiveId
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => selectFlatSection(section)}
                  className={cn(
                    'w-full text-left text-sm py-1.5 px-3 rounded-md transition-colors truncate',
                    isActive
                      ? 'bg-accent/60 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  {section.label}
                </button>
              )
            })}
      </nav>
    </div>
  )
}
