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
import { isOpenAccountsTask } from '@/utils/openAccountsTaskContext'
import { Plus, Trash2, Pencil, AlertTriangle, Info } from 'lucide-react'

const ADD_PARTY_VALUE = '__add_party__'

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
}: PartySlotCardProps) {
  const { state } = useWorkflow()
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
  const ownerPreview = matchedParty
    ? previewVariant === 'designation'
      ? buildDesignationPartyPreview(matchedParty)
      : buildAccountOwnerPreview(matchedParty)
    : null
  const isDesignationPreview = previewVariant === 'designation'
  const trustOverallKyc = useMemo(() => {
    if (!matchedParty || matchedParty.type !== 'related_organization') return null
    return getPartyKycDisplayStatus(matchedParty)
  }, [getPartyKycDisplayStatus, matchedParty])

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold">{title}</h4>
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

      {!matchedParty && (
        <div className="space-y-2">
          <Label>{selectLabel}</Label>
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
      )}

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
            <div className="flex flex-wrap items-center gap-2 text-sm pt-1 border-t border-border/60">
              <span className="text-muted-foreground">
                KYC status:
              </span>
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
                  Start KYC initiation
                </Button>
              )}
              {matchedParty.kycStatus === 'pending' && onGoToKyc && getPartyKycAction(matchedParty) === 'go' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  type="button"
                  onClick={() => onGoToKyc(matchedParty.id)}
                >
                  Go to KYC
                </Button>
              )}
            </div>
          )}

          {footer}
        </div>
      )}
    </div>
  )
}

export { ADD_PARTY_VALUE }
