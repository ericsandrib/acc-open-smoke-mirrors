import { useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Sparkles,
  CircleDot,
  Tag as TagIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  evaluateAccount,
  V2_GUARDRAILS,
  V2_HIGH_RISK_RULES,
  V2_UNIVERSAL_TRIGGERS,
} from '@/data/v2-rules'
import { V2_SAMPLE_ACCOUNTS } from '@/data/v2-sample-accounts'
import type {
  V2Rule,
  V2RulesEvaluation,
  V2ReviewActionType,
} from '@/types/workflow-v2'

/**
 * Live rules-engine explorer.
 *
 * Pick a sample account; the page shows every rule (7 guardrails + 11
 * high-risk + 3 universal) with a fire/no-fire indicator, the resulting
 * tag set, and whether the account would be blocked, bypass review, or
 * route to one or more review actions.
 *
 * Use case: walking Stratos through the model rule-by-rule against a
 * concrete account so they can confirm thresholds, mappings, and decide
 * the Open Questions.
 */

const ACTION_COLORS: Record<V2ReviewActionType, string> = {
  'suitability-review': 'bg-orange-100 text-orange-900 border-orange-300',
  'best-interest-review': 'bg-violet-100 text-violet-900 border-violet-300',
  'compliance-review': 'bg-rose-100 text-rose-900 border-rose-300',
  'documentation-review': 'bg-stone-100 text-stone-800 border-stone-300',
  'sim-document-review': 'bg-amber-100 text-amber-900 border-amber-300',
}

export function RulesExplorerPage() {
  return (
    <AppShell>
      <Body />
    </AppShell>
  )
}

