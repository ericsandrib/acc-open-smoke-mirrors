import { useState } from 'react'
import type { OwnerKycReviewState } from '@/types/workflow'
import { snapshotsForVerificationHistory } from '@/utils/verificationHistory'
import { Button } from '@/components/ui/button'

const SCREENING_EVENT_LABEL = 'KYC screening run'
const INITIAL_VISIBLE = 3

function formatTimestamp(iso?: string): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function VerificationHistoryPanel({ owner }: { owner?: OwnerKycReviewState }) {
  const snapshots = snapshotsForVerificationHistory(owner?.verificationSnapshots)
  const [showAll, setShowAll] = useState(false)
  if (snapshots.length === 0) return null

  const ordered = [...snapshots].reverse()
  const visible = showAll ? ordered : ordered.slice(0, INITIAL_VISIBLE)
  const hiddenCount = ordered.length - INITIAL_VISIBLE

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Verification history
      </p>
      <ul className="text-xs text-muted-foreground space-y-1">
        {visible.map((s) => (
          <li key={s.id} className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5 space-y-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-foreground/80 tabular-nums">{formatTimestamp(s.ranAt) ?? '—'}</span>
              <span className="font-medium text-foreground">
                {s.runType === 'Re-run' ? 'KYC screening re-run' : SCREENING_EVENT_LABEL}
              </span>
              {s.runBy && <span>· by {s.runBy}</span>}
              {s.runType && <span>· {s.runType}</span>}
              {s.provider && <span>· {s.provider}</span>}
            </div>
            {(s.amlOutcome || s.cipOutcome) && (
              <div className="flex flex-wrap gap-x-3 text-[11px]">
                {s.amlOutcome && <span>AML: {s.amlOutcome}</span>}
                {s.cipOutcome && <span>CIP: {s.cipOutcome}</span>}
              </div>
            )}
            {s.reRunReason && <p className="text-[11px]">Reason: {s.reRunReason}</p>}
            {s.note && <p className="text-[11px]">Note: {s.note}</p>}
            {s.snapshotOf && (
              <p className="text-[11px] text-muted-foreground/80">
                Captured: {[s.snapshotOf.firstName, s.snapshotOf.lastName].filter(Boolean).join(' ')}
                {s.snapshotOf.dob ? ` · DOB ${s.snapshotOf.dob}` : ''}
                {s.snapshotOf.taxId ? ` · Tax …${s.snapshotOf.taxId.slice(-4)}` : ''}
                {s.snapshotOf.legalZip ? ` · ZIP ${s.snapshotOf.legalZip}` : ''}
              </p>
            )}
          </li>
        ))}
      </ul>
      {!showAll && hiddenCount > 0 && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs text-muted-foreground"
          onClick={() => setShowAll(true)}
        >
          View full history ({ordered.length} events)
        </Button>
      )}
      {showAll && ordered.length > INITIAL_VISIBLE && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs text-muted-foreground"
          onClick={() => setShowAll(false)}
        >
          Show less
        </Button>
      )}
    </div>
  )
}
