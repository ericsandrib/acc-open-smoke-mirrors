import { Calendar, MoreVertical, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type PizzaTrackerHeaderMenuProps = {
  showDueDate: boolean
  showAssignee: boolean
  onShowDueDateChange: (value: boolean) => void
  onShowAssigneeChange: (value: boolean) => void
}

function ToggleMenuRow({
  icon: Icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: typeof Calendar
  label: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-3 py-2',
        'text-xs font-medium text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  )
}

export function PizzaTrackerHeaderMenu({
  showDueDate,
  showAssignee,
  onShowDueDateChange,
  onShowAssigneeChange,
}: PizzaTrackerHeaderMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Pizza tracker display options"
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px] p-1">
        <ToggleMenuRow
          icon={Calendar}
          label="Show Due Date"
          checked={showDueDate}
          onCheckedChange={onShowDueDateChange}
        />
        <ToggleMenuRow
          icon={User}
          label="Show Assignee"
          checked={showAssignee}
          onCheckedChange={onShowAssigneeChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
