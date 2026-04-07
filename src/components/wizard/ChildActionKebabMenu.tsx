import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Info, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChildActionKebabMenuProps {
  onViewDetails: () => void
  onDelete?: () => void
  className?: string
}

export function ChildActionKebabMenu({ onViewDetails, onDelete, className }: ChildActionKebabMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((p) => !p)
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-background shadow-lg py-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onViewDetails()
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Info className="h-4 w-4" />
            View Details
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onDelete()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
