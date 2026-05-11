import { Printer, Download, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ORION_FIELDS,
  getOrionGaps,
  getOrionSummary,
  type OrionField,
  type OrionTab,
} from '@/data/orionFieldMap'

/**
 * Printable gap report — fields the prototype surfaces (or wants to surface)
 * that are NOT populated in Stratos's Orion instance, grouped by Orion tab.
 *
 * Use case: open this live during a review with Stratos. Walk the table and
 * confirm each row's suggested source (CRM, manual entry, integration).
 *
 * Source: src/data/orionFieldMap.ts (which mirrors the
 * Stratos_Orion_Data_Model spreadsheet).
 */

const SUGGESTED_COLOR: Record<NonNullable<OrionField['suggestedSource']>, string> = {
  'CRM': 'bg-sky-100 text-sky-800 border-sky-200',
  'Manual entry': 'bg-amber-100 text-amber-900 border-amber-200',
  'External integration': 'bg-purple-100 text-purple-800 border-purple-200',
  'Derived': 'bg-emerald-100 text-emerald-900 border-emerald-200',
}

export function OrionGapsPage() {
  return (
    <AppShell>
      <Body />
    </AppShell>
  )
}

function Body() {
  const summary = getOrionSummary()
  const gaps = getOrionGaps()
  const tabsInOrder: OrionTab[] = [
    'Household',
    'Registration',
    'Account',
    'Portfolio Group',
    'Asset (Position)',
    'Reference Data',
  ]

  function downloadCsv() {
    const lines = ['Tab,Section,Field,Suggested source,Note,UI surface']
    for (const f of ORION_FIELDS) {
      if (f.available) continue
      const cells = [
        f.tab,
        f.section,
        f.field,
        f.suggestedSource ?? '',
        f.note ?? '',
        f.uiSurface ?? '',
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`)
      lines.push(cells.join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stratos-orion-gaps.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-[1200px] mx-auto print:max-w-full">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link
          to="/relationships"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Relationships
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadCsv}>
            <Download className="h-4 w-4 mr-1.5" />
            Download CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Stratos Orion — data gap report
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Fields the Avantos prototype surfaces (or wants to surface) that
          are <strong>not currently populated in Stratos's Orion instance</strong>.
          Source data: <code>Stratos_Orion_Data_Model.xlsx</code>. The
          prototype renders an amber "Not in Stratos Orion" indicator wherever
          one of these fields would appear.
        </p>
      </header>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Tile label="Total Orion fields" value={String(summary.total)} />
        <Tile
          label="Populated in Orion"
          value={String(summary.available)}
          accent="emerald"
        />
        <Tile
          label="Missing"
          value={String(summary.missing)}
          accent="amber"
        />
      </div>

      {/* Per-tab summary */}
      <div className="rounded-xl border border-border bg-white mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground bg-muted/30 border-b border-border">
              <th className="px-4 py-2 font-medium">Orion tab</th>
              <th className="px-4 py-2 font-medium text-right">Total fields</th>
              <th className="px-4 py-2 font-medium text-right">Populated</th>
              <th className="px-4 py-2 font-medium text-right">Missing</th>
              <th className="px-4 py-2 font-medium text-right">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {tabsInOrder.map((t) => {
              const row = summary.byTab[t]
              if (!row) return null
              const pct = row.total === 0 ? 0 : Math.round((row.available / row.total) * 100)
              return (
                <tr key={t} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5 text-foreground font-medium">{t}</td>
                  <td className="px-4 py-2.5 text-right text-foreground/80 tabular-nums">
                    {row.total}
                  </td>
                  <td className="px-4 py-2.5 text-right text-emerald-700 tabular-nums">
                    {row.available}
                  </td>
                  <td className="px-4 py-2.5 text-right text-amber-700 tabular-nums">
                    {row.missing}
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground/90 tabular-nums">
                    {pct}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed gap tables per tab */}
      {tabsInOrder.map((t) => {
        const rows = gaps[t]
        if (!rows || rows.length === 0) return null
        return (
          <section key={t} className="mb-6 break-inside-avoid">
            <h2 className="text-base font-semibold text-foreground mb-2">
              {t} <span className="text-muted-foreground font-normal">— {rows.length} missing</span>
            </h2>
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground bg-muted/30 border-b border-border">
                    <th className="px-4 py-2 font-medium w-1/4">Section</th>
                    <th className="px-4 py-2 font-medium w-1/4">Field</th>
                    <th className="px-4 py-2 font-medium w-1/6">Suggested source</th>
                    <th className="px-4 py-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={`${r.section}-${r.field}`}
                      className="border-b border-border last:border-b-0 align-top"
                    >
                      <td className="px-4 py-2 text-foreground/80">{r.section}</td>
                      <td className="px-4 py-2 text-foreground font-medium">{r.field}</td>
                      <td className="px-4 py-2">
                        {r.suggestedSource ? (
                          <span
                            className={cn(
                              'inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide border',
                              SUGGESTED_COLOR[r.suggestedSource],
                            )}
                          >
                            {r.suggestedSource}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-foreground/85">{r.note ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      <footer className="text-xs text-muted-foreground mt-8 pt-4 border-t border-border">
        Generated from <code>src/data/orionFieldMap.ts</code> which mirrors the
        Stratos Orion data model spreadsheet. Update the Y/N column there to
        change what shows up in this report.
      </footer>
    </div>
  )
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'emerald' | 'amber'
}) {
  const accentClass =
    accent === 'emerald'
      ? 'text-emerald-700'
      : accent === 'amber'
      ? 'text-amber-700'
      : 'text-foreground'
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('text-2xl font-semibold tabular-nums mt-0.5', accentClass)}>
        {value}
      </div>
    </div>
  )
}
