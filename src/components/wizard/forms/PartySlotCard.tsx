import { type ReactNode, useMemo } from 'react'
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
  addPartyItemLabel?: string
  addPartyItemDescription?: string
  /** Shown next to the title so owners vs interested parties vs beneficiaries are obvious at a glance */
  roleLabel?: string
  /**
   * `designation` — beneficiaries / interested parties: minimal preview, no KYC strip, no owner-style gap alerts.
   */
  previewVariant?: 'account_owner' | 'designation'
  footer?: ReactNode
  onStartKyc?: (partyId: string) => void
  onGoToKyc?: (partyId: string) => void
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
  addPartyItemLabel = 'Search or add a person or entity',
  addPartyItemDescription,
  roleLabel,
  previewVariant = 'account_owner',
  footer,
  onStartKyc,
  onGoToKyc,
}: PartySlotCardProps) {
  const { state } = useWorkflow()
  const matchedParty = partyId ? parties.find((p) => p.id === partyId) ?? null : null

  const kycDisplayStatus = useMemo(() => {
    if (!matchedParty) return null
    const kycParentTask = state.tasks.find((t) => t.formKey === 'kyc') ?? state.tasks.find((t) => t.formKey === 'open-accounts')
    const kycChild = kycParentTask?.children?.find((c) => c.childType === 'kyc' && c.name === matchedParty.name)
    if (kycChild) {
      const ds = deriveChildDisplayStatus(kycChild.status)
      return ds === 'complete'
        ? { label: 'Verified', className: 'bg-green-50 text-green-700 border-green-200' }
        : childStatusConfig[ds]
    }
    if (matchedParty.kycStatus === 'verified') {
      return { label: 'Verified', className: 'bg-green-100 text-green-800 border-green-200' }
    }
    if (matchedParty.kycStatus === 'needs_kyc') {
      return { label: 'Not Started', className: 'bg-red-50 text-red-700 border-red-200' }
    }
    return null
  }, [matchedParty, state.tasks])
  const ownerPreview = matchedParty
    ? previewVariant === 'designation'
      ? buildDesignationPartyPreview(matchedParty)
      : buildAccountOwnerPreview(matchedParty)
    : null
  const isDesignationPreview = previewVariant === 'designation'

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
                  <SelectItem key={party.id} value={party.id} textValue={party.name}>
                    <span className="flex items-center gap-2">
                      <span>{party.name}</span>
                      {party.type === 'related_organization' && (
                        <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                          Entity
                        </Badge>
                      )}
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
                {matchedParty.isPrimary && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Primary
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {isDesignationPreview
                  ? 'KYC is not required for this role. Capture or confirm identity and contact details sufficient for registration—less than a full account owner file.'
                  : 'Profile shared across the journey. Open details to add or correct fields.'}
              </p>
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

          {!isDesignationPreview && ownerPreview.criticalGaps.length > 0 && (
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

          {!isDesignationPreview && ownerPreview.criticalGaps.length === 0 && ownerPreview.recommendedGaps.length > 0 && (
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

          {!isDesignationPreview && (kycDisplayStatus || matchedParty.kycStatus) && (
            <div className="flex flex-wrap items-center gap-2 text-sm pt-1 border-t border-border/60">
              <span className="text-muted-foreground">KYC status:</span>
              {kycDisplayStatus && (
                <Badge
                  variant="outline"
                  className={cn('text-xs', kycDisplayStatus.className)}
                >
                  {kycDisplayStatus.label}
                </Badge>
              )}
              {matchedParty.kycStatus === 'needs_kyc' && onStartKyc && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  type="button"
                  onClick={() => onStartKyc(matchedParty.id)}
                >
                  Start
                </Button>
              )}
              {matchedParty.kycStatus === 'pending' && onGoToKyc && (
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
