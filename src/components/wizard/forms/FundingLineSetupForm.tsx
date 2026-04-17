import { useCallback, useEffect, useMemo } from 'react'
import { useChildActionContext, useTaskData, useWorkflow } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { FUNDING_OPTIONS } from '@/data/fundingOptions'
import { FinancialAccountSlotCard } from '@/components/wizard/forms/FinancialAccountSlotCard'

const servicingModels = [
  { value: 'advisory', label: 'Advisory (Fee-based)' },
  { value: 'brokerage', label: 'Brokerage (Commission-based)' },
  { value: 'self-directed', label: 'Self-Directed' },
  { value: 'wrap', label: 'Wrap Program' },
]

const dividendOptions = [
  { value: 'reinvest', label: 'Reinvest' },
  { value: 'cash', label: 'Pay in Cash' },
  { value: 'transfer', label: 'Transfer to Another Account' },
]

/** Detail form for a single funding / asset movement workflow line. */
export function FundingLineSetupForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateField, updateFields } = useTaskData(taskId || '__no_child__')

  const childRoot = ctx ? ((state.taskData[ctx.child.id] as Record<string, unknown> | undefined) ?? undefined) : undefined
  const fundingSource =
    (data.fundingSource as string | undefined) ?? (childRoot?.fundingMethod as string | undefined) ?? ''

  const needsBank = fundingSource === 'ach' || fundingSource === 'bank_send_receive' || fundingSource === 'fed_fund_wires'
  const isCheckMovement = fundingSource === 'check_deposits' || fundingSource === 'check_withdrawals'

  const bankAccountsForPrefill = useMemo(
    () =>
      state.financialAccounts.filter(
        (a) => a.accountType === 'checking' || a.accountType === 'savings',
      ),
    [state.financialAccounts],
  )

  const investmentAccountsForPrefill = useMemo(
    () =>
      state.financialAccounts.filter(
        (a) =>
          !!a.accountType && a.accountType !== 'checking' && a.accountType !== 'savings',
      ),
    [state.financialAccounts],
  )

  const bankPrefillId = String((data.bankPrefillAccountId as string) ?? '').trim()
  const transferPrefillId = String((data.transferPrefillAccountId as string) ?? '').trim()

  const linkedBankAccount = useMemo(() => {
    if (!bankPrefillId) return undefined
    return state.financialAccounts.find((a) => a.id === bankPrefillId)
  }, [bankPrefillId, state.financialAccounts])

  const linkedTransferAccount = useMemo(() => {
    if (!transferPrefillId) return undefined
    return state.financialAccounts.find((a) => a.id === transferPrefillId)
  }, [transferPrefillId, state.financialAccounts])

  useEffect(() => {
    if (!linkedBankAccount) return
    if (linkedBankAccount.accountType !== 'checking' && linkedBankAccount.accountType !== 'savings') return
    updateFields({
      bankName: linkedBankAccount.custodian ?? '',
      bankRouting: linkedBankAccount.routingNumber ?? '',
      bankAccountNumber: linkedBankAccount.accountNumber ?? '',
    })
  }, [linkedBankAccount, updateFields])

  useEffect(() => {
    if (!linkedTransferAccount) return
    updateFields({
      deliveringFirm: linkedTransferAccount.custodian ?? '',
      transferFromAccount: linkedTransferAccount.accountNumber ?? '',
    })
  }, [linkedTransferAccount, updateFields])

  const onBankAccountLinkChange = useCallback(
    (id: string) => {
      if (!id) {
        updateFields({
          bankPrefillAccountId: '',
          bankName: '',
          bankRouting: '',
          bankAccountNumber: '',
        })
        return
      }
      const acc = state.financialAccounts.find((a) => a.id === id)
      if (!acc) return
      updateFields({
        bankPrefillAccountId: id,
        bankName: acc.custodian ?? '',
        bankRouting: acc.routingNumber ?? '',
        bankAccountNumber: acc.accountNumber ?? '',
      })
    },
    [state.financialAccounts, updateFields],
  )

  const onTransferAccountLinkChange = useCallback(
    (id: string) => {
      if (!id) {
        updateFields({
          transferPrefillAccountId: '',
          deliveringFirm: '',
          transferFromAccount: '',
        })
        return
      }
      const acc = state.financialAccounts.find((a) => a.id === id)
      if (!acc) return
      updateFields({
        transferPrefillAccountId: id,
        deliveringFirm: acc.custodian ?? '',
        transferFromAccount: acc.accountNumber ?? '',
      })
    },
    [state.financialAccounts, updateFields],
  )

  if (!ctx || ctx.child.childType !== 'funding-line') {
    return (
      <p className="text-sm text-muted-foreground">Open this step from Funding & asset movement on an account.</p>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Funding & asset movement
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Capture how this workflow initiates, edits, cancels, or tracks a money or asset movement—not account
            feature setup (use Account features & services for that).
          </p>
        </div>

        <div className="space-y-2">
          <Label>Movement type</Label>
          <Select
            value={fundingSource || undefined}
            onValueChange={(v) => updateField('fundingSource', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select movement type…" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(24rem,70vh)]">
              {FUNDING_OPTIONS.map((src) => (
                <SelectItem key={src.value} value={src.value} className="text-left py-2">
                  {src.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Amount (if applicable)</Label>
            <Input
              value={(data.fundingAmount as string) ?? ''}
              onChange={(e) => updateField('fundingAmount', e.target.value)}
              placeholder="e.g. 100,000"
            />
          </div>
          <div className="space-y-2">
            <Label>Transfer scope</Label>
            <Select
              value={(data.transferScope as string) ?? ''}
              onValueChange={(v) => updateField('transferScope', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="If transfer…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="na">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Source of funds / source of wealth</Label>
            <textarea
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.sourceOfFundsWealth as string) ?? ''}
              onChange={(e) => updateField('sourceOfFundsWealth', e.target.value)}
              placeholder="Employment income, sale of business, inheritance, etc."
            />
          </div>
        </div>
      </section>

      {fundingSource === 'account_transfers' && (
        <div className="space-y-4">
          <FinancialAccountSlotCard
            title="Investment account"
            selectLabel="Choose an account"
            financialAccountId={transferPrefillId || undefined}
            onFinancialAccountIdChange={onTransferAccountLinkChange}
            allAccounts={state.financialAccounts}
            selectCandidates={investmentAccountsForPrefill}
            emptyCandidatesHint="No brokerage, retirement, or other investment accounts yet. Add one below."
            addAccountItemDescription="Creates an account in Existing accounts (collect client data) and links it here."
          />
          <div className="space-y-2">
            <Label>Transfer instructions</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.transferInstructions as string) ?? ''}
              onChange={(e) => updateField('transferInstructions', e.target.value)}
            />
          </div>
        </div>
      )}

      {isCheckMovement && (
        <section className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Check details
          </h3>
          <div className="space-y-2">
            <Label>Check / item reference</Label>
            <Input
              value={(data.checkReference as string) ?? ''}
              onChange={(e) => updateField('checkReference', e.target.value)}
              placeholder="Check #, batch, or control number"
            />
          </div>
          <div className="space-y-2">
            <Label>Instructions</Label>
            <textarea
              className="flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.checkMovementNotes as string) ?? ''}
              onChange={(e) => updateField('checkMovementNotes', e.target.value)}
            />
          </div>
        </section>
      )}

      {fundingSource === 'mutual_fund_periodic_orders' && (
        <section className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recurring mutual fund orders
          </h3>
          <p className="text-sm text-muted-foreground">
            Scheduled investment or liquidation instructions tied to this workflow line.
          </p>
          <div className="space-y-2">
            <Label>Schedule & fund / symbol</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(data.mutualFundPeriodicSchedule as string) ?? ''}
              onChange={(e) => updateField('mutualFundPeriodicSchedule', e.target.value)}
              placeholder="Frequency, amount, funds, start date"
            />
          </div>
        </section>
      )}

      {needsBank && (
        <FinancialAccountSlotCard
          title="Bank details"
          selectLabel="Choose an account"
          financialAccountId={bankPrefillId || undefined}
          onFinancialAccountIdChange={onBankAccountLinkChange}
          allAccounts={state.financialAccounts}
          selectCandidates={bankAccountsForPrefill}
          emptyCandidatesHint="No checking or savings accounts yet. Add one below."
          addAccountItemDescription="Creates an account in Existing accounts (collect client data) and links it here."
        />
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Standing & periodic instructions
        </h3>
        <p className="text-xs text-muted-foreground">
          Prerequisite setup for ACH, wires, and recurring movements—use the movement type above when this line is
          primarily about establishing standing or periodic instructions.
        </p>
        <div className="space-y-2">
          <Label>Standing money movement instructions</Label>
          <textarea
            className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(data.standingMoneyInstructions as string) ?? ''}
            onChange={(e) => updateField('standingMoneyInstructions', e.target.value)}
            placeholder="Recurring ACH, sweeps, wire templates, journals…"
          />
        </div>
        <div className="space-y-2">
          <Label>Transaction-level acknowledgments</Label>
          <textarea
            className="flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={(data.fundingAcknowledgments as string) ?? ''}
            onChange={(e) => updateField('fundingAcknowledgments', e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Servicing (demo)
        </h3>
        <div className="space-y-2">
          <Label>Servicing model</Label>
          <Select
            value={(data.servicingModel as string) ?? ''}
            onValueChange={(v) => updateField('servicingModel', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select servicing model…" />
            </SelectTrigger>
            <SelectContent>
              {servicingModels.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dividend / capital gains handling</Label>
          <Select
            value={(data.dividendHandling as string) ?? ''}
            onValueChange={(v) => updateField('dividendHandling', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select handling…" />
            </SelectTrigger>
            <SelectContent>
              {dividendOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Servicing notes</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Any special servicing instructions…"
            value={(data.servicingNotes as string) ?? ''}
            onChange={(e) => updateField('servicingNotes', e.target.value)}
          />
        </div>
      </section>
    </div>
  )
}
