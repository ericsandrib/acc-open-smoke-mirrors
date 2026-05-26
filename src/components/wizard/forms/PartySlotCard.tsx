import { type ReactNode, useCallback, useMemo } from 'react'
import type { RelatedParty } from '@/types/workflow'
import { useWorkflow } from '@/stores/workflowStore'
import { deriveChildDisplayStatus, childStatusConfig } from '@/utils/childStatusDisplay'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectSeparator,
} from '@/components/ui/select'
import { buildAccountOwnerPreview, buildDesignationPartyPreview } from '@/utils/accountOwnerPreview'
import { AML_KYC_VALIDITY_DAYS, getAmlRenewalSummary } from '@/utils/amlKycRenewal'
import { getKycStatusBadge, type KycStatusBadge } from '@/utils/kycStatus'
import { getOwnerReviewState } from '@/utils/ownerKycReview'
import { isOpenAccountsTask } from '@/utils/openAccountsTaskContext'
import { KycStatusPill } from '@/components/wizard/verification/KycStatusPill'
import { KycStatusContactCardAlert } from '@/components/wizard/verification/KycStatusToastChip'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useOwnerContactCardDial } from '@/components/wizard/forms/ownerContactCardDial'
import { Plus, Trash2, Pencil, AlertTriangle, Info, Star } from 'lucide-react'

const ADD_PARTY_VALUE = '__add_party__'
const KYC_STATUS_INFO_TOOLTIP = 'Verification will run automatically before final submission.'
const CONTACT_CARD_KYC_BADGE_BASE =
  'w-fit max-w-max shrink-0 rounded-full px-2 py-0.5 text-xs font-medium'

function resolveContactCardKycLabel(kycLabel: string | undefined): string {
  if (!kycLabel || kycLabel === 'Not Started') return 'Unverified'
  return kycLabel
}

function resolveFallbackKycTone(label: string): KycStatusBadge['tone'] {
  if (label === 'Unverified' || label === 'Fail') return 'warning'
  if (label === 'Verified' || label === 'Pass') return 'success'
  if (label === 'Pending' || label.includes('Review')) return 'neutral'
  return 'neutral'
}

function ContactCardKycStatusValue({
  version,
  embeddedKycBadge,
  kycLabel,
  kycDisplayStatus,
  trustOverallKyc,
}: {
  version: 'v1' | 'v2'
  embeddedKycBadge: KycStatusBadge | null
  kycLabel: string | undefined
  kycDisplayStatus: { label: string; className?: string } | null
  trustOverallKyc: { label: string; className?: string } | null | undefined
}) {
  const displayLabel = resolveContactCardKycLabel(kycLabel)

  if (version === 'v2') {
    if (embeddedKycBadge) {
      return <KycStatusContactCardAlert badge={embeddedKycBadge} className="mt-4 w-full" />
    }
    return (
      <KycStatusContactCardAlert
        label={displayLabel}
        tone={resolveFallbackKycTone(displayLabel)}
        className="mt-4 w-full"
      />
    )
  }

  if (embeddedKycBadge) {
    if (embeddedKycBadge.status === 'unverified') {
      return (
        <Badge variant="warning" className={CONTACT_CARD_KYC_BADGE_BASE}>
          {embeddedKycBadge.label}
        </Badge>
      )
    }
    return (
      <KycStatusPill
        badge={embeddedKycBadge}
        className="w-fit max-w-max shrink-0 px-2 py-0.5 text-xs"
      />
    )
  }

  return (
    <Badge
      variant={displayLabel === 'Unverified' ? 'warning' : 'outline'}
      className={cn(
        CONTACT_CARD_KYC_BADGE_BASE,
        displayLabel !== 'Unverified' &&
          cn(
            'border-0',
            kycDisplayStatus?.className ??
              trustOverallKyc?.className ??
              'bg-foreground/5 text-muted-foreground',
          ),
      )}
    >
      {displayLabel}
    </Badge>
  )
}

