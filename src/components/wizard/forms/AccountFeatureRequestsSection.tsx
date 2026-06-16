import { useCallback, useEffect, useId, useMemo, type ReactNode } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
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
import type { FeatureRequestsState } from '@/types/featureRequests'
import { mergeFeatureRequests } from '@/types/featureRequests'
import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { getAccountProductTypeForRegistration } from '@/utils/accountTypeFromRegistration'
import { getMarginEligibility } from '@/utils/marginEligibility'

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
}

function SectionRequestToggle({
  id,
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-end shrink-0 sm:pt-0.5">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        aria-label={label}
      />
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
    </div>
  )
}

/** Margin and options elections on the account child root (embedded under Account & owners). */
export function AccountFeatureRequestsSection({
  accountChildId,
  hideSectionHeader = false,
}: {
  accountChildId: string
  hideSectionHeader?: boolean
}) {
  const { state, dispatch } = useWorkflow()
  const uid = useId()

  const accountRoot = useMemo(
    () => ((state.taskData[accountChildId] as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>,
    [accountChildId, state.taskData],
  )
  const featureRequests = useMemo(() => mergeFeatureRequests(accountRoot.featureRequests), [accountRoot.featureRequests])

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

  return (
    <div className="space-y-6">
      {!hideSectionHeader ? (
        <div>
          <SectionTitle>Investment Elections</SectionTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Request margin and options on this account. Identity and suitability stay on the owners above.
          </p>
        </div>
      ) : null}

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
          <SectionRequestToggle
            id={`${uid}-margin-requested`}
            label="Request margin"
            disabled={!marginEligibility.eligible}
            checked={Boolean(marginEligibility.eligible && featureRequests.margin?.requested)}
            onCheckedChange={(checked) =>
              patchFeatureRequests((prev) => ({
                ...prev,
                margin: {
                  ...prev.margin,
                  requested: checked,
                  ...(!checked
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
        </div>

        {marginEligibility.eligible && featureRequests.margin?.requested ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id={`${uid}-margin-sweep`}
                className="mt-1.5"
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium">Options</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Options-specific fields live here; general suitability stays on the owner profile.
            </p>
          </div>
          <SectionRequestToggle
            id={`${uid}-options-requested`}
            label="Request options"
            checked={Boolean(featureRequests.options?.requested)}
            onCheckedChange={(checked) =>
              patchFeatureRequests((prev) => ({
                ...prev,
                options: {
                  ...prev.options,
                  requested: checked,
                  ...(!checked
                    ? { agreementAccepted: false, agreementSignedAt: undefined, agreementDocumentId: undefined }
                    : {}),
                },
              }))
            }
          />
        </div>

        {featureRequests.options?.requested ? (
          <div className="space-y-4 pt-2">
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
    </div>
  )
}
