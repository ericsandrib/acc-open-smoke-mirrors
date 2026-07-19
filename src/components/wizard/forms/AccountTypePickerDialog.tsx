import { useEffect, useRef, useState } from 'react'
import type { RegistrationType } from '@/utils/registrationDocuments'
import type { Custodian } from '@/utils/custodians'
import { CUSTODIAN_OPTIONS, getAccountTypeOptionsForCustodian } from '@/utils/custodians'
import { SEI_ADVISOR_PROFILE, getSeiInvestmentPrograms } from '@/data/sei/seiReferenceData'
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

const QUANTITY_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

interface Row {
  id: string
  custodian: Custodian
  /** The picked option value — SEI account type id, or a RegistrationType for forms-based custodians. */
  accountTypeValue: string
  /** SEI only — investmentProgramId (dependent on account type). */
  investmentProgramId: string
  quantity: number
}

export type Selection = {
  custodian: Custodian
  registrationType: RegistrationType
  /** Present for SEI selections; the true SEI account type id used by the SEI form + create call. */
  seiAccountType?: string
  /** SEI only — numeric accountTypeId + investmentProgramId for the create call. */
  accountTypeId?: number
  investmentProgramId?: string
  label: string
  count: number
  /** Derived from the logged-in advisor's SEI reference-data profile. */
  swpFirmId: number
  primaryAdvisorId: number
}

function createRow(): Row {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    custodian: 'sei',
    accountTypeValue: '',
    investmentProgramId: '',
    quantity: 1,
  }
}

interface AccountTypePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selections: Selection[]) => void
}

