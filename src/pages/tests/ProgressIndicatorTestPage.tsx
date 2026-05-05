import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import {
  ProgressIcon,
  pickVariant,
  type ProgressIconVariant,
} from '@/components/wizard/ProgressIcons'
import type { TaskStatus } from '@/types/workflow'

const ALL_VARIANTS: ProgressIconVariant[] = [
  'to-start',
  'ambiguous',
  '25',
  '33',
  '50',
  '66',
  '75',
  'done',
  'canceled',
]

type Scenario = {
  label: string
  pct: number
  total: number
  edited: boolean
  status: TaskStatus
  /** What we expect pickVariant to return — used to flag regressions. */
  expected: ProgressIconVariant
}

const SCENARIOS: Scenario[] = [
  {
    label: 'Fresh, no fields, not edited',
    pct: 0,
    total: 5,
    edited: false,
    status: 'not_started',
    expected: 'to-start',
  },
  {
    label: 'Fresh, no fields, edited (touched but cleared)',
    pct: 0,
    total: 5,
    edited: true,
    status: 'in_progress',
    expected: '25',
  },
  {
    label: 'No measurable progress (total = 0)',
    pct: 0,
    total: 0,
    edited: false,
    status: 'not_started',
    expected: 'ambiguous',
  },
  {
    label: '20% filled (1 of 5)',
    pct: 0.2,
    total: 5,
    edited: true,
    status: 'in_progress',
    expected: '25',
  },
  {
    label: '33% filled (1 of 3)',
    pct: 1 / 3,
    total: 3,
    edited: true,
    status: 'in_progress',
    expected: '33',
  },
  {
    label: '50% filled (2 of 4)',
    pct: 0.5,
    total: 4,
    edited: true,
    status: 'in_progress',
    expected: '50',
  },
  {
    label: '66% filled (2 of 3)',
    pct: 2 / 3,
    total: 3,
    edited: true,
    status: 'in_progress',
    expected: '66',
  },
  {
    label: '80% filled (4 of 5)',
    pct: 0.8,
    total: 5,
    edited: true,
    status: 'in_progress',
    expected: '75',
  },
  {
    label: 'Fully complete',
    pct: 1,
    total: 5,
    edited: true,
    status: 'complete',
    expected: 'done',
  },
  {
    label: 'Canceled (overrides everything else)',
    pct: 0.5,
    total: 4,
    edited: true,
    status: 'canceled',
    expected: 'canceled',
  },
]

function formatPct(pct: number): string {
  return `${Math.round(pct * 100)}%`
}

export function ProgressIndicatorTestPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="space-y-2">
          <Link
            to="/tests"
            className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to tests
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Progress indicator
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Discrete pizza-tracker icons used in the wizard StepSidebar. Mapped
            from runtime task signals (
            <code className="text-[var(--text-primary)]">pct</code>,{' '}
            <code className="text-[var(--text-primary)]">total</code>,{' '}
            <code className="text-[var(--text-primary)]">edited</code>,{' '}
            <code className="text-[var(--text-primary)]">status</code>) onto the
            Figma component set (
            <code className="text-[var(--text-primary)]">
              Working File → Child Actions (Bianca)
            </code>
            , node <code className="text-[var(--text-primary)]">845:33961</code>
            ).
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-[var(--text-primary)]">
            All variants
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {ALL_VARIANTS.map((variant) => (
              <div
                key={variant}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-[var(--bg-secondary)]/40 px-3 py-4"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center">
                  <ProgressIcon variant={variant} className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {variant}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">
              pickVariant scenarios
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Pass = computed variant matches expectation
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-secondary)]/60 text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Scenario</th>
                  <th className="px-3 py-2 font-medium">pct</th>
                  <th className="px-3 py-2 font-medium">total</th>
                  <th className="px-3 py-2 font-medium">edited</th>
                  <th className="px-3 py-2 font-medium">status</th>
                  <th className="px-3 py-2 font-medium">Expected</th>
                  <th className="px-3 py-2 font-medium">Actual</th>
                  <th className="px-3 py-2 font-medium">Icon</th>
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map((s, i) => {
                  const actual = pickVariant({
                    pct: s.pct,
                    total: s.total,
                    edited: s.edited,
                    status: s.status,
                  })
                  const pass = actual === s.expected
                  return (
                    <tr
                      key={i}
                      className="border-t border-border bg-[var(--bg-primary)]/40"
                    >
                      <td className="px-3 py-2 text-[var(--text-primary)]">
                        {s.label}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)] tabular-nums">
                        {formatPct(s.pct)}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)] tabular-nums">
                        {s.total}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        {s.edited ? 'yes' : 'no'}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        {s.status}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">
                        {s.expected}
                      </td>
                      <td
                        className={
                          pass
                            ? 'px-3 py-2 font-mono text-xs text-[var(--text-success-primary,inherit)]'
                            : 'px-3 py-2 font-mono text-xs text-[var(--text-danger-primary,inherit)]'
                        }
                      >
                        {actual} {pass ? '✓' : '✗'}
                      </td>
                      <td className="px-3 py-2">
                        <ProgressIcon variant={actual} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-[var(--text-primary)]">
            Sidebar context preview
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Approximation of how the icon sits next to a task label in
            StepSidebar — useful for spotting alignment / vertical-rhythm
            issues.
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border bg-[var(--bg-secondary)]/40">
            {ALL_VARIANTS.map((variant) => (
              <li
                key={variant}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <span className="text-[var(--text-primary)]">
                  Sample task — {variant}
                </span>
                <ProgressIcon variant={variant} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}
