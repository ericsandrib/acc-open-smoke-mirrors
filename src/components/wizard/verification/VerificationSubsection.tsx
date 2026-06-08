import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { VerificationKycStatusBadge } from '@/components/wizard/verification/VerificationKycStatusBadge'
import type { VerificationCardStatus } from '@/utils/kycPassFail'

export function VerificationSubsection({
  label,
  status,
  failReason,
  children,
  className,
}: {
  label: string
  status: VerificationCardStatus
  failReason?: string
  children: ReactNode
  className?: string
}) {
  const failed = status === 'Fail'

  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <VerificationKycStatusBadge outcome={status} size="subsection" />
      </div>
      {failed && failReason ? (
        <p className="text-xs text-red-800 dark:text-red-300 leading-snug">{failReason}</p>
      ) : null}
      {children}
    </section>
  )
}
