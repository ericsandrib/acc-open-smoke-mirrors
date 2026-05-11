import { useMemo, useState } from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Tag as TagIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkflow } from '@/stores/workflowStore'
import {
  evaluateAccount,
  V2_GUARDRAILS,
  V2_HIGH_RISK_RULES,
  V2_UNIVERSAL_TRIGGERS,
} from '@/data/v2-rules'
import type {
  V2AccountContext,
  V2ReviewActionType,
  V2RulesEvaluation,
} from '@/types/workflow-v2'

/**
 * V2 routing summary, rendered inline on the Open Accounts form.
 *
 * Reads the live wizard state, projects it into a V2AccountContext, runs
 * the Stratos rules engine, and shows:
 *   • Guardrails currently violated (block submit — must fix inline)
 *   • Routing tags that will be produced when the advisor submits
 *   • Lane-5 path: bypass review (no tags) vs route to L4 review
 *
 * The component is read-only; it does not gate submission directly.
 * Wiring the gate is a follow-up — for now, the summary is the
 * conversation piece during the live Stratos walkthrough.
 */

const ACTION_COLORS: Record<V2ReviewActionType, string> = {
  'suitability-review': 'bg-orange-100 text-orange-900 border-orange-300',
  'best-interest-review': 'bg-violet-100 text-violet-900 border-violet-300',
  'compliance-review': 'bg-rose-100 text-rose-900 border-rose-300',
  'documentation-review': 'bg-stone-100 text-stone-800 border-stone-300',
  'sim-document-review': 'bg-amber-100 text-amber-900 border-amber-300',
}

