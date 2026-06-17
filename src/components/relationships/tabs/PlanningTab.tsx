import { ChevronDown, FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigHotspot } from '@/components/config-overlay'
import { useFinancialAccounts } from '@/db/queries/detail'
import type { Relationship } from '@/data/relationshipsSeed'

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function PlanningTab({ r }: { r: Relationship }) {
  // Plans aren't seeded yet — render an empty table. Net worth is derived
  // from financial_accounts plus a deterministic synthetic liability slice.
  const { data: accounts } = useFinancialAccounts(r.id)
  const investments = (accounts ?? []).reduce((s, a) => s + a.balance, 0)
  // Simple synthetic property + cash + liabilities; deterministic from AUM.
  const property = Math.round(investments * 0.6)
  const cash = (accounts ?? []).reduce((s, a) => s + a.cashBalance, 0)
  const otherAssets = Math.round(investments * 0.1)
  const totalAssets = investments + property + cash + otherAssets
  const mortgage = Math.round(property * 0.55)
  const otherDebts = Math.round(investments * 0.05)
  const totalLiabilities = mortgage + otherDebts
  const netWorth = totalAssets - totalLiabilities

  return (
    <div className="relative flex flex-col gap-5">
      <ConfigHotspot
        knobId="relationships/detail/tabs/planning"
        anchor="top-right"
        size="md"
        className="!top-0 !right-0 z-30"
      />

      {/* Financial Plans */}
      <div className="rounded-xl border border-border bg-white">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Financial Plans
            </h2>
            <span className="text-sm text-muted-foreground">0</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              View Assumptions
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Financial Plan
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left text-xs text-muted-foreground border-b border-border">
                {[
                  'Date',
                  'Action ID',
                  'Created by',
                  'Plan',
                  'Summary',
                  'Balance Sheet',
                  'Spending',
                  'Investments',
                  'Retirement',
                  'Tax',
                  'Other',
                ].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={11} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 opacity-50" />
                    </div>
                    <p className="text-sm">
                      No data — there are no items to display.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
              5
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </div>
          <div>0–0 of 0</div>
        </div>
      </div>

      {/* Net Worth */}
      <div className="rounded-xl border border-border bg-white">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-foreground">Net Worth</h2>
          <span className="text-xs text-muted-foreground">
            Derived from account balances on file
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Assets
            </h3>
            <NetWorthRow label="Investment accounts" value={investments} />
            <NetWorthRow label="Cash" value={cash} />
            <NetWorthRow label="Property" value={property} />
            <NetWorthRow label="Other" value={otherAssets} />
            <NetWorthRow label="Total assets" value={totalAssets} emphasis />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Liabilities
            </h3>
            <NetWorthRow label="Mortgage" value={mortgage} />
            <NetWorthRow label="Other debt" value={otherDebts} />
            <NetWorthRow label="Total liabilities" value={totalLiabilities} emphasis />
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-900">Net Worth</span>
            <span className="text-lg font-bold text-emerald-900 tabular-nums">
              {fmtMoney(netWorth)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NetWorthRow({
  label,
  value,
  emphasis,
}: {
  label: string
  value: number
  emphasis?: boolean
}) {
  return (
    <div
      className={
        'flex items-center justify-between py-1.5 text-sm ' +
        (emphasis
          ? 'font-semibold text-foreground border-t border-border mt-1 pt-2'
          : 'text-foreground/85')
      }
    >
      <span>{label}</span>
      <span className="tabular-nums">{fmtMoney(value)}</span>
    </div>
  )
}
