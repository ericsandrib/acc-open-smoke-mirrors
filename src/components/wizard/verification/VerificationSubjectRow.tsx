import { KycStatusPill } from '@/components/wizard/verification/KycStatusPill'
import type { KycStatusBadge } from '@/utils/kycStatus'
import { getSubjectInitials } from '@/utils/ownerVerificationSubjectUx'

export function VerificationSubjectRow({
  name,
  subjectTypeLabel,
  badge,
  onClick,
}: {
  name: string
  subjectTypeLabel: string
  badge: KycStatusBadge
  onClick: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {getSubjectInitials(name)}
        </div>
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{subjectTypeLabel}</span>
      </div>

      <KycStatusPill badge={badge} className="shrink-0" />
    </div>
  )
}
