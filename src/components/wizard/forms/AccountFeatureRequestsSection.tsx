import { useCallback, useId, useMemo, type ReactNode } from 'react'
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

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
}

/** Margin & options on the account child root — embedded under Account & owners (no duplicate identity/suitability). */
export function AccountFeatureRequestsSection({ accountChildId }: { accountChildId: string }) {
  const { state, dispatch } = useWorkflow()
  const uid = useId()

  const accountRoot = useMemo(
    () => ((state.taskData[accountChildId] as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>,
    [accountChildId, state.taskData],
  )
  const featureRequests = useMemo(() => mergeFeatureRequests(accountRoot.featureRequests), [accountRoot.featureRequests])

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

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Margin &amp; options</SectionTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Request margin and/or options on this account. Identity and suitability stay on the owners above.
        </p>
      </div>

      <section className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium">Margin</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Intent and agreement only—financials and suitability come from the account owner profile.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Checkbox
              id={`${uid}-margin-requested`}
              checked={Boolean(featureRequests.margin?.requested)}
              onCheckedChange={(v) =>
                patchFeatureRequests((prev) => ({
                  ...prev,
                  margin: {
                    ...prev.margin,
                    requested: v === true,
                    ...(v !== true
                      ? { agreementAccepted: false, agreementSignedAt: undefined, agreementDocumentId: undefined }
                      : {}),
                  },
                }))
              }
            />
            <Label htmlFor={`${uid}-margin-requested`} className="text-sm font-normal cursor-pointer">
              Request margin
            </Label>
          </div>
        </div>

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
    </div>
  )
}
