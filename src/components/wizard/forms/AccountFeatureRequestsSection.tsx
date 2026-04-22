import { useCallback, useEffect, useId, useMemo, type ReactNode } from 'react'
import { useWorkflow, useTaskData } from '@/stores/workflowStore'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AlternativeStrategyType, FeatureRequestsState } from '@/types/featureRequests'
import {
  createDefaultAlternativeStrategyElection,
  mergeFeatureRequests,
} from '@/types/featureRequests'
import {
  getAlternativeStrategyWarnings,
} from '@/utils/alternativeStrategyValidation'
import { cn } from '@/lib/utils'
import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { getAccountProductTypeForRegistration } from '@/utils/accountTypeFromRegistration'
import { getMarginEligibility } from '@/utils/marginEligibility'

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
}

const STRATEGY_OPTIONS: { value: AlternativeStrategyType; label: string }[] = [
  { value: 'private_equity', label: 'Private Equity' },
  { value: 'hedge_funds', label: 'Hedge Funds' },
  { value: 'private_credit', label: 'Private Credit' },
  { value: 'real_assets', label: 'Real Assets' },
  { value: 'structured_products', label: 'Structured Products' },
  { value: 'other', label: 'Other' },
]

const PRIMARY_OBJECTIVE_OPTIONS = [
  { value: 'diversification', label: 'Diversification' },
  { value: 'growth', label: 'Growth' },
  { value: 'income', label: 'Income' },
  { value: 'inflation_hedge', label: 'Inflation hedge' },
] as const

