import { useCallback, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useWorkflow, getChildReviewState, getChildReviewDecision } from '@/stores/workflowStore'
import type { SimulateAdvisorIdentityPreset, TaskStatus } from '@/types/workflow'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { buildAdvisorIdentityGuidance } from '@/utils/advisorIdentityVerificationGuidance'
import { getAdvisorIdentitySimDisplay } from '@/utils/advisorIdentityVerificationSimDisplay'
import { isKycChildInAmlReview } from '@/utils/childStatusDisplay'

const isDev = import.meta.env.DEV

const SIMULATE_MENU: { preset: SimulateAdvisorIdentityPreset; label: string }[] = [
  { preset: 'address_mismatch', label: 'Address mismatch' },
  { preset: 'dob_mismatch', label: 'Date of birth mismatch' },
  { preset: 'name_mismatch', label: 'Name mismatch' },
  { preset: 'tin_mismatch', label: 'SSN/TIN mismatch' },
  { preset: 'unable_to_verify', label: 'Unable to verify identity' },
  { preset: 'verification_pending', label: 'Verification pending' },
  { preset: 'reset', label: 'Reset to passed' },
]

function formatLastChecked(iso: string | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const sectionCls = 'text-base font-semibold leading-snug text-foreground'
const sectionBodyCls = 'text-[14px] text-muted-foreground mt-2 leading-normal'

/** Advisor-facing CIP / identity check (no AML copy). */
export function IdentityVerificationSection({
  childId,
  childStatus,
}: {
  childId: string
  childStatus: TaskStatus
}) {
  const { state, dispatch } = useWorkflow()
  const isAdvisor = state.demoViewMode === 'advisor'
  const reviewState = getChildReviewState(state, childId)
  const decision = getChildReviewDecision(state, childId)
  const cip = reviewState?.cipStatus
  const sim = reviewState?.demoAdvisorIdentitySimulation
  const hoApproved = reviewState?.hoKycReview?.status === 'approved'
  const packageCompleteApproved = childStatus === 'complete' && decision?.outcome === 'approved'
  const packageUnavailable = hoApproved || packageCompleteApproved
  const inAmlReview = isKycChildInAmlReview(childStatus, reviewState)

  const hasAdvisorRun = Boolean(reviewState?.kycVerificationLastCheckedAt)
  const lastCheckedLabel = formatLastChecked(reviewState?.kycVerificationLastCheckedAt)

  const identityCard = useMemo(() => {
    const childMeta = (state.taskData[childId] as Record<string, unknown> | undefined) ?? {}
    const subjectIsEntity = childMeta.kycSubjectType === 'entity'

    if (sim) {
      const sd = getAdvisorIdentitySimDisplay(sim, subjectIsEntity)
      return {
        statusLabel: sd.statusLabel,
        issues: sd.issues,
        actions: sd.actions,
        showRemediation: sd.issues.length > 0,
        passSummary: sd.resultSummary,
        pendingBlurb: sd.pendingBlurb,
      }
    }

    const info = (state.taskData[`${childId}-info`] as Record<string, unknown> | undefined) ?? {}
    const g = buildAdvisorIdentityGuidance(cip, info, subjectIsEntity)
    const statusLabel =
      cip?.overallStatus === 'pass'
        ? ('Passed' as const)
        : cip?.overallStatus === 'fail'
          ? g.headlineStatus
          : ('Pending Verification' as const)
    const showRemediation = Boolean(cip?.overallStatus === 'fail' && g.issues.length > 0)
    const passSummary =
      cip?.overallStatus === 'pass'
        ? 'Identity successfully verified.'
        : reviewState?.kycVerificationResultSummary && cip?.overallStatus !== 'fail'
          ? reviewState.kycVerificationResultSummary
          : null

    return {
      statusLabel,
      issues: g.issues,
      actions: g.actions,
      showRemediation,
      passSummary,
      pendingBlurb: null as string | null,
    }
  }, [cip, childId, reviewState?.kycVerificationResultSummary, sim, state.taskData])

  const { statusLabel, issues, actions, showRemediation, passSummary, pendingBlurb } = identityCard

  const [phase, setPhase] = useState<'idle' | 'loading' | 'success'>('idle')

  const canRun =
    isAdvisor &&
    !packageUnavailable &&
    !inAmlReview &&
    phase === 'idle' &&
    childStatus !== 'canceled' &&
    childStatus !== 'blocked'

  const handleRun = useCallback(() => {
    if (!canRun) return
    setPhase('loading')
    window.setTimeout(() => {
      dispatch({ type: 'RUN_ADVISOR_KYC_VERIFICATION', childId })
      setPhase('success')
      window.setTimeout(() => setPhase('idle'), 2200)
    }, 850)
  }, [canRun, childId, dispatch])

  const hasRerunLabel =
    hasAdvisorRun ||
    cip?.overallStatus === 'pass' ||
    cip?.overallStatus === 'fail' ||
    cip?.overallStatus === 'pending'

  const primaryLabel =
    phase === 'loading'
      ? 'Running identity check…'
      : phase === 'success'
        ? 'Identity check complete'
        : hasRerunLabel
          ? 'Rerun identity check'
          : 'Run identity check'

  const buttonDisabled =
    !isAdvisor ||
    packageUnavailable ||
    inAmlReview ||
    phase === 'loading' ||
    phase === 'success' ||
    childStatus === 'canceled' ||
    childStatus === 'blocked'

  const showSimulateControl =
    isDev &&
    isAdvisor &&
    !packageUnavailable &&
    !inAmlReview &&
    childStatus !== 'canceled' &&
    childStatus !== 'blocked'

  const dispatchSim = useCallback(
    (preset: SimulateAdvisorIdentityPreset) => {
      dispatch({ type: 'SIMULATE_ADVISOR_IDENTITY_VERIFICATION', childId, preset })
    },
    [childId, dispatch],
  )

  return (
    <section className="space-y-3" id="identity-verification">
      <h4 className={sectionCls}>Identity Verification</h4>
      <p className={sectionBodyCls}>Verify the client&apos;s identity using the information above.</p>

      <div className="rounded-lg border border-border bg-muted/15 px-4 py-3 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium text-foreground mt-0.5">{statusLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last checked</p>
            <p className="font-medium text-foreground mt-0.5">{lastCheckedLabel ?? '—'}</p>
          </div>
        </div>

        {pendingBlurb ? <p className="text-sm text-muted-foreground leading-normal">{pendingBlurb}</p> : null}

        {passSummary && cip?.overallStatus === 'pass' ? (
          <div>
            <p className="text-sm text-muted-foreground">Result</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{passSummary}</p>
          </div>
        ) : null}

        {showRemediation ? (
          <div className="space-y-4 border-t border-border/70 pt-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Issues found</p>
              <ul className="list-disc pl-4 space-y-1 text-sm text-foreground">
                {issues.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Recommended actions
              </p>
              <ul className="list-disc pl-4 space-y-1 text-sm text-foreground">
                {actions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {isAdvisor ? (
          <div className="flex flex-col gap-2 pt-1 border-t border-border/70">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={cn(
                  'w-fit shrink-0',
                  phase === 'success' &&
                    'border-green-600/40 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100',
                )}
                disabled={buttonDisabled}
                onClick={handleRun}
              >
                {primaryLabel}
              </Button>
              {showSimulateControl ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2 text-muted-foreground font-normal hover:text-foreground hover:bg-muted/60"
                      aria-label="Simulate identity verification outcomes for demos"
                    >
                      Simulate verification issue
                      <ChevronDown className="size-3.5 opacity-70" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[14rem]">
                    {SIMULATE_MENU.map(({ preset, label }) => (
                      <DropdownMenuItem key={preset} className="text-muted-foreground" onSelect={() => dispatchSim(preset)}>
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
            {packageUnavailable ? (
              <p className="text-xs text-muted-foreground max-w-md">
                This profile has been approved. Identity verification cannot be rerun.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground border-t border-border/70 pt-3">
            Identity checks are run from the advisor view. Switch to <span className="font-medium">Advisor</span> to run
            or rerun a check.
          </p>
        )}
      </div>
    </section>
  )
}
