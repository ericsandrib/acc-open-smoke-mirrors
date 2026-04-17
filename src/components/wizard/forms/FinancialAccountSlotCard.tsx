import { useMemo, useState } from 'react'
import type { FinancialAccount } from '@/types/workflow'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectSeparator,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { maskTaxIdSensitiveDisplay } from '@/utils/taxIdMask'
import { AddAccountSheet, EditAccountSheet } from '@/components/wizard/forms/FinancialAccountsForm'
import { accountTypeLabels } from '@/utils/financialAccountLabels'

export type FinancialAccountSlotCardProps = {
  title: string
  selectLabel: string
  financialAccountId: string | undefined
  onFinancialAccountIdChange: (id: string) => void
  /** Full list for resolving selection → profile */
  allAccounts: FinancialAccount[]
  /** Subset shown in the dropdown */
  selectCandidates: FinancialAccount[]
  addAccountItemLabel?: string
  addAccountItemDescription?: string
  /** When no accounts match the filter, still show add-new. */
  emptyCandidatesHint?: string
}

export function FinancialAccountSlotCard({
  title,
  selectLabel,
  financialAccountId,
  onFinancialAccountIdChange,
  allAccounts,
  selectCandidates,
  addAccountItemLabel = 'Add a new account',
  addAccountItemDescription = 'Creates an account in Existing accounts (collect client data) and links it here.',
  emptyCandidatesHint = 'No matching accounts yet — add one below.',
}: FinancialAccountSlotCardProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const resolvedId = String(financialAccountId ?? '').trim()

  const matched = useMemo(() => {
    if (!resolvedId) return null
    return allAccounts.find((a) => a.id === resolvedId) ?? null
  }, [resolvedId, allAccounts])

  const orphanedLink = resolvedId && !matched

  const editingAccount = editingId ? allAccounts.find((a) => a.id === editingId) ?? null : null

  const previewLines = useMemo(() => {
    if (!matched) return []
    const lines: { label: string; value: string; missing?: boolean }[] = []
    const instLabel =
      matched.accountType === 'checking' || matched.accountType === 'savings' ? 'Institution' : 'Custodian'
    lines.push({
      label: instLabel,
      value: matched.custodian?.trim() || '—',
      missing: !matched.custodian?.trim(),
    })
    if (matched.accountType === 'checking' || matched.accountType === 'savings') {
      lines.push({
        label: 'Routing / ABA',
        value: matched.routingNumber?.trim() || '—',
        missing: !matched.routingNumber?.trim(),
      })
    }
    const acct = matched.accountNumber?.trim()
      ? maskTaxIdSensitiveDisplay(matched.accountNumber)
      : '—'
    lines.push({
      label: 'Account #',
      value: acct,
      missing: !matched.accountNumber?.trim(),
    })
    return lines
  }, [matched])

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        {matched ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onFinancialAccountIdChange('')}
            type="button"
            aria-label={`Remove ${matched.accountName}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      {orphanedLink && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100 flex flex-wrap items-center justify-between gap-2">
          <span>That account is no longer in Existing accounts. Clear the link or choose another account.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => onFinancialAccountIdChange('')}>
            Clear link
          </Button>
        </div>
      )}

      {!matched && (
        <div className="space-y-2">
          <Label>{selectLabel}</Label>
          <Select
            value=""
            onValueChange={(v) => {
              if (v === '__add_new__') {
                setShowAdd(true)
                return
              }
              onFinancialAccountIdChange(v)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent>
              {selectCandidates.length > 0 ? (
                selectCandidates.map((a) => (
                  <SelectItem key={a.id} value={a.id} textValue={a.accountName}>
                    <span className="flex items-center gap-2">
                      <span>{a.accountName}</span>
                      {a.accountType ? (
                        <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                          {accountTypeLabels[a.accountType]}
                        </Badge>
                      ) : null}
                    </span>
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-3 text-xs text-muted-foreground">{emptyCandidatesHint}</div>
              )}
              <SelectSeparator />
              <SelectItem
                value="__add_new__"
                className="whitespace-normal py-2.5 pl-2 pr-8 [&>span]:items-start"
                textValue={addAccountItemLabel}
              >
                <span className="flex gap-2 text-left">
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                  <span>
                    {addAccountItemDescription ? (
                      <>
                        <span className="font-medium">{addAccountItemLabel}</span>
                        <span className="block text-muted-foreground text-xs mt-0.5">{addAccountItemDescription}</span>
                      </>
                    ) : (
                      addAccountItemLabel
                    )}
                  </span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {matched && (
        <div className="rounded-md bg-muted/50 p-3 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{matched.accountName}</span>
                {matched.accountType ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {accountTypeLabels[matched.accountType]}
                  </Badge>
                ) : null}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Profile shared across the journey. Open details to add or correct fields.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setEditingId(matched.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
              View & edit details
            </Button>
          </div>

          <dl className="grid gap-2 sm:grid-cols-2 text-xs">
            {previewLines.map((line) => (
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
        </div>
      )}

      <AddAccountSheet
        open={showAdd}
        onOpenChange={setShowAdd}
        onAccountAdded={(account) => {
          onFinancialAccountIdChange(account.id)
        }}
      />

      <EditAccountSheet
        account={editingAccount}
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) setEditingId(null)
        }}
      />
    </div>
  )
}
