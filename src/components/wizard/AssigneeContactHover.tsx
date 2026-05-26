import { Copy, Mail, Phone, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { resolveJourneyAssignee, getAssigneeInitials } from '@/data/journeyAssigneeDirectory'
import { cn } from '@/lib/utils'

function copyField(label: string, value: string) {
  void navigator.clipboard.writeText(value).then(
    () => {
      toast.success('Copied', { description: `${label} copied to clipboard.`, duration: 3000 })
    },
    () => {
      toast.error('Could not copy')
    },
  )
}

function ContactBlock({
  fieldLabel,
  value,
  icon: Icon,
}: {
  fieldLabel: string
  value: string
  icon: typeof Mail
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
        <span className="text-xs text-muted-foreground">{fieldLabel}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-foreground">{value}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
          aria-label={`Copy ${fieldLabel.toLowerCase()}`}
          onClick={(e) => {
            e.stopPropagation()
            copyField(fieldLabel, value)
          }}
        >
          <Copy className="h-3 w-3" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

function CardBody({ profile }: { profile: NonNullable<ReturnType<typeof resolveJourneyAssignee>> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border',
            'bg-primary/10 text-base font-medium text-primary',
          )}
          aria-hidden
        >
          {profile.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
          <p className="truncate text-xs text-muted-foreground">{profile.title}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-1">
        <ContactBlock fieldLabel="Email" value={profile.email} icon={Mail} />
        <ContactBlock fieldLabel="Phone" value={profile.phone} icon={Phone} />
      </div>
    </div>
  )
}

export function AvatarGlyph({
  name,
  unassigned,
  size = 'default',
}: {
  name?: string
  unassigned?: boolean
  size?: 'default' | 'compact'
}) {
  const initials = name ? getAssigneeInitials(name) : ''
  const avatarSize =
    size === 'compact'
      ? 'box-border flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2'
      : 'box-border flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2'
  const userIconClass = size === 'compact' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  const initialsClass = size === 'compact' ? 'text-[9px]' : 'text-[10px]'

  if (unassigned) {
    return (
      <span
        className={cn(
          avatarSize,
          'border-dashed border-muted-foreground/50 bg-muted/15',
        )}
        aria-hidden
      >
        <User className={cn(userIconClass, 'text-muted-foreground')} />
      </span>
    )
  }
  return (
    <span
      className={cn(
        avatarSize,
        'border-transparent bg-primary/10 font-semibold text-primary',
        initialsClass,
      )}
      aria-hidden
    >
      {initials || <User className={userIconClass} />}
    </span>
  )
}

/** Compact count badge when an action has multiple distinct assignees across tasks. */
export function MultiAssigneeCountGlyph({
  count,
  size = 'default',
}: {
  count: number
  size?: 'default' | 'compact'
}) {
  const avatarSize =
    size === 'compact'
      ? 'box-border flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2'
      : 'box-border flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2'
  const countClass = size === 'compact' ? 'text-[9px]' : 'text-[10px]'

  return (
    <span
      className={cn(
        avatarSize,
        'border-transparent bg-primary/10 font-semibold tabular-nums text-primary',
        countClass,
      )}
      aria-hidden
    >
      {count}
    </span>
  )
}

/**
 * Journey header assignee chip: small avatar + Basis-style contact card on hover (pointer/desktop).
 */
export function AssigneeContactHover({
  assigneeLabel,
  size = 'default',
}: {
  assigneeLabel?: string
  size?: 'default' | 'compact'
}) {
  const trimmed = (assigneeLabel ?? '').trim()
  const profile = resolveJourneyAssignee(assigneeLabel)

  if (!profile) {
    return (
      <span
        className="inline-flex shrink-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        role="img"
        aria-label={trimmed && trimmed !== 'Unassigned' ? `Assigned to ${trimmed}` : 'Unassigned'}
        title={trimmed && trimmed !== 'Unassigned' ? trimmed : 'Unassigned'}
      >
        <AvatarGlyph unassigned size={size} />
      </span>
    )
  }

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Assigned to ${profile.name}. Hover for contact details.`}
        >
          <AvatarGlyph name={profile.name} size={size} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="end" className="p-5">
        <CardBody profile={profile} />
      </HoverCardContent>
    </HoverCard>
  )
}
