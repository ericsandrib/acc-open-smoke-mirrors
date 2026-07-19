import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { teamMembers } from '@/data/teamMembers'
import {
  CUSTODIAN_OPTIONS,
  ACCOUNT_CATEGORY_OPTIONS,
  getAccountSelectorConfig,
  type CustodianId,
  type AccountCategoryId,
} from '@/utils/custodians'

const QUANTITY_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

interface Row {
  id: string
  /** Application type (Schwab/Fidelity) or registration type id (SEI). */
  applicationType: string
  quantity: number
}

export type Selection = {
  /** Application type id (Schwab/Fidelity) or SEI registration type id. */
  applicationType: string
  label: string
  /** Short label used for the spawned child task name. */
  shortLabel: string
  count: number
  custodian: CustodianId
  category: AccountCategoryId
  /** Retained for back-compat with downstream consumers; sourced from advisor team member. */
  officeCode: string
  investmentProfessionalId: string
}

function createRow(): Row {
  return { id: `row-${Date.now()}-${Math.random().toString(36).slice(2)}`, applicationType: '', quantity: 1 }
}

interface AccountTypePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selections: Selection[]) => void
}

const DEFAULT_CATEGORY: AccountCategoryId = 'open-new'

export function AccountTypePickerDialog({ open, onOpenChange, onConfirm }: AccountTypePickerDialogProps) {
  const [rows, setRows] = useState<Row[]>(() => [createRow()])
  const [custodian, setCustodian] = useState<CustodianId | ''>('')
  const [category, setCategory] = useState<AccountCategoryId>(DEFAULT_CATEGORY)
  const [investmentProfessionalId, setInvestmentProfessionalId] = useState('')

  const advisorOptions = teamMembers.map((m) => ({ value: m.id, label: m.name }))

  // Application type (Schwab/Fidelity) vs registration type (SEI) is conditional
  // on the selected custodian — this drives the label, placeholder, and options.
  const selectorConfig = getAccountSelectorConfig(custodian)

  const handleCustodianChange = (next: CustodianId) => {
    setCustodian(next)
    // Options differ per custodian; clear stale selections from the prior one.
    setRows([createRow()])
  }

  const handleReset = () => {
    setRows([createRow()])
    setCustodian('')
    setCategory(DEFAULT_CATEGORY)
    setInvestmentProfessionalId('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) handleReset()
    onOpenChange(next)
  }

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id)
      return next.length === 0 ? [createRow()] : next
    })
  }

  const addRow = () => setRows((prev) => [...prev, createRow()])

  const validRows = rows.filter((r) => r.applicationType !== '')

  const totalAccounts = validRows.reduce((sum, r) => sum + r.quantity, 0)

  const buildSelections = (): Selection[] => {
    const grouped = new Map<string, number>()

    for (const row of validRows) {
      const t = row.applicationType
      grouped.set(t, (grouped.get(t) ?? 0) + row.quantity)
    }

    const advisor = teamMembers.find((m) => m.id === investmentProfessionalId)
    const officeCode = advisor?.officeCode ?? ''

    return Array.from(grouped.entries()).map(([t, count]) => {
      const opt = selectorConfig.options.find((o) => o.id === t)
      return {
        applicationType: t,
        label: opt?.label ?? String(t),
        shortLabel: opt?.shortLabel ?? opt?.label ?? String(t),
        count,
        custodian: custodian as CustodianId,
        category,
        officeCode,
        investmentProfessionalId,
      }
    })
  }

  const handleConfirm = () => {
    const selections = buildSelections()
    if (selections.length === 0) return
    onConfirm(selections)
    handleReset()
    onOpenChange(false)
  }

  const canSubmit =
    custodian !== '' &&
    investmentProfessionalId !== '' &&
    rows.some((r) => r.applicationType !== '' && r.quantity >= 1)

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-[min(560px,calc(100vw-1rem))] max-w-[min(560px,calc(100vw-1rem))] flex-col gap-0 p-0 sm:max-w-[min(560px,calc(100vw-1rem))]"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>Add accounts</SheetTitle>
          <SheetDescription>
            Choose a custodian and the application(s) you want to start. Each row is one or more parallel
            account-opening workflows—use quantity when you need more than one of the same application.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Custodian <span className="text-destructive">*</span>
                </Label>
                <Select value={custodian || undefined} onValueChange={(v) => handleCustodianChange(v as CustodianId)}>
                  <SelectTrigger className="h-9 w-full text-left [&>span]:text-left">
                    <SelectValue placeholder="Select custodian…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(24rem,70vh)]">
                    {CUSTODIAN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Advisor <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={investmentProfessionalId || undefined}
                  onValueChange={setInvestmentProfessionalId}
                >
                  <SelectTrigger className="h-9 w-full text-left [&>span]:text-left">
                    <SelectValue placeholder="Select advisor…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(24rem,70vh)]">
                    {advisorOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AccountCategoryId)}>
                <SelectTrigger className="h-9 w-full text-left [&>span]:text-left">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[min(24rem,70vh)]">
                  {ACCOUNT_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-visible">
            <div className="grid grid-cols-[1fr_90px_40px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {selectorConfig.fieldLabel}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Qty</span>
              <span />
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_90px_40px] gap-3 items-center px-4 py-3 border-b border-border last:border-b-0"
              >
                <div className="space-y-1.5 min-w-0">
                  <Label className="sr-only">{selectorConfig.fieldLabel}</Label>
                  <Select
                    value={row.applicationType || undefined}
                    onValueChange={(v) => updateRow(row.id, { applicationType: v })}
                  >
                    <SelectTrigger className="h-9 w-full text-left [&>span]:line-clamp-2 [&>span]:text-left">
                      <SelectValue placeholder={selectorConfig.placeholder} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(24rem,70vh)] w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)] min-w-0">
                      {selectorConfig.options.map((opt) => (
                        <SelectItem
                          key={opt.id}
                          value={opt.id}
                          className="whitespace-normal break-words text-left py-2"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select
                  value={String(row.quantity)}
                  onValueChange={(val) => {
                    const num = parseInt(val, 10)
                    if (!isNaN(num)) updateRow(row.id, { quantity: num })
                  }}
                >
                  <SelectTrigger className="h-9 w-full text-left [&>span]:text-left">
                    <SelectValue placeholder="Qty" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {QUANTITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove row"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add another application type
            </button>
          </div>
          {selectorConfig.kind === 'application' ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Registration details (Individual, Joint, IRA subtype, etc.) are captured inside each
              application's form sections.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Each row is one SEI registration (account) type. Remaining registration details are
              captured inside each account's form sections.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {totalAccounts === 1 ? 'Add 1 account' : `Add ${totalAccounts} accounts`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