function Body() {
  const [selectedId, setSelectedId] = useState<string>(V2_SAMPLE_ACCOUNTS[0].id)
  const selected = useMemo(
    () => V2_SAMPLE_ACCOUNTS.find((a) => a.id === selectedId) ?? V2_SAMPLE_ACCOUNTS[0],
    [selectedId],
  )
  const result = useMemo(() => evaluateAccount(selected.context), [selected])

  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="mb-5">
        <Link
          to="/workflow"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to V2 workflow
        </Link>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Rules engine explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Pick a sample account to see how the Stratos rule set evaluates
          it in real time. 21 rules total: 7 inline guardrails (block
          submit), 11 high-risk routing rules (produce review tags), 3
          universal triggers (always tag specific account types).
        </p>
      </header>

      {/* Account picker */}
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Sample accounts
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          {V2_SAMPLE_ACCOUNTS.map((a) => {
            const r = evaluateAccount(a.context)
            const status = r.cannotSubmit
              ? 'blocked'
              : r.bypassReview
              ? 'bypass'
              : 'review'
            return (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={cn(
                  'rounded-lg border px-3 py-3 text-left transition-all',
                  selectedId === a.id
                    ? 'border-foreground bg-muted/40 shadow-sm'
                    : 'border-border bg-white hover:bg-muted/30',
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <StatusDot status={status} />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {a.id}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground leading-tight">
                  {a.label}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug line-clamp-3">
                  {a.outcome}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Rule list */}
        <div className="space-y-3">
          <RuleSection
            title="Inline guardrails"
            subtitle="Fire at field entry / form submit. Block submission until corrected."
            rules={V2_GUARDRAILS}
            evaluation={result}
            context={selected.context}
          />
          <RuleSection
            title="High-risk routing rules"
            subtitle="Fire at form submit. Each firing rule produces a review-action tag."
            rules={V2_HIGH_RISK_RULES}
            evaluation={result}
            context={selected.context}
          />
          <RuleSection
            title="Universal review triggers"
            subtitle="Apply unconditionally to specific account types."
            rules={V2_UNIVERSAL_TRIGGERS}
            evaluation={result}
            context={selected.context}
          />
        </div>

        {/* Right rail — outcome summary */}
        <aside className="space-y-3">
          <OutcomePanel result={result} accountLabel={selected.label} />
          <ContextPanel ctx={selected.context} />
        </aside>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: 'blocked' | 'bypass' | 'review' }) {
  if (status === 'blocked')
    return <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
  if (status === 'bypass')
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
  return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
}

function RuleSection({
  title,
  subtitle,
  rules,
  evaluation,
  context,
}: {
  title: string
  subtitle: string
  rules: V2Rule[]
  evaluation: V2RulesEvaluation
  context: V2RulesEvaluation extends unknown ? import('@/types/workflow-v2').V2AccountContext : never
}) {
  return (
    <section className="rounded-xl border border-border bg-white">
      <header className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
      </header>
      <ul className="divide-y divide-border">
        {rules.map((rule) => {
          const fired = rule.evaluate(context)
          return <RuleRow key={rule.id} rule={rule} fired={fired} evaluation={evaluation} />
        })}
      </ul>
    </section>
  )
}

function RuleRow({
  rule,
  fired,
  evaluation: _evaluation,
}: {
  rule: V2Rule
  fired: boolean
  evaluation: V2RulesEvaluation
}) {
  void _evaluation
  return (
    <li className={cn('px-5 py-3', fired && 'bg-amber-50/40')}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          {fired ? (
            <div className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
              <AlertTriangle className="h-3 w-3" />
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full border border-muted-foreground/30 flex items-center justify-center">
              <CircleDot className="h-2.5 w-2.5 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-mono text-[10px] font-bold text-muted-foreground">
              {rule.id}
            </span>
            <span className="text-sm font-medium text-foreground">{rule.name}</span>
            <span
              className={cn(
                'inline-flex h-4 items-center rounded px-1.5 text-[9px] font-bold uppercase tracking-wide',
                rule.source === 'Stratos'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-sky-100 text-sky-800',
              )}
            >
              {rule.source}
            </span>
            {rule.openQuestionId && (
              <span className="inline-flex h-4 items-center rounded bg-amber-100 px-1.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
                {rule.openQuestionId}
              </span>
            )}
            {rule.action.kind === 'tag' && (
              <span
                className={cn(
                  'inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-semibold',
                  ACTION_COLORS[rule.action.tag],
                )}
              >
                <TagIcon className="h-2.5 w-2.5" />
                {rule.action.tag}
              </span>
            )}
            {rule.action.kind === 'block_submit' && (
              <span className="inline-flex h-5 items-center gap-1 rounded border border-rose-300 bg-rose-50 px-1.5 text-[10px] font-semibold text-rose-800">
                BLOCK
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/80">{rule.conditionLabel}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
            {rule.inputs.map((i) => (
              <span key={i} className="rounded bg-muted/60 px-1.5 py-0.5">
                {i}
              </span>
            ))}
          </div>
          {fired && rule.action.kind === 'block_submit' && (
            <p className="mt-2 text-xs text-rose-800 font-medium">
              ❗ {rule.action.errorMessage}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

function OutcomePanel({
  result,
  accountLabel,
}: {
  result: V2RulesEvaluation
  accountLabel: string
}) {
  const status: 'blocked' | 'bypass' | 'review' = result.cannotSubmit
    ? 'blocked'
    : result.bypassReview
    ? 'bypass'
    : 'review'

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Evaluation outcome
      </h3>
      <p className="text-[11px] text-muted-foreground mb-3">
        For {accountLabel}
      </p>

      {/* Big status pill */}
      <div
        className={cn(
          'rounded-lg border-2 px-3 py-2.5 mb-3',
          status === 'blocked' && 'border-rose-300 bg-rose-50',
          status === 'bypass' && 'border-emerald-300 bg-emerald-50',
          status === 'review' && 'border-amber-300 bg-amber-50',
        )}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <StatusDot status={status} />
          <span className="text-xs font-bold uppercase tracking-wide text-foreground">
            {status === 'blocked'
              ? 'Submit blocked'
              : status === 'bypass'
              ? 'Bypass review'
              : 'Route to review'}
          </span>
        </div>
        <p className="text-xs text-foreground/85 leading-snug">
          {status === 'blocked'
            ? `${result.blockingErrors.length} guardrail violation${
                result.blockingErrors.length === 1 ? '' : 's'
              }. Advisor must correct before workflow advances.`
            : status === 'bypass'
            ? 'No tags produced. Skip Lane 4 (Review); advance directly to Lane 5 (Sign & open) once L2 KYC clears.'
            : `${result.tags.length} review action${
                result.tags.length === 1 ? '' : 's'
              } required. All execute in parallel; consolidated NIGO if any reviewer rejects.`}
        </p>
      </div>

      {/* Blocking errors */}
      {result.blockingErrors.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-700 mb-1.5">
            Blocking guardrails
          </div>
          <ul className="space-y-1.5">
            {result.blockingErrors.map((e) => (
              <li
                key={e.ruleId}
                className="text-[11px] text-rose-900 bg-rose-50 border border-rose-200 rounded px-2 py-1.5"
              >
                <span className="font-mono font-bold mr-1">{e.ruleId}</span>
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tag set */}
      {result.tags.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Tag set ({result.tags.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {result.tags.map((t) => (
              <span
                key={t}
                className={cn(
                  'inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-semibold',
                  ACTION_COLORS[t],
                )}
              >
                <TagIcon className="h-2.5 w-2.5" />
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Firings (audit) */}
      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
          Audit trail ({result.firings.length} rule firings)
        </summary>
        <ul className="mt-2 space-y-1 text-[10px] font-mono">
          {result.firings.map((f) => (
            <li key={f.ruleId} className="text-foreground/80">
              {f.ruleId} → {f.tag ?? 'BLOCK'}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

function ContextPanel({
  ctx,
}: {
  ctx: import('@/types/workflow-v2').V2AccountContext
}) {
  const money = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        Account context
      </h3>
      <dl className="space-y-1 text-[11px]">
        <Row label="Primary client" value={ctx.primaryClientName} />
        <Row label="Age" value={String(ctx.age)} />
        <Row label="Employment" value={ctx.employmentStatus ?? '—'} />
        <Row label="Account type" value={ctx.accountType} />
        <Row label="Source of funds" value={ctx.sourceOfFunds} />
        <Row label="Investment objective" value={ctx.investmentObjective} />
        <Row label="Risk tolerance" value={ctx.riskTolerance} />
        <Row label="Net Worth" value={money(ctx.netWorth)} />
        <Row label="Liquid Net Worth" value={money(ctx.liquidNetWorth)} />
        <Row label="Account value" value={money(ctx.approximateAccountValue)} />
        <Row label="Advisor fee" value={`${ctx.advisorFee.toFixed(2)}%`} />
        <Row label="Margin" value={ctx.margin ? 'Yes' : 'No'} />
        <Row label="Options" value={ctx.options ? `Yes (${ctx.optionsActivityLevel ?? '?'})` : 'No'} />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium tabular-nums">{value}</dd>
    </div>
  )
}
