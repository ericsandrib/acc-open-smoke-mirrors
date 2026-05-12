import { useMemo } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { AlertCircle } from 'lucide-react'
import {
  SchwabSection,
  SchwabFieldRow,
  SchwabTextField,
} from './schwabPrimitives'
import type { useSchwabFormState } from './useSchwabFormState'
import { sumRangeMidpoints } from '@/utils/netWorthRange'

type FormApi = ReturnType<typeof useSchwabFormState>

function parseCurrency(raw: unknown): number | null {
  if (raw == null) return null
  const s = String(raw).replace(/[^0-9.\-]/g, '')
  if (!s) return null
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : null
}

interface ValidationError {
  id: string
  message: string
}

interface AccountFinancialSectionProps {
  form: FormApi
  number?: string
  /** Override the section title. Defaults to "Account value and liquidity". */
  title?: string
  /** Optional helper copy under the title. */
  description?: string
}

/**
 * Captures the per-account Approximate Account Value and Client's Liquidity
 * Need, then cross-validates them against the selected owners' Liquid Net
 * Worth and Net Worth range buckets (parsed to numeric midpoints, summed
 * across owners). Errors render inline and are advisory only — they don't
 * block submission yet (final-step gating lands with the signing-ceremony
 * spec).
 */
export function AccountFinancialSection({
  form,
  number,
  title = 'Account value and liquidity',
  description = 'Validated against the selected account owners’ Liquid Net Worth and Net Worth ranges captured during owner setup.',
}: AccountFinancialSectionProps) {
  const { state } = useWorkflow()

  const ownerSummary = useMemo(() => {
    const owners = form.selectedOwnerPartyIds.map((id) => {
      const party = state.relatedParties.find((p) => p.id === id)
      return {
        id,
        name: party?.name?.trim() || party?.firstName || 'Owner',
        liquidRange: party?.accountOwnerIndividual?.liquidNetWorthRange,
        netRange: party?.accountOwnerIndividual?.netWorthRange,
      }
    })
    const liquid = sumRangeMidpoints(owners.map((o) => o.liquidRange))
    const net = sumRangeMidpoints(owners.map((o) => o.netRange))
    return { owners, liquid, net }
  }, [form.selectedOwnerPartyIds, state.relatedParties])

  const approxValue = parseCurrency(form.get('approximateAccountValue'))
  const liquidityNeed = parseCurrency(form.get('clientLiquidityNeed'))

  const liquidNetWorth = ownerSummary.liquid.parsedCount > 0 ? ownerSummary.liquid.total : null
  const netWorth = ownerSummary.net.parsedCount > 0 ? ownerSummary.net.total : null

  const errors = useMemo<ValidationError[]>(() => {
    const out: ValidationError[] = []
    if (approxValue !== null && liquidNetWorth !== null && approxValue > liquidNetWorth) {
      out.push({
        id: 'approx-vs-liquid',
        message: `Approximate Account Value ($${approxValue.toLocaleString()}) is greater than the combined Liquid Net Worth (~$${Math.round(liquidNetWorth).toLocaleString()}) of the selected account owners.`,
      })
    }
    if (approxValue !== null && netWorth !== null && approxValue > netWorth) {
      out.push({
        id: 'approx-vs-net',
        message: `Approximate Account Value ($${approxValue.toLocaleString()}) is greater than the combined Net Worth (~$${Math.round(netWorth).toLocaleString()}) of the selected account owners.`,
      })
    }
    if (liquidityNeed !== null && approxValue !== null && liquidityNeed > approxValue) {
      out.push({
        id: 'liquidity-vs-account',
        message: `Client's Liquidity Need ($${liquidityNeed.toLocaleString()}) is greater than the Account Value ($${approxValue.toLocaleString()}).`,
      })
    }
    return out
  }, [approxValue, liquidNetWorth, netWorth, liquidityNeed])

  const ownersMissingRanges = ownerSummary.owners.filter(
    (o) => !o.liquidRange || !o.netRange,
  )
  const hasNoOwnersPicked = ownerSummary.owners.length === 0

  return (
    <SchwabSection number={number} title={title} description={description}>
      <SchwabFieldRow cols={2}>
        <SchwabTextField
          label="Approximate Account Value ($)"
          type="number"
          value={form.get('approximateAccountValue')}
          onChange={(v) => form.set('approximateAccountValue', v)}
        />
        <SchwabTextField
          label="Client's Liquidity Need ($)"
          type="number"
          value={form.get('clientLiquidityNeed')}
          onChange={(v) => form.set('clientLiquidityNeed', v)}
          hint="Amount the client expects to withdraw or access from this account."
        />
      </SchwabFieldRow>

      {hasNoOwnersPicked ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
          <div>
            Select an account owner above so the Liquid Net Worth / Net Worth comparisons can run.
          </div>
        </div>
      ) : null}

      {!hasNoOwnersPicked && ownersMissingRanges.length > 0 ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
          <div>
            Missing a Net Worth Range or Liquid Net Worth Range on:{' '}
            <span className="font-medium">
              {ownersMissingRanges.map((o) => o.name).join(', ')}
            </span>
            . Open the owner above to fill it in so validation can run.
          </div>
        </div>
      ) : null}

      {!hasNoOwnersPicked && liquidNetWorth !== null ? (
        <p className="text-[11px] text-muted-foreground">
          Combined estimate from selected owners: Liquid Net Worth ~$
          {Math.round(liquidNetWorth).toLocaleString()}
          {netWorth !== null ? ` · Net Worth ~$${Math.round(netWorth).toLocaleString()}` : ''}
        </p>
      ) : null}

      {errors.map((err) => (
        <div
          key={err.id}
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
          <div>{err.message}</div>
        </div>
      ))}
    </SchwabSection>
  )
}