function MetadataRow({
  label,
  value,
  missing,
  labelAdornment,
  layout = 'vertical',
}: {
  label: string
  value: string
  missing?: boolean
  labelAdornment?: ReactNode
  layout?: 'vertical' | 'horizontal'
}) {
  if (layout === 'horizontal') {
    return (
      <div className="flex w-full min-w-0 items-start gap-5 py-1">
        <div className="flex w-36 shrink-0 items-center gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          {labelAdornment}
        </div>
        <p
          className={cn(
            'min-w-0 flex-1 text-sm font-medium break-words',
            missing ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {missing ? '-----------' : value}
        </p>
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 py-1">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {labelAdornment}
        </div>
        <p
          className={cn(
            'text-sm font-medium break-words',
            missing ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {missing ? '-----------' : value}
        </p>
      </div>
    </div>
  )
}

function formatPreviewLabel(label: string): string {
  if (label === 'Tax ID (SSN / TIN)') return 'Tax ID'
  if (label === 'Legal address') return 'Legal Address'
  if (label === 'Suitability snapshot') return 'Suitability snapshot'
  return label
}

function resolveOwnerRoleLabel(party: RelatedParty, roleLabel?: string): string | null {
  if (party.isPrimary) return 'Primary'
  if (party.role?.trim()) return party.role.trim()
  if (roleLabel?.trim()) return roleLabel.trim()
  return null
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export type PartySlotCardProps = {
  title: string
  selectLabel: string
  partyId: string | undefined
  onPartyIdChange: (partyId: string) => void
  onRemove?: () => void
  /** All parties for resolving selection → profile */
  parties: RelatedParty[]
  /** Subset shown in the dropdown */
  selectCandidates: RelatedParty[]
  onOpenAddParty: () => void
  onEditParty: (partyId: string) => void
  onDeleteCandidate?: (partyId: string) => void
  canDeleteCandidate?: (party: RelatedParty) => { allowed: boolean; reason?: string }
  addPartyItemLabel?: string
  addPartyItemDescription?: string
  /** Shown next to the title so owners vs interested parties vs beneficiaries are obvious at a glance */
  roleLabel?: string
  /**
   * `designation` — beneficiaries / interested parties: minimal preview, no KYC strip, no owner-style gap alerts.
   */
  previewVariant?: 'account_owner' | 'designation'
  /** Hide built-in profile details and render custom footer-only details. */
  hideDefaultDetails?: boolean
  footer?: ReactNode
  onStartKyc?: (partyId: string) => void
  onGoToKyc?: (partyId: string) => void
  showKycStatus?: boolean
  /** When set, resolve participant KYC from embedded owner review state (single-flow KYC). */
  accountChildId?: string
  /** When true (e.g. account-opening child workflow), show last AML run and days remaining in the AML portion of KYC. */
  showKycAmlSchedule?: boolean
}

export function PartySlotCard({
  title,
  selectLabel,
  partyId,
  onPartyIdChange,
  onRemove,
  parties,
  selectCandidates,
  onOpenAddParty,
  onEditParty,
  onDeleteCandidate,
  canDeleteCandidate,
  addPartyItemLabel = 'Search or add a person or entity',
  addPartyItemDescription,
  roleLabel,
  previewVariant = 'account_owner',
  hideDefaultDetails = false,
  footer,
  onStartKyc,
  onGoToKyc,
  showKycStatus = true,
  accountChildId,
  showKycAmlSchedule = false,
}: PartySlotCardProps) {
  const { state } = useWorkflow()
  const ownerContactCardDial = useOwnerContactCardDial()
  const matchedParty = partyId ? parties.find((p) => p.id === partyId) ?? null : null
  const findKycChildForParty = useCallback((party: RelatedParty | undefined) => {
    if (!party) return null
    const kycStandalone = state.tasks.find((t) => t.formKey === 'kyc')
    const parents = kycStandalone
      ? [kycStandalone]
      : state.tasks.filter((t) => isOpenAccountsTask(t))
    for (const kycParentTask of parents) {
      const found = kycParentTask.children?.find((c) => {
        if (c.childType !== 'kyc') return false
        const meta = state.taskData[c.id] as Record<string, unknown> | undefined
        if ((meta?.kycSubjectPartyId as string | undefined) === party.id) return true
        return c.name === party.name
      })
      if (found) return found
    }
    return null
  }, [state.tasks, state.taskData])

  const getPartyKycDisplayStatus = useCallback((party: RelatedParty | undefined) => {
    if (!party) return null
    const isTrustEntity =
      party.type === 'related_organization' && (party.entityType ?? '').trim().toLowerCase() === 'trust'
    if (isTrustEntity) {
      const kycChild = findKycChildForParty(party)
      if (kycChild) {
        const reviewState = state.childReviewsByChildId?.[kycChild.id]
        if (deriveChildDisplayStatus(kycChild.status, reviewState) === 'complete') {
          return { label: 'Verified', className: 'bg-green-50 text-green-700 border-green-200' }
        }
      }
      if (party.kycStatus === 'verified') {
        return { label: 'Verified', className: 'bg-green-50 text-green-700 border-green-200' }
      }
      return { label: 'Not Started', className: 'bg-red-50 text-red-700 border-red-200' }
    }
    const kycChild = findKycChildForParty(party)
    if (kycChild) {
      const reviewState = state.childReviewsByChildId?.[kycChild.id]
      const ds = deriveChildDisplayStatus(kycChild.status, reviewState)
      return ds === 'complete'
        ? { label: 'Verified', className: 'bg-green-50 text-green-700 border-green-200' }
        : childStatusConfig[ds]
    }
    if (party.kycStatus === 'verified') {
      return { label: 'Verified', className: 'bg-green-100 text-green-800 border-green-200' }
    }
    if (party.kycStatus === 'needs_kyc') {
      return { label: 'Not Started', className: 'bg-red-50 text-red-700 border-red-200' }
    }
    if (party.kycStatus === 'pending') {
      return { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' }
    }
    return null
  }, [findKycChildForParty, state.childReviewsByChildId])

  const getPartyKycAction = useCallback((party: RelatedParty | undefined): 'start' | 'go' | null => {
    if (!party) return null
    const includedInTrustCase = state.tasks.some((task) =>
      task.children?.some((child) => {
        if (child.childType !== 'kyc') return false
        const meta = state.taskData[child.id] as Record<string, unknown> | undefined
        const subjectType = meta?.kycSubjectType as string | undefined
        const relatedIds = meta?.kycRelatedSubjectPartyIds as string[] | undefined
        return subjectType === 'entity' && Array.isArray(relatedIds) && relatedIds.includes(party.id)
      }),
    )
    if (includedInTrustCase) return null
    const kycChild = findKycChildForParty(party)
    if (kycChild) {
      const reviewState = state.childReviewsByChildId?.[kycChild.id]
      const ds = deriveChildDisplayStatus(kycChild.status, reviewState)
      return ds === 'complete' ? null : 'go'
    }
    if (party.kycStatus === 'verified') return null
    if (party.kycStatus === 'pending') return 'go'
    if (party.kycStatus === 'needs_kyc') return 'start'
    return null
  }, [findKycChildForParty, state.tasks, state.taskData, state.childReviewsByChildId])

  const kycDisplayStatus = useMemo(() => {
    if (!matchedParty) return null
    return getPartyKycDisplayStatus(matchedParty)
  }, [getPartyKycDisplayStatus, matchedParty])
  const amlRenewal = useMemo(() => {
    if (!matchedParty?.lastAmlRunAt) return null
    return getAmlRenewalSummary(matchedParty.lastAmlRunAt)
  }, [matchedParty?.lastAmlRunAt])
  const ownerPreview = matchedParty
    ? previewVariant === 'designation'
      ? buildDesignationPartyPreview(matchedParty)
      : buildAccountOwnerPreview(matchedParty)
    : null
  const isDesignationPreview = previewVariant === 'designation'
  const useSurfaceLayout = previewVariant === 'account_owner' && !hideDefaultDetails
  const contactFieldLayout =
    useSurfaceLayout && ownerContactCardDial.layoutVersion === 'v2' ? 'horizontal' : 'vertical'
  const useHorizontalContactFields = contactFieldLayout === 'horizontal'
  const trustOverallKyc = useMemo(() => {
    if (!matchedParty || matchedParty.type !== 'related_organization') return null
    return getPartyKycDisplayStatus(matchedParty)
  }, [getPartyKycDisplayStatus, matchedParty])

  const ownerRoleLabel = matchedParty ? resolveOwnerRoleLabel(matchedParty, roleLabel) : null

  const renderEmptySelect = (
    fieldLabel: string = selectLabel,
    { showRemove = false }: { showRemove?: boolean } = {},
  ) => (
    <div className="space-y-3">
      <div className={cn('flex items-center gap-2', showRemove && 'justify-between')}>
        <Label>{fieldLabel}</Label>
        {showRemove && onRemove ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            type="button"
            aria-label={`Remove ${fieldLabel}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      <Select
        value={partyId ?? ''}
        onValueChange={(v) => {
          if (v === ADD_PARTY_VALUE) {
            onOpenAddParty()
            return
          }
          onPartyIdChange(v)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent>
          {selectCandidates.length > 0 ? (
            selectCandidates.map((party) => (
              <SelectItem key={party.id} value={party.id} textValue={party.name} className="group">
                {/*
                  Name + badge stay grouped on the left; delete is in its own column so it does not sit
                  under Radix’s selection checkmark. Middle “gap” stays inside the label group when the
                  name is short (avoids a huge space between name and badge).
                */}
                <span className="flex w-full min-w-0 items-center gap-2">
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    <span className="truncate">{party.name}</span>
                    {party.type === 'related_organization' && (
                      <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                        Entity
                      </Badge>
                    )}
                  </span>
                  {onDeleteCandidate ? (
                    (() => {
                      const rule = canDeleteCandidate?.(party) ?? { allowed: true as const, reason: undefined }
                      if (!rule.allowed) return null
                      return (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-7 w-7 shrink-0 -mr-1 touch-manipulation text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
                            'transition-opacity duration-150',
                            '[@media(pointer:coarse)]:opacity-100 [@media(pointer:fine)]:opacity-0 [@media(pointer:fine)]:group-hover:opacity-100 focus-visible:opacity-100',
                          )}
                          title="Remove from list"
                          onPointerDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onDeleteCandidate(party.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )
                    })()
                  ) : null}
                </span>
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-3 text-xs text-muted-foreground">
              No matches — use add below.
            </div>
          )}
          <SelectSeparator />
          <SelectItem
            value={ADD_PARTY_VALUE}
            className="whitespace-normal py-2.5 pl-2 pr-8 [&>span]:items-start"
            textValue={addPartyItemLabel}
          >
            <span className="flex gap-2 text-left">
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
              <span>
                {addPartyItemDescription ? (
                  <>
                    <span className="font-medium">{addPartyItemLabel}</span>
                    <span className="block text-muted-foreground text-xs mt-0.5">{addPartyItemDescription}</span>
                  </>
                ) : (
                  addPartyItemLabel
                )}
              </span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const renderSurfaceMatchedParty = () => {
    if (!matchedParty || !ownerPreview) return null

    const ownerReview =
      accountChildId && matchedParty.type !== 'related_organization'
        ? getOwnerReviewState(state, accountChildId, matchedParty.id)
        : undefined
    const embeddedKycBadge =
      accountChildId && matchedParty.type !== 'related_organization'
        ? getKycStatusBadge(ownerReview, matchedParty)
        : null

    const kycLabel =
      matchedParty.type === 'related_organization'
        ? trustOverallKyc?.label
        : embeddedKycBadge?.label ?? kycDisplayStatus?.label ?? 'Unverified'

    const showKycRow =
      showKycStatus &&
      !isDesignationPreview &&
      (matchedParty.type !== 'related_organization' || Boolean(kycLabel))

    return (
      <div className="flex flex-col" style={{ gap: ownerContactCardDial.headerBodyGap }}>
        <div
          className="flex w-full items-center justify-between"
          style={{ gap: ownerContactCardDial.headerGap }}
        >
          <div className="flex min-w-0 items-center" style={{ gap: ownerContactCardDial.headerGap }}>
            <div
              className="flex shrink-0 items-center justify-center rounded-full bg-foreground/5 text-sm text-foreground"
              style={{
                width: ownerContactCardDial.avatarSize,
                height: ownerContactCardDial.avatarSize,
              }}
            >
              {getInitials(matchedParty.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{matchedParty.name}</p>
              {ownerRoleLabel ? (
                <div className="flex items-center gap-1 py-0.5">
                  {matchedParty.isPrimary ? (
                    <Star className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                  ) : null}
                  <span className="text-sm text-muted-foreground">{ownerRoleLabel}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 shrink-0 gap-1 px-2 text-sm"
              onClick={() => onEditParty(matchedParty.id)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            {onRemove ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                type="button"
                aria-label={`Remove ${matchedParty.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className="flex flex-col"
          style={{
            gap: ownerContactCardDial.bodyRowGap,
            paddingInline: ownerContactCardDial.bodyIndent,
          }}
        >
        {ownerPreview.lines.map((line) => (
          <MetadataRow
            key={line.label}
            label={formatPreviewLabel(line.label)}
            value={line.value}
            missing={line.missing}
            layout={contactFieldLayout}
          />
        ))}

        {!isDesignationPreview &&
          matchedParty.type === 'related_organization' &&
          matchedParty.trustParties &&
          matchedParty.trustParties.length > 0 && (
            <div className="py-1">
              <p className="text-xs text-muted-foreground">Trustees</p>
              <ul className="mt-0.5 space-y-1 text-sm font-medium text-foreground">
                {matchedParty.trustParties.map((t) => {
                  const partyName =
                    (t.partyId ? parties.find((p) => p.id === t.partyId)?.name : undefined) ?? t.displayName
                  const line = [partyName, t.role].filter(Boolean).join(' · ')
                  return (
                    <li key={t.id} className="break-words">
                      {line}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

        {!isDesignationPreview &&
          matchedParty.type === 'related_organization' &&
          matchedParty.beneficialOwners &&
          matchedParty.beneficialOwners.length > 0 && (
            <div className="py-1">
              <p className="text-xs text-muted-foreground">Beneficial owners</p>
              <ul className="mt-0.5 space-y-1 text-sm font-medium text-foreground">
                {matchedParty.beneficialOwners.map((b, idx) => {
                  const line = [b.name, b.ownershipPercent ? `${b.ownershipPercent}%` : undefined]
                    .filter(Boolean)
                    .join(' · ')
                  return (
                    <li key={`${b.name}-${idx}`} className="break-words">
                      {line}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

        {showKycRow ? (
          ownerContactCardDial.kycStatusVersion === 'v2' ? (
            <ContactCardKycStatusValue
              version="v2"
              embeddedKycBadge={embeddedKycBadge}
              kycLabel={kycLabel}
              kycDisplayStatus={kycDisplayStatus}
              trustOverallKyc={trustOverallKyc}
            />
          ) : useHorizontalContactFields ? (
            <div className="flex w-full min-w-0 items-start gap-5 py-1">
              <div className="flex w-36 shrink-0 items-center gap-1">
                <p className="text-sm text-muted-foreground">KYC Status</p>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center text-muted-foreground hover:text-foreground"
                        aria-label={KYC_STATUS_INFO_TOOLTIP}
                      >
                        <Info className="h-3 w-3" aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[16rem] text-center">
                      {KYC_STATUS_INFO_TOOLTIP}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="min-w-0 flex-1">
                <ContactCardKycStatusValue
                  version={ownerContactCardDial.kycStatusVersion}
                  embeddedKycBadge={embeddedKycBadge}
                  kycLabel={kycLabel}
                  kycDisplayStatus={kycDisplayStatus}
                  trustOverallKyc={trustOverallKyc}
                />
              </div>
            </div>
          ) : (
          <div className="flex flex-col items-start justify-center gap-2 py-1">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">KYC Status</p>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center text-muted-foreground hover:text-foreground"
                      aria-label={KYC_STATUS_INFO_TOOLTIP}
                    >
                      <Info className="h-3 w-3" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[16rem] text-center">
                    {KYC_STATUS_INFO_TOOLTIP}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <ContactCardKycStatusValue
              version={ownerContactCardDial.kycStatusVersion}
              embeddedKycBadge={embeddedKycBadge}
              kycLabel={kycLabel}
              kycDisplayStatus={kycDisplayStatus}
              trustOverallKyc={trustOverallKyc}
            />
          </div>
          )
        ) : null}

        {showKycAmlSchedule && amlRenewal ? (
          <MetadataRow
            label="Last checked"
            value={amlRenewal.lastRunFormatted ?? '—'}
            layout={contactFieldLayout}
          />
        ) : null}

        {footer}
        </div>
      </div>
    )
  }

  if (useSurfaceLayout) {
    if (!matchedParty) {
      return renderEmptySelect(title)
    }

    return (
      <>
        <h4 className="text-sm font-medium">{title}</h4>
        <div
          className="rounded-xl border border-border bg-background"
          style={{
            marginTop: ownerContactCardDial.titleCardGap,
            padding: ownerContactCardDial.cardPadding,
            borderRadius: ownerContactCardDial.cardRadius,
          }}
        >
          {renderSurfaceMatchedParty()}
        </div>
      </>
    )
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h4 className="text-sm font-medium">{title}</h4>
          {roleLabel ? (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {roleLabel}
            </Badge>
          ) : null}
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {!matchedParty && renderEmptySelect()}

      {matchedParty && ownerPreview && (
        <div className="rounded-md bg-muted/50 p-3 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{matchedParty.name}</span>
                {matchedParty.type === 'related_organization' && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Legal entity
                  </Badge>
                )}
                {!isDesignationPreview && matchedParty.type === 'related_organization' && trustOverallKyc && (
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', trustOverallKyc.className)}>
                    {trustOverallKyc.label}
                  </Badge>
                )}
                {matchedParty.isPrimary && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Primary
                  </Badge>
                )}
              </div>
              {!isDesignationPreview && !hideDefaultDetails && (
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Profile shared across the journey. Open details to add or correct fields.
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => onEditParty(matchedParty.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
              {isDesignationPreview ? 'View / edit identity' : 'View & edit details'}
            </Button>
          </div>

          {!hideDefaultDetails && !isDesignationPreview && ownerPreview.criticalGaps.length > 0 && (
            <div
              role="alert"
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
            >
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <div className="space-y-1 min-w-0">
                  <p className="font-medium">Required information missing</p>
                  <p className="text-xs opacity-90">Complete in account owner details:</p>
                  <ul className="list-disc pl-4 text-xs space-y-0.5">
                    {ownerPreview.criticalGaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!hideDefaultDetails && !isDesignationPreview && ownerPreview.criticalGaps.length === 0 && ownerPreview.recommendedGaps.length > 0 && (
            <div
              role="status"
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200"
            >
              <div className="flex gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <div className="space-y-1 min-w-0">
                  <p className="font-medium text-xs">Recommended for suitability / compliance</p>
                  <ul className="list-disc pl-4 text-xs space-y-0.5 text-muted-foreground">
                    {ownerPreview.recommendedGaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!hideDefaultDetails && (
            <dl className="grid gap-2 sm:grid-cols-2 text-xs">
              {ownerPreview.lines.map((line) => (
                <div key={line.label} className="space-y-0.5 min-w-0 sm:col-span-2">
                  <dt className="text-muted-foreground font-medium">{line.label}</dt>
                  <dd
                    className={
                      line.missing
                        ? 'text-amber-800 dark:text-amber-200/90 italic'
                        : 'text-foreground break-words'
                    }
                  >
                    {line.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {!hideDefaultDetails &&
            !isDesignationPreview &&
            matchedParty.type === 'related_organization' &&
            matchedParty.trustParties &&
            matchedParty.trustParties.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Trustees
                </p>
                <ul className="text-xs text-foreground space-y-1">
                  {matchedParty.trustParties.map((t) => {
                    const partyName =
                      (t.partyId ? parties.find((p) => p.id === t.partyId)?.name : undefined) ?? t.displayName
                    const line = [partyName, t.role].filter(Boolean).join(' · ')
                    return (
                      <li key={t.id} className="flex items-center gap-2">
                        <span className="truncate">{line}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

          {!hideDefaultDetails &&
            !isDesignationPreview &&
            matchedParty.type === 'related_organization' &&
            matchedParty.beneficialOwners &&
            matchedParty.beneficialOwners.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Beneficial owners
                </p>
                <ul className="text-xs text-foreground space-y-1">
                  {matchedParty.beneficialOwners.map((b, idx) => {
                    const line = [b.name, b.ownershipPercent ? `${b.ownershipPercent}%` : undefined]
                      .filter(Boolean)
                      .join(' · ')
                    return (
                      <li key={`${b.name}-${idx}`} className="flex items-center gap-2">
                        <span className="truncate">{line}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

          {showKycStatus && !hideDefaultDetails && !isDesignationPreview && (kycDisplayStatus || matchedParty.kycStatus) && matchedParty.type !== 'related_organization' && (
            <dl className="grid gap-2 sm:grid-cols-2 text-xs">
              <div className="space-y-0.5 min-w-0 sm:col-span-2">
                <dt className="text-muted-foreground font-medium">KYC status</dt>
                <dd className="flex flex-wrap items-center gap-2 text-foreground">
                  {kycDisplayStatus && (
                    <Badge
                      variant="outline"
                      className={cn('text-xs', kycDisplayStatus.className)}
                    >
                      {kycDisplayStatus.label}
                    </Badge>
                  )}
                  {matchedParty.kycStatus === 'needs_kyc' && onStartKyc && getPartyKycAction(matchedParty) === 'start' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      type="button"
                      onClick={() => onStartKyc(matchedParty.id)}
                    >
                      Create KYC review
                    </Button>
                  )}
                </dd>
              </div>

              {showKycAmlSchedule ? (
                <>
                  <div className="space-y-0.5 min-w-0 sm:col-span-2">
                    <dt className="text-muted-foreground font-medium">AML screening ({AML_KYC_VALIDITY_DAYS}-day validity)</dt>
                  </div>
                  <div className="space-y-0.5 min-w-0 sm:col-span-2">
                    <dt className="text-muted-foreground font-medium">Last checked</dt>
                    <dd className="text-foreground break-words">{amlRenewal?.lastRunFormatted ?? '—'}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          )}

          {footer}
        </div>
      )}
    </div>
  )
}

export { ADD_PARTY_VALUE }
