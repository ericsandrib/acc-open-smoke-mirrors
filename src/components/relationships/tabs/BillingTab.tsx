import { useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConfigHotspot } from '@/components/config-overlay'
import { useFinancialAccounts } from '@/db/queries/detail'
import { NaField } from '@/components/orion/NaField'
import type { Relationship } from '@/data/relationshipsSeed'
import { cn } from '@/lib/utils'

type SubTab = 'Accounts' | 'History & Invoices' | 'Exceptions'
const SUB_TABS: SubTab[] = ['Accounts', 'History & Invoices', 'Exceptions']

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function fmtMoneyCents(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function BillingTab({ r }: { r: Relationship }) {
  const [sub, setSub] = useState<SubTab>('Accounts')
  const { data: accounts } = useFinancialAccounts(r.id)

  // Aggregates — Total Assets = sum balances; Total Billable = same minus
  // any non-billable (we don't model non-billable here so they're equal).
  const totalAssets = (accounts ?? []).reduce((s, a) => s + a.balance, 0)
  const totalBillable = totalAssets
  const nonBilledAccounts = 0
  const unpaidInvoices = 0

  return (
    <div className="relative rounded-xl border border-border bg-white">
      <ConfigHotspot
        knobId="relationships/detail/tabs/billing"
        anchor="top-right"
        size="md"
        area="region"
        className="!top-2 !right-2"
      />

      <div className="px-5 pt-4 pb-3 flex items-center justify-between flex-wrap gap-2 pr-12">
        <h2 className="text-base font-semibold text-foreground">Billing Details</h2>
      </div>

      <div className="px-5 pb-3 flex items-center gap-2 border-b border-border relative pr-12">
        <ConfigHotspot
          knobId="relationships/detail/tabs/billing/subtabs"
          anchor="middle-right"
          size="sm"
          className="!right-3"
        />
        {SUB_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className={cn(
              'px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
              sub === s
                ? 'border-foreground text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {sub === 'Accounts' && (
        <div className="px-5 py-4 space-y-4">
          {/* Summary tiles */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 pr-12">
            <ConfigHotspot
              knobId="relationships/detail/tabs/billing/summary-tiles"
              anchor="top-right"
              size="sm"
              area="region"
              className="!right-0 !top-0"
            />
            <Tile label="Total Assets" value={fmtMoney(totalAssets)} />
            <Tile label="Total Billable Value" value={fmtMoney(totalBillable)} />
            <Tile label="Non-Billed Accounts" value={String(nonBilledAccounts)} />
            <Tile label="Unpaid Invoices" value={fmtMoney(unpaidInvoices)} />
          </div>

          {/* Fee schedule */}
          <div className="relative rounded-lg border border-border p-4 pr-12">
            <ConfigHotspot
              knobId="relationships/detail/tabs/billing/fee-schedule"
              anchor="top-right"
              size="sm"
              className="!right-3 !top-3"
            />
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Fee Schedule
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Standard advisory rate applied across all billable accounts.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Flat 1.00%
              </Badge>
            </div>
            <dl className="grid grid-cols-3 gap-3 text-xs">
              <Field label="Schedule type" value="Flat" />
              <Field label="Minimum fee" value="$0" />
              <Field label="Effective" value={r.clientSince ?? '—'} />
            </dl>
            <table className="w-full mt-3 text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Tier</th>
                  <th className="py-2 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border last:border-b-0">
                  <td className="py-2 text-foreground">$0+ (entire balance)</td>
                  <td className="py-2 text-right text-foreground tabular-nums">
                    1.00%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bank details (ACH) + Performance fees — Orion gap surfaces */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                ACH Bank Details
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Required when Pay Method = ACH bank debit. Stratos's Orion does
                not currently store these.
              </p>
              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Bank Name</dt>
                  <dd><NaField compact /></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">ABA Number</dt>
                  <dd><NaField compact /></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Bank Account Number</dt>
                  <dd><NaField compact /></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Name On Account</dt>
                  <dd><NaField compact /></dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Performance Fees
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Only relevant for performance-fee accounts. Not in Stratos's
                Orion today.
              </p>
              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Performance Billed</dt>
                  <dd><NaField compact /></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Performance Fee Schedule</dt>
                  <dd><NaField compact /></dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Billable accounts */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Billable Accounts
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground bg-muted/30 border-b border-border">
                    <th className="px-4 py-2 font-medium">Account</th>
                    <th className="px-4 py-2 font-medium text-right">Balance</th>
                    <th className="px-4 py-2 font-medium">Payment</th>
                    <th className="px-4 py-2 font-medium text-center">Manager Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {(accounts ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        No billable accounts on this relationship.
                      </td>
                    </tr>
                  )}
                  {(accounts ?? []).map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-2.5 text-foreground">
                        <div className="leading-tight">
                          <div>{a.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.custodian} · {a.accountNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                        {fmtMoneyCents(a.balance)}
                      </td>
                      <td className="px-4 py-2.5 text-foreground/80">Direct</td>
                      <td className="px-4 py-2.5 text-center">
                        <Check className="h-4 w-4 inline text-emerald-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {sub === 'History & Invoices' && (
        <EmptyBody message="No invoices recorded for this relationship." />
      )}

      {sub === 'Exceptions' && (
        <EmptyBody message="No billing exceptions on file." />
      )}
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold text-foreground tabular-nums mt-0.5">
        {value}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground mt-0.5">{value}</dd>
    </div>
  )
}

function EmptyBody({ message }: { message: string }) {
  return (
    <div className="px-5 py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