export function AccountTypePickerDialog({ open, onOpenChange, onConfirm }: AccountTypePickerDialogProps) {
  const [rows, setRows] = useState<Row[]>(() => [createRow()])

  // Refs to each row's account-type SelectTrigger so we can focus the new row's
  // select after "Add another account".
  const accountTypeTriggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const pendingFocusRowId = useRef<string | null>(null)

  useEffect(() => {
    if (!pendingFocusRowId.current) return
    const id = pendingFocusRowId.current
    pendingFocusRowId.current = null
    requestAnimationFrame(() => {
      const trigger = accountTypeTriggerRefs.current.get(id)
      if (!trigger) return
      trigger.focus()
      trigger.click()
    })
  }, [rows])

  const handleReset = () => setRows([createRow()])

  const handleOpenChange = (next: boolean) => {
    if (!next) handleReset()
    onOpenChange(next)
  }

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  // Changing custodian resets the account type + program, since each custodian has its own lists.
  const changeCustodian = (id: string, custodian: Custodian) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, custodian, accountTypeValue: '', investmentProgramId: '' } : r)),
    )
  }

  // Changing account type resets the program (SEI programs depend on account type).
  const changeAccountType = (id: string, accountTypeValue: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, accountTypeValue, investmentProgramId: '' } : r)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id)
      return next.length === 0 ? [createRow()] : next
    })
  }

  const addRow = () => {
    const next = createRow()
    pendingFocusRowId.current = next.id
    setRows((prev) => [...prev, next])
  }

  const isRowComplete = (r: Row) =>
    r.accountTypeValue !== '' && (r.custodian !== 'sei' || r.investmentProgramId !== '') && r.quantity >= 1

  const validRows = rows.filter(isRowComplete)
  const totalAccounts = validRows.reduce((sum, r) => sum + r.quantity, 0)

  const buildSelections = (): Selection[] => {
    // Group identical (custodian + account type + program) rows, summing quantity.
    const grouped = new Map<string, Selection>()

    for (const row of validRows) {
      const opts = getAccountTypeOptionsForCustodian(row.custodian)
      const opt = opts.find((o) => o.value === row.accountTypeValue)
      if (!opt) continue
      const key = `${row.custodian}::${row.accountTypeValue}::${row.investmentProgramId}`
      const existing = grouped.get(key)
      if (existing) {
        existing.count += row.quantity
      } else {
        grouped.set(key, {
          custodian: row.custodian,
          registrationType: opt.registrationType,
          seiAccountType: opt.seiAccountType,
          accountTypeId: opt.accountTypeId,
          investmentProgramId: row.custodian === 'sei' ? row.investmentProgramId : undefined,
          label: opt.label,
          count: row.quantity,
          swpFirmId: SEI_ADVISOR_PROFILE.firm.swpFirmId,
          primaryAdvisorId: SEI_ADVISOR_PROFILE.advisorId,
        })
      }
    }

    return Array.from(grouped.values())
  }

  const handleConfirm = () => {
    const selections = buildSelections()
    if (selections.length === 0) return
    onConfirm(selections)
    handleReset()
    onOpenChange(false)
  }

  const canSubmit = validRows.length > 0

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-[min(560px,calc(100vw-1rem))] max-w-[min(560px,calc(100vw-1rem))] flex-col gap-0 p-0 sm:max-w-[min(560px,calc(100vw-1rem))]"
      >
        <SheetHeader className="flex h-14 flex-row items-center justify-between space-y-0 px-6 shrink-0">
          <SheetTitle>Add accounts</SheetTitle>
        </SheetHeader>
        <SheetDescription className="px-6 pb-4 shrink-0">
          Choose a custodian and account type for each account to open. The custodian determines the available
          account types and how the account is opened.
        </SheetDescription>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Derived from the logged-in advisor's SEI reference-data profile — not entered. */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SEI profile</p>
            <div className="mt-1.5 grid gap-1 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Firm: </span>
                <span className="font-medium">{SEI_ADVISOR_PROFILE.firm.firmName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Advisor: </span>
                <span className="font-medium">{SEI_ADVISOR_PROFILE.advisorName}</span>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Firm &amp; advisor are pulled from your SEI reference-data profile.
            </p>
          </div>

          <div className="space-y-3">
            {rows.map((row) => {
              const accountTypeOptions = getAccountTypeOptionsForCustodian(row.custodian)
              const selectedOpt = accountTypeOptions.find((o) => o.value === row.accountTypeValue)
              const programs =
                row.custodian === 'sei' ? getSeiInvestmentPrograms(selectedOpt?.accountTypeId) : []
              return (
                <div key={row.id} className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Custodian</Label>
                      <Select
                        value={row.custodian}
                        onValueChange={(v) => changeCustodian(row.id, v as Custodian)}
                      >
                        <SelectTrigger className="h-9 w-full text-left [&>span]:text-left">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CUSTODIAN_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2">
                                {opt.label}
                                {opt.note ? (
                                  <span className="text-xs text-muted-foreground">· {opt.note}</span>
                                ) : null}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="mt-6 flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-[1fr_90px] gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Account type</Label>
                      <Select
                        value={row.accountTypeValue || undefined}
                        onValueChange={(v) => changeAccountType(row.id, v)}
                      >
                        <SelectTrigger
                          ref={(el) => {
                            if (el) accountTypeTriggerRefs.current.set(row.id, el)
                            else accountTypeTriggerRefs.current.delete(row.id)
                          }}
                          className="h-9 w-full text-left [&>span]:line-clamp-2 [&>span]:text-left"
                        >
                          <SelectValue placeholder="Select account type…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[min(24rem,70vh)] w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)] min-w-0">
                          {accountTypeOptions.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="whitespace-normal break-words text-left py-2"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Qty</Label>
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
                    </div>
                  </div>

                  {/* SEI: investment program is a reference-data dropdown, dependent on account type. */}
                  {row.custodian === 'sei' && row.accountTypeValue !== '' ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Investment program
                      </Label>
                      <Select
                        value={row.investmentProgramId || undefined}
                        onValueChange={(v) => updateRow(row.id, { investmentProgramId: v })}
                      >
                        <SelectTrigger className="h-9 w-full text-left [&>span]:line-clamp-2 [&>span]:text-left">
                          <SelectValue placeholder="Select investment program…" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((p) => (
                            <SelectItem
                              key={p.investmentProgramId}
                              value={String(p.investmentProgramId)}
                              className="whitespace-normal"
                            >
                              {p.investmentProgramDescription}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>
              )
            })}

            <button
              type="button"
              onClick={addRow}
              className="w-full flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add another account
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Quantities above 1 create numbered copies of the same account type so each can be completed on its own.
          </p>
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