export function V2RoutingSummary() {
  const { state } = useWorkflow()
  const ctx = useMemo(() => deriveContext(state.taskData), [state.taskData])
  const result = useMemo(() => evaluateAccount(ctx), [ctx])
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="rounded-xl border-2 border-foreground/10 bg-gradient-to-br from-white to-muted/30 p-5 mb-6">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-4 items-center rounded bg-amber-100 px-1.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
              V2 routing
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              How this account will route at submit
            </h3>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-snug">
            The rules engine evaluates this account against 7 inline
            guardrails (block submit), 11 high-risk routing rules (produce
            tags), and 3 universal triggers (always tag specific account
            types). Update fields to see how routing changes.
          </p>
        </div>
        <OutcomePill result={result} />
      </header>

      {/* Blocking guardrails */}
      {result.blockingErrors.length > 0 && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertOctagon className="h-4 w-4 text-rose-700" />
            <span className="text-xs font-bold uppercase tracking-wide text-rose-800">
              {result.blockingErrors.length} guardrail{result.blockingErrors.length === 1 ? '' : 's'} would block submit
            </span>
          </div>
          <ul className="space-y-1">
            {result.blockingErrors.map((e) => (
              <li
                key={e.ruleId}
                className="text-xs text-rose-900 flex items-start gap-2"
              >
                <span className="font-mono font-bold shrink-0">{e.ruleId}</span>
                <span>{e.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Routing tags */}
      {result.tags.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
              Routes to {result.tags.length} review action{result.tags.length === 1 ? '' : 's'} (parallel)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.tags.map((t) => (
              <span
                key={t}
                className={cn(
                  'inline-flex h-5 items-center gap-1 rounded border px-2 text-[11px] font-semibold',
                  ACTION_COLORS[t],
                )}
              >
                <TagIcon className="h-2.5 w-2.5" />
                {t}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-amber-900 mt-2 leading-snug">
            Each tag becomes a parallel review action. Any reviewer NIGOing
            produces a consolidated single round-trip back to the advisor —
            not one per reviewer.
          </p>
        </div>
      )}

      {/* Bypass — no review needed */}
      {result.bypassReview && result.blockingErrors.length === 0 && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 mb-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">
              No rules fired — bypass Lane 4 review
            </span>
          </div>
          <p className="text-[11px] text-emerald-900 mt-1 leading-snug">
            Account proceeds directly to eSign once L2 KYC clears. No human
            review required.
          </p>
        </div>
      )}

      {/* Expandable rule trace */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        {expanded ? 'Hide' : 'Show'} all 21 rules and which fired
      </button>

      {expanded && <RuleTrace ctx={ctx} result={result} />}
    </section>
  )
}

function OutcomePill({ result }: { result: V2RulesEvaluation }) {
  const status: 'blocked' | 'bypass' | 'review' = result.cannotSubmit
    ? 'blocked'
    : result.bypassReview
    ? 'bypass'
    : 'review'
  const classes =
    status === 'blocked'
      ? 'border-rose-300 bg-rose-50 text-rose-800'
      : status === 'bypass'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
      : 'border-amber-300 bg-amber-50 text-amber-800'
  const Icon =
    status === 'blocked' ? AlertOctagon : status === 'bypass' ? CheckCircle2 : AlertTriangle
  const label =
    status === 'blocked'
      ? 'Submit blocked'
      : status === 'bypass'
      ? 'Bypass review'
      : `${result.tags.length} review action${result.tags.length === 1 ? '' : 's'}`
  return (
    <span
      className={cn(
        'shrink-0 inline-flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1 text-xs font-bold',
        classes,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function RuleTrace({
  ctx,
  result,
}: {
  ctx: V2AccountContext
  result: V2RulesEvaluation
}) {
  const sections = [
    { label: 'Inline guardrails', rules: V2_GUARDRAILS },
    { label: 'High-risk routing rules', rules: V2_HIGH_RISK_RULES },
    { label: 'Universal review triggers', rules: V2_UNIVERSAL_TRIGGERS },
  ]
  return (
    <div className="mt-3 rounded-lg border border-border bg-white p-3 space-y-3">
      {sections.map((sec) => (
        <div key={sec.label}>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            {sec.label}
          </div>
          <ul className="space-y-1">
            {sec.rules.map((rule) => {
              const fired = rule.evaluate(ctx)
              return (
                <li
                  key={rule.id}
                  className={cn(
                    'flex items-start gap-2 text-xs px-2 py-1 rounded',
                    fired && 'bg-amber-50',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold mt-0.5',
                      fired
                        ? 'bg-amber-500 text-white'
                        : 'border border-muted-foreground/30 text-muted-foreground/40',
                    )}
                  >
                    {fired ? '!' : '·'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {rule.id}
                      </span>
                      <span className="font-medium text-foreground">
                        {rule.name}
                      </span>
                      {rule.action.kind === 'tag' && (
                        <span
                          className={cn(
                            'inline-flex h-3.5 items-center rounded border px-1 text-[9px] font-semibold',
                            ACTION_COLORS[rule.action.tag],
                          )}
                        >
                          {rule.action.tag}
                        </span>
                      )}
                      {rule.action.kind === 'block_submit' && (
                        <span className="inline-flex h-3.5 items-center rounded border border-rose-300 bg-rose-50 px-1 text-[9px] font-bold text-rose-800">
                          BLOCK
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-foreground/70 mt-0.5">
                      {rule.conditionLabel}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
        {result.firings.length} rule firing{result.firings.length === 1 ? '' : 's'} total
      </div>
    </div>
  )
}

// ─── Wizard-state → V2 context projection ──────────────────────────────

/**
 * Project the existing wizard state into a V2AccountContext. The wizard
 * doesn't capture every V2 field today; we fill in reasonable defaults so
 * the rules engine produces a meaningful (if approximate) projection.
 *
 * This is intentionally lenient — the goal is to show Stratos how routing
 * works during a live walkthrough, not to lock down field validation. As
 * the wizard form picks up more V2 fields, this projection tightens.
 */
function deriveContext(
  taskData: Record<string, Record<string, unknown>>,
): V2AccountContext {
  // Pull from the Open Accounts task data + any account-opening child.
  const openAccountsData = (taskData['open-accounts'] ?? {}) as Record<string, unknown>

  // Try the first account-opening child's profile if available.
  const accountChildData = Object.entries(taskData).find(
    ([k]) => k.startsWith('ao-') || k.startsWith('account-opening-'),
  )?.[1] as Record<string, unknown> | undefined

  const merged = { ...openAccountsData, ...(accountChildData ?? {}) } as Record<string, unknown>

  const num = (k: string, fallback: number): number => {
    const v = merged[k]
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(/[$,%\s]/g, ''))
      if (!Number.isNaN(n)) return n
    }
    return fallback
  }
  const str = <T extends string>(k: string, fallback: T): T => {
    const v = merged[k]
    if (typeof v === 'string' && v) return v as T
    return fallback
  }
  const bool = (k: string): boolean => merged[k] === true || merged[k] === 'yes'

  return {
    primaryClientId: 'wizard',
    primaryClientName: 'Wizard account',
    age: num('clientAge', 55),
    employmentStatus: str(
      'employmentStatus',
      'Employed' as const,
    ),
    liquidNetWorth: num('liquidNetWorth', 500_000),
    netWorth: num('netWorth', 1_000_000),
    netIncome: num('netIncome', 200_000),
    riskTolerance: str(
      'riskTolerance',
      'Moderate' as 'Conservative' | 'Moderate' | 'Aggressive',
    ),
    investmentObjective: str(
      'investmentObjective',
      'Balanced' as 'Capital Preservation' | 'Income' | 'Balanced' | 'Growth' | 'Aggressive Growth',
    ),
    timeHorizon: str(
      'timeHorizon',
      'Long' as 'Short' | 'Intermediate' | 'Long',
    ),
    clientEmail: str('clientEmail', ''),
    liquidityNeed: num('liquidityNeed', 25_000),
    accountType: str(
      'accountType',
      'individual' as 'individual' | 'joint' | 'qualified-ira' | 'qualified-401k' | 'qualified-roth' | 'trust' | 'entity',
    ),
    approximateAccountValue: num('approximateAccountValue', 100_000),
    sourceOfFunds: str(
      'sourceOfFunds',
      'Transfer' as 'New money' | 'Rollover' | 'Transfer' | 'Inheritance' | 'Sale of property' | 'Other',
    ),
    advisorFee: num('advisorFee', 1.0),
    simFee: typeof merged['simFee'] === 'number' ? (merged['simFee'] as number) : undefined,
    margin: bool('margin'),
    options: bool('options'),
    optionsActivityLevel: (merged['optionsActivityLevel'] as 'low' | 'medium' | 'high' | undefined),
    advisorEmail: str('advisorEmail', 'greta.friedrichs@stratos.example'),
    advisorLicensedStates: ['AZ', 'CA', 'CO'],
    clientStateOfResidence: str('clientStateOfResidence', 'AZ'),
    bidAttached: bool('bidAttached'),
    adv2bAttached: bool('adv2bAttached') || true,  // default present
    clientAgreementCompleteness: {
      subAdvisor: true,
      advisorFee: true,
      simFee: true,
      transactionCharges: true,
      annualLiquidityNeeds: true,
      investmentTimeHorizon: true,
      investmentObjective: true,
      householdData: true,
      financialInformation: true,
      clientBackground: true,
    },
    entityAttributes: {
      isStratosEmployeeOba: bool('isStratosEmployeeOba'),
      obaVerificationOnFile: bool('obaVerificationOnFile'),
    },
  }
}
