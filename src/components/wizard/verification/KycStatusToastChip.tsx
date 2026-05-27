import { AlertTriangle, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ADVISOR_OWNER_VERIFICATION_BANNER,
  getAdvisorOwnerVerificationBannerCopy,
  type KycStatus,
  type KycStatusBadge,
  type KycStatusTone,
} from '@/utils/kycStatus'
import type { OwnerKycReviewState, RelatedParty } from '@/types/workflow'
import { KYC_ACCEPTED_SUPPORTING_DOCUMENTS_GUIDE_URL } from '@/utils/formsPackageKycReview'

const DEFAULT_UNVERIFIED_DESCRIPTION =
  'Verification will run automatically before final submission.'

type AlertVisual = {
  container: string
  icon: string
  title: string
  Icon: typeof AlertTriangle
}

function alertVisualForTone(tone: KycStatusTone, status?: KycStatus, label?: string): AlertVisual {
  if (
    status === 'unverified' ||
    label === 'Unverified' ||
    label === 'Not Started' ||
    tone === 'warning'
  ) {
    return {
      container: 'bg-amber-500/[0.08]',
      icon: 'text-amber-700 dark:text-amber-400',
      title: 'text-amber-700 dark:text-amber-300',
      Icon: AlertTriangle,
    }
  }
  if (tone === 'success' || status === 'pass' || label === 'Verified' || label === 'Pass') {
    return {
      container: 'bg-green-500/[0.08]',
      icon: 'text-green-700 dark:text-green-400',
      title: 'text-green-800 dark:text-green-300',
      Icon: CheckCircle2,
    }
  }
  if (tone === 'danger' || status === 'fail' || label === 'Fail') {
    return {
      container: 'bg-red-500/[0.08]',
      icon: 'text-red-700 dark:text-red-400',
      title: 'text-red-800 dark:text-red-300',
      Icon: AlertTriangle,
    }
  }
  return {
    container: 'bg-muted/60',
    icon: 'text-muted-foreground',
    title: 'text-foreground',
    Icon: Clock,
  }
}

function resolveReviewerAlertTitle(label: string): string {
  if (label === 'Unverified' || label === 'Not Started') return 'KYC Unverified'
  return `KYC ${label}`
}

function resolveReviewerAlertDescription(
  badge: KycStatusBadge | undefined,
  label: string,
  status?: KycStatus,
): string {
  if (badge?.hint?.trim()) return badge.hint.trim()
  if (status === 'unverified' || label === 'Unverified' || label === 'Not Started') {
    return DEFAULT_UNVERIFIED_DESCRIPTION
  }
  if (status === 'pass' || label === 'Verified' || label === 'Pass') {
    return 'Identity verification completed for this participant.'
  }
  if (status === 'fail' || label === 'Fail') {
    return 'Additional review or supporting documents may be required.'
  }
  if (status === 'pending_review' || label === 'Pending' || label === 'Pending Review') {
    return 'Verification checks are in progress.'
  }
  if (status === 'expired' || label === 'Expired') {
    return 'Verification has expired and may need to be renewed.'
  }
  return DEFAULT_UNVERIFIED_DESCRIPTION
}

/**
 * Advisor owner card — warning-only inline banner; hidden when verification is clear.
 */
export function OwnerVerificationAdvisorBanner({
  owner,
  party,
  className,
  showResourceLink = true,
}: {
  owner?: OwnerKycReviewState
  party?: RelatedParty
  className?: string
  showResourceLink?: boolean
}) {
  const { title, description } = getAdvisorOwnerVerificationBannerCopy(owner, party)

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 rounded-lg bg-amber-500/[0.08] p-4',
        className,
      )}
      role="status"
      aria-label={`${title}. ${description}`}
    >
      <div className="flex shrink-0 flex-col items-start justify-center pt-0.5">
        <AlertTriangle
          className="h-4 w-4 text-amber-700 dark:text-amber-400"
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-5 text-amber-700 dark:text-amber-300">
            {title}
          </p>
          <p className="text-sm font-normal leading-5 text-muted-foreground">{description}</p>
        </div>
        {showResourceLink ? (
          <a
            href={KYC_ACCEPTED_SUPPORTING_DOCUMENTS_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {ADVISOR_OWNER_VERIFICATION_BANNER.linkLabel}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Contact-card / reviewer verification alert.
 * Advisors should use {@link OwnerVerificationAdvisorBanner} instead.
 */
export function KycStatusContactCardAlert({
  badge,
  label,
  tone = 'neutral',
  variant = 'reviewer',
  owner,
  party,
  className,
}: {
  badge?: KycStatusBadge
  label?: string
  tone?: KycStatusTone
  variant?: 'advisor' | 'reviewer'
  owner?: OwnerKycReviewState
  party?: RelatedParty
  className?: string
}) {
  if (variant === 'advisor') {
    return <OwnerVerificationAdvisorBanner owner={owner} party={party} className={className} />
  }

  const resolvedLabel = badge?.label ?? label ?? 'Unverified'
  const resolvedTone = badge?.tone ?? tone
  const visual = alertVisualForTone(resolvedTone, badge?.status, resolvedLabel)
  const title = resolveReviewerAlertTitle(resolvedLabel)
  const description = resolveReviewerAlertDescription(badge, resolvedLabel, badge?.status)
  const { Icon } = visual

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 rounded-lg p-4',
        visual.container,
        className,
      )}
      role="status"
      aria-label={`${title}. ${description}`}
    >
      <div className="flex shrink-0 flex-col items-start justify-center pt-0.5">
        <Icon className={cn('h-4 w-4', visual.icon)} aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn('text-sm font-medium leading-5', visual.title)}>{title}</p>
        <p className="text-sm font-normal leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

/** @deprecated Use {@link KycStatusContactCardAlert}. */
export const KycStatusToastChip = KycStatusContactCardAlert
