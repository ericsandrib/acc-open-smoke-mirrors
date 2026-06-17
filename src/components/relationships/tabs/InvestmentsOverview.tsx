import { TrendingUp, ChevronDown } from 'lucide-react'
import type { Relationship } from '@/data/relationshipsSeed'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Tiny SVG line chart — purely decorative for the demo.
function LineChartMock() {
  // Smooth-ish path for the "market value" line.
  const path =
    'M 0 60 C 30 55 60 45 90 50 S 150 35 180 38 S 240 30 270 22 S 330 18 360 14 L 380 12'
  return (
    <svg
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      className="h-48 w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rel-mkt-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[20, 40, 60, 80].map((y) => (
        <line
          key={y}
          x1="0"
          x2="400"
          y1={y}
          y2={y}
          stroke="hsl(var(--border))"
          strokeDasharray="2 4"
          strokeWidth="0.5"
        />
      ))}
      {/* fill under line */}
      <path d={`${path} L 380 100 L 0 100 Z`} fill="url(#rel-mkt-grad)" />
      {/* line */}
      <path d={path} fill="none" stroke="#7c3aed" strokeWidth="2" />
      {/* end dot */}
      <circle cx="380" cy="12" r="3" fill="#7c3aed" />
    </svg>
  )
}

interface AllocationSlice {
  label: string
  value: number
  color: string
}

const ALLOCATIONS: AllocationSlice[] = [
  { label: 'US Equity',    value: 41.3, color: '#7c3aed' },
  { label: 'Intl Equity',  value: 23.5, color: '#a78bfa' },
  { label: 'Fixed Income', value: 19.2, color: '#c4b5fd' },
  { label: 'Cash',         value: 10.0, color: '#ddd6fe' },
  { label: 'Alternatives', value:  6.0, color: '#ede9fe' },
]

function DonutChart({ slices, size = 180 }: { slices: AllocationSlice[]; size?: number }) {
  const r = size / 2 - 14
  const cx = size / 2
  const cy = size / 2
  const total = slices.reduce((s, x) => s + x.value, 0)
  // Pre-compute cumulative offsets so we don't mutate during render.
  const offsets: number[] = []
  slices.reduce((sum, x) => {
    offsets.push(sum)
    return sum + x.value
  }, 0)
  const segs = slices.map((s, i) => {
    const before = offsets[i] ?? 0
    const after = before + s.value
    const start = (before / total) * 2 * Math.PI - Math.PI / 2
    const end = (after / total) * 2 * Math.PI - Math.PI / 2
    const large = end - start > Math.PI ? 1 : 0
    const x1 = cx + r * Math.cos(start)
    const y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    return {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      color: s.color,
    }
  })
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-44 w-44 shrink-0">
      {segs.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} />
      ))}
      {/* hole */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
    </svg>
  )
}

interface PerformanceRow {
  period: string
  start: string
  end: string
  startBalance: number
  endBalance: number
  netContrib: number
  ror: number
}

function formatRor(n: number) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function PerformanceDetails({ endBalance }: { endBalance: number }) {
  // Scale values relative to the prototype's End Balance, using the
  // proportional ratios from the design reference.
  const e = endBalance
  const rows: PerformanceRow[] = [
    {
      period: 'Month-to-Date',
      start: '5/1/2026',
      end: '5/4/2026',
      startBalance: e * 1.0004,
      endBalance: e,
      netContrib: 0,
      ror: -0.04,
    },
    {
      period: 'Quarter-to-Date',
      start: '4/1/2026',
      end: '5/4/2026',
      startBalance: e * 1.0021,
      endBalance: e,
      netContrib: 0,
      ror: -0.21,
    },
    {
      period: 'Year-to-Date',
      start: '1/1/2026',
      end: '5/4/2026',
      startBalance: e * 1.0011,
      endBalance: e,
      netContrib: 0,
      ror: -0.11,
    },
    {
      period: '1yr Annualized',
      start: '5/5/2025',
      end: '5/4/2026',
      startBalance: e * 0.6285,
      endBalance: e,
      netContrib: e * 0.3458,
      ror: 3.41,
    },
    {
      period: '2yr Annualized',
      start: '5/5/2024',
      end: '5/4/2026',
      startBalance: e * 0.3261,
      endBalance: e,
      netContrib: e * 0.6459,
      ror: 2.04,
    },
  ]

  return (
    <div className="border-t border-border px-5 py-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Performance Details
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          All Accounts
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="px-3 py-2 font-medium">Period Start</th>
              <th className="px-3 py-2 font-medium">Period End</th>
              <th className="px-3 py-2 font-medium text-right">Start Balance</th>
              <th className="px-3 py-2 font-medium text-right">End Balance</th>
              <th className="px-3 py-2 font-medium text-right">Net Contributions</th>
              <th className="px-3 py-2 font-medium text-right">Rate of Return</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.period}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-3 py-3 font-medium text-foreground">
                  {row.period}
                </td>
                <td className="px-3 py-3 text-muted-foreground tabular-nums">
                  {row.start}
                </td>
                <td className="px-3 py-3 text-muted-foreground tabular-nums">
                  {row.end}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-foreground">
                  {formatMoney(row.startBalance)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-foreground">
                  {formatMoney(row.endBalance)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-foreground">
                  {formatMoney(row.netContrib)}
                </td>
                <td
                  className={`px-3 py-3 text-right tabular-nums font-medium ${
                    row.ror >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {formatRor(row.ror)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function InvestmentsOverview({ r }: { r: Relationship }) {
  const total = r.totalAum ?? r.aum ?? 0

  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Total Market Value
          </h2>
          <div className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
            {formatMoney(total + 0.3)}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-md">
          <TrendingUp className="h-3.5 w-3.5" />
          +2.4% YTD
        </div>
      </div>

      <div className="px-5 pb-3">
        <LineChartMock />
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span>Jan</span>
          <span>Mar</span>
          <span>May</span>
          <span>Jul</span>
          <span>Sep</span>
          <span>Nov</span>
        </div>
      </div>

      <div className="border-t border-border px-5 py-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Overall asset allocation
        </h3>
        <div className="flex items-center gap-6">
          <DonutChart slices={ALLOCATIONS} />
          <ul className="flex-1 grid grid-cols-1 gap-2 text-sm">
            {ALLOCATIONS.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2 text-foreground/90">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {s.value.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <PerformanceDetails endBalance={total} />
    </div>
  )
}