/** Margin & options + alternative strategy election on the account child root (embedded under Account & owners). */
export function AccountFeatureRequestsSection({ accountChildId }: { accountChildId: string }) {
  const { state, dispatch } = useWorkflow()
  const uid = useId()
  const ownersTaskId = `${accountChildId}-account-owners`
  const { data: ownersData } = useTaskData(ownersTaskId)

  const accountRoot = useMemo(
    () => ((state.taskData[accountChildId] as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>,
    [accountChildId, state.taskData],
  )
  const featureRequests = useMemo(() => mergeFeatureRequests(accountRoot.featureRequests), [accountRoot.featureRequests])
  const alt = featureRequests.alternativeStrategySelection

  const registrationType = accountRoot.registrationType as RegistrationType | undefined
  const productAccountTypeOverride = accountRoot.accountProductType as AccountType | null | undefined
  const resolvedProduct =
    productAccountTypeOverride ?? getAccountProductTypeForRegistration(registrationType ?? null)

  const marginEligibility = useMemo(
    () =>
      getMarginEligibility({
        registrationType: registrationType ?? null,
        productAccountType: resolvedProduct,
        isBankCustody: accountRoot.isBankCustody === true,
      }),
    [registrationType, resolvedProduct, accountRoot.isBankCustody],
  )

  const patchFeatureRequests = useCallback(
    (updater: (prev: FeatureRequestsState) => FeatureRequestsState) => {
      const prev = mergeFeatureRequests(accountRoot.featureRequests)
      const next = updater(prev)
      dispatch({
        type: 'SET_TASK_DATA',
        taskId: accountChildId,
        fields: { featureRequests: next },
      })
    },
    [accountChildId, accountRoot.featureRequests, dispatch],
  )

  useEffect(() => {
    if (marginEligibility.eligible) return
    const m = featureRequests.margin
    if (!m?.requested && !m?.marginDebtCoveredBySweep) return
    patchFeatureRequests((prev) => ({
      ...prev,
      margin: {
        ...prev.margin,
        requested: false,
        marginDebtCoveredBySweep: false,
        agreementAccepted: false,
        agreementSignedAt: undefined,
        agreementDocumentId: undefined,
      },
    }))
  }, [marginEligibility.eligible, featureRequests.margin, patchFeatureRequests])

  const altWarnings = useMemo(
    () =>
      getAlternativeStrategyWarnings(
        alt,
        ownersData.invLiquidityNeedsCode as string | undefined,
      ),
    [alt, ownersData.invLiquidityNeedsCode],
  )

  const strategyTypes = alt?.strategyTypes ?? []
  const hasOther = strategyTypes.includes('other')

  const toggleStrategyType = (value: AlternativeStrategyType) => {
    patchFeatureRequests((prev) => {
      const cur = mergeFeatureRequests(prev).alternativeStrategySelection!
      const set = new Set(cur.strategyTypes ?? [])
      if (set.has(value)) set.delete(value)
      else set.add(value)
      const nextTypes = Array.from(set) as AlternativeStrategyType[]
      return {
        ...prev,
        alternativeStrategySelection: {
          ...cur,
          strategyTypes: nextTypes,
          ...(!set.has('other') ? { otherStrategyText: '' } : {}),
        },
      }
    })
  }

  const setAlt = useCallback(
    (partial: Partial<NonNullable<FeatureRequestsState['alternativeStrategySelection']>>) => {
      patchFeatureRequests((prev) => {
        const cur = mergeFeatureRequests(prev).alternativeStrategySelection!
        return {
          ...prev,
          alternativeStrategySelection: { ...cur, ...partial },
        }
      })
    },
    [patchFeatureRequests],
  )

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Margin &amp; options</SectionTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Request margin and/or options on this account. Identity and suitability stay on the owners above.
        </p>
      </div>

      <section className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h4 className="text-sm font-medium">Margin</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Requests margin on the account. General financials and suitability remain on the owner profile. Maps to
              Pershing <span className="font-mono text-[11px]">marginAcctIndicator</span> (Y/N).
            </p>
            {!marginEligibility.eligible && marginEligibility.disabledReason ? (
              <p className="text-xs text-muted-foreground mt-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
                {marginEligibility.disabledReason}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 shrink-0 sm:pt-0.5">
            <Checkbox
              id={`${uid}-margin-requested`}
              disabled={!marginEligibility.eligible}
              checked={Boolean(marginEligibility.eligible && featureRequests.margin?.requested)}
              onCheckedChange={(v) =>
                patchFeatureRequests((prev) => ({
                  ...prev,
                  margin: {
                    ...prev.margin,
                    requested: v === true,
                    ...(v !== true
                      ? {
                          agreementAccepted: false,
                          agreementSignedAt: undefined,
                          agreementDocumentId: undefined,
                          marginDebtCoveredBySweep: false,
                        }
                      : {}),
                  },
                }))
              }
            />
            <Label
              htmlFor={`${uid}-margin-requested`}
              className={cn(
                'text-sm font-normal',
                marginEligibility.eligible ? 'cursor-pointer' : 'cursor-not-allowed text-muted-foreground',
              )}
            >
              Request margin
            </Label>
          </div>
        </div>

        {marginEligibility.eligible && featureRequests.margin?.requested ? (
          <div className="space-y-3 pt-1 border-t border-border">
            <div className="flex items-start gap-2">
              <Checkbox
                id={`${uid}-margin-sweep`}
                checked={Boolean(featureRequests.margin?.marginDebtCoveredBySweep)}
                onCheckedChange={(v) =>
                  patchFeatureRequests((prev) => ({
                    ...prev,
                    margin: {
                      ...prev.margin,
                      marginDebtCoveredBySweep: v === true,
                    },
                  }))
                }
              />
              <div>
                <Label htmlFor={`${uid}-margin-sweep`} className="text-sm font-normal cursor-pointer leading-snug">
                  Cover margin debt by sweep redemption
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optional. Indicates that margin debts are covered by a sweep redemption (
                  <span className="font-mono text-[11px]">marginDebtIndicator</span> on cash management).
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground rounded-md border border-border bg-muted/20 px-2.5 py-2">
              Margin request may still require manual approval depending on Pershing office processing rules.
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium">Options</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Options-specific fields live here; general suitability stays on the owner profile.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Checkbox
              id={`${uid}-options-requested`}
              checked={Boolean(featureRequests.options?.requested)}
              onCheckedChange={(v) =>
                patchFeatureRequests((prev) => ({
                  ...prev,
                  options: {
                    ...prev.options,
                    requested: v === true,
                    ...(v !== true
                      ? { agreementAccepted: false, agreementSignedAt: undefined, agreementDocumentId: undefined }
                      : {}),
                  },
                }))
              }
            />
            <Label htmlFor={`${uid}-options-requested`} className="text-sm font-normal cursor-pointer">
              Request options
            </Label>
          </div>
        </div>

        {featureRequests.options?.requested ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Requested options level</Label>
                <Select
                  value={String(featureRequests.options?.requestedLevel ?? 1)}
                  onValueChange={(v) =>
                    patchFeatureRequests((prev) => ({
                      ...prev,
                      options: { ...prev.options, requestedLevel: Number(v) },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Level {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Investor experience — products</Label>
                <Input
                  value={featureRequests.options?.investorExperienceProducts ?? ''}
                  onChange={(e) =>
                    patchFeatureRequests((prev) => ({
                      ...prev,
                      options: { ...prev.options, investorExperienceProducts: e.target.value },
                    }))
                  }
                  placeholder="e.g. equities, listed options, spreads"
                />
              </div>
              <div className="space-y-2">
                <Label>Years of experience</Label>
                <Input
                  value={featureRequests.options?.investorExperienceYears ?? ''}
                  onChange={(e) =>
                    patchFeatureRequests((prev) => ({
                      ...prev,
                      options: { ...prev.options, investorExperienceYears: e.target.value },
                    }))
                  }
                  placeholder="e.g. 5+"
                />
              </div>
              <div className="space-y-2">
                <Label>Knowledge level</Label>
                <Input
                  value={featureRequests.options?.knowledgeLevel ?? ''}
                  onChange={(e) =>
                    patchFeatureRequests((prev) => ({
                      ...prev,
                      options: { ...prev.options, knowledgeLevel: e.target.value },
                    }))
                  }
                  placeholder="e.g. moderate"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Requested strategies</Label>
                <Input
                  value={featureRequests.options?.requestedStrategies ?? ''}
                  onChange={(e) =>
                    patchFeatureRequests((prev) => ({
                      ...prev,
                      options: { ...prev.options, requestedStrategies: e.target.value },
                    }))
                  }
                  placeholder="e.g. covered calls, cash-secured puts"
                />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium">Alternative strategy selection</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optional strategy election. If selected, include the Alternative Strategy PDF in the client eSign envelope
              and complete disclosures before submit. Captured for internal suitability only (not sent to custody APIs).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Checkbox
              id={`${uid}-alt-strategy-requested`}
              checked={Boolean(alt?.requested)}
              onCheckedChange={(v) =>
                patchFeatureRequests((prev) => ({
                  ...prev,
                  alternativeStrategySelection:
                    v === true
                      ? {
                          ...createDefaultAlternativeStrategyElection(),
                          requested: true,
                          status: 'draft',
                        }
                      : createDefaultAlternativeStrategyElection(),
                }))
              }
            />
            <Label htmlFor={`${uid}-alt-strategy-requested`} className="text-sm font-normal cursor-pointer">
              Request alternative strategy
            </Label>
          </div>
        </div>

        {alt?.requested ? (
          <div className="space-y-8 pt-2 border-t border-border">
            {altWarnings.length > 0 ? (
              <div
                className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 px-3 py-2 text-xs text-amber-900 dark:text-amber-100 space-y-1"
                role="status"
              >
                <p className="font-medium">Suitability notes</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {altWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Strategy &amp; allocation</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {STRATEGY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted/40',
                      strategyTypes.includes(opt.value) && 'border-primary/50 bg-muted/30',
                    )}
                  >
                    <Checkbox
                      checked={strategyTypes.includes(opt.value)}
                      onCheckedChange={() => toggleStrategyType(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              {hasOther ? (
                <div className="space-y-2 max-w-xl">
                  <Label>Other strategy description</Label>
                  <Input
                    value={alt.otherStrategyText ?? ''}
                    onChange={(e) => setAlt({ otherStrategyText: e.target.value })}
                    placeholder="Describe the other strategy"
                  />
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                <div className="space-y-2">
                  <Label>Target allocation to alternatives (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="tabular-nums"
                    value={alt.targetAllocationPercent ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      setAlt({
                        targetAllocationPercent: raw === '' ? undefined : Number.parseFloat(raw),
                      })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum allocation allowed (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="tabular-nums"
                    value={alt.maxAllocationPercent ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      setAlt({
                        maxAllocationPercent: raw === '' ? undefined : Number.parseFloat(raw),
                      })
                    }}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Primary objective for alternatives</Label>
                  <Select
                    value={alt.primaryObjective ? String(alt.primaryObjective) : undefined}
                    onValueChange={(v) => setAlt({ primaryObjective: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIMARY_OBJECTIVE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alternative risk profile</p>
              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                <div className="space-y-2">
                  <Label>Illiquidity tolerance</Label>
                  <Select
                    value={alt.illiquidityTolerance ? String(alt.illiquidityTolerance) : undefined}
                    onValueChange={(v) => setAlt({ illiquidityTolerance: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lt_1y">&lt; 1 year</SelectItem>
                      <SelectItem value="y1_3">1–3 years</SelectItem>
                      <SelectItem value="y3_7">3–7 years</SelectItem>
                      <SelectItem value="gt_7y">7+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loss tolerance for alternatives</Label>
                  <Select
                    value={alt.lossTolerance ? String(alt.lossTolerance) : undefined}
                    onValueChange={(v) => setAlt({ lossTolerance: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="total_loss">Total loss acceptable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Complexity tolerance</Label>
                  <Select
                    value={alt.complexityTolerance ? String(alt.complexityTolerance) : undefined}
                    onValueChange={(v) => setAlt({ complexityTolerance: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Checkbox
                    id={`${uid}-valuation-tolerance`}
                    checked={Boolean(alt.valuationToleranceAccepted)}
                    onCheckedChange={(v) => setAlt({ valuationToleranceAccepted: v === true })}
                  />
                  <Label htmlFor={`${uid}-valuation-tolerance`} className="text-sm font-normal leading-snug cursor-pointer">
                    Accept infrequent or estimated valuations
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Alternative liquidity &amp; funding
              </p>
              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                <div className="space-y-2">
                  <Label>Emergency liquidity buffer (months)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    className="tabular-nums"
                    value={alt.emergencyLiquidityBufferMonths ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      setAlt({
                        emergencyLiquidityBufferMonths: raw === '' ? undefined : Number.parseInt(raw, 10),
                      })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Can meet capital calls</Label>
                  <Select
                    value={
                      alt.canMeetCapitalCalls === true
                        ? 'yes'
                        : alt.canMeetCapitalCalls === false
                          ? 'no'
                          : undefined
                    }
                    onValueChange={(v) => {
                      if (v === 'yes') {
                        setAlt({ canMeetCapitalCalls: true })
                      } else if (v === 'no') {
                        setAlt({ canMeetCapitalCalls: false, capitalCallCapacityAmount: null })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {alt.canMeetCapitalCalls === true ? (
                  <div className="space-y-2 sm:col-span-2 max-w-md">
                    <Label>Capital call capacity amount</Label>
                    <Input
                      type="number"
                      min={0}
                      className="tabular-nums"
                      value={alt.capitalCallCapacityAmount ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value
                        setAlt({
                          capitalCallCapacityAmount:
                            raw === '' ? null : Number.parseFloat(raw),
                        })
                      }}
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label>Percent of net worth in liquid assets</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="tabular-nums"
                    value={alt.liquidNetWorthPercent ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      setAlt({
                        liquidNetWorthPercent: raw === '' ? undefined : Number.parseFloat(raw),
                      })
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Alternative disclosures &amp; acknowledgments
              </p>
              <div className="space-y-3 max-w-xl">
                {(
                  [
                    ['illiquidityAccepted', 'I understand these investments may be illiquid.'],
                    ['lossAccepted', 'I understand I may lose part or all of the invested capital.'],
                    ['feeComplexityAccepted', 'I understand fees may include management fees, performance fees, or carried interest.'],
                    ['redemptionRestrictionsAccepted', 'I understand redemption may be restricted or subject to lock-up periods.'],
                  ] as const
                ).map(([key, text]) => (
                  <div key={key} className="flex items-start gap-2">
                    <Checkbox
                      id={`${uid}-disc-${key}`}
                      checked={Boolean(alt.disclosures?.[key])}
                      onCheckedChange={(v) =>
                        setAlt({
                          disclosures: {
                            ...createDefaultAlternativeStrategyElection().disclosures,
                            ...alt.disclosures,
                            [key]: v === true,
                          },
                        })
                      }
                    />
                    <Label htmlFor={`${uid}-disc-${key}`} className="text-sm font-normal leading-snug cursor-pointer">
                      {text}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                The Alternative Strategy Selection PDF is added to new eSign envelopes by default when this option is on.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
